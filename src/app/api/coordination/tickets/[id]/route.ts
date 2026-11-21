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

    const { status, priority, assigneeId, title, description } = await req.json();

    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tiket tidak ditemukan" }, { status: 404 });
    }

    const isPrivileged =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (!isPrivileged && existing.branchId !== user.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (assigneeId !== undefined) {
      data.assignee = assigneeId ? { connect: { id: assigneeId } } : { disconnect: true };
    }

    const updated = await prisma.ticket.update({
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
      action: status ? `UPDATE_TICKET_${status}` : "UPDATE_TICKET",
      entity: "Ticket",
      entityId: id,
      details: `Memperbarui tiket ${existing.ticketNumber}${status ? ` menjadi ${status}` : ""}`,
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error) {
    console.error("Ticket update error:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
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

    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tiket tidak ditemukan" }, { status: 404 });
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

    await prisma.ticket.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      action: "DELETE_TICKET",
      entity: "Ticket",
      entityId: id,
      details: `Menghapus tiket ${existing.ticketNumber}: ${existing.title}`,
    });

    return NextResponse.json({ success: true, message: "Tiket berhasil dihapus." });
  } catch (error) {
    console.error("Ticket delete error:", error);
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}