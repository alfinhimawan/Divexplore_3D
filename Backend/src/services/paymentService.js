"use strict";
const {
  sequelize,
  Order,
  OrderItem,
  Product,
  Vendor,
  ProductInventory,
  PaymentLog,
  VirtualLedger,
  LoyaltyPoint,
  User,
} = require("../models");

const crypto = require("crypto");
const { getKomisiPersen } = require("../config/komisi");
const logger = require("../utils/logger");

/**
 * Menghitung biaya Midtrans berdasarkan metode pembayaran.
 * Referensi: https://midtrans.com/id/pricing
 * @param {string} paymentType - Tipe pembayaran dari webhook Midtrans
 * @param {number} grossAmount - Total pembayaran
 * @returns {number} Biaya dalam Rupiah (dibulatkan)
 */
const hitungBiayaMidtrans = (paymentType = "", grossAmount = 0) => {
  const type = paymentType.toLowerCase();
  if (type === "qris" || type === "gopay" || type === "shopeepay" || type === "dana" || type === "ovo") {
    return Math.round(grossAmount * 0.007); // 0.7% MDR e-wallet & QRIS
  }
  if (type === "credit_card") {
    return Math.round(grossAmount * 0.02) + 2000; // 2% + Rp2.000
  }
  // Bank Transfer / VA (BCA, Mandiri, BNI, BRI, Permata, dll)
  return 4440;
};


/**
 * Handle Webhook dari Midtrans
 * Menerima payload (notifikasi) JSON dari Midtrans.
 */
