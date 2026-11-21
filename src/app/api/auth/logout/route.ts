import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, logAuditEvent } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user) {
      const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
      await logAuditEvent({
        userId: user.id,
        action: "LOGOUT",
        entity: "User",
        entityId: user.id,
        details: `User logout dari sistem (${user.email})`,
        ipAddress: ip,
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "Logout berhasil.",
    });

    response.cookies.delete("fainaya_session");

    return response;
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat logout." },
      { status: 500 }
    );
  }
}
