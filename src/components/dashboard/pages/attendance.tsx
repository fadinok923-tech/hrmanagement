"use client";

import { useEffect, useState, useMemo, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2, CalendarCheck, CheckCircle2, AlarmClock as AlertClock, Clock, Users } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { PageHeader, FilterSelect, StatCard, ModalShell, StatusBadge, EmptyState } from "../shared";
import { DataTable, type Column } from "../data-table";
import { ConfirmDialog } from "../confirm-dialog";
import { normalizeAttendanceList, type NormalAttendance } from "../api-helpers";

const DEPARTMENTS = ["Production", "Quality Control", "Maintenance", "Logistics", "Administration", "Sales"];

export function AttendancePage() {
  const { t } = useLanguage();
  const [list, setList] = useState<NormalAttendance[]>([]);
  const [employees, setEmployees] = useState<{ id: string; fullName: string; empNo: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (dept !== "all") params.set("department", dept);
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/attendance?${params}`);
      const d = await res.json();
      if (d.ok) setList(normalizeAttendanceList(d.data));
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
     
  }, [search, dept, status]);

  const stats = useMemo(() => ({
    total: list.length,
    present: list.filter((a) => a.status === "present").length,
    late: list.filter((a) => a.status === "late").length,
    leave: list.filter((a) => a.status === "leave").length,
  }), [list]);

  const columns: Column<NormalAttendance>[] = [
    { key: "date", header: t("att.date"), render: (a) => <span className="font-mono text-xs">{a.date}</span> },
    {
      key: "name", header: t("pay.employee"),
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{a.employeeName}</p>
          <p className="truncate text-xs text-muted-foreground">{a.empNo} · {a.department}</p>
        </div>
      ),
    },
    { key: "checkIn", header: t("att.checkIn"), align: "center", render: (a) => a.checkIn || "—" },
    { key: "checkOut", header: t("att.checkOut"), align: "center", render: (a) => a.checkOut || "—" },
    { key: "workHours", header: t("att.workHours"), align: "end", render: (a) => `${a.workHours}h` },
    { key: "overtime", header: t("att.overtime"), align: "end", render: (a) => a.overtime > 0 ? `${a.overtime}h` : "—" },
    { key: "status", header: t("dash.status"), render: (a) => <StatusBadge status={a.status} /> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("att.title")}
        subtitle={t("att.subtitle")}
        actions={
          <button onClick={() => setModalOpen(true)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" /> {t("dash.add")}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={t("att.total")} value={stats.total} icon={<CalendarCheck className="h-4 w-4" />} accent="blue" />
        <StatCard title={t("att.presentCount")} value={stats.present} icon={<CheckCircle2 className="h-4 w-4" />} accent="green" />
        <StatCard title={t("att.lateCount")} value={stats.late} icon={<Clock className="h-4 w-4" />} accent="gold" />
        <StatCard title={t("att.leaveCount")} value={stats.leave} icon={<Users className="h-4 w-4" />} accent="blue" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[min(100%,16rem)] flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("dash.search.placeholder")}
            className="tanoor-input h-11 w-full rounded-lg border border-input bg-card ps-9 pe-3 text-sm focus:outline-none"
          />
        </div>
        <FilterSelect value={dept} onChange={setDept} className="w-40"
          options={[{ value: "all", label: t("dash.all") }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))]} />
        <FilterSelect value={status} onChange={setStatus} className="w-32"
          options={[
            { value: "all", label: t("dash.all") },
            { value: "present", label: t("att.present") },
            { value: "late", label: t("att.late") },
            { value: "absent", label: t("att.absent") },
            { value: "leave", label: t("att.leave") },
          ]} />
      </div>

      {loading ? (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-5">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={<CalendarCheck className="h-6 w-6" />} title={t("dash.noData")} description={t("dash.noDataDesc")} />
      ) : (
        <DataTable
          columns={columns}
          rows={list}
          rowActions={(a) => (
            <button onClick={() => setDeleteId(a.id)} aria-label={t("dash.delete")} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        />
      )}

      {modalOpen && <AddModal open={modalOpen} onClose={() => setModalOpen(false)} employees={employees} onSaved={() => { setModalOpen(false); load(); }} />}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await fetch(`/api/attendance?id=${deleteId}`, { method: "DELETE" });
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

function AddModal({ open, onClose, employees, onSaved }: {
  open: boolean; onClose: () => void; employees: { id: string; fullName: string; empNo: string }[]; onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ employeeId: "", date: new Date().toISOString().slice(0, 10), checkIn: "07:00", checkOut: "16:00", status: "present", notes: "" });
  const [saving, setSaving] = useState(false);

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.employeeId) { toast.error("Select an employee"); return; }
    setSaving(true);
    try {
      const dateStr = `${form.date}T00:00:00`;
      const checkIn = form.checkIn ? new Date(`${form.date}T${form.checkIn}:00`).toISOString() : null;
      const checkOut = form.checkOut ? new Date(`${form.date}T${form.checkOut}:00`).toISOString() : null;
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date: dateStr, checkIn, checkOut }),
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
    <ModalShell open={open} onClose={onClose} title={t("att.add")} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("pay.employee")} *</label>
          <select className={inputCls} value={form.employeeId} onChange={(e) => set("employeeId", e.target.value)}>
            <option value="">— Select —</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.empNo} · {e.fullName}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("att.date")}</label>
            <input type="date" className={inputCls} value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("dash.status")}</label>
            <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="present">{t("att.present")}</option>
              <option value="late">{t("att.late")}</option>
              <option value="absent">{t("att.absent")}</option>
              <option value="leave">{t("att.leave")}</option>
              <option value="holiday">{t("att.holiday")}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("att.checkIn")}</label>
            <input type="time" className={inputCls} value={form.checkIn} onChange={(e) => set("checkIn", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("att.checkOut")}</label>
            <input type="time" className={inputCls} value={form.checkOut} onChange={(e) => set("checkOut", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("leave.reason")}</label>
          <textarea rows={2} className="tanoor-input w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted">{t("dash.cancel")}</button>
          <button type="submit" disabled={saving} className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{t("dash.save")}</button>
        </div>
      </form>
    </ModalShell>
  );
}
