import jwt, { type SignOptions } from "jsonwebtoken";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { prisma } from "./prisma";

const rawJwtSecret = process.env.JWT_SECRET;
if (!rawJwtSecret) {
  throw new Error("JWT_SECRET environment variable is required.");
}
const JWT_SECRET: string = rawJwtSecret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  branchId?: string | null;
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  // jwt.verify() checks token expiry against Date.now(), which Next.js flags
  // as an unstable value during prerendering. connection() stops the
  // prerender so the expiry check only runs at request time.
  await connection();
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("fainaya_session")?.value;
    if (!token) return null;

    const decoded = await verifyToken(token);
    if (!decoded) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        branch: true,
      },
    });

    if (!user) return null;

    const { password, ...safeUser } = user;
    return safeUser;
  } catch (error) {
    console.error("Error retrieving current user:", error);
    return null;
  }
}

export async function logAuditEvent(params: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        details: params.details ?? null,
        ipAddress: params.ipAddress ?? "127.0.0.1",
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
