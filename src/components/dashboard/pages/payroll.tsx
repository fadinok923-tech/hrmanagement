"use client";

import { useEffect, useState, useMemo, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2, Wallet, DollarSign, TrendingUp, Users, Loader2, Printer } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useLanguage } from "@/components/language-provider";
import { PageHeader, FilterSelect, StatCard, ModalShell, StatusBadge, EmptyState } from "../shared";
import { DataTable, type Column } from "../data-table";
import { ConfirmDialog } from "../confirm-dialog";
import { normalizePayrollList, formatSAR, type NormalPayroll } from "../api-helpers";

function monthOptions(): { value: string; label: string }[] {
  const now = new Date();
  const arr = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    arr.push({ value: mk, label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }) });
  }
  return arr;
}

export function PayrollPage() {
  const { t } = useLanguage();
  const [list, setList] = useState<NormalPayroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("all");
  const [status, setStatus] = useState("all");
  const [runOpen, setRunOpen] = useState(false);
  const [payslip, setPayslip] = useState<NormalPayroll | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (month !== "all") params.set("month", month);
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/payroll?${params}`);
      const d = await res.json();
      if (d.ok) setList(normalizePayrollList(d.data));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
     
  }, [search, month, status]);

  const stats = useMemo(() => ({
    totalNet: list.reduce((s, p) => s + p.netSalary, 0),
    totalGosi: list.reduce((s, p) => s + p.gosi, 0),
    totalOvertime: list.reduce((s, p) => s + p.overtime, 0),
    count: list.length,
  }), [list]);

  const chartData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    list.forEach((p) => { byMonth[p.month] = (byMonth[p.month] || 0) + p.netSalary; });
    return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, total]) => ({ month, total }));
  }, [list]);

  const columns: Column<NormalPayroll>[] = [
    { key: "month", header: t("pay.month"), render: (p) => <span className="font-mono text-xs">{p.month}</span> },
    {
      key: "employee", header: t("pay.employee"),
      render: (p) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{p.employeeName}</p>
          <p className="truncate text-xs text-muted-foreground">{p.empNo} · {p.department}</p>
        </div>
      ),
    },
    { key: "basicSalary", header: t("pay.basic"), align: "end", render: (p) => formatSAR(p.basicSalary) },
    { key: "allowances", header: t("pay.allowances"), align: "end", render: (p) => formatSAR(p.allowances) },
    { key: "overtime", header: t("pay.overtime"), align: "end", render: (p) => p.overtime > 0 ? formatSAR(p.overtime) : "—" },
    { key: "gosi", header: t("pay.gosi"), align: "end", render: (p) => formatSAR(p.gosi) },
    { key: "netSalary", header: t("pay.net"), align: "end", render: (p) => <span className="font-semibold">{formatSAR(p.netSalary)}</span> },
    { key: "status", header: t("dash.status"), render: (p) => <StatusBadge status={p.status} /> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("pay.title")}
        subtitle={t("pay.subtitle")}
        actions={
          <button onClick={() => setRunOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-semibold text-background hover:bg-foreground/90">
            <Plus className="h-3.5 w-3.5" /> {t("pay.run")}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={t("pay.total")} value={formatSAR(stats.totalNet)} icon={<Wallet className="h-4 w-4" />} accent="blue" />
        <StatCard title={t("pay.totalGosi")} value={formatSAR(stats.totalGosi)} icon={<DollarSign className="h-4 w-4" />} accent="gold" />
        <StatCard title={t("pay.totalOvertime")} value={formatSAR(stats.totalOvertime)} icon={<TrendingUp className="h-4 w-4" />} accent="green" />
        <StatCard title={t("pay.employees")} value={stats.count} icon={<Users className="h-4 w-4" />} accent="blue" />
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        {t("pay.gosiNote")}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t("pay.byMonth")}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatSAR(v)} />
              <Bar dataKey="total" fill="#1e3a8a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("dash.search.placeholder")}
            className="tanoor-input h-9 w-full rounded-lg border border-input bg-card ps-9 pe-3 text-sm focus:outline-none" />
        </div>
        <FilterSelect value={month} onChange={setMonth} className="w-44"
          options={[{ value: "all", label: t("dash.all") }, ...monthOptions()]} />
        <FilterSelect value={status} onChange={setStatus} className="w-32"
          options={[
            { value: "all", label: t("dash.all") },
            { value: "processed", label: t("pay.processed") },
            { value: "paid", label: t("pay.paid") },
          ]} />
      </div>

      {loading ? (
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={<Wallet className="h-6 w-6" />} title={t("dash.noData")} description={t("dash.noDataDesc")} />
      ) : (
        <DataTable
          columns={columns}
          rows={list}
          onRowClick={(p) => setPayslip(p)}
          rowActions={(p) => (
            <>
              <button onClick={() => setPayslip(p)} aria-label="View payslip" className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                <Printer className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setDeleteId(p.id)} aria-label={t("dash.delete")} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        />
      )}

      {runOpen && <RunModal open={runOpen} onClose={() => setRunOpen(false)} onSaved={() => { setRunOpen(false); load(); }} />}
      {payslip && <PayslipModal payroll={payslip} onClose={() => setPayslip(null)} />}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await fetch(`/api/payroll/${deleteId}`, { method: "DELETE" });
          toast.success(t("dash.deleted"));
          setDeleteId(null);
          load();
        }}
        title={t("dash.confirmDelete")}
        message={t("dash.confirmDeleteMsg")}
        confirmLabel={t("dash.delete")}
        cancelLabel={t("dash.cancel")}
        destructive
      />
    </div>
  );
}

function RunModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { t } = useLanguage();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(false);

  async function handleRun(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/payroll/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      const d = await res.json();
      if (d.ok) {
        toast.success(t("pay.runSuccess", { month, count: d.count }));
        onSaved();
      } else {
        toast.error(d.error || "Failed");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "tanoor-input h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none";

  return (
    <ModalShell open={open} onClose={onClose} title={t("pay.run")} size="sm">
      <form onSubmit={handleRun} className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("pay.runConfirm", { month })}</p>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("pay.month")}</label>
          <input type="month" className={inputCls} value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted">{t("dash.cancel")}</button>
          <button type="submit" disabled={loading} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-50">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? t("pay.runLoading") : t("pay.run")}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function PayslipModal({ payroll, onClose }: { payroll: NormalPayroll; onClose: () => void }) {
  const { t } = useLanguage();
  const rows = [
    { label: t("pay.basic"), value: payroll.basicSalary },
    { label: t("pay.allowances"), value: payroll.allowances },
    { label: t("pay.overtime"), value: payroll.overtime },
    { label: t("pay.deductions"), value: -payroll.deductions },
    { label: t("pay.gosi"), value: -payroll.gosi },
  ];
  const gross = payroll.basicSalary + payroll.allowances + payroll.overtime;
  return (
    <ModalShell open onClose={onClose} title={t("pay.payslip")} size="md">
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t("pay.employee")}</p>
              <p className="font-semibold">{payroll.employeeName}</p>
              <p className="text-xs text-muted-foreground">{payroll.empNo} · {payroll.department}</p>
            </div>
            <div className="text-end">
              <p className="text-xs text-muted-foreground">{t("pay.month")}</p>
              <p className="font-mono font-semibold">{payroll.month}</p>
              <StatusBadge status={payroll.status} />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between border-b border-border/60 py-2 text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className={`font-medium ${r.value < 0 ? "text-red-600" : "text-foreground"}`}>{formatSAR(r.value)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-[var(--color-brand-deep)] to-[var(--color-brand-light)] px-4 py-3 text-white">
          <span className="text-sm font-medium">{t("pay.net")}</span>
          <span className="text-lg font-bold">{formatSAR(payroll.netSalary)}</span>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {t("pay.gosiNote")} · {t("footer.copy")}
        </p>
      </div>
    </ModalShell>
  );
}
