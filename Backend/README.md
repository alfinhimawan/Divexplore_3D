# DIVEXPLORE-3D — Backend API

> RESTful API untuk ekosistem marketplace wisata bahari terintegrasi dengan katalog 3D interaktif.
> Mengakomodasi multi-vendor, inventory locking real-time, virtual ledger, dan audit log keamanan.

---

## Tech Stack

| Kategori | Teknologi |
|---|---|
| Runtime | Node.js v24 |
| Framework | Express.js v5 |
| Database | PostgreSQL |
| ORM | Sequelize v6 + Sequelize CLI |
| Authentication | JWT + Google OAuth |
| Payment | Midtrans |
| Cloud Storage | AWS S3 |
| Email | AWS SES |
| Logging | Winston + Morgan |

---

## Prasyarat

Pastikan sudah terinstall di komputer Anda:

- [Node.js v24+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/) (berjalan lokal / via DBeaver)
- npm (sudah termasuk dalam Node.js)

---

## Setup & Instalasi

### 1. Clone repository

```bash
git clone <url-repository>
cd Divexplore_3D/Backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Konfigurasi environment variables

```bash
# Salin template .env
cp .env.example .env

# Edit .env dan isi nilai yang sesuai
# Minimal yang WAJIB diisi untuk development lokal:
# DB_USERNAME, DB_PASSWORD, DB_NAME, JWT_SECRET
```

### 4. Buat database di PostgreSQL

Buka DBeaver atau psql, jalankan:
```sql
CREATE DATABASE divexplore_db;
```

### 5. Jalankan migration database

```bash
npm run db:migrate
```

### 6. Jalankan server

```bash
npm run dev     # Development (auto-restart dengan nodemon)
npm run start   # Production
```

Server berjalan di: **http://localhost:5000**

---

## Environment Variables

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

> ⚠️ **JANGAN** commit file `.env` ke GitHub. File ini sudah di-exclude via `.gitignore`.

---

## Scripts

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

# Testing
npm test                      # Jalankan unit test
```

---

## Struktur Direktori

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

## Skema Database

Sistem menggunakan **17 tabel** dengan UUID sebagai primary key:

| Grup | Tabel |
|---|---|
| Pengguna & Keamanan | `Users`, `UserConsents` |
| Vendor & KYC | `Vendors`, `VendorDocuments` |
| Katalog & 3D | `Scenes`, `Products`, `Product3dHotspots`, `CrossSellingRules` |
| Inventory | `ProductInventories` |
| Transaksi | `Orders`, `OrderItems`, `Promos` |
| Keuangan & Loyalty | `VirtualLedgers`, `LoyaltyPoints` |
| Log & Review | `AuditLogs`, `Reviews`, `PaymentLogs` |

---

## API Endpoints

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/` | Health check | — |
| `POST` | `/api/auth/register` | Registrasi akun | — |
| `POST` | `/api/auth/login` | Login dapat token | — |
| `POST` | `/api/auth/google` | Login via Google | — |
| `GET` | `/api/auth/me` | Profil user aktif | ✅ |
| ... | ... | *(dokumentasi lengkap menyusul)* | |

---

## Cara Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Salin output-nya ke `JWT_SECRET` di file `.env`.

---

## Kontributor

| Nama | Role |
|---|---|
| Alfin Himawan Santosa | Backend Developer |

---

## Lisensi

ISC — Universitas Negeri Yogyakarta, 2026
