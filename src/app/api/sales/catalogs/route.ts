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
    const isActive = searchParams.get("isActive");
    const type = searchParams.get("type");
    const branchId = searchParams.get("branchId");

    const isHqOrSysadmin = [
      "HQ_COORDINATOR", "SYSTEM_ADMIN"
    ].includes(user.role);

    const whereClause: Record<string, unknown> = {
      ...(isHqOrSysadmin ? {} : { branchId: user.branchId! }),
      ...(isHqOrSysadmin && branchId ? { branchId } : {}),
    };

    if (isActive !== null) whereClause.isActive = isActive === "true";
    if (type && type !== "ALL") whereClause.type = type;

    const catalogs = await prisma.catalogDistribution.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ catalogs });
  } catch (error) {
    console.error("Catalog distribution GET error:", error);
    return NextResponse.json({ error: "Failed to fetch catalog distribution" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, type, version, fileUrl, description, validUntil, branchId, isActive } = await req.json();

    if (!title || !type || !version) {
      return NextResponse.json(
        { error: "Judul, tipe, dan versi wajib diisi." },
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

    const catalog = await prisma.catalogDistribution.create({
      data: {
        title,
        type,
        version,
        fileUrl: fileUrl || null,
        description: description || null,
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: isActive !== undefined ? isActive : true,
        branchId: branchToUse,
      },
      include: {
        branch: true,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "CREATE_CATALOG_DISTRIBUTION",
      entity: "CatalogDistribution",
      entityId: catalog.id,
      details: `Membuat distribusi katalog: ${title} (${type}) - ${version}`,
    });

    return NextResponse.json({ success: true, catalog }, { status: 201 });
  } catch (error) {
    console.error("Catalog distribution creation error:", error);
    return NextResponse.json({ error: "Failed to create catalog distribution" }, { status: 500 });
  }
}
