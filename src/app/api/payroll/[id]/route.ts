import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  basicSalary: z.coerce.number().optional(),
  allowances: z.coerce.number().optional(),
  overtime: z.coerce.number().optional(),
  deductions: z.coerce.number().optional(),
  gosi: z.coerce.number().optional(),
  netSalary: z.coerce.number().optional(),
  status: z.string().optional(),
  payDate: z.string().optional().nullable(),
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
    if (d.payDate !== undefined) data.payDate = d.payDate ? new Date(d.payDate) : null;
    const record = await db.payroll.update({ where: { id }, data, include: { employee: true } });
    return NextResponse.json({ ok: true, data: record });
  } catch (e) {
    console.error("[payroll.PUT]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.payroll.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[payroll.DELETE]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
