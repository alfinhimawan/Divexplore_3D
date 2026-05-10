"use strict";
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

let transporter;

/**
 * Inisialisasi Transport Nodemailer (Real SMTP vs Ethereal)
 */
const initNodemailer = async () => {
  try {
    // Jika kredensial SMTP asli tersedia di .env (GMAIL / PRODUCTION)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      logger.info(`Nodemailer: Real SMTP Ready (${process.env.SMTP_USER})`);
    } 
    // Jika tidak ada di .env, gunakan Fake SMTP (ETHEREAL / DEVELOPMENT)
    else {
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
    }
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
      subject: `✅ Pembayaran Berhasil: Invoice Order #${order.id}`,
      text: `Halo,\n\nTerima kasih atas pembayaran Anda. Pesanan dengan ID ${order.id} telah lunas.\n\nSilakan temukan Invoice Anda pada lampiran email ini.\n\nSalam,\nTim Divexplore-3D`,
      html: `
      <div style="font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px; font-weight: 800;">DIVEXPLORE 3D</h1>
          <p style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 16px;">Invoice Pembayaran Lunas</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #1f2937; margin-top: 0;">Halo, Wisatawan! 👋</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Terima kasih atas pembayaran Anda. Kami dengan senang hati menginformasikan bahwa pesanan Anda telah <strong style="color: #059669;">LUNAS</strong> dan sukses dikonfirmasi oleh sistem kami.</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #0ea5e9; padding: 15px 20px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; color: #374151; font-weight: 600;">Detail Transaksi:</p>
            <p style="margin: 5px 0; color: #4b5563;">Order ID: <span style="color: #111827; font-weight: 600;">#${order.id}</span></p>
            <p style="margin: 5px 0; color: #4b5563;">Total Bayar: <span style="color: #059669; font-weight: 600;">Rp ${parseFloat(order.total_pembayaran).toLocaleString("id-ID")}</span></p>
            <p style="margin: 5px 0; color: #4b5563;">Status: <span style="background-color: #10b981; color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; letter-spacing: 0.5px;">LUNAS</span></p>
          </div>
          
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Sebagai referensi sah, kami telah melampirkan dokumen <strong>Invoice PDF</strong> resmi dari Divexplore 3D pada email ini.</p>
          
          <div style="margin-top: 40px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0; font-style: italic;">"Jelajahi dunia bawah laut tanpa batas dari genggaman Anda"</p>
            <p style="color: #0284c7; font-size: 16px; font-weight: bold; margin: 10px 0 0 0;">Tim Divexplore 3D</p>
          </div>
        </div>
      </div>
      `,
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
    logger.info(
      `Marketing Email Sent (${type}): ${nodemailer.getTestMessageUrl(info)}`,
    );
  } catch (error) {
    logger.error(`Gagal mengirim email marketing ${type}:`, error);
  }
};

/**
 * Kirim Email Notifikasi Umum (Ke Vendor, Admin, dll)
 */
const sendGeneralEmail = async (toEmail, subject, textBody, htmlBody = null) => {
  if (!transporter) return;

  try {
    const mailOptions = {
      from: '"Divexplore Notification" <no-reply@divexplore3d.com>',
      to: toEmail,
      subject: subject,
      text: textBody,
    };
    if (htmlBody) mailOptions.html = htmlBody;

    const info = await transporter.sendMail(mailOptions);
    logger.info(
      `General Email Sent to ${toEmail}: ${nodemailer.getTestMessageUrl(info)}`,
    );
  } catch (error) {
    logger.error(`Gagal mengirim email general ke ${toEmail}:`, error);
  }
};

module.exports = {
  sendInvoiceEmail,
  sendMarketingEmail,
  sendGeneralEmail,
};
