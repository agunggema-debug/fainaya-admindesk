# Fainaya AdminDesk

Aplikasi open-source administrasi & koordinasi operasional untuk Fainaya Group. Dirancang untuk koordinator admin pusat, staff admin cabang, sales support, customer service, kepala cabang, dan system administrator.

## Dokumen Produk

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Panduan kontribusi untuk pengembang open source

## Fitur Utama

### 7 Modul Operasional

1. **Dashboard** - Ringkasan statistik, aktivitas terbaru (audit trail), dan pengumuman internal.
2. **Manajemen Dokumen & Arsip** - CRUD dokumen resmi (SOP, surat masuk/keluar, kontrak, perizinan, memo, edaran) dengan penomoran otomatis, alur persetujuan, dan QR code verifikasi.
3. **Laporan Operasional** - Laporan harian/mingguan/bulanan dengan pelacak kepatuhan waktu (compliance tracker).
4. **Operasional Kantor** - Inventaris ATK (dengan low-stock alert), pengajuan pengadaan (multi-level approval), dan kas kecil (pemasukan/pengeluaran dengan saldo real-time).
5. **Koordinasi Antar Departemen** - Tiket koordinasi lintas departemen (GUDANG, FINANCE, HR, IT, UMUM, SALES), notulensi rapat dengan action items, dan papan pengumuman internal.
6. **Administrasi Sistem** - Manajemen pengguna (6 persona RBAC), audit trail, dan konfigurasi sistem.
7. **Sales & CS Support** - Checklist penjualan, katalog & distribusi promo, after-sales case management (SLA, escalation), serta tracking berkas upload/download.

### Adaptive 6-Theme Engine

Antarmuka dengan 6 pilihan tema visual (Glassmorphism, Neumorphism, Claymorphism, Neo-Brutalism, Minimalist, Frost) dan mode terang/gelap. Preferensi tema tersinkronisasi ke server via cookie & database.

### Keamanan

- Autentikasi JWT dengan HTTP-Only cookie (SameSite=Lax).
- RBAC (Role-Based Access Control) dengan 6 peran pengguna.
- Branch scoping - data difilter berdasarkan cabang pengguna.
- Audit trail untuk setiap operasi mutasi (create, update, delete, login, logout).

## Prasyarat

- **Node.js** 20+ (direkomendasikan v24 LTS)
- **PostgreSQL** 16+ (lokal atau via Docker)
- **npm** 10+

## Langkah Menjalankan Lokal

### 1. Clone & Install

```bash
git clone <repo-url>
cd fainaya-admindesk
npm install
```

### 2. Konfigurasi Environment

```bash
cp .env.example .env
```

Edit `.env` sesuai kebutuhan:

```env
JWT_SECRET="ganti-dengan-secret-acak-panjang-ini"
JWT_EXPIRES_IN="7d"
```

### 3. Nyalakan PostgreSQL

Gunakan Docker Compose (hanya service database):

```bash
docker compose up -d postgres
```

Atau gunakan PostgreSQL lokal yang sudah terpasang.

### 4. Push Skema & Seed Data

```bash
npm run db:push    # Sinkronisasi skema Prisma ke database
npm run db:seed    # Populasi data demo (6 persona, 4 cabang, dokumen, laporan, ATK, kas kecil, tiket, notulensi, pengumuman, sales checklist, katalog, after-sales)
```

### 5. Jalankan Dev Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) - otomatis redirect ke `/login`.

## Akun Demo

Semua akun demo menggunakan password: `fainaya123`

| Persona          | Email                     | Peran            | Cakupan        |
| ---------------- | ------------------------- | ---------------- | -------------- |
| Koordinator HQ   | `hq.admin@fainaya.com`    | HQ_COORDINATOR   | Semua cabang   |
| Admin Cabang     | `admin.bdg@fainaya.com`   | BRANCH_ADMIN     | Cabang Bandung |
| Sales Support    | `sales.bdg@fainaya.com`   | SALES_SUPPORT    | Cabang Bandung |
| Customer Service | `cs.jkt@fainaya.com`      | CUSTOMER_SERVICE | Cabang Jakarta |
| Kepala Cabang    | `manager.bdg@fainaya.com` | BRANCH_MANAGER   | Cabang Bandung |
| System Admin     | `sysadmin@fainaya.com`    | SYSTEM_ADMIN     | Global         |

> Halaman login menyediakan tombol quick-fill untuk setiap persona.

## Struktur Folder

