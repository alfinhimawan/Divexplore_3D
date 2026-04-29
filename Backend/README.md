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

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|---|---|
| **Runtime** | Node.js v24 |
| **Framework** | Express.js v5 |
| **Database** | PostgreSQL |
| **ORM** | Sequelize v6 + Sequelize CLI |
| **Authentication** | JWT + Google OAuth 2.0 |
| **Payment Gateway** | Midtrans API (Snap & Core API) |
| **Document Generator** | PDFKit (Buffer Streaming) |
| **Email Services** | Nodemailer |
| **Logging & Security**| Winston, Helmet, express-rate-limit |

---

## ⚙️ Setup & Instalasi Lokal

### 1. Prasyarat
- [Node.js v24+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/) (berjalan lokal / via DBeaver)
- Akun Google Cloud Console (untuk OAuth)
- Akun Midtrans (Sandbox)

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
| `MIDTRANS_SERVER_KEY`| *(dari Midtrans)* | Server Key Midtrans Sandbox |

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
├── logs/                   # Log file (auto-generated, tidak di-commit)
├── src/
│   ├── config/
│   │   └── config.js       # Konfigurasi database per environment
│   ├── controllers/        # Handler request/response
│   ├── middlewares/
│   │   ├── authenticate.js # JWT auth guard + role authorization
│   │   └── errorHandler.js # Global error handler
│   ├── migrations/         # Migration file Sequelize (17 tabel)
│   ├── models/             # Model Sequelize (ORM)
│   ├── routes/             # Definisi endpoint API
│   ├── seeders/            # Data awal untuk development
│   ├── services/           # Business logic
│   └── utils/
│       └── logger.js       # Winston logger
├── .env                    # Environment variables (tidak di-commit)
├── .env.example            # Template .env untuk tim
├── .gitignore
├── .sequelizerc            # Konfigurasi path Sequelize CLI
├── package.json
└── server.js               # Entry point aplikasi
```

---

## 🗄️ Skema Database (17 Tabel)

Sistem menggunakan **17 tabel** dengan tipe data `UUID` sebagai *Primary Key* dan mendukung fitur *Soft Deletes* (`deletedAt`) untuk menjaga integritas data riwayat pesanan (*Referential Integrity*).

| Grup | Tabel |
|---|---|
| **Pengguna & Keamanan** | `Users`, `UserConsents` |
| **Vendor & KYC** | `Vendors`, `VendorDocuments` |
| **Katalog & 3D** | `Scenes`, `Products`, `Product3dHotspots`, `CrossSellingRules` |
| **Inventory** | `ProductInventories` |
| **Transaksi** | `Orders`, `OrderItems`, `Promos` |
| **Keuangan & Loyalty** | `VirtualLedgers`, `LoyaltyPoints` |
| **Log & Review** | `AuditLogs`, `Reviews`, `PaymentLogs` |

---

## 🌐 API Endpoints

| Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|
| **Public & Auth** | | | |
| `GET` | `/` | Health check server | — |
| `POST` | `/api/auth/register` | Registrasi manual (otomatis jadi Vendor) | — |
| `POST` | `/api/auth/login` | Login standar dengan email & password | — |
| `POST` | `/api/auth/google` | Login via Google (Otomatis jadi Wisatawan) | — |
| `GET` | `/api/auth/me` | Lihat profil user aktif | ✅ All |
| **Vendor Management** | | | |
| `POST` | `/api/vendors/` | Buat profil bisnis vendor | ✅ Vendor |
| `GET` | `/api/vendors/me` | Lihat profil bisnis sendiri | ✅ Vendor |
| `PUT` | `/api/vendors/me` | Update profil bisnis | ✅ Vendor |
| `POST` | `/api/vendors/me/documents` | Upload dokumen KYC (KTP/Legal) | ✅ Vendor |
| `GET` | `/api/vendors/me/documents` | Lihat dokumen KYC sendiri | ✅ Vendor |
| `POST` | `/api/vendors/me/products` | Buat produk/paket wisata baru | ✅ Vendor |
| `GET` | `/api/vendors/me/products` | Lihat seluruh katalog produk sendiri | ✅ Vendor |
| **Admin Area** | | | |
| `GET` | `/api/admin/vendors` | Lihat daftar semua vendor | ✅ Admin |
| `PUT` | `/api/admin/vendors/:id/kyc` | Approve/Reject dokumen KYC vendor | ✅ Admin |
| `GET` | `/api/admin/reports/gmv` | Analisis total transaksi (GMV Tracker) | ✅ Admin |
| `GET` | `/api/admin/abandoned-carts`| Daftar keranjang yang ditinggalkan | ✅ Admin |
| **Catalog & Products**| | | |
| `GET` | `/api/products` | Lihat seluruh katalog produk publik | — |
| `GET` | `/api/products/:id` | Detail sebuah produk wisata | — |
| **Orders & Transactions**| | | |
| `POST` | `/api/orders` | Checkout transaksi & Snap Midtrans | ✅ All |
| `GET` | `/api/orders/:id` | Detail transaksi/pesanan | ✅ All |
| `GET` | `/api/orders/:id/invoice` | Download Struk PDF otomatis | ✅ All |
| `POST` | `/api/orders/:id/reviews` | Beri rating & ulasan (Harus Paid) | ✅ Wisatawan |
| **Payments** | | | |
| `POST` | `/api/payments/webhook` | Menangkap sinyal sukses dari Midtrans | — |

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
