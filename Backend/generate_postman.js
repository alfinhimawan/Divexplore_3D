const fs = require('fs');

const collection = {
  info: {
    name: "Divexplore_3D API",
    description: "Koleksi otomatis seluruh 68 endpoint API Divexplore 3D. Terstruktur rapi untuk mempermudah testing lokal.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: [
    { key: "base_url",       value: "http://localhost:5000", type: "string" },
    { key: "admin_token",    value: "", type: "string" },
    { key: "vendor_token",   value: "", type: "string" },  // Token vendor aktif saat ini
    { key: "vendor_v1_token",value: "", type: "string" },  // V1: Aktivitas & Tur
    { key: "vendor_v2_token",value: "", type: "string" },  // V2: Peralatan
    { key: "vendor_v3_token",value: "", type: "string" },  // V3: Homestay
    { key: "vendor_v4_token",value: "", type: "string" },  // V4: Kuliner
    { key: "vendor_v5_token",value: "", type: "string" },  // V5: Fotografi
    { key: "wisatawan_token",value: "", type: "string" },
    { key: "vendor_id",      value: "", type: "string" }
  ],
  item: []
};

// Helper function to create a request
function req(name, method, path, authVar, bodyStr) {
  const request = {
    method,
    header: [],
    url: {
      raw: `{{base_url}}${path}`,
      host: ["{{base_url}}"],
      path: path.split('/').filter(Boolean)
    }
  };

  if (authVar) {
    request.auth = {
      type: "bearer",
      bearer: [ { key: "token", value: `{{${authVar}}}`, type: "string" } ]
    };
  }

  if (bodyStr) {
    request.body = {
      mode: "raw",
      raw: bodyStr,
      options: { raw: { language: "json" } }
    };
  }

  return { name, request };
}

function reqForm(name, method, path, authVar) {
  const request = {
    method,
    header: [],
    url: { raw: `{{base_url}}${path}`, host: ["{{base_url}}"], path: path.split('/').filter(Boolean) },
    body: { mode: "formdata", formdata: [{ key: "file", type: "file", src: [] }] }
  };
  if (authVar) {
    request.auth = { type: "bearer", bearer: [ { key: "token", value: `{{${authVar}}}`, type: "string" } ] };
  }
  return { name, request };
}

// 00 - Health Check
const folder00 = {
  name: "00 - Health Check",
  item: [
    req("Ping Server", "GET", "/"),
    req("Test 404 Route", "GET", "/any-route")
  ]
};

// 01 - Auth (5 Vendor Register + Auth)
const folder01 = {
  name: "01 - Auth",
  item: [
    // === 5 Vendor Register (sesuai Katalog Divexplore) ===
    req("[V1] Register Vendor Aktivitas & Tur", "POST", "/api/auth/register", null,
      JSON.stringify({nama_lengkap: "Admin Tur Gili", email: "vendor.tur@divexplore.com", password: "Password123!"}, null, 2)),
    req("[V2] Register Vendor Peralatan", "POST", "/api/auth/register", null,
      JSON.stringify({nama_lengkap: "Admin Peralatan Selam", email: "vendor.peralatan@divexplore.com", password: "Password123!"}, null, 2)),
    req("[V3] Register Vendor Homestay", "POST", "/api/auth/register", null,
      JSON.stringify({nama_lengkap: "Admin Homestay Gili", email: "vendor.homestay@divexplore.com", password: "Password123!"}, null, 2)),
    req("[V4] Register Vendor Kuliner", "POST", "/api/auth/register", null,
      JSON.stringify({nama_lengkap: "Bapak Sukardi", email: "vendor.kuliner@divexplore.com", password: "Password123!"}, null, 2)),
    req("[V5] Register Vendor Fotografi", "POST", "/api/auth/register", null,
      JSON.stringify({nama_lengkap: "Admin Foto Bawah Air", email: "vendor.foto@divexplore.com", password: "Password123!"}, null, 2)),
    // === Auth Umum ===
    req("Google Login (Wisatawan)", "POST", "/api/auth/google", null, JSON.stringify({id_token: "GOOGLE_ID_TOKEN_HERE"}, null, 2)),
    req("Login Manual", "POST", "/api/auth/login", null, JSON.stringify({email: "admin@divexplore.id", password: "Admin@Divexplore2026"}, null, 2)),
    req("Get My Profile", "GET", "/api/auth/me", "vendor_token"),
    req("Update Profile", "PUT", "/api/auth/me", "vendor_token", JSON.stringify({nomor_telepon: "08123456789"}, null, 2)),
    req("Get Loyalty Points", "GET", "/api/auth/me/points", "wisatawan_token"),
    req("Submit GDPR Consent", "POST", "/api/auth/consent", "wisatawan_token", JSON.stringify({is_agreed: true, policy_version: "v1.0"}, null, 2)),
    req("Soft Delete Account", "DELETE", "/api/auth/account", "wisatawan_token")
  ]
};

