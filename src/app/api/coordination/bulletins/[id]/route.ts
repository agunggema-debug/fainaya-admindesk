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

    const { title, content, category, priority, targetAudience } = await req.json();

    const existing = await prisma.bulletin.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Pengumuman tidak ditemukan" }, { status: 404 });
    }

    const isPrivileged =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN";
    if (existing.authorId !== user.id && !isPrivileged) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (category !== undefined) data.category = category;
    if (priority !== undefined) data.priority = priority;
    if (targetAudience !== undefined) data.targetAudience = targetAudience;

    const updated = await prisma.bulletin.update({
      where: { id },
      data,
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "UPDATE_BULLETIN",
      entity: "Bulletin",
      entityId: id,
      details: `Memperbarui pengumuman: ${existing.title}`,
    });

    return NextResponse.json({ success: true, bulletin: updated });
  } catch (error) {
    console.error("Bulletin update error:", error);
    return NextResponse.json({ error: "Failed to update bulletin" }, { status: 500 });
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

    const existing = await prisma.bulletin.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Pengumuman tidak ditemukan" }, { status: 404 });
    }

    const isPrivilegedDel =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN";
    if (existing.authorId !== user.id && !isPrivilegedDel) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.bulletin.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      action: "DELETE_BULLETIN",
      entity: "Bulletin",
      entityId: id,
      details: `Menghapus pengumuman: ${existing.title}`,
    });

    return NextResponse.json({ success: true, message: "Pengumuman berhasil dihapus." });
  } catch (error) {
    console.error("Bulletin delete error:", error);
    return NextResponse.json({ error: "Failed to delete bulletin" }, { status: 500 });
  }
}