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

    const existing = await prisma.afterSalesCase.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kasus after-sales tidak ditemukan" }, { status: 404 });
    }

    const isPrivileged =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (!isPrivileged && existing.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status, priority, resolution, assigneeId, slaDueDate } = await req.json();

    const data: Record<string, unknown> = {};

    if (status !== undefined) {
      data.status = status;
      if (status === "RESOLVED") {
        data.resolvedAt = new Date();
      }
    }
    if (priority !== undefined) data.priority = priority;
    if (resolution !== undefined) data.resolution = resolution;
    if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
    if (slaDueDate !== undefined) data.slaDueDate = slaDueDate ? new Date(slaDueDate) : null;

    const updated = await prisma.afterSalesCase.update({
      where: { id },
      data,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true, role: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: `UPDATE_AFTER_SALES_CASE_${status || "UPDATED"}`,
      entity: "AfterSalesCase",
      entityId: id,
      details: `Kasus after-sales ${existing.caseNumber} diubah menjadi status ${status || "diperbarui"}`,
    });

    return NextResponse.json({ success: true, case: updated });
  } catch (error) {
    console.error("After-sales case update error:", error);
    return NextResponse.json({ error: "Failed to update after-sales case" }, { status: 500 });
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

    const existing = await prisma.afterSalesCase.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kasus after-sales tidak ditemukan" }, { status: 404 });
    }

    const isPrivilegedDel =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (!isPrivilegedDel && existing.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.afterSalesCase.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      action: "DELETE_AFTER_SALES_CASE",
      entity: "AfterSalesCase",
      entityId: id,
      details: `Menghapus kasus after-sales ${existing.caseNumber}: ${existing.customerName}`,
    });

    return NextResponse.json({ success: true, message: "Kasus after-sales berhasil dihapus." });
  } catch (error) {
    console.error("After-sales case delete error:", error);
    return NextResponse.json({ error: "Failed to delete after-sales case" }, { status: 500 });
  }
}
