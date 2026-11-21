import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, logAuditEvent } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { branch: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Kredensial tidak valid." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Kredensial tidak valid." },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    });

    // Write audit log
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await logAuditEvent({
      userId: user.id,
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      details: `User login sukses sebagai ${user.role} (${user.branch?.name || "Global"})`,
      ipAddress: ip,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        branch: user.branch,
        themePreference: user.themePreference,
        themeMode: user.themeMode,
        avatar: user.avatar,
      },
    });

    // Set HTTP-Only session cookie
    response.cookies.set({
      name: "fainaya_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // Also set theme preference cookies for zero-flash SSR
    response.cookies.set({
      name: "fainaya_theme",
      value: user.themePreference || "glassmorphism",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    response.cookies.set({
      name: "fainaya_mode",
      value: user.themeMode || "light",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada server saat login." },
      { status: 500 }
    );
  }
}
