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

Berikut adalah detail endpoint lengkap sesuai urutan folder pengujian di Postman:

### **📂 00 - Health Check**
| Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|
| `GET` | `/` | Health check server aktif | — |
| `GET` | `/any-route` | Tes Error Handler (404 Not Found) | — |

### **📂 01 - Auth**
| Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|
| `POST` | `/api/auth/register` | Registrasi manual vendor baru | — |
| `POST` | `/api/auth/google` | Login via Google (Wisatawan) | — |
| `POST` | `/api/auth/login` | Login manual (Admin/Vendor) | — |
| `GET` | `/api/auth/me` | Lihat profil user yang sedang aktif | ✅ All |
| `PUT` | `/api/auth/me` | Update profil (Telepon, Alamat, Foto) | ✅ All |
| `DELETE` | `/api/auth/account`| Hapus akun (Soft Delete - GDPR) | ✅ All |
| `POST` | `/api/auth/consent` | Pencatatan persetujuan privasi | ✅ All |

### **📂 02 - Vendor**
| Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|
| `POST` | `/api/vendors` | Inisialisasi profil bisnis vendor | ✅ Vendor |
| `GET` | `/api/vendors/me` | Lihat profil bisnis sendiri | ✅ Vendor |
| `PUT` | `/api/vendors/me` | Update data bisnis/toko | ✅ Vendor |
| `POST` | `/api/vendors/me/documents`| Upload dokumen KYC (KTP/NIB) | ✅ Vendor |
| `GET` | `/api/vendors/me/documents`| Lihat status verifikasi dokumen | ✅ Vendor |
| `GET` | `/api/vendors/me/ledgers`| Buku kas & riwayat komisi vendor | ✅ Vendor |

### **📂 03 - Admin**
| Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|
| `GET` | `/api/admin/vendors` | Lihat daftar seluruh vendor | ✅ Admin |
| `PUT` | `/api/admin/vendors/:id/kyc`| Approve/Reject dokumen KYC vendor | ✅ Admin |
| `GET` | `/api/admin/reports/gmv` | Analisis omzet (GMV Tracker) | ✅ Admin |
| `GET` | `/api/admin/abandoned-carts`| Daftar transaksi tertunda | ✅ Admin |
| `GET` | `/api/admin/refunds` | Lihat semua pengajuan refund | ✅ Admin |
| `PUT` | `/api/admin/refunds/:id`| Approve/Reject permintaan refund | ✅ Admin |
| `GET` | `/api/admin/withdrawals` | Lihat semua pengajuan penarikan | ✅ Admin |
| `PUT` | `/api/admin/withdrawals/:id`| Proses transfer dana ke vendor | ✅ Admin |
| `POST` | `/api/admin/marketing/trigger`| Pemicu strategi marketing otomatis | ✅ Admin |

### **📂 04 - Scenes & Hotspots (3D)**
| Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|
| `GET` | `/api/scenes` | Daftar semua ruangan 3D | — |
| `GET` | `/api/scenes/:id` | Detail ruangan + koordinat produk | — |

### **📂 05 - Products**
| Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|
| `GET` | `/api/products` | Katalog produk publik | — |
| `GET` | `/api/products/:id` | Detail produk + ulasan + metadata 3D | — |
| `POST` | `/api/products` | Vendor menambah produk baru | ✅ Vendor |
| `PUT` | `/api/products/:id` | Vendor update data produk | ✅ Vendor |
| `DELETE` | `/api/products/:id` | Vendor menghapus produk | ✅ Vendor |
| `POST` | `/api/products/:id/bundling`| Menambah aturan bundling produk | ✅ Vendor |
| `POST` | `/api/products/:id/visit` | Mencatat kunjungan produk | — |

### **📂 06 - Inventory**
| Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|
| `POST` | `/api/vendors/me/products/:id/inventory` | Atur kuota stok per tanggal | ✅ Vendor |

### **📂 07 - Promos**
| Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|
| `GET` | `/api/promos` | Melihat daftar promo yang aktif | — |
| `POST` | `/api/promos` | Admin membuat kode diskon baru | ✅ Admin |
| `PUT` | `/api/promos/:id` | Admin memperbarui promo | ✅ Admin |
| `DELETE` | `/api/promos/:id` | Admin menghapus promo | ✅ Admin |

### **📂 08 - Orders**
| Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|
| `POST` | `/api/orders` | Checkout & Snap Midtrans (Locking) | ✅ All |
| `GET` | `/api/orders/me` | Riwayat pesanan saya | ✅ All |
| `GET` | `/api/orders/:id` | Detail transaksi spesifik | ✅ All |
| `GET` | `/api/orders/:id/invoice`| Download Struk PDF otomatis | ✅ All |
| `POST` | `/api/orders/:id/refund`| Ajukan pengembalian dana (Refund) | ✅ Wisatawan |
| `GET` | `/api/orders/:id/refund-status`| Cek status pengajuan refund | ✅ Wisatawan |

### **📂 09 - Payments**
| Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|
| `POST` | `/api/webhooks/midtrans` | Webhook update status bayar | — |

### **📂 10 - Reviews**
| Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|
| `POST` | `/api/orders/:orderId/reviews`| Beri rating bintang 1-5 | ✅ Wisatawan |
| `GET` | `/api/products/:productId/reviews`| Lihat ulasan publik produk | — |

### **📂 11 - Vendor Dashboard**
| Method | Endpoint | Deskripsi | Auth / Role |
|---|---|---|---|
| `GET` | `/api/vendors/me/ledgers`| Buku kas & riwayat komisi vendor | ✅ Vendor |
| `POST` | `/api/vendors/me/withdrawals`| Request tarik dana ke bank | ✅ Vendor |
| `GET` | `/api/vendors/me/withdrawals`| Riwayat penarikan dana | ✅ Vendor |
| `POST` | `/api/vendors/me/products/:id/cross-selling`| Atur rekomendasi produk terkait | ✅ Vendor |

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
