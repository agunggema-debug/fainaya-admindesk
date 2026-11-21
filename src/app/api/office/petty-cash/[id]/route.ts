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

    const existing = await prisma.pettyCash.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Catatan kas kecil tidak ditemukan" }, { status: 404 });
    }

    const isPrivileged =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (!isPrivileged && existing.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Only privileged users can change status (verification/reimbursement)
    const { status, description, category, amount } = await req.json();
    if (status !== undefined && !["HQ_COORDINATOR", "BRANCH_ADMIN", "BRANCH_MANAGER", "SYSTEM_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden: tidak berwenang mengubah status kas kecil" }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (description !== undefined) data.description = description;
    if (category !== undefined) data.category = category;
    if (amount !== undefined) data.amount = Number(amount);

    const updated = await prisma.pettyCash.update({
      where: { id },
      data,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        recordedBy: { select: { id: true, name: true, role: true } },
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: status ? `UPDATE_PETTY_CASH_${status}` : "UPDATE_PETTY_CASH",
      entity: "PettyCash",
      entityId: id,
      details: `Memperbarui catatan kas kecil ${existing.code}${status ? ` menjadi ${status}` : ""}`,
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (error) {
    console.error("Petty cash update error:", error);
    return NextResponse.json({ error: "Failed to update petty cash record" }, { status: 500 });
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

    const existing = await prisma.pettyCash.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Catatan kas kecil tidak ditemukan" }, { status: 404 });
    }

    const isPrivilegedDel =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (!isPrivilegedDel && existing.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.id !== existing.recordedById && !isPrivilegedDel) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.pettyCash.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      action: "DELETE_PETTY_CASH",
      entity: "PettyCash",
      entityId: id,
      details: `Menghapus catatan kas kecil ${existing.code}: ${existing.description}`,
    });

    return NextResponse.json({ success: true, message: "Catatan kas kecil berhasil dihapus." });
  } catch (error) {
    console.error("Petty cash delete error:", error);
    return NextResponse.json({ error: "Failed to delete petty cash record" }, { status: 500 });
  }
}