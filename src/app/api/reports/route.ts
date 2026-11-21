import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentUser, logAuditEvent } from "@/lib/auth";
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

    const isHqOrSysadmin =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;

    const whereClause: Prisma.OperationalReportWhereInput = {
      ...(isHqOrSysadmin ? {} : { branchId: user.branchId! }),
      ...(periodType && periodType !== "ALL" ? { periodType } : {}),
      ...(status && status !== "ALL" ? { status } : {}),
    };

    const reports = await prisma.operationalReport.findMany({
      where: whereClause,
      orderBy: { periodDate: "desc" },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true, role: true } },
        reviewedBy: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Reports GET error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, periodType, periodDate, activitySummary, notes, targetBranchId } = await req.json();

    if (!title || !periodType || !activitySummary) {
      return NextResponse.json(
        { error: "Judul, jenis periode, dan ringkasan aktivitas wajib diisi." },
        { status: 400 }
      );
    }

    const branchId = (user.role === "HQ_COORDINATOR" || user.role === "SYSTEM_ADMIN" || !user.branchId) ? (targetBranchId || user.branchId) : user.branchId;
    if (!branchId) {
      return NextResponse.json({ error: "Cabang wajib ditentukan." }, { status: 400 });
    }

    // Determine compliance: e.g., if submitted past 17:30 WIB or after date
    const now = new Date();
    const hours = now.getHours();
    const isLate = hours >= 18; // After 18:00 is considered late for daily reporting
    const complianceStatus = isLate ? "LATE" : "ON_TIME";

    const report = await prisma.operationalReport.create({
      data: {
        title,
        periodType,
        periodDate: periodDate ? new Date(periodDate) : new Date(),
        activitySummary,
        notes: notes || null,
        complianceStatus,
        status: "SUBMITTED",
        branchId,
        creatorId: user.id,
      },
      include: {
        branch: true,
        creator: true,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "SUBMIT_OPERATIONAL_REPORT",
      entity: "OperationalReport",
      entityId: report.id,
      details: `Mengirim ${periodType} report: ${title} (${complianceStatus})`,
    });

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (error) {
    console.error("Report creation error:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
