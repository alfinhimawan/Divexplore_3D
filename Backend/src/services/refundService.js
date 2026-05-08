"use strict";
const {
  sequelize,
  Refund,
  Order,
  OrderItem,
  ProductInventory,
  User,
  AuditLog,
} = require("../models");

/**
 * Wisatawan request refund untuk order yang sudah paid.
 */
const requestRefund = async (userId, orderId, alasan_refund) => {
  const order = await Order.findOne({
    where: { id: orderId, user_id: userId },
  });
  if (!order) {
    const err = new Error("Pesanan tidak ditemukan atau bukan milik Anda.");
    err.statusCode = 404;
    throw err;
  }
  if (order.status !== "paid") {
    const err = new Error(
      "Refund hanya bisa dilakukan untuk pesanan yang sudah dibayar.",
    );
    err.statusCode = 400;
    throw err;
  }

  const existing = await Refund.findOne({ where: { order_id: orderId } });
  if (existing) {
    const err = new Error(
      "Permintaan refund untuk pesanan ini sudah pernah diajukan.",
    );
    err.statusCode = 409;
    throw err;
  }

  const refund = await Refund.create({
    order_id: orderId,
    user_id: userId,
    alasan_refund,
    jumlah_refund: order.total_pembayaran,
    status: "pending",
  });

  // PILAR 4 GDPR: Audit Log (Capaian Partner)
  await AuditLog.create({
    user_id: userId,
    tabel_terdampak: "Refunds",
    data_lama: JSON.stringify({ order_status: order.status }),
    data_baru: JSON.stringify(refund),
  });

  return refund;
};

/**
 * Admin ambil semua refund (Capaian Partner)
 */
const getAllRefunds = async ({ status } = {}) => {
  const where = {};
  if (status) where.status = status;

  return await Refund.findAll({
    where,
    include: [
      {
        model: Order,
        as: "order",
        attributes: ["id", "total_pembayaran", "status"],
      },
      { model: User, as: "user", attributes: ["nama_lengkap", "email"] },
    ],
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Admin approve atau reject refund.
 * DISUNTIKKAN: Logika Inventory Release (Capaian Antigravity)
 */
const processRefund = async (refundId, { status, catatan_admin }, adminId) => {
  const transaction = await sequelize.transaction();
  try {
    const refund = await Refund.findByPk(refundId, { transaction });
    if (!refund) throw new Error("Data refund tidak ditemukan.");

    if (refund.status !== "pending") {
      throw new Error("Refund ini sudah diproses sebelumnya.");
    }

    const dataLama = refund.toJSON();

    // 1. Update status refund
    await refund.update({ status, catatan_admin }, { transaction });

    // 2. Jika APPROVED -> Ubah status order & Lepas Inventaris agar bisa dijual lagi
    if (status === "approved") {
      await Order.update(
        { status: "refunded" },
        { where: { id: refund.order_id }, transaction },
      );

      // LOGIKA PELEPASAN STOK (Crucial!)
      const orderItems = await OrderItem.findAll({
        where: { order_id: refund.order_id },
        transaction,
      });
      for (const item of orderItems) {
        const inventory = await ProductInventory.findOne({
          where: { product_id: item.product_id },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (inventory) {
          inventory.available_qty += item.qty; // Stok kembali tersedia
          await inventory.save({ transaction });
        }
      }
    }

    // 3. Audit log (Capaian Partner)
    await AuditLog.create(
      {
        user_id: adminId,
        tabel_terdampak: "Refunds",
        data_lama: JSON.stringify(dataLama),
        data_baru: JSON.stringify(refund),
      },
      { transaction },
    );

    await transaction.commit();
    return refund;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

const getRefundStatus = async (userId, orderId) => {
  const refund = await Refund.findOne({
    where: { order_id: orderId, user_id: userId },
  });
  if (!refund) throw new Error("Permintaan refund tidak ditemukan.");
  return refund;
};

module.exports = {
  requestRefund,
  getRefundStatus,
  getAllRefunds,
  processRefund,
};
