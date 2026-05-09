"use strict";
const { Vendor, VendorDocument, User } = require("../models");
const { Op } = require("sequelize");

/**
 * Tabel komisi platform per kategori vendor.
 * Sumber: Tim E-Commerce Divexplore.
 * Formula: C% = Mavg - (Whpp + Wrisk + Wvol) + Wfitur
 * Wfitur selalu +2% sebagai kompensasi fitur 3D & sistem bundling.
 */
const KOMISI_PER_KATEGORI = {
  peralatan: 7, // 12.5% - (3.5+0.0+4.0)% + 2% = 7%
  aktivitas_tur: 10, // 17.5% - (5.0+4.5+0.0)% + 2% = 10%
  homestay: 15, // 25.0% - (7.0+0.0+5.0)% + 2% = 15%
  kuliner: 10, // 25.0% - (12.0+0.0+5.0)% + 2% = 10%
  fotografi: 12, // 17.5% - (4.5+3.0+0.0)% + 2% = 12%
};

// List semua vendor beserta status KYC
const getAllVendors = async (query = {}) => {
  const { search, status_kyc } = query;

  // Buat wadah untuk kondisi filter
  const whereCondition = {};
  // Jika ada query filter status_kyc
  if (status_kyc) {
    whereCondition.status_kyc = status_kyc;
  }
  // Jika ada query pencarian (search nama toko)
  if (search) {
    whereCondition.nama_toko = {
      [Op.iLike]: `%${search}%`, // iLike = case insensitive (tidak peduli huruf besar/kecil)
    };
  }
  const vendors = await Vendor.findAll({
    where: whereCondition, // Masukkan kondisi ke sini
    include: [
      { model: User, as: "user", attributes: ["nama_lengkap", "email"] },
      { model: VendorDocument, as: "documents" },
    ],
    order: [["createdAt", "DESC"]],
  });
  return vendors;
};

// Approve atau Reject KYC vendor
const updateKycStatus = async (vendorId, { status_kyc, catatan_admin }) => {
  const validStatuses = ["pending", "approved", "rejected"];
  if (!validStatuses.includes(status_kyc)) {
    const err = new Error(
      "Status KYC tidak valid. Gunakan: pending, approved, rejected.",
    );
    err.statusCode = 400;
    throw err;
  }

  const vendor = await Vendor.findByPk(vendorId, {
    include: [
      { model: User, as: "user", attributes: ["email", "nama_lengkap"] },
    ],
  });
  if (!vendor) {
    const err = new Error("Vendor tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }

  // Update status KYC di vendor
  // Jika di-approve, otomatis isi persentase_komisi berdasarkan kategori vendor
  const updateData = { status_kyc };
  if (status_kyc === "approved") {
    const komisi = KOMISI_PER_KATEGORI[vendor.kategori];
    if (komisi !== undefined) {
      updateData.persentase_komisi = komisi;
    } else {
      // Fallback 10% jika kategori tidak dikenal (safety net)
      updateData.persentase_komisi = 10;
      console.warn(
        `Kategori vendor '${vendor.kategori}' tidak dikenal, komisi default 10% diterapkan.`,
      );
    }
  }
  await vendor.update(updateData);

  // Jika ada catatan admin, update di semua dokumen vendor
  if (catatan_admin) {
    await VendorDocument.update(
      {
        catatan_admin,
        status_verifikasi: status_kyc === "approved" ? "approved" : "rejected",
      },
      { where: { vendor_id: vendorId } },
    );
  }

  // WP-3.1.4: Kirim email notifikasi ke Vendor terkait perubahan status KYC
  if (vendor.user && vendor.user.email) {
    const emailService = require("./emailService");
    const subject = `Update Status Verifikasi KYC - ${vendor.nama_toko}`;
    const textBody = `Halo ${vendor.user.nama_lengkap},\n\nStatus verifikasi (KYC) toko Anda (${vendor.nama_toko}) saat ini telah diperbarui menjadi: ${status_kyc.toUpperCase()}.\n\nCatatan Admin: ${catatan_admin || "-"}\n\nTerima kasih,\nTim Admin Divexplore 3D`;
    emailService.sendGeneralEmail(vendor.user.email, subject, textBody);
  }

  return vendor.reload(); // kembalikan data terbaru
};

/**
 * Laporan GMV (Gross Merchandise Value) & Revenue
 * Menggunakan data VirtualLedger untuk akurasi split payment.
 */
const getGmvReport = async () => {
  const { VirtualLedger } = require("../models");
  const stats = await VirtualLedger.findOne({
    attributes: [
      [sequelize.fn("SUM", sequelize.col("pendapatan_kotor")), "total_gmv"],
      [sequelize.fn("SUM", sequelize.col("potongan_komisi")), "total_revenue"],
      [
        sequelize.fn("SUM", sequelize.col("biaya_midtrans")),
        "total_midtrans_fees",
      ],
      [sequelize.fn("COUNT", sequelize.col("id")), "total_transactions"],
    ],
    raw: true,
  });

  return {
    gmv: parseFloat(stats.total_gmv || 0),
    revenue: parseFloat(stats.total_revenue || 0),
    midtrans_fees: parseFloat(stats.total_midtrans_fees || 0),
    total_transactions: parseInt(stats.total_transactions || 0),
  };
};

/**
 * Mendeteksi Abandoned Carts
 * Order yang berstatus pending dan sudah melewati batas waktu bayar (timeout_at).
 */
const getAbandonedCarts = async () => {
  const { Order, User } = require("../models");
  const abandoned = await Order.findAll({
    where: {
      status: "pending",
      timeout_at: { [Op.lt]: new Date() },
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["nama_lengkap", "email", "nomor_telepon"],
      },
    ],
    order: [["timeout_at", "DESC"]],
  });
  return abandoned;
};

module.exports = {
  getAllVendors,
  updateKycStatus,
  getGmvReport,
  getAbandonedCarts,
};
