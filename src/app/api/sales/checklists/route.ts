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
    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");

    const isHqOrSysadmin = [
      "HQ_COORDINATOR", "SYSTEM_ADMIN"
    ].includes(user.role);

    const whereClause: Prisma.SalesChecklistWhereInput = {
      ...(isHqOrSysadmin ? {} : { branchId: user.branchId! }),
      ...(isHqOrSysadmin && branchId ? { branchId } : {}),
      ...(status && status !== "ALL" ? { status } : {}),
    };

    const checklists = await prisma.salesChecklist.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        salesPerson: { select: { id: true, name: true, role: true } },
        verifiedBy: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ checklists });
  } catch (error) {
    console.error("Sales checklists GET error:", error);
    return NextResponse.json({ error: "Failed to fetch sales checklists" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderNumber, customerName, branchId, salesPersonId, notes, verifiedById } = await req.json();

    // Branch scoping: non-privileged users can only create checklists for their own branch.
    const scopedBranchId = (user.role === "HQ_COORDINATOR" || user.role === "SYSTEM_ADMIN" || !user.branchId)
      ? branchId
      : user.branchId;

    if (!orderNumber || !customerName || !scopedBranchId || !salesPersonId) {
      return NextResponse.json(
        { error: "Nomor pesanan, nama customer, cabang, dan sales person wajib diisi." },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.findUnique({ where: { id: scopedBranchId } });
    if (!branch) {
      return NextResponse.json({ error: "Cabang tidak valid." }, { status: 400 });
    }

    const salesPerson = await prisma.user.findUnique({ where: { id: salesPersonId } });
    if (!salesPerson) {
      return NextResponse.json({ error: "Sales person tidak valid." }, { status: 400 });
    }

    const checklist = await prisma.salesChecklist.create({
      data: {
        orderNumber,
        customerName,
        branchId: scopedBranchId,
        salesPersonId,
        verifiedById: verifiedById || null,
        notes: notes || null,
        status: "DRAFT",
        formOrderVerified: false,
        customerIdentityVerified: false,
        financingDocVerified: false,
        invoiceVerified: false,
        deliveryHandoverVerified: false,
      },
      include: {
        branch: true,
        salesPerson: { select: { id: true, name: true, role: true } },
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "CREATE_SALES_CHECKLIST",
      entity: "SalesChecklist",
      entityId: checklist.id,
      details: `Membuat checklist penjualan: ${orderNumber} - ${customerName}`,
    });

    return NextResponse.json({ success: true, checklist }, { status: 201 });
  } catch (error) {
    console.error("Sales checklist creation error:", error);
    return NextResponse.json({ error: "Failed to create sales checklist" }, { status: 500 });
  }
}
