"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Building2, Users, TrendingUp, Award } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
} from "recharts";
import { useLanguage } from "@/components/language-provider";
import { PageHeader, StatCard, Panel } from "../shared";
import { normalizeReport, normalizeEmployeeList, normalizePayrollList, normalizeAttendanceList, normalizeKpiList, formatSAR, formatNumber, type NormalReport } from "../api-helpers";
import { exportMultiSheet } from "@/lib/excel";

const COLORS = ["#1e3a8a", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#0ea5e9", "#f97316"];

export function ReportsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<NormalReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setData(normalizeReport(d.data)); })
      .finally(() => setLoading(false));
  }, []);

  async function exportAllEmployees() {
    const res = await fetch("/api/employees");
    const d = await res.json();
    if (!d.ok) return;
    const rows = normalizeEmployeeList(d.data).map((e) => ({
      "Emp No": e.empNo,
      "Full Name": e.fullName,
      "Arabic Name": e.fullNameAr || "",
      Nationality: e.nationality,
      Gender: e.gender,
      "Job Title": e.jobTitle,
      Department: e.department,
      "Basic Salary": e.basicSalary,
      Allowances: e.allowances,
      "Hire Date": e.hireDate,
      "Iqama No": e.iqamaNo,
      "Iqama Expiry": e.iqamaExpiry,
      "Passport No": e.passportNo,
      Phone: e.phone,
      Email: e.email,
      Status: e.status,
    }));
    exportMultiSheet([{ name: "Employees", rows }], "employees_export");
    toast.success(t("dash.exported"));
  }

  async function exportFullReport() {
    const [empRes, payRes, attRes, kpiRes, leaveRes, docRes, candRes] = await Promise.all([
      fetch("/api/employees"), fetch("/api/payroll"), fetch("/api/attendance"), fetch("/api/kpis"),
      fetch("/api/leave"), fetch("/api/documents"), fetch("/api/recruitment"),
    ]);
    const [empD, payD, attD, kpiD, leaveD, docD, candD] = await Promise.all([
      empRes.json(), payRes.json(), attRes.json(), kpiRes.json(), leaveRes.json(), docRes.json(), candRes.json(),
    ]);
    const sheets = [
      {
        name: "Employees",
        rows: normalizeEmployeeList(empD.data).map((e) => ({
          "Emp No": e.empNo, "Full Name": e.fullName, "Arabic Name": e.fullNameAr || "",
          Nationality: e.nationality, Gender: e.gender, "Date of Birth": e.dateOfBirth,
          "Marital Status": e.maritalStatus, Phone: e.phone, Email: e.email, Address: e.address,
          "Emergency Contact": e.emergencyContact, "Job Title": e.jobTitle, Department: e.department,
          "Employment Type": e.employmentType, "Hire Date": e.hireDate, "Contract End": e.contractEnd,
          "Basic Salary": e.basicSalary, Allowances: e.allowances, "Total Salary": e.basicSalary + e.allowances,
          "Bank Account": e.bankAccount, IBAN: e.iban, "Passport No": e.passportNo, "Passport Expiry": e.passportExpiry,
          "Iqama No": e.iqamaNo, "Iqama Expiry": e.iqamaExpiry, "Visa Type": e.visaType, Status: e.status,
          "Annual Leave (days)": e.leaveAnnual, "Sick Leave (days)": e.leaveSick,
          "Emergency Leave (days)": e.leaveEmergency, "Casual Leave (per month)": e.leaveCasualPerWeek,
          Notes: e.notes,
        })),
      },
      {
        name: "Leaves",
        rows: (leaveD.data || []).map((l: any) => ({
          Employee: l.employee?.fullName || "", "Emp No": l.employee?.empNo || "", Department: l.employee?.department || "",
          Type: l.type, "Start Date": l.startDate, "End Date": l.endDate, Days: l.days,
          Reason: l.reason || "", Status: l.status, Approver: l.approver || "",
        })),
      },
      {
        name: "Payroll",
        rows: normalizePayrollList(payD.data).map((p) => ({
          Month: p.month, Employee: p.employeeName, "Emp No": p.empNo,
          Basic: p.basicSalary, Allowances: p.allowances, Overtime: p.overtime, Deductions: p.deductions,
          GOSI: p.gosi, Net: p.netSalary, Status: p.status, "Pay Date": p.payDate,
        })),
      },
      {
        name: "Attendance",
        rows: normalizeAttendanceList(attD.data).map((a) => ({
          Date: a.date, Employee: a.employeeName, "Emp No": a.empNo,
          "Check In": a.checkIn, "Check Out": a.checkOut, "Work Hrs": a.workHours, Overtime: a.overtime, Status: a.status,
        })),
      },
      {
        name: "KPIs",
        rows: normalizeKpiList(kpiD.data).map((k) => ({
          Period: k.period, Employee: k.employeeName, "Emp No": k.empNo,
          Productivity: k.productivity, Quality: k.quality, Teamwork: k.teamwork,
          Punctuality: k.punctuality, Initiative: k.initiative, Final: k.finalScore, Comments: k.comments || "",
        })),
      },
      {
        name: "Documents",
        rows: (docD.data || []).map((d: any) => ({
          Employee: d.employee?.fullName || "", "Emp No": d.employee?.empNo || "",
          Title: d.title, Type: d.type, "Issue Date": d.issueDate || "", "Expiry Date": d.expiryDate || "",
          Status: d.status, Notes: d.notes || "",
        })),
      },
      {
        name: "Candidates",
        rows: (candD.data || []).map((c: any) => ({
          Name: c.fullName, Email: c.email || "", Phone: c.phone || "", Position: c.position,
          Department: c.department || "", Source: c.source || "", "Experience (yrs)": c.experience ?? "",
          Status: c.status, Rating: c.rating, "Expected Salary": c.expectedSalary ?? "",
          "Applied At": c.appliedAt, Notes: c.notes || "",
        })),
      },
      {
        name: "Summary",
        rows: data ? [
          { Metric: "Total Employees", Value: data.overview.totalEmployees },
          { Metric: "Active", Value: data.overview.activeCount },
          { Metric: "On Leave", Value: data.overview.onLeaveCount },
          { Metric: "Saudi", Value: data.overview.saudiCount },
          { Metric: "Expat", Value: data.overview.expatCount },
          { Metric: "Saudization %", Value: data.overview.saudizationRate },
          { Metric: "Monthly Payroll", Value: data.overview.totalMonthlySalary },
          { Metric: "Pending Leaves", Value: data.overview.pendingLeaves },
          { Metric: "Approved Leaves", Value: data.overview.approvedLeaves },
          { Metric: "Rejected Leaves", Value: data.overview.rejectedLeaves },
          { Metric: "Total Leaves", Value: data.overview.totalLeaves },
          { Metric: "Avg KPI", Value: data.overview.avgKpi },
          { Metric: "Total Candidates", Value: data.overview.totalCandidates },
          { Metric: "Total Documents", Value: data.overview.totalDocuments },
          { Metric: "Expired Docs", Value: data.documents.expired },
          { Metric: "Expiring Docs", Value: data.documents.expiring },
        ] : [],
      },
    ];
    exportMultiSheet(sheets, "hr_full_report");
    toast.success(t("dash.exported"));
  }

  const kpiByDept = useMemo(() => {
    return Object.entries(data?.byDepartment || {}).map(([name, count]) => ({ name, value: count as number }));
  }, [data]);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <PageHeader title={t("rep.title")} subtitle={t("rep.subtitle")} />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }

  const o = data.overview;
  const deptData = Object.entries(data.byDepartment).map(([name, value]) => ({ name, value }));
  const visaData = [
    { name: t("rep.saudi"), value: o.saudiCount, color: "#1e3a8a" },
    { name: t("rep.expat"), value: o.expatCount, color: "#f59e0b" },
  ];
  const payrollByMonth = Object.entries(data.payrollByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, total: v.total, gosi: v.gosi }));
  const attData = [
    { name: t("att.present"), value: data.attendance.present, color: "#10b981" },
    { name: t("att.late"), value: data.attendance.late, color: "#f59e0b" },
    { name: t("att.absent"), value: data.attendance.absent, color: "#ef4444" },
    { name: t("att.leave"), value: data.attendance.leave, color: "#3b82f6" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("rep.title")}
        subtitle={t("rep.subtitle")}
        actions={
          <>
            <button onClick={exportAllEmployees} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted">
              <Users className="h-3.5 w-3.5" /> {t("rep.exportAllEmp")}
            </button>
            <button onClick={exportFullReport} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-semibold text-background hover:bg-foreground/90">
              <FileSpreadsheet className="h-3.5 w-3.5" /> {t("rep.exportFull")}
            </button>
          </>
        }
      />

      {/* Saudization section */}
      <Panel title={t("rep.saudization")}>
        <div className="grid items-center gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid place-items-center">
            <div className="relative h-36 w-36">
              <PieChart width={144} height={144}>
                <Pie data={visaData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={3}>
                  {visaData.map((v, i) => <Cell key={i} fill={v.color} />)}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-foreground">{o.saudizationRate}%</p>
                <p className="text-[10px] text-muted-foreground">{t("rep.rate")}</p>
              </div>
            </div>
          </div>
          <StatCard title={t("rep.saudi")} value={formatNumber(o.saudiCount)} icon={<Users className="h-4 w-4" />} accent="green" />
          <StatCard title={t("rep.expat")} value={formatNumber(o.expatCount)} icon={<Users className="h-4 w-4" />} accent="gold" />
          <StatCard title={t("rep.target")} value="≥ 25%" icon={<Award className="h-4 w-4" />} accent="blue" delta="Nitaqat Platinum" />
        </div>
      </Panel>

      {/* Summary */}
      <Panel title={t("rep.summary")}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard title={t("company.totalEmployees")} value={o.totalEmployees} icon={<Users className="h-4 w-4" />} accent="blue" />
          <StatCard title={t("company.monthlyPayroll")} value={formatSAR(o.totalMonthlySalary)} icon={<Building2 className="h-4 w-4" />} accent="gold" />
          <StatCard title={t("company.avgKpi")} value={o.avgKpi} icon={<TrendingUp className="h-4 w-4" />} accent="green" />
          <StatCard title={t("company.pendingLeaves")} value={o.pendingLeaves} icon={<Building2 className="h-4 w-4" />} accent="red" />
        </div>
      </Panel>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t("rep.deptBreakdown")}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                  {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={t("rep.attendanceTrend")}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {attData.map((v, i) => <Cell key={i} fill={v.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={t("rep.payrollByMonth")}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payrollByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatSAR(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="total" name="Net Salary" stroke="#1e3a8a" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="gosi" name="GOSI" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={t("rep.kpiByDept")}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpiByDept} layout="vertical" margin={{ top: 10, right: 10, left: 80, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#1e3a8a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
