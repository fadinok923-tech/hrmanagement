import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  fullName: z.string().optional(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  position: z.string().optional(),
  department: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  experience: z.coerce.number().optional().nullable(),
  status: z.string().optional(),
  rating: z.coerce.number().optional(),
  expectedSalary: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  resumeUrl: z.string().optional().nullable(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message || "Invalid" }, { status: 422 });
    }
    const record = await db.candidate.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ ok: true, data: record });
  } catch (e) {
    console.error("[recruitment.PUT]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.candidate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[recruitment.DELETE]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
