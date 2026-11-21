import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

// Demo IP addresses for seed audit logs (not used for network communication)
const DEMO_IP_HQ = "127.0.0.1";
const DEMO_IP_BRANCH = "192.168.1.15";
const DEMO_IP_MANAGER = "192.168.1.2";

async function main() {
  console.log("Seeding Fainaya AdminDesk database...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.salesChecklist.deleteMany();
  await prisma.catalogDistribution.deleteMany();
  await prisma.bulletin.deleteMany();
  await prisma.meetingMinute.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.pettyCash.deleteMany();
  await prisma.supplyRequest.deleteMany();
  await prisma.officeItem.deleteMany();
  await prisma.operationalReport.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  // 1. Create Branches
  const hq = await prisma.branch.create({
    data: {
      code: "HQ-JKT",
      name: "Kantor Pusat Jakarta (Headquarters)",
      address: "Jl. Sudirman No. 108, Jakarta Selatan",
      phone: "+62 21 555-0199",
      isHeadquarters: true,
    },
  });

  const branchBdg = await prisma.branch.create({
    data: {
      code: "CAB-BDG",
      name: "Kantor Cabang Bandung",
      address: "Jl. Asia Afrika No. 45, Bandung",
      phone: "+62 22 420-1122",
      isHeadquarters: false,
    },
  });

  const branchSby = await prisma.branch.create({
    data: {
      code: "CAB-SBY",
      name: "Kantor Cabang Surabaya",
      address: "Jl. Basuki Rahmat No. 78, Surabaya",
      phone: "+62 31 534-8899",
      isHeadquarters: false,
    },
  });

  const branchMdn = await prisma.branch.create({
    data: {
      code: "CAB-MDN",
      name: "Kantor Cabang Medan",
      address: "Jl. Gatot Subroto No. 12, Medan",
      phone: "+62 61 451-3344",
      isHeadquarters: false,
    },
  });

  console.log("Created 4 branches.");

  // 2. Create Users
  const hashedPassword = await bcrypt.hash("fainaya123", 10);

  const hqAdmin = await prisma.user.create({
    data: {
      name: "Siti Rahmawati, S.E.",
      email: "hq.admin@fainaya.com",
      password: hashedPassword,
      role: "HQ_COORDINATOR",
      department: "Koordinator Administrasi Nasional",
      branchId: hq.id,
      themePreference: "glassmorphism",
      themeMode: "light",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    },
  });

  const branchAdminBdg = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "admin.bdg@fainaya.com",
      password: hashedPassword,
      role: "BRANCH_ADMIN",
      department: "Administrasi & Umum Cabang",
      branchId: branchBdg.id,
      themePreference: "neumorphism",
      themeMode: "light",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
  });

  const salesBdg = await prisma.user.create({
    data: {
      name: "Rian Pratama",
      email: "sales.bdg@fainaya.com",
      password: hashedPassword,
      role: "SALES_SUPPORT",
      department: "Sales & Marketing",
      branchId: branchBdg.id,
      themePreference: "neo-brutalism",
      themeMode: "light",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
  });

  const csJkt = await prisma.user.create({
    data: {
      name: "Maya Indah Sari",
      email: "cs.jkt@fainaya.com",
      password: hashedPassword,
      role: "CUSTOMER_SERVICE",
      department: "Customer Service & Layanan Pelanggan",
      branchId: hq.id,
      themePreference: "claymorphism",
      themeMode: "light",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    },
  });

  const managerBdg = await prisma.user.create({
    data: {
      name: "Hendra Wijaya, M.M.",
      email: "manager.bdg@fainaya.com",
      password: hashedPassword,
      role: "BRANCH_MANAGER",
      department: "Kepala Cabang",
      branchId: branchBdg.id,
      themePreference: "frost",
      themeMode: "dark",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    },
  });

  const sysAdmin = await prisma.user.create({
    data: {
      name: "Dimas Prasetyo",
      email: "sysadmin@fainaya.com",
      password: hashedPassword,
      role: "SYSTEM_ADMIN",
      department: "IT & Information Systems",
      branchId: hq.id,
      themePreference: "minimalist",
      themeMode: "light",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    },
  });

  console.log("Created 6 demo users for RBAC personas.");

  // 3. Create Documents (DMS)
  await prisma.document.createMany({
    data: [
      {
        docNumber: "001/SOP/HQ-JKT/ADM/XI/2026",
        title: "SOP Standar Tata Kelola Dokumen & Penomoran Surat Cabang",
        category: "SOP",
        status: "DISETUJUI",
        version: 2,
        summary: "Panduan nasional pembuatan, pengarsipan, dan verifikasi tanda tangan surat resmi di seluruh jaringan Fainaya Group.",
        branchId: hq.id,
        creatorId: hqAdmin.id,
        approverId: managerBdg.id,
        signedAt: new Date("2026-11-01T09:00:00Z"),
        qrCode: "VERIFIED-FAINAYA-SOP-001-2026",
      },
      {
        docNumber: "014/SK/CAB-BDG/OPS/XI/2026",
        title: "Surat Penawaran Kerjasama Pengiriman Paket Ekspedisi Bandung",
        category: "SURAT_KELUAR",
        status: "MENUNGGU_REVIEW",
        version: 1,
        summary: "Pengajuan kesepakatan tarif khusus korporasi dengan mitra kurir Jawa Barat.",
        branchId: branchBdg.id,
        creatorId: branchAdminBdg.id,
      },
      {
        docNumber: "042/SM/CAB-SBY/ADM/X/2026",
        title: "Pembaruan Sertifikasi Izin Usaha Perdagangan Cabang Surabaya",
        category: "PERIZINAN",
        status: "DIARSIPKAN",
        version: 1,
        summary: "Berkas legalitas resmi dari Dinas Perizinan Terpadu Provinsi Jawa Timur.",
        branchId: branchSby.id,
        creatorId: hqAdmin.id,
        approverId: hqAdmin.id,
        signedAt: new Date("2026-10-15T10:30:00Z"),
      },
      {
        docNumber: "003/MEMO/HQ-JKT/DIR/XI/2026",
        title: "Instruksi Efisiensi Penggunaan ATK & Anggaran Kas Kecil Q4 2026",
        category: "MEMO",
        status: "DISETUJUI",
        version: 1,
        summary: "Instruksi Direksi mengenai monitoring ketat alokasi kas kecil cabang menjelang audit akhir tahun.",
        branchId: hq.id,
        creatorId: hqAdmin.id,
        approverId: hqAdmin.id,
        signedAt: new Date("2026-11-05T08:00:00Z"),
        qrCode: "VERIFIED-FAINAYA-MEMO-003",
      },
      {
        docNumber: "005/EDR/HQ-JKT/SDM/XI/2026",
        title: "Surat Edaran Jam Operasional Layanan Akhir Pekan Cabang",
        category: "EDARAN",
        status: "DISETUJUI",
        version: 1,
        summary: "Penyesuaian jadwal piket administrasi dan CS cabang untuk promosi akhir tahun.",
        branchId: hq.id,
        creatorId: hqAdmin.id,
        signedAt: new Date("2026-11-10T14:00:00Z"),
      },
    ],
  });

  console.log("Created sample documents.");

  // 4. Create Operational Reports
  await prisma.operationalReport.createMany({
    data: [
      {
        title: "Laporan Harian Administrasi Cabang Bandung - 17 Nov 2026",
        periodType: "DAILY",
        periodDate: new Date("2026-11-17T00:00:00Z"),
        branchId: branchBdg.id,
        creatorId: branchAdminBdg.id,
        status: "SUBMITTED",
        complianceStatus: "ON_TIME",
        activitySummary: "Verifikasi 8 berkas penjualan selesai, serah terima berkas invoice ke finance lancar, stok kertas A4 mendekati batas minimum.",
        keyMetrics: JSON.stringify({ salesVerified: 8, pettyCashOut: 275000, ticketsResolved: 3 }),
        notes: "Membutuhkan persetujuan pengadaan kertas A4 secepatnya.",
      },
      {
        title: "Rekapitulasi Mingguan Operasional Cabang Surabaya (W2 Nov 2026)",
        periodType: "WEEKLY",
        periodDate: new Date("2026-11-14T00:00:00Z"),
        branchId: branchSby.id,
        creatorId: hqAdmin.id,
        status: "APPROVED",
        complianceStatus: "ON_TIME",
        activitySummary: "Total 42 transaksi penjualan tervaslidasi 100%, petty cash terealisasi Rp 3.450.000 dengan kuitansi lengkap, nihil komplain purna jual tertunda.",
        keyMetrics: JSON.stringify({ totalTransactions: 42, complianceRate: "100%", pettyCashBalance: 1550000 }),
        reviewedById: hqAdmin.id,
        reviewedAt: new Date("2026-11-15T11:00:00Z"),
      },
      {
        title: "Evaluasi Bulanan Operasional Cabang Medan - Oktober 2026",
        periodType: "MONTHLY",
        periodDate: new Date("2026-10-31T00:00:00Z"),
        branchId: branchMdn.id,
        creatorId: hqAdmin.id,
        status: "REVIEWED",
        complianceStatus: "LATE",
        activitySummary: "Penyampaian rekap terlambat 2 hari karena kendala sinkronisasi data fisik gudang. Seluruh data kas kecil telah direkonsiliasi.",
        keyMetrics: JSON.stringify({ delayedDays: 2, totalExpenses: 8900000 }),
        reviewedById: hqAdmin.id,
        reviewedAt: new Date("2026-11-04T15:20:00Z"),
      },
    ],
  });

  console.log("Created operational reports.");

  // 5. Create Office Supplies (ATK) & Inventory
  await prisma.officeItem.createMany({
    data: [
      {
        name: "Kertas HVS PaperOne A4 80gr",
        category: "ATK",
        unit: "Rim",
        stock: 3,
        minStock: 10,
        unitPrice: 54000,
        branchId: branchBdg.id,
      },
      {
        name: "Ballpoint Gel Pilot G2 0.5 Black",
        category: "ATK",
        unit: "Lusin",
        stock: 4,
        minStock: 2,
        unitPrice: 168000,
        branchId: branchBdg.id,
      },
      {
        name: "Ordner Bantex Folio 7cm Blue",
        category: "ATK",
        unit: "Pcs",
        stock: 4,
        minStock: 8,
        unitPrice: 32000,
        branchId: branchBdg.id,
      },
      {
        name: "Formulir Surat Jalan / BAST Rangkap 3",
        category: "FORMULIR",
        unit: "Buku",
        stock: 12,
        minStock: 5,
        unitPrice: 28000,
        branchId: branchBdg.id,
      },
      {
        name: "Kopi & Gula Pantry Karyawan HQ",
        category: "PANTRY",
        unit: "Pack",
        stock: 15,
        minStock: 5,
        unitPrice: 75000,
        branchId: hq.id,
      },
      {
        name: "Kertas HVS Sinar Dunia F4 75gr",
        category: "ATK",
        unit: "Rim",
        stock: 18,
        minStock: 10,
        unitPrice: 56000,
        branchId: hq.id,
      },
    ],
  });

  console.log("Created office items.");

  // 6. Create Supply Request
  await prisma.supplyRequest.create({
    data: {
      requestNumber: "REQ-2026-11-001",
      branchId: branchBdg.id,
      requesterId: branchAdminBdg.id,
      items: JSON.stringify([
        { name: "Kertas HVS PaperOne A4 80gr", qty: 15, unit: "Rim", estPrice: 54000 },
        { name: "Ordner Bantex Folio 7cm", qty: 10, unit: "Pcs", estPrice: 32000 },
        { name: "Tinta Epson 003 Black & Color Set", qty: 2, unit: "Set", estPrice: 320000 },
      ]),
      totalEstimatedCost: 1770000,
      status: "APPROVED_BRANCH",
      reason: "Stok kertas A4 tersisa 3 rim dan ordner arsip dokumen penjualan tahun berjalan sudah penuh.",
      approvedById: managerBdg.id,
    },
  });

  // 7. Create Petty Cash Records
  await prisma.pettyCash.createMany({
    data: [
      {
        code: "PC-BDG-202611-001",
        type: "INCOME",
        amount: 5000000,
        category: "REIMBURSEMENT",
        description: "Pengisian saldo kas kecil operasional cabang awal bulan November 2026",
        branchId: branchBdg.id,
        recordedById: branchAdminBdg.id,
        status: "VERIFIED",
        date: new Date("2026-11-01T08:30:00Z"),
      },
      {
        code: "PC-BDG-202611-002",
        type: "EXPENSE",
        amount: 275000,
        category: "CONSUMPTION",
        description: "Konsumsi snack rapat koordinasi sales & CS awal pekan",
        branchId: branchBdg.id,
        recordedById: branchAdminBdg.id,
        status: "VERIFIED",
        date: new Date("2026-11-04T10:15:00Z"),
      },
      {
        code: "PC-BDG-202611-003",
        type: "EXPENSE",
        amount: 140000,
        category: "OPERATIONAL",
        description: "Pembelian darurat materai 10.000 (14 lembar) untuk kontrak vendor",
        branchId: branchBdg.id,
        recordedById: branchAdminBdg.id,
        status: "VERIFIED",
        date: new Date("2026-11-08T13:45:00Z"),
      },
      {
        code: "PC-BDG-202611-004",
        type: "EXPENSE",
        amount: 85000,
        category: "TRANSPORT",
        description: "Ongkos kirim kilat dokumen legal perizinan ke kantor pusat",
        branchId: branchBdg.id,
        recordedById: branchAdminBdg.id,
        status: "PENDING",
        date: new Date("2026-11-16T15:00:00Z"),
      },
    ],
  });

  console.log("Created petty cash records.");

  // 8. Create Coordination Tickets
  await prisma.ticket.createMany({
    data: [
      {
        ticketNumber: "TCK-2026-1101",
        title: "Permintaan Verifikasi Resi Pengiriman Pesanan PT Maju Bersama",
        description: "Mohon tim Gudang dan Logistik memeriksa resi ekspedisi untuk 5 koli pesanan customer atas nama PT Maju Bersama, sales membutuhkan update segera.",
        priority: "HIGH",
        status: "IN_PROGRESS",
        targetDepartment: "GUDANG",
        creatorId: salesBdg.id,
        branchId: branchBdg.id,
        assigneeId: branchAdminBdg.id,
        dueDate: new Date("2026-11-19T17:00:00Z"),
      },
      {
        ticketNumber: "TCK-2026-1102",
        title: "Reimbursement Tiket Dinas Luar Kota Koordinasi CS",
        description: "Pengajuan verifikasi reimbursement biaya transportasi dinas survey kepuasan pelanggan di area Bandung Timur.",
        priority: "MEDIUM",
        status: "OPEN",
        targetDepartment: "FINANCE",
        creatorId: csJkt.id,
        branchId: hq.id,
        dueDate: new Date("2026-11-20T12:00:00Z"),
      },
      {
        ticketNumber: "TCK-2026-1103",
        title: "Kendala Akses Printer Jaringan Divisi Administrasi",
        description: "Printer EPSON L15150 di lantai 2 tidak terdeteksi via LAN setelah pembaruan router cabang.",
        priority: "URGENT",
        status: "RESOLVED",
        targetDepartment: "IT",
        creatorId: branchAdminBdg.id,
        branchId: branchBdg.id,
        assigneeId: sysAdmin.id,
        dueDate: new Date("2026-11-17T12:00:00Z"),
      },
    ],
  });

  // 9. Create Meeting Minutes
  await prisma.meetingMinute.create({
    data: {
      title: "Rapat Koordinasi Nasional SOP Administrasi & Target Q4 2026",
      meetingDate: new Date("2026-11-12T10:00:00Z"),
      location: "Virtual Meeting (Google Meet / Zoom HQ)",
      attendees: "Siti Rahmawati (HQ), Budi Santoso (BDG), Hendra Wijaya (BDG), Dimas (IT), Seluruh Admin Cabang",
      agenda: "1. Evaluasi kepatuhan pelaporan mingguan cabang\n2. Sosialisasi penomoran surat otomatis Fainaya AdminDesk\n3. Pengelolaan Petty Cash dan bukti kuitansi digital",
      notes: "Seluruh cabang menyepakati batas akhir input laporan harian maksimal pukul 17:30 WIB setiap hari kerja. Sistem Fainaya AdminDesk resmi menjadi standar tunggal.",
      actionItems: JSON.stringify([
        { task: "Unggah dokumen perizinan cabang yang telah diperbarui", pic: "Budi Santoso", deadline: "2026-11-25" },
        { task: "Audit fisik stok ATK di gudang logistik pusat", pic: "Siti Rahmawati", deadline: "2026-11-22" },
        { task: "Uji coba simulasi persetujuan anggaran pengadaan kantor", pic: "Hendra Wijaya", deadline: "2026-11-20" },
      ]),
      creatorId: hqAdmin.id,
      branchId: hq.id,
    },
  });

  // 10. Create Bulletins
  await prisma.bulletin.createMany({
    data: [
      {
        title: "Pedoman Penyeragaman Format Surat Resmi & Dokumen Fainaya Group 2026",
        content: "Diberitahukan kepada seluruh koordinator admin cabang dan divisi terkait, terhitung mulai 1 Desember 2026 penomoran surat resmi wajib mengikuti generator otomatis sistem Fainaya AdminDesk demi menjamin ketertelusuran nomor surat masuk dan keluar.",
        category: "POLICY",
        priority: "CRITICAL",
        authorId: hqAdmin.id,
        targetAudience: "ALL",
      },
      {
        title: "Jadwal Libur Operasional Nasional & Batas Pengiriman Laporan Cabang",
        content: "Sehubungan dengan libur nasional mendatang, laporan mingguan cabang dapat dikompilasi lebih awal pada hari Kamis sebelum pukul 15:00 WIB.",
        category: "HOLIDAY",
        priority: "IMPORTANT",
        authorId: hqAdmin.id,
        targetAudience: "CABANG_ONLY",
      },
    ],
  });

  // 11. Create Sales Checklists
  await prisma.salesChecklist.createMany({
    data: [
      {
        orderNumber: "ORD-2026-1101",
        customerName: "PT Citra Mandiri Sejahtera",
        branchId: branchBdg.id,
        salesPersonId: salesBdg.id,
        verifiedById: branchAdminBdg.id,
        formOrderVerified: true,
        customerIdentityVerified: true,
        financingDocVerified: true,
        invoiceVerified: true,
        deliveryHandoverVerified: true,
        status: "COMPLIANT",
        notes: "Semua berkas lengkap, KTP & NPWP valid, PO bertandatangan direktur, siap kirim.",
      },
      {
        orderNumber: "ORD-2026-1102",
        customerName: "CV Prima Karya Gemilang",
        branchId: branchBdg.id,
        salesPersonId: salesBdg.id,
        verifiedById: branchAdminBdg.id,
        formOrderVerified: true,
        customerIdentityVerified: true,
        financingDocVerified: false,
        invoiceVerified: false,
        deliveryHandoverVerified: false,
        status: "IN_REVIEW",
        notes: "Menunggu kelengkapan bukti transfer DP dan surat kuasa serah terima barang.",
      },
    ],
  });

  // 12. Create Catalog Distributions
  await prisma.catalogDistribution.createMany({
    data: [
      {
        title: "Pricelist Resmi Produk Fainaya Group Q4 2026 (Rev. 3)",
        type: "PRICELIST",
        version: "v4.3",
        description: "Daftar harga jual resmi berlaku mulai 1 November 2026 untuk seluruh distributor dan agen cabang.",
        validUntil: new Date("2026-12-31T23:59:59Z"),
        isActive: true,
      },
      {
        title: "Paket Promo Pesta Akhir Tahun 2026 & Bundling Operasional",
        type: "PROMO_SCHEME",
        version: "v1.0",
        description: "Skema diskon volume dan cashback khusus pemesanan grosir hingga Desember 2026.",
        validUntil: new Date("2026-12-31T23:59:59Z"),
        isActive: true,
      },
      {
        title: "Syarat & Ketentuan Standar Penjualan dan Retur Barang",
        type: "TERMS_CONDITIONS",
        version: "v2.0",
        description: "SOP resmi garansi, penukaran barang cacat pabrik, dan klaim asuransi pengiriman.",
        isActive: true,
      },
    ],
  });

  // 12b. Create After Sales Cases (CS escalation & warranty / after-sales)
  await prisma.afterSalesCase.createMany({
    data: [
      {
        caseNumber: "ASC-2026-001",
        customerName: "PT Maju Bersama Sejahtera",
        type: "WARRANTY_CLAIM",
        priority: "HIGH",
        status: "IN_PROGRESS",
        slaDueDate: new Date("2026-11-25T23:59:59Z"),
        resolvedAt: null,
        description: "Barang kurang 2 unit hari setelah serah terima, tim logistics mengkonfirmasi kerusakan saat transit.",
        branchId: branchBdg.id,
        creatorId: salesBdg.id,
        assigneeId: branchAdminBdg.id,
      },
      {
        caseNumber: "ASC-2026-002",
        customerName: "CV Prima Karya Gemilang",
        type: "COMPLAINT",
        priority: "URGENT",
        status: "OPEN",
        slaDueDate: new Date("2026-11-20T23:59:59Z"),
        resolvedAt: null,
        description: "Komplain pengiriman barang ke alamat salah dan kekurangan 1 set invoice pengiriman.",
        branchId: branchBdg.id,
        creatorId: salesBdg.id,
        assigneeId: null,
      },
      {
        caseNumber: "ASC-2026-003",
        customerName: "UD Sumber Rejeki",
        type: "SERVICE_REQUEST",
        priority: "NORMAL",
        status: "RESOLVED",
        slaDueDate: new Date("2026-11-18T23:59:59Z"),
        resolvedAt: new Date("2026-11-19T09:00:00Z"),
        resolution: "Sertifikasi purna jual diperbarui dan tim maintenance unit terverifikasi, klaim servis disetujui.",
        description: "Permintaan servis unit genset kantor cabang Surabaya, jadwal teknisi dan update garansi purna jual.",
        branchId: branchSby.id,
        creatorId: csJkt.id,
        assigneeId: hqAdmin.id,
      },
    ],
  });

  console.log("Created after-sales cases.");

  // 13. Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: hqAdmin.id,
        action: "INITIAL_SEED",
        entity: "SYSTEM",
        details: "Inisialisasi sistem open-source Fainaya AdminDesk v1.0",
        ipAddress: DEMO_IP_HQ,
      },
      {
        userId: branchAdminBdg.id,
        action: "CREATE_DOCUMENT",
        entity: "Document",
        entityId: "014/SK/CAB-BDG/OPS/XI/2026",
        details: "Membuat draft surat penawaran kurir",
        ipAddress: DEMO_IP_BRANCH,
      },
      {
        userId: managerBdg.id,
        action: "APPROVE_SUPPLY",
        entity: "SupplyRequest",
        entityId: "REQ-2026-11-001",
        details: "Menyetujui pengadaan kertas A4 & ordner arsip",
        ipAddress: DEMO_IP_MANAGER,
      },
    ],
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
