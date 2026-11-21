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

    const whereClause: Prisma.SupplyRequestWhereInput = isHqOrSysadmin ? {} : { branchId: user.branchId! };

    const requests = await prisma.supplyRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        requester: { select: { id: true, name: true, role: true } },
        approvedBy: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Supplies GET error:", error);
    return NextResponse.json({ error: "Failed to fetch supply requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items, reason, totalEstimatedCost, targetBranchId } = await req.json();

    if (!items || !reason) {
      return NextResponse.json({ error: "Daftar barang dan alasan pengadaan wajib diisi." }, { status: 400 });
    }

    const branchId = (user.role === "HQ_COORDINATOR" || user.role === "SYSTEM_ADMIN" || !user.branchId) ? (targetBranchId || user.branchId) : user.branchId;
    if (!branchId) {
      return NextResponse.json({ error: "Cabang wajib ditentukan." }, { status: 400 });
    }

    const count = await prisma.supplyRequest.count();
    const reqNum = `REQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const newRequest = await prisma.supplyRequest.create({
      data: {
        requestNumber: reqNum,
        branchId,
        requesterId: user.id,
        items: typeof items === "string" ? items : JSON.stringify(items),
        totalEstimatedCost: Number(totalEstimatedCost) || 0,
        reason,
        status: "PENDING",
      },
      include: { branch: true, requester: true },
    });

    await logAuditEvent({
      userId: user.id,
      action: "CREATE_SUPPLY_REQUEST",
      entity: "SupplyRequest",
      entityId: newRequest.id,
      details: `Membuat permohonan pengadaan ${reqNum} senilai Rp ${totalEstimatedCost}`,
    });

    return NextResponse.json({ success: true, request: newRequest }, { status: 201 });
  } catch (error) {
    console.error("Supply request error:", error);
    return NextResponse.json({ error: "Failed to create supply request" }, { status: 500 });
  }
}
