import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentUser, logAuditEvent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const isHqOrSysadmin =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;

    const whereClause: Prisma.DocumentWhereInput = {
      ...(isHqOrSysadmin ? {} : { branchId: user.branchId! }),
      ...(category && category !== "ALL" ? { category } : {}),
      ...(status && status !== "ALL" ? { status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { docNumber: { contains: search, mode: "insensitive" } },
              { summary: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const documents = await prisma.document.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, name: true, role: true } },
        approver: { select: { id: true, name: true, role: true } },
      },
    });

    const branches = await prisma.branch.findMany({
      select: { id: true, name: true, code: true },
    });

    return NextResponse.json({ documents, branches });
  } catch (error) {
    console.error("Documents GET error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, category, summary, targetBranchId, fileUrl, fileSize, fileType } = await req.json();

    if (!title || !category) {
      return NextResponse.json({ error: "Judul dan kategori dokumen wajib diisi." }, { status: 400 });
    }

    // Determine branch
    const branchId = (user.role === "HQ_COORDINATOR" || user.role === "SYSTEM_ADMIN" || !user.branchId) ? (targetBranchId || user.branchId) : user.branchId;
    if (!branchId) {
      return NextResponse.json({ error: "Cabang wajib ditentukan." }, { status: 400 });
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      return NextResponse.json({ error: "Cabang tidak valid." }, { status: 400 });
    }

    // Generate Standard Document Number
    // Format: {Seq:03d}/{CATEGORY_CODE}/{BRANCH_CODE}/{DEPT_CODE}/{ROMAN_MONTH}/{YEAR}
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthRoman = ROMAN_MONTHS[now.getMonth()];
    const categoryCode =
      category === "SURAT_MASUK"
        ? "SM"
        : category === "SURAT_KELUAR"
        ? "SK"
        : category === "SOP"
        ? "SOP"
        : category === "KONTRAK"
        ? "KTR"
        : category === "PERIZINAN"
        ? "IZN"
        : category === "MEMO"
        ? "MEMO"
        : "EDR";

    const deptCode = user.department ? user.department.substring(0, 3).toUpperCase() : "ADM";

    const countThisYear = await prisma.document.count({
      where: {
        createdAt: {
          gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        },
        category,
      },
    });

    const sequence = String(countThisYear + 1).padStart(3, "0");
    const docNumber = `${sequence}/${categoryCode}/${branch.code}/${deptCode}/${currentMonthRoman}/${currentYear}`;

    const newDoc = await prisma.document.create({
      data: {
        docNumber,
        title,
        category,
        summary: summary || null,
        status: "DRAFT",
        branchId: branch.id,
        creatorId: user.id,
        ...(fileUrl ? { fileUrl } : {}),
        ...(fileSize ? { fileSize } : {}),
        ...(fileType ? { fileType } : {}),
      },
      include: {
        branch: true,
        creator: true,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "CREATE_DOCUMENT",
      entity: "Document",
      entityId: newDoc.id,
      details: `Membuat dokumen baru ${docNumber}: ${title}`,
    });

    return NextResponse.json({ success: true, document: newDoc }, { status: 201 });
  } catch (error) {
    console.error("Document creation error:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
