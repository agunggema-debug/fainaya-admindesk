import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".csv": "text/csv",
  ".txt": "text/plain",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function getUploadDir() {
  const configured = process.env.UPLOAD_DIR || "./uploads";
  return path.isAbsolute(configured) ? configured : path.join(/*turbopackIgnore: true*/ process.cwd(), configured);
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ name: string[] }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await context.params;
    const fileName = name ? name.join("/") : "";
    if (!fileName) {
      return NextResponse.json({ error: "Nama berkas tidak valid." }, { status: 400 });
    }

    const uploadDir = path.resolve(getUploadDir());
    const fullPath = path.resolve(uploadDir, fileName);
    if (
      fileName.includes("..") ||
      path.isAbsolute(fileName) ||
      !fullPath.startsWith(uploadDir + path.sep)
    ) {
      return NextResponse.json({ error: "Nama berkas tidak valid." }, { status: 400 });
    }
    const data = await readFile(fullPath);
    const ext = path.extname(fileName).toLowerCase();
    const mime = MIME_BY_EXT[ext] || "application/octet-stream";

    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `inline; filename="${path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
  }
}
