"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Phone, Mail, MapPin, Calendar, Briefcase, Wallet, FileText, CalendarCheck,
  CalendarDays, Target, User, ShieldCheck, Award, Banknote, BookUser, Clock,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useDashStore } from "./dash-store";
import { StatusBadge, EmptyState } from "./shared";
import { ease } from "./shared";
import { formatSAR } from "./api-helpers";
import { cn } from "@/lib/utils";

type Tab = "profile" | "employment" | "documents" | "attendance" | "leave" | "payroll" | "kpis";

export function EmployeeDetail({ id }: { id: string }) {
  const { t, dir } = useLanguage();
  const { setEmployeeDetailId } = useDashStore();
  const [tab, setTab] = useState<Tab>("profile");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/employees/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setData(d.data); })
      .finally(() => setLoading(false));
  }, [id]);

  function close() { setEmployeeDetailId(null); }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "profile", label: t("det.profile"), icon: User },
    { id: "employment", label: t("det.employment"), icon: Briefcase },
    { id: "documents", label: t("det.documents"), icon: FileText },
    { id: "attendance", label: t("det.attendance"), icon: CalendarCheck },
    { id: "leave", label: t("det.leave"), icon: CalendarDays },
    { id: "payroll", label: t("det.payroll"), icon: Wallet },
    { id: "kpis", label: t("det.kpis"), icon: Target },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        dir={dir}
        onClick={close}
      >
        <motion.div
          initial={{ x: dir === "rtl" ? "-100%" : "100%" }}
          animate={{ x: 0 }}
          exit={{ x: dir === "rtl" ? "-100%" : "100%" }}
          transition={{ duration: 0.35, ease }}
          onClick={(e) => e.stopPropagation()}
          className="modal-shell absolute inset-y-0 end-0 flex w-full max-w-3xl flex-col bg-card shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-[var(--color-brand-deep)] to-[var(--color-brand-light)] px-5 py-4 text-white">
            <div className="flex min-w-0 items-center gap-3">
              {data?.profilePhoto ? (
                <img src={data.profilePhoto} alt={data.fullName} className="h-12 w-12 rounded-full border-2 border-white/30 object-cover" />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-white/30 bg-white/15 text-lg font-bold">
                  {data?.fullName?.charAt(0) || "?"}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold">{data?.fullName || "…"}</h2>
                <p className="truncate text-xs text-white/70">{data?.empNo} · {data?.jobTitle}</p>
              </div>
            </div>
            <button onClick={close} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/80 hover:bg-white/15 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="tanoor-scroll flex overflow-x-auto border-b border-border bg-card">
            {tabs.map((tabItem) => {
              const Icon = tabItem.icon;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => setTab(tabItem.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-medium transition-colors",
                    tab === tabItem.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tabItem.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="tanoor-scroll flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}
              </div>
            ) : !data ? (
              <EmptyState title={t("det.noRecords")} />
            ) : (
              <>
                {tab === "profile" && <ProfileTab data={data} />}
                {tab === "employment" && <EmploymentTab data={data} />}
                {tab === "documents" && <DocumentsTab data={data} />}
                {tab === "attendance" && <AttendanceTab data={data} />}
                {tab === "leave" && <LeaveTab data={data} />}
                {tab === "payroll" && <PayrollTab data={data} />}
                {tab === "kpis" && <KpisTab data={data} />}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: React.ReactNode }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="rounded-xl border border-border bg-muted/20 p-3">{children}</div>
    </div>
  );
}

function ProfileTab({ data }: { data: any }) {
  const { t } = useLanguage();
  return (
    <div>
      <Section title={t("det.personalInfo")}>
        <div className="grid gap-2 sm:grid-cols-2">
          <InfoRow icon={User} label={t("emp.nameAr")} value={data.fullNameAr} />
          <InfoRow icon={ShieldCheck} label={t("emp.nationality")} value={data.nationality} />
          <InfoRow icon={User} label={t("emp.gender")} value={data.gender === "male" ? t("emp.male") : t("emp.female")} />
          <InfoRow icon={Calendar} label={t("emp.dob")} value={data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : null} />
          <InfoRow icon={BookUser} label={t("emp.marital")} value={data.maritalStatus} />
        </div>
      </Section>
      <Section title={t("det.contactInfo")}>
        <div className="grid gap-2 sm:grid-cols-2">
          <InfoRow icon={Phone} label={t("emp.phone")} value={data.phone} />
          <InfoRow icon={Mail} label={t("emp.email")} value={data.email} />
          <InfoRow icon={MapPin} label={t("emp.address")} value={data.address} />
          <InfoRow icon={Phone} label={t("emp.emergency")} value={data.emergencyContact} />
        </div>
      </Section>
      <Section title={t("det.legalDocs")}>
        <div className="grid gap-2 sm:grid-cols-2">
          <InfoRow icon={ShieldCheck} label={t("emp.iqamaNo")} value={data.iqamaNo} />
          <InfoRow icon={Calendar} label={t("emp.iqamaExpiry")} value={data.iqamaExpiry ? new Date(data.iqamaExpiry).toLocaleDateString() : null} />
          <InfoRow icon={FileText} label={t("emp.passportNo")} value={data.passportNo} />
          <InfoRow icon={Calendar} label={t("emp.passportExpiry")} value={data.passportExpiry ? new Date(data.passportExpiry).toLocaleDateString() : null} />
          <InfoRow icon={ShieldCheck} label={t("emp.visa")} value={data.visaType} />
        </div>
      </Section>
      {data.notes && (
        <Section title={t("emp.notes")}>
          <p className="text-sm text-foreground whitespace-pre-line">{data.notes}</p>
        </Section>
      )}
    </div>
  );
}

function EmploymentTab({ data }: { data: any }) {
  const { t } = useLanguage();
  return (
    <div>
      <Section title={t("det.employmentInfo")}>
        <div className="grid gap-2 sm:grid-cols-2">
          <InfoRow icon={Briefcase} label={t("emp.job")} value={data.jobTitle} />
          <InfoRow icon={Briefcase} label={t("emp.dept")} value={data.department} />
          <InfoRow icon={BookUser} label={t("emp.employmentType")} value={data.employmentType === "full_time" ? t("emp.fullTime") : t("emp.partTime")} />
          <InfoRow icon={Calendar} label={t("emp.hireDate")} value={new Date(data.hireDate).toLocaleDateString()} />
          <InfoRow icon={Calendar} label={t("emp.contractEnd")} value={data.contractEnd ? new Date(data.contractEnd).toLocaleDateString() : "—"} />
          <InfoRow icon={ShieldCheck} label={t("dash.status")} value={<StatusBadge status={data.status} />} />
        </div>
      </Section>
      <Section title={t("det.financialInfo")}>
        <div className="grid gap-2 sm:grid-cols-2">
          <InfoRow icon={Wallet} label={t("emp.basicSalary")} value={formatSAR(data.basicSalary)} />
          <InfoRow icon={Wallet} label={t("emp.allowances")} value={formatSAR(data.allowances)} />
          <InfoRow icon={Award} label={t("det.totalSalary")} value={formatSAR(data.basicSalary + data.allowances)} />
          <InfoRow icon={Banknote} label={t("emp.bank")} value={data.bankAccount} />
          <InfoRow icon={Banknote} label={t("emp.iban")} value={data.iban} />
        </div>
      </Section>
    </div>
  );
}

function DocumentsTab({ data }: { data: any }) {
  const { t } = useLanguage();
  const docs = data.documents || [];
  if (docs.length === 0) return <EmptyState icon={<FileText className="h-6 w-6" />} title={t("det.noRecords")} />;
  return (
    <div className="space-y-2">
      {docs.map((d: any) => (
        <div key={d.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{d.title}</p>
            <p className="truncate text-xs text-muted-foreground">{d.type} · {d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : "—"}</p>
          </div>
          <StatusBadge status={d.status} />
        </div>
      ))}
    </div>
  );
}

function AttendanceTab({ data }: { data: any }) {
  const { t } = useLanguage();
  const att = data.attendance || [];
  if (att.length === 0) return <EmptyState icon={<CalendarCheck className="h-6 w-6" />} title={t("det.noRecords")} />;
  return (
    <div className="space-y-2">
      {att.slice(0, 20).map((a: any) => (
        <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{new Date(a.date).toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">{a.checkIn ? `In: ${new Date(a.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "—"} · {a.checkOut ? `Out: ${new Date(a.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{a.workHours}h</span>
            <StatusBadge status={a.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function LeaveTab({ data }: { data: any }) {
  const { t } = useLanguage();
  const leaves = data.leaves || [];
  if (leaves.length === 0) return <EmptyState icon={<CalendarDays className="h-6 w-6" />} title={t("det.noRecords")} />;
  return (
    <div className="space-y-2">
      {leaves.map((l: any) => (
        <div key={l.id} className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t(`leave.${l.type}`)} · {l.days} {t("det.days")}</p>
            <StatusBadge status={l.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}</p>
          {l.reason && <p className="mt-1 text-xs text-muted-foreground">{l.reason}</p>}
        </div>
      ))}
    </div>
  );
}

function PayrollTab({ data }: { data: any }) {
  const { t } = useLanguage();
  const pays = data.payrolls || [];
  if (pays.length === 0) return <EmptyState icon={<Wallet className="h-6 w-6" />} title={t("det.noRecords")} />;
  return (
    <div className="space-y-2">
      {pays.map((p: any) => (
        <div key={p.id} className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm font-medium">{p.month}</p>
            <span className="font-bold text-foreground">{formatSAR(p.netSalary)}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>{t("pay.basic")}: {formatSAR(p.basicSalary)}</span>
            <span>{t("pay.allowances")}: {formatSAR(p.allowances)}</span>
            <span>{t("pay.gosi")}: {formatSAR(p.gosi)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function KpisTab({ data }: { data: any }) {
  const { t } = useLanguage();
  const kpis = data.kpis || [];
  if (kpis.length === 0) return <EmptyState icon={<Target className="h-6 w-6" />} title={t("det.noRecords")} />;
  return (
    <div className="space-y-2">
      {kpis.map((k: any) => {
        const color = k.finalScore >= 85 ? "#10b981" : k.finalScore >= 75 ? "#3b82f6" : k.finalScore >= 70 ? "#f59e0b" : "#ef4444";
        return (
          <div key={k.id} className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm font-medium">{k.period}</p>
              <span className="font-bold" style={{ color }}>{k.finalScore}</span>
            </div>
            <div className="mt-2 grid grid-cols-5 gap-1 text-center text-[10px]">
              {[
                { k: "productivity", v: k.productivity },
                { k: "quality", v: k.quality },
                { k: "teamwork", v: k.teamwork },
                { k: "punctuality", v: k.punctuality },
                { k: "initiative", v: k.initiative },
              ].map((m) => (
                <div key={m.k}>
                  <p className="font-semibold text-foreground">{m.v}</p>
                  <p className="text-muted-foreground">{t(`kpi.${m.k}`).slice(0, 4)}</p>
                </div>
              ))}
            </div>
            {k.comments && <p className="mt-2 text-xs text-muted-foreground">{k.comments}</p>}
          </div>
        );
      })}
    </div>
  );
}
