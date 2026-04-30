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

module.exports = {
  createPromo,
  getAllPromos,
};
