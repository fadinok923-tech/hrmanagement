import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const department = searchParams.get("department") || "";

    const where: any = {};
    if (status && status !== "all") where.status = status;
    if (department && department !== "all") where.department = department;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { position: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const records = await db.candidate.findMany({
      where,
      orderBy: { appliedAt: "desc" },
      take: 500,
    });
    return NextResponse.json({ ok: true, data: records });
  } catch (e) {
    console.error("[recruitment.GET]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

const schema = z.object({
  fullName: z.string().min(1),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  position: z.string().min(1),
  department: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  experience: z.coerce.number().optional().nullable(),
  status: z.string().optional(),
  rating: z.coerce.number().optional(),
  expectedSalary: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  resumeUrl: z.string().optional().nullable(),
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
    const record = await db.candidate.create({
      data: {
        fullName: d.fullName,
        email: d.email ?? null,
        phone: d.phone ?? null,
        position: d.position,
        department: d.department ?? null,
        source: d.source ?? null,
        experience: d.experience ?? null,
        status: d.status || "applied",
        rating: d.rating ?? 3,
        expectedSalary: d.expectedSalary ?? null,
        notes: d.notes ?? null,
        resumeUrl: d.resumeUrl ?? null,
      },
    });
    return NextResponse.json({ ok: true, data: record });
  } catch (e) {
    console.error("[recruitment.POST]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
