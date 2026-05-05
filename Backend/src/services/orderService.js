"use strict";
const {
  sequelize,
  Order,
  OrderItem,
  Product,
  ProductInventory,
  AuditLog,
  Promo,
  LoyaltyPoint,
} = require("../models");
const midtransClient = require("midtrans-client");

// Konfigurasi Midtrans Sandbox
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-DUMMY",
});

/**
 * Membuat Pesanan Baru (Checkout / Booking Engine)
 * Menggunakan Database Transaction untuk mencegah Race Condition.
 *
 * @param {string} userId - ID Wisatawan
 * @param {Array} items - Array of { product_id, qty }
 * @param {string} promoCode - Kode promo (opsional)
 * @param {boolean} usePoints - Gunakan poin loyalitas (opsional)
 */
const createOrder = async (userId, items, promoCode = null, usePoints = false) => {
  // Mulai Transaksi Database
  const transaction = await sequelize.transaction();

  try {
    // 1. Cek Promo (WP-7.1.1)
    let appliedPromo = null;
    if (promoCode) {
      appliedPromo = await Promo.findOne({
        where: { kode_promo: promoCode },
        transaction,
      });
      if (!appliedPromo) throw new Error("Kode promo tidak valid.");
      if (
        appliedPromo.valid_until &&
        new Date(appliedPromo.valid_until) < new Date()
      ) {
        throw new Error("Kode promo sudah kedaluwarsa.");
      }
    }

    let totalNominal = 0;
    const orderItemsData = [];

    // 1. Loop semua item yang mau dibeli
    for (const item of items) {
      // Ambil detail produk (untuk dapat harga dan vendor_id)
      const product = await Product.findByPk(item.product_id, { transaction });
      if (!product || !product.is_active) {
        throw new Error(
          `Produk dengan ID ${item.product_id} tidak ditemukan atau tidak aktif.`,
        );
      }

      // Ambil inventaris produk tersebut (Pilih yang stoknya mencukupi)
      // Dalam implementasi nyata, tanggal_ketersediaan harus jadi parameter.
      // Di sini kita ambil inventaris pertama yang cukup stoknya.
      const inventory = await ProductInventory.findOne({
        where: { product_id: product.id },
        transaction,
        // Gunakan lock: true (SELECT ... FOR UPDATE) agar request lain mengantri
        // sampai transaksi ini selesai (Mencegah Race Condition murni).
        lock: transaction.LOCK.UPDATE,
      });

      if (!inventory) {
        throw new Error(
          `Inventaris untuk produk ${product.nama_produk} belum diatur.`,
        );
      }

      if (inventory.available_qty < item.qty) {
        throw new Error(
          `Stok produk ${product.nama_produk} tidak mencukupi. Tersedia: ${inventory.available_qty}`,
        );
      }

      // 2. Real-Time Inventory Locking: Kurangi available, tambah locked
      inventory.available_qty -= item.qty;
      inventory.locked_qty += item.qty;
      await inventory.save({ transaction });

      // 3. Hitung subtotal
      const subtotal = product.harga * item.qty;
      totalNominal += subtotal;

      // 4. Siapkan data untuk OrderItem
      orderItemsData.push({
        product_id: product.id,
        vendor_id: product.vendor_id,
        qty: item.qty,
        harga_satuan: product.harga,
        subtotal: subtotal,
      });
    }

    // 4.5 Kalkulasi Diskon Promo (WP-7.1.1)
    let totalPembayaran = totalNominal;
    if (appliedPromo) {
      const nominalDiskon = (appliedPromo.diskon_persen / 100) * totalNominal;
      const diskonFinal =
        appliedPromo.max_potongan && nominalDiskon > appliedPromo.max_potongan
          ? appliedPromo.max_potongan
          : nominalDiskon;
      totalPembayaran -= diskonFinal;
      if (totalPembayaran < 0) totalPembayaran = 0;
    }

    // 4.6 Kalkulasi Potongan Poin Loyalitas (WP-7.1.1)
    let pointsUsed = 0;
    if (usePoints && totalPembayaran > 0) {
      const allPoints = await LoyaltyPoint.findAll({
        where: { user_id: userId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const totalPointsEarned = allPoints.reduce((acc, p) => acc + (parseInt(p.points_earned) || 0), 0);
      const totalPointsUsed = allPoints.reduce((acc, p) => acc + (parseInt(p.points_used) || 0), 0);
      const balance = totalPointsEarned - totalPointsUsed;

      if (balance > 0) {
        // Konversi: 1 poin = Rp 1.000
        const pointValue = balance * 1000;
        
        if (pointValue >= totalPembayaran) {
          // Poin menutupi seluruh pembayaran
          pointsUsed = Math.ceil(totalPembayaran / 1000);
          totalPembayaran = 0;
        } else {
          // Poin hanya memotong sebagian
          pointsUsed = balance;
          totalPembayaran -= pointValue;
        }

        // Catat penggunaan poin
        if (pointsUsed > 0) {
          await LoyaltyPoint.create({
            user_id: userId,
            points_earned: 0,
            points_used: pointsUsed,
            // order_id akan diisi setelah newOrder dibuat
          }, { transaction });
        }
      }
    }

    // 5. Buat Record di tabel Orders
    // timeout_at di-set 15 menit dari sekarang
    const timeoutAt = new Date();
    timeoutAt.setMinutes(timeoutAt.getMinutes() + 15);

    const newOrder = await Order.create(
      {
        user_id: userId,
        total_pembayaran: totalPembayaran,
        status: "pending",
        timeout_at: timeoutAt,
        promo_id: appliedPromo ? appliedPromo.id : null,
      },
      { transaction },
    );

    // Update LoyaltyPoint record dengan order_id jika tadi ada penggunaan poin
    if (pointsUsed > 0) {
      await LoyaltyPoint.update(
        { order_id: newOrder.id },
        { 
          where: { user_id: userId, points_used: pointsUsed, order_id: null }, 
          transaction 
        }
      );
    }

    // 6. Buat Record di tabel OrderItems secara Bulk
    const orderItemsWithOrderId = orderItemsData.map((oi) => ({
      ...oi,
      order_id: newOrder.id,
    }));
    await OrderItem.bulkCreate(orderItemsWithOrderId, { transaction });

    // 7. Catat Audit Log (WP-4.2.2)
    // Merekam snapshot keranjang sebelum dan sesudah
    // agar kita punya bukti tak terbantahkan jika ada manipulasi harga.
    await AuditLog.create(
      {
        user_id: userId,
        tabel_terdampak: "Orders",
        data_lama: "[]",
        data_baru: JSON.stringify(orderItemsWithOrderId),
      },
      { transaction },
    );

    // Jika semua sukses, COMMIT transaksi secara permanen ke Database
    await transaction.commit();

    // 8. Generate Midtrans Snap Token (WP-3.2.2)
    // Diluar transaksi DB agar jika Midtrans error, DB tetap aman pending
    let snapResponse = {};
    try {
      const parameter = {
        transaction_details: {
          order_id: newOrder.id,
          gross_amount: Math.round(totalPembayaran), // Midtrans butuh integer
        },
        credit_card: { secure: true },
        customer_details: {
          first_name: "Wisatawan", // Nanti bisa diisi nama user dari DB jika diperlukan
        },
      };
      snapResponse = await snap.createTransaction(parameter);
    } catch (midtransErr) {
      console.error("Gagal generate Midtrans Token:", midtransErr);
      // Lanjutkan saja, biarkan Frontend menangani ketiadaan token
    }

    return {
      order: newOrder,
      payment_url: snapResponse.redirect_url,
      snap_token: snapResponse.token,
    };
  } catch (error) {
    // Jika ada 1 saja yang error (misal stok habis), BATALKAN semua (ROLLBACK)
    await transaction.rollback();

    // Ubah pesan error agar mudah ditangkap controller
    const err = new Error(error.message);
    err.statusCode = 400; // Bad Request
    throw err;
  }
};

/**
 * Ambil riwayat pesanan (Khusus untuk Wisatawan)
 */
const getWisatawanOrders = async (userId) => {
  const orders = await Order.findAll({
    where: { user_id: userId },
    include: [
      {
        model: OrderItem,
        as: "items",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["nama_produk", "thumbnail_url"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
  return orders;
};

/**
 * Ambil detail pesanan spesifik (untuk Invoice)
 */
const getOrderById = async (orderId, userId = null) => {
  const whereCondition = { id: orderId };
  if (userId) {
    whereCondition.user_id = userId;
  }

  const order = await Order.findOne({
    where: whereCondition,
    include: [
      {
        model: OrderItem,
        as: "items",
        include: [
          { model: Product, as: "product", attributes: ["nama_produk"] },
        ],
      },
    ],
  });

  if (!order) {
    const err = new Error(
      "Pesanan tidak ditemukan atau Anda tidak berhak mengaksesnya.",
    );
    err.statusCode = 404;
    throw err;
  }
  return order;
};

/**
 * Ambil riwayat pesanan (Khusus untuk Vendor)
 */
const getVendorOrders = async (vendorId) => {
  const orders = await Order.findAll({
    include: [
      {
        model: OrderItem,
        as: "items",
        where: { vendor_id: vendorId },
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["nama_produk", "thumbnail_url"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
  return orders;
};

/**
 * Ambil semua riwayat pesanan platform (Khusus Admin)
 */
const getAdminOrders = async () => {
  const orders = await Order.findAll({
    include: [
      {
        model: OrderItem,
        as: "items",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["nama_produk"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
  return orders;
};

module.exports = {
  createOrder,
  getWisatawanOrders,
  getOrderById,
  getVendorOrders,
  getAdminOrders,
};
