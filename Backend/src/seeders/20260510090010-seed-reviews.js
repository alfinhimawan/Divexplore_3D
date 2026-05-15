"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Buat 5 user wisatawan dummy
    const touristUsers = [
      { id: uuidv4(), nama_lengkap: "Budi Santoso", email: "budi.wisatawan@example.com", auth_provider: "local", role: "USER", createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), nama_lengkap: "Sari Dewi", email: "sari.dewi@example.com", auth_provider: "local", role: "USER", createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), nama_lengkap: "Agus Pratama", email: "agus.pratama@example.com", auth_provider: "local", role: "USER", createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), nama_lengkap: "Maya Rizka", email: "maya.rizka@example.com", auth_provider: "local", role: "USER", createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), nama_lengkap: "Reza Oktovian", email: "reza.oktovian@example.com", auth_provider: "local", role: "USER", createdAt: new Date(), updatedAt: new Date() }
    ];

    await queryInterface.bulkDelete("Users", { email: { [Sequelize.Op.like]: "%@example.com" } }, {});
    await queryInterface.bulkInsert("Users", touristUsers);

    // Ambil data produk berserta kategori vendornya
    const products = await queryInterface.sequelize.query(
      `SELECT p.id, p.vendor_id, v.kategori FROM "Products" p JOIN "Vendors" v ON p.vendor_id = v.id;`
    );
    const productRows = products[0];
    if(productRows.length === 0) return;

    // Buat order dummy untuk setiap user
    const orders = touristUsers.map(user => ({
      id: uuidv4(),
      user_id: user.id,
      status: "COMPLETED",
      total_pembayaran: 500000,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    await queryInterface.bulkInsert("Orders", orders);

    const reviews = [];
    const commentsByCategory = {
      homestay: [
        "Kamar bersih pol, deket banget sama pantai. Bangun tidur langsung dapet view laut!",
        "Tuan rumahnya ramah banget, berasa kayak di rumah sendiri. Recomended!",
        "Fasilitas lengkap, AC dingin, dan yang paling penting Wi-Fi nya kenceng.",
        "Suasananya tenang, cocok banget buat healing dari keramaian kota.",
        "Deket sama spot makan enak juga, jadi gampang kalau laper malem-malem.",
        "Kasurnya empuk, bantalnya banyak. Tidur jadi nyenyak banget.",
        "Akses ke lokasi wisata utama sangat dekat, tinggal jalan kaki saja.",
        "Kamar mandinya bersih dan air panasnya berfungsi dengan baik.",
        "Pemandangan sunset dari balkon kamar bener-bener gak ada lawan!",
        "Dapet sarapan nasi kuning yang enak banget, khas masakan lokal."
      ],
      kuliner: [
        "Ikan bakarnya juara dunia! Bumbunya meresap sampai ke tulang.",
        "Sambel matahnya seger banget, pas banget dimakan sama seafood segar.",
        "Porsi melimpah dengan harga yang sangat ramah di kantong.",
        "Tempat makannya asik, dapet view sunset yang cantik banget.",
        "Minuman kelapa mudanya seger pol, pas buat nemenin makan siang di pantai.",
        "Lobster bakarnya fresh banget, dagingnya manis dan gurih.",
        "Pelayanannya cepat padahal lagi ramai pengunjung. Mantap!",
        "Cumi goreng tepungnya krispi di luar, lembut di dalam. Nagih!",
        "Suasana restorannya sangat nyaman, cocok buat makan bareng keluarga.",
        "Es jeruk perasnya asli, seger banget diminum pas cuaca terik."
      ],
      peralatan: [
        "Alat snorkelingnya masih baru-baru dan sangat terawat. Nyaman dipakainya.",
        "Proses sewanya gampang dan cepat. Stafnya juga sangat membantu.",
        "Alat divingnya lengkap dan bersih, jadi berasa lebih aman pas menyelam.",
        "Harga sewa sangat kompetitif dibanding tempat lain di sekitar sini.",
        "Sangat terbantu dengan peralatan yang berkualitas, jadi liburan makin seru.",
        "Fin-nya pas di kaki, nggak bikin lecet. Maskernya juga nggak gampang berembun.",
        "Stafnya pinter milihin ukuran pelampung yang pas buat anak-anak.",
        "Kondisi wetsuit-nya masih bagus dan wangi, nggak bau apek.",
        "Tabung oksigennya penuh dan regulatornya berfungsi dengan sangat baik.",
        "Peralatannya dicek satu-satu sebelum diserahkan, sangat profesional."
      ],
      fotografi: [
        "Hasil fotonya luar biasa! Fotografernya pinter banget ambil angle.",
        "Gak nyangka hasil editannya bakal sekeren ini. Jadi punya stok foto buat IG!",
        "Fotografernya ramah dan sabar banget arahin gaya buat kita yang kaku.",
        "Peralatan kameranya pro, hasilnya jernih banget walau di bawah air.",
        "Proses kirim file fotonya cepet banget, gak pake nunggu lama.",
        "Dapet video drone yang cinematic banget. Keren parah hasilnya!",
        "Fotografernya tau banget spot-spot tersembunyi yang bagus buat difoto.",
        "Editingnya natural, nggak berlebihan. Warna lautnya jadi cakep banget.",
        "Sangat worth it buat mengabadikan momen spesial bareng pasangan.",
        "Kualitas videonya 4K, bener-bener tajam dan jernih suaranya."
      ],
      aktivitas_tur: [
        "Pemandu divingnya sabar banget ngajarin saya yang baru pertama kali coba.",
        "Spot divingnya keren parah! Karangnya masih bagus dan ikannya banyak.",
        "Pengalaman paling tak terlupakan selama di sini. Divexplore emang top!",
        "Semua persiapan keamanan dicek dengan teliti, jadi merasa aman banget.",
        "Sangat worth it! Pelayanan dari awal sampai akhir bener-bener bintang 5.",
        "Melihat penyu berenang dari dekat itu pengalaman yang ajaib banget.",
        "Arus airnya tenang, jadi nyaman buat pemula yang mau belajar diving.",
        "Pemandunya tahu banyak sejarah dan cerita tentang lokasi wisatanya.",
        "Dapet snack dan air mineral juga selama perjalanan. Perhatian banget!",
        "Kapalnya bersih dan mesinnya gak berisik. Perjalanan jadi makin asik."
      ]
    };

    const generalComments = [
      "Pengalaman yang sangat menyenangkan! Pelayanan profesional dan ramah.",
      "Sangat terbantu dengan aplikasi ini, prosesnya gampang banget.",
      "Harga jujur dan gak ada biaya tersembunyi. Mantap pokoknya!",
      "Vendor lokalnya terverifikasi dan kerjanya sangat bagus.",
      "Pasti bakal rekomen ke temen-temen yang mau liburan ke sini.",
      "Gak nyesel pesan lewat Divexplore, praktis dan terpercaya.",
      "Respon admin dan vendornya cepet banget kalau ada pertanyaan."
    ];

    for (let i = 0; i < productRows.length; i++) {
      const prod = productRows[i];
      const category = prod.kategori?.toLowerCase() || 'aktivitas_tur';
      
      // Ambil kumpulan komentar yang sesuai kategori
      const categoryPool = commentsByCategory[category] || generalComments;
      
      // TINGKATKAN JUMLAH: 5 sampai 10 ulasan per produk agar ramai
      const numReviews = Math.floor(Math.random() * 6) + 5; 
      
      for(let j = 0; j < numReviews; j++) {
        const randomUser = touristUsers[Math.floor(Math.random() * touristUsers.length)];
        const randomOrder = orders.find(o => o.user_id === randomUser.id);
        const randomRating = Math.random() > 0.15 ? 5 : (Math.random() > 0.5 ? 4 : 3); // Dominasi 5 star
        
        // Gabungkan pool kategori dengan general agar lebih variatif
        const combinedPool = [...categoryPool, ...generalComments];
        const randomComment = combinedPool[Math.floor(Math.random() * combinedPool.length)];

        reviews.push({
          id: uuidv4(),
          user_id: randomUser.id,
          vendor_id: prod.vendor_id,
          order_id: randomOrder.id,
          product_id: prod.id,
          rating: randomRating,
          komentar: randomComment,
          createdAt: new Date(new Date().getTime() - Math.random() * 8000000000), 
          updatedAt: new Date()
        });
      }
    }

    await queryInterface.bulkInsert("Reviews", reviews);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Reviews", null, {});
    await queryInterface.bulkDelete("Orders", { status: "COMPLETED", total_pembayaran: 500000 }, {});
    await queryInterface.bulkDelete("Users", { email: { [Sequelize.Op.like]: "%@example.com" } }, {});
  }
};