const handleMidtransWebhook = async (payload) => {
  // LOGGING DETAIL (Sangat penting untuk debug di Jagoan Hosting)
  logger.info("=== WEBHOOK MIDTRANS MASUK ===");
  logger.info(`Payload: ${JSON.stringify(payload)}`);

  const {
    order_id,
    transaction_status,
    transaction_id,
    payment_type,
    status_code,
    gross_amount,
    signature_key,
  } = payload;

  // PENTING: Validasi Signature Key (Security Compliance)
  if (!signature_key) {
    logger.info("Webhook Test Received (No Signature) — skipping");
    return { message: "Test success" };
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  
  // Midtrans sering mengirim gross_amount dengan .00 (string). 
  // Kita harus memastikan formatnya sama dengan saat pembuatan transaksi.
  // Cara paling aman: Pakai string gross_amount apa adanya dari payload jika sudah sesuai,
  // atau bulatkan jika memang kita mengirimkan angka bulat.
  const rawAmount = gross_amount; 
  const roundedAmount = Math.round(parseFloat(gross_amount)).toString();

  // Coba validasi dengan format asli dari Midtrans
  const hashRaw = crypto
    .createHash("sha512")
    .update(`${order_id}${status_code}${rawAmount}${serverKey}`)
    .digest("hex");
    
  // Coba juga dengan format bulat (fallback)
  const hashRounded = crypto
    .createHash("sha512")
    .update(`${order_id}${status_code}${roundedAmount}${serverKey}`)
    .digest("hex");

  logger.info(`[Webhook] DEBUG SIGNATURE — order_id: ${order_id}, status_code: ${status_code}, rawAmount: ${rawAmount}, roundedAmount: ${roundedAmount}`);
  logger.info(`[Webhook] hashRaw: ${hashRaw}`);
  logger.info(`[Webhook] hashRounded: ${hashRounded}`);
  logger.info(`[Webhook] received: ${signature_key}`);

  if (hashRaw !== signature_key && hashRounded !== signature_key) {
    logger.error("[Webhook] Signature Mismatch! Keduanya tidak cocok.");
    throw new Error("Invalid signature key.");
  }

  // Bungkus dalam transaksi database untuk keamanan data
  const transaction = await sequelize.transaction();

  try {
    // 1. Cari pesanan di database kita
    // PENTING: Tidak boleh include nested association saat pakai lock: LOCK.UPDATE
    // karena PostgreSQL melarang FOR UPDATE pada outer join
    const order = await Order.findByPk(order_id, {
      include: [{ association: "items", required: true }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      throw new Error(`Order ID ${order_id} tidak ditemukan di database.`);
    }

    // Hindari memproses ulang jika order sudah selesai/batal sebelumnya
    if (order.status === "paid" || order.status === "canceled") {
      await transaction.rollback();
      return order; // Tidak perlu throw error, cukup abaikan
    }

    // 2. Simpan Log Pembayaran untuk keperluan Audit
    await PaymentLog.create(
      {
        order_id: order.id,
        transaction_id_midtrans: transaction_id || "simulasi-sandbox",
        payment_type: payment_type || "bank_transfer",
        status_pembayaran: transaction_status,
        raw_response: JSON.stringify(payload),
      },
      { transaction },
    );

    // 3. Tentukan Aksi berdasarkan Status Transaksi Midtrans
    if (
      transaction_status === "settlement" ||
      transaction_status === "capture"
    ) {
      // PEMBAYARAN LUNAS
      order.status = "paid";
      await order.save({ transaction });

      // Kurangi locked_qty secara permanen (stok terjual)
      for (const item of order.items) {
        const inventory = await ProductInventory.findOne({
          where: { product_id: item.product_id },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (inventory) {
          inventory.locked_qty -= item.qty;
          // available_qty tidak ditambah karena stok memang sudah laku
          await inventory.save({ transaction });
        }

        // WP-3.2.3: Hitung Komisi Virtual Ledger per Vendor berdasarkan KATEGORI
        const vendor = await Vendor.findByPk(item.vendor_id, { transaction });
        if (vendor) {
          // Ambil komisi berdasarkan kategori vendor dari config terpusat
          const kategori = vendor.kategori || '';
          const komisiPersen = getKomisiPersen(kategori);
          const pendapatanKotor = parseFloat(item.subtotal);
          // Hitung biaya Midtrans secara dinamis berdasarkan metode pembayaran
          const biayaMidtrans = hitungBiayaMidtrans(payment_type, parseFloat(gross_amount));
          const potonganKomisi = (komisiPersen / 100) * pendapatanKotor;
          const pendapatanBersih = pendapatanKotor - biayaMidtrans - potonganKomisi;

          logger.info(`[Ledger] Vendor: ${vendor.nama_toko}, Kategori: ${kategori}, Komisi: ${komisiPersen}%, Fee Midtrans: ${biayaMidtrans}, Bersih: ${pendapatanBersih}`);
          await VirtualLedger.create(
            {
              vendor_id: item.vendor_id,
              order_id: order.id,
              pendapatan_kotor: pendapatanKotor,
              biaya_midtrans: biayaMidtrans,
              potongan_komisi: potonganKomisi,
              pendapatan_bersih: pendapatanBersih,
              status_pencairan: "unpaid",
            },
            { transaction },
          );

          // Update Saldo Vendor
          vendor.saldo_saat_ini = parseFloat(vendor.saldo_saat_ini) + pendapatanBersih;
          await vendor.save({ transaction });
        }
      }

      // WP-7.1.1: Tambah Loyalty Points untuk Wisatawan
      // 1 poin untuk setiap kelipatan Rp 100.000
      const pointEarned = Math.floor(
        parseFloat(order.total_pembayaran) / 100000,
      );
      if (pointEarned > 0) {
        await LoyaltyPoint.create(
          {
            user_id: order.user_id,
            order_id: order.id,
            points_earned: pointEarned,
            points_used: 0,
          },
          { transaction },
        );
      }
      // Email invoice dikirim SETELAH commit transaksi (lihat bawah)
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "expire" ||
      transaction_status === "deny"
    ) {
      // PEMBAYARAN GAGAL / KADALUARSA
      order.status = "canceled";
      await order.save({ transaction });

      // Kembalikan stok (Release Inventory Lock)
      for (const item of order.items) {
        const inventory = await ProductInventory.findOne({
          where: { product_id: item.product_id },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (inventory) {
          inventory.locked_qty -= item.qty;
          inventory.available_qty += item.qty; // Stok kembali tersedia
          await inventory.save({ transaction });
        }
      }
    }

    // 4. Commit transaksi - semua perubahan DB sudah aman
    await transaction.commit();
    logger.info("[Webhook] Transaksi DB berhasil di-commit!");

    // 5. Kirim Email Invoice SETELAH commit (agar transaksi tidak tertahan)
    // Ini penting di Jagoan Hosting agar proses email tidak memblokir/crash transaksi
    if (
      transaction_status === "settlement" ||
      transaction_status === "capture"
    ) {
      try {
        const pembeli = await User.findByPk(order.user_id);
        if (pembeli && pembeli.email) {
          const pdfService = require("./pdfService");
          const emailService = require("./emailService");
          // Muat ulang order tanpa transaksi untuk data lengkap
          const orderFull = await Order.findByPk(order.id, {
            include: [{ association: "items" }]
          });
          const pdfBuffer = await pdfService.generateInvoiceBuffer(orderFull || order);
          await emailService.sendInvoiceEmail(pembeli.email, orderFull || order, pdfBuffer);
          console.log(`[Email] Invoice terkirim ke ${pembeli.email}`);
        }
      } catch (emailErr) {
        // Error email tidak boleh membatalkan transaksi yang sudah berhasil
        console.error("[Email] Gagal mengirim invoice:", emailErr.message);
      }
    }

    return order;
  } catch (error) {
    await transaction.rollback();
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }
};

module.exports = {
  handleMidtransWebhook,
};
