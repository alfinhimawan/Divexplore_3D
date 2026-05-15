"use strict";
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const password_hash = await bcrypt.hash("Vendor@2026", 10);
    const now = new Date();

    const users = [
      {
        id: uuidv4(),
        nama_lengkap: "Budi Santoso",
        email: "wisatawan@divexplore.id",
        password_hash,
        auth_provider: "local",
        google_id: null,
        role: "wisatawan",
        nomor_telepon: "081234560000",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        nama_lengkap: "Ahmad Fauzi",
        email: "v1.aktivitas@divexplore.id",
        password_hash,
        auth_provider: "local",
        google_id: null,
        role: "vendor",
        nomor_telepon: "081234560001",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        nama_lengkap: "Rina Wahyuni",
        email: "v2.peralatan@divexplore.id",
        password_hash,
        auth_provider: "local",
        google_id: null,
        role: "vendor",
        nomor_telepon: "081234560002",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        nama_lengkap: "Dewi Lestari",
        email: "v3.homestay@divexplore.id",
        password_hash,
        auth_provider: "local",
        google_id: null,
        role: "vendor",
        nomor_telepon: "081234560003",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        nama_lengkap: "Bapak Sukardi",
        email: "v4.kuliner@divexplore.id",
        password_hash,
        auth_provider: "local",
        google_id: null,
        role: "vendor",
        nomor_telepon: "081234560004",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        nama_lengkap: "Teguh Prasetyo",
        email: "v5.foto@divexplore.id",
        password_hash,
        auth_provider: "local",
        google_id: null,
        role: "vendor",
        nomor_telepon: "081234560005",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        nama_lengkap: "Ibu Marwah",
        email: "v6.marwah@divexplore.id",
        password_hash,
        auth_provider: "local",
        google_id: null,
        role: "vendor",
        nomor_telepon: "081234560006",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        nama_lengkap: "Admin Oleh-oleh",
        email: "v7.oleholeh@divexplore.id",
        password_hash,
        auth_provider: "local",
        google_id: null,
        role: "vendor",
        nomor_telepon: "081234560007",
        createdAt: now,
        updatedAt: now,
      },
    ];

    await queryInterface.bulkInsert("Users", users);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Users", {
      email: [
        "wisatawan@divexplore.id",
        "v1.aktivitas@divexplore.id",
        "v2.peralatan@divexplore.id",
        "v3.homestay@divexplore.id",
        "v4.kuliner@divexplore.id",
        "v5.foto@divexplore.id",
        "v6.marwah@divexplore.id",
        "v7.oleholeh@divexplore.id",
      ],
    });
  },
};
