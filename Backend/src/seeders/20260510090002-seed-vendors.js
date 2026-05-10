"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    
    const users = await queryInterface.sequelize.query(
      `SELECT id, email FROM "Users"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const getUserId = (email) => {
      const user = users.find(u => u.email === email);
      return user ? user.id : null;
    };

    const vendors = [
      {
        id: uuidv4(),
        user_id: getUserId("v1.aktivitas@divexplore.id"),
        nama_toko: "Gili Dive & Tur Center",
        deskripsi_toko: "Pusat aktivitas bahari dan open tur di kawasan 3 Gili Lombok.",
        nama_penanggung_jawab: "Ahmad Fauzi",
        no_telepon_bisnis: "081234560001",
        kategori: "aktivitas_tur",
        alamat_lengkap: "Pantai Senggigi, Lombok Barat, NTB",
        link_google_maps: "https://maps.google.com/?q=Gili+Trawangan",
        persentase_komisi: 10,
        status_kyc: "approved",
        saldo_saat_ini: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        user_id: getUserId("v2.peralatan@divexplore.id"),
        nama_toko: "Selam Gear Lombok",
        deskripsi_toko: "Sewa & jual perlengkapan selam dan snorkeling berkualitas.",
        nama_penanggung_jawab: "Rina Wahyuni",
        no_telepon_bisnis: "081234560002",
        kategori: "peralatan",
        alamat_lengkap: "Jl. Raya Senggigi No. 12, Lombok Barat",
        link_google_maps: "https://maps.google.com/?q=Senggigi+Lombok",
        persentase_komisi: 7,
        status_kyc: "approved",
        saldo_saat_ini: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        user_id: getUserId("v3.homestay@divexplore.id"),
        nama_toko: "Gili Ocean View Homestay",
        deskripsi_toko: "Penginapan nyaman dengan pemandangan langsung menghadap pantai Gili.",
        nama_penanggung_jawab: "Dewi Lestari",
        no_telepon_bisnis: "081234560003",
        kategori: "homestay",
        alamat_lengkap: "Gili Trawangan, Kab. Lombok Utara, NTB",
        link_google_maps: "https://maps.google.com/?q=Gili+Trawangan",
        persentase_komisi: 15,
        status_kyc: "approved",
        saldo_saat_ini: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        user_id: getUserId("v4.kuliner@divexplore.id"),
        nama_toko: "Warung Seafood Pak Sukardi",
        deskripsi_toko: "Seafood segar hasil tangkapan nelayan lokal dengan sambal rahasia.",
        nama_penanggung_jawab: "Bapak Sukardi",
        no_telepon_bisnis: "081234560004",
        kategori: "kuliner",
        alamat_lengkap: "Pantai Senggigi, Lombok Barat, NTB",
        link_google_maps: "https://maps.google.com/?q=Pantai+Senggigi",
        persentase_komisi: 10,
        status_kyc: "approved",
        saldo_saat_ini: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        user_id: getUserId("v5.foto@divexplore.id"),
        nama_toko: "Gili Photo & Drone Studio",
        deskripsi_toko: "Jasa foto profesional darat, bawah air, dan dokumentasi drone.",
        nama_penanggung_jawab: "Teguh Prasetyo",
        no_telepon_bisnis: "081234560005",
        kategori: "fotografi",
        alamat_lengkap: "Gili Trawangan, Kab. Lombok Utara, NTB",
        link_google_maps: "https://maps.google.com/?q=Gili+Trawangan",
        persentase_komisi: 12,
        status_kyc: "approved",
        saldo_saat_ini: 0,
        createdAt: now,
        updatedAt: now,
      }
    ];

    await queryInterface.bulkInsert("Vendors", vendors);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Vendors", {
      nama_toko: [
        "Gili Dive & Tur Center",
        "Selam Gear Lombok",
        "Gili Ocean View Homestay",
        "Warung Seafood Pak Sukardi",
        "Gili Photo & Drone Studio"
      ]
    });
  }
};
