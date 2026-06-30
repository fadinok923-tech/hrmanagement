import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string) || "general";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(dir, { recursive: true });
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}_${safe}`;
    const fullPath = path.join(dir, filename);
    await writeFile(fullPath, bytes);

    const url = `/uploads/${folder}/${filename}`;

    // Also create a File record
    await db.file.create({
      data: {
        name: file.name,
        url,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        folder,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        url,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      },
    });
  } catch (e) {
    console.error("[upload.POST]", e);
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}
