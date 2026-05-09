# DIVEXPLORE-3D — Enterprise Backend API

> RESTful API tingkat lanjut (Enterprise-Grade) untuk ekosistem marketplace wisata bahari terintegrasi dengan katalog 3D interaktif. Mengakomodasi arsitektur multi-vendor, inventory locking real-time, virtual ledger, dan audit log keamanan.

---

## 🚀 Enterprise Features (Fitur Unggulan)

- **ACID Transactions & Row-Level Locking**: Menggunakan `transaction.LOCK.UPDATE` untuk mencegah *Double Booking* dan *Race Condition* saat 1.000 user checkout bersamaan.
- **Buffer-Streaming PDF Generator**: Struk PDF (*Invoice*) digenerate murni di memori RAM server menggunakan Buffer, membebaskan server dari tumpukan file fisik.
- **Asynchronous Webhook Processing**: Menangkap notifikasi Midtrans secara *non-blocking* dan mengirimkan Email via *Nodemailer* tanpa memperlambat respon *Payment Gateway*.
- **Zero-Data Storage (PCI-DSS Compliance)**: Tidak ada satupun kolom *Credit Card* yang disimpan di database lokal.
- **Role-Based Access Control (RBAC)**: Pemisahan akses tingkat tinggi antara Admin, Wisatawan (B2C), dan Vendor (B2B). 
- **Google Identity Services (GIS)**: Autentikasi modern Oauth 2.0 (Google Login) khusus untuk Wisatawan agar minim friksi (*Frictionless*).
- **Automated Virtual Ledger**: Algoritma pembagian dana *Split Payment* otomatis (Komisi Platform vs Pendapatan Bersih Vendor).
- **GDPR Compliance (Pilar 1-5)**: Implementasi *Right to be Forgotten* (Soft Delete), *Audit Logs* aktivitas sensitif, dan sistem *Consent* (Persetujuan Kebijakan).
- **Refund & Withdrawal Workflow**: Alur pengembalian dana wisatawan dan penarikan dana vendor yang aman dengan *Database Lock* dan *Inventory Release* otomatis.
- **Real-Time Inventory Locking**: Penguncian stok otomatis selama 15 menit saat checkout untuk menjamin ketersediaan kuota bagi pembeli.
- **Order Expiration Automation**: Cron Job berjalan setiap 5 menit untuk membatalkan order expired dan melepas stok yang terkunci secara otomatis.
- **ProductAddon Bundling**: Wisatawan dapat memilih layanan tambahan (Sewa Kamera, Guide, Souvenir) dalam satu keranjang belanja terintegrasi.

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|---|---|
| **Runtime** | Node.js v24 |
| **Framework** | Express.js v5 |
| **Database** | PostgreSQL |
| **Cloud Storage** | Cloudinary (Image, PDF, 3D Assets) |
| **ORM** | Sequelize v6 + Sequelize CLI |
| **Authentication** | JWT (`jsonwebtoken`) + Google OAuth 2.0 (`google-auth-library`) |
| **Input Validation** | Joi |
| **Payment Gateway** | Midtrans API (Snap & Core API) |
| **Document Generator** | PDFKit (Buffer Streaming) |
| **Email Services** | Nodemailer |
| **Task Scheduler** | node-cron (Order Expiration + Marketing Automation) |
| **Logging** | Winston (file + console, level-based) |
| **Security** | Helmet, cors, express-rate-limit, bcrypt |

---

## 🏗️ System Architecture (Arsitektur Sistem)

```mermaid
graph TD
    Client[Frontend / Wisatawan / Vendor] -->|REST API| API[Node.js Express Backend]
    
    subgraph "Internal Infrastructure"
        API <-->|Read / Write| DB[(PostgreSQL Database)]
        Cron[Node-Cron Scheduler] -->|Release Inventory| DB
    end
    
    subgraph "External Cloud Services"
        API <-->|Stream / Fetch| Cloudinary[Cloudinary Cloud Storage]
        API <-->|Charge / Webhook| Midtrans[Midtrans Payment Gateway]
        API -->|Buffer to PDF| Mailer[SMTP Email Service]
        Cron -->|Marketing / Retargeting| Mailer
    end
```

---

## ⚙️ Setup & Instalasi Lokal

### 1. Prasyarat
- [Node.js v24+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/) (berjalan lokal / via DBeaver)
- Akun Google Cloud Console (untuk OAuth)
- Akun Midtrans (Sandbox)
- Akun Cloudinary (Free Tier)

### 2. Clone Repository
```bash
git clone <url-repository>
cd Divexplore_3D/Backend
npm install
```

