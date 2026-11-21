# Panduan Kontribusi — Fainaya AdminDesk

Terima kasih atas minat Anda untuk berkontribusi pada **Fainaya AdminDesk**! Dokumen ini menjelaskan cara berkontribusi pada aplikasi open source administrasi & koordinasi operasional Fainaya Group.

## 📜 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE). Dengan berkontribusi, Anda setuju bahwa kontribusi Anda akan dilisensikan di bawah lisensi yang sama.

## 🚀 Memulai Kontribusi

### 1. Fork Repositori

Fork repositori Fainaya AdminDesk ke akun GitHub Anda, lalu clone hasil fork:

```bash
git clone https://github.com/username/fainaya-admindesk.git
cd fainaya-admindesk
```

### 2. Instalasi Dependensi

```bash
npm install
```

### 3. Konfigurasi Environment

Salin file `.env.example` menjadi `.env` dan sesuaikan nilainya:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://fainaya:fainaya123@localhost:5432/fainaya_admindesk?schema=public"
JWT_SECRET="ganti-dengan-secret-acak-panjang-ini"
JWT_EXPIRES_IN="7d"
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
PORT=3000
```

### 4. Nyalakan Database PostgreSQL

```bash
docker compose up -d
```

### 5. Push Skema & Seed Data

```bash
npm run db:push
npm run db:seed
```

### 6. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## 🛠️ Arsitektur & Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Backend | Next.js API Routes (Serverless) |
| Database | PostgreSQL 16 + Prisma 7 ORM |
| Auth | JWT (jsonwebtoken) + HTTP-Only cookies + bcryptjs |
| Storage | Local filesystem (kompatibel S3/MinIO untuk produksi) |
| Icons | Lucide React |
| Deployment | Docker & Docker Compose |

### Struktur Folder

```
fainaya-admindesk/
├── prisma/
│   └── schema.prisma          # Skema database (17 model)
├── scripts/
│   └── seed.ts                # Script seed data demo
├── src/
│   ├── app/
│   │   ├── api/               # API Route Handlers
│   │   │   ├── admin/audit/   # Audit log, users, branches
│   │   │   ├── auth/          # Login, logout, me, preferences
│   │   │   ├── coordination/  # Tickets, minutes, bulletins
│   │   │   ├── dashboard/     # Dashboard statistics
│   │   │   ├── documents/     # Dokumen CRUD + auto-numbering
│   │   │   ├── files/[...name]/ # GET download file
│   │   │   ├── office/        # Items, supplies, petty-cash
│   │   │   ├── reports/       # Laporan + export CSV
│   │   │   ├── sales/         # Checklists, catalogs, after-sales
│   │   │   └── upload/        # POST upload file
│   │   ├── dashboard/         # Halaman dashboard (dengan role guard)
│   │   └── login/             # Halaman login
│   ├── components/            # Komponen UI (theme engine, shell, forms)
│   ├── lib/                   # Utilities (auth, prisma, role-guard, types)
│   ├── generated/prisma/      # Prisma Client (auto-generated)
│   └── proxy.ts               # Next.js middleware (auth guard)
├── .env.example
├── docker-compose.yml
├── next.config.ts
├── package.json
├── prisma.config.ts
└── README.md
```

## 🎨 Adaptive 6-Theme Design Engine

Aplikasi dilengkapi dengan 6 tema visual yang dapat diubah secara instan (zero-reload):

1. **Glassmorphism** — Panel semi-transparan dengan efek blur
2. **Neumorphism** — Soft UI dengan bayangan lembut
3. **Claymorphism** — Gaya tanah liat 3D empuk
4. **Neo-Brutalism** — Kontras tinggi, garis tepi hitam tegas
5. **Minimalist UI** — Permukaan datar, whitespace proporsional
6. **Frost UI** — Efek kaca es buram dengan tingkat keburaman lebih pekat

Setiap tema mendukung mode terang & gelap, dengan jaminan kontras teks WCAG AA (≥ 4.5:1).

## 🔧 Cara Berkontribusi

### 1. Buat Branch Fitur

```bash
git checkout -b fitur/nama-fitur
```

### 2. Lakukan Perubahan

- Pastikan kode mengikuti konvensi TypeScript dan ESLint yang ada
- Tambahkan atau perbarui dokumentasi jika perlu
- Pastikan tema visual tetap konsisten di semua 6 tema

### 3. Jalankan Lint & Build

```bash
npm run lint
npm run build
```

### 4. Commit Perubahan

```bash
git add .
git commit -m "feat: deskripsi singkat perubahan"
```

### 5. Push dan Buat Pull Request

```bash
git push origin fitur/nama-fitur
```

Buat Pull Request di GitHub dan deskripsikan perubahan yang dilakukan.

## 📋 Standar Kode

- **TypeScript**: Gunakan `strict` mode, hindari `any`
- **Tailwind CSS**: Gunakan CSS custom properties (design tokens) untuk tema
- **React**: Functional components dengan hooks, gunakan `"use client"` hanya ketika diperlukan
- **API**: Route Handlers di `src/app/api/`, gunakan `getCurrentUser()` untuk autentikasi
- **Database**: Prisma ORM dengan PostgreSQL
- **Bahasa Indonesia**: Komentar dan pesan error dalam bahasa Indonesia

## 🐛 Melaporkan Bug

Buat issue di GitHub dengan template berikut:

```
**Deskripsi Bug**
Jelaskan bagaimana bug terjadi.

**Langkah Mereproduksi**
1. Langkah satu
2. Langkah dua
3. ...

**Perilaku yang Diharapkan**
Jelaskan apa yang seharusnya terjadi.

**Perilaku yang Sesungguhnya**
Jelaskan apa yang sebenarnya terjadi.

**Screenshot**
Tambahkan screenshot jika relevan.

**Environment**
- Browser: [misal Chrome 120]
- OS: [misal Windows 11]
- Node.js version: [misal v20]
```

## ✨ Fitur Baru

Sebelum mengimplementasikan fitur besar, buat issue terlebih dahulu untuk mendiskusikan desain dan implementasi.

## 👥 Tim Pengembang

- **Koordinator Admin Pusat** — Pengelola standar dokumen & SOP
- **Staff Administrasi Cabang** — Pengelola arsip dan laporan cabang
- **System Administrator** — Pengelola instalasi dan konfigurasi sistem

## 📞 Kontak

Untuk pertanyaan tentang kontribusi, buat diskusi di GitHub Discussions atau hubungi tim pengembang melalui issue.

---

**Fainaya AdminDesk** — Open Source Admin Coordinator Platform © 2026