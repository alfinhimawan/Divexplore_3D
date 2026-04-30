"use strict";
const PDFDocument = require("pdfkit");

/**
 * Generate PDF Invoice Buffer
 * Menggunakan memori stream (buffer) agar tidak perlu menyimpan file fisik di server.
 */
const generateInvoiceBuffer = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // Header Invoice
      doc.fontSize(20).text("DIVEXPLORE-3D INVOICE", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Order ID: ${order.id}`);
      doc.text(
        `Tanggal: ${new Date(order.createdAt).toLocaleDateString("id-ID")}`,
      );
      doc.text(`Status: ${order.status.toUpperCase()}`);
      doc.moveDown();

      // Tabel Barang
      doc.text("--------------------------------------------------");
      doc.text("Detail Pesanan:", { underline: true });
      doc.moveDown(0.5);

      if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
          const namaProduk = item.product
            ? item.product.nama_produk
            : `Produk ${item.product_id}`;
          doc.text(`${index + 1}. ${namaProduk}`);
          doc.text(
            `   ${item.qty} x Rp ${parseFloat(item.harga_satuan).toLocaleString("id-ID")} = Rp ${parseFloat(item.subtotal).toLocaleString("id-ID")}`,
          );
          doc.moveDown(0.5);
        });
      } else {
        doc.text("Tidak ada detail item.");
      }

      doc.text("--------------------------------------------------");
      doc.moveDown();
      doc
        .fontSize(14)
        .text(
          `Total Pembayaran: Rp ${parseFloat(order.total_pembayaran).toLocaleString("id-ID")}`,
          { align: "right" },
        );

      doc.moveDown(2);
      doc.fontSize(10).text("Terima kasih telah berbelanja di Divexplore-3D!", {
        align: "center",
        italic: true,
      });

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