### 3. Konfigurasi Environment Variables
Salin template `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

### 4. Setup Database
Buka DBeaver atau PostgreSQL CLI, lalu jalankan:
```sql
CREATE DATABASE divexplore_db;
```

Lalu di terminal:
```bash
# Menghapus, membangun ulang, dan mengisi data dummy
npm run db:migrate:undo:all
npm run db:migrate
npm run db:seed
```

### 5. Menyalakan Server
```bash
npm run dev     # Development (auto-restart dengan nodemon)
npm run start   # Production
```

Server berjalan di: **http://localhost:5000**

---

## 🔑 Environment Variables

Lihat file [`.env.example`](.env.example) untuk daftar lengkap. Berikut yang wajib diisi:

| Variable | Contoh | Keterangan |
|---|---|---|
| `DB_USERNAME` | `postgres` | Username PostgreSQL |
| `DB_PASSWORD` | `password` | Password PostgreSQL |
| `DB_HOST` | `127.0.0.1` | Host database |
| `DB_PORT` | `5432` | Port PostgreSQL |
| `DB_NAME` | `divexplore_db` | Nama database |
| `PORT` | `5000` | Port server |
| `NODE_ENV` | `development` | Environment |
| `JWT_SECRET` | *(generate via crypto)* | Secret key JWT — minimal 64 karakter |
| `JWT_EXPIRES_IN` | `7d` | Durasi token |
| `GOOGLE_CLIENT_ID` | *(dari Google Console)* | Untuk Google OAuth |
| `MIDTRANS_SERVER_KEY`| *(dari Midtrans Sandbox)* | Server Key — jangan pernah expose ke frontend |
| `MIDTRANS_CLIENT_KEY`| *(dari Midtrans Sandbox)* | Client Key — aman dikirim ke frontend |
| `MIDTRANS_MERCHANT_ID`| `M3XXXXX` | Merchant ID dari dashboard Midtrans |

> ⚠️ **JANGAN** commit file `.env` ke GitHub. File ini sudah di-exclude via `.gitignore`.

---

## 🔐 Cara Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Salin output-nya ke variabel `JWT_SECRET` di file `.env`.

---

## 📜 Scripts

```bash
# Development
npm run dev                   # Jalankan server dengan auto-restart

# Database
npm run db:migrate            # Jalankan semua migration
npm run db:migrate:undo       # Undo migration terakhir
npm run db:migrate:undo:all   # Undo semua migration
npm run db:migrate:status     # Cek status migration

