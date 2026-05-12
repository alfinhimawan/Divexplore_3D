"use strict";

/**
 * Tabel Komisi Platform per Kategori Vendor.
 * Single Source of Truth — hanya file ini yang mendefinisikan komisi.
 * Digunakan oleh: adminService.js, paymentService.js.
 *
 * Formula: C% = Mavg - (Whpp + Wrisk + Wvol) + Wfitur
 * Wfitur selalu +2% sebagai kompensasi fitur 3D & bundling UMKM.
 */
const KOMISI_PER_KATEGORI = {
  peralatan: 7,
  aktivitas_tur: 10,
  homestay: 15,
  kuliner: 10,
  fotografi: 12,
};

/** Fallback jika kategori vendor tidak terdaftar di tabel komisi. */
const KOMISI_DEFAULT = 10;

/**
 * Mengembalikan persentase komisi berdasarkan kategori vendor.
 * @param {string} kategori - Kategori vendor (contoh: "aktivitas_tur")
 * @returns {number} Persentase komisi (nilai 0-100)
 */
const getKomisiPersen = (kategori = "") => {
  const key = kategori.toLowerCase().replace(/ /g, "_");
  return KOMISI_PER_KATEGORI[key] ?? KOMISI_DEFAULT;
};

module.exports = { KOMISI_PER_KATEGORI, KOMISI_DEFAULT, getKomisiPersen };
