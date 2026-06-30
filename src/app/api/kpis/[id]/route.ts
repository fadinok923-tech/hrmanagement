import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  productivity: z.coerce.number().min(0).max(100).optional(),
  quality: z.coerce.number().min(0).max(100).optional(),
  teamwork: z.coerce.number().min(0).max(100).optional(),
  punctuality: z.coerce.number().min(0).max(100).optional(),
  initiative: z.coerce.number().min(0).max(100).optional(),
  comments: z.string().optional().nullable(),
  period: z.string().optional(),
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
    const d = parsed.data;
    const existing = await db.kpi.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    const productivity = d.productivity ?? existing.productivity;
    const quality = d.quality ?? existing.quality;
    const teamwork = d.teamwork ?? existing.teamwork;
    const punctuality = d.punctuality ?? existing.punctuality;
    const initiative = d.initiative ?? existing.initiative;
    const finalScore = Math.round(((productivity + quality + teamwork + punctuality + initiative) / 5) * 100) / 100;
    const record = await db.kpi.update({
      where: { id },
      data: {
        productivity, quality, teamwork, punctuality, initiative, finalScore,
        comments: d.comments ?? existing.comments,
        period: d.period ?? existing.period,
      },
      include: { employee: true },
    });
    return NextResponse.json({ ok: true, data: record });
  } catch (e) {
    console.error("[kpis.PUT]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.kpi.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[kpis.DELETE]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
