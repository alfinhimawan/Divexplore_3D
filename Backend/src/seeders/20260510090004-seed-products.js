"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const tanggalKetersediaan = new Date("2026-10-01");

    const vendors = await queryInterface.sequelize.query(
      `SELECT id, nama_toko FROM "Vendors"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    const getVendorId = (nama) => {
      const v = vendors.find((vendor) => vendor.nama_toko === nama);
      return v ? v.id : null;
    };

    const v1 = getVendorId("Gili Dive & Tur Center");
    const v2 = getVendorId("Selam Gear Lombok");
    const v3 = getVendorId("Gili Ocean View Homestay");
    const v4 = getVendorId("Warung Seafood Pak Sukardi");
    const v5 = getVendorId("Gili Photo & Drone Studio");
    const v6 = getVendorId("Warung Ikan Bakar Ibu Marwah");
    const v7 = getVendorId("Oleh-oleh Bahari DIVEXPLORE");

    const products = [
      // --- VENDOR AKTIVITAS & TUR (V1) ---
      {
        id: uuidv4(),
        vendor_id: v1,
        nama_produk:
          "Open Tur Island Hopping (3 Gili: Trawangan, Meno, Air) - Sharing Boat",
        deskripsi:
          "Perjalanan keliling 3 pulau menggunakan Glass Bottom Boat. Termasuk singgah di spot patung bawah air (Bask Nest) dan area penyu.",
        harga: 150000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805015/divexplore/products/Open_Tur_Island_Hopping.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v1,
        nama_produk:
          "Open Tur Island Hopping (3 Gili: Trawangan, Meno, Air) - Private Boat",
        deskripsi:
          "Perjalanan keliling 3 pulau menggunakan Glass Bottom Boat. Termasuk singgah di spot patung bawah air (Bask Nest) dan area penyu.",
        harga: 1200000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805015/divexplore/products/Open_Tur_Island_Hopping.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v1,
        nama_produk: "Aktivitas Penyelaman Diving (Discovery Scuba Dive/DSD)",
        deskripsi:
          "Penyelaman laut dalam dengan sertifikasi (Fun Dive) atau tanpa sertifikasi (Discovery Scuba Dive/DSD). Wajib didampingi Dive Master berlisensi PADI/SSI.",
        harga: 900000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805017/divexplore/products/Aktivitas_Penyelaman_Diving.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v1,
        nama_produk: "Aktivitas Penyelaman Diving (Fun Dive 2 Log)",
        deskripsi:
          "Penyelaman laut dalam dengan sertifikasi (Fun Dive) atau tanpa sertifikasi (Discovery Scuba Dive/DSD). Wajib didampingi Dive Master berlisensi PADI/SSI.",
        harga: 1500000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805017/divexplore/products/Aktivitas_Penyelaman_Diving.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v1,
        nama_produk: "Aksi & Petualangan Bahari (Jetski)",
        deskripsi:
          "Pacu adrenalin Anda di area perairan aman tanpa merusak terumbu karang. Jetski didampingi instruktur (15 menit), Banana Boat kapasitas 5 orang (15 menit).",
        harga: 250000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805018/divexplore/products/Aksi_Petualangan_Bahari.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v1,
        nama_produk: "Aksi & Petualangan Bahari (Banana Boat)",
        deskripsi:
          "Pacu adrenalin Anda di area perairan aman tanpa merusak terumbu karang. Jetski didampingi instruktur (15 menit), Banana Boat kapasitas 5 orang (15 menit).",
        harga: 75000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805018/divexplore/products/Aksi_Petualangan_Bahari.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v1,
        nama_produk: "Eksplorasi Pesisir & Rekreasi (Stand-up Paddle)",
        deskripsi:
          "Nikmati keindahan perairan dangkal dan pemandangan matahari terbenam dengan kecepatan Anda sendiri secara ramah lingkungan.",
        harga: 100000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805019/divexplore/products/Eksplorasi_Pesisir_Rekreasi.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v1,
        nama_produk: "Eksplorasi Pesisir & Rekreasi (Kayak Transparan)",
        deskripsi:
          "Nikmati keindahan perairan dangkal dan pemandangan matahari terbenam dengan kecepatan Anda sendiri secara ramah lingkungan.",
        harga: 150000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805019/divexplore/products/Eksplorasi_Pesisir_Rekreasi.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },

      // --- VENDOR PERALATAN (V2) ---
      {
        id: uuidv4(),
        vendor_id: v2,
        nama_produk: "Set Snorkel Premium + Kaki Katak",
        deskripsi:
          "Peralatan dasar menyelam permukaan dengan kualitas kaca anti-embun (Sewa/hari).",
        harga: 75000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805023/divexplore/products/Snorkel_premium_kaki_katak.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v2,
        nama_produk: "Kamera Aksi (GoPro/Insta360)",
        deskripsi:
          "Dokumentasikan aksi bawah air Anda tanpa khawatir merusak HP pribadi (Sewa/hari).",
        harga: 200000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805021/divexplore/products/Kamera_aksi_gopro_insta_360.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v2,
        nama_produk: "Dry Bag (Tas Anti Air 10L)",
        deskripsi:
          "Tas kedap air untuk melindungi barang berharga saat berada di atas kapal (Beli putus).",
        harga: 85000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805020/divexplore/products/Dry_bag_Tas_anti_air_10L.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v2,
        nama_produk: "Sunblock Ramah Terumbu Karang",
        deskripsi:
          "Tabir surya khusus laut yang tidak merusak ekosistem koral (Beli putus).",
        harga: 120000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805024/divexplore/products/Sunblock_ramah_Terumbu_karang.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v2,
        nama_produk: "Rash Guard / Wetsuit Ringan",
        deskripsi:
          "Pakaian pelindung dari sengatan ubur-ubur dan paparan sinar UV matahari (Sewa/hari).",
        harga: 50000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805022/divexplore/products/Rashguard__wetsuit_ringan.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },

      // --- VENDOR AKOMODASI (V3) ---
      {
        id: uuidv4(),
        vendor_id: v3,
        nama_produk: "Standard Garden View",
        deskripsi: "—",
        harga: 400000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805028/divexplore/products/Standart_Garden_View.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v3,
        nama_produk: "Deluxe Ocean View",
        deskripsi:
          "Kamar luas dengan balkon langsung menghadap pantai, sudah termasuk sarapan (Kapasitas 2 Orang).",
        harga: 850000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805025/divexplore/products/Deluxe_ocean_view.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v3,
        nama_produk: "Private Family Bungalow",
        deskripsi:
          "Bungalow mewah dengan fasilitas kolam renang pribadi dan ruang keluarga (Kapasitas 4 Orang).",
        harga: 2000000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805027/divexplore/products/Private_Family_Bungalow.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v3,
        nama_produk: "Paket Spa / Sauna",
        deskripsi:
          "Paket pemulihan relaksasi otot tubuh pasca-aktivitas menyelam.",
        harga: 250000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805026/divexplore/products/Paket_spa_sauna.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },

      // --- VENDOR KULINER: PAK SUKARDI (V4) ---
      {
        id: uuidv4(),
        vendor_id: v4,
        nama_produk: "Paket Seafood Platter Saus Sukardi",
        deskripsi:
          "Kombinasi udang, cumi, dan kerang dengan saus pedas rahasia (Porsi 2 Orang).",
        harga: 250000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805032/divexplore/products/Paket_Seafood_Platter_Saus_Sukardi.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v4,
        nama_produk: "Kepiting Saus Padang Pesisir",
        deskripsi:
          "Kepiting bakau hasil tangkapan nelayan dengan bumbu saus padang pedas manis.",
        harga: 150000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805031/divexplore/products/Kepiting_Saus_Padang_pesisir.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v4,
        nama_produk: "Cumi Bakar Madu Pedas",
        deskripsi:
          "Cumi segar utuh yang dibakar dengan olesan madu murni dan sambal terasi khas pesisir.",
        harga: 75000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805029/divexplore/products/Cumi_Bakar_Madu_Pedas.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v4,
        nama_produk: "Udang Bakar Jimbaran",
        deskripsi:
          "Udang ukuran besar dibakar dengan bumbu kuning khas, disajikan dengan sambal matah.",
        harga: 85000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805034/divexplore/products/Udang_Bakar_Jimbaran.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v4,
        nama_produk: "Plecing Kangkung Seafood",
        deskripsi:
          "Sayur kangkung segar dengan sambal tomat, perasan limau, dan taburan udang rebon.",
        harga: 25000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805033/divexplore/products/Plecing_Kangkung_Seafood.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v4,
        nama_produk: "Es Kuwut Khas Lombok",
        deskripsi:
          "Minuman segar serutan kelapa muda, melon, biji selasih, dan perasan jeruk nipis.",
        harga: 25000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805030/divexplore/products/Es_Kuwut_Khas_Lombok.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },

      // --- VENDOR KULINER: IBU MARWAH (V6) ---
      {
        id: uuidv4(),
        vendor_id: v6,
        nama_produk: "Ikan Kerapu Bakar Bumbu Taliwang",
        deskripsi:
          "Kerapu karang bakar pedas khas bumbu Taliwang, disajikan lengkap dengan nasi hangat.",
        harga: 90000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805038/divexplore/products/Ikan_kerapu_bakar_bumbu_taliwang.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v6,
        nama_produk: "Ikan Kakap Merah Bakar Kecap",
        deskripsi:
          "Kakap merah segar yang dibakar perlahan dengan bumbu kecap manis gurih.",
        harga: 85000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805037/divexplore/products/Ikan_kakap_merah_bakar_kecap.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v6,
        nama_produk: "Sate Pusut Ikan Marlin",
        deskripsi:
          "Sate lilit dari daging ikan marlin cincang dan kelapa parut berbumbu, dibakar wangi (5 tusuk).",
        harga: 40000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805040/divexplore/products/Sate_pusut_ikan_marlin.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v6,
        nama_produk: "Ikan Baronang Bakar Rica-Rica",
        deskripsi:
          "Ikan baronang bakar dengan siraman bumbu rica-rica pedas yang menggugah selera.",
        harga: 80000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805036/divexplore/products/Ikan_baronang_bakar_rica_rica.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v6,
        nama_produk: "Sup Ikan Kuah Asam",
        deskripsi:
          "Sup ikan laut segar dengan kuah bening bercita rasa asam pedas menyegarkan.",
        harga: 60000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805041/divexplore/products/Sup_Ikan_Kuah_Asam.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v6,
        nama_produk: "Es Kelapa Muda Jeruk Nipis",
        deskripsi:
          "Kelapa muda utuh yang disajikan dingin dengan tambahan perasan jeruk nipis asli.",
        harga: 20000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805035/divexplore/products/Es_Kelapa_Muda_Jeruk_Nipis.webp",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },

      // --- VENDOR OLEH-OLEH (V7) ---
      {
        id: uuidv4(),
        vendor_id: v7,
        nama_produk: "Dodol Rumput Laut Premium",
        deskripsi:
          "Camilan kenyal yang terbuat dari ekstrak rumput laut asli perairan Lombok.",
        harga: 40000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805044/divexplore/products/dodol_rumput_laut.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v7,
        nama_produk: "Sambal Roa Pesisir Lombok",
        deskripsi:
          "Sambal botol yang memadukan cabai pilihan dengan suwiran ikan roa asap gurih.",
        harga: 35000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805052/divexplore/products/sambal_ROA.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v7,
        nama_produk: "Kerupuk Kulit Ikan Tenggiri",
        deskripsi:
          "Kerupuk renyah yang dibuat langsung dari kulit ikan laut segar tanpa pengawet buatan.",
        harga: 30000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805051/divexplore/products/Kerupuk_Kulit_Ikan_Tenggiri.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v7,
        nama_produk: "Abon Ikan Tuna Pedas Manis",
        deskripsi:
          "Lauk awetan praktis yang diolah dari daging ikan tuna pilihan (250gr).",
        harga: 45000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805042/divexplore/products/Abon_Ikan_Tuna_Pedas_Manis.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v7,
        nama_produk: "Ikan Asin Tenggiri Belah",
        deskripsi:
          "Olahan ikan asin kualitas ekspor yang dikemas vakum higienis.",
        harga: 50000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805049/divexplore/products/Ikan_Asin_Tenggiri_Belah.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v7,
        nama_produk: "Teri Crispy Balado Daun Jeruk",
        deskripsi:
          "Camilan teri kering yang digoreng renyah dengan bumbu balado wangi daun jeruk.",
        harga: 25000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805053/divexplore/products/Teri_Crispy_Balado_Daun_Jeruk.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v7,
        nama_produk: "Kopi Bubuk Rumput Laut",
        deskripsi:
          "Perpaduan biji kopi Robusta lokal dan ekstrak rumput laut yang kaya serat.",
        harga: 30000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805052/divexplore/products/Kopi_Bubuk_Rumput_Laut.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v7,
        nama_produk: "Cumi Asin Kering Premium",
        deskripsi:
          "Cumi asin kualitas super, dikemas aman untuk perjalanan pesawat (200gr).",
        harga: 60000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805043/divexplore/products/Cumi_Asin_Kering_Premium.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v7,
        nama_produk: "Keripik Teripang Emas",
        deskripsi:
          "Camilan bergizi tinggi yang digoreng kering dari bahan baku teripang (*sea cucumber*).",
        harga: 75000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805050/divexplore/products/Keripik_Teripang_Emas.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v7,
        nama_produk: "Hampers Bahari",
        deskripsi:
          "Paket berisi Dodol Rumput Laut, Sambal Roa, Abon Tuna, dan Kerupuk Ikan (gratis *totebag*).",
        harga: 200000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805048/divexplore/products/hampers_bahari.png",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },

      // --- VENDOR FOTOGRAFI (V5) ---
      {
        id: uuidv4(),
        vendor_id: v5,
        nama_produk: "Fotografer Darat/Pantai",
        deskripsi:
          "Sesi foto di pesisir menggunakan kamera Mirrorless/DSLR (Harga sewa per jam).",
        harga: 300000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805056/divexplore/products/Fotografer_Darat_Pantai.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v5,
        nama_produk: "Pendampingan Foto Bawah Air",
        deskripsi:
          "Fotografer bersertifikat menyelam menggunakan Underwater Housing (Harga sewa per jam).",
        harga: 500000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805057/divexplore/products/Pendampingan_foto_bawah_air.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        vendor_id: v5,
        nama_produk: "Dokumentasi Udara (Drone)",
        deskripsi:
          "Rekaman video estetik dari atas pulau oleh pilot DJI Drone Profesional (Harga sewa per jam).",
        harga: 600000,
        thumbnail_url:
          "https://res.cloudinary.com/dzyz0m1iz/image/upload/v1778805055/divexplore/products/Dokumentasi_Udara_Drone.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await queryInterface.bulkInsert("Products", products);

    const inventories = products.map((p) => ({
      id: uuidv4(),
      product_id: p.id,
      tanggal_ketersediaan: tanggalKetersediaan,
      available_qty: 100,
      locked_qty: 0,
      createdAt: now,
      updatedAt: now,
    }));

    await queryInterface.bulkInsert("ProductInventories", inventories);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("ProductInventories", null, {});
    await queryInterface.bulkDelete("Products", null, {});
  },
};
