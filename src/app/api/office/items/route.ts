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
    const category = searchParams.get("category");
    const lowStockOnly = searchParams.get("lowStock") === "true";

    const isHqOrSysadmin =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;

    const whereClause: Prisma.OfficeItemWhereInput = {
      ...(isHqOrSysadmin ? {} : { branchId: user.branchId! }),
      ...(category && category !== "ALL" ? { category } : {}),
    };

    let items = await prisma.officeItem.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    if (lowStockOnly) {
      items = items.filter((item) => item.stock <= item.minStock);
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Office items error:", error);
    return NextResponse.json({ error: "Failed to fetch office items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, category, unit, stock, minStock, unitPrice, targetBranchId } = await req.json();

    if (!name || !unit) {
      return NextResponse.json({ error: "Nama barang dan satuan wajib diisi." }, { status: 400 });
    }

    const branchId = (user.role === "HQ_COORDINATOR" || user.role === "SYSTEM_ADMIN" || !user.branchId) ? (targetBranchId || user.branchId) : user.branchId;
    if (!branchId) {
      return NextResponse.json({ error: "Cabang wajib ditentukan." }, { status: 400 });
    }

    const item = await prisma.officeItem.create({
      data: {
        name,
        category: category || "ATK",
        unit,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 5,
        unitPrice: Number(unitPrice) || 0,
        branchId,
      },
      include: { branch: true },
    });

    await logAuditEvent({
      userId: user.id,
      action: "CREATE_OFFICE_ITEM",
      entity: "OfficeItem",
      entityId: item.id,
      details: `Menambahkan item ATK: ${name} (Stok: ${stock} ${unit})`,
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    console.error("Office item creation error:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
