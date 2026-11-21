import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10485760; // 10 MB
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
]);

function getUploadDir() {
  const configured = process.env.UPLOAD_DIR || "./uploads";
  return path.isAbsolute(configured) ? configured : path.join(/*turbopackIgnore: true*/ process.cwd(), configured);
}

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Berkas tidak ditemukan pada permintaan." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Ukuran berkas melebihi batas ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB.` },
        { status: 413 }
      );
    }

    if (file.type && !ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Tipe berkas tidak diizinkan: ${file.type}` },
        { status: 415 }
      );
    }

    const dir = getUploadDir();
    await mkdir(dir, { recursive: true });

    const original = sanitize(file.name || "upload.bin");
    const storedName = `${Date.now()}-${randomUUID().slice(0, 8)}-${original}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, storedName), buffer);

    return NextResponse.json({
      success: true,
      url: `/api/files/${encodeURIComponent(storedName)}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "Gagal mengunggah berkas." }, { status: 500 });
  }
}
