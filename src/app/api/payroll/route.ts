import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const month = searchParams.get("month") || "";
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (month) where.month = month;
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

    const records = await db.payroll.findMany({
      where,
      orderBy: { month: "desc" },
      include: { employee: true },
      take: 500,
    });
    return NextResponse.json({ ok: true, data: records });
  } catch (e) {
    console.error("[payroll.GET]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
