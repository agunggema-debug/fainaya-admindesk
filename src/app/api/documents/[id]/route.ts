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

    const { status, title, summary } = await req.json();

    const existingDoc = await prisma.document.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!existingDoc) {
      return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
    }

    const isPrivileged =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (!isPrivileged && existingDoc.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (status === "DISETUJUI" && !["HQ_COORDINATOR", "BRANCH_MANAGER", "SYSTEM_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden: tidak berwenang menyetujui dokumen" }, { status: 403 });
    }

    const updateData: Prisma.DocumentUpdateInput = {};
    if (title) updateData.title = title;
    if (summary !== undefined) updateData.summary = summary;

    if (status) {
      updateData.status = status;
      if (status === "DISETUJUI") {
        updateData.approver = { connect: { id: user.id } };
        updateData.signedAt = new Date();
        updateData.qrCode = `VERIFIED-${existingDoc.docNumber.replace(/\//g, "-")}-${Date.now()}`;
      }
    }

    const updatedDoc = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        branch: true,
        creator: { select: { id: true, name: true, role: true } },
        approver: { select: { id: true, name: true, role: true } },
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: status ? `UPDATE_DOC_STATUS_${status}` : "UPDATE_DOCUMENT",
      entity: "Document",
      entityId: id,
      details: `Status dokumen ${existingDoc.docNumber} diubah menjadi ${status || "diperbarui"}`,
    });

    return NextResponse.json({ success: true, document: updatedDoc });
  } catch (error) {
    console.error("Document update error:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
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

    const existingDoc = await prisma.document.findUnique({ where: { id } });
    if (!existingDoc) {
      return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
    }

    const isPrivilegedDel =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (!isPrivilegedDel && existingDoc.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.id !== existingDoc.creatorId && !isPrivilegedDel) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.document.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      action: "DELETE_DOCUMENT",
      entity: "Document",
      entityId: id,
      details: `Menghapus dokumen ${existingDoc.docNumber}: ${existingDoc.title}`,
    });

    return NextResponse.json({ success: true, message: "Dokumen berhasil dihapus." });
  } catch (error) {
    console.error("Document delete error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}