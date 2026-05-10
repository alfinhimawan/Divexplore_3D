"use strict";
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const path = require("path");

/**
 * Generate PDF Invoice Buffer (KAI E-Ticket Style)
 */
const generateInvoiceBuffer = (order) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 0,
        size: "A4",
        info: {
          Title: `Invoice - ${order.id}`,
          Author: "Divexplore 3D",
        },
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // --- CONFIGURATION ---
      const primaryColor = "#0369a1"; // Divexplore Blue
      const accentColor = "#f59e0b"; // Orange
      const textColor = "#333333";
      const lightGray = "#f3f4f6";

      // --- 1. HEADER (KAI Style Blue Block) ---
      doc.rect(0, 0, 595, 120).fill(primaryColor);
      
      // Title
      doc.fillColor("#ffffff")
         .fontSize(24)
         .font("Helvetica-Bold")
         .text("DIVEXPLORE 3D", 40, 40);
         
      doc.fontSize(12)
         .font("Helvetica")
         .text("INVOICE RESERVASI WISATA", 40, 70, { characterSpacing: 2 });

      // Generate QR Code for Order ID
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(order.id, {
          margin: 1,
          color: { dark: primaryColor, light: "#ffffff" },
        });
        // Convert Data URL to Buffer
        const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
        const qrBuffer = Buffer.from(base64Data, "base64");
        
        // Draw White Box for QR
        doc.rect(455, 20, 100, 100).fill("#ffffff");
        doc.image(qrBuffer, 460, 25, { width: 90 });
      } catch (err) {
        console.error("Gagal generate QR Code PDF:", err);
      }

      // --- 2. ORDER INFO (Kode Booking) ---
      doc.fillColor(textColor);
      doc.rect(40, 140, 515, 80).fillAndStroke(lightGray, "#e5e7eb");
      
      doc.fillColor(primaryColor)
         .fontSize(10)
         .font("Helvetica-Bold")
         .text("KODE PEMESANAN / ORDER ID", 60, 155);
         
      doc.fillColor(accentColor)
         .fontSize(22)
         .font("Helvetica-Bold")
         .text(order.id.substring(0, 8).toUpperCase(), 60, 175); // Show first 8 chars prominently

      // Right side of info box
      doc.fillColor(textColor)
         .fontSize(10)
         .font("Helvetica")
         .text("Tanggal Pemesanan", 300, 155)
         .font("Helvetica-Bold")
         .text(new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }), 300, 170);

      doc.font("Helvetica")
         .text("Status", 300, 190)
         .fillColor("#10b981")
         .font("Helvetica-Bold")
         .text(order.status.toUpperCase(), 350, 190);

      // --- 3. CUSTOMER INFO ---
      doc.fillColor(textColor);
      const buyerName = order.user && order.user.nama_lengkap ? order.user.nama_lengkap : "Wisatawan";
      const buyerEmail = order.user && order.user.email ? order.user.email : "-";
      
      doc.fontSize(14).font("Helvetica-Bold").text("DATA PENUMPANG / PEMBELI", 40, 240);
      doc.moveTo(40, 260).lineTo(555, 260).lineWidth(1).strokeColor(primaryColor).stroke();

      doc.fontSize(11).font("Helvetica-Bold").text("Nama Lengkap", 40, 275)
         .font("Helvetica").text(buyerName, 40, 290);
         
      doc.font("Helvetica-Bold").text("Email", 300, 275)
         .font("Helvetica").text(buyerEmail, 300, 290);

      // --- 4. ITEM DETAILS TABLE ---
      doc.fontSize(14).font("Helvetica-Bold").text("DETAIL PAKET WISATA & LAYANAN PENDUKUNG", 40, 340);
      doc.moveTo(40, 360).lineTo(555, 360).lineWidth(1).strokeColor(primaryColor).stroke();

      // Table Header
      let tableY = 375;
      doc.rect(40, tableY, 515, 25).fill(primaryColor);
      doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold");
      doc.text("No", 50, tableY + 8);
      doc.text("Deskripsi Produk", 80, tableY + 8);
      doc.text("Qty", 350, tableY + 8);
      doc.text("Harga", 400, tableY + 8);
      doc.text("Subtotal", 480, tableY + 8);

      // Table Rows
      tableY += 25;
      doc.fillColor(textColor).font("Helvetica");

      if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
          const isEven = index % 2 === 0;
          if (isEven) {
            doc.rect(40, tableY, 515, 30).fill(lightGray);
            doc.fillColor(textColor);
          }

          const namaProduk = item.product ? item.product.nama_produk : `Produk ${item.product_id}`;
          const harga = parseFloat(item.harga_satuan).toLocaleString("id-ID");
          const subtotal = parseFloat(item.subtotal).toLocaleString("id-ID");

          doc.text((index + 1).toString(), 50, tableY + 10);
          doc.text(namaProduk.substring(0, 45), 80, tableY + 10);
          doc.text(item.qty.toString(), 350, tableY + 10);
          doc.text(`Rp ${harga}`, 400, tableY + 10);
          doc.text(`Rp ${subtotal}`, 480, tableY + 10);

          tableY += 30;
        });
      } else {
        doc.text("Tidak ada detail perjalanan.", 50, tableY + 10);
        tableY += 30;
      }

      // --- 5. TOTAL PAYMENT ---
      doc.moveTo(40, tableY + 10).lineTo(555, tableY + 10).lineWidth(2).strokeColor(primaryColor).stroke();
      tableY += 25;
      
      doc.fontSize(12).font("Helvetica-Bold").text("TOTAL PEMBAYARAN:", 300, tableY);
      doc.fillColor(accentColor).fontSize(14).text(`Rp ${parseFloat(order.total_pembayaran).toLocaleString("id-ID")}`, 450, tableY - 2, { align: "right" });

      // --- 6. FOOTER (Syarat & Ketentuan) ---
      const footerY = 680;
      doc.moveTo(40, footerY).lineTo(555, footerY).lineWidth(1).strokeColor("#d1d5db").stroke();
      
      doc.fillColor("#6b7280").fontSize(9).font("Helvetica-Bold")
         .text("SYARAT & KETENTUAN PENGGUNAAN:", 40, footerY + 15);
         
      doc.font("Helvetica").fontSize(8)
         .text("1. Invoice PDF ini adalah bukti reservasi sah yang dikeluarkan oleh Divexplore 3D.", 40, footerY + 30)
         .text("2. Paket Wisata Bahari dan add-on UMKM yang dipesan tunduk pada kebijakan masing-masing operator.", 40, footerY + 45)
         .text("3. Jaga kerahasiaan Kode Pemesanan (Order ID) dan QR Code Anda dari pihak yang tidak berkepentingan.", 40, footerY + 60)
         .text("4. Pembatalan atau *refund* hanya dapat dilakukan sesuai dengan prosedur pengembalian dana Divexplore 3D.", 40, footerY + 75);

      // Finalize PDF file
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoiceBuffer,
};
