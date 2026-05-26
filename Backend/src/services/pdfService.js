"use strict";
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

// --- MODERN COLOR PALETTE ---
const colors = {
  primary: "#0f172a", // Slate 900 (Dark Navy)
  accent: "#0ea5e9", // Light Blue
  warning: "#f59e0b", // Orange
  success: "#10b981", // Emerald
  textDark: "#1e293b", // Slate 800
  textMuted: "#64748b", // Slate 500
  lightBg: "#f8fafc", // Slate 50
  border: "#e2e8f0", // Slate 200
  white: "#ffffff"
};

/**
 * Generate E-Tiket PDF Buffer (Boarding Pass Style)
 */
const generateEtiketBuffer = (order) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4", info: { Title: `E-Tiket - ${order.id}`, Author: "Divexplore 3D" }});
      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const bookingCode = order.id.substring(0, 8).toUpperCase();
      const buyerName = order.user && order.user.nama_lengkap ? order.user.nama_lengkap : "Wisatawan";
      
      // BACKGROUND
      doc.rect(0, 0, 595, 842).fill(colors.lightBg);

      // MAIN TICKET WRAPPER (TICKET SHAPE)
      const startX = 40;
      const startY = 60;
      const ticketWidth = 515;
      const ticketHeight = 450;
      
      // Drop Shadow effect (fake)
      doc.roundedRect(startX + 3, startY + 3, ticketWidth, ticketHeight, 12).fill("#cbd5e1");
      // Ticket Body
      doc.roundedRect(startX, startY, ticketWidth, ticketHeight, 12).fill(colors.white);

      // TICKET HEADER (NAVY)
      doc.save();
      doc.roundedRect(startX, startY, ticketWidth, 70, 12).clip();
      doc.rect(startX, startY, ticketWidth, 70).fill(colors.primary);
      doc.restore();

      // Fix square corners at bottom of header
      doc.rect(startX, startY + 50, ticketWidth, 20).fill(colors.primary);

      doc.fillColor(colors.warning).fontSize(20).font("Helvetica-Bold").text("DIVEXPLORE 3D", startX + 25, startY + 25);
      doc.fillColor(colors.white).fontSize(14).font("Helvetica-Bold").text("E-BOARDING PASS", startX, startY + 28, { width: ticketWidth - 25, align: "right" });

      // LEFT COLUMN (Data)
      doc.fillColor(colors.textMuted).fontSize(10).font("Helvetica").text("KODE BOOKING", startX + 25, startY + 95);
      doc.fillColor(colors.primary).fontSize(24).font("Helvetica-Bold").text(bookingCode, startX + 25, startY + 110);
      
      doc.fillColor(colors.textMuted).fontSize(10).font("Helvetica").text("TANGGAL ORDER", startX + 180, startY + 95);
      doc.fillColor(colors.textDark).fontSize(12).font("Helvetica-Bold").text(new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }), startX + 180, startY + 118);

      // Status Badge
      doc.roundedRect(startX + 25, startY + 160, 80, 25, 6).fill(colors.success);
      doc.fillColor(colors.white).fontSize(11).font("Helvetica-Bold").text("AKTIF", startX + 25, startY + 167, { width: 80, align: "center" });

      // PASSENGER INFO
      doc.rect(startX + 25, startY + 210, 320, 1).fill(colors.border);
      doc.fillColor(colors.textMuted).fontSize(9).font("Helvetica").text("NAMA PENUMPANG", startX + 25, startY + 225);
      doc.fillColor(colors.textDark).fontSize(14).font("Helvetica-Bold").text(buyerName.toUpperCase(), startX + 25, startY + 240);
      
      // TICKETS LIST
      let itemY = startY + 280;
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const namaProduk = item.product ? item.product.nama_produk : `Produk ${item.product_id}`;
          doc.fillColor(colors.accent).fontSize(10).font("Helvetica-Bold").text("Wisata Bahari", startX + 25, itemY);
          doc.fillColor(colors.textDark).fontSize(12).font("Helvetica-Bold").text(namaProduk.substring(0, 40), startX + 25, itemY + 15);
          doc.fillColor(colors.textMuted).fontSize(10).font("Helvetica").text(`Qty: ${item.qty} Orang`, startX + 25, itemY + 32);
          itemY += 55;
        });
      }

      // RIGHT COLUMN (QR CODE)
      // Divider dashed line vertical
      doc.moveTo(startX + 360, startY + 90).lineTo(startX + 360, startY + 430).dash(5, { space: 5 }).strokeColor(colors.border).lineWidth(2).stroke();
      doc.undash();

      try {
        const qrCodeDataUrl = await QRCode.toDataURL(order.id, { margin: 1, color: { dark: colors.primary, light: "#ffffff" } });
        const qrBuffer = Buffer.from(qrCodeDataUrl.replace(/^data:image\/png;base64,/, ""), "base64");
        
        doc.fillColor(colors.textMuted).fontSize(11).font("Helvetica-Bold").text("SCAN DI PINTU MASUK", startX + 375, startY + 140, { width: 120, align: "center" });
        doc.rect(startX + 380, startY + 170, 110, 110).lineWidth(2).strokeColor(colors.accent).stroke();
        doc.image(qrBuffer, startX + 385, startY + 175, { width: 100 });
        doc.fillColor(colors.textDark).fontSize(9).font("Helvetica").text("E-Ticket Resmi", startX + 375, startY + 295, { width: 120, align: "center" });
      } catch (err) {}

      // PERFORATED LINE AT BOTTOM OF TICKET
      doc.moveTo(startX, startY + ticketHeight + 20).lineTo(startX + ticketWidth, startY + ticketHeight + 20).dash(8, { space: 8 }).strokeColor(colors.textMuted).lineWidth(1).stroke();
      doc.undash();
      // Scissor Icon (Fake Text)
      doc.fillColor(colors.textMuted).fontSize(14).text("✂", startX - 10, startY + ticketHeight + 13);

      // FOOTER / TERMS
      const footerY = startY + ticketHeight + 50;
      doc.fillColor(colors.textDark).fontSize(11).font("Helvetica-Bold").text("SYARAT & KETENTUAN MASUK:", startX, footerY);
      doc.fillColor(colors.textMuted).fontSize(9).font("Helvetica").lineGap(4)
         .text("1. E-Tiket ini adalah dokumen sah yang diterbitkan oleh sistem Divexplore 3D.", startX, footerY + 20)
         .text("2. Harap tunjukkan QR Code pada tiket ini langsung dari HP Anda kepada petugas lapangan.", startX, footerY + 35)
         .text("3. Tiket yang sudah di-scan tidak dapat digunakan berulang kali.", startX, footerY + 50)
         .text("4. Tiba di titik kumpul maksimal 30 menit sebelum jadwal keberangkatan untuk persiapan.", startX, footerY + 65);

      doc.end();
    } catch (error) { reject(error); }
  });
};