# Seeder
npm run db:seed               # Jalankan semua seeder
npm run db:seed:undo          # Hapus semua data seeder
```

---

## 📁 Struktur Direktori

```
Backend/
├── logs/                         # Log file (auto-generated, tidak di-commit)
│   ├── combined.log              # Semua log level
│   └── error.log                 # Hanya error level
├── src/
│   ├── config/
│   │   └── config.js             # Konfigurasi koneksi DB per environment
│   ├── controllers/              # Handler HTTP request/response
│   │   ├── addonController.js    # CRUD add-on produk
│   │   ├── adminController.js    # Dashboard & laporan admin
│   │   ├── authController.js     # Register, Login, Google OAuth, GDPR
│   │   ├── orderController.js    # Checkout, invoice, riwayat
│   │   ├── productController.js  # CRUD produk & bundling
│   │   ├── promoController.js    # CRUD kode promo
│   │   ├── refundController.js   # Pengajuan & proses refund
│   │   ├── reviewController.js   # Ulasan & rating produk
│   │   ├── sceneController.js    # CRUD scene & hotspot 3D
│   │   ├── vendorController.js   # Profil vendor & KYC
│   │   └── withdrawalController.js # Penarikan dana vendor
│   ├── middlewares/
│   │   ├── authenticate.js       # JWT auth guard + role authorization (RBAC)
│   │   └── errorHandler.js       # Global error handler (catch-all)
│   ├── migrations/               # Migration file Sequelize (26 file, 21 tabel)
│   ├── models/                   # Model Sequelize (ORM mapping ke DB)
│   │   ├── auditlog.js           # Log aktivitas sensitif
│   │   ├── loyaltypoint.js       # Poin reward wisatawan
│   │   ├── order.js              # Header transaksi
│   │   ├── orderitem.js          # Detail item + metadata add-on
│   │   ├── product.js            # Katalog produk wisata
│   │   ├── productaddon.js       # Layanan tambahan produk
│   │   ├── productinventory.js   # Stok & kuota
│   │   ├── productvisit.js       # Log kunjungan produk (marketing)
│   │   ├── promo.js              # Kode diskon
│   │   ├── refund.js             # Pengajuan refund
│   │   ├── review.js             # Ulasan & rating
│   │   ├── scene.js              # Ruangan 3D
│   │   ├── scene3dhotspot.js     # Titik interaktif di scene
│   │   ├── user.js               # Data user (semua role)
│   │   ├── userconsent.js        # GDPR consent log
│   │   ├── vendor.js             # Profil bisnis vendor
│   │   ├── vendordocument.js     # Dokumen KYC
│   │   ├── virtualledger.js      # Buku kas virtual
│   │   └── withdrawal.js         # Request penarikan dana
│   ├── routes/                   # Definisi endpoint API
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── paymentRoutes.js      # Midtrans webhook
│   │   ├── productRoutes.js
│   │   ├── promoRoutes.js
│   │   ├── sceneRoutes.js
│   │   └── vendorRoutes.js
│   ├── seeders/                  # Data dummy untuk development & testing
│   ├── services/                 # Business logic (tidak boleh ada di controller)
│   │   ├── addonService.js       # Logika CRUD add-on
│   │   ├── authService.js        # Logika registrasi, login, JWT
│   │   ├── cronService.js        # Semua Cron Job (expiration + marketing)
│   │   ├── emailService.js       # Nodemailer wrapper
│   │   ├── marketingService.js   # Strategi retargeting & loyalty
│   │   ├── orderService.js       # Checkout engine + Midtrans integration
│   │   ├── reviewService.js      # Ulasan + kalkulasi rating vendor
│   │   ├── sceneService.js       # Logika scene & hotspot
│   │   └── vendorService.js      # Profil & KYC vendor
│   └── utils/
│       └── logger.js             # Winston logger (file + console)
├── .env                          # Environment variables (tidak di-commit)
├── .env.example                  # Template .env untuk tim
├── .gitignore
├── .sequelizerc                  # Konfigurasi path Sequelize CLI
├── package.json
└── server.js                     # Entry point: middleware, routes, cron, graceful shutdown
```

---

## 🗄️ Skema Database (21 Tabel)

| Domain | Tabel |
|---|---|
| **Inti (Core)** | `Users`, `Vendors` |
| **Katalog & 3D** | `Scenes`, `Products`, `Product3dHotspots`, `CrossSellingRules` |
| **Inventory** | `ProductInventories` |
| **Transaksi** | `Orders`, `OrderItems`, `Promos` |
| **Keuangan & Loyalty**| `VirtualLedgers`, `LoyaltyPoints`, `Refunds`, `Withdrawals` |
| **Keamanan & GDPR** | `AuditLogs`, `UserConsents`, `VendorDocuments` |
| **Log & Marketing** | `PaymentLogs`, `Reviews`, `ProductVisits` |

---

## 🌐 API Testing Guide (Postman Structure)

> 💡 **Katalog Produk E-Commerce (Testing Data)**  
> Untuk memudahkan pengujian endpoint `POST /api/products` dan `POST /api/products/:id/addons`, Anda dapat menyalin *raw JSON Payload* yang berisi data produk resmi dari tim E-Commerce dengan membuka menu di bawah ini:
>
> <details>
> <summary><b>📦 Buka Data Lengkap JSON Payload Produk (Semua Vendor)</b></summary>
> 
> ### 1. Vendor Aktivitas & Open Tur
> ```json
> {"nama_produk": "Open Tur Island Hopping (Sharing Boat)", "deskripsi": "Keliling 3 pulau dengan Glass Bottom Boat. Harga 1 pax.", "harga": 150000, "is_active": true}
> {"nama_produk": "Open Tur Island Hopping (Private Boat)", "deskripsi": "Perjalanan keliling 3 pulau secara private. Harga 1 kapal.", "harga": 1200000, "is_active": true}
> {"nama_produk": "Discovery Scuba Dive (DSD) 1 Log", "deskripsi": "Penyelaman tanpa sertifikasi didampingi Dive Master PADI.", "harga": 900000, "is_active": true}
> {"nama_produk": "Fun Dive (2 Log)", "deskripsi": "Penyelaman khusus wisatawan bersertifikasi.", "harga": 1500000, "is_active": true}
> {"nama_produk": "Sewa Jetski (15 Menit)", "deskripsi": "Pacu adrenalin di perairan aman didampingi instruktur.", "harga": 250000, "is_active": true}
> {"nama_produk": "Banana Boat", "deskripsi": "Kapasitas 5 orang selama 15 menit.", "harga": 75000, "is_active": true}
> {"nama_produk": "Stand-up Paddle", "deskripsi": "Eksplorasi laut dangkal secara ramah lingkungan. Harga per jam.", "harga": 100000, "is_active": true}
> {"nama_produk": "Kayak Transparan", "deskripsi": "Menikmati pemandangan bawah laut dari atas kayak transparan. Harga per jam.", "harga": 150000, "is_active": true}
> ```
> 
> ### 2. Vendor Peralatan & Perlengkapan (Add-on)
> ```json
> {"nama_produk": "Set Snorkel Premium + Kaki Katak", "deskripsi": "Sewa harian peralatan dasar dengan kualitas kaca anti-embun.", "harga": 75000, "is_active": true}
> {"nama_produk": "Kamera Aksi (GoPro/Insta360)", "deskripsi": "Sewa harian dokumentasi aksi bawah air.", "harga": 200000, "is_active": true}
> {"nama_produk": "Dry Bag (Tas Anti Air 10L)", "deskripsi": "Tas kedap air pelindung barang. Beli putus.", "harga": 85000, "is_active": true}
> {"nama_produk": "Sunblock Ramah Terumbu Karang", "deskripsi": "Tabir surya aman untuk koral. Beli putus.", "harga": 120000, "is_active": true}
> {"nama_produk": "Rash Guard / Wetsuit Ringan", "deskripsi": "Pakaian pelindung ubur-ubur & sinar UV. Sewa harian.", "harga": 50000, "is_active": true}
> ```
> 
> ### 3. Vendor Akomodasi Homestay
> ```json
> {"nama_produk": "Standard Garden View", "deskripsi": "Kamar standar dengan pemandangan taman.", "harga": 400000, "is_active": true}
> {"nama_produk": "Deluxe Ocean View", "deskripsi": "Kamar luas balkon pantai, termasuk sarapan. Kapasitas 2 Org.", "harga": 850000, "is_active": true}
> {"nama_produk": "Private Family Bungalow", "deskripsi": "Bungalow mewah kolam renang pribadi. Kapasitas 4 Org.", "harga": 2000000, "is_active": true}
> {"nama_produk": "[Add-on] Paket Spa / Sauna", "deskripsi": "Relaksasi otot tubuh pasca-aktivitas menyelam.", "harga": 250000, "is_active": true}
> ```
> 
> ### 4. Vendor Kuliner & Oleh-Oleh (UMKM)
> ```json
> // Sambal Seafood Pak Sukardi
> {"nama_produk": "Paket Seafood Platter Saus Sukardi", "deskripsi": "Kombinasi udang, cumi, kerang saus pedas (2 Orang).", "harga": 250000, "is_active": true}
> {"nama_produk": "Kepiting Saus Padang Pesisir", "deskripsi": "Kepiting bakau bumbu saus padang.", "harga": 150000, "is_active": true}
> {"nama_produk": "Cumi Bakar Madu Pedas", "deskripsi": "Cumi utuh dibakar olesan madu dan sambal terasi.", "harga": 75000, "is_active": true}
> {"nama_produk": "Udang Bakar Jimbaran", "deskripsi": "Udang besar bumbu kuning plus sambal matah.", "harga": 85000, "is_active": true}
> {"nama_produk": "Plecing Kangkung Seafood", "deskripsi": "Kangkung segar dengan taburan udang rebon.", "harga": 25000, "is_active": true}
> {"nama_produk": "Es Kuwut Khas Lombok", "deskripsi": "Serutan kelapa, melon, selasih, perasan jeruk nipis.", "harga": 25000, "is_active": true}
> 
> // Warung Ikan Bakar Ibu Marwah
> {"nama_produk": "Ikan Kerapu Bakar Bumbu Taliwang", "deskripsi": "Kerapu bakar pedas khas Taliwang plus nasi.", "harga": 90000, "is_active": true}
> {"nama_produk": "Ikan Kakap Merah Bakar Kecap", "deskripsi": "Kakap segar bakar kecap manis gurih.", "harga": 85000, "is_active": true}
> {"nama_produk": "Sate Pusut Ikan Marlin", "deskripsi": "Sate lilit daging marlin cincang (5 tusuk).", "harga": 40000, "is_active": true}
> {"nama_produk": "Ikan Baronang Bakar Rica-Rica", "deskripsi": "Ikan baronang bakar siraman bumbu rica-rica pedas.", "harga": 80000, "is_active": true}
> {"nama_produk": "Sup Ikan Kuah Asam", "deskripsi": "Sup ikan laut bening rasa asam pedas.", "harga": 60000, "is_active": true}
> {"nama_produk": "Es Kelapa Muda Jeruk Nipis", "deskripsi": "Kelapa utuh dingin perasan jeruk nipis.", "harga": 20000, "is_active": true}
> 
> // Oleh-Oleh Bahari DIVEXPLORER
> {"nama_produk": "Dodol Rumput Laut Premium", "deskripsi": "Camilan ekstrak rumput laut asli Lombok.", "harga": 40000, "is_active": true}
> {"nama_produk": "Sambal Roa Pesisir Lombok", "deskripsi": "Sambal botol ikan roa asap.", "harga": 35000, "is_active": true}
> {"nama_produk": "Kerupuk Kulit Ikan Tenggiri", "deskripsi": "Kerupuk renyah kulit ikan laut segar.", "harga": 30000, "is_active": true}
> {"nama_produk": "Abon Ikan Tuna Pedas Manis", "deskripsi": "Lauk awetan ikan tuna pilihan 250gr.", "harga": 45000, "is_active": true}
> {"nama_produk": "Ikan Asin Tenggiri Belah", "deskripsi": "Ikan asin kualitas ekspor kemasan vakum.", "harga": 50000, "is_active": true}
> {"nama_produk": "Teri Crispy Balado Daun Jeruk", "deskripsi": "Camilan teri kering balado daun jeruk.", "harga": 25000, "is_active": true}
> {"nama_produk": "Kopi Bubuk Rumput Laut", "deskripsi": "Kopi Robusta dipadu ekstrak rumput laut.", "harga": 30000, "is_active": true}
> {"nama_produk": "Cumi Asin Kering Premium", "deskripsi": "Cumi asin kualitas super 200gr.", "harga": 60000, "is_active": true}
> {"nama_produk": "Keripik Teripang Emas", "deskripsi": "Camilan bergizi tinggi dari teripang laut.", "harga": 75000, "is_active": true}
> {"nama_produk": "[Bundling] Hampers Bahari", "deskripsi": "Dodol, Sambal, Abon, Kerupuk gratis totebag.", "harga": 200000, "is_active": true}
> ```
> 
> ### 5. Vendor Fotografi & Dokumentasi
> ```json
> {"nama_produk": "Fotografer Darat/Pantai", "deskripsi": "Sesi foto pesisir kamera Mirrorless/DSLR. Sewa per jam.", "harga": 300000, "is_active": true}
> {"nama_produk": "Pendampingan Foto Bawah Air", "deskripsi": "Fotografer bersertifikat menyelam. Sewa per jam.", "harga": 500000, "is_active": true}
> {"nama_produk": "Dokumentasi Udara (Drone)", "deskripsi": "Rekaman video estetik dari atas pulau oleh Pilot DJI profesional. Sewa per jam.", "harga": 600000, "is_active": true}
> ```
> </details>
>
> <details>
> <summary><b>⚙️ Buka Data Lengkap JSON Payload Seluruh Endpoint (Auth, Transaksi, Admin, dsb)</b></summary>
> 
> ### 1. Register Wisatawan (`POST /api/auth/register`)
> ```json
> {
>   "nama_lengkap": "Budi Wisatawan",
>   "email": "budi.wisatawan@divexplore.com",
>   "password": "PasswordRahasia123!",
>   "nomor_telepon": "081234567890",
>   "consent_given": true
> }
> ```
> 
> ### 2. Register Vendor (`POST /api/auth/register-vendor`)
> ```json
> {
>   "nama_lengkap": "Sukardi Seafood",
>   "email": "sukardi.vendor@divexplore.com",
>   "password": "PasswordRahasia123!",
>   "nomor_telepon": "089876543210",
>   "nama_perusahaan": "Warung Seafood Pak Sukardi",
>   "bidang_bisnis": "kuliner",
>   "alamat_operasional": "Pantai Senggigi, Lombok Barat",
>   "consent_given": true
> }
> ```
> 
> ### 3. Login (`POST /api/auth/login`)
> ```json
> {
>   "email": "budi.wisatawan@divexplore.com",
>   "password": "PasswordRahasia123!"
> }
> ```
> 
> ### 4. Checkout Order / Reservasi (`POST /api/orders/checkout`)
> ```json
> {
>   "items": [
>     {
>       "product_id": "UUID-PRODUK-DISINI",
>       "qty": 2
>     }
>   ],
>   "metode_pembayaran": "midtrans"
> }
> ```
> 
> ### 5. Memberi Ulasan (`POST /api/reviews`)
> ```json
> {
>   "order_id": "UUID-ORDER-DISINI",
>   "product_id": "UUID-PRODUK-DISINI",
>   "rating": 5,
>   "komentar": "Pelayanannya sangat bagus, alat snorkelingnya bersih dan perahunya tepat waktu!"
> }
> ```
>
> ### 6. Admin Verifikasi Vendor KYC (`PUT /api/admin/vendors/:id/approve`)
> ```json
> {
>   "status_verifikasi": "approved"
> }
> ```
>
> ### 7. Buat Promo / Voucher (`POST /api/promos`)
> ```json
> {
>   "kode_promo": "SUMMER3D",
>   "tipe_diskon": "percentage",
>   "nilai_diskon": 15,
>   "tanggal_mulai": "2026-06-01",
>   "tanggal_selesai": "2026-06-30",
>   "kuota": 100,
>   "is_active": true
> }
> ```
>
> ### 8. Setup Bundling Add-ons (`POST /api/products/:id/addons`)
> ```json
> {
>   "addon_product_id": "UUID-PRODUK-ADDON-DISINI",
>   "tipe_rekomendasi": "cross_sell",
>   "diskon_bundling": 5000
> }
> ```
>
> ### 9. Vendor Tarik Dana / Withdrawal (`POST /api/withdrawals`)
> ```json
> {
>   "jumlah": 500000,
>   "bank_tujuan": "BCA",
>   "nomor_rekening": "1234567890",
>   "nama_pemilik_rekening": "Pak Sukardi"
> }
> ```
>
> ### 10. Pengajuan Refund (`POST /api/orders/:id/refund`)
> ```json
> {
>   "alasan_refund": "Cuaca buruk, pihak pelabuhan melarang kapal berlayar."
> }
> ```
>
> ### 11. Buat 3D Scene / Ruang Virtual (`POST /api/scenes`)
> ```json
> {
>   "nama_scene": "Pulau Gili Trawangan 360",
>   "deskripsi": "Spot diving dan snorkeling terindah di Gili Trawangan.",
>   "is_active": true
> }
> ```
>
> ### 12. Pasang 3D Hotspot di Model (`POST /api/scenes/:id/hotspots`)
> ```json
> {
>   "product_id": "UUID-PRODUK-DISINI",
>   "posisi_x": 1.5,
>   "posisi_y": 2.0,
>   "posisi_z": -1.0,
>   "judul_hotspot": "Klik untuk sewa Snorkel!"
> }
> ```
> </details>

### 🚦 Standard HTTP Status Codes
Seluruh *endpoint* mematuhi standar RESTful dengan format balasan (Response) JSON terstruktur:
*   `200 OK` / `201 Created` : Operasi berhasil (Format: `{"status": "success", "data": {...}}`).
*   `400 Bad Request` : Input salah / Format file ditolak / Gagal validasi Joi.
*   `401 Unauthorized` : Token JWT tidak ada, kadaluarsa, atau rusak.
*   `403 Forbidden` : Token valid, tapi *Role* tidak memiliki izin akses (RBAC memblokir).
*   `404 Not Found` : Data di tabel atau Rute API tidak ditemukan.
*   `413 Payload Too Large` : File *upload* melebihi batas ukuran (Maks 5MB / 10MB / 30MB).
*   `500 Internal Server Error` : Terjadi kendala teknis pada server atau *database*.

### ⚙️ Postman Environment & Automation Scripts

Untuk mempermudah testing dan menghindari *copy-paste* token manual, silakan buat **Environment** di Postman dengan variabel berikut:

| Variable | Initial Value | Keterangan |
|---|---|---|
| `base_url` | `http://localhost:5000` | URL utama API |
| `admin_token` | *(kosong)* | Terisi otomatis saat admin login |
| `vendor_token` | *(kosong)* | Terisi otomatis saat vendor login/register |
| `wisatawan_token` | *(kosong)* | Terisi otomatis saat wisatawan login |
| `vendor_id` | *(kosong)* | Terisi otomatis saat vendor inisialisasi profil |