// --- Tambahkan Test Scripts untuk Otomatisasi Token ---

// Helper function untuk bikin test script token
function tokenScript(varName, extra = '') {
  return [{
    listen: "test",
    script: {
      exec: [
        "const res = pm.response.json();",
        "if (res.status === 'success') {",
        `    pm.environment.set("${varName}", res.data.token);`,
        `    pm.environment.set("vendor_token", res.data.token); // set aktif`,
        `    console.log("Token ${varName} tersimpan! (vendor_token diupdate)");`,
        extra,
        "}"
      ].filter(Boolean),
      type: "text/javascript"
    }
  }];
}

// [V1] Register Vendor Aktivitas & Tur
folder01.item[0].event = tokenScript("vendor_v1_token");
// [V2] Register Vendor Peralatan
folder01.item[1].event = tokenScript("vendor_v2_token");
// [V3] Register Vendor Homestay
folder01.item[2].event = tokenScript("vendor_v3_token");
// [V4] Register Vendor Kuliner
folder01.item[3].event = tokenScript("vendor_v4_token");
// [V5] Register Vendor Fotografi
folder01.item[4].event = tokenScript("vendor_v5_token");

// Google Login (Wisatawan) — item[5]
folder01.item[5].event = [{ listen: "test", script: { exec: [
  "const res = pm.response.json();",
  "if (res.status === 'success') {",
  "    pm.environment.set(\"wisatawan_token\", res.data.token);",
  "    console.log(\"Token wisatawan tersimpan!\");",
  "}"
], type: "text/javascript" } }];

// Login Manual — item[6] (smart: auto detect role)
folder01.item[6].event = [{ listen: "test", script: { exec: [
  "const res = pm.response.json();",
  "if (res.status === 'success') {",
  "    const role = res.data.user.role;",
  "    pm.environment.set(`${role}_token`, res.data.token);",
  "    if (role === 'vendor') pm.environment.set('vendor_token', res.data.token);",
  "    console.log(`Token ${role} berhasil disimpan!`);",
  "}"
], type: "text/javascript" } }];


