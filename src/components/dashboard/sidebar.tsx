"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/language-provider";
import { useDashStore, type DashPage } from "./dash-store";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  Wallet,
  FileText,
  UserPlus,
  Target,
  BarChart3,
  Moon,
  Sun,
  Globe,
  LogOut,
  ChevronLeft,
} from "lucide-react";

interface NavItem {
  id: DashPage;
  labelKey: string;
  icon: typeof Users;
  group: "hr" | "ops" | "system";
}

const NAV: NavItem[] = [
  { id: "company", labelKey: "nav.company", icon: LayoutDashboard, group: "hr" },
  { id: "employees", labelKey: "nav.employees", icon: Users, group: "hr" },
  { id: "attendance", labelKey: "nav.attendance", icon: CalendarCheck, group: "ops" },
  { id: "leave", labelKey: "nav.leave", icon: CalendarDays, group: "ops" },
  { id: "payroll", labelKey: "nav.payroll", icon: Wallet, group: "ops" },
  { id: "documents", labelKey: "nav.documents", icon: FileText, group: "hr" },
  { id: "recruitment", labelKey: "nav.recruitment", icon: UserPlus, group: "hr" },
  { id: "kpi", labelKey: "nav.kpi", icon: Target, group: "ops" },
  { id: "reports", labelKey: "nav.reports", icon: BarChart3, group: "system" },
];

export function Sidebar({ onLogout, mobileOpen, onMobileClose }: { onLogout: () => void; mobileOpen: boolean; onMobileClose: () => void }) {
  const { t, dir, toggle, locale } = useLanguage();
  const { page, setPage } = useDashStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const groups = [
    { id: "hr", labelKey: "nav.group.hr" },
    { id: "ops", labelKey: "nav.group.ops" },
    { id: "system", labelKey: "nav.group.system" },
  ] as const;

  const Arrow = dir === "rtl" ? ChevronLeft : ChevronLeft;

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onMobileClose} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex w-72 flex-col border-e border-border bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0",
          dir === "rtl" ? "end-0" : "start-0",
          mobileOpen ? "translate-x-0" : dir === "rtl" ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4">
          <Logo className="h-9 w-9 rounded-xl shadow" />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-bold text-sidebar-foreground">{t("brand.name")}</div>
            <div className="truncate text-[11px] text-sidebar-foreground/60">{t("brand.badge")}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="tanoor-scroll flex-1 overflow-y-auto px-3 py-4">
          {groups.map((g) => {
            const items = NAV.filter((n) => n.group === g.id);
            if (items.length === 0) return null;
            return (
              <div key={g.id} className="mb-5">
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">{t(g.labelKey)}</p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = page === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setPage(item.id); onMobileClose(); }}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", active ? "" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground")} />
                        <span className="truncate">{t(item.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom: language + theme + user */}
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 flex items-center gap-2">
            <button
              onClick={toggle}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-3 text-xs font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent"
            >
              <Globe className="h-3.5 w-3.5" />
              {locale === "en" ? t("lang.toggle") : t("lang.toggle.en")}
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="grid h-9 w-9 place-items-center rounded-lg border border-sidebar-border bg-sidebar-accent/30 text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent"
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-3 py-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--color-brand-deep)] to-[var(--color-brand-light)] text-xs font-bold text-white">
              A
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-xs font-semibold text-sidebar-foreground">System Administrator</div>
              <div className="truncate text-[10px] text-sidebar-foreground/50">admin@tanoor.sa</div>
            </div>
            <button
              onClick={onLogout}
              className="grid h-8 w-8 place-items-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-red-500/10 hover:text-red-500"
              aria-label={t("nav.signout")}
              title={t("nav.signout")}
            >
              <LogOut className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