💡 **Tips Script Otomatisasi (Tests Tab)**
Tambahkan script berikut di tab **Tests** pada request yang sesuai di Postman agar token tersimpan otomatis ke environment:

**1. Login Manual (`POST /api/auth/login`)**  
Gunakan script ini karena sudah cukup pintar mendeteksi apakah yang login itu Admin atau Vendor:
```javascript
const res = pm.response.json();
if (res.status === "success") {
    const role = res.data.user.role;
    pm.environment.set(`${role}_token`, res.data.token);
    console.log(`Token ${role} berhasil disimpan!`);
}
```

**2. Register Vendor (`POST /api/auth/register`)**
```javascript
const res = pm.response.json();
if (res.status === "success") {
    pm.environment.set("vendor_token", res.data.token);
    console.log("Token vendor berhasil disimpan!");
}
```

**3. Google Login (`POST /api/auth/google`)**
```javascript
const res = pm.response.json();
if (res.status === "success") {
    pm.environment.set("wisatawan_token", res.data.token);
    console.log("Token wisatawan berhasil disimpan!");
}
```

**4. Initialize Vendor Profile (`POST /api/vendors`)**
```javascript
const res = pm.response.json();
if (res.status === "success") {
    pm.environment.set("vendor_id", res.data.vendor.id);
    console.log("Vendor ID berhasil disimpan:", res.data.vendor.id);
}
```

