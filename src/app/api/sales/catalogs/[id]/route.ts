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

    const existing = await prisma.catalogDistribution.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Katalog tidak ditemukan" }, { status: 404 });
    }

    const isPrivileged =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (!isPrivileged && existing.branchId !== null && existing.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, type, version, fileUrl, description, validUntil, branchId, isActive } = await req.json();

    const data: Record<string, unknown> = {};

    if (title !== undefined) data.title = title;
    if (type !== undefined) data.type = type;
    if (version !== undefined) data.version = version;
    if (fileUrl !== undefined) data.fileUrl = fileUrl;
    if (description !== undefined) data.description = description;
    if (validUntil !== undefined) data.validUntil = validUntil ? new Date(validUntil) : null;
    if (isActive !== undefined) data.isActive = isActive;
    if (branchId !== undefined) data.branchId = branchId;

    const updated = await prisma.catalogDistribution.update({
      where: { id },
      data,
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "UPDATE_CATALOG_DISTRIBUTION",
      entity: "CatalogDistribution",
      entityId: id,
      details: `Memperbarui katalog distribusi ${existing.title} (${existing.type})`,
    });

    return NextResponse.json({ success: true, catalog: updated });
  } catch (error) {
    console.error("Catalog distribution update error:", error);
    return NextResponse.json({ error: "Failed to update catalog distribution" }, { status: 500 });
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

    const existing = await prisma.catalogDistribution.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Katalog tidak ditemukan" }, { status: 404 });
    }

    const isPrivilegedDel =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (!isPrivilegedDel && existing.branchId !== null && existing.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.catalogDistribution.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      action: "DELETE_CATALOG_DISTRIBUTION",
      entity: "CatalogDistribution",
      entityId: id,
      details: `Menghapus katalog distribusi ${existing.title} (${existing.type})`,
    });

    return NextResponse.json({ success: true, message: "Katalog distribusi berhasil dihapus." });
  } catch (error) {
    console.error("Catalog distribution delete error:", error);
    return NextResponse.json({ error: "Failed to delete catalog distribution" }, { status: 500 });
  }
}
