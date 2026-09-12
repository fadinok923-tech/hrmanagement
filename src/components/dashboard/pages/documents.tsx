"use client";

import { useEffect, useState, useMemo, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2, FileText, AlertTriangle, XCircle, Upload, Loader2, Eye } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { PageHeader, FilterSelect, StatCard, ModalShell, StatusBadge, EmptyState } from "../shared";
import { DataTable, type Column } from "../data-table";
import { ConfirmDialog } from "../confirm-dialog";
import { normalizeDocumentList, type NormalDocument } from "../api-helpers";

const TYPES = ["iqama", "passport", "contract", "certificate", "other"];

export function DocumentsPage() {
  const { t } = useLanguage();
  const [list, setList] = useState<NormalDocument[]>([]);
  const [employees, setEmployees] = useState<{ id: string; fullName: string; empNo: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (type !== "all") params.set("type", type);
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/documents?${params}`);
      const d = await res.json();
      if (d.ok) setList(normalizeDocumentList(d.data));
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
  }, [search, type, status]);

  const stats = useMemo(() => ({
    total: list.length,
    expiring: list.filter((d) => d.status === "expiring").length,
    expired: list.filter((d) => d.status === "expired").length,
  }), [list]);

  const alerts = list.filter((d) => d.status === "expiring" || d.status === "expired").slice(0, 6);

  const columns: Column<NormalDocument>[] = [
    { key: "title", header: t("doc.title2"), render: (d) => <span className="font-medium">{d.title}</span> },
    { key: "type", header: t("doc.docType"), render: (d) => <StatusBadge status={d.type} variant="info" /> },
    {
      key: "employee", header: t("pay.employee"),
      render: (d) => (
        <div className="min-w-0">
          <p className="truncate">{d.employeeName || "—"}</p>
          <p className="truncate text-xs text-muted-foreground">{d.empNo}</p>
        </div>
      ),
    },
    { key: "issueDate", header: t("doc.issueDate"), render: (d) => <span className="font-mono text-xs">{d.issueDate || "—"}</span> },
    { key: "expiryDate", header: t("doc.expiryDate"), render: (d) => <span className="font-mono text-xs">{d.expiryDate || "—"}</span> },
    { key: "status", header: t("dash.status"), render: (d) => <StatusBadge status={d.status} /> },
    {
      key: "fileUrl" as any, header: "File",
      render: (d: any) => d.fileUrl ? (
        <a
          href={d.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
        >
          <Eye className="h-3 w-3" /> View
        </a>
      ) : <span className="text-xs text-muted-foreground">—</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("doc.title")}
        subtitle={t("doc.subtitle")}
        actions={
          <button onClick={() => setModalOpen(true)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" /> {t("doc.add")}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard title={t("doc.total")} value={stats.total} icon={<FileText className="h-4 w-4" />} accent="blue" />
        <StatCard title={t("doc.expiringSoon")} value={stats.expiring} icon={<AlertTriangle className="h-4 w-4" />} accent="gold" />
        <StatCard title={t("doc.expiredCount")} value={stats.expired} icon={<XCircle className="h-4 w-4" />} accent="red" />
      </div>

      {alerts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            {t("doc.alertTitle")}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 text-xs dark:bg-black/20">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{a.title}</p>
                  <p className="truncate text-muted-foreground">{a.employeeName} · {a.expiryDate}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[min(100%,16rem)] flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("dash.search.placeholder")}
            className="tanoor-input h-11 w-full rounded-lg border border-input bg-card ps-9 pe-3 text-sm focus:outline-none" />
        </div>
        <FilterSelect value={type} onChange={setType} className="w-32"
          options={[{ value: "all", label: t("dash.all") }, ...TYPES.map((tp) => ({ value: tp, label: t(`doc.${tp}`) }))]} />
        <FilterSelect value={status} onChange={setStatus} className="w-32"
          options={[
            { value: "all", label: t("dash.all") },
            { value: "valid", label: t("doc.valid") },
            { value: "expiring", label: t("doc.expiring") },
            { value: "expired", label: t("doc.expired") },
          ]} />
      </div>

      {loading ? (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-5">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={<FileText className="h-6 w-6" />} title={t("dash.noData")} description={t("dash.noDataDesc")} />
      ) : (
        <DataTable
          columns={columns}
          rows={list}
          rowActions={(d) => (
            <button onClick={() => setDeleteId(d.id)} aria-label={t("dash.delete")} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-600">
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
          await fetch(`/api/documents/${deleteId}`, { method: "DELETE" });
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
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    employeeId: "", title: "", type: "iqama", issueDate: today, expiryDate: "", notes: "",
    fileUrl: "", fileName: "", fileSize: 0, mimeType: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })); }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "documents");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (d.ok) {
        set("fileUrl", d.data.url);
        set("fileName", d.data.name);
        set("fileSize", d.data.size);
        set("mimeType", d.data.mimeType);
        if (!form.title) set("title", file.name.replace(/\.[^.]+$/, ""));
        toast.success("Uploaded");
      } else {
        toast.error("Upload failed");
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title) { toast.error("Title required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          employeeId: form.employeeId || null,
          issueDate: form.issueDate ? `${form.issueDate}T00:00:00` : null,
          expiryDate: form.expiryDate ? `${form.expiryDate}T00:00:00` : null,
        }),
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
    <ModalShell open={open} onClose={onClose} title={t("doc.add")} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("pay.employee")}</label>
          <select className={inputCls} value={form.employeeId} onChange={(e) => set("employeeId", e.target.value)}>
            <option value="">— {t("dash.all")} —</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.empNo} · {e.fullName}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("doc.title2")} *</label>
          <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("doc.docType")}</label>
          <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
            {TYPES.map((tp) => <option key={tp} value={tp}>{t(`doc.${tp}`)}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("doc.issueDate")}</label>
            <input type="date" className={inputCls} value={form.issueDate} onChange={(e) => set("issueDate", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("doc.expiryDate")}</label>
            <input type="date" className={inputCls} value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("doc.file")}</label>
          <div className="flex items-center gap-2">
            <label className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-lg border border-dashed border-input bg-background text-xs text-muted-foreground hover:bg-muted">
              {uploading ? <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="me-1.5 h-3.5 w-3.5" />}
              {form.fileName ? `✓ ${form.fileName}` : t("doc.upload")}
              <input type="file" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f);
              }} />
            </label>
            {form.fileUrl && (
              <a href={form.fileUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-medium text-blue-700 hover:bg-blue-100">
                <Eye className="h-3.5 w-3.5" /> View
              </a>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted">{t("dash.cancel")}</button>
          <button type="submit" disabled={saving} className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{t("dash.save")}</button>
        </div>
      </form>
    </ModalShell>
  );
}