### 🔐 Tips Setup Authorization (Sangat Penting)
Agar tidak perlu memasukkan token satu per satu di setiap request, atur **Authorization** pada tingkat **Folder**:
1. Klik Kanan pada folder Postman (misal: `02 - Vendor`).
2. Pilih tab **Authorization**.
3. Type: pilih **Bearer Token**.
4. Token: ketik `{{vendor_token}}` (Atau `{{admin_token}}` / `{{wisatawan_token}}` sesuai foldernya).
5. Pada semua *request* di dalam folder tersebut, biarkan Authorization-nya berstatus **Inherit auth from parent**.

---

Berikut adalah detail endpoint lengkap sesuai urutan folder pengujian di Postman:

### **📂 00 - Health Check**
| Nama Request | Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|---|
| Ping Server | `GET` | `/` | Health check server aktif | — |
| Test 404 Route | `GET` | `/any-route` | Tes Error Handler (404 Not Found) | — |

### **📂 01 - Auth**
| Nama Request | Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|---|
| Register Vendor | `POST` | `/api/auth/register` | Registrasi manual vendor baru | — |
| Google Login (Wisatawan) | `POST` | `/api/auth/google` | Login via Google (Wisatawan) | — |
| Login Manual | `POST` | `/api/auth/login` | Login manual (Admin/Vendor) | — |
| Get My Profile | `GET` | `/api/auth/me` | Lihat profil user yang sedang aktif | ✅ All |
| Update Profile | `PUT` | `/api/auth/me` | Update profil (Telepon, Alamat, Foto) | ✅ All |
| Get Loyalty Points | `GET` | `/api/auth/me/points` | Lihat saldo loyalty points | ✅ Wisatawan |
| Submit GDPR Consent | `POST` | `/api/auth/consent` | Pencatatan persetujuan privasi | ✅ All |
| Soft Delete Account | `DELETE` | `/api/auth/account` | Hapus akun (Soft Delete - GDPR) | ✅ All |

