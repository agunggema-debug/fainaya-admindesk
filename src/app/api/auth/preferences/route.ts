import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { themePreference, themeMode } = await req.json();

    const response = NextResponse.json({ success: true });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(themePreference ? { themePreference } : {}),
        ...(themeMode ? { themeMode } : {}),
      },
    });

    if (themePreference) {
      response.cookies.set({
        name: "fainaya_theme",
        value: themePreference,
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    if (themeMode) {
      response.cookies.set({
        name: "fainaya_mode",
        value: themeMode,
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error) {
    console.error("Preferences update error:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
