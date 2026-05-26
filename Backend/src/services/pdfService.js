"use strict";
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

// --- CONFIGURATION ---
const primaryColor = "#0369a1"; // Divexplore Blue
const accentColor = "#f59e0b"; // Orange
const textColor = "#333333";
const lightGray = "#f3f4f6";

// Helper function to draw header
const drawHeader = async (doc, order, title) => {
  doc.rect(0, 0, 595, 120).fill(primaryColor);
  
  doc.fillColor("#ffffff")
     .fontSize(24)
     .font("Helvetica-Bold")
     .text("DIVEXPLORE 3D", 40, 40);
     
  doc.fontSize(12)
     .font("Helvetica")
     .text(title, 40, 70, { characterSpacing: 2 });

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(order.id, {
      margin: 1,
      color: { dark: primaryColor, light: "#ffffff" },
    });
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
    const qrBuffer = Buffer.from(base64Data, "base64");
    
    doc.rect(455, 20, 100, 100).fill("#ffffff");
    doc.image(qrBuffer, 460, 25, { width: 90 });
  } catch (err) {
    console.error("Gagal generate QR Code PDF:", err);
  }
};

/**
 * Generate E-Tiket PDF Buffer
 */
const generateEtiketBuffer = (order) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 0,
        size: "A4",
        info: { Title: `E-Tiket - ${order.id}`, Author: "Divexplore 3D" },
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      await drawHeader(doc, order, "E-TIKET WISATA BAHARI");

      // --- ORDER INFO ---
      doc.fillColor(textColor);
      doc.rect(40, 140, 515, 80).fillAndStroke(lightGray, "#e5e7eb");
      
      doc.fillColor(primaryColor).fontSize(10).font("Helvetica-Bold").text("KODE BOOKING", 60, 155);
      doc.fillColor(accentColor).fontSize(22).font("Helvetica-Bold").text(order.id.substring(0, 8).toUpperCase(), 60, 175);

      doc.fillColor(textColor).fontSize(10).font("Helvetica").text("Tanggal Pemesanan", 300, 155)
         .font("Helvetica-Bold").text(new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }), 300, 170);

      doc.font("Helvetica").text("Status Tiket", 300, 190).fillColor("#10b981").font("Helvetica-Bold").text("AKTIF", 370, 190);

      // --- CUSTOMER INFO ---
      doc.fillColor(textColor);
      const buyerName = order.user && order.user.nama_lengkap ? order.user.nama_lengkap : "Wisatawan";
      const buyerEmail = order.user && order.user.email ? order.user.email : "-";
      
      doc.fontSize(14).font("Helvetica-Bold").text("DATA PENUMPANG", 40, 240);
      doc.moveTo(40, 260).lineTo(555, 260).lineWidth(1).strokeColor(primaryColor).stroke();

      doc.fontSize(11).font("Helvetica-Bold").text("Nama Lengkap", 40, 275).font("Helvetica").text(buyerName, 40, 290);
      doc.font("Helvetica-Bold").text("Email", 300, 275).font("Helvetica").text(buyerEmail, 300, 290);

      // --- ITEM DETAILS (No Prices) ---
      doc.fontSize(14).font("Helvetica-Bold").text("DETAIL PAKET WISATA", 40, 340);
      doc.moveTo(40, 360).lineTo(555, 360).lineWidth(1).strokeColor(primaryColor).stroke();

      let tableY = 375;
      doc.rect(40, tableY, 515, 25).fill(primaryColor);
      doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold");
      doc.text("No", 50, tableY + 8);
      doc.text("Deskripsi Layanan", 80, tableY + 8);
      doc.text("Jumlah (Orang/Item)", 400, tableY + 8);

      tableY += 25;
      doc.fillColor(textColor).font("Helvetica");

      if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
          if (index % 2 === 0) doc.rect(40, tableY, 515, 30).fill(lightGray);
          const namaProduk = item.product ? item.product.nama_produk : `Produk ${item.product_id}`;
          doc.fillColor(textColor);
          doc.text((index + 1).toString(), 50, tableY + 10);
          doc.text(namaProduk.substring(0, 50), 80, tableY + 10);
          doc.text(item.qty.toString(), 400, tableY + 10);
          tableY += 30;
        });
      } else {
        doc.text("Tidak ada detail perjalanan.", 50, tableY + 10);
        tableY += 30;
      }

      // --- FOOTER ---
      const footerY = 680;
      doc.moveTo(40, footerY).lineTo(555, footerY).lineWidth(1).strokeColor("#d1d5db").stroke();
      doc.fillColor("#6b7280").fontSize(9).font("Helvetica-Bold").text("INFORMASI PENTING:", 40, footerY + 15);
      doc.font("Helvetica").fontSize(8)
         .text("1. E-Tiket ini adalah tanda masuk yang sah. Harap tunjukkan dokumen ini kepada petugas saat berada di lokasi.", 40, footerY + 30)
         .text("2. Jaga kerahasiaan Kode Booking dan QR Code Anda dari pihak yang tidak berkepentingan.", 40, footerY + 45)
         .text("3. Tiba di titik kumpul maksimal 30 menit sebelum jadwal keberangkatan kapal.", 40, footerY + 60);

      doc.end();
    } catch (error) { reject(error); }
  });
};