### **📂 02 - Vendor**
| Nama Request | Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|---|
| Initialize Vendor Profile | `POST` | `/api/vendors` | Inisialisasi profil bisnis vendor | ✅ Vendor |
| Get My Vendor Profile | `GET` | `/api/vendors/me` | Lihat profil bisnis sendiri | ✅ Vendor |
| Update Vendor Profile | `PUT` | `/api/vendors/me` | Update data bisnis/toko | ✅ Vendor |
| Get Public Vendor Profile | `GET` | `/api/vendors/:id` | Lihat profil publik vendor | — |
| Upload KYC Document | `POST` | `/api/vendors/me/documents` | Upload dokumen KYC (KTP/NIB) | ✅ Vendor |
| Get KYC Status | `GET` | `/api/vendors/me/documents` | Lihat status verifikasi dokumen | ✅ Vendor |
| Get Vendor Ledgers | `GET` | `/api/vendors/me/ledgers` | Buku kas & riwayat komisi vendor | ✅ Vendor |

### **📂 03 - Admin**
| Nama Request | Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|---|
| Get All Vendors | `GET` | `/api/admin/vendors` | Lihat daftar seluruh vendor | ✅ Admin |
| Approve/Reject KYC | `PUT` | `/api/admin/vendors/:id/kyc` | Approve/Reject dokumen KYC vendor | ✅ Admin |
| Get GMV Report | `GET` | `/api/admin/reports/gmv` | Analisis omzet (GMV Tracker) | ✅ Admin |
| Get Abandoned Carts | `GET` | `/api/admin/abandoned-carts` | Daftar transaksi tertunda | ✅ Admin |
| Trigger Marketing Cron | `POST` | `/api/admin/marketing/trigger` | Pemicu strategi marketing otomatis | ✅ Admin |
| Get All Refunds | `GET` | `/api/admin/refunds` | Lihat semua pengajuan refund | ✅ Admin |
| Process Refund | `PUT` | `/api/admin/refunds/:id` | Approve/Reject permintaan refund | ✅ Admin |
| Get All Withdrawals | `GET` | `/api/admin/withdrawals` | Lihat semua pengajuan penarikan | ✅ Admin |
| Process Withdrawal | `PUT` | `/api/admin/withdrawals/:id` | Proses transfer dana ke vendor | ✅ Admin |

