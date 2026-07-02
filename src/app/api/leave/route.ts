import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";

    const where: any = {};
    if (status && status !== "all") where.status = status;
    if (type && type !== "all") where.type = type;
    if (search) {
      where.OR = [
        { reason: { contains: search } },
        { employee: { fullName: { contains: search } } },
        { employee: { empNo: { contains: search } } },
      ];
    }

    const records = await db.leave.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { employee: true },
      take: 500,
    });
    return NextResponse.json({ ok: true, data: records });
  } catch (e) {
    console.error("[leave.GET]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

const schema = z.object({
  employeeId: z.string().min(1),
  type: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  days: z.coerce.number().optional(),
  reason: z.string().optional().nullable(),
  status: z.string().optional(),
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
    const start = new Date(d.startDate);
    const end = new Date(d.endDate);
    const days = d.days ?? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
    const record = await db.leave.create({
      data: {
        employeeId: d.employeeId,
        type: d.type || "annual",
        startDate: start,
        endDate: end,
        days,
        reason: d.reason ?? null,
        status: d.status || "pending",
      },
      include: { employee: true },
    });
    return NextResponse.json({ ok: true, data: record });
  } catch (e) {
    console.error("[leave.POST]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
