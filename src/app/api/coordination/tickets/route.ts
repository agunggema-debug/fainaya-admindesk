import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentUser, logAuditEvent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const priority = searchParams.get("priority");
    const status = searchParams.get("status");

    const isHqOrSysadmin =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;

    const whereClause: Prisma.TicketWhereInput = {
      ...(isHqOrSysadmin ? {} : { branchId: user.branchId! }),
      ...(priority && priority !== "ALL" ? { priority } : {}),
      ...(status && status !== "ALL" ? { status } : {}),
    };

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true, role: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Tickets GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, priority, targetDepartment, dueDate, assigneeId, targetBranchId } = await req.json();

    if (!title || !description || !targetDepartment) {
      return NextResponse.json(
        { error: "Judul, deskripsi, dan departemen tujuan wajib diisi." },
        { status: 400 }
      );
    }

    const branchId = (user.role === "HQ_COORDINATOR" || user.role === "SYSTEM_ADMIN" || !user.branchId) ? (targetBranchId || user.branchId) : user.branchId;
    if (!branchId) {
      return NextResponse.json({ error: "Cabang wajib ditentukan." }, { status: 400 });
    }

    const count = await prisma.ticket.count();
    const ticketNumber = `TKT-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title,
        description,
        priority: priority || "MEDIUM",
        status: "OPEN",
        targetDepartment,
        branchId,
        creatorId: user.id,
        ...(assigneeId ? { assigneeId } : {}),
        ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true, role: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "CREATE_TICKET",
      entity: "Ticket",
      entityId: ticket.id,
      details: `Membuat tiket koordinasi ${ticketNumber}: ${title} → ${targetDepartment}`,
    });

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (error) {
    console.error("Ticket creation error:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}