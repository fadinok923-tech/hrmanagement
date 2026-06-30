import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

function computeLate(checkIn: Date): boolean {
  const h = checkIn.getHours();
  const m = checkIn.getMinutes();
  // Late if after 07:30
  return h > 7 || (h === 7 && m > 30);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const date = searchParams.get("date") || "";
    const status = searchParams.get("status") || "";
    const department = searchParams.get("department") || "";

    const where: any = {};
    if (date) {
      const d = new Date(date);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    }
    if (status && status !== "all") where.status = status;
    if (search || (department && department !== "all")) {
      where.employee = {};
      if (search) {
        where.employee.OR = [
          { fullName: { contains: search } },
          { empNo: { contains: search } },
        ];
      }
      if (department && department !== "all") where.employee.department = department;
    }

    const records = await db.attendance.findMany({
      where,
      orderBy: { date: "desc" },
      include: { employee: true },
      take: 500,
    });
    return NextResponse.json({ ok: true, data: records });
  } catch (e) {
    console.error("[attendance.GET]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

const schema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  status: z.string().optional(),
  workHours: z.coerce.number().optional(),
  overtime: z.coerce.number().optional(),
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
    const checkIn = d.checkIn ? new Date(d.checkIn) : null;
    const checkOut = d.checkOut ? new Date(d.checkOut) : null;
    let status = d.status || "present";
    let workHours = d.workHours ?? 0;
    if (checkIn && status === "present") {
      status = computeLate(checkIn) ? "late" : "present";
    }
    if (checkIn && checkOut) {
      const diff = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      workHours = Math.round(Math.max(0, diff) * 100) / 100;
    }
    const record = await db.attendance.create({
      data: {
        employeeId: d.employeeId,
        date: new Date(d.date),
        checkIn,
        checkOut,
        status,
        workHours,
        overtime: d.overtime ?? 0,
        notes: d.notes ?? null,
      },
      include: { employee: true },
    });
    return NextResponse.json({ ok: true, data: record });
  } catch (e) {
    console.error("[attendance.POST]", e);
    return NextResponse.json({ ok: false, error: "Failed to create" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    await db.attendance.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[attendance.DELETE]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
