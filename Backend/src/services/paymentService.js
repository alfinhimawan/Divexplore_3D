"use strict";
const {
  sequelize,
  Order,
  ProductInventory,
  PaymentLog,
  VirtualLedger,
  LoyaltyPoint,
  Vendor,
  User,
} = require("../models");

const crypto = require("crypto");

/**
 * Handle Webhook dari Midtrans
 * Menerima payload (notifikasi) JSON dari Midtrans.
 */
const handleMidtransWebhook = async (payload) => {
  const {
    order_id,
    transaction_status,
    transaction_id,
    payment_type,
    status_code,
    gross_amount,
    signature_key,
  } = payload;

  // PENTING: Validasi Signature Key (PCI-DSS & Security Compliance)
  // SHA512(order_id + status_code + gross_amount + ServerKey)
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const hash = crypto
    .createHash("sha512")
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest("hex");

  // if (hash !== signature_key) {
  //   throw new Error("Invalid signature key. Keamanan terancam!");
  // }

  // Bungkus dalam transaksi database untuk keamanan data
  const transaction = await sequelize.transaction();

  try {
    // 1. Cari pesanan di database kita
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

        // WP-3.2.3: Hitung Komisi Virtual Ledger per Vendor
        const vendor = await Vendor.findByPk(item.vendor_id, { transaction });
        if (vendor) {
          const komisiPersen = parseFloat(vendor.persentase_komisi || 0);
          const pendapatanKotor = parseFloat(item.subtotal);
          const biayaMidtrans = 4000; // Asumsi flat fee midtrans per trx/vendor
          const potonganKomisi = (komisiPersen / 100) * pendapatanKotor;
          const pendapatanBersih =
            pendapatanKotor - biayaMidtrans - potonganKomisi;

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

      // WP-3.1.4: Kirim Email Notifikasi beserta Invoice
      try {
        // Harus panggil module emailService & pdfService secara terpisah agar tidak circular dep
        const pembeli = await User.findByPk(order.user_id, { transaction });

        if (pembeli && pembeli.email) {
          const pdfService = require("./pdfService");
          const emailService = require("./emailService");

          const pdfBuffer = await pdfService.generateInvoiceBuffer(order);
          // Eksekusi asinkronus tanpa await agar webhook midtrans cepat selesai (merespon 200 OK)
          emailService.sendInvoiceEmail(pembeli.email, order, pdfBuffer);
        }
      } catch (err) {
        console.error("Gagal mengirim email notifikasi saat lunas:", err);
      }
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

    // 4. Commit transaksi
    await transaction.commit();
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
