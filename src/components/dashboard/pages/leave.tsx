"use client";

import { useEffect, useState, useMemo, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2, Check, X, CalendarDays, Clock, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { PageHeader, FilterSelect, StatCard, ModalShell, StatusBadge, EmptyState } from "../shared";
import { DataTable, type Column } from "../data-table";
import { ConfirmDialog } from "../confirm-dialog";
import { normalizeLeaveList, type NormalLeave } from "../api-helpers";

const TYPES = ["annual", "sick", "emergency", "unpaid", "maternity", "casual"];

export function LeavePage() {
  const { t } = useLanguage();
  const [list, setList] = useState<NormalLeave[]>([]);
  const [employees, setEmployees] = useState<{ id: string; fullName: string; empNo: string; leaveAnnual: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      if (type !== "all") params.set("type", type);
      const res = await fetch(`/api/leave?${params}`);
      const d = await res.json();
      if (d.ok) setList(normalizeLeaveList(d.data));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch("/api/employees").then((r) => r.json()).then((d) => {
      if (d.ok) setEmployees(d.data.map((e: any) => ({ id: e.id, fullName: e.fullName, empNo: e.empNo, leaveAnnual: e.leaveAnnual ?? 21 })));
    });
  }, []);

  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
     
  }, [search, status, type]);

  const stats = useMemo(() => ({
    total: list.length,
    pending: list.filter((l) => l.status === "pending").length,
    approvedDays: list.filter((l) => l.status === "approved").reduce((s, l) => s + l.days, 0),
  }), [list]);

