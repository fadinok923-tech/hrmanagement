"use client";

import { useEffect, useState, useMemo, useRef, useCallback, type FormEvent } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Plus, Search, Download, Upload, Pencil, Trash2, IdCard, BookUser, Sparkles, Loader2, Grid3x3, List, X, FileSpreadsheet,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { PageHeader, FilterSelect, StatCard, ModalShell, StatusBadge, EmptyState } from "../shared";
import { DataTable, type Column } from "../data-table";
import { ConfirmDialog } from "../confirm-dialog";
import { useDashStore } from "../dash-store";
import {
  normalizeEmployeeList, normalizeEmployee, formatSAR,
  type NormalEmployee,
} from "../api-helpers";
import { exportToExcel } from "@/lib/excel";

const DEPARTMENTS = ["Production", "Quality Control", "Maintenance", "Logistics", "Administration", "Sales"];
const NATIONALITIES = ["Saudi", "Indian", "Egyptian", "Pakistani", "Filipino", "Bangladeshi"];
const COLORS = ["#1e3a8a", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#0ea5e9", "#f97316"];

function todayISO() { return new Date().toISOString().slice(0, 10); }

export function EmployeesPage() {
  const { t, locale } = useLanguage();
  const { setEmployeeDetailId } = useDashStore();
  const [list, setList] = useState<NormalEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"card" | "table">("card");
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [nat, setNat] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NormalEmployee | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (dept !== "all") params.set("department", dept);
      if (status !== "all") params.set("status", status);
      if (nat !== "all") params.set("nationality", nat);
      const res = await fetch(`/api/employees?${params}`);
      const d = await res.json();
      if (d.ok) setList(normalizeEmployeeList(d.data));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
     
  }, [search, dept, status, nat]);

  const stats = useMemo(() => {
    const total = list.length;
    const active = list.filter((e) => e.status === "active").length;
    const onLeave = list.filter((e) => e.status === "on_leave").length;
    const saudi = list.filter((e) => e.nationality === "Saudi").length;
    return { total, active, onLeave, saudi };
  }, [list]);

  function handleExport() {
    const rows = list.map((e) => ({
      "Emp No": e.empNo,
      "Full Name": e.fullName,
      "Arabic Name": e.fullNameAr || "",
      Nationality: e.nationality,
      Gender: e.gender,
      "Job Title": e.jobTitle,
      Department: e.department,
      "Basic Salary": e.basicSalary,
      Allowances: e.allowances,
      "Hire Date": e.hireDate || "",
      Phone: e.phone || "",
      Email: e.email || "",
      Status: e.status,
    }));
    exportToExcel(rows, "employees", "Employees");
    toast.success(t("dash.exported"));
  }

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(e: NormalEmployee) {
    setEditing(e);
    setModalOpen(true);
  }

  const handleCloseModal = useCallback(() => setModalOpen(false), []);
  const handleSaved = useCallback(() => { setModalOpen(false); load(); }, [load]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/employees/${deleteId}`, { method: "DELETE" });
      const d = await res.json();
      if (d.ok) {
        toast.success(t("dash.deleted"));
        setDeleteId(null);
        load();
      } else {
        toast.error(d.error || "Failed");
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns: Column<NormalEmployee>[] = [
    { key: "empNo", header: t("emp.empNo"), render: (e) => <span className="font-mono text-xs">{e.empNo}</span> },
    {
      key: "name", header: t("emp.name"),
      render: (e) => (
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: e.avatarColor }}>
            {e.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{e.fullName}</p>
            <p className="truncate text-xs text-slate-400">{e.jobTitle}</p>
          </div>
        </div>
      ),
    },
    { key: "department", header: t("emp.dept") },
    { key: "nationality", header: t("emp.nationality") },
    { key: "salary", header: t("emp.salary"), align: "end", render: (e) => formatSAR(e.basicSalary + e.allowances) },
    { key: "status", header: t("dash.status"), render: (e) => <StatusBadge status={e.status} /> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("emp.title")}
        subtitle={t("emp.subtitle")}
        actions={
          <>
            <button onClick={() => setImportOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 transition-colors hover:bg-slate-100">
              <Upload className="h-3.5 w-3.5" /> {t("emp.importCsv")}
            </button>
            <button onClick={handleExport} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 transition-colors hover:bg-slate-100">
              <Download className="h-3.5 w-3.5" /> {t("emp.exportXlsx")}
            </button>
            <button onClick={openAdd} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-semibold text-background transition-colors hover:bg-foreground/90">
              <Plus className="h-3.5 w-3.5" /> {t("dash.add")}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={t("emp.total")} value={stats.total} icon={<IdCard className="h-4 w-4" />} accent="blue" />
        <StatCard title={t("emp.active")} value={stats.active} icon={<BookUser className="h-4 w-4" />} accent="green" />
        <StatCard title={t("emp.onLeave")} value={stats.onLeave} icon={<Loader2 className="h-4 w-4" />} accent="gold" />
        <StatCard title={t("emp.saudi")} value={stats.saudi} icon={<Sparkles className="h-4 w-4" />} accent="blue" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("dash.search.placeholder")}
            className="tanoor-input h-9 w-full rounded-lg border border-input bg-white ps-9 pe-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        <FilterSelect value={dept} onChange={setDept} className="w-36"
          options={[{ value: "all", label: t("dash.all") }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))]} />
        <FilterSelect value={nat} onChange={setNat} className="w-32"
          options={[{ value: "all", label: t("dash.all") }, ...NATIONALITIES.map((n) => ({ value: n, label: n }))]} />
        <FilterSelect value={status} onChange={setStatus} className="w-32"
          options={[
            { value: "all", label: t("dash.all") },
            { value: "active", label: t("emp.active") },
            { value: "on_leave", label: t("emp.onLeave") },
            { value: "terminated", label: "Terminated" },
          ]} />
        <div className="flex overflow-hidden rounded-lg border border-slate-200">
          <button onClick={() => setView("card")} className={`grid h-9 w-9 place-items-center transition-colors ${view === "card" ? "bg-foreground text-background" : "bg-white text-slate-900 hover:bg-slate-100"}`} aria-label={t("emp.cardView")}>
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button onClick={() => setView("table")} className={`grid h-9 w-9 place-items-center transition-colors ${view === "table" ? "bg-foreground text-background" : "bg-white text-slate-900 hover:bg-slate-100"}`} aria-label={t("emp.tableView")}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={<IdCard className="h-6 w-6" />} title={t("dash.noData")} description={t("dash.noDataDesc")} />
      ) : view === "card" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => (
            <div key={e.id} className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-foreground/20">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ background: e.avatarColor }}>
                  {e.fullName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{e.fullName}</p>
                  <p className="truncate text-xs text-slate-400">{e.empNo} · {e.jobTitle}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{e.department}</p>
                </div>
                <StatusBadge status={e.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-slate-400">{t("emp.nationality")}</p>
                  <p className="font-medium text-slate-900">{e.nationality}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-slate-400">{t("emp.salary")}</p>
                  <p className="font-medium text-slate-900">{formatSAR(e.basicSalary + e.allowances)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                <button onClick={() => setEmployeeDetailId(e.id)} className="flex-1 rounded-lg border border-slate-200 bg-background px-3 py-1.5 text-xs font-medium text-slate-900 transition-colors hover:bg-slate-100">
                  {t("emp.viewDetails")}
                </button>
                <button onClick={() => openEdit(e)} aria-label={t("dash.edit")} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteId(e.id)} aria-label={t("dash.delete")} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={list}
          onRowClick={(e) => setEmployeeDetailId(e.id)}
          rowActions={(e) => (
            <>
              <button onClick={() => openEdit(e)} aria-label={t("dash.edit")} className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-900">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setDeleteId(e.id)} aria-label={t("dash.delete")} className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-red-500/10 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        />
      )}

      {modalOpen && (
        <EmployeeModal
          open={modalOpen}
          onClose={handleCloseModal}
          editing={editing}
          onSaved={handleSaved}
        />
      )}

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onImported={() => { setImportOpen(false); load(); }} />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t("dash.confirmDelete")}
        message={t("dash.confirmDeleteMsg")}
        confirmLabel={t("dash.delete")}
        cancelLabel={t("dash.cancel")}
        destructive
        loading={deleteLoading}
      />
    </div>
  );
}

function EmployeeModal({ open, onClose, editing, onSaved }: {
  open: boolean; onClose: () => void; editing: NormalEmployee | null; onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [extractingIqama, setExtractingIqama] = useState(false);
  const [extractingPassport, setExtractingPassport] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!open) { initialized.current = false; return; }
    if (initialized.current) return; // Only init once when modal opens
    initialized.current = true;
    if (editing) setForm({ ...editing });
    else setForm({
      empNo: `TAJ-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      fullName: "", fullNameAr: "", nationality: "Saudi", gender: "male",
      dateOfBirth: "", maritalStatus: "single", phone: "", email: "",
      address: "", emergencyContact: "", jobTitle: "", department: "Production",
      employmentType: "full_time", hireDate: todayISO(), contractEnd: "",
      basicSalary: 0, allowances: 0, bankAccount: "", iban: "",
      passportNo: "", passportExpiry: "", iqamaNo: "", iqamaExpiry: "",
      visaType: "Saudi National", status: "active", notes: "",
      avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  }, [open, editing]);

  function set(k: string, v: any) { setForm((f: any) => ({ ...f, [k]: v })); }

  async function uploadPhoto(field: "profilePhoto" | "iqamaPhoto" | "passportPhoto", file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "employees");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (d.ok) {
        set(field, d.data.url);
        toast.success(t("dash.saved"));
      } else {
        toast.error(d.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    }
  }

  async function extractDoc(type: "iqama" | "passport") {
    const photo = type === "iqama" ? form.iqamaPhoto : form.passportPhoto;
    if (!photo) {
      toast.error(type === "iqama" ? t("emp.iqamaPhoto") + " " + t("dash.required") : t("emp.passportPhoto") + " " + t("dash.required"));
      return;
    }
    if (type === "iqama") setExtractingIqama(true); else setExtractingPassport(true);
    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: photo, type }),
      });
      const d = await res.json();
      if (d.ok) {
        const data = d.data;
        if (data.fullName) set("fullName", data.fullName);
        if (data.fullNameAr) set("fullNameAr", data.fullNameAr);
        if (data.nationality) set("nationality", data.nationality);
        if (data.gender) set("gender", data.gender);
        if (data.dateOfBirth) set("dateOfBirth", data.dateOfBirth);
        if (data.issueDate) {/* skip */}
        if (data.expiryDate) {
          if (type === "iqama") set("iqamaExpiry", data.expiryDate);
          else set("passportExpiry", data.expiryDate);
        }
        if (type === "iqama" && data.iqamaNo) set("iqamaNo", data.iqamaNo);
        if (type === "passport" && data.passportNo) set("passportNo", data.passportNo);
        if (type === "passport") set("visaType", "Iqama");
        toast.success(t("emp.extracted"));
      } else {
        toast.error(t("emp.extractFailed"));
      }
    } catch {
      toast.error(t("emp.extractFailed"));
    } finally {
      setExtractingIqama(false);
      setExtractingPassport(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.empNo || !form.jobTitle) {
      toast.error("Please fill required fields");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/employees/${editing.id}` : "/api/employees";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (d.ok) {
        toast.success(editing ? t("dash.updated") : t("dash.created"));
        onSaved();
      } else {
        toast.error(d.error || "Failed");
      }
    } finally {
      setSaving(false);
    }
  }

  function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">
          {label}{required && <span className="text-red-500"> *</span>}
        </label>
        {children}
      </div>
    );
  }

  const inputCls = "tanoor-input h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none";

  return (
    <ModalShell open={open} onClose={onClose} title={editing ? t("emp.editEmployee") : t("emp.addEmployee")} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal */}
        <section>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{t("emp.section.personal")}</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t("emp.empNo")} required>
              <input className={inputCls} value={form.empNo || ""} onChange={(e) => set("empNo", e.target.value)} required />
            </Field>
            <Field label={t("emp.name")} required>
              <input className={inputCls} value={form.fullName || ""} onChange={(e) => set("fullName", e.target.value)} required />
            </Field>
            <Field label={t("emp.nameAr")}>
              <input className={inputCls} value={form.fullNameAr || ""} onChange={(e) => set("fullNameAr", e.target.value)} dir="rtl" />
            </Field>
            <Field label={t("emp.nationality")}>
              <select className={inputCls} value={form.nationality || "Saudi"} onChange={(e) => set("nationality", e.target.value)}>
                {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label={t("emp.gender")}>
              <select className={inputCls} value={form.gender || "male"} onChange={(e) => set("gender", e.target.value)}>
                <option value="male">{t("emp.male")}</option>
                <option value="female">{t("emp.female")}</option>
              </select>
            </Field>
            <Field label={t("emp.dob")}>
              <input type="date" className={inputCls} value={form.dateOfBirth || ""} onChange={(e) => set("dateOfBirth", e.target.value)} />
            </Field>
            <Field label={t("emp.marital")}>
              <select className={inputCls} value={form.maritalStatus || "single"} onChange={(e) => set("maritalStatus", e.target.value)}>
                <option value="single">{t("emp.single")}</option>
                <option value="married">{t("emp.married")}</option>
                <option value="divorced">{t("emp.divorced")}</option>
                <option value="widowed">{t("emp.widowed")}</option>
              </select>
            </Field>
            <Field label={t("emp.phone")}>
              <input className={inputCls} value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label={t("emp.email")}>
              <input type="email" className={inputCls} value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label={t("emp.address")}>
              <input className={inputCls} value={form.address || ""} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label={t("emp.emergency")}>
              <input className={inputCls} value={form.emergencyContact || ""} onChange={(e) => set("emergencyContact", e.target.value)} />
            </Field>
          </div>
        </section>

        {/* Employment */}
        <section>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{t("emp.section.employment")}</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t("emp.job")} required>
              <input className={inputCls} value={form.jobTitle || ""} onChange={(e) => set("jobTitle", e.target.value)} required />
            </Field>
            <Field label={t("emp.dept")}>
              <select className={inputCls} value={form.department || "Production"} onChange={(e) => set("department", e.target.value)}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label={t("emp.employmentType")}>
              <select className={inputCls} value={form.employmentType || "full_time"} onChange={(e) => set("employmentType", e.target.value)}>
                <option value="full_time">{t("emp.fullTime")}</option>
                <option value="part_time">{t("emp.partTime")}</option>
              </select>
            </Field>
            <Field label={t("emp.hireDate")} required>
              <input type="date" className={inputCls} value={form.hireDate || ""} onChange={(e) => set("hireDate", e.target.value)} required />
            </Field>
            <Field label={t("emp.contractEnd")}>
              <input type="date" className={inputCls} value={form.contractEnd || ""} onChange={(e) => set("contractEnd", e.target.value)} />
            </Field>
            <Field label={t("dash.status")}>
              <select className={inputCls} value={form.status || "active"} onChange={(e) => set("status", e.target.value)}>
                <option value="active">{t("emp.active")}</option>
                <option value="on_leave">{t("emp.onLeave")}</option>
                <option value="terminated">Terminated</option>
              </select>
            </Field>
          </div>
        </section>

        {/* Legal */}
        <section>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{t("emp.section.legal")}</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t("emp.iqamaNo")}>
              <input className={inputCls} value={form.iqamaNo || ""} onChange={(e) => set("iqamaNo", e.target.value)} />
            </Field>
            <Field label={t("emp.iqamaExpiry")}>
              <input type="date" className={inputCls} value={form.iqamaExpiry || ""} onChange={(e) => set("iqamaExpiry", e.target.value)} />
            </Field>
            <Field label={t("emp.passportNo")}>
              <input className={inputCls} value={form.passportNo || ""} onChange={(e) => set("passportNo", e.target.value)} />
            </Field>
            <Field label={t("emp.passportExpiry")}>
              <input type="date" className={inputCls} value={form.passportExpiry || ""} onChange={(e) => set("passportExpiry", e.target.value)} />
            </Field>
            <Field label={t("emp.visa")}>
              <input className={inputCls} value={form.visaType || ""} onChange={(e) => set("visaType", e.target.value)} />
            </Field>
          </div>
        </section>

        {/* Financial */}
        <section>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{t("emp.section.financial")}</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t("emp.basicSalary")}>
              <input type="number" className={inputCls} value={form.basicSalary || 0} onChange={(e) => set("basicSalary", Number(e.target.value))} />
            </Field>
            <Field label={t("emp.allowances")}>
              <input type="number" className={inputCls} value={form.allowances || 0} onChange={(e) => set("allowances", Number(e.target.value))} />
            </Field>
            <Field label={t("emp.bank")}>
              <input className={inputCls} value={form.bankAccount || ""} onChange={(e) => set("bankAccount", e.target.value)} />
            </Field>
            <Field label={t("emp.iban")}>
              <input className={inputCls} value={form.iban || ""} onChange={(e) => set("iban", e.target.value)} />
            </Field>
          </div>
        </section>

        {/* Photos */}
        <section>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{t("emp.section.photos")}</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            {(["profilePhoto", "iqamaPhoto", "passportPhoto"] as const).map((field) => (
              <div key={field}>
                <label className="mb-1 block text-xs font-medium text-slate-400">
                  {field === "profilePhoto" ? t("emp.profilePhoto") : field === "iqamaPhoto" ? t("emp.iqamaPhoto") : t("emp.passportPhoto")}
                </label>
                {form[field] ? (
                  <div className="relative overflow-hidden rounded-lg border border-slate-200">
                    <img src={form[field]} alt={field} className="h-32 w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-slate-900/60 px-2 py-1.5">
                      <label className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-white hover:text-amber-300">
                        <Upload className="h-3 w-3" /> Change
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadPhoto(field, f);
                        }} />
                      </label>
                      <button type="button" onClick={() => set(field, "")} className="text-[11px] font-medium text-white hover:text-red-400">Remove</button>
                    </div>
                  </div>
                ) : (
                  <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-white text-slate-400 transition hover:border-[var(--color-brand-light)] hover:bg-slate-50">
                    <Upload className="h-5 w-5" />
                    <span className="text-xs">{t("emp.uploadPhoto")}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadPhoto(field, f);
                    }} />
                  </label>
                )}
                {field === "iqamaPhoto" && form.iqamaPhoto && (
                  <button type="button" onClick={() => extractDoc("iqama")} disabled={extractingIqama} className="mt-1.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50">
                    {extractingIqama ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {extractingIqama ? t("emp.extracting") : t("emp.extractIqama")}
                  </button>
                )}
                {field === "passportPhoto" && form.passportPhoto && (
                  <button type="button" onClick={() => extractDoc("passport")} disabled={extractingPassport} className="mt-1.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50">
                    {extractingPassport ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {extractingPassport ? t("emp.extracting") : t("emp.extractPassport")}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Notes */}
        <Field label={t("emp.notes")}>
          <textarea rows={3} className="tanoor-input w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:outline-none" value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 bg-background px-4 text-sm font-medium text-slate-900 hover:bg-slate-100">
            {t("dash.cancel")}
          </button>
          <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("dash.save")}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ImportModal({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Column definitions for the template
  const TEMPLATE_COLUMNS = [
    "empNo", "name", "arabicName", "nationality", "gender", "maritalStatus",
    "dob", "phone", "email", "address", "emergencyContact",
    "iqamaNo", "passportNo", "sponsor", "visaType", "bankIban",
    "jobTitle", "department", "hireDate", "basicSalary", "allowances",
  ];

  // Download a sample Excel template
  function downloadTemplate() {
    const sampleData = [
      {
        empNo: "TAJ-100",
        name: "Ahmed Mohammed Ali",
        arabicName: "أحمد محمد علي",
        nationality: "Saudi",
        gender: "male",
        maritalStatus: "single",
        dateOfBirth: "1990-05-15",
        phone: "0501234567",
        email: "ahmed@tanoor.sa",
        address: "Riyadh, Saudi Arabia",
        emergencyContact: "0509876543",
        iqamaNo: "2001234567",
        passportNo: "A12345678",
        sponsor: "Tanoor Al Jazeera",
        visaType: "Saudi National",
        bankIban: "SA0380000000608012345678",
        jobTitle: "Production Operator",
        department: "Production",
        hireDate: "2024-01-15",
        basicSalary: 3500,
        allowances: 500,
      },
      {
        empNo: "TAJ-101",
        name: "Rajesh Kumar Sharma",
        arabicName: "",
        nationality: "Indian",
        gender: "male",
        maritalStatus: "married",
        dateOfBirth: "1988-03-20",
        phone: "0534567890",
        email: "rajesh@tanoor.sa",
        address: "Dammam, Saudi Arabia",
        emergencyContact: "0556789012",
        iqamaNo: "2987654321",
        passportNo: "P87654321",
        sponsor: "Tanoor Al Jazeera",
        visaType: "Iqama",
        bankIban: "SA0380000000608098765432",
        jobTitle: "Quality Inspector",
        department: "Quality Control",
        hireDate: "2023-09-01",
        basicSalary: 4200,
        allowances: 600,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData, { header: TEMPLATE_COLUMNS });
    // Auto-size columns
    ws["!cols"] = TEMPLATE_COLUMNS.map((col) => ({ wch: Math.max(col.length, 15) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "employee_import_template.xlsx");
    toast.success("Template downloaded");
  }

  // Handle file upload (Excel only)
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      e.target.value = "";
      return;
    }

    setFileName(file.name);
    setParsedRows([]);

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (rows.length === 0) {
        toast.error("No data found in the Excel file");
        return;
      }
      // Filter out rows without a name
      const valid = rows.filter((r) => r.name || r.fullName);
      if (valid.length === 0) {
        toast.error("No valid rows found. The file must have a 'name' column.");
        return;
      }
      setParsedRows(valid);
      toast.success(`${valid.length} rows parsed from Excel`);
    } catch (err) {
      toast.error("Failed to read Excel file. Make sure it's a valid .xlsx file.");
    }
    e.target.value = "";
  }

  // Import parsed rows
  async function handleImport() {
    if (parsedRows.length === 0) return;
    setLoading(true);
    let count = 0;
    let failed = 0;

    for (const row of parsedRows) {
      // Map Excel columns to API schema — ensure required fields have values
      const fullName = String(row.name || row.fullName || "").trim();
      if (!fullName) { failed++; continue; }

      const empNo = String(row.empNo || row.empno || "").trim() || `TAJ-${Date.now()}-${count}`;

      // Convert Excel date serial numbers to ISO strings
      function toDateStr(val: any): string {
        if (!val && val !== 0) return "";
        if (typeof val === "number") {
          // Excel serial date: days since 1900-01-01 (with leap year bug)
          const date = new Date(Math.round((val - 25569) * 86400 * 1000));
          return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
        }
        const s = String(val).trim();
        if (!s) return "";
        const date = new Date(s);
        return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
      }

      const hireDateStr = toDateStr(row.hireDate || row.hiredate) || new Date().toISOString().slice(0, 10);

      const body: Record<string, unknown> = {
        empNo: empNo,
        fullName: fullName,
        nationality: String(row.nationality || "Saudi").trim() || "Saudi",
        gender: String(row.gender || "male").toLowerCase().trim() || "male",
        jobTitle: String(row.jobTitle || row.jobtitle || row.job || "Staff").trim() || "Staff",
        department: String(row.department || "Production").trim() || "Production",
        hireDate: hireDateStr,
        basicSalary: Number(row.basicSalary || row.basicsalary || row.salary) || 0,
        allowances: Number(row.allowances) || 0,
        status: "active",
      };

      // Optional fields — only add if non-empty
      const dobStr = toDateStr(row.dob || row.dateOfBirth);
      const opt: Record<string, string | null> = {
        arabicName: String(row.arabicName || row.arabicname || "").trim() || null,
        dateOfBirth: dobStr || null,
        maritalStatus: String(row.maritalStatus || row.maritalstatus || "").trim().toLowerCase() || null,
        phone: String(row.phone || row.mobile || "").trim() || null,
        email: String(row.email || "").trim() || null,
        address: String(row.address || "").trim() || null,
        emergencyContact: String(row.emergencyContact || row.emergencycontact || "").trim() || null,
        iqamaNo: String(row.iqamaNo || row.iqamano || row.iqama || "").trim() || null,
        passportNo: String(row.passportNo || row.passportno || "").trim() || null,
        visaType: String(row.visaType || row.visatype || "").trim() || null,
        bankAccount: String(row.bankIban || row.bankiban || row.iban || "").trim() || null,
      };
      for (const [k, v] of Object.entries(opt)) { if (v) body[k] = v; }

      try {
        const res = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) count++;
        else {
          failed++;
        }
      } catch { failed++; }
    }

    setLoading(false);
    if (count > 0) toast.success(`${count} employee${count > 1 ? "s" : ""} imported successfully`);
    if (failed > 0) toast.error(`${failed} row${failed > 1 ? "s" : ""} failed to import`);
    if (count > 0) {
      setParsedRows([]);
      setFileName("");
      onImported();
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Import Employees (Excel)" size="lg">
      {/* Download Template */}
      <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-slate-700">Download Sample Template</p>
              <p className="text-xs text-slate-500">Excel file with all columns + 2 sample rows</p>
            </div>
          </div>
          <button
            onClick={downloadTemplate}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-[var(--color-brand-light)]", "bg-[var(--color-brand-light)]/5"); }}
        onDragLeave={(e) => { e.currentTarget.classList.remove("border-[var(--color-brand-light)]", "bg-[var(--color-brand-light)]/5"); }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("border-[var(--color-brand-light)]", "bg-[var(--color-brand-light)]/5");
          const file = e.dataTransfer.files?.[0];
          if (file) {
            const ext = file.name.split(".").pop()?.toLowerCase();
            if (ext === "xlsx" || ext === "xls") {
              setFileName(file.name);
              file.arrayBuffer().then((buf) => {
                const wb = XLSX.read(buf, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
                const valid = rows.filter((r) => r.name || r.fullName);
                if (valid.length > 0) { setParsedRows(valid); toast.success(`${valid.length} rows parsed`); }
                else toast.error("No valid rows found (need 'name' column)");
              });
            } else { toast.error("Please upload .xlsx or .xls file"); }
          }
        }}
        className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 transition hover:border-[var(--color-brand-light)] hover:bg-[var(--color-brand-light)]/5"
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
        <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-slate-400 shadow-sm">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        </div>
        <p className="text-center text-xs">
          {fileName ? <span className="font-semibold text-slate-700">{fileName}</span> : "Drop Excel file here or click to browse (.xlsx only)"}
        </p>
        {parsedRows.length > 0 && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
            {parsedRows.length} rows ready to import
          </span>
        )}
      </div>

      {/* Preview Table */}
      {parsedRows.length > 0 && (
        <div className="mt-4 max-h-48 overflow-auto rounded-lg border border-slate-100">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50">
              <tr>
                <th className="px-2 py-1.5 text-start font-semibold text-slate-500">Emp No</th>
                <th className="px-2 py-1.5 text-start font-semibold text-slate-500">Name</th>
                <th className="px-2 py-1.5 text-start font-semibold text-slate-500">Dept</th>
                <th className="px-2 py-1.5 text-start font-semibold text-slate-500">Salary</th>
              </tr>
            </thead>
            <tbody>
              {parsedRows.slice(0, 20).map((r, i) => (
                <tr key={i} className="border-t border-slate-50">
                  <td className="px-2 py-1.5 text-slate-600">{r.empNo || r.empno || "—"}</td>
                  <td className="px-2 py-1.5 font-medium text-slate-800">{r.name || r.fullName || "—"}</td>
                  <td className="px-2 py-1.5 text-slate-600">{r.department || "—"}</td>
                  <td className="px-2 py-1.5 text-slate-600">{r.basicSalary || r.basicsalary || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {parsedRows.length > 20 && (
            <p className="bg-slate-50 px-2 py-1 text-center text-[11px] text-slate-400">
              +{parsedRows.length - 20} more rows…
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <button onClick={onClose} className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Cancel
        </button>
        <button
          onClick={handleImport}
          disabled={loading || parsedRows.length === 0}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[var(--color-brand-deep)] px-5 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--color-brand-card)] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Import ({parsedRows.length})
        </button>
      </div>
    </ModalShell>
  );
}
