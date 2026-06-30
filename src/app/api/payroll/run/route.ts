import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  month: z.string().min(1), // YYYY-MM
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
    const { month, status } = parsed.data;

    // Delete existing records for this month (idempotent re-run)
    await db.payroll.deleteMany({ where: { month } });

    const employees = await db.employee.findMany({ where: { status: { not: "terminated" } } });
    const created: any[] = [];
    for (const emp of employees) {
      const isSaudi = emp.nationality === "Saudi";
      const gosiRate = isSaudi ? 0.0975 : 0.02;
      // Pull overtime from current month attendance
      const [y, m] = month.split("-").map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      const attendance = await db.attendance.findMany({
        where: { employeeId: emp.id, date: { gte: start, lte: end } },
      });
      const overtime = Math.round(attendance.reduce((s, a) => s + (a.overtime || 0), 0) * 100) / 100;
      const overtimePay = Math.round(((emp.basicSalary / 30) / 8) * 1.5 * overtime * 100) / 100;
      const deductions = 0;
      const gosi = Math.round(emp.basicSalary * gosiRate * 100) / 100;
      const net = Math.round((emp.basicSalary + emp.allowances + overtimePay - deductions - gosi) * 100) / 100;
      const rec = await db.payroll.create({
        data: {
          employeeId: emp.id,
          month,
          basicSalary: emp.basicSalary,
          allowances: emp.allowances,
          overtime: overtimePay,
          deductions,
          gosi,
          netSalary: net,
          status: status || "processed",
        },
        include: { employee: true },
      });
      created.push(rec);
    }
    return NextResponse.json({ ok: true, data: created, count: created.length });
  } catch (e) {
    console.error("[payroll.run.POST]", e);
    return NextResponse.json({ ok: false, error: "Failed to run payroll" }, { status: 500 });
  }
}
