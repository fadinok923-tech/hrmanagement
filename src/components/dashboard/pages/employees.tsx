"use client";

import { useEffect, useState, useMemo, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Plus, Search, Download, Upload, Pencil, Trash2, IdCard, BookUser, Sparkles, Loader2, Grid3x3, List, X,
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
            <p className="truncate text-xs text-muted-foreground">{e.jobTitle}</p>
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
            <button onClick={() => setImportOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted">
              <Upload className="h-3.5 w-3.5" /> {t("emp.importCsv")}
            </button>
            <button onClick={handleExport} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted">
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
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("dash.search.placeholder")}
            className="tanoor-input h-9 w-full rounded-lg border border-input bg-card ps-9 pe-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
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
        <div className="flex overflow-hidden rounded-lg border border-border">
          <button onClick={() => setView("card")} className={`grid h-9 w-9 place-items-center transition-colors ${view === "card" ? "bg-foreground text-background" : "bg-card text-foreground hover:bg-muted"}`} aria-label={t("emp.cardView")}>
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button onClick={() => setView("table")} className={`grid h-9 w-9 place-items-center transition-colors ${view === "table" ? "bg-foreground text-background" : "bg-card text-foreground hover:bg-muted"}`} aria-label={t("emp.tableView")}>
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
            <div key={e.id} className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-foreground/20">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ background: e.avatarColor }}>
                  {e.fullName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{e.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.empNo} · {e.jobTitle}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{e.department}</p>
                </div>
                <StatusBadge status={e.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground">{t("emp.nationality")}</p>
                  <p className="font-medium text-foreground">{e.nationality}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground">{t("emp.salary")}</p>
                  <p className="font-medium text-foreground">{formatSAR(e.basicSalary + e.allowances)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                <button onClick={() => setEmployeeDetailId(e.id)} className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">
                  {t("emp.viewDetails")}
                </button>
                <button onClick={() => openEdit(e)} aria-label={t("dash.edit")} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteId(e.id)} aria-label={t("dash.delete")} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600">
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
              <button onClick={() => openEdit(e)} aria-label={t("dash.edit")} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setDeleteId(e.id)} aria-label={t("dash.delete")} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        />
      )}

      {modalOpen && (
        <EmployeeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          editing={editing}
          onSaved={() => { setModalOpen(false); load(); }}
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

  useEffect(() => {
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
  }, [editing, open]);

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
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {label}{required && <span className="text-red-500"> *</span>}
        </label>
        {children}
      </div>
    );
  }

  const inputCls = "tanoor-input h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none";

  return (
    <ModalShell open={open} onClose={onClose} title={editing ? t("emp.editEmployee") : t("emp.addEmployee")} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal */}
        <section>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("emp.section.personal")}</h4>
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
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("emp.section.employment")}</h4>
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
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("emp.section.legal")}</h4>
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
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("emp.section.financial")}</h4>
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
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("emp.section.photos")}</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            {(["profilePhoto", "iqamaPhoto", "passportPhoto"] as const).map((field) => (
              <div key={field}>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {field === "profilePhoto" ? t("emp.profilePhoto") : field === "iqamaPhoto" ? t("emp.iqamaPhoto") : t("emp.passportPhoto")}
                </label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-lg border border-dashed border-input bg-background text-xs text-muted-foreground hover:bg-muted">
                    <Upload className="me-1.5 h-3.5 w-3.5" />
                    {form[field] ? "✓ Uploaded" : t("emp.uploadPhoto")}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadPhoto(field, f);
                    }} />
                  </label>
                  {form[field] && (
                    <img src={form[field]} alt="" className="h-10 w-10 rounded-lg border border-border object-cover" />
                  )}
                </div>
                {field === "iqamaPhoto" && form.iqamaPhoto && (
                  <button type="button" onClick={() => extractDoc("iqama")} disabled={extractingIqama} className="mt-1.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                    {extractingIqama ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {extractingIqama ? t("emp.extracting") : t("emp.extractIqama")}
                  </button>
                )}
                {field === "passportPhoto" && form.passportPhoto && (
                  <button type="button" onClick={() => extractDoc("passport")} disabled={extractingPassport} className="mt-1.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
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
          <textarea rows={3} className="tanoor-input w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground focus:outline-none" value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted">
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
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleImport() {
    if (!csv.trim()) return;
    setLoading(true);
    try {
      const lines = csv.trim().split(/\r?\n/);
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(",").map((c) => c.trim());
        const obj: any = {};
        headers.forEach((h, idx) => { obj[h] = cells[idx]; });
        if (!obj.name) continue;
        const body = {
          empNo: obj.empno || `TAJ-${Math.floor(Math.random() * 9000) + 1000}`,
          fullName: obj.name,
          nationality: obj.nationality || "Saudi",
          jobTitle: obj.jobtitle || obj.job || "Staff",
          department: obj.department || "Production",
          hireDate: obj.hiredate || todayISO(),
          basicSalary: Number(obj.basicsalary) || 0,
          allowances: Number(obj.allowances) || 0,
          phone: obj.phone || "",
          email: obj.email || "",
          visaType: obj.visatype || (obj.nationality === "Saudi" ? "Saudi National" : "Iqama"),
        };
        try {
          const res = await fetch("/api/employees", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (res.ok) count++;
        } catch {}
      }
      toast.success(`${count} employees imported`);
      onImported();
      setCsv("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title={t("emp.importCsv")} size="lg">
      <p className="mb-3 text-sm text-muted-foreground">
        Paste CSV data. First line must be headers. Supported: empNo, name, nationality, jobTitle, department, hireDate, basicSalary, allowances, phone, email
      </p>
      <textarea
        rows={10}
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        placeholder={"empNo,name,nationality,jobTitle,department,hireDate,basicSalary,allowances,phone,email\nTAJ-100,John Doe,Saudi,Operator,Production,2024-01-15,3000,500,+966501234567,john@tanoor.sa"}
        className="tanoor-input w-full rounded-lg border border-input bg-background p-3 font-mono text-xs text-foreground focus:outline-none"
      />
      <div className="mt-4 flex items-center justify-end gap-2">
        <button onClick={onClose} className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted">
          {t("dash.cancel")}
        </button>
        <button onClick={handleImport} disabled={loading || !csv.trim()} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-50">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("dash.import")}
        </button>
      </div>
    </ModalShell>
  );
}