// 02 - Vendor (5 profil vendor sesuai katalog)
const folder02 = {
  name: "02 - Vendor",
  item: [
    req("[V1] Init Profil Vendor Aktivitas & Tur", "POST", "/api/vendors", "vendor_token",
      JSON.stringify({nama_toko: "Gili Dive & Tur Center", nama_penanggung_jawab: "Admin Tur Gili", no_telepon_bisnis: "081234567891", kategori: "aktivitas_tur", alamat_lengkap: "Pantai Senggigi, Lombok Barat, NTB", link_google_maps: "https://maps.google.com/gili", deskripsi_toko: "Pusat aktivitas bahari dan open tur di kawasan 3 Gili Lombok"}, null, 2)),
    req("[V2] Init Profil Vendor Peralatan", "POST", "/api/vendors", "vendor_token",
      JSON.stringify({nama_toko: "Selam Gear Lombok", nama_penanggung_jawab: "Admin Peralatan Selam", no_telepon_bisnis: "081234567892", kategori: "peralatan", alamat_lengkap: "Jl. Raya Senggigi No. 12, Lombok", link_google_maps: "https://maps.google.com/selam", deskripsi_toko: "Sewa dan jual perlengkapan selam & snorkeling berkualitas"}, null, 2)),
    req("[V3] Init Profil Vendor Homestay", "POST", "/api/vendors", "vendor_token",
      JSON.stringify({nama_toko: "Gili Ocean View Homestay", nama_penanggung_jawab: "Admin Homestay Gili", no_telepon_bisnis: "081234567893", kategori: "homestay", alamat_lengkap: "Gili Trawangan, Lombok Utara", link_google_maps: "https://maps.google.com/homestay", deskripsi_toko: "Penginapan nyaman dengan pemandangan langsung menghadap pantai Gili"}, null, 2)),
    req("[V4] Init Profil Vendor Kuliner Sukardi", "POST", "/api/vendors", "vendor_token",
      JSON.stringify({nama_toko: "Warung Seafood Pak Sukardi", nama_penanggung_jawab: "Bapak Sukardi", no_telepon_bisnis: "081234567894", kategori: "kuliner", alamat_lengkap: "Pantai Senggigi, Lombok Barat", link_google_maps: "https://maps.google.com/sukardi", deskripsi_toko: "Seafood segar hasil tangkapan nelayan lokal dengan sambal rahasia"}, null, 2)),
    req("[V5] Init Profil Vendor Fotografi", "POST", "/api/vendors", "vendor_token",
      JSON.stringify({nama_toko: "Gili Photo & Drone Studio", nama_penanggung_jawab: "Admin Foto Bawah Air", no_telepon_bisnis: "081234567895", kategori: "fotografi", alamat_lengkap: "Gili Trawangan, Lombok Utara", link_google_maps: "https://maps.google.com/foto", deskripsi_toko: "Jasa foto profesional darat, bawah air, dan dokumentasi drone"}, null, 2)),
    req("Get My Vendor Profile", "GET", "/api/vendors/me", "vendor_token"),
    req("Update Vendor Profile", "PUT", "/api/vendors/me", "vendor_token", JSON.stringify({deskripsi_toko: "Update deskripsi toko"}, null, 2)),
    req("Get Public Vendor Profile", "GET", "/api/vendors/{{vendor_id}}", null),
    req("Upload KYC Document", "POST", "/api/vendors/me/documents", "vendor_token", JSON.stringify({jenis_dokumen: "KTP", file_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg"}, null, 2)),
    req("Get KYC Status", "GET", "/api/vendors/me/documents", "vendor_token"),
    req("Get Vendor Ledgers", "GET", "/api/vendors/me/ledgers", "vendor_token")
  ]
};

// 4. Initialize Vendor Profile
folder02.item[0].event = [{
  listen: "test",
  script: {
    exec: [
      "const res = pm.response.json();",
      "if (res.status === 'success') {",
      "    pm.environment.set(\"vendor_id\", res.data.vendor.id);",
      "    console.log(\"Vendor ID berhasil disimpan:\", res.data.vendor.id);",
      "}"
    ],
    type: "text/javascript"
  }
}];

// 03 - Admin
const folder03 = {
  name: "03 - Admin",
  item: [
    req("Get All Vendors", "GET", "/api/admin/vendors", "admin_token"),
    req("Approve/Reject KYC", "PUT", "/api/admin/vendors/{{vendor_id}}/kyc", "admin_token", JSON.stringify({status_kyc: "approved", catatan_admin: "OK"}, null, 2)),
    req("Get GMV Report", "GET", "/api/admin/reports/gmv", "admin_token"),
    req("Get Abandoned Carts", "GET", "/api/admin/abandoned-carts", "admin_token"),
    req("Trigger Marketing Cron", "POST", "/api/admin/marketing/trigger", "admin_token"),
    req("Get All Refunds", "GET", "/api/admin/refunds", "admin_token"),
    req("Process Refund", "PUT", "/api/admin/refunds/1", "admin_token", JSON.stringify({status_refund: "approved", catatan_admin: "OK"}, null, 2)),
    req("Get All Withdrawals", "GET", "/api/admin/withdrawals", "admin_token"),
    req("Process Withdrawal", "PUT", "/api/admin/withdrawals/1", "admin_token", JSON.stringify({status_penarikan: "completed", bukti_transfer_url: "http..."}, null, 2))
  ]
};

// 04 - Scenes
const folder04 = {
  name: "04 - Scenes & Hotspots (3D)",
  item: [
    req("Get All Scenes", "GET", "/api/scenes"),
    req("Create 3D Scene", "POST", "/api/scenes", "admin_token", JSON.stringify({nama_scene: "Pulau Gili", panorama_url: "http...", is_active: true}, null, 2)),
    req("Update 3D Scene", "PUT", "/api/scenes/1", "admin_token"),
    req("Delete 3D Scene", "DELETE", "/api/scenes/1", "admin_token"),
    req("Add Scene Hotspot", "POST", "/api/scenes/1/hotspots", "admin_token", JSON.stringify({product_id: "UUID", type: "product", coordinates_json: '{"x":1,"y":1,"z":1}'}, null, 2))
  ]
};

// 05 - Products (Katalog Nyata Divexplore 3D)
const folder05 = {
  name: "05 - Products",
  item: [
    req("Get Public Products", "GET", "/api/products"),
    req("Get Product Detail", "GET", "/api/products/1"),
    // === V1: Produk Utama - Aktivitas & Tur (Komisi 10%) ===
    req("[V1] Buat: Island Hopping Sharing", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Open Tur Island Hopping (3 Gili - Sharing Boat)", deskripsi: "Perjalanan keliling 3 pulau menggunakan Glass Bottom Boat. Termasuk singgah di spot patung bawah air (Bask Nest) dan area penyu.", harga: 150000, is_active: true}, null, 2)),
    req("[V1] Buat: Island Hopping Private", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Open Tur Island Hopping (3 Gili - Private Boat)", deskripsi: "Perjalanan private keliling 3 pulau dengan Glass Bottom Boat eksklusif untuk rombongan.", harga: 1200000, is_active: true}, null, 2)),
    req("[V1] Buat: Discovery Scuba Dive (DSD)", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Aktivitas Penyelaman - Discovery Scuba Dive (DSD 1 Log)", deskripsi: "Penyelaman tanpa sertifikasi didampingi Dive Master berlisensi PADI/SSI.", harga: 900000, is_active: true}, null, 2)),
    req("[V1] Buat: Fun Dive", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Aktivitas Penyelaman - Fun Dive (2 Log)", deskripsi: "Penyelaman khusus wisatawan bersertifikasi PADI/SSI didampingi Dive Master profesional.", harga: 1500000, is_active: true}, null, 2)),
    req("[V1] Buat: Jetski", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Aksi Bahari - Jetski (15 Menit)", deskripsi: "Pacu adrenalin di area perairan aman didampingi instruktur berpengalaman.", harga: 250000, is_active: true}, null, 2)),
    req("[V1] Buat: Banana Boat", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Aksi Bahari - Banana Boat (15 Menit, Kapasitas 5 Orang)", deskripsi: "Sensasi meluncur di atas air bersama rombongan.", harga: 75000, is_active: true}, null, 2)),
    req("[V1] Buat: Stand-up Paddle", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Eksplorasi Pesisir - Stand-up Paddle (Per Jam)", deskripsi: "Nikmati perairan dangkal secara ramah lingkungan dengan papan seluncur berdiri.", harga: 100000, is_active: true}, null, 2)),
    req("[V1] Buat: Kayak Transparan", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Eksplorasi Pesisir - Kayak Transparan (Per Jam)", deskripsi: "Menikmati keindahan bawah laut dari atas kayak transparan.", harga: 150000, is_active: true}, null, 2)),
    // === V2: Produk Add-on - Peralatan (Komisi 7%) ===
    req("[V2] Buat: Set Snorkel Premium", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Set Snorkel Premium + Kaki Katak (Sewa/Hari)", deskripsi: "Peralatan dasar menyelam permukaan kualitas kaca anti-embun.", harga: 75000, is_active: true}, null, 2)),
    req("[V2] Buat: Kamera Aksi GoPro", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Kamera Aksi GoPro/Insta360 (Sewa/Hari)", deskripsi: "Dokumentasikan aksi bawah air tanpa khawatir merusak HP pribadi.", harga: 200000, is_active: true}, null, 2)),
    req("[V2] Buat: Dry Bag", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Dry Bag Tas Anti Air 10L (Beli Putus)", deskripsi: "Tas kedap air untuk melindungi barang berharga di atas kapal.", harga: 85000, is_active: true}, null, 2)),
    req("[V2] Buat: Sunblock Terumbu Karang", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Sunblock Ramah Terumbu Karang (Beli Putus)", deskripsi: "Tabir surya khusus yang tidak merusak ekosistem koral.", harga: 120000, is_active: true}, null, 2)),
    req("[V2] Buat: Rash Guard", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Rash Guard / Wetsuit Ringan (Sewa/Hari)", deskripsi: "Pelindung dari sengatan ubur-ubur dan paparan sinar UV matahari.", harga: 50000, is_active: true}, null, 2)),
    // === V3: Produk Add-on - Homestay (Komisi 15%) ===
    req("[V3] Buat: Standard Garden View", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Kamar Standard Garden View", deskripsi: "Kamar standar dengan pemandangan taman yang asri dan nyaman.", harga: 400000, is_active: true}, null, 2)),
    req("[V3] Buat: Deluxe Ocean View", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Kamar Deluxe Ocean View (Kapasitas 2 Orang)", deskripsi: "Kamar luas dengan balkon langsung menghadap pantai, sudah termasuk sarapan.", harga: 850000, is_active: true}, null, 2)),
    req("[V3] Buat: Private Family Bungalow", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Private Family Bungalow (Kapasitas 4 Orang)", deskripsi: "Bungalow mewah dengan fasilitas kolam renang pribadi dan ruang keluarga.", harga: 2000000, is_active: true}, null, 2)),
    req("[V3] Buat: Paket Spa/Sauna", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "[Add-on] Paket Spa & Sauna", deskripsi: "Paket pemulihan relaksasi otot tubuh pasca-aktivitas menyelam.", harga: 250000, is_active: true}, null, 2)),
    // === V4: Produk - Kuliner (Komisi 10%) ===
    req("[V4] Buat: Seafood Platter Sukardi", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Paket Seafood Platter Saus Sukardi (2 Orang)", deskripsi: "Kombinasi udang, cumi, dan kerang dengan saus pedas rahasia khas Pak Sukardi.", harga: 250000, is_active: true}, null, 2)),
    req("[V4] Buat: Kepiting Saus Padang", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Kepiting Saus Padang Pesisir", deskripsi: "Kepiting bakau hasil tangkapan nelayan lokal dengan bumbu saus padang pedas manis.", harga: 150000, is_active: true}, null, 2)),
    req("[V4] Buat: Hampers Bahari", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "[Bundling] Hampers Bahari (Dodol + Sambal + Abon + Kerupuk + Totebag)", deskripsi: "Paket oleh-oleh lengkap hasil laut Lombok yang dikemas eksklusif.", harga: 200000, is_active: true}, null, 2)),
    // === V5: Produk - Fotografi (Komisi 12%) ===
    req("[V5] Buat: Fotografer Darat", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Fotografer Darat / Pantai (Per Jam)", deskripsi: "Sesi foto di pesisir menggunakan kamera Mirrorless/DSLR profesional.", harga: 300000, is_active: true}, null, 2)),
    req("[V5] Buat: Foto Bawah Air", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Pendampingan Foto Bawah Air (Per Jam)", deskripsi: "Fotografer bersertifikat menyelam menggunakan Underwater Housing.", harga: 500000, is_active: true}, null, 2)),
    req("[V5] Buat: Dokumentasi Drone", "POST", "/api/products", "vendor_token",
      JSON.stringify({nama_produk: "Dokumentasi Udara - Drone DJI (Per Jam)", deskripsi: "Rekaman video estetik dari atas pulau oleh pilot DJI Drone Profesional.", harga: 600000, is_active: true}, null, 2)),
    // === Endpoint Umum ===
    req("Update Product", "PUT", "/api/products/1", "vendor_token", JSON.stringify({is_active: true}, null, 2)),
    req("Delete Product", "DELETE", "/api/products/1", "vendor_token"),
    req("Add Bundling Rule", "POST", "/api/products/1/bundling", "vendor_token", JSON.stringify({addon_id: "GANTI-DENGAN-UUID-ADDON"}, null, 2)),
    req("Record Product Visit", "POST", "/api/products/1/visit", "wisatawan_token"),
    req("Get Product Addons", "GET", "/api/products/1/addons"),
    req("Create Product Addon", "POST", "/api/products/1/addons", "vendor_token", JSON.stringify({nama_addon: "Sewa Kamera GoPro", harga: 200000, tipe_addon: "peralatan"}, null, 2)),
    req("Update Product Addon", "PUT", "/api/products/1/addons/1", "vendor_token"),
    req("Delete Product Addon", "DELETE", "/api/products/1/addons/1", "vendor_token"),
    req("Get Product Reviews", "GET", "/api/products/1/reviews")
  ]
};

// 06 - Inventory
const folder06 = {
  name: "06 - Inventory",
  item: [
    req("Manage Daily Inventory", "POST", "/api/vendors/me/products/1/inventory", "vendor_token", JSON.stringify({tanggal: "2026-10-10", total_qty: 50}, null, 2))
  ]
};

// 07 - Promos
const folder07 = {
  name: "07 - Promos",
  item: [
    req("Get Active Promos", "GET", "/api/promos"),
    req("Create Promo Code", "POST", "/api/promos", "admin_token", JSON.stringify({kode_promo: "SUMMER3D", diskon_persen: 10, valid_until: "2026-12-31"}, null, 2)),
    req("Update Promo Code", "PUT", "/api/promos/1", "admin_token"),
    req("Delete Promo Code", "DELETE", "/api/promos/1", "admin_token")
  ]
};

// 08 - Orders
const folder08 = {
  name: "08 - Orders",
  item: [
    req("Checkout", "POST", "/api/orders", "wisatawan_token", JSON.stringify({items: [{product_id: "UUID", qty: 2}]}, null, 2)),
    req("Get My Order History", "GET", "/api/orders/me", "wisatawan_token"),
    req("Download Invoice PDF", "GET", "/api/orders/1/invoice", "wisatawan_token"),
    req("Request Order Refund", "POST", "/api/orders/1/refund", "wisatawan_token", JSON.stringify({alasan_refund: "Batal karena hujan"}, null, 2)),
    req("Check Refund Status", "GET", "/api/orders/1/refund-status", "wisatawan_token"),
    req("Submit Order Review", "POST", "/api/orders/1/reviews", "wisatawan_token", JSON.stringify({product_id: "UUID", rating: 5, komentar: "Bagus"}, null, 2)),
    req("Get Vendor Incoming Orders", "GET", "/api/orders/vendor", "vendor_token"),
    req("Get All Orders", "GET", "/api/orders/admin", "admin_token")
  ]
};

// 09 - Payments
const folder09 = {
  name: "09 - Payments",
  item: [
    req("Midtrans Webhook Callback", "POST", "/api/webhooks/midtrans", null, JSON.stringify({order_id: "1", transaction_status: "settlement", signature_key: "MOCK"}, null, 2))
  ]
};

// 10 - Reviews
const folder10 = {
  name: "10 - Reviews",
  item: [
    req("Submit Review", "POST", "/api/orders/1/reviews", "wisatawan_token", JSON.stringify({product_id: "UUID", rating: 5}, null, 2)),
    req("Get Product Reviews", "GET", "/api/products/1/reviews")
  ]
};

// 11 - Vendor Dashboard
const folder11 = {
  name: "11 - Vendor Dashboard",
  item: [
    req("View Commission Ledger", "GET", "/api/vendors/me/ledgers", "vendor_token"),
    req("Request Fund Withdrawal", "POST", "/api/vendors/me/withdrawals", "vendor_token", JSON.stringify({jumlah: 100000, nama_bank: "BCA", nomor_rekening: "123"}, null, 2)),
    req("View Withdrawal History", "GET", "/api/vendors/me/withdrawals", "vendor_token"),
    req("Set Cross-Selling Rule", "POST", "/api/vendors/me/products/1/cross-selling", "vendor_token", JSON.stringify({addon_id: "UUID"}, null, 2))
  ]
};

// 12 - Media Uploads
const folder12 = {
  name: "12 - Media Uploads",
  item: [
    reqForm("Upload Foto Profil", "POST", "/api/upload/profile", "wisatawan_token"),
    reqForm("Upload Foto Produk", "POST", "/api/upload/product", "vendor_token"),
    reqForm("Upload Dokumen KYC", "POST", "/api/upload/document", "vendor_token"),
    reqForm("Upload Panorama 360", "POST", "/api/upload/panorama", "admin_token"),
    reqForm("Upload 3D Asset", "POST", "/api/upload/3d-model", "admin_token")
  ]
};

collection.item.push(
  folder00, folder01, folder02, folder03, folder04, folder05, folder06, 
  folder07, folder08, folder09, folder10, folder11, folder12
);

fs.writeFileSync('Divexplore_3D_Collection.json', JSON.stringify(collection, null, 2));
console.log("Postman Collection generated successfully: Divexplore_3D_Collection.json");
