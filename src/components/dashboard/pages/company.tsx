"use client";

import { useEffect, useState } from "react";
import {
  Users, UserCheck, Building2, DollarSign, CalendarClock, Star, UserPlus, FileText,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from "recharts";
import { useLanguage } from "@/components/language-provider";
import { PageHeader, StatCard, Panel } from "../shared";
import { normalizeReport, formatSAR, formatNumber, type NormalReport } from "../api-helpers";

const COLORS = ["#1e3a8a", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#0ea5e9", "#f97316"];

export function CompanyPage() {
  const { t, locale } = useLanguage();
  const [data, setData] = useState<NormalReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setData(normalizeReport(d.data));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <PageHeader title={t("company.title")} subtitle={t("company.subtitle")} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const o = data.overview;
  const att = data.attendance;

  const deptData = Object.entries(data.byDepartment).map(([name, value]) => ({ name, value }));
  const visaData = Object.entries(data.byVisa).map(([name, value]) => ({ name, value }));
  const deptSalaryData = Object.entries(data.deptSalary).map(([name, v]) => ({
    name,
    avg: v.count ? Math.round(v.total / v.count) : 0,
  }));
  const payrollTrendData = Object.entries(data.payrollByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, total: v.total }));

  return (
    <div className="space-y-5">
      <PageHeader title={t("company.title")} subtitle={t("company.subtitle")} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={t("company.totalEmployees")} value={formatNumber(o.totalEmployees)} icon={<Users className="h-4 w-4" />} accent="blue" delta={`${o.activeCount} ${t("emp.active").toLowerCase()}`} />
        <StatCard title={t("company.saudization")} value={`${o.saudizationRate}%`} icon={<UserCheck className="h-4 w-4" />} accent="green" delta={`${o.saudiCount} ${t("rep.saudi").toLowerCase()}`} />
        <StatCard title={t("company.monthlyPayroll")} value={formatSAR(o.totalMonthlySalary)} icon={<DollarSign className="h-4 w-4" />} accent="gold" />
        <StatCard title={t("company.pendingLeaves")} value={formatNumber(o.pendingLeaves)} icon={<CalendarClock className="h-4 w-4" />} accent="red" delta={`${o.totalLeaves} ${t("leave.title").toLowerCase()}`} />
      </div>

      {/* Company profile */}
      <Panel title={t("company.profile")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("company.name"), value: t("company.name") },
            { label: t("company.address"), value: t("company.address") },
            { label: t("company.cr"), value: "CR-1010-345678-Dammam" },
            { label: t("company.vat"), value: "300123456700003" },
            { label: t("company.gosi"), value: "GOSI-4456789-1" },
            { label: t("company.established"), value: "2008" },
            { label: t("company.employees"), value: String(o.totalEmployees) },
            { label: t("company.departments"), value: String(deptData.length) },
          ].map((it, i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{it.label}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{it.value}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t("company.byDept")}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45}>
                  {deptData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={t("company.byVisa")}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={visaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={55} paddingAngle={3}>
                  {visaData.map((_, i) => (
                    <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={t("company.deptSalary")}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptSalaryData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} height={60} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatSAR(v)} />
                <Bar dataKey="avg" fill="#1e3a8a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={t("company.payrollTrend")}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payrollTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatSAR(v)} />
                <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: "#f59e0b" }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
