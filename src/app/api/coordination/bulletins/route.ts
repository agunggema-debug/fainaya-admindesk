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
    const priority = searchParams.get("priority");

    const isHqOrSysadmin =
      user.role === "HQ_COORDINATOR" ||
      user.role === "SYSTEM_ADMIN" ||
      !user.branchId;

    const whereClause: Prisma.BulletinWhereInput = {
      ...(category && category !== "ALL" ? { category } : {}),
      ...(priority && priority !== "ALL" ? { priority } : {}),
      ...(isHqOrSysadmin
        ? {}
        : { targetAudience: { in: ["ALL", "CABANG_ONLY"] } }),
    };

    const bulletins = await prisma.bulletin.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ bulletins });
  } catch (error) {
    console.error("Bulletins GET error:", error);
    return NextResponse.json({ error: "Failed to fetch bulletins" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["HQ_COORDINATOR", "BRANCH_MANAGER", "SYSTEM_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden: tidak berwenang membuat pengumuman" }, { status: 403 });
    }

    const { title, content, category, priority, targetAudience } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Judul dan isi pengumuman wajib diisi." }, { status: 400 });
    }

    const bulletin = await prisma.bulletin.create({
      data: {
        title,
        content,
        category: category || "ANNOUNCEMENT",
        priority: priority || "NORMAL",
        targetAudience: targetAudience || "ALL",
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "CREATE_BULLETIN",
      entity: "Bulletin",
      entityId: bulletin.id,
      details: `Membuat pengumuman: ${title} (${category || "ANNOUNCEMENT"})`,
    });

    return NextResponse.json({ success: true, bulletin }, { status: 201 });
  } catch (error) {
    console.error("Bulletin creation error:", error);
    return NextResponse.json({ error: "Failed to create bulletin" }, { status: 500 });
  }
}