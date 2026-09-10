import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [employees, attendance, leaves, payrolls, documents, candidates, kpis] = await Promise.all([
      db.employee.findMany(),
      db.attendance.findMany({ take: 1000, orderBy: { date: "desc" } }),
      db.leave.findMany({ take: 500 }),
      db.payroll.findMany({ take: 1000, orderBy: { month: "desc" } }),
      db.document.findMany(),
      db.candidate.findMany(),
      db.kpi.findMany({ include: { employee: true } }),
    ]);

    const totalEmployees = employees.length;
    const saudiCount = employees.filter((e) => e.nationality === "Saudi").length;
    const expatCount = totalEmployees - saudiCount;
    const saudizationRate = totalEmployees ? Math.round((saudiCount / totalEmployees) * 1000) / 10 : 0;
    const activeCount = employees.filter((e) => e.status === "active").length;
    const onLeaveCount = employees.filter((e) => e.status === "on_leave").length;

    // By department
    const byDept: Record<string, number> = {};
    employees.forEach((e) => { byDept[e.department] = (byDept[e.department] || 0) + 1; });

    // By nationality/visa
    const byVisa: Record<string, number> = {};
    employees.forEach((e) => {
      const v = e.visaType || (e.nationality === "Saudi" ? "Saudi National" : "Iqama");
      byVisa[v] = (byVisa[v] || 0) + 1;
    });

    // Salary totals
    const totalMonthlySalary = employees.reduce((s, e) => s + e.basicSalary + e.allowances, 0);

    // Attendance summary (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentAtt = attendance.filter((a) => a.date >= sevenDaysAgo);
    const presentCount = recentAtt.filter((a) => a.status === "present").length;
    const lateCount = recentAtt.filter((a) => a.status === "late").length;
    const absentCount = recentAtt.filter((a) => a.status === "absent").length;
    const leaveCount = recentAtt.filter((a) => a.status === "leave").length;

    // Leave summary
    const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
    const approvedLeaves = leaves.filter((l) => l.status === "approved").length;
    const rejectedLeaves = leaves.filter((l) => l.status === "rejected").length;

    // Payroll by month
    const payrollByMonth: Record<string, { total: number; gosi: number; count: number }> = {};
    payrolls.forEach((p) => {
      if (!payrollByMonth[p.month]) payrollByMonth[p.month] = { total: 0, gosi: 0, count: 0 };
      payrollByMonth[p.month].total += p.netSalary;
      payrollByMonth[p.month].gosi += p.gosi;
      payrollByMonth[p.month].count += 1;
    });

    // Documents expiry
    const now = Date.now();
    const expiredDocs = documents.filter((d) => d.expiryDate && d.expiryDate.getTime() < now).length;
    const expiringDocs = documents.filter((d) => {
      if (!d.expiryDate) return false;
      const expiry = d.expiryDate.getTime();
      return expiry >= now && expiry <= now + 30 * 24 * 60 * 60 * 1000;
    }).length;
    const validDocs = documents.length - expiredDocs - expiringDocs;

    // Recruitment pipeline
    const candidatePipeline: Record<string, number> = {};
    candidates.forEach((c) => { candidatePipeline[c.status] = (candidatePipeline[c.status] || 0) + 1; });

    // KPI averages
    const avgKpi = kpis.length
      ? Math.round((kpis.reduce((s, k) => s + k.finalScore, 0) / kpis.length) * 100) / 100
      : 0;
    const topPerformers = [...kpis].sort((a, b) => b.finalScore - a.finalScore).slice(0, 5);

    // Department avg salary
    const deptSalary: Record<string, { total: number; count: number }> = {};
    employees.forEach((e) => {
      if (!deptSalary[e.department]) deptSalary[e.department] = { total: 0, count: 0 };
      deptSalary[e.department].total += e.basicSalary + e.allowances;
      deptSalary[e.department].count += 1;
    });

    return NextResponse.json({
      ok: true,
      data: {
        overview: {
          totalEmployees,
          activeCount,
          onLeaveCount,
          saudiCount,
          expatCount,
          saudizationRate,
          totalMonthlySalary,
          pendingLeaves,
          approvedLeaves,
          rejectedLeaves,
          totalLeaves: leaves.length,
          avgKpi,
          totalCandidates: candidates.length,
          totalDocuments: documents.length,
        },
        attendance: {
          present: presentCount,
          late: lateCount,
          absent: absentCount,
          leave: leaveCount,
        },
        byDepartment: byDept,
        byVisa,
        payrollByMonth,
        deptSalary,
        documents: { valid: validDocs, expiring: expiringDocs, expired: expiredDocs, total: documents.length },
        candidatePipeline,
        topPerformers: topPerformers.map((k) => ({
          employeeId: k.employeeId,
          name: k.employee?.fullName || "—",
          empNo: k.employee?.empNo || "",
          department: k.employee?.department || "",
          finalScore: k.finalScore,
          period: k.period,
        })),
      },
    });
  } catch (e) {
    console.error("[reports.GET]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
