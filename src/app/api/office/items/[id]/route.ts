import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
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

    const existing = await prisma.officeItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
    }

    const isPrivileged =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (!isPrivileged && existing.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { stock, minStock, unitPrice } = await req.json();

    const updateData: Prisma.OfficeItemUpdateInput = {};
    if (stock !== undefined) updateData.stock = Number(stock);
    if (minStock !== undefined) updateData.minStock = Number(minStock);
    if (unitPrice !== undefined) updateData.unitPrice = Number(unitPrice);

    const updatedItem = await prisma.officeItem.update({
      where: { id },
      data: updateData,
    });

    await logAuditEvent({
      userId: user.id,
      action: "UPDATE_OFFICE_STOCK",
      entity: "OfficeItem",
      entityId: id,
      details: `Penyesuaian stok ${updatedItem.name} menjadi ${updatedItem.stock}`,
    });

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error("Office item update error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
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

    const existing = await prisma.officeItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
    }

    const isPrivilegedDel =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (!isPrivilegedDel && existing.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.officeItem.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      action: "DELETE_OFFICE_ITEM",
      entity: "OfficeItem",
      entityId: id,
      details: `Menghapus item ATK: ${existing.name}`,
    });

    return NextResponse.json({ success: true, message: "Item berhasil dihapus." });
  } catch (error) {
    console.error("Office item delete error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}