### **📂 04 - Scenes & Hotspots (3D)**
| Nama Request | Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|---|
| Get All Scenes | `GET` | `/api/scenes` | Daftar semua ruangan 3D | — |
| Create 3D Scene | `POST` | `/api/scenes` | Buat scene 3D baru | ✅ Admin |
| Update 3D Scene | `PUT` | `/api/scenes/:id` | Update data scene 3D | ✅ Admin |
| Delete 3D Scene | `DELETE` | `/api/scenes/:id` | Hapus scene 3D | ✅ Admin |
| Add Scene Hotspot | `POST` | `/api/scenes/:id/hotspots` | Tambah hotspot produk/navigasi ke scene | ✅ Admin |

### **📂 05 - Products**
| Nama Request | Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|---|
| Get Public Products | `GET` | `/api/products` | Katalog produk publik | — |
| Get Product Detail | `GET` | `/api/products/:id` | Detail produk + ulasan + metadata 3D | — |
| Create Product | `POST` | `/api/products` | Vendor menambah produk baru | ✅ Vendor |
| Update Product | `PUT` | `/api/products/:id` | Vendor update data produk | ✅ Vendor |
| Delete Product | `DELETE` | `/api/products/:id` | Vendor menghapus produk | ✅ Vendor |
| Add Bundling Rule | `POST` | `/api/products/:id/bundling` | Menambah aturan bundling produk | ✅ Vendor |
| Record Product Visit | `POST` | `/api/products/:id/visit` | Mencatat kunjungan produk | ✅ All |
| Get Product Addons | `GET` | `/api/products/:productId/addons` | Lihat daftar add-on produk | — |
| Create Product Addon | `POST` | `/api/products/:productId/addons` | Vendor membuat add-on baru | ✅ Vendor |
| Update Product Addon | `PUT` | `/api/products/:productId/addons/:addonId` | Vendor update add-on | ✅ Vendor |
| Delete Product Addon | `DELETE` | `/api/products/:productId/addons/:addonId` | Vendor hapus add-on | ✅ Vendor |
| Get Product Reviews | `GET` | `/api/products/:productId/reviews` | Lihat ulasan publik produk | — |

### **📂 06 - Inventory**
| Nama Request | Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|---|
| Manage Daily Inventory | `POST` | `/api/vendors/me/products/:id/inventory` | Atur kuota stok per tanggal | ✅ Vendor |

### **📂 07 - Promos**
| Nama Request | Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|---|
| Get Active Promos | `GET` | `/api/promos` | Melihat daftar promo yang aktif | — |
| Create Promo Code | `POST` | `/api/promos` | Admin membuat kode diskon baru | ✅ Admin |
| Update Promo Code | `PUT` | `/api/promos/:id` | Admin memperbarui promo | ✅ Admin |
| Delete Promo Code | `DELETE` | `/api/promos/:id` | Admin menghapus promo | ✅ Admin |

### **📂 08 - Orders**
| Nama Request | Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|---|
| Checkout (Midtrans Snap) | `POST` | `/api/orders` | Checkout & Snap Midtrans (Inventory Locking) | ✅ Wisatawan |
| Get My Order History | `GET` | `/api/orders/me` | Riwayat pesanan saya | ✅ Wisatawan |
| Download Invoice PDF | `GET` | `/api/orders/:id/invoice` | Download Struk PDF otomatis | ✅ Wisatawan |
| Request Order Refund | `POST` | `/api/orders/:id/refund` | Ajukan pengembalian dana (Refund) | ✅ Wisatawan |
| Check Refund Status | `GET` | `/api/orders/:id/refund-status` | Cek status pengajuan refund | ✅ Wisatawan |
| Submit Order Review | `POST` | `/api/orders/:orderId/reviews` | Beri rating bintang 1-5 | ✅ Wisatawan |
| Get Vendor Incoming Orders | `GET` | `/api/orders/vendor` | Lihat pesanan masuk (Vendor) | ✅ Vendor |
| Get All Orders (Admin) | `GET` | `/api/orders/admin` | Lihat seluruh pesanan (Admin) | ✅ Admin |

