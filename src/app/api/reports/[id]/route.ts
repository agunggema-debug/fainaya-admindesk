import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, logAuditEvent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, notes } = await req.json();

    const existingReport = await prisma.operationalReport.findUnique({ where: { id } });
    if (!existingReport) {
      return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
    }

    const isPrivileged =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (!isPrivileged && existingReport.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (status && !["HQ_COORDINATOR", "BRANCH_MANAGER", "SYSTEM_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden: tidak berwenang mereview laporan" }, { status: 403 });
    }


    const report = await prisma.operationalReport.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(status ? { reviewedById: user.id, reviewedAt: new Date() } : {}),
      },
      include: {
        branch: true,
        creator: true,
        reviewedBy: true,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: `REVIEW_REPORT_${status || "UPDATED"}`,
      entity: "OperationalReport",
      entityId: id,
      details: `Laporan di-review menjadi status ${status}`,
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Report update error:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.operationalReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
    }

    const isPrivilegedDel =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (!isPrivilegedDel && existing.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.id !== existing.creatorId && !isPrivilegedDel) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.operationalReport.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      action: "DELETE_OPERATIONAL_REPORT",
      entity: "OperationalReport",
      entityId: id,
      details: `Menghapus laporan: ${existing.title}`,
    });

    return NextResponse.json({ success: true, message: "Laporan berhasil dihapus." });
  } catch (error) {
    console.error("Report delete error:", error);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}