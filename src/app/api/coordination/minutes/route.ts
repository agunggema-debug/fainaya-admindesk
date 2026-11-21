import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentUser, logAuditEvent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isHqOrSysadmin =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;

    const whereClause: Prisma.MeetingMinuteWhereInput = isHqOrSysadmin
      ? {}
      : { OR: [{ branchId: user.branchId! }, { branchId: null }] };

    const minutes = await prisma.meetingMinute.findMany({
      where: whereClause,
      orderBy: { meetingDate: "desc" },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ minutes });
  } catch (error) {
    console.error("Minutes GET error:", error);
    return NextResponse.json({ error: "Failed to fetch meeting minutes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, meetingDate, location, attendees, agenda, notes, actionItems, targetBranchId } = await req.json();

    if (!title || !attendees || !agenda || !notes) {
      return NextResponse.json(
        { error: "Judul, peserta, agenda, dan catatan rapat wajib diisi." },
        { status: 400 }
      );
    }

    const branchId = (user.role === "HQ_COORDINATOR" || user.role === "SYSTEM_ADMIN" || !user.branchId) ? (targetBranchId === "HQ" ? null : (targetBranchId || user.branchId) || null) : (user.branchId || null);

    const minute = await prisma.meetingMinute.create({
      data: {
        title,
        meetingDate: meetingDate ? new Date(meetingDate) : new Date(),
        location: location || "Ruang Rapat",
        attendees,
        agenda,
        notes,
        actionItems: typeof actionItems === "string" ? actionItems : JSON.stringify(actionItems || []),
        branchId,
        creatorId: user.id,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true, role: true } },
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "CREATE_MEETING_MINUTE",
      entity: "MeetingMinute",
      entityId: minute.id,
      details: `Membuat notulensi rapat: ${title}`,
    });

    return NextResponse.json({ success: true, minute }, { status: 201 });
  } catch (error) {
    console.error("Minute creation error:", error);
    return NextResponse.json({ error: "Failed to create meeting minute" }, { status: 500 });
  }
}