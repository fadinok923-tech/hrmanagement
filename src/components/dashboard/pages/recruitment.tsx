"use client";

import { useEffect, useState, useMemo, type FormEvent } from "react";
import { toast } from "sonner";
import {
  DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable,
} from "@dnd-kit/core";
import { Plus, Trash2, UserPlus, Mail, Phone, Star, Loader2, GripVertical } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { PageHeader, StatCard, ModalShell, EmptyState } from "../shared";
import { ConfirmDialog } from "../confirm-dialog";
import { normalizeCandidateList, type NormalCandidate } from "../api-helpers";
import { cn } from "@/lib/utils";

const DEPARTMENTS = ["Production", "Quality Control", "Maintenance", "Logistics", "Administration", "Sales"];
const STATUSES = [
  { id: "applied", color: "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300" },
  { id: "screening", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" },
  { id: "interview", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  { id: "offered", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
  { id: "hired", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { id: "rejected", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
];

function DraggableCard({ candidate, onDelete }: { candidate: NormalCandidate; onDelete: (id: string) => void }) {
  const { t } = useLanguage();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: candidate.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={cn(
        "group relative rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "opacity-50 ring-2 ring-foreground/40",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          className="mt-0.5 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground"
          aria-label="Drag"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{candidate.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{candidate.position}</p>
        </div>
        <button
          onClick={() => onDelete(candidate.id)}
          className="opacity-0 transition-opacity group-hover:opacity-100 grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
          aria-label={t("dash.delete")}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
        {candidate.email && <p className="flex items-center gap-1 truncate"><Mail className="h-3 w-3 shrink-0" /> {candidate.email}</p>}
        {candidate.phone && <p className="flex items-center gap-1 truncate"><Phone className="h-3 w-3 shrink-0" /> {candidate.phone}</p>}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn("h-3 w-3", i < candidate.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
          ))}
        </div>
        {candidate.department && <span className="text-[10px] text-muted-foreground">{candidate.department}</span>}
      </div>
    </div>
  );
}

function Column({ status, candidates, onDelete }: { status: { id: string; color: string }; candidates: NormalCandidate[]; onDelete: (id: string) => void }) {
  const { t } = useLanguage();
  const { setNodeRef, isOver } = useDroppable({ id: status.id });
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className={cn("mb-2 flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-bold", status.color)}>
        <span>{t(`rec.${status.id}`)}</span>
        <span className="rounded-full bg-white/50 px-1.5 text-[10px] dark:bg-black/20">{candidates.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "tanoor-scroll flex-1 space-y-2 overflow-y-auto rounded-xl border border-border bg-muted/20 p-2 transition-colors min-h-[300px]",
          isOver && "border-foreground/40 bg-foreground/5",
        )}
      >
        {candidates.length === 0 ? (
          <div className="grid h-24 place-items-center text-xs text-muted-foreground">—</div>
        ) : (
          candidates.map((c) => <DraggableCard key={c.id} candidate={c} onDelete={onDelete} />)
        )}
      </div>
    </div>
  );
}

export function RecruitmentPage() {
  const { t } = useLanguage();
  const [list, setList] = useState<NormalCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/recruitment");
      const d = await res.json();
      if (d.ok) setList(normalizeCandidateList(d.data));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const newStatus = String(over.id);
    const candidate = list.find((c) => c.id === active.id);
    if (!candidate || candidate.status === newStatus) return;
    // Optimistic
    setList((l) => l.map((c) => c.id === candidate.id ? { ...c, status: newStatus } : c));
    try {
      const res = await fetch(`/api/recruitment/${candidate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        toast.error("Update failed — reverting");
        load();
      }
    } catch {
      load();
    }
  }

  async function handleDelete(id: string) {
    setDeleteId(id);
  }

  const stats = useMemo(() => ({
    total: list.length,
    inPipeline: list.filter((c) => ["applied", "screening", "interview", "offered"].includes(c.status)).length,
    interviewing: list.filter((c) => c.status === "interview").length,
    offered: list.filter((c) => c.status === "offered").length,
  }), [list]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("rec.title")}
        subtitle={t("rec.subtitle")}
        actions={
          <button onClick={() => setModalOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-semibold text-background hover:bg-foreground/90">
            <Plus className="h-3.5 w-3.5" /> {t("rec.add")}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title={t("rec.total")} value={stats.total} icon={<UserPlus className="h-4 w-4" />} accent="blue" />
        <StatCard title={t("rec.inPipeline")} value={stats.inPipeline} icon={<UserPlus className="h-4 w-4" />} accent="gold" />
        <StatCard title={t("rec.interviewing")} value={stats.interviewing} icon={<UserPlus className="h-4 w-4" />} accent="green" />
        <StatCard title={t("rec.offeredCount")} value={stats.offered} icon={<UserPlus className="h-4 w-4" />} accent="blue" />
      </div>

      {loading ? (
        <div className="grid gap-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={<UserPlus className="h-6 w-6" />} title={t("dash.noData")} description={t("dash.noDataDesc")} />
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="tanoor-scroll grid grid-cols-2 gap-3 overflow-x-auto pb-2 lg:grid-cols-6">
            {STATUSES.map((s) => (
              <Column key={s.id} status={s} candidates={list.filter((c) => c.status === s.id)} onDelete={handleDelete} />
            ))}
          </div>
        </DndContext>
      )}

      {modalOpen && <AddModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); load(); }} />}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await fetch(`/api/recruitment/${deleteId}`, { method: "DELETE" });
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

function AddModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", position: "", department: "Production",
    source: "", experience: 0, status: "applied", rating: 3, expectedSalary: 0, notes: "",
  });
  const [saving, setSaving] = useState(false);

  function set(k: string, v: any) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.position) { toast.error("Fill required fields"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/recruitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    <ModalShell open={open} onClose={onClose} title={t("rec.add")} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("emp.name")} *</label>
            <input className={inputCls} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("rec.position")} *</label>
            <input className={inputCls} value={form.position} onChange={(e) => set("position", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("emp.email")}</label>
            <input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("emp.phone")}</label>
            <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("emp.dept")}</label>
            <select className={inputCls} value={form.department} onChange={(e) => set("department", e.target.value)}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("rec.source")}</label>
            <input className={inputCls} value={form.source} onChange={(e) => set("source", e.target.value)} placeholder="LinkedIn, Referral…" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("rec.experience")}</label>
            <input type="number" className={inputCls} value={form.experience} onChange={(e) => set("experience", Number(e.target.value))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("rec.expectedSalary")}</label>
            <input type="number" className={inputCls} value={form.expectedSalary} onChange={(e) => set("expectedSalary", Number(e.target.value))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("dash.status")}</label>
            <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map((s) => <option key={s.id} value={s.id}>{t(`rec.${s.id}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("rec.rating")}</label>
            <select className={inputCls} value={form.rating} onChange={(e) => set("rating", Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} ★</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("leave.reason")}</label>
          <textarea rows={2} className="tanoor-input w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted">{t("dash.cancel")}</button>
          <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("dash.save")}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