const balanceMap = useMemo(() => {
  const map: Record<string, number> = {};
  employees.forEach((e) => {
    const used = list
      .filter((l) => l.employeeId === e.id && l.type === "annual" && l.status === "approved")
      .reduce((s, l) => s + l.days, 0);
    map[e.id] = e.leaveAnnual - used;
  });
  return map;
}, [list, employees]);
  async function act(id: string, status: "approved" | "rejected") {
    const res = await fetch(`/api/leave/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, approver: "System Administrator" }),
    });
    const d = await res.json();
    if (d.ok) {
      toast.success(status === "approved" ? t("dash.approved") : t("dash.rejected"));
      load();
    } else {
      toast.error("Failed");
    }
  }

 const columns: Column<NormalLeave>[] = [
    { key: "employee", header: t("pay.employee"), render: (l) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{l.employeeName}</p>
        <p className="truncate text-xs text-muted-foreground">{l.empNo} · {l.department}</p>
      </div>
    )},
    { key: "type", header: t("leave.type"), render: (l) => t(`leave.${l.type}`) },
    { key: "startDate", header: t("leave.startDate"), render: (l) => <span className="font-mono text-xs">{l.startDate}</span> },
    { key: "endDate", header: t("leave.endDate"), render: (l) => <span className="font-mono text-xs">{l.endDate}</span> },
    { key: "days", header: t("leave.days"), align: "center", render: (l) => l.days },
    { key: "balance", header: "Balance", align: "center", render: (l) => {
      const bal = balanceMap[l.employeeId];
      return bal !== undefined ? <span className={bal < 0 ? "text-red-600 font-semibold" : ""}>{bal}</span> : "—";
    }},
    { key: "reason", header: t("leave.reason"), render: (l) => <span className="truncate text-xs text-muted-foreground">{l.reason || "—"}</span> },
    { key: "status", header: t("dash.status"), render: (l) => <StatusBadge status={l.status} /> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("leave.title")}
        subtitle={t("leave.subtitle")}
        actions={
          <button onClick={() => setModalOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-semibold text-background hover:bg-foreground/90">
            <Plus className="h-3.5 w-3.5" /> {t("leave.apply")}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard title={t("leave.totalRequests")} value={stats.total} icon={<CalendarDays className="h-4 w-4" />} accent="blue" />
        <StatCard title={t("leave.pendingBalance")} value={stats.pending} icon={<Clock className="h-4 w-4" />} accent="gold" />
        <StatCard title={t("leave.approvedBalance")} value={`${stats.approvedDays} ${t("det.days")}`} icon={<CheckCircle2 className="h-4 w-4" />} accent="green" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("dash.search.placeholder")}
            className="tanoor-input h-9 w-full rounded-lg border border-input bg-card ps-9 pe-3 text-sm focus:outline-none" />
        </div>
        <FilterSelect value={type} onChange={setType} className="w-36"
          options={[{ value: "all", label: t("dash.all") }, ...TYPES.map((tp) => ({ value: tp, label: t(`leave.${tp}`) }))]} />
        <FilterSelect value={status} onChange={setStatus} className="w-32"
          options={[
            { value: "all", label: t("dash.all") },
            { value: "pending", label: t("leave.pending") },
            { value: "approved", label: t("leave.approved") },
            { value: "rejected", label: t("leave.rejected") },
          ]} />
      </div>

      {loading ? (
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-6 w-6" />} title={t("dash.noData")} description={t("dash.noDataDesc")} />
      ) : (
        <DataTable
          columns={columns}
          rows={list}
          rowActions={(l) => (
            <>
              {l.status === "pending" && (
                <>
                  <button onClick={() => act(l.id, "approved")} aria-label={t("leave.approve")} title={t("leave.approve")}
                    className="grid h-7 w-7 place-items-center rounded-md text-emerald-600 hover:bg-emerald-500/10">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => act(l.id, "rejected")} aria-label={t("leave.reject")} title={t("leave.reject")}
                    className="grid h-7 w-7 place-items-center rounded-md text-red-600 hover:bg-red-500/10">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              <button onClick={() => setDeleteId(l.id)} aria-label={t("dash.delete")}
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        />
      )}

      {modalOpen && <ApplyModal open={modalOpen} onClose={() => setModalOpen(false)} employees={employees} onSaved={() => { setModalOpen(false); load(); }} />}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await fetch(`/api/leave/${deleteId}`, { method: "DELETE" });
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

function ApplyModal({ open, onClose, employees, onSaved }: {
  open: boolean; onClose: () => void; employees: { id: string; fullName: string; empNo: string; leaveAnnual: number }[]; onSaved: () => void;
}) {
  const { t } = useLanguage();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ employeeId: "", type: "annual", startDate: today, endDate: today, reason: "", days: 1 });
  const [saving, setSaving] = useState(false);

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.employeeId) { toast.error("Select an employee"); return; }
    setSaving(true);
    try {
      const days = form.days || 0.5;
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, startDate: `${form.startDate}T00:00:00`, endDate: `${form.endDate}T00:00:00`, days }),
      });
      const d = await res.json();
      if (d.ok) { toast.success(t("dash.created")); onSaved(); }
      else toast.error(d.error || "Failed");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "tanoor-input h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none";

  return (
    <ModalShell open={open} onClose={onClose} title={t("leave.apply")} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("pay.employee")} *</label>
          <select className={inputCls} value={form.employeeId} onChange={(e) => set("employeeId", e.target.value)}>
            <option value="">— Select —</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.empNo} · {e.fullName}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("leave.type")}</label>
          <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
            {TYPES.map((tp) => <option key={tp} value={tp}>{t(`leave.${tp}`)}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("leave.startDate")}</label>
            <input type="date" className={inputCls} value={form.startDate} onChange={(e) => {
              set("startDate", e.target.value);
              const diff = Math.max(0.5, Math.ceil((new Date(form.endDate).getTime() - new Date(e.target.value).getTime()) / (24 * 60 * 60 * 1000)) + 1);
              set("days", diff);
            }} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("leave.endDate")}</label>
            <input type="date" className={inputCls} value={form.endDate} onChange={(e) => {
              set("endDate", e.target.value);
              const diff = Math.max(0.5, Math.ceil((new Date(e.target.value).getTime() - new Date(form.startDate).getTime()) / (24 * 60 * 60 * 1000)) + 1);
              set("days", diff);
            }} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Number of Days <span className="text-slate-400">(e.g. 0.5 for half day, 2 for two days)</span></label>
          <input type="number" min={0.01} step={0.01} className={inputCls} value={form.days} onChange={(e) => set("days", parseFloat(e.target.value) || 0.01)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("leave.reason")}</label>
          <textarea rows={3} className="tanoor-input w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none" value={form.reason} onChange={(e) => set("reason", e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted">{t("dash.cancel")}</button>
          <button type="submit" disabled={saving} className="h-10 rounded-lg bg-foreground px-4 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-50">{t("dash.save")}</button>
        </div>
      </form>
    </ModalShell>
  );
}
