import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

function computeStatus(expiry?: Date | null): string {
  if (!expiry) return "valid";
  const now = Date.now();
  const days = Math.ceil((expiry.getTime() - now) / (24 * 60 * 60 * 1000));
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "valid";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (type && type !== "all") where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { employee: { fullName: { contains: search } } },
        { employee: { empNo: { contains: search } } },
      ];
    }

    const records = await db.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { employee: true },
      take: 500,
    });
    // Auto-compute status
    const data = records.map((r) => ({ ...r, status: computeStatus(r.expiryDate) }));
    const filtered = status && status !== "all" ? data.filter((r) => r.status === status) : data;
    return NextResponse.json({ ok: true, data: filtered });
  } catch (e) {
    console.error("[documents.GET]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

const schema = z.object({
  employeeId: z.string().optional().nullable(),
  title: z.string().min(1),
  type: z.string().optional(),
  fileUrl: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.coerce.number().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  issueDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message || "Invalid" }, { status: 422 });
    }
    const d = parsed.data;
    const expiryDate = d.expiryDate ? new Date(d.expiryDate) : null;
    const record = await db.document.create({
      data: {
        employeeId: d.employeeId || null,
        title: d.title,
        type: d.type || "other",
        fileUrl: d.fileUrl ?? null,
        fileName: d.fileName ?? null,
        fileSize: d.fileSize ?? null,
        mimeType: d.mimeType ?? null,
        issueDate: d.issueDate ? new Date(d.issueDate) : null,
        expiryDate,
        status: computeStatus(expiryDate),
        notes: d.notes ?? null,
      },
      include: { employee: true },
    });
    return NextResponse.json({ ok: true, data: record });
  } catch (e) {
    console.error("[documents.POST]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
