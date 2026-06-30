import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  status: z.enum(["approved", "rejected", "pending"]).optional(),
  approver: z.string().optional().nullable(),
  type: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  days: z.coerce.number().optional(),
  reason: z.string().optional().nullable(),
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
    const d: any = parsed.data;
    const data: any = { ...d };
    if (d.startDate) data.startDate = new Date(d.startDate);
    if (d.endDate) data.endDate = new Date(d.endDate);
    const record = await db.leave.update({
      where: { id },
      data,
      include: { employee: true },
    });
    return NextResponse.json({ ok: true, data: record });
  } catch (e) {
    console.error("[leave.PUT]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.leave.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[leave.DELETE]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
