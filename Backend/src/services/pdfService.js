"use strict";
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

// --- MODERN UI COLOR PALETTE ---
const colors = {
  bgApp: "#f1f5f9", // Slate 100 (Background A4)
  primary: "#0284c7", // Light Blue (Sky 600)
  primaryDark: "#0c4a6e", // Sky 900
  accent: "#f59e0b", // Amber 500
  success: "#10b981", // Emerald 500
  textDark: "#0f172a", // Slate 900
  textMuted: "#64748b", // Slate 500
  border: "#cbd5e1", // Slate 300
  white: "#ffffff",
  shadow: "#94a3b8"
};

/**
 * Generate E-Tiket PDF Buffer (Card-Based UI)
 */
const generateEtiketBuffer = (order) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Setup A4 Portrait
      const doc = new PDFDocument({ margin: 0, size: "A4", info: { Title: `E-Tiket - ${order.id}`, Author: "Divexplore 3D" }});
      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const bookingCode = order.id.substring(0, 8).toUpperCase();
      const buyerName = order.user && order.user.nama_lengkap ? order.user.nama_lengkap : "Wisatawan";
      
      // 1. BACKGROUND KERTAS (Abu terang seperti layar App)
      doc.rect(0, 0, 595, 842).fill(colors.bgApp);

      // --- KARTU TIKET (BOARDING PASS) ---
      const cardX = 30;
      const cardY = 120;
      const cardW = 535;
      const cardH = 300; // Tinggi kartu
      const splitX = 390; // Titik sobek vertikal (Pemisah Kiri & Kanan)

      // 2. DROP SHADOW KARTU
      doc.roundedRect(cardX + 4, cardY + 5, cardW, cardH, 16).fill(colors.shadow);
      
      // 3. BADAN KARTU UTAMA (PUTIH)
      doc.roundedRect(cardX, cardY, cardW, cardH, 16).fill(colors.white);

      // 4. HEADER KARTU (WARNA BIRU)
      doc.save();
      doc.roundedRect(cardX, cardY, cardW, 65, 16).clip();
      doc.rect(cardX, cardY, cardW, 65).fill(colors.primaryDark);
      doc.restore();
      // Sudut tajam di bagian bawah header agar nyambung ke kartu
      doc.rect(cardX, cardY + 45, cardW, 20).fill(colors.primaryDark);

      // Logo & Teks Header
      doc.fillColor(colors.accent).fontSize(22).font("Helvetica-Bold").text("DIVEXPLORE 3D", cardX + 25, cardY + 22);
      doc.fillColor(colors.white).fontSize(12).font("Helvetica-Bold").text("E-BOARDING PASS", cardX, cardY + 28, { width: cardW - 25, align: "right", letterSpacing: 2 });

      // 5. GARIS SOBEK (PERFORATED VERTICAL LINE)
      doc.moveTo(splitX, cardY + 65).lineTo(splitX, cardY + cardH).dash(6, { space: 6 }).strokeColor(colors.border).lineWidth(2).stroke();
      doc.undash();

      // Setengah lingkaran di ujung atas dan bawah garis putus-putus (efek disobek)
      doc.circle(splitX, cardY + 65, 10).fill(colors.bgApp);
      doc.circle(splitX, cardY + cardH, 10).fill(colors.bgApp);

      // ==========================================
      // ZONA KIRI (INFORMASI PENUMPANG & TIKET)
      // ==========================================
      const leftPad = cardX + 25;
      let curY = cardY + 95;

      // Baris 1: Kode Booking & Tanggal
      doc.fillColor(colors.textMuted).fontSize(10).font("Helvetica").text("KODE BOOKING", leftPad, curY);
      doc.fillColor(colors.textMuted).fontSize(10).font("Helvetica").text("TANGGAL BERLAKU", leftPad + 180, curY);
      curY += 15;
      doc.fillColor(colors.textDark).fontSize(22).font("Helvetica-Bold").text(bookingCode, leftPad, curY);
      doc.fillColor(colors.textDark).fontSize(14).font("Helvetica-Bold").text(new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }), leftPad + 180, curY + 6);

      // Baris 2: Nama Penumpang
      curY += 45;
      doc.rect(leftPad, curY - 10, splitX - leftPad - 20, 1).fill(colors.bgApp); // separator tipis
      doc.fillColor(colors.textMuted).fontSize(10).font("Helvetica").text("NAMA PENUMPANG", leftPad, curY);
      curY += 15;
      doc.fillColor(colors.primaryDark).fontSize(18).font("Helvetica-Bold").text(buyerName.toUpperCase(), leftPad, curY);

      // Baris 3: Daftar Layanan
      curY += 40;
      doc.rect(leftPad, curY - 10, splitX - leftPad - 20, 1).fill(colors.bgApp);
      doc.fillColor(colors.textMuted).fontSize(10).font("Helvetica").text("LAYANAN (PAKET WISATA)", leftPad, curY);
      curY += 15;
      
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const namaProduk = item.product ? item.product.nama_produk : `Produk ${item.product_id}`;
          doc.fillColor(colors.textDark).fontSize(12).font("Helvetica-Bold").text(namaProduk.substring(0, 35), leftPad, curY);
          doc.fillColor(colors.primary).fontSize(12).font("Helvetica-Bold").text(`x${item.qty} Orang`, leftPad + 260, curY);
          curY += 20;
        });
      }

      // ==========================================
      // ZONA KANAN (QR CODE BESAR)
      // ==========================================
      const rightPad = splitX + 20;
      doc.fillColor(colors.textDark).fontSize(11).font("Helvetica-Bold").text("SCAN TIKET", rightPad, cardY + 95, { width: cardW - splitX - 40, align: "center" });
      doc.fillColor(colors.textMuted).fontSize(8).font("Helvetica").text("Tunjukkan ke Petugas", rightPad, cardY + 110, { width: cardW - splitX - 40, align: "center" });

      try {
        const qrCodeDataUrl = await QRCode.toDataURL(order.id, { margin: 0, color: { dark: colors.textDark, light: colors.white } });
        const qrBuffer = Buffer.from(qrCodeDataUrl.replace(/^data:image\/png;base64,/, ""), "base64");
        
        // Bingkai QR Code
        doc.roundedRect(rightPad - 5, cardY + 130, 115, 115, 8).lineWidth(2).strokeColor(colors.primary).stroke();
        // Gambar QR
        doc.image(qrBuffer, rightPad, cardY + 135, { width: 105 });
      } catch (err) {}

      // LUNAS Badge di bawah QR
      doc.roundedRect(rightPad, cardY + 260, 105, 25, 12).fill(colors.success);
      doc.fillColor(colors.white).fontSize(11).font("Helvetica-Bold").text("LUNAS", rightPad, cardY + 268, { width: 105, align: "center", letterSpacing: 2 });


      // --- FOOTER TEKS BANTUAN ---
      const footY = cardY + cardH + 40;
      doc.fillColor(colors.textMuted).fontSize(10).font("Helvetica-Bold").text("CARA PENGGUNAAN:", cardX, footY);
      doc.fillColor(colors.textMuted).fontSize(9).font("Helvetica").lineGap(4)
         .text("1. Simpan tiket ini di HP Anda atau cetak pada kertas putih.", cardX, footY + 20)
         .text("2. Pada hari keberangkatan, tunjukkan area QR Code secara jelas kepada penjaga gerbang wisata.", cardX, footY + 35)
         .text("3. Tiket digital ini dilindungi oleh enkripsi otomatis Divexplore 3D.", cardX, footY + 50);

      doc.end();
    } catch (error) { reject(error); }
  });
};

