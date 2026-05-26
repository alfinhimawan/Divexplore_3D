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
 * Kirim Email Invoice beserta 2 attachment PDF (KAI-Style)
 */
const sendInvoiceEmail = async (userEmail, order, buffers, paymentDetails) => {
  if (!transporter) return;

  try {
    const buyerName = order.user && order.user.nama_lengkap ? order.user.nama_lengkap : "Wisatawan";
    const paymentDate = new Date(order.updatedAt || order.createdAt).toLocaleString("id-ID");
    const paymentMethod = paymentDetails && paymentDetails.payment_type ? paymentDetails.payment_type.toUpperCase().replace("_", " ") : "TRANSFER BANK";
    
    // Generate Items HTML for Detail Pemesanan
    let itemsDetailHtml = "";
    let itemsRincianHtml = "";
    
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        const productName = item.product ? item.product.nama_produk : `Produk ${item.product_id}`;
        const harga = parseFloat(item.harga_satuan).toLocaleString("id-ID");
        const subtotal = parseFloat(item.subtotal).toLocaleString("id-ID");
        
        // Kotak 2: Detail
        itemsDetailHtml += `
          <div style="margin-top: 15px;">
            <p style="margin: 0; font-size: 14px; color: #111827; font-weight: bold;">${productName.toUpperCase()}</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">Jumlah Tiket : ${item.qty} Orang/Item</p>
          </div>
        `;

        // Kotak 3: Rincian
        itemsRincianHtml += `
          <tr>
            <td style="padding: 10px 0; font-size: 13px; color: #374151; border-bottom: 1px dashed #e5e7eb;">
              ${productName}<br>
              <span style="color: #6b7280; font-size: 11px;">Tiket Wisata/Item</span>
            </td>
            <td style="padding: 10px 0; font-size: 13px; color: #374151; text-align: center; border-bottom: 1px dashed #e5e7eb;">x${item.qty}</td>
            <td style="padding: 10px 0; font-size: 13px; color: #374151; text-align: right; border-bottom: 1px dashed #e5e7eb;">Rp${harga}</td>
          </tr>
        `;
      });
    }

    // KAI-Style HTML Layout
    const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
      
      <!-- HEADER -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
        <tr>
          <td>
            <h1 style="color: #0369a1; font-style: italic; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px;">DIVEXPLORE <span style="color: #f59e0b;">3D</span></h1>
          </td>

        </tr>
      </table>

      <!-- GREETING -->
      <div style="margin-bottom: 25px;">
        <p style="margin: 0 0 5px 0; font-size: 14px; color: #4b5563;">Halo, ${buyerName}</p>
        <p style="margin: 0 0 10px 0; font-size: 16px; color: #111827; font-weight: bold;">Pemesanan Anda Berhasil Dibayar.</p>
        <p style="margin: 0; font-size: 13px; color: #4b5563; line-height: 1.5;">Pemesanan Anda telah berhasil dibayar. Silakan cek e-tiket yang terlampir di e-mail ini atau di aplikasi Divexplore 3D.<br><br>Berikut detail transaksi Anda :</p>
      </div>

      <!-- KOTAK 1: STATUS TRANSAKSI -->
      <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 13px;">
          <tr>
            <td style="color: #6b7280; width: 40%;">Status</td>
            <td align="right" style="color: #10b981; font-weight: bold;">Lunas</td>
          </tr>
          <tr>
            <td style="color: #6b7280;">Kode Booking</td>
            <td align="right" style="color: #111827;">${order.id.substring(0,8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="color: #6b7280;">Kode Pembayaran</td>
            <td align="right" style="color: #111827;">${paymentDetails.transaction_id}</td>
          </tr>
          <tr>
            <td style="color: #6b7280;">Waktu Pembayaran</td>
            <td align="right" style="color: #111827;">${paymentDate}</td>
          </tr>
          <tr>
            <td style="color: #6b7280;">Metode Pembayaran</td>
            <td align="right" style="color: #111827;">${paymentMethod}</td>
          </tr>
          <tr>
            <td colspan="2"><hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 10px 0;"></td>
          </tr>
          <tr>
            <td style="color: #111827; font-weight: bold;">Total Pembayaran</td>
            <td align="right" style="color: #111827; font-weight: bold;">Rp${parseFloat(order.total_pembayaran).toLocaleString("id-ID")}</td>
          </tr>
        </table>
      </div>

      <!-- KOTAK 2: DETAIL PEMESANAN -->
      <div style="margin-bottom: 20px;">
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #111827; font-weight: bold;">Detail Pemesanan</p>
        <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td><span style="background-color: #0369a1; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">WISATA BAHARI</span></td>
              <td align="right"><span style="background-color: #8b5cf6; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">Eksklusif</span></td>
            </tr>
          </table>
          
          ${itemsDetailHtml}

          <div style="margin-top: 15px; padding: 10px; background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px;">
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #6b7280;">Pemesan :</p>
            <p style="margin: 0; font-size: 13px; color: #111827; font-weight: bold;">${buyerName}</p>
          </div>
        </div>
      </div>

      <!-- KOTAK 3: RINCIAN PEMBAYARAN -->
      <div style="margin-bottom: 20px;">
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #111827; font-weight: bold;">Rincian Pembayaran</p>
        <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${itemsRincianHtml}
            <tr>
              <td colspan="2" style="padding: 15px 0 10px 0; font-size: 13px; color: #6b7280;">Subtotal</td>
              <td align="right" style="padding: 15px 0 10px 0; font-size: 13px; color: #111827;">Rp${parseFloat(order.total_pembayaran).toLocaleString("id-ID")}</td>
            </tr>
            <tr>
              <td colspan="3"><hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 5px 0;"></td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 10px 0; font-size: 13px; color: #111827; font-weight: bold;">Total Pembayaran</td>
              <td align="right" style="padding: 10px 0; font-size: 13px; color: #111827; font-weight: bold;">Rp${parseFloat(order.total_pembayaran).toLocaleString("id-ID")}</td>
            </tr>
          </table>
        </div>
      </div>



      <!-- FOOTER TEXT -->
      <div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 15px;">
        <p style="margin: 0 0 10px 0; font-size: 11px; color: #6b7280; line-height: 1.5;">Email ini dibuat otomatis, mohon untuk tidak membalas, jika ada pertanyaan atau membutuhkan bantuan silakan hubungi call center kami di 021-121 atau melalui email di <a href="mailto:admin@divexplore-3d.com" style="color: #0369a1;">admin@divexplore-3d.com</a></p>
        <p style="margin: 0 0 15px 0; font-size: 11px; color: #6b7280;">Terimakasih telah bertransaksi menggunakan aplikasi Divexplore 3D.</p>
        
        <div style="background-color: #1e1b4b; border-radius: 8px; padding: 15px;">
          <p style="margin: 0 0 5px 0; font-size: 12px; color: #ffffff; font-weight: bold;">Divexplore 3D Indonesia</p>
          <p style="margin: 0 0 2px 0; font-size: 10px; color: #cbd5e1;">Gili Trawangan, Kec. Pemenang, Kabupaten Lombok Utara, Nusa Tenggara Barat 83352</p>
          <p style="margin: 0 0 2px 0; font-size: 10px; color: #cbd5e1;">No Telepon : 022-4230031</p>
          <p style="margin: 0 0 5px 0; font-size: 10px; color: #cbd5e1;">Email : <a href="mailto:admin@divexplore-3d.com" style="color: #93c5fd; text-decoration: none;">admin@divexplore-3d.com</a></p>
          <p style="margin: 10px 0 0 0; font-size: 11px; color: #ffffff; font-weight: bold;">Download App Divexplore 3D</p>
        </div>
      </div>
    </div>
    `;

    const bookingCode = order.id.substring(0,8).toUpperCase();
    const info = await transporter.sendMail({
      from: `"Divexplore-3D" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `✅ E-Ticket & Invoice: Order #${bookingCode}`,
      html: htmlContent,
      attachments: [
        {
          filename: `E-tiket (${bookingCode}).pdf`,
          content: buffers.etiketBuffer,
          contentType: "application/pdf",
        },
        {
          filename: `Bukti Pembayaran (${paymentDetails.transaction_id}).pdf`,
          content: buffers.buktiBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    logger.info("Email Invoice terkirim dengan 2 attachment (E-tiket & Bukti)!");
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
