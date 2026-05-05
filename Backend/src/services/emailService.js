"use strict";
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

let transporter;

/**
 * Inisialisasi Ethereal Email (Fake SMTP untuk Testing)
 */
const initNodemailer = async () => {
  try {
    // Generate test account dari ethereal
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    logger.info("Nodemailer: Ethereal SMTP Ready for Testing");
  } catch (error) {
    logger.error("Gagal inisialisasi Nodemailer", error);
  }
};

// Panggil inisialisasi
initNodemailer();

/**
 * Kirim Email Invoice beserta attachment PDF
 */
const sendInvoiceEmail = async (userEmail, order, pdfBuffer) => {
  if (!transporter) {
    logger.error("Nodemailer transporter belum siap.");
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: '"Divexplore-3D" <no-reply@divexplore3d.com>',
      to: userEmail,
      subject: `Invoice Pembayaran Lunas - Order #${order.id}`,
      text: `Halo,\n\nTerima kasih atas pembayaran Anda. Pesanan dengan ID ${order.id} telah lunas.\n\nSilakan temukan Invoice Anda pada lampiran email ini.\n\nSalam,\nTim Divexplore-3D`,
      attachments: [
        {
          filename: `Invoice_${order.id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    logger.info("Email terkirim!");
    // Preview URL ini SANGAT PENTING untuk melihat hasil email saat testing lokal!
    logger.info(`Preview Email Invoice: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (error) {
    logger.error("Gagal mengirim email invoice:", error);
  }
};

/**
 * Kirim Email Marketing (WP-7.1.2 & WP-7.1.3)
 */
const sendMarketingEmail = async (userEmail, type, data) => {
  if (!transporter) return;

  let subject = "";
  let body = "";

  switch (type) {
    case "REMINDER_PAYMENT":
      subject = `⚠️ Selesaikan Pembayaran Anda - Order #${data.order.id}`;
      body = `Halo,\n\nKami melihat Anda belum menyelesaikan pembayaran untuk pesanan #${data.order.id}.\n\nSegera lakukan pembayaran agar pesanan Anda tidak dibatalkan otomatis.\n\nTim Divexplore-3D`;
      break;
    case "LOYALTY_OFFER":
      subject = `🎁 Penawaran Khusus Untuk Pelanggan Setia!`;
      body = `Halo ${data.user.nama_lengkap},\n\nTerima kasih telah menjadi pelanggan setia Divexplore-3D. Kami punya promo khusus BUNDLING 3D untuk perjalanan Anda berikutnya!\n\nCek website kami sekarang.`;
      break;
    case "RETARGETING_VISIT":
      subject = `👀 Masih Tertarik dengan ${data.product.nama_produk}?`;
      body = `Halo ${data.user.nama_lengkap},\n\nKami melihat Anda melirik ${data.product.nama_produk} kemarin. Stok terbatas! Amankan pesanan Anda sekarang juga.\n\nSalam,\nTim Marketing`;
      break;
  }

  try {
    const info = await transporter.sendMail({
      from: '"Marketing Divexplore" <marketing@divexplore3d.com>',
      to: userEmail,
      subject: subject,
      text: body,
    });
    logger.info(`Marketing Email Sent (${type}): ${nodemailer.getTestMessageUrl(info)}`);
  } catch (error) {
    logger.error(`Gagal mengirim email marketing ${type}:`, error);
  }
};

module.exports = {
  sendInvoiceEmail,
  sendMarketingEmail,
};
