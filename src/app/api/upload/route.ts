import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string) || "general";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "File too large (max 10MB)" }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    
    // Create directory if it doesn't exist
    const dir = path.join(process.cwd(), "public", "uploads", folder);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Generate safe filename
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}_${safe}`;
    const fullPath = path.join(dir, filename);
    await writeFile(fullPath, bytes);

    const url = `/uploads/${folder}/${filename}`;

    return NextResponse.json({
      ok: true,
      data: {
        url,
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
      },
    });
  } catch (e: any) {
    console.error("[upload.POST]", e?.message || e);
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}