```
fainaya-admindesk/
├── prisma/
│   └── schema.prisma          # Skema database (17 model)
├── scripts/
│   └── seed.ts                # Script seed data demo
├── src/
│   ├── app/
│   │   ├── api/               # API Route Handlers (Next.js App Router)
│   │   │   ├── admin/audit/   # GET audit log + users + branches
│   │   │   ├── auth/          # Login, logout, me, preferences
│   │   │   ├── coordination/  # Tickets, minutes, bulletins (GET/POST + [id] PATCH/DELETE)
│   │   │   ├── dashboard/     # Dashboard statistics
│   │   │   ├── documents/     # Dokumen CRUD + auto-numbering
│   │   │   ├── files/[...name]/ # GET download file upload
│   │   │   ├── office/        # Items, supplies, petty-cash (CRUD)
│   │   │   ├── reports/       # Laporan operasional CRUD + export CSV
│   │   │   ├── sales/         # Checklists, catalogs, after-sales (CRUD)
│   │   │   └── upload/        # POST upload file multipart
│   │   ├── dashboard/         # Halaman dashboard (dengan role guard)
│   │   │   ├── admin/         # Administrasi sistem
│   │   │   ├── coordination/  # Halaman koordinasi
│   │   │   ├── documents/     # Halaman dokumen
│   │   │   ├── office/        # Halaman operasional kantor
│   │   │   ├── reports/       # Halaman laporan
│   │   │   └── sales/         # Halaman Sales & CS Support
│   ├── components/            # Komponen UI (theme engine, shell, forms)
│   ├── lib/                   # Utilities (auth, prisma, types)
│   ├── generated/prisma/      # Prisma Client (auto-generated)
│   └── proxy.ts               # Next.js 16 proxy (auth guard)
├── .env.example
├── CONTRIBUTING.md            # Panduan kontribusi open source
├── docker-compose.yml
├── next.config.ts
├── package.json
├── prisma.config.ts
└── README.md
```

## Scripts npm

| Script            | Deskripsi                                       |
| ----------------- | ----------------------------------------------- |
| `npm run dev`     | Jalankan dev server (Next.js 16 + Turbopack)    |
| `npm run build`   | Prisma generate + build produksi                |
| `npm run start`   | Jalankan server produksi                        |
| `npm run lint`    | ESLint (Next.js core-web-vitals + TypeScript)   |
| `npm run db:push` | Sinkronisasi skema Prisma ke database           |
| `npm run db:seed` | Populasi data demo (auto-generate Prisma + tsx) |

## Teknologi

- **Framework**: Next.js 16.4 (App Router, Proxy middleware, Cache Components)
- **Database**: PostgreSQL + Prisma 7 (adapter `@prisma/adapter-pg`)
- **Auth**: JWT (`jsonwebtoken`) + HTTP-Only cookies + `bcryptjs`
- **Styling**: Tailwind CSS v4 + CSS custom properties (6-theme engine)
- **Icons**: Lucide React
- **Runtime**: Node.js v24 LTS

## Deployment dengan Docker

```bash
# Build dan jalankan semua service
docker compose up -d --build

# Hentikan service
docker compose down

# Lihat log
docker compose logs -f
```

## Catatan Keamanan

- **Ganti `JWT_SECRET`** di `.env` sebelum deployment produksi. Aplikasi menolak berjalan tanpa `JWT_SECRET` (tidak ada fallback lemah).
- **Rotasi kredensial** yang pernah terekspos: buat `JWT_SECRET` baru (`openssl rand -hex 64`) dan ganti password database sebelum deployment.
- Berkas unggahan disimpan di luar repositori (`/uploads`, diabaikan oleh `.gitignore`); unduhan divalidasi terhadap path traversal.
- Cookie sesi bersifat HTTP-Only dan SameSite=Lax - tidak dapat diakses JavaScript.
- Semua route API memverifikasi sesi via `getCurrentUser()` dan menerapkan branch scoping.
- Akses data dibatasi berdasarkan peran (RBAC) dan cabang pengguna; pengguna non-privileged tidak dapat mengakses/memodifikasi data cabang lain.
- Audit trail mencatat setiap operasi mutasi dengan IP address.
- Login menggunakan pesan error generik untuk mencegah enumerasi pengguna.

## Lisensi

MIT

<img width="1845" height="900" alt="image" src="https://github.com/user-attachments/assets/04d8e678-62bb-46ba-93ed-9c0cd7e4e7fa" />

---
<img width="1845" height="898" alt="image" src="https://github.com/user-attachments/assets/52734bd9-9dfe-4e8e-a42b-5be9593a4acf" />

---
<img width="1918" height="901" alt="image" src="https://github.com/user-attachments/assets/8acfc904-df78-493c-89ff-e013ed4e364d" />

