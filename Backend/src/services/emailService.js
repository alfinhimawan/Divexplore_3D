"use strict";
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

let transporter;

/**
 * Base HTML Template untuk semua email (Standar Industri)
 */
const baseHtmlTemplate = (title, content) => `
  <div style="font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6; border-radius: 12px;">
    <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px; font-weight: 800;">DIVEXPLORE 3D</h1>
      <p style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 16px;">${title}</p>
    </div>
    
    <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      ${content}
      
      <div style="margin-top: 40px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p style="color: #6b7280; font-size: 14px; margin: 0; font-style: italic;">"Jelajahi dunia bawah laut tanpa batas dari genggaman Anda"</p>
        <p style="color: #0284c7; font-size: 16px; font-weight: bold; margin: 10px 0 0 0;">Tim Divexplore 3D</p>
      </div>
    </div>
  </div>
`;

/**
 * Inisialisasi Transport Nodemailer (Real SMTP vs Ethereal)
 */
const initNodemailer = async () => {
  try {
    // Jika kredensial SMTP asli tersedia di .env (GMAIL / CPANEL / PRODUCTION)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: parseInt(process.env.SMTP_PORT) === 465 || !process.env.SMTP_PORT, // true for 465 (SSL), false for 587 (TLS)
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
 * Kirim Email Invoice beserta attachment PDF (KAI-Style Ready)
 */
const sendInvoiceEmail = async (userEmail, order, pdfBuffer) => {
  if (!transporter) return;

  try {
    const htmlContent = `
      <h2 style="color: #1f2937; margin-top: 0;">Halo, Wisatawan! 👋</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Terima kasih atas pembayaran Anda. Kami dengan senang hati menginformasikan bahwa pesanan Anda telah <strong style="color: #059669;">LUNAS</strong> dan sukses dikonfirmasi oleh sistem kami.</p>
      
      <div style="background-color: #f8fafc; border-left: 4px solid #0ea5e9; padding: 15px 20px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; color: #374151; font-weight: 600;">Detail Reservasi Wisata Bahari & UMKM:</p>
        <p style="margin: 5px 0; color: #4b5563;">Order ID: <span style="color: #111827; font-weight: 600;">#${order.id.substring(0,8).toUpperCase()}</span></p>
        <p style="margin: 5px 0; color: #4b5563;">Total Bayar: <span style="color: #059669; font-weight: 600;">Rp ${parseFloat(order.total_pembayaran).toLocaleString("id-ID")}</span></p>
        <p style="margin: 5px 0; color: #4b5563;">Status: <span style="background-color: #10b981; color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; letter-spacing: 0.5px;">LUNAS</span></p>
      </div>
      
      <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Sebagai referensi sah (Invoice Pembayaran), kami telah melampirkan dokumen resmi dari Divexplore 3D pada email ini. Tunjukkan atau simpan dokumen ini jika diperlukan.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://divexplore-3d.com/user/orders" style="background-color: #f59e0b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">Lihat Pesanan Anda Sekarang</a>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Divexplore-3D" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `✅ Invoice Lunas: Order #${order.id.substring(0,8).toUpperCase()}`,
      html: baseHtmlTemplate("Invoice Reservasi", htmlContent),
      attachments: [
        {
          filename: `Invoice_Divexplore_${order.id.substring(0,8)}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    logger.info("Email Invoice terkirim!");
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
  let title = "";
  let htmlContent = "";

  switch (type) {
    case "REMINDER_PAYMENT":
      subject = `⚠️ Selesaikan Pembayaran Paket Wisata Anda - Order #${data.order.id.substring(0,8)}`;
      title = "Peringatan Pembayaran (Reminder)";
      htmlContent = `
        <h2 style="color: #1f2937; margin-top: 0;">Reservasi Anda Hampir Hangus! 😱</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Halo, kami melihat Anda belum menyelesaikan pembayaran untuk reservasi Paket Wisata Bahari & UMKM Anda.</p>
        <p style="color: #ef4444; font-weight: bold; font-size: 18px; text-align: center; margin: 20px 0;">Order ID: #${data.order.id.substring(0,8).toUpperCase()}</p>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Segera selesaikan pembayaran sebelum batas waktu berakhir agar pesanan Anda tidak dibatalkan otomatis oleh sistem.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://divexplore-3d.com/payment/${data.order.id}" style="background-color: #ef4444; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Bayar Sekarang</a>
        </div>
      `;
      break;
    case "LOYALTY_OFFER":
      subject = `🎁 Penawaran Khusus Untuk Pelanggan Setia!`;
      title = "Promo Pelanggan Setia";
      htmlContent = `
        <h2 style="color: #1f2937; margin-top: 0;">Kejutan Khusus Untuk Anda! 🎉</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Halo ${data.user.nama_lengkap}, terima kasih telah menjadi pelanggan setia perjalanan 3D kami.</p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Kami memiliki promo <strong>BUNDLING 3D EKSKLUSIF</strong> yang sengaja kami persiapkan hanya untuk wisatawan terpilih seperti Anda!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://divexplore-3d.com/promos" style="background-color: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Klaim Promo Saya</a>
        </div>
      `;
      break;
    case "RETARGETING_VISIT":
      subject = `👀 Masih Tertarik dengan ${data.product.nama_produk}?`;
      title = "Aset 3D Pilihan Anda";
      htmlContent = `
        <h2 style="color: #1f2937; margin-top: 0;">Barang Impian Anda Menunggu! 🌟</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Halo ${data.user.nama_lengkap}, kami melihat Anda melirik <strong>${data.product.nama_produk}</strong> beberapa waktu lalu.</p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Sayangnya stok aset tersebut sangat diminati dan bisa hilang kapan saja. Jangan sampai terlewat!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://divexplore-3d.com/product/${data.product.id}" style="background-color: #0284c7; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Lihat Produk Kembali</a>
        </div>
      `;
      break;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Marketing Divexplore" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: subject,
      html: baseHtmlTemplate(title, htmlContent),
    });
    logger.info(`Marketing Email Sent (${type}): ${nodemailer.getTestMessageUrl(info)}`);
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
    // Wrap the textbody into HTML if no HTML is provided
    const content = htmlBody || `<p style="color: #4b5563; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${textBody}</p>`;
    
    const mailOptions = {
      from: `"Divexplore Notification" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: subject,
      text: textBody,
      html: baseHtmlTemplate("Sistem Notifikasi", content),
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`General Email Sent to ${toEmail}: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (error) {
    logger.error(`Gagal mengirim email general ke ${toEmail}:`, error);
  }
};

module.exports = {
  sendInvoiceEmail,
  sendMarketingEmail,
  sendGeneralEmail,
};
