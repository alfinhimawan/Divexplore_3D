"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const tanggalKetersediaan = new Date("2026-10-01");

    const vendors = await queryInterface.sequelize.query(
      `SELECT id, nama_toko FROM "Vendors"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const getVendorId = (nama) => {
      const v = vendors.find(vendor => vendor.nama_toko === nama);
      return v ? v.id : null;
    };

    const v1 = getVendorId("Gili Dive & Tur Center");
    const v2 = getVendorId("Selam Gear Lombok");
    const v3 = getVendorId("Gili Ocean View Homestay");
    const v4 = getVendorId("Warung Seafood Pak Sukardi");
    const v5 = getVendorId("Gili Photo & Drone Studio");

    const products = [
      {
        id: uuidv4(),
        vendor_id: v1,
        nama_produk: "Open Tur Island Hopping (3 Gili — Sharing Boat)",
        deskripsi: "Perjalanan keliling 3 pulau menggunakan Glass Bottom Boat.",
        harga: 150000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v1,
        nama_produk: "Open Tur Island Hopping (3 Gili — Private Boat)",
        deskripsi: "Perjalanan private keliling 3 pulau eksklusif untuk rombongan.",
        harga: 1200000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v1,
        nama_produk: "Aktivitas Penyelaman — Discovery Scuba Dive (DSD 1 Log)",
        deskripsi: "Penyelaman tanpa sertifikasi, didampingi Dive Master.",
        harga: 900000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v1,
        nama_produk: "Aktivitas Penyelaman — Fun Dive (2 Log)",
        deskripsi: "Penyelaman bersertifikasi PADI/SSI didampingi Dive Master.",
        harga: 1500000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v1,
        nama_produk: "Aksi Bahari — Jetski (15 Menit)",
        deskripsi: "Pacu adrenalin di area perairan aman tanpa merusak terumbu karang.",
        harga: 250000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v1,
        nama_produk: "Aksi Bahari — Banana Boat (15 Menit, Kapasitas 5 Orang)",
        deskripsi: "Sensasi meluncur di atas air bersama rombongan.",
        harga: 75000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v1,
        nama_produk: "Eksplorasi Pesisir — Stand-up Paddle (Per Jam)",
        deskripsi: "Nikmati perairan dangkal secara ramah lingkungan dengan papan seluncur.",
        harga: 100000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v1,
        nama_produk: "Eksplorasi Pesisir — Kayak Transparan (Per Jam)",
        deskripsi: "Menikmati keindahan bawah laut dari atas kayak transparan.",
        harga: 150000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v2,
        nama_produk: "Set Snorkel Premium + Kaki Katak (Sewa/Hari)",
        deskripsi: "Peralatan dasar menyelam permukaan kualitas kaca anti-embun.",
        harga: 75000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v2,
        nama_produk: "Kamera Aksi GoPro/Insta360 (Sewa/Hari)",
        deskripsi: "Dokumentasikan aksi bawah air tanpa khawatir merusak HP pribadi.",
        harga: 200000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v2,
        nama_produk: "Dry Bag Tas Anti Air 10L (Beli Putus)",
        deskripsi: "Tas kedap air untuk melindungi HP, dompet, dan kamera.",
        harga: 85000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v2,
        nama_produk: "Sunblock Ramah Terumbu Karang (Beli Putus)",
        deskripsi: "Tabir surya khusus laut yang tidak merusak ekosistem koral.",
        harga: 120000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v2,
        nama_produk: "Rash Guard / Wetsuit Ringan (Sewa/Hari)",
        deskripsi: "Pakaian pelindung dari sengatan ubur-ubur dan paparan sinar UV.",
        harga: 50000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v3,
        nama_produk: "Kamar Standard Garden View",
        deskripsi: "Kamar standar dengan pemandangan taman yang asri.",
        harga: 400000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v3,
        nama_produk: "Kamar Deluxe Ocean View (Kapasitas 2 Orang)",
        deskripsi: "Kamar luas dengan balkon langsung menghadap pantai.",
        harga: 850000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v3,
        nama_produk: "Private Family Bungalow (Kapasitas 4 Orang)",
        deskripsi: "Bungalow mewah dengan kolam renang pribadi.",
        harga: 2000000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v3,
        nama_produk: "[Add-on] Paket Spa & Sauna",
        deskripsi: "Paket pemulihan relaksasi otot pasca-aktivitas.",
        harga: 250000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v4,
        nama_produk: "Paket Seafood Platter Saus Sukardi (Porsi 2 Orang)",
        deskripsi: "Kombinasi udang, cumi, dan kerang dengan saus pedas rahasia.",
        harga: 250000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v4,
        nama_produk: "Kepiting Saus Padang Pesisir",
        deskripsi: "Kepiting bakau hasil tangkapan nelayan lokal.",
        harga: 150000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v4,
        nama_produk: "Cumi Bakar Madu Pedas",
        deskripsi: "Cumi segar utuh yang dibakar dengan olesan madu murni.",
        harga: 75000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v4,
        nama_produk: "Udang Bakar Jimbaran",
        deskripsi: "Udang ukuran besar dibakar dengan bumbu kuning khas.",
        harga: 85000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v4,
        nama_produk: "[Bundling] Hampers Bahari (Dodol + Sambal Roa + Abon Tuna + Kerupuk + Totebag)",
        deskripsi: "Paket oleh-oleh lengkap hasil laut Lombok.",
        harga: 200000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v5,
        nama_produk: "Fotografer Darat / Pantai (Per Jam)",
        deskripsi: "Sesi foto di pesisir menggunakan kamera Mirrorless/DSLR.",
        harga: 300000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v5,
        nama_produk: "Pendampingan Foto Bawah Air (Per Jam)",
        deskripsi: "Fotografer bersertifikat menyelam menggunakan Underwater Housing.",
        harga: 500000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v5,
        nama_produk: "Dokumentasi Udara — Drone DJI (Per Jam)",
        deskripsi: "Rekaman video estetik dari atas pulau oleh pilot DJI.",
        harga: 600000,
        thumbnail_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      }
    ];

    await queryInterface.bulkInsert("Products", products);

    const inventories = products.map((p) => ({
      id: uuidv4(),
      product_id: p.id,
      tanggal_ketersediaan: tanggalKetersediaan,
      available_qty: 50,
      locked_qty: 0,
      createdAt: now,
      updatedAt: now,
    }));

    await queryInterface.bulkInsert("ProductInventories", inventories);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("ProductInventories", null, {});
    await queryInterface.bulkDelete("Products", null, {});
  }
};