### **📂 09 - Payments**
| Nama Request | Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|---|
| Midtrans Webhook Callback | `POST` | `/api/webhooks/midtrans` | Webhook update status bayar dari Midtrans | — |

### **📂 10 - Reviews**
| Nama Request | Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|---|
| Submit Review | `POST` | `/api/orders/:orderId/reviews` | Beri rating bintang 1-5 (via Orders) | ✅ Wisatawan |
| Get Product Reviews | `GET` | `/api/products/:productId/reviews` | Lihat ulasan publik produk | — |

### **📂 11 - Vendor Dashboard**
| Nama Request | Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|---|
| View Commission Ledger | `GET` | `/api/vendors/me/ledgers` | Buku kas & riwayat komisi vendor | ✅ Vendor |
| Request Fund Withdrawal | `POST` | `/api/vendors/me/withdrawals` | Request tarik dana ke rekening bank | ✅ Vendor |
| View Withdrawal History | `GET` | `/api/vendors/me/withdrawals` | Riwayat & status penarikan dana | ✅ Vendor |
| Set Cross-Selling Rule | `POST` | `/api/vendors/me/products/:id/cross-selling` | Atur rekomendasi produk terkait | ✅ Vendor |

### **📂 12 - Media Uploads (Cloudinary)**
| Nama Request | Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|---|
| Upload Foto Profil (Max 5MB) | `POST` | `/api/upload/profile` | Upload foto profil User/Vendor | ✅ All |
| Upload Foto Produk (Max 5MB) | `POST` | `/api/upload/product` | Upload logo & foto produk (Products) | ✅ Vendor |
| Upload Dokumen KYC (Max 10MB) | `POST` | `/api/upload/document` | Upload dokumen verifikasi KTP/NIB | ✅ Vendor |
| Upload Panorama 360 (Max 10MB) | `POST` | `/api/upload/panorama` | Upload background 360° untuk Scene | ✅ Admin |
| Upload 3D Asset (Max 30MB) | `POST` | `/api/upload/3d-model` | Upload file mentah 3D (.glb/.gltf) | ✅ Admin |

---

## 🔄 Alur Bisnis Utama (Business Flow)

### Sampling Flow (Target Presentasi Dosen)
```
[Wisatawan]
    ↓
  1. Login Google OAuth → Dapat JWT Token
    ↓
  2. Lihat Scene 3D → GET /api/scenes/:id (koordinat hotspot)
    ↓
  3. Klik Produk di Hotspot → GET /api/products/:id + add-ons
    ↓
  4. Checkout (POST /api/orders)
      → Inventory LOCK 15 menit
      → Promo Code dihitung
      → Add-on harga dijumlah
      → Audit Log dicatat
    ↓
  5. Bayar via Midtrans Snap (snap_token dari response)
    ↓
  6. Midtrans Webhook → POST /api/webhooks/midtrans
      → Signature SHA512 divalidasi
      → Status Order → "paid"
      → Inventory "locked" → "sold"
      → VirtualLedger dibuat (komisi terhitung)
      → Loyalty Points diberikan
      → Invoice PDF dikirim via Email
```

### Alur Admin
```
[Admin] → Approve KYC Vendor → Vendor bisa berjualan
[Admin] → Review Refund Request → Approve → Stok otomatis kembali
[Admin] → Review Withdrawal → Transfer manual → Konfirmasi di sistem
```

### Alur Otomasi (Cron Jobs)
```
Setiap 5 menit  → Batalkan order expired + release inventory
Setiap 30 menit → Kirim email reminder bayar (wisatawan pending)
Setiap 09.00    → Kirim penawaran loyalty point (wisatawan aktif)
Setiap 10.00    → Kirim retargeting email (berdasarkan riwayat kunjungan)
```

---


---

## 🔑 Aturan Autentikasi (Authentication Rules)

- **Wisatawan**: DILARANG mendaftar secara manual. Hanya diizinkan masuk melalui **Google Login** (`POST /api/auth/google`).
- **Vendor**: Mendaftar secara manual melalui `POST /api/auth/register` (Otomatis ditandai sebagai role `vendor`). Wajib melampirkan dokumen KYC setelah berhasil login.
- **Admin**: Hanya dibuat secara langsung di tingkat Database (via Seeder).

---

## 👨‍💻 Kontributor

| Nama | NIM | Role |
|---|---|---|
| Alfin Himawan Santosa | 24051130081 | Backend Developer & Database |
| ⁠Muhammad Rafli Dharmanda Andoyo | 24051130087 | Backend Developer & Database |
| Pramudya Tien Meylandri | 24051130088 | Backend Developer & Database |
| Naufal Hanif Ramadhan Darwis | 24051130106 | Backend Developer & Database |
| Muhammad Zaidaan | 24051130110 | Backend Developer & Database |

---

<p align="center">
  <b>Universitas Negeri Yogyakarta, 2026</b><br>
  <i>Proyek Manajemen — Minimum Viable Product (MVP)</i>
</p>
