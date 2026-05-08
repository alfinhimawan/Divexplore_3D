"use strict";
const { sequelize, Withdrawal, Vendor, AuditLog } = require("../models");

/**
 * Vendor request penarikan saldo.
 */
const requestWithdrawal = async (userId, data) => {
  const transaction = await sequelize.transaction();
  try {
    // DISUNTIKKAN: Lock Update agar saldo tidak bisa dimanipulasi (Antigravity)
    const vendor = await Vendor.findOne({ 
      where: { user_id: userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!vendor) throw new Error("Profil vendor tidak ditemukan.");

    const jumlahTarik = parseFloat(data.jumlah);
    if (jumlahTarik <= 0) throw new Error("Jumlah penarikan harus lebih dari 0.");

    if (parseFloat(vendor.saldo_saat_ini) < jumlahTarik) {
      throw new Error(`Saldo tidak mencukupi. Saldo Anda: Rp ${vendor.saldo_saat_ini}`);
    }

    // 1. Kurangi saldo vendor
    await vendor.update({ saldo_saat_ini: parseFloat(vendor.saldo_saat_ini) - jumlahTarik }, { transaction });

    // 2. Buat record withdrawal
    const withdrawal = await Withdrawal.create(
      { vendor_id: vendor.id, ...data, status: "pending" },
      { transaction }
    );

    // 3. Audit Log (Partner)
    await AuditLog.create({
      user_id: userId,
      tabel_terdampak: "Withdrawals",
      data_lama: JSON.stringify({ saldo_awal: parseFloat(vendor.saldo_saat_ini) + jumlahTarik }),
      data_baru: JSON.stringify(withdrawal),
    }, { transaction });

    await transaction.commit();
    return withdrawal;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Admin ambil semua withdrawal (Partner)
 */
const getAllWithdrawals = async ({ status } = {}) => {
  const where = {};
  if (status) where.status = status;

  return await Withdrawal.findAll({
    where,
    include: [
      {
        model: Vendor,
        as: "vendor",
        attributes: ["nama_toko", "no_telepon_bisnis", "saldo_saat_ini"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Admin proses withdrawal.
 */
const processWithdrawal = async (withdrawalId, { status, bukti_transfer_url }, adminId) => {
  const transaction = await sequelize.transaction();
  try {
    const withdrawal = await Withdrawal.findByPk(withdrawalId, {
      include: [{ model: Vendor, as: "vendor" }],
      transaction,
      lock: transaction.LOCK.UPDATE // Lock vendor agar pengembalian saldo aman
    });

    if (!withdrawal) throw new Error("Data withdrawal tidak ditemukan.");
    if (withdrawal.status !== "pending") throw new Error("Withdrawal sudah diproses.");

    // Jika REJECTED -> kembalikan saldo ke vendor
    if (status === "rejected") {
      await withdrawal.vendor.update(
        { saldo_saat_ini: parseFloat(withdrawal.vendor.saldo_saat_ini) + parseFloat(withdrawal.jumlah) },
        { transaction }
      );
    }

    await withdrawal.update({ status, bukti_transfer_url: bukti_transfer_url || null }, { transaction });

    // Audit Log (Partner)
    await AuditLog.create({
      user_id: adminId,
      tabel_terdampak: "Withdrawals",
      data_lama: JSON.stringify({ status: "pending" }),
      data_baru: JSON.stringify({ status, withdrawal_id: withdrawalId }),
    }, { transaction });

    await transaction.commit();
    return withdrawal;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

const getMyWithdrawals = async (userId) => {
  const vendor = await Vendor.findOne({ where: { user_id: userId } });
  if (!vendor) throw new Error("Vendor tidak ditemukan.");
  return await Withdrawal.findAll({
    where: { vendor_id: vendor.id },
    order: [["createdAt", "DESC"]],
  });
};

module.exports = { requestWithdrawal, getMyWithdrawals, getAllWithdrawals, processWithdrawal };
