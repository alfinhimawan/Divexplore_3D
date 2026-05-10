"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    
    const vendors = await queryInterface.sequelize.query(
      `SELECT id, nama_toko FROM "Vendors"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const getVendorId = (nama) => {
      const v = vendors.find(vendor => vendor.nama_toko === nama);
      return v ? v.id : null;
    };

    const vendorDocs = [
      { id: getVendorId("Gili Dive & Tur Center"), docs: ["KTP", "SIUP"] },
      { id: getVendorId("Selam Gear Lombok"), docs: ["KTP", "SIUP"] },
      { id: getVendorId("Gili Ocean View Homestay"), docs: ["KTP", "SIUP"] },
      { id: getVendorId("Warung Seafood Pak Sukardi"), docs: ["KTP"] },
      { id: getVendorId("Gili Photo & Drone Studio"), docs: ["KTP", "SIUP"] }
    ];

    const docRows = [];
    for (const vendor of vendorDocs) {
      if (!vendor.id) continue;
      for (const jenis of vendor.docs) {
        docRows.push({
          id: uuidv4(),
          vendor_id: vendor.id,
          jenis_dokumen: jenis,
          file_url: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
          status_verifikasi: "approved",
          catatan_admin: "Dokumen valid",
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    if (docRows.length > 0) {
      await queryInterface.bulkInsert("VendorDocuments", docRows);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("VendorDocuments", null, {});
  }
};
