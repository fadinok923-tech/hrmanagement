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
  const { t } = useLanguage();
  const { page, employeeDetailId } = useDashStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on page change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [page]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar onLogout={onLogout} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="lg:ps-72">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold">{t("brand.name")}</p>
          <div className="w-9" />
        </div>

        <main className="flex min-h-screen flex-col px-4 py-5 sm:px-6 sm:py-6">
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
