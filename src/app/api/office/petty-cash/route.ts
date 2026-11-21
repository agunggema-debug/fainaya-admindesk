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
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const isHqOrSysadmin =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;

    const whereClause: Prisma.PettyCashWhereInput = {
      ...(isHqOrSysadmin ? {} : { branchId: user.branchId! }),
      ...(type && type !== "ALL" ? { type } : {}),
      ...(status && status !== "ALL" ? { status } : {}),
    };

    const records = await prisma.pettyCash.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        recordedBy: { select: { id: true, name: true, role: true } },
      },
    });

    const totalIncome = records
      .filter((r) => r.type === "INCOME")
      .reduce((sum, r) => sum + r.amount, 0);

    const totalExpense = records
      .filter((r) => r.type === "EXPENSE")
      .reduce((sum, r) => sum + r.amount, 0);

    const balance = totalIncome - totalExpense;

    return NextResponse.json({
      records,
      summary: {
        totalIncome,
        totalExpense,
        balance,
      },
    });
  } catch (error) {
    console.error("Petty cash GET error:", error);
    return NextResponse.json({ error: "Failed to fetch petty cash" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, amount, category, description, targetBranchId } = await req.json();

    if (!type || !amount || !description) {
      return NextResponse.json(
        { error: "Tipe, jumlah nominal, dan keterangan wajib diisi." },
        { status: 400 }
      );
    }

    const branchId = (user.role === "HQ_COORDINATOR" || user.role === "SYSTEM_ADMIN" || !user.branchId) ? (targetBranchId || user.branchId) : user.branchId;
    if (!branchId) {
      return NextResponse.json({ error: "Cabang wajib ditentukan." }, { status: 400 });
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    const count = await prisma.pettyCash.count({ where: { branchId } });
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const code = `PC-${branch?.code || "CAB"}-${ym}-${String(count + 1).padStart(3, "0")}`;

    const record = await prisma.pettyCash.create({
      data: {
        code,
        type,
        amount: Number(amount),
        category: category || "OPERATIONAL",
        description,
        branchId,
        recordedById: user.id,
        status: "PENDING",
        date: new Date(),
      },
      include: {
        branch: true,
        recordedBy: true,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "CREATE_PETTY_CASH",
      entity: "PettyCash",
      entityId: record.id,
      details: `Mencatat kas kecil ${code} [${type}]: Rp ${amount} (${description})`,
    });

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (error) {
    console.error("Petty cash POST error:", error);
    return NextResponse.json({ error: "Failed to record petty cash" }, { status: 500 });
  }
}
