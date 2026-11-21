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

    const { title, meetingDate, location, attendees, agenda, notes, actionItems } = await req.json();

    const existing = await prisma.meetingMinute.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Notulensi tidak ditemukan" }, { status: 404 });
    }

    const isPrivileged =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (
      !isPrivileged &&
      existing.branchId !== null &&
      existing.branchId !== user.branchId &&
      existing.creatorId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (meetingDate !== undefined) data.meetingDate = meetingDate ? new Date(meetingDate) : new Date();
    if (location !== undefined) data.location = location;
    if (attendees !== undefined) data.attendees = attendees;
    if (agenda !== undefined) data.agenda = agenda;
    if (notes !== undefined) data.notes = notes;
    if (actionItems !== undefined) data.actionItems = typeof actionItems === "string" ? actionItems : JSON.stringify(actionItems);

    const updated = await prisma.meetingMinute.update({
      where: { id },
      data,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true, role: true } },
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "UPDATE_MEETING_MINUTE",
      entity: "MeetingMinute",
      entityId: id,
      details: `Memperbarui notulensi rapat: ${existing.title}`,
    });

    return NextResponse.json({ success: true, minute: updated });
  } catch (error) {
    console.error("Minute update error:", error);
    return NextResponse.json({ error: "Failed to update meeting minute" }, { status: 500 });
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

    const existing = await prisma.meetingMinute.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Notulensi tidak ditemukan" }, { status: 404 });
    }

    const isPrivilegedDel =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;
    if (
      !isPrivilegedDel &&
      existing.branchId !== null &&
      existing.branchId !== user.branchId &&
      existing.creatorId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.meetingMinute.delete({ where: { id } });

    await logAuditEvent({
      userId: user.id,
      action: "DELETE_MEETING_MINUTE",
      entity: "MeetingMinute",
      entityId: id,
      details: `Menghapus notulensi rapat: ${existing.title}`,
    });

    return NextResponse.json({ success: true, message: "Notulensi berhasil dihapus." });
  } catch (error) {
    console.error("Minute delete error:", error);
    return NextResponse.json({ error: "Failed to delete meeting minute" }, { status: 500 });
  }
}