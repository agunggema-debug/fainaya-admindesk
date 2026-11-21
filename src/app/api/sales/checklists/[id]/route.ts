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

    const existing = await prisma.salesChecklist.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Checklist tidak ditemukan" }, { status: 404 });
    }

    const isPrivileged =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (!isPrivileged && existing.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      formOrderVerified,
      customerIdentityVerified,
      financingDocVerified,
      invoiceVerified,
      deliveryHandoverVerified,
      status,
      notes,
      verifiedById,
    } = await req.json();

    if (status !== undefined && !["HQ_COORDINATOR", "BRANCH_ADMIN", "BRANCH_MANAGER", "SYSTEM_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden: tidak berwenang memverifikasi checklist" }, { status: 403 });
    }

    const data: Record<string, unknown> = {};

    if (typeof formOrderVerified !== "undefined") data.formOrderVerified = formOrderVerified;
    if (typeof customerIdentityVerified !== "undefined") data.customerIdentityVerified = customerIdentityVerified;
    if (typeof financingDocVerified !== "undefined") data.financingDocVerified = financingDocVerified;
    if (typeof invoiceVerified !== "undefined") data.invoiceVerified = invoiceVerified;
    if (typeof deliveryHandoverVerified !== "undefined") data.deliveryHandoverVerified = deliveryHandoverVerified;
    if (status !== undefined) {
      data.status = status;
      if (status === "COMPLIANT" || status === "INCOMPLETE") {
        data.verifiedById = user.id;
      }
    }
    if (verifiedById !== undefined) data.verifiedById = verifiedById || null;
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.salesChecklist.update({
      where: { id },
      data,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        salesPerson: { select: { id: true, name: true, role: true } },
        verifiedBy: { select: { id: true, name: true, role: true } },
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: `UPDATE_SALES_CHECKLIST_${status || "UPDATED"}`,
      entity: "SalesChecklist",
      entityId: id,
      details: `Checklist penjualan ${existing.orderNumber} diubah menjadi status ${status || "diperbarui"}`,
    });

    return NextResponse.json({ success: true, checklist: updated });
  } catch (error) {
    console.error("Sales checklist update error:", error);
    return NextResponse.json({ error: "Failed to update sales checklist" }, { status: 500 });
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

    const existing = await prisma.salesChecklist.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Checklist tidak ditemukan" }, { status: 404 });
    }

    const isPrivilegedDel =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (!isPrivilegedDel && existing.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.salesChecklist.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      action: "DELETE_SALES_CHECKLIST",
      entity: "SalesChecklist",
      entityId: id,
      details: `Menghapus checklist penjualan ${existing.orderNumber}: ${existing.customerName}`,
    });

    return NextResponse.json({ success: true, message: "Checklist penjualan berhasil dihapus." });
  } catch (error) {
    console.error("Sales checklist delete error:", error);
    return NextResponse.json({ error: "Failed to delete sales checklist" }, { status: 500 });
  }
}
