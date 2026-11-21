import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, logAuditEvent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const branchId = searchParams.get("branchId");

    const isHqOrSysadmin = [
      "HQ_COORDINATOR", "SYSTEM_ADMIN"
    ].includes(user.role);

    const whereClause: Record<string, unknown> = {
      ...(isHqOrSysadmin ? {} : { branchId: user.branchId! }),
      ...(isHqOrSysadmin && branchId ? { branchId } : {}),
    };

    if (type && type !== "ALL") whereClause.type = type;
    if (status && status !== "ALL") whereClause.status = status;
    if (priority && priority !== "ALL") whereClause.priority = priority;

    const cases = await prisma.afterSalesCase.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true, role: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ cases });
  } catch (error) {
    console.error("After-sales cases GET error:", error);
    return NextResponse.json({ error: "Failed to fetch after-sales cases" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { caseNumber, customerName, type, priority, status, slaDueDate, description, branchId, assigneeId } = await req.json();

    if (!caseNumber || !customerName || !type || !slaDueDate || !description) {
      return NextResponse.json(
        { error: "Nomor kasus, nama customer, tipe, SLA due date, dan deskripsi wajib diisi." },
        { status: 400 }
      );
    }

    const branchToUse = (user.role === "HQ_COORDINATOR" || user.role === "SYSTEM_ADMIN" || !user.branchId) ? (branchId || user.branchId) : user.branchId;
    if (!branchToUse) {
      return NextResponse.json({ error: "Cabang wajib ditentukan." }, { status: 400 });
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchToUse } });
    if (!branch) {
      return NextResponse.json({ error: "Cabang tidak valid." }, { status: 400 });
    }

    const caseRec = await prisma.afterSalesCase.create({
      data: {
        caseNumber,
        customerName,
        type,
        priority,
        status,
        slaDueDate: new Date(slaDueDate),
        description,
        resolution: null,
        branchId: branchToUse,
        creatorId: user.id,
        assigneeId: assigneeId || null,
      },
      include: {
        branch: true,
        creator: { select: { id: true, name: true, role: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "CREATE_AFTER_SALES_CASE",
      entity: "AfterSalesCase",
      entityId: caseRec.id,
      details: `Membuat kasus after-sales: ${caseNumber} - ${customerName} (${type})`,
    });

    return NextResponse.json({ success: true, case: caseRec }, { status: 201 });
  } catch (error) {
    console.error("After-sales case creation error:", error);
    return NextResponse.json({ error: "Failed to create after-sales case" }, { status: 500 });
  }
}
