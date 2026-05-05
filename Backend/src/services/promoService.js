"use strict";
const { Promo } = require("../models");

const createPromo = async (data) => {
  const promo = await Promo.create(data);
  return promo;
};

const getAllPromos = async () => {
  const promos = await Promo.findAll({
    order: [["createdAt", "DESC"]],
  });
  return promos;
};

const updatePromo = async (id, data) => {
  const promo = await Promo.findByPk(id);
  if (!promo) {
    const err = new Error("Promo tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }
  await promo.update(data);
  return promo;
};

const deletePromo = async (id) => {
  const promo = await Promo.findByPk(id);
  if (!promo) {
    const err = new Error("Promo tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }
  await promo.destroy();
  return { message: "Promo berhasil dihapus." };
};

module.exports = {
  createPromo,
  getAllPromos,
  updatePromo,
  deletePromo,
};
