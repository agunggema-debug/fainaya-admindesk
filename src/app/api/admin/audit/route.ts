import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "HQ_COORDINATOR" && user.role !== "SYSTEM_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Akses hanya untuk HQ Coordinator dan System Administrator" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");

    const whereClause: Record<string, unknown> = {};
    if (action) whereClause.action = { contains: action };
    if (entity) whereClause.entity = entity;

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, department: true, branchId: true },
      orderBy: { name: "asc" },
    });

    const branches = await prisma.branch.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ logs, users, branches });
  } catch (error) {
    console.error("Admin audit GET error:", error);
    return NextResponse.json({ error: "Failed to fetch audit data" }, { status: 500 });
  }
}