/**
 * Generate Bukti Pembayaran PDF Buffer (Modern Invoice Style)
 */
const generateBuktiPembayaranBuffer = (order, paymentDetails) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4", info: { Title: `Bukti Pembayaran - ${order.id}`, Author: "Divexplore 3D" }});
      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const buyerName = order.user && order.user.nama_lengkap ? order.user.nama_lengkap : "Wisatawan";
      
      // HEADER
      doc.fillColor(colors.primary).fontSize(28).font("Helvetica-Bold").text("INVOICE", 50, 50);
      doc.fillColor(colors.accent).fontSize(14).font("Helvetica-Bold").text("DIVEXPLORE 3D", 50, 85, { width: 495, align: "right" });
      doc.fillColor(colors.textMuted).fontSize(10).font("Helvetica").text("Lombok, Indonesia", 50, 105, { width: 495, align: "right" });

      doc.rect(50, 130, 495, 1).fill(colors.border);

      // INFO GRID
      doc.fillColor(colors.textMuted).fontSize(9).font("Helvetica-Bold").text("DITAGIHKAN KEPADA", 50, 150);
      doc.fillColor(colors.textDark).fontSize(12).font("Helvetica-Bold").text(buyerName.toUpperCase(), 50, 165);
      
      doc.fillColor(colors.textMuted).fontSize(9).font("Helvetica-Bold").text("KODE INVOICE", 350, 150);
      doc.fillColor(colors.textDark).fontSize(11).font("Helvetica").text(`#INV-${order.id.substring(0,8).toUpperCase()}`, 350, 165);

      doc.fillColor(colors.textMuted).fontSize(9).font("Helvetica-Bold").text("TANGGAL", 350, 195);
      doc.fillColor(colors.textDark).fontSize(11).font("Helvetica").text(new Date(order.updatedAt || order.createdAt).toLocaleDateString("id-ID"), 350, 210);

      doc.fillColor(colors.textMuted).fontSize(9).font("Helvetica-Bold").text("METODE BAYAR", 50, 200);
      doc.fillColor(colors.textDark).fontSize(11).font("Helvetica").text(paymentDetails.payment_type.toUpperCase().replace("_", " "), 50, 215);

      // ITEMS TABLE (MINIMALIST)
      let tableY = 270;
      doc.rect(50, tableY, 495, 25).fill(colors.lightBg);
      doc.fillColor(colors.textMuted).fontSize(9).font("Helvetica-Bold");
      doc.text("DESKRIPSI", 60, tableY + 8);
      doc.text("QTY", 330, tableY + 8);
      doc.text("HARGA", 380, tableY + 8);
      doc.text("SUBTOTAL", 460, tableY + 8);

      tableY += 35;
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const namaProduk = item.product ? item.product.nama_produk : `Produk ${item.product_id}`;
          const harga = parseFloat(item.harga_satuan).toLocaleString("id-ID");
          const subtotal = parseFloat(item.subtotal).toLocaleString("id-ID");

          doc.fillColor(colors.textDark).fontSize(10).font("Helvetica-Bold").text(namaProduk.substring(0, 45), 60, tableY);
          doc.font("Helvetica").text(item.qty.toString(), 330, tableY);
          doc.text(`Rp ${harga}`, 380, tableY);
          doc.text(`Rp ${subtotal}`, 460, tableY);

          tableY += 25;
          doc.moveTo(50, tableY).lineTo(545, tableY).dash(3, { space: 3 }).strokeColor(colors.border).lineWidth(1).stroke();
          doc.undash();
          tableY += 15;
        });
      }

      // TOTAL BOX (FOCAL POINT)
      tableY += 20;
      const boxWidth = 220;
      const boxX = 545 - boxWidth;
      doc.roundedRect(boxX, tableY, boxWidth, 40, 6).fill(colors.primary);
      
      doc.fillColor(colors.white).fontSize(12).font("Helvetica-Bold").text("TOTAL BAYAR", boxX + 15, tableY + 14);
      doc.fillColor(colors.accent).fontSize(14).font("Helvetica-Bold").text(`Rp ${parseFloat(order.total_pembayaran).toLocaleString("id-ID")}`, boxX, tableY + 13, { width: boxWidth - 15, align: "right" });

      // WATERMARK STAMP
      doc.save();
      doc.rotate(-25, { origin: [300, 400] });
      doc.fillOpacity(0.1).fillColor(colors.success).fontSize(100).font("Helvetica-Bold").text("LUNAS", 100, 350);
      doc.restore();

      // FOOTER NOTE
      const footerY = 750;
      doc.rect(50, footerY - 15, 495, 1).fill(colors.border);
      doc.fillColor(colors.textMuted).fontSize(8).font("Helvetica").text("Dokumen ini adalah bukti pembayaran digital yang sah dan diproses secara otomatis oleh sistem komputer. Tidak memerlukan tanda tangan basah.", 50, footerY, { align: "center", width: 495 });

      doc.end();
    } catch (error) { reject(error); }
  });
};

module.exports = {
  generateEtiketBuffer,
  generateBuktiPembayaranBuffer,
};
