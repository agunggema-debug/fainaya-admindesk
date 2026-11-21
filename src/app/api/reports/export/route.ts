import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const periodType = searchParams.get("periodType");
    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");

    const isHqOrSysadmin = ["HQ_COORDINATOR", "SYSTEM_ADMIN"].includes(user.role) || !user.branchId;

    const whereClause: Record<string, unknown> = {
      ...(isHqOrSysadmin ? {} : { branchId: user.branchId! }),
      ...(isHqOrSysadmin && branchId ? { branchId } : {}),
    };

    if (periodType && periodType !== "ALL") whereClause.periodType = periodType;
    if (status && status !== "ALL") whereClause.status = status;

    const reports = await prisma.operationalReport.findMany({
      where: whereClause,
      orderBy: { periodDate: "desc" },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true, role: true } },
        reviewedBy: { select: { id: true, name: true, role: true } },
      },
    });

    const headers = ["No", "Judul", "Cabang", "Periode", "Status", "Kepatuhan", "Dibuat Oleh", "Dikirim", "Diulas"];
    const rows = reports.map((r, i) => [
      i + 1,
      r.title,
      r.branch.code,
      r.periodType,
      r.status,
      r.complianceStatus,
      r.creator.name,
      r.periodDate.toISOString().split("T")[0],
      r.reviewedBy?.name || "—",
    ]);

    const escape = (v: string | number) => {
      const s = String(v);
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const csv = [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="laporan-operasional-${new Date().toISOString().split("T")[0]}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json({ error: "Gagal mengekspor laporan." }, { status: 500 });
  }
}
