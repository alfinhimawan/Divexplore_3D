"use strict";
const {
  sequelize,
  Order,
  OrderItem,
  Product,
  ProductInventory,
  AuditLog,
  Promo,
} = require("../models");
const midtransClient = require("midtrans-client");

// Konfigurasi Midtrans (Memaksa Sandbox mode untuk keperluan presentasi)
const snap = new midtransClient.Snap({
  isProduction: false, // <-- DIUBAH PAKSA KE FALSE AGAR KUNCI SIMULASI BISA BERJALAN
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

/**
 * Membuat Pesanan Baru (Checkout / Booking Engine)
 * Menggunakan Database Transaction untuk mencegah Race Condition.
 *
 * @param {string} userId - ID Wisatawan
 * @param {Array} items - Array of { product_id, qty }
 */
const createOrder = async (userId, items, promoCode = null) => {
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
      const product = await Product.findByPk(item.product_id, {
        include: ["addons"],
        transaction,
      });
      if (!product || !product.is_active) {
        throw new Error(`Produk ${item.product_id} tidak ditemukan/aktif.`);
      }

      // Validasi & Update Inventaris
      const inventory = await ProductInventory.findOne({
        where: { product_id: product.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!inventory || inventory.available_qty < item.qty) {
        throw new Error(`Stok ${product.nama_produk} tidak mencukupi.`);
      }

      inventory.available_qty -= item.qty;
      inventory.locked_qty += item.qty;
      await inventory.save({ transaction });

      // HITUNG HARGA PRODUK + ADD-ONS (Bundling UMKM)
      let hargaFinalItem = parseFloat(product.harga);
      if (item.addon_ids && item.addon_ids.length > 0) {
        const { ProductAddon } = require("../models");
        const selectedAddons = await ProductAddon.findAll({
          where: { id: item.addon_ids, product_id: product.id },
          transaction,
        });
        selectedAddons.forEach((addon) => {
          hargaFinalItem += parseFloat(addon.harga);
        });
      }

      const subtotal = hargaFinalItem * item.qty;
      totalNominal += subtotal;

      orderItemsData.push({
        product_id: product.id,
        vendor_id: product.vendor_id,
        qty: item.qty,
        harga_satuan: hargaFinalItem,
        subtotal: subtotal,
        metadata: item.addon_ids ? JSON.stringify(item.addon_ids) : null,
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
          gross_amount: Math.round(totalPembayaran),
        },
        credit_card: { secure: true },
        customer_details: {
          first_name: "Wisatawan",
        },
      };
      snapResponse = await snap.createTransaction(parameter);
    } catch (midtransErr) {
      // Gunakan logger agar error tercatat di file log (bukan hanya console)
      const logger = require("../utils/logger");
      logger.error("Gagal generate Midtrans Token", {
        error: midtransErr.message,
      });
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
          {
            model: require("../models").Vendor,
            as: "vendor",
            attributes: ["nama_toko"],
          },
        ],
      },
      {
        model: require("../models").PaymentLog,
        as: "paymentLogs",
        attributes: ["payment_type"],
        limit: 1,
        order: [["createdAt", "DESC"]],
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
