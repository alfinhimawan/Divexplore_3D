"use strict";
const {
  sequelize,
  Order,
  OrderItem,
  Product,
  ProductInventory,
  AuditLog,
  Promo,
  PaymentLog,
} = require("../models");
const midtransClient = require("midtrans-client");

/**
 * Helper untuk menghitung jumlah malam
 */
const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 1;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};

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
const createOrder = async (userId, items, promoCode = null, userInfo = null, origin) => {
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
        include: ["addons", "vendor"],
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

      // 1. TAMBAHKAN PRODUK UTAMA KE DAFTAR ITEM PESANAN
      const hargaUtama = parseFloat(product.harga);
      
      // Hitung Pengali (Nights) jika Akomodasi
      const isAkomodasi = product.vendor && product.vendor.kategori && product.vendor.kategori.toLowerCase().includes('akomodasi');
      const nights = isAkomodasi ? calculateNights(item.check_in, item.check_out) : 1;

      const subtotalUtama = hargaUtama * item.qty * nights;
      totalNominal += subtotalUtama;

      orderItemsData.push({
        product_id: product.id,
        vendor_id: product.vendor_id,
        qty: item.qty,
        harga_satuan: hargaUtama,
        subtotal: subtotalUtama,
        metadata: {
          booking_date: item.booking_date || null,
          check_in: item.check_in || null,
          check_out: item.check_out || null
        },
      });

      // 2. PROSES ADD-ONS SEBAGAI ITEM TERPISAH (Agar Saldo Terbagi ke Vendor Aslinya)
      if (item.addon_ids && item.addon_ids.length > 0) {
        const { CrossSellingRule, ProductInventory: InventoryModel } = require("../models");
        
        const selectedRules = await CrossSellingRule.findAll({
          where: { id: item.addon_ids, primary_product_id: product.id },
          include: [{ association: "addonProduct" }],
          transaction,
        });

        for (const rule of selectedRules) {
          if (rule.addonProduct) {
            const addon = rule.addonProduct;
            const hargaAddon = parseFloat(addon.harga);
            
            // TENTUKAN DURASI ADDON: 
            // 1. Ambil dari 'addon_nights' yang dikirim FE (id_rule: nights)
            // 2. Jika tidak ada, fallback ke 'nights' produk utama (sinkronisasi lama)
            let addonStayNights = nights;
            if (item.addon_nights && item.addon_nights[rule.id]) {
              addonStayNights = parseInt(item.addon_nights[rule.id]);
            }
            
            const subtotalAddon = hargaAddon * item.qty * addonStayNights;
            totalNominal += subtotalAddon;

            // Masukkan add-on sebagai baris terpisah dengan VENDOR ID aslinya
            orderItemsData.push({
              product_id: addon.id,
              vendor_id: addon.vendor_id, 
              qty: item.qty,
              harga_satuan: hargaAddon,
              subtotal: subtotalAddon,
              metadata: {
                parent_product: product.nama_produk,
                booking_date: item.booking_date || null,
                check_in: item.check_in || null,
                check_out: item.check_out || null,
                nights: addonStayNights // Simpan durasi addon di metadata
              },
            });

            // 3. KURANGI STOK PRODUK ADD-ON
            const addonInventory = await InventoryModel.findOne({
              where: { product_id: addon.id },
              transaction,
              lock: transaction.LOCK.UPDATE,
            });

            if (addonInventory) {
              if (addonInventory.available_qty < item.qty) {
                throw new Error(`Stok tambahan "${addon.nama_produk}" tidak mencukupi.`);
              }
              addonInventory.available_qty -= item.qty;
              addonInventory.locked_qty += item.qty;
              await addonInventory.save({ transaction });
            }
          }
        }
      }
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

    // 7. Update nomor telepon user (Auto-Format & Auto-Sync)
    if (userInfo && userInfo.nomor_telepon) {
      let formattedPhone = userInfo.nomor_telepon.toString().trim();
      
      // LOGIKA AUTO-ZERO: Pastikan diawali dengan 0
      if (!formattedPhone.startsWith('0')) {
        // Jika diawali 62, ubah jadi 0
        if (formattedPhone.startsWith('62')) {
          formattedPhone = '0' + formattedPhone.substring(2);
        } else {
          // Jika diawali 8xx, tambahkan 0 di depan
          formattedPhone = '0' + formattedPhone;
        }
      }

      const { User } = require("../models");
      await User.update(
        { nomor_telepon: formattedPhone },
        { where: { id: userId }, transaction }
      );
    }

    // 6. Buat Record di tabel OrderItems secara Bulk
    const orderItemsWithOrderId = orderItemsData.map((oi) => ({
      ...oi,
      order_id: newOrder.id,
    }));
    await OrderItem.bulkCreate(orderItemsWithOrderId, { transaction });

    // 7. Catat Audit Log (WP-4.2.2)
    await AuditLog.create(
      {
        user_id: userId,
        tabel_terdampak: "Orders",
        data_lama: "[]",
        data_baru: JSON.stringify(orderItemsWithOrderId),
      },
      { transaction },
    );

    // 8. Tentukan ID Midtrans sejak awal agar sinkronisasi tidak balapan (Race Condition)
    const midtransOrderId = `${newOrder.id}-${Date.now()}`;
    await newOrder.update({ last_midtrans_id: midtransOrderId }, { transaction });

    // 9. Jika semua sukses, COMMIT transaksi secara permanen ke Database
    // Ini penting agar ID Midtrans sudah ada di DB sebelum FE mulai polling
    await transaction.commit();

    // 10. Generate Midtrans Snap Token
    let snapResponse = {};
    try {
      const parameter = {
        transaction_details: {
          order_id: midtransOrderId,
          gross_amount: Math.round(totalPembayaran),
        },
        credit_card: { secure: true },
        customer_details: {
          first_name: userInfo?.nama || "Wisatawan",
          phone: userInfo?.nomor_telepon || "",
          email: userInfo?.email || ""
        },
        expiry: {
          unit: "minutes",
          duration: 15
        },
      };

      // Hanya tambahkan callback jika origin terdeteksi (Cara paling bersih & efisien)
      if (origin) {
        parameter.callbacks = {
          finish: `${origin}/payment-status?status=pending`,
          error: `${origin}/payment-status?status=error`,
          pending: `${origin}/payment-status?status=pending`
        };
      }

      snapResponse = await snap.createTransaction(parameter);
    } catch (midtransErr) {
      const logger = require("../utils/logger");
      logger.error("Gagal generate Midtrans Token", {
        error: midtransErr.message,
      });
    }

    return {
      order: newOrder,
      payment_url: snapResponse.redirect_url,
      snap_token: snapResponse.token,
      midtrans_order_id: midtransOrderId
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
            attributes: ["nama_toko", "kategori"],
          },
        ],
      },
      {
        model: require("../models").PaymentLog,
        as: "paymentLogs",
        attributes: ["payment_type", "status_pembayaran"],
        order: [["createdAt", "DESC"]],
      },
      {
        model: require("../models").Review,
        as: "reviews",
        attributes: ["id"]
      }
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
      {
        model: require("../models").PaymentLog,
        as: "paymentLogs",
        limit: 1,
        order: [["createdAt", "DESC"]],
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

/**
 * Ambil Snap Token untuk Order yang sudah ada (untuk bayar ulang dari riwayat)
 */
const getSnapToken = async (orderId, userId, origin) => {
  const order = await Order.findOne({
    where: { id: orderId, user_id: userId },
    include: [{ association: "user", attributes: ["nama_lengkap", "email", "nomor_telepon"] }]
  });

  if (!order) {
    const err = new Error("Pesanan tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }

  if (order.status !== "pending") {
    throw new Error("Pesanan ini sudah dibayar atau dibatalkan.");
  }

  // Generate Midtrans Snap Token
  try {
    // JANGAN buat ID baru jika sudah ada ID Midtrans terakhir yang tersimpan di DB
    // Ini kunci agar Midtrans tidak memunculkan pop-up pilihan metode lagi jika sudah dipilih
    const midtransOrderId = order.last_midtrans_id || `${order.id}-${Date.now()}`;
    
    const parameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: Math.round(order.total_pembayaran),
      },
      credit_card: { secure: true },
      customer_details: {
        first_name: order.user?.nama_lengkap || "Wisatawan",
        email: order.user?.email || "",
        phone: order.user?.nomor_telepon || "",
      },
      };

      // Hanya tambahkan callback jika origin terdeteksi (Cara paling bersih & efisien)
      if (origin) {
        parameter.callbacks = {
          finish: `${origin}/payment-status?status=pending`,
          error: `${origin}/payment-status?status=error`,
          pending: `${origin}/payment-status?status=pending`
        };
      }

      const snapResponse = await snap.createTransaction(parameter);
    
    // Update ID Midtrans terakhir di DB
    await order.update({ last_midtrans_id: midtransOrderId });

    return { 
      snap_token: snapResponse.token,
      midtrans_order_id: midtransOrderId 
    };
  } catch (midtransErr) {
    throw new Error("Gagal menghubungi Midtrans: " + midtransErr.message);
  }
};

/**
 * Cek status pembayaran asli ke Midtrans (untuk sinkronisasi FE)
 */
const getPaymentStatus = async (orderId, userId) => {
  const order = await Order.findOne({ 
    where: { id: orderId, user_id: userId },
    include: [{ model: require("../models").PaymentLog, as: "paymentLogs", limit: 1, order: [['createdAt', 'DESC']] }]
  });
  
  if (!order) throw new Error("Pesanan tidak ditemukan.");

  try {
    const queryId = order.last_midtrans_id || order.id;
    console.log(`[PaymentStatus] Checking Midtrans for: ${queryId}`);
    
    const statusResponse = await snap.transaction.status(queryId);
    console.log(`[PaymentStatus] Midtrans Raw Response for ${queryId}:`, JSON.stringify(statusResponse, null, 2));
    
    // SINKRONISASI KRUSIAL: Simpan ke PaymentLog agar DB tidak kosong
    const { PaymentLog } = require("../models");
    if (statusResponse.transaction_status && statusResponse.transaction_status !== 'null') {
      let normalizedStatus = statusResponse.transaction_status;
      // SERAGAMKAN: Ubah 'cancel' dari Midtrans menjadi 'cancelled' agar konsisten dengan DB internal
      if (normalizedStatus === 'cancel') normalizedStatus = 'cancelled';
      
      const normalizedType = statusResponse.payment_type;

      // Cari log terakhir untuk order ini
      const [log, created] = await PaymentLog.findOrCreate({
        where: { 
          order_id: order.id,
          status_pembayaran: normalizedStatus
        },
        defaults: {
          external_id: queryId,
          status_pembayaran: normalizedStatus,
          payment_type: normalizedType,
          transaction_id_midtrans: statusResponse.transaction_id,
          raw_response: JSON.stringify(statusResponse)
        }
      });

      // Jika log sudah ada tapi status/tipe berubah, update!
      if (!created && (log.status_pembayaran !== statusResponse.transaction_status || log.payment_type !== normalizedType)) {
        await log.update({
          status_pembayaran: statusResponse.transaction_status,
          payment_type: normalizedType,
          transaction_id_midtrans: statusResponse.transaction_id,
          raw_response: JSON.stringify(statusResponse)
        });
      }
    }

    // 1. Update status di tabel Order berdasarkan hasil Midtrans (kecuali jika sudah cancel manual)
    let displayStatus = normalizedStatus; // Gunakan yang sudah dinormalisasi
    
    if (order.status === 'cancelled' && displayStatus === 'pending') {
      displayStatus = 'cancelled';
    } else if (displayStatus === 'settlement' || displayStatus === 'capture') {
      if (order.status !== 'paid') {
        await order.update({ status: 'paid' });
      }
      displayStatus = 'success';
    } else if (displayStatus === 'expire' || displayStatus === 'cancelled') {
      if (order.status !== 'expired' && order.status !== 'cancelled') {
        await order.update({ status: displayStatus === 'expire' ? 'expired' : 'cancelled' });
      }
    }
    
    // 2. Cek jika sudah melewati batas 15 menit secara internal
    const now = new Date();
    if (order.status === 'pending' && order.timeout_at && now > new Date(order.timeout_at)) {
      if (displayStatus === 'pending') {
        displayStatus = 'expire';
        await order.update({ status: 'expired' });
      }
    }

    return {
      ...statusResponse,
      transaction_status: displayStatus,
      order_id: order.id,
      gross_amount: order.total_pembayaran
    };
  } catch (err) {
    console.warn(`[PaymentStatus] Midtrans Error for ${order.id}: ${err.message}`);
    
    // Jika gagal ke Midtrans, coba ambil dari log internal kita
    let lastLogData = null;
    if (order.paymentLogs && order.paymentLogs.length > 0) {
      try {
        lastLogData = JSON.parse(order.paymentLogs[0].raw_response);
        console.log(`[PaymentStatus] Found Internal Log for ${order.id}`);
      } catch (e) {
        console.error(`[PaymentStatus] Failed to parse internal log for ${order.id}`);
      }
    }

    const fallbackData = {
      order_id: order.id,
      transaction_status: order.status,
      payment_type: lastLogData?.payment_type || null,
      va_numbers: lastLogData?.va_numbers || [],
      bill_key: lastLogData?.bill_key || null,
      biller_code: lastLogData?.biller_code || null,
      permata_va_number: lastLogData?.permata_va_number || null,
      gross_amount: order.total_pembayaran,
      is_fallback: true,
      error_debug: err.message // Kirim pesan error asli ke FE untuk debug
    };
    
    console.log(`[PaymentStatus] Returning Fallback Data for ${order.id}:`, JSON.stringify(fallbackData, null, 2));
    return fallbackData;
  }
};

/**
 * Batalkan Pesanan (Kembalikan Stok)
 */
const cancelOrder = async (orderId, userId) => {
  const order = await Order.findOne({ 
    where: { id: orderId, user_id: userId },
    include: [{ model: OrderItem, as: "items" }]
  });

  if (!order) throw new Error("Pesanan tidak ditemukan.");
  if (order.status !== 'pending') throw new Error("Hanya pesanan pending yang bisa dibatalkan.");

  const transaction = await sequelize.transaction();
  try {
    // 1. Beritahu Midtrans untuk membatalkan transaksi (Agar tidak bisa dibayar lagi)
    try {
      const midtransQueryId = order.last_midtrans_id || order.id;
      await snap.transaction.cancel(midtransQueryId);
      console.log(`[CancelOrder] Midtrans transaction ${midtransQueryId} cancelled.`);
    } catch (midtransErr) {
      // Jika gagal di Midtrans (misal sudah expired duluan), abaikan saja dan lanjut proses internal
      console.warn(`[CancelOrder] Midtrans cancel failed/ignored: ${midtransErr.message}`);
    }

    // 2. Update status jadi cancelled di Database Utama
    await order.update({ status: 'cancelled' }, { transaction });

    // 3. Ambil data terakhir agar log pembatalan lengkap (Anti-NULL)
    const lastLog = await PaymentLog.findOne({
      where: { order_id: order.id },
      order: [['createdAt', 'DESC']]
    });
    
    // 4. Catat di PaymentLogs agar riwayatnya Jelas & Tidak NULL
    await PaymentLog.create({
      order_id: order.id,
      external_id: order.last_midtrans_id,
      status_pembayaran: 'cancelled',
      payment_type: lastLog ? lastLog.payment_type : null,
      transaction_id_midtrans: lastLog ? lastLog.transaction_id_midtrans : null, // Ambil dari log sebelumnya
      raw_response: JSON.stringify({ 
        message: "Cancelled by user via Frontend", 
        previous_status: lastLog ? lastLog.status_pembayaran : 'unknown',
        timestamp: new Date() 
      })
    }, { transaction });

    // 4. Kembalikan stok (Inventory management)
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.product_id) {
          const inventory = await ProductInventory.findOne({
            where: { product_id: item.product_id },
            transaction,
            lock: transaction.LOCK.UPDATE
          });

          if (inventory) {
            // Kembalikan ke available dan kurangi dari locked
            inventory.available_qty += item.qty;
            inventory.locked_qty = Math.max(0, inventory.locked_qty - item.qty);
            await inventory.save({ transaction });
          }
        }
      }
    }

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  createOrder,
  getWisatawanOrders,
  getOrderById,
  getVendorOrders,
  getAdminOrders,
  getSnapToken,
  getPaymentStatus,
  cancelOrder,
};
