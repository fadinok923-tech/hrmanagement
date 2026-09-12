"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import { useDashStore } from "./dash-store";
import { Sidebar } from "./sidebar";
import { DashFooter } from "./footer";
import { AiAssistant } from "./ai-assistant";
import { EmployeeDetail } from "./employee-detail";
import { CompanyPage } from "./pages/company";
import { EmployeesPage } from "./pages/employees";
import { AttendancePage } from "./pages/attendance";
import { LeavePage } from "./pages/leave";
import { PayrollPage } from "./pages/payroll";
import { DocumentsPage } from "./pages/documents";
import { RecruitmentPage } from "./pages/recruitment";
import { KpiPage } from "./pages/kpi";
import { ReportsPage } from "./pages/reports";
import { Menu } from "lucide-react";

export function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { t, locale } = useLanguage();
  const { page, employeeDetailId } = useDashStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on page change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [page]);

  return (
    <div className="hr-app min-h-screen bg-background text-foreground">
      <Sidebar onLogout={onLogout} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="lg:ps-64">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur">
          <button
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center lg:hidden rounded-lg border border-border text-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-medium text-muted-foreground">{t("brand.name")} <span className="mx-2 text-border">/</span> {locale === "ar" ? "إدارة الأفراد" : "People & Operations"}</p>
          <div className="w-9" />
        </div>

        <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[1600px] flex-col px-4 py-6 sm:px-8 sm:py-8 xl:px-10">
          <div className="flex-1">
            {page === "company" && <CompanyPage />}
            {page === "employees" && <EmployeesPage />}
            {page === "attendance" && <AttendancePage />}
            {page === "leave" && <LeavePage />}
            {page === "payroll" && <PayrollPage />}
            {page === "documents" && <DocumentsPage />}
            {page === "recruitment" && <RecruitmentPage />}
            {page === "kpi" && <KpiPage />}
            {page === "reports" && <ReportsPage />}
          </div>
          <DashFooter />
        </main>
      </div>

      <AiAssistant />
      {employeeDetailId && <EmployeeDetail id={employeeDetailId} />}
    </div>
  );
}
