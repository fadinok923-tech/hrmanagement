"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, Users, UserCheck, Wallet, CalendarClock, FileText, RefreshCw, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useDashStore, type DashPage } from "../dash-store";
import { type NormalReport } from "../api-helpers";

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";
const surface = "rounded-2xl border border-border bg-card p-5 sm:p-6";
const colors = ["bg-blue-700", "bg-blue-500", "bg-teal-500", "bg-amber-500", "bg-violet-500"];

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <section className={surface}><h2 className="text-base font-semibold tracking-tight">{title}</h2>{subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}<div className="mt-5">{children}</div></section>;
}

export function CompanyPage() {
  const { t, locale } = useLanguage();
  const setPage = useDashStore((s) => s.setPage);
  const ar = locale === "ar";
  const copy = (en: string, arabic: string) => ar ? arabic : en;
  const number = (n: number) => new Intl.NumberFormat(ar ? "ar-SA" : "en-US", { maximumFractionDigits: 1 }).format(n);
  const money = (n: number) => new Intl.NumberFormat(ar ? "ar-SA" : "en-US", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n);
  const [data, setData] = useState<NormalReport | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);
    async function load() {
      try {
        const response = await fetch("/api/reports", { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.ok || !result.data?.overview || !result.data?.documents) throw new Error("Report unavailable");
        if (active) { setData(result.data); setState("ready"); }
      } catch {
        if (active) setState("error");
      } finally { clearTimeout(timeout); }
    }
    void load();
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [attempt]);

  const retry = () => { setState("loading"); setAttempt((n) => n + 1); };
  const actions: { label: string; page: DashPage }[] = [
    { label: copy("Manage employees", "إدارة الموظفين"), page: "employees" },
    { label: copy("Review leave", "مراجعة الإجازات"), page: "leave" },
    { label: copy("Open payroll", "فتح الرواتب"), page: "payroll" },
  ];

  return <div className="mx-auto max-w-[1440px] space-y-6 pb-6 text-foreground" dir={ar ? "rtl" : "ltr"}>
    <header className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-300">{copy("WORKFORCE / OVERVIEW", "القوى العاملة / نظرة عامة")}</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("company.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{copy("Your people, priorities and workforce insights in one place.", "موظفوك وأولوياتك ومؤشرات القوى العاملة في مكان واحد.")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, i) => <button key={action.page} onClick={() => setPage(action.page)} className={focus + " inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors " + (i === 0 ? "bg-blue-800 text-white hover:bg-blue-700" : "border border-border bg-card hover:bg-muted")}>{action.label}<ArrowUpRight aria-hidden="true" className="h-4 w-4 rtl:-scale-x-100" /></button>)}
      </div>
    </header>

    {state === "loading" ? <div role="status" aria-live="polite" className="space-y-5"><span className="sr-only">{copy("Loading overview", "جارٍ تحميل النظرة العامة")}</span><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0,1,2,3].map((n) => <div key={n} className="h-36 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />)}</div><div className="h-64 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" /></div>
    : state === "error" || !data ? <div role="alert" className={surface}><h2 className="font-semibold">{copy("We couldn’t load the overview", "تعذر تحميل النظرة العامة")}</h2><p className="mt-2 text-sm text-muted-foreground">{copy("Your records have not changed. Try loading the report again.", "لم تتغير سجلاتك. حاول تحميل التقرير مرة أخرى.")}</p><button onClick={retry} className={focus + " mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-800 px-4 text-sm font-semibold text-white"}><RefreshCw className="h-4 w-4" aria-hidden="true" />{copy("Try again", "إعادة المحاولة")}</button></div>
    : renderOverview(data)}
  </div>;

  function renderOverview(report: NormalReport) {
    const o = report.overview;
    const metrics = [
      { label: t("company.totalEmployees"), value: number(o.totalEmployees), detail: number(o.activeCount) + " " + copy("active employees", "موظف نشط"), icon: Users, page: "employees" as DashPage },
      { label: t("company.saudization"), value: number(o.saudizationRate) + "%", detail: number(o.saudiCount) + " " + copy("Saudi nationals", "موظف سعودي"), icon: UserCheck, page: "reports" as DashPage },
      { label: copy("Monthly salary budget", "ميزانية الرواتب الشهرية"), value: money(o.totalMonthlySalary), detail: copy("Basic salaries + allowances", "الرواتب الأساسية + البدلات"), icon: Wallet, page: "payroll" as DashPage },
      { label: t("company.pendingLeaves"), value: number(o.pendingLeaves), detail: copy("Requests awaiting a decision", "طلبات بانتظار القرار"), icon: CalendarClock, page: "leave" as DashPage },
    ];
    const attention: { label: string; description: string; count: number; page: DashPage }[] = [
      { label: copy("Leave approvals", "الموافقة على الإجازات"), description: copy("Review pending requests", "مراجعة الطلبات المعلقة"), count: o.pendingLeaves, page: "leave" },
      { label: copy("Expired documents", "مستندات منتهية الصلاحية"), description: copy("Check documents that need renewal", "مراجعة المستندات التي تحتاج إلى تجديد"), count: report.documents.expired, page: "documents" },
      { label: copy("Expiring within 30 days", "تنتهي خلال ٣٠ يومًا"), description: copy("Plan upcoming renewals", "التخطيط للتجديدات القادمة"), count: report.documents.expiring, page: "documents" },
    ];
    const departments = Object.entries(report.byDepartment).sort((a,b) => b[1]-a[1]);
    const visas = Object.entries(report.byVisa).sort((a,b) => b[1]-a[1]);
    const salaries = Object.entries(report.deptSalary).map(([name,v]) => ({name, value: v.count ? v.total/v.count : 0})).sort((a,b) => b.value-a.value);
    const months = Object.entries(report.payrollByMonth).sort(([a],[b]) => a.localeCompare(b)).slice(-6);
    const maxPayroll = Math.max(1, ...months.map(([,v]) => v.total));
    const empty = <p className="py-5 text-sm text-muted-foreground">{copy("No records yet. Add records to see this breakdown.", "لا توجد سجلات بعد. أضف سجلات لعرض هذا التوزيع.")}</p>;
    return <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({label,value,detail,icon: Icon,page}) => <button key={label} onClick={() => setPage(page)} className={focus + " " + surface + " group text-start transition-colors hover:border-blue-400"}>
          <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-muted-foreground">{label}</span><span className="rounded-xl bg-blue-50 p-2.5 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Icon className="h-5 w-5" aria-hidden="true" /></span></div>
          <p className="mt-4 break-words text-2xl font-bold tracking-tight tabular-nums">{value}</p><p className="mt-2 text-sm text-muted-foreground">{detail}</p>
        </button>)}
      </div>
      <section className={surface}>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">{copy("Needs attention", "بحاجة إلى متابعة")}</h2><p className="mt-1 text-sm text-muted-foreground">{copy("The next steps for your HR team.", "الخطوات التالية لفريق الموارد البشرية.")}</p></div>
          {attention.every((a) => a.count === 0) && <span className="inline-flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{copy("No pending items in these categories", "لا توجد عناصر معلقة في هذه الفئات")}</span>}
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">{attention.map((item) => <button key={item.label} onClick={() => setPage(item.page)} className={focus + " flex min-h-24 items-center gap-4 rounded-xl border border-border p-4 text-start transition-colors hover:bg-muted"}>
          <span className={"grid h-12 w-12 shrink-0 place-items-center rounded-xl text-xl font-bold tabular-nums " + (item.count ? "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : "bg-muted text-muted-foreground")}>{number(item.count)}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.label}</span><span className="mt-1 block text-sm text-muted-foreground">{item.description}</span></span><ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden="true" />
        </button>)}</div>
      </section>
      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Section title={t("company.byDept")} subtitle={copy("Headcount, ranked by department", "عدد الموظفين حسب القسم")}>
          {departments.length ? <ul className="space-y-4">{departments.map(([name,value],i) => <li key={name}><div className="mb-2 flex justify-between gap-4 text-sm"><span className="break-words font-medium">{name}</span><span className="shrink-0 tabular-nums">{number(value)} <span className="text-muted-foreground">· {number(o.totalEmployees ? value/o.totalEmployees*100 : 0)}%</span></span></div><div aria-hidden="true" className="h-2 rounded-full bg-muted"><div className={"h-full rounded-full " + colors[i%colors.length]} style={{width: (o.totalEmployees ? value/o.totalEmployees*100 : 0) + "%"}} /></div></li>)}</ul> : empty}
        </Section>
        <div className="space-y-5">
          <Section title={t("company.byVisa")} subtitle={copy("Employee records by visa classification", "سجلات الموظفين حسب تصنيف التأشيرة")}>
            {visas.length ? <ul className="divide-y divide-border">{visas.map(([name,value],i) => <li key={name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span aria-hidden="true" className={"h-2.5 w-2.5 shrink-0 rounded-full " + colors[i%colors.length]} /><span className="flex-1 break-words text-sm font-medium">{name}</span><span className="text-base font-semibold tabular-nums">{number(value)}</span></li>)}</ul> : empty}
          </Section>
          <Section title={copy("Document centre", "مركز المستندات")} subtitle={copy("Keep employee records up to date.", "حافظ على تحديث سجلات الموظفين.")}>
            <div className="flex items-center gap-4"><span className="rounded-xl bg-blue-50 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><FileText className="h-6 w-6" aria-hidden="true" /></span><div><p className="text-2xl font-bold tabular-nums">{number(report.documents.total)}</p><p className="text-sm text-muted-foreground">{copy("Documents on file", "مستندات محفوظة")}</p></div></div>
            <button onClick={() => setPage("documents")} className={focus + " mt-5 flex min-h-11 w-full items-center justify-between rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted"}>{copy("View documents", "عرض المستندات")}<ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" /></button>
          </Section>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Section title={copy("Payroll history", "سجل الرواتب")} subtitle={copy("Recorded payroll totals · up to 6 latest months", "إجمالي الرواتب المسجلة · آخر ٦ أشهر متاحة")}>
          {months.length ? <ul className="space-y-4">{months.map(([month,v]) => <li key={month}><div className="mb-2 flex flex-wrap justify-between gap-2 text-sm"><span className="font-medium" dir="ltr">{month}</span><span className="font-semibold tabular-nums">{money(v.total)}</span></div><div aria-hidden="true" className="h-3 rounded-full bg-muted"><div className="h-full rounded-full bg-blue-600" style={{width: Math.max(0,v.total)/maxPayroll*100 + "%"}} /></div></li>)}</ul> : empty}
        </Section>
        <Section title={t("company.deptSalary")} subtitle={copy("Average basic salary + allowances", "متوسط الراتب الأساسي + البدلات")}>
          {salaries.length ? <ul className="divide-y divide-border">{salaries.map(({name,value}) => <li key={name} className="flex flex-wrap justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"><span className="font-medium">{name}</span><span className="tabular-nums text-muted-foreground">{money(value)}</span></li>)}</ul> : empty}
        </Section>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 px-5 py-4 text-sm"><p className="text-muted-foreground">{copy("Explore attendance, recruitment and performance in Reports.", "استكشف الحضور والتوظيف والأداء في التقارير.")}</p><button onClick={() => setPage("reports")} className={focus + " inline-flex min-h-11 items-center gap-2 rounded-lg px-2 font-semibold text-blue-700 dark:text-blue-300"}>{copy("View reports", "عرض التقارير")}<ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" /></button></div>
    </>;
  }
}
