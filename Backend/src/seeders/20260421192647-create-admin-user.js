"use strict";
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Hash password — kedua admin pakai password yang sama
    const password_hash = await bcrypt.hash("Admin@Divexplore2026", 12);

    await queryInterface.bulkInsert("Users", [
      {
        id: uuidv4(),
        nama_lengkap: "Super Admin",
        email: "admin@divexplore.id",
        password_hash,
        auth_provider: "local",
        google_id: null,
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        nama_lengkap: "Admin Operasional",
        email: "admin2@divexplore.id",
        password_hash,
        auth_provider: "local",
        google_id: null,
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    // Hapus kedua akun admin saat undo seed
    await queryInterface.bulkDelete("Users", {
      email: ["admin@divexplore.id", "admin2@divexplore.id"],
    });
  },
};
