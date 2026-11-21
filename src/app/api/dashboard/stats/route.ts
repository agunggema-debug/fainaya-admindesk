import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isHqOrSysadmin =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;

    // Filter by branch if user is branch-scoped
    const branchFilter = isHqOrSysadmin ? {} : { branchId: user.branchId! };

    // 1. Documents stats
    const totalDocs = await prisma.document.count({ where: branchFilter });
    const pendingDocs = await prisma.document.count({
      where: { ...branchFilter, status: "MENUNGGU_REVIEW" },
    });
    const approvedDocs = await prisma.document.count({
      where: { ...branchFilter, status: "DISETUJUI" },
    });

    // 2. Operational Reports stats
    const totalReports = await prisma.operationalReport.count({ where: branchFilter });
    const onTimeReports = await prisma.operationalReport.count({
      where: { ...branchFilter, complianceStatus: "ON_TIME" },
    });
    const complianceRate = totalReports > 0 ? Math.round((onTimeReports / totalReports) * 100) : 100;

    // 3. ATK & Office Supplies
    const items = await prisma.officeItem.findMany({ where: branchFilter });
    const lowStockCount = items.filter((item) => item.stock <= item.minStock).length;

    // 4. Petty Cash
    const pettyCashRecords = await prisma.pettyCash.findMany({ where: branchFilter });
    const totalIncome = pettyCashRecords
      .filter((r) => r.type === "INCOME")
      .reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = pettyCashRecords
      .filter((r) => r.type === "EXPENSE")
      .reduce((sum, r) => sum + r.amount, 0);
    const pettyCashBalance = totalIncome - totalExpense;

    // 5. Tickets
    const totalTickets = await prisma.ticket.count({ where: branchFilter });
    const activeTickets = await prisma.ticket.count({
      where: { ...branchFilter, status: { in: ["OPEN", "IN_PROGRESS"] } },
    });

    // 6. Sales Checklists
    const pendingSalesVerifications = await prisma.salesChecklist.count({
      where: { ...branchFilter, status: "IN_REVIEW" },
    });

    // 7. Recent Activities
    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, role: true } } },
    });

    // 8. Recent Bulletins
    const recentBulletins = await prisma.bulletin.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    });

    return NextResponse.json({
      summary: {
        totalDocs,
        pendingDocs,
        approvedDocs,
        totalReports,
        complianceRate,
        lowStockCount,
        pettyCashBalance,
        totalTickets,
        activeTickets,
        pendingSalesVerifications,
      },
      recentAuditLogs,
      recentBulletins,
      userScope: {
        role: user.role,
        isHqOrSysadmin,
        branchName: user.branch?.name || "Seluruh Cabang (HQ)",
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
