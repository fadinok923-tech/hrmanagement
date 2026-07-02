import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const period = searchParams.get("period") || "";

    const where: any = {};
    if (period) where.period = period;
    if (search) {
      where.employee = {
        OR: [
          { fullName: { contains: search } },
          { empNo: { contains: search } },
        ],
      };
    }

    const records = await db.kpi.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { employee: true },
      take: 500,
    });
    return NextResponse.json({ ok: true, data: records });
  } catch (e) {
    console.error("[kpis.GET]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

const schema = z.object({
  employeeId: z.string().min(1),
  period: z.string().min(1),
  productivity: z.coerce.number().min(0).max(100).optional(),
  quality: z.coerce.number().min(0).max(100).optional(),
  teamwork: z.coerce.number().min(0).max(100).optional(),
  punctuality: z.coerce.number().min(0).max(100).optional(),
  initiative: z.coerce.number().min(0).max(100).optional(),
  comments: z.string().optional().nullable(),
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
    const productivity = d.productivity ?? 0;
    const quality = d.quality ?? 0;
    const teamwork = d.teamwork ?? 0;
    const punctuality = d.punctuality ?? 0;
    const initiative = d.initiative ?? 0;
    const finalScore = Math.round(((productivity + quality + teamwork + punctuality + initiative) / 5) * 100) / 100;
    const record = await db.kpi.create({
      data: {
        employeeId: d.employeeId,
        period: d.period,
        productivity,
        quality,
        teamwork,
        punctuality,
        initiative,
        finalScore,
        comments: d.comments ?? null,
      },
      include: { employee: true },
    });
    return NextResponse.json({ ok: true, data: record });
  } catch (e) {
    console.error("[kpis.POST]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
