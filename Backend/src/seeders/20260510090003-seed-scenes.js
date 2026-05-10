"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert("Scenes", [
      {
        id: uuidv4(),
        nama_scene: "Kawasan 3 Gili — Lombok",
        panorama_url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
        is_active: true,
        createdAt: now,
        updatedAt: now,
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Scenes", {
      nama_scene: "Kawasan 3 Gili — Lombok"
    });
  }
};