/**
 * Generate Bukti Pembayaran PDF Buffer (Clean Startup Invoice)
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
      
      // BACKGROUND WHITE (A4)
      doc.rect(0, 0, 595, 842).fill(colors.white);

      // --- HEADER ---
      doc.fillColor(colors.primary).fontSize(28).font("Helvetica-Bold").text("INVOICE", 50, 50);
      doc.fillColor(colors.textDark).fontSize(16).font("Helvetica-Bold").text("DIVEXPLORE 3D", 50, 85, { width: 495, align: "right" });
      doc.fillColor(colors.textMuted).fontSize(10).font("Helvetica").text("Gili Trawangan, Lombok Utara\nNTB, Indonesia 83352", 50, 105, { width: 495, align: "right", lineGap: 3 });

      // Garis separator tipis elegan
      doc.rect(50, 140, 495, 1).fill(colors.bgApp);

      // --- INFO TAGIHAN ---
      doc.fillColor(colors.textMuted).fontSize(9).font("Helvetica-Bold").text("DITAGIHKAN KEPADA", 50, 170);
      doc.fillColor(colors.textDark).fontSize(14).font("Helvetica-Bold").text(buyerName.toUpperCase(), 50, 185);
      
      doc.fillColor(colors.textMuted).fontSize(9).font("Helvetica-Bold").text("KODE INVOICE", 350, 170);
      doc.fillColor(colors.textDark).fontSize(11).font("Helvetica-Bold").text(`#INV-${order.id.substring(0,8).toUpperCase()}`, 350, 185);

      doc.fillColor(colors.textMuted).fontSize(9).font("Helvetica-Bold").text("TANGGAL BAYAR", 350, 215);
      doc.fillColor(colors.textDark).fontSize(11).font("Helvetica").text(new Date(order.updatedAt || order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }), 350, 230);

      doc.fillColor(colors.textMuted).fontSize(9).font("Helvetica-Bold").text("METODE PEMBAYARAN", 50, 215);
      doc.fillColor(colors.textDark).fontSize(11).font("Helvetica").text(paymentDetails.payment_type.toUpperCase().replace("_", " "), 50, 230);

      // --- TABEL RINCIAN (NO GRID, CLEAN) ---
      let tableY = 300;
      doc.fillColor(colors.primaryDark).fontSize(10).font("Helvetica-Bold");
      doc.text("DESKRIPSI LAYANAN", 50, tableY);
      doc.text("QTY", 360, tableY);
      doc.text("SUBTOTAL", 460, tableY, { width: 85, align: "right" });

      tableY += 15;
      doc.rect(50, tableY, 495, 2).fill(colors.primaryDark); // Garis header tebal

      tableY += 15;
      doc.fillColor(colors.textDark).font("Helvetica");

      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const namaProduk = item.product ? item.product.nama_produk : `Produk ${item.product_id}`;
          const subtotal = parseFloat(item.subtotal).toLocaleString("id-ID");

          doc.fillColor(colors.textDark).fontSize(11).font("Helvetica-Bold").text(namaProduk.substring(0, 45), 50, tableY);
          doc.fillColor(colors.textMuted).fontSize(10).font("Helvetica").text("Tiket Masuk / Akses", 50, tableY + 15);
          
          doc.fillColor(colors.textDark).fontSize(11).font("Helvetica").text(`${item.qty}x`, 360, tableY);
          doc.text(`Rp ${subtotal}`, 430, tableY, { width: 115, align: "right" });

          tableY += 35;
          // Garis pembatas item tipis putus-putus
          doc.moveTo(50, tableY).lineTo(545, tableY).dash(4, { space: 4 }).strokeColor(colors.border).lineWidth(1).stroke();
          doc.undash();
          tableY += 15;
        });
      }

      // --- KOTAK TOTAL BAYAR (FOCAL POINT) ---
      tableY += 20;
      const boxW = 280;
      const boxH = 50;
      const boxX = 545 - boxW;
      
      doc.roundedRect(boxX, tableY, boxW, boxH, 12).fill(colors.primary);
      
      doc.fillColor(colors.white).fontSize(11).font("Helvetica").text("TOTAL KESELURUHAN", boxX + 20, tableY + 20);
      doc.fillColor(colors.white).fontSize(18).font("Helvetica-Bold").text(`Rp ${parseFloat(order.total_pembayaran).toLocaleString("id-ID")}`, boxX + 130, tableY + 16, { width: boxW - 150, align: "right" });

      // --- WATERMARK CAP LUNAS ---
      doc.save();
      doc.rotate(-20, { origin: [300, 450] });
      doc.fillColor(colors.success).fillOpacity(0.08).fontSize(120).font("Helvetica-Bold").text("PAID", 130, 400);
      doc.restore();

      // --- FOOTER TERIMA KASIH ---
      const footerY = 740;
      doc.rect(50, footerY - 20, 495, 1).fill(colors.bgApp);
      doc.fillColor(colors.primary).fontSize(14).font("Helvetica-Bold").text("Terima Kasih!", 50, footerY, { align: "center", width: 495 });
      doc.fillColor(colors.textMuted).fontSize(9).font("Helvetica").text("Tanda terima elektronik ini sah diterbitkan oleh sistem Divexplore 3D.", 50, footerY + 20, { align: "center", width: 495 });

      doc.end();
    } catch (error) { reject(error); }
  });
};

module.exports = {
  generateEtiketBuffer,
  generateBuktiPembayaranBuffer,
};
