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

    const existing = await prisma.supplyRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Permintaan tidak ditemukan" }, { status: 404 });
    }

    const isPrivileged =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (!isPrivileged && existing.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status } = await req.json();

    if (status && !["HQ_COORDINATOR", "BRANCH_MANAGER", "SYSTEM_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden: tidak berwenang menyetujui pengadaan" }, { status: 403 });
    }

    const updated = await prisma.supplyRequest.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(status ? { approvedBy: { connect: { id: user.id } } } : {}),
      },
      include: {
        branch: true,
        requester: true,
        approvedBy: true,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: `SUPPLY_REQUEST_${status}`,
      entity: "SupplyRequest",
      entityId: id,
      details: `Persetujuan status permintaan ${updated.requestNumber} diubah ke ${status}`,
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error("Supply update error:", error);
    return NextResponse.json({ error: "Failed to update supply request" }, { status: 500 });
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

    const existing = await prisma.supplyRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Permintaan tidak ditemukan" }, { status: 404 });
    }

    const isPrivilegedDel =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (!isPrivilegedDel && existing.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.id !== existing.requesterId && !isPrivilegedDel) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.supplyRequest.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      action: "DELETE_SUPPLY_REQUEST",
      entity: "SupplyRequest",
      entityId: id,
      details: `Menghapus permintaan pengadaan ${existing.requestNumber}`,
    });

    return NextResponse.json({ success: true, message: "Permintaan pengadaan berhasil dihapus." });
  } catch (error) {
    console.error("Supply delete error:", error);
    return NextResponse.json({ error: "Failed to delete supply request" }, { status: 500 });
  }
}