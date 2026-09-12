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
  X,
} from "lucide-react";

interface NavItem {
  id: DashPage;
  labelKey: string;
  icon: typeof Users;
}

const NAV: NavItem[] = [
  { id: "company", labelKey: "nav.company", icon: LayoutDashboard },
  { id: "employees", labelKey: "nav.employees", icon: Users },
  { id: "attendance", labelKey: "nav.attendance", icon: CalendarCheck },
  { id: "leave", labelKey: "nav.leave", icon: CalendarDays },
  { id: "payroll", labelKey: "nav.payroll", icon: Wallet },
  { id: "documents", labelKey: "nav.documents", icon: FileText },
  { id: "recruitment", labelKey: "nav.recruitment", icon: UserPlus },
  { id: "kpi", labelKey: "nav.kpi", icon: Target },
  { id: "reports", labelKey: "nav.reports", icon: BarChart3 },
];

export function Sidebar({ onLogout, mobileOpen, onMobileClose }: { onLogout: () => void; mobileOpen: boolean; onMobileClose: () => void }) {
  const { t, dir, toggle, locale } = useLanguage();
  const { page, setPage } = useDashStore();
  const { resolvedTheme: theme, setTheme } = useTheme();
  const [user, setUser] = useState<{ name?: string; email?: string }>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Use a microtask to avoid cascading render warning
    Promise.resolve().then(() => {
      setMounted(true);
      try { setUser(JSON.parse(sessionStorage.getItem("tanoor-session") || "{}").user || {}); } catch {}
    });
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onMobileClose} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex w-64 flex-col border-e border-border bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0",
          "start-0",
          mobileOpen ? "translate-x-0" : dir === "rtl" ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <Logo className="h-9 w-9 rounded-xl" />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-bold">{t("brand.name")}</div>
            <div className="truncate text-xs text-muted-foreground">{t("brand.badge")}</div>
          </div>
        </div>

        <button onClick={onMobileClose} aria-label={locale === "ar" ? "إغلاق القائمة" : "Close menu"} className="mx-3 mt-3 flex min-h-11 items-center justify-center rounded-xl border border-border lg:hidden"><X className="h-4 w-4" /></button>
        {/* Navigation */}
        <nav className="tanoor-scroll flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = page === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setPage(item.id); onMobileClose(); }}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="truncate">{t(item.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom: language + theme + user */}
        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center gap-2">
            <button
              onClick={toggle}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Globe className="h-3.5 w-3.5" />
              {locale === "en" ? "العربية" : "English"}
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted"
              aria-label={locale === "ar" ? "تبديل المظهر" : "Toggle theme"}
            >
              {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {user.name?.charAt(0) || "T"}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-xs font-semibold">{user.name || (locale === "ar" ? "حساب المستخدم" : "Your account")}</div>
              <div className="truncate text-xs text-muted-foreground">{user.email || t("brand.badge")}</div>
            </div>
            <button
              onClick={onLogout}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-400"
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
