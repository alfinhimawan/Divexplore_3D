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

module.exports = {
  sendInvoiceEmail,
};
