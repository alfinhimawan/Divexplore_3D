# Divexplore 3D - Maritime Tourism E-Commerce

Ini adalah *Root Repository* (Repositori Utama) untuk proyek akhir mata kuliah Manajemen Proyek: **Divexplore 3D**, sebuah E-Commerce Pariwisata Bahari yang mengintegrasikan pengalaman visualisasi 3D (Panorama Bawah Laut).

Repositori ini menggunakan sistem **Monorepo** yang membagi *source code* menjadi dua bagian utama: Backend (Server/API) dan Frontend (User Interface).

## 📁 Struktur Repositori

```text
Divexplore_3D/
├── Backend/      # Berisi API Express.js, Model Sequelize, & Database PostgreSQL
├── Frontend/     # Berisi kode antarmuka menggunakan React / Vite (Sedang dikembangkan)
└── README.md     # Dokumentasi Utama
```

## 🚀 Cara Menjalankan Proyek (Bagi Anggota Tim)

Karena proyek ini terbagi menjadi dua bagian, Anda perlu membuka **dua terminal terpisah** untuk menjalankan Backend dan Frontend secara bersamaan.

### 1. Menjalankan Backend (Terminal 1)
Masuk ke folder `Backend`, install dependensi, dan jalankan *development server*:
```bash
cd Backend
npm install
npm run dev
```
*Pastikan Anda sudah mengonfigurasi file `.env` di dalam folder Backend sesuai dengan `.env.example` sebelum menjalankan server.*

### 2. Menjalankan Frontend (Terminal 2)
Masuk ke folder `Frontend`, install dependensi, dan jalankan *development server* (Vite/React):
```bash
cd Frontend
npm install
npm run dev
```

## 👥 Tim Pengembang
Proyek ini dikembangkan oleh 9 mahasiswa:
- **Tim Backend** (5 Orang): Bertanggung jawab atas stabilitas API, autentikasi (Google OAuth), integrasi *Payment Gateway* (Midtrans), dan logika bisnis 3D Hotspot.
- **Tim Frontend** (4 Orang): Bertanggung jawab mengembangkan UI/UX interaktif, integrasi visualisasi 3D (Three.js/A-Frame), dan halaman keranjang belanja/checkout.

---
*Dokumentasi spesifik untuk masing-masing divisi (seperti dokumentasi API Postman) dapat dilihat pada file `README.md` di dalam folder Backend dan Frontend.*