/**
 * Generate Bukti Pembayaran PDF Buffer
 */
const generateBuktiPembayaranBuffer = (order, paymentDetails) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 0,
        size: "A4",
        info: { Title: `Bukti Pembayaran - ${order.id}`, Author: "Divexplore 3D" },
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      await drawHeader(doc, order, "BUKTI PEMBAYARAN");

      // --- ORDER INFO ---
      doc.fillColor(textColor);
      doc.rect(40, 140, 515, 80).fillAndStroke(lightGray, "#e5e7eb");
      
      doc.fillColor(primaryColor).fontSize(10).font("Helvetica-Bold").text("KODE TRANSAKSI", 60, 155);
      doc.fillColor(textColor).fontSize(14).font("Helvetica-Bold").text(order.id.substring(0, 18).toUpperCase(), 60, 175);
      
      doc.fillColor(primaryColor).fontSize(10).font("Helvetica-Bold").text("TANGGAL BAYAR", 300, 155);
      doc.fillColor(textColor).fontSize(10).font("Helvetica").text(new Date(order.updatedAt || order.createdAt).toLocaleString("id-ID"), 300, 170);

      doc.fillColor(primaryColor).fontSize(10).font("Helvetica-Bold").text("METODE BAYAR", 420, 155);
      doc.fillColor(textColor).fontSize(10).font("Helvetica").text(paymentDetails.payment_type.toUpperCase().replace("_", " "), 420, 170);

      doc.font("Helvetica").text("Status Transaksi", 60, 195).fillColor("#10b981").font("Helvetica-Bold").text("LUNAS", 150, 195);

      // --- CUSTOMER INFO ---
      doc.fillColor(textColor);
      const buyerName = order.user && order.user.nama_lengkap ? order.user.nama_lengkap : "Wisatawan";
      
      doc.fontSize(14).font("Helvetica-Bold").text("DIBAYAR OLEH", 40, 240);
      doc.moveTo(40, 260).lineTo(555, 260).lineWidth(1).strokeColor(primaryColor).stroke();
      doc.fontSize(11).font("Helvetica").text(buyerName, 40, 275);

      // --- ITEM DETAILS (With Prices) ---
      doc.fontSize(14).font("Helvetica-Bold").text("RINCIAN PEMBAYARAN", 40, 320);
      doc.moveTo(40, 340).lineTo(555, 340).lineWidth(1).strokeColor(primaryColor).stroke();

      let tableY = 355;
      doc.rect(40, tableY, 515, 25).fill(primaryColor);
      doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold");
      doc.text("Deskripsi", 50, tableY + 8);
      doc.text("Qty", 350, tableY + 8);
      doc.text("Harga", 400, tableY + 8);
      doc.text("Subtotal", 480, tableY + 8);

      tableY += 25;
      doc.fillColor(textColor).font("Helvetica");

      if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
          if (index % 2 === 0) doc.rect(40, tableY, 515, 30).fill(lightGray);
          const namaProduk = item.product ? item.product.nama_produk : `Produk ${item.product_id}`;
          const harga = parseFloat(item.harga_satuan).toLocaleString("id-ID");
          const subtotal = parseFloat(item.subtotal).toLocaleString("id-ID");

          doc.fillColor(textColor);
          doc.text(namaProduk.substring(0, 45), 50, tableY + 10);
          doc.text(item.qty.toString(), 350, tableY + 10);
          doc.text(`Rp ${harga}`, 400, tableY + 10);
          doc.text(`Rp ${subtotal}`, 480, tableY + 10);
          tableY += 30;
        });
      }

      // --- TOTAL PAYMENT ---
      doc.moveTo(40, tableY + 10).lineTo(555, tableY + 10).lineWidth(2).strokeColor(primaryColor).stroke();
      tableY += 25;
      doc.fontSize(12).font("Helvetica-Bold").text("TOTAL PEMBAYARAN:", 300, tableY);
      doc.fillColor(accentColor).fontSize(14).text(`Rp ${parseFloat(order.total_pembayaran).toLocaleString("id-ID")}`, 430, tableY - 2, { align: "right" });

      doc.end();
    } catch (error) { reject(error); }
  });
};

module.exports = {
  generateEtiketBuffer,
  generateBuktiPembayaranBuffer,
};
