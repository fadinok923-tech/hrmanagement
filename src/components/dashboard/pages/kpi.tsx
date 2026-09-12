"use client";

import { useEffect, useState, useMemo, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2, Target, Star, TrendingUp, Pencil, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useLanguage } from "@/components/language-provider";
import { PageHeader, FilterSelect, StatCard, ModalShell, EmptyState } from "../shared";
import { DataTable, type Column, StatusBadge } from "../data-table";
import { ConfirmDialog } from "../confirm-dialog";
import { normalizeKpiList, type NormalKpi } from "../api-helpers";

function periodOptions(): { value: string; label: string }[] {
  const now = new Date();
  const arr: { value: string; label: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    arr.push({ value: mk, label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }) });
  }
  return arr;
}

function scoreColor(score: number): string {
  if (score >= 85) return "#10b981";
  if (score >= 75) return "#3b82f6";
  if (score >= 70) return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(score: number, t: (k: string) => string): string {
  if (score >= 85) return t("kpi.excellent");
  if (score >= 75) return t("kpi.good");
  if (score >= 70) return t("kpi.average");
  return t("kpi.poor");
}

export function KpiPage() {
  const { t } = useLanguage();
  const [list, setList] = useState<NormalKpi[]>([]);
  const [employees, setEmployees] = useState<{ id: string; fullName: string; empNo: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NormalKpi | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (period !== "all") params.set("period", period);
      const res = await fetch(`/api/kpis?${params}`);
      const d = await res.json();
      if (d.ok) setList(normalizeKpiList(d.data));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch("/api/employees").then((r) => r.json()).then((d) => {
      if (d.ok) setEmployees(d.data.map((e: any) => ({ id: e.id, fullName: e.fullName, empNo: e.empNo })));
    });
  }, []);

  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
     
  }, [search, period]);

  const stats = useMemo(() => ({
    total: list.length,
    avg: list.length ? Math.round((list.reduce((s, k) => s + k.finalScore, 0) / list.length) * 100) / 100 : 0,
    top: list.filter((k) => k.finalScore >= 85).length,
    low: list.filter((k) => k.finalScore < 70).length,
  }), [list]);

  const distData = useMemo(() => {
    const buckets = [
      { name: t("kpi.excellent"), range: "85-100", count: 0, color: "#10b981" },
      { name: t("kpi.good"), range: "75-84", count: 0, color: "#3b82f6" },
      { name: t("kpi.average"), range: "70-74", count: 0, color: "#f59e0b" },
      { name: t("kpi.poor"), range: "<70", count: 0, color: "#ef4444" },
    ];
    list.forEach((k) => {
      if (k.finalScore >= 85) buckets[0].count++;
      else if (k.finalScore >= 75) buckets[1].count++;
      else if (k.finalScore >= 70) buckets[2].count++;
      else buckets[3].count++;
    });
    return buckets;
  }, [list, t]);

  const columns: Column<NormalKpi>[] = [
    {
      key: "employee", header: t("pay.employee"),
      render: (k) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{k.employeeName}</p>
          <p className="truncate text-xs text-muted-foreground">{k.empNo} · {k.department}</p>
        </div>
      ),
    },
    { key: "period", header: t("dash.period"), render: (k) => <span className="font-mono text-xs">{k.period}</span> },
    { key: "productivity", header: t("kpi.productivity"), align: "center", render: (k) => k.productivity },
    { key: "quality", header: t("kpi.quality"), align: "center", render: (k) => k.quality },
    { key: "teamwork", header: t("kpi.teamwork"), align: "center", render: (k) => k.teamwork },
    { key: "punctuality", header: t("kpi.punctuality"), align: "center", render: (k) => k.punctuality },
    { key: "initiative", header: t("kpi.initiative"), align: "center", render: (k) => k.initiative },
    {
      key: "finalScore", header: t("kpi.finalScore"), align: "end",
      render: (k) => (
        <div className="flex items-center justify-end gap-2">
          <span className="font-bold" style={{ color: scoreColor(k.finalScore) }}>{k.finalScore}</span>
          <span className="text-[10px] text-muted-foreground">{scoreLabel(k.finalScore, t)}</span>
        </div>
      ),
    },
  ];

  function openAdd() { setEditing(null); setModalOpen(true); }
  function openEdit(k: NormalKpi) { setEditing(k); setModalOpen(true); }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("kpi.title")}
        subtitle={t("kpi.subtitle")}
        actions={
          <button onClick={openAdd} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" /> {t("kpi.add")}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={t("kpi.total")} value={stats.total} icon={<Target className="h-4 w-4" />} accent="blue" />
        <StatCard title={t("kpi.avgScore")} value={stats.avg} icon={<TrendingUp className="h-4 w-4" />} accent="green" />
        <StatCard title={t("kpi.topCount")} value={stats.top} icon={<Star className="h-4 w-4" />} accent="gold" />
        <StatCard title={t("kpi.lowCount")} value={stats.low} icon={<Target className="h-4 w-4" />} accent="red" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t("kpi.distribution")}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {distData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[min(100%,16rem)] flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("dash.search.placeholder")}
            className="tanoor-input h-11 w-full rounded-lg border border-input bg-card ps-9 pe-3 text-sm focus:outline-none" />
        </div>
        <FilterSelect value={period} onChange={setPeriod} className="w-44"
          options={[{ value: "all", label: t("dash.all") }, ...periodOptions()]} />
      </div>

      {loading ? (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-5">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={<Target className="h-6 w-6" />} title={t("dash.noData")} description={t("dash.noDataDesc")} />
      ) : (
        <DataTable
          columns={columns}
          rows={list}
          rowActions={(k) => (
            <>
              <button onClick={() => openEdit(k)} aria-label={t("dash.edit")} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setDeleteId(k.id)} aria-label={t("dash.delete")} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        />
      )}

      {modalOpen && (
        <KpiModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} employees={employees} onSaved={() => { setModalOpen(false); load(); }} />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await fetch(`/api/kpis/${deleteId}`, { method: "DELETE" });
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

function KpiModal({ open, onClose, editing, employees, onSaved }: {
  open: boolean; onClose: () => void; editing: NormalKpi | null;
  employees: { id: string; fullName: string; empNo: string }[]; onSaved: () => void;
}) {
  const { t } = useLanguage();
  const currentPeriod = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) setForm({ ...editing });
    else setForm({ employeeId: "", period: currentPeriod, productivity: 80, quality: 80, teamwork: 80, punctuality: 80, initiative: 80, comments: "" });
  }, [editing, open]);

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.employeeId) { toast.error("Select an employee"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/kpis/${editing.id}` : "/api/kpis";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: form.employeeId,
          period: form.period,
          productivity: Number(form.productivity),
          quality: Number(form.quality),
          teamwork: Number(form.teamwork),
          punctuality: Number(form.punctuality),
          initiative: Number(form.initiative),
          comments: form.comments,
        }),
      });
      const d = await res.json();
      if (d.ok) { toast.success(editing ? t("dash.updated") : t("dash.created")); onSaved(); }
      else toast.error(d.error || "Failed");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "tanoor-input h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none";

  return (
    <ModalShell open={open} onClose={onClose} title={editing ? t("kpi.edit") : t("kpi.add")} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("pay.employee")} *</label>
          <select className={inputCls} value={form.employeeId} onChange={(e) => set("employeeId", e.target.value)} disabled={!!editing}>
            <option value="">— Select —</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.empNo} · {e.fullName}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("dash.period")}</label>
          <input type="month" className={inputCls} value={form.period} onChange={(e) => set("period", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { k: "productivity", label: t("kpi.productivity") },
            { k: "quality", label: t("kpi.quality") },
            { k: "teamwork", label: t("kpi.teamwork") },
            { k: "punctuality", label: t("kpi.punctuality") },
            { k: "initiative", label: t("kpi.initiative") },
          ].map((m) => (
            <div key={m.k}>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{m.label}</label>
              <input type="number" min={0} max={100} className={inputCls} value={form[m.k]} onChange={(e) => set(m.k, e.target.value)} />
            </div>
          ))}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("kpi.comments")}</label>
          <textarea rows={3} className="tanoor-input w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none" value={form.comments || ""} onChange={(e) => set("comments", e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted">{t("dash.cancel")}</button>
          <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("dash.save")}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
