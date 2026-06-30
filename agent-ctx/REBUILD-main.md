# Task REBUILD — main agent work record

## Task
Complete rebuild of the Tanoor Al Jazeera HR System — Prisma schema, all API routes, the entire dashboard with 9 pages, employee-detail overlay, AI assistant, i18n extensions, and error boundary. Database seeded and lint clean.

## What was created

### 1. Database layer
- `prisma/schema.prisma` — 9 models: `User`, `Employee`, `Attendance`, `Leave`, `Payroll`, `Document`, `Candidate`, `Kpi`, `File`. SQLite provider, `env("DATABASE_URL")`. Employee includes all requested fields: `passportNo`, `address`, `emergencyContact`, `profilePhoto`, `iqamaPhoto`, `passportPhoto`, `avatarColor`.
- `prisma/seed.ts` — Seeds: 2 users (`admin/tanoor2025` + `hr/hr2025` hashed with bcrypt), 12 employees (6 Saudi + 6 Indian, 6 departments), 7 days of attendance (~65 records), 8 leave requests, payroll for 3 months (GOSI: Saudi 9.75% / expat 2%), 30 documents (iqama/passport/contract with varying expiry), 5 candidates, 8 KPIs.

### 2. API routes (all under `src/app/api/`)
- `auth/login/route.ts` — replaced demo creds with real DB lookup + bcrypt compare.
- `employees/route.ts` + `employees/[id]/route.ts` — GET (with search/dept/status/nationality filters + relations), POST, PUT, DELETE.
- `attendance/route.ts` — GET, POST (auto-late when checkIn after 07:30, auto work-hours), DELETE `?id=`.
- `leave/route.ts` + `leave/[id]/route.ts` — GET, POST (auto days calc), PUT (approve/reject), DELETE.
- `payroll/route.ts` + `payroll/run/route.ts` + `payroll/[id]/route.ts` — GET, POST run (idempotent, pulls overtime from month's attendance, applies correct GOSI rate by nationality), PUT, DELETE.
- `documents/route.ts` + `documents/[id]/route.ts` — GET (auto-status: valid/expiring≤30d/expired), POST, DELETE.
- `recruitment/route.ts` + `recruitment/[id]/route.ts` — GET, POST, PUT, DELETE.
- `kpis/route.ts` + `kpis/[id]/route.ts` — GET, POST (auto finalScore = avg of 5 metrics), PUT (auto finalScore recalc), DELETE.
- `reports/route.ts` — aggregated analytics (overview, attendance, byDepartment, byVisa, payrollByMonth, deptSalary, documents expiry, candidatePipeline, topPerformers).
- `upload/route.ts` — FormData upload → `public/uploads/{folder}/`, also creates `File` row.
- `ai/chat/route.ts` — uses `z-ai-web-dev-sdk`, injects real DB context (counts, saudization, salary totals, current-month payroll, expiring docs).
- `ai/extract/route.ts` — uses VLM (`createVision`) to extract Iqama / Passport details as strict JSON.

All routes use `import { db } from "@/lib/db"`, `NextResponse`, `params: Promise<{id:string}>` → `await params`, try/catch, Zod validation on POST/PUT.

### 3. Dashboard infrastructure (`src/components/dashboard/`)
- `dash-store.ts` — Zustand store: `DashPage` union (company|employees|attendance|leave|payroll|documents|recruitment|kpi|reports), `page`, `setPage`, `aiOpen`, `setAiOpen`, `employeeDetailId`, `setEmployeeDetailId`.
- `shared.tsx` — `PageHeader`, `FilterSelect` (uses NATIVE `<select>`), `EmptyState`, `StatCard`, `Panel`, `ModalShell` (uses `modal-shell` class), `StatusBadge`, `ease` constant.
- `data-table.tsx` — `Column<T>`, `DataTable<T>` with pagination (PAGE_SIZE=20), `StatusBadge` re-export.
- `confirm-dialog.tsx` — reusable `ConfirmDialog` with destructive option.
- `sidebar.tsx` — 9 nav items grouped (hr/ops/system), language toggle, dark mode toggle (Moon/Sun via next-themes), user section, sign out.
- `footer.tsx` — `DashFooter` with AI Assistant button (gold accent).
- `dashboard.tsx` — shell (sidebar + main + footer), REGULAR imports (not dynamic), wraps `AiAssistant` + `EmployeeDetail`.
- `ai-assistant.tsx` — floating chat modal, posts to `/api/ai/chat` with history, streaming loader, RTL-aware.
- `employee-detail.tsx` — 7-tab slide-in overlay (Profile, Employment, Documents, Attendance, Leave, Payroll, KPIs).
- `api-helpers.ts` — `normalizeEmployee`, `normalizeEmployeeList`, `normalizeReport`, `normalizeAttendanceList`, `normalizeLeaveList`, `normalizePayrollList`, `normalizeDocumentList`, `normalizeCandidateList`, `normalizeKpiList` + types + `formatSAR`/`formatNumber`.

### 4. Pages (`src/components/dashboard/pages/`)
- `company.tsx` — `/api/reports` fetch, 4 stat cards, 4 charts (pie dept, donut visa, bar dept salary, line payroll trend), company profile.
- `employees.tsx` — card grid + TABLE VIEW toggle, search + 3 filters, Add modal (with Iqama/Passport photo upload + AI extract buttons calling `/api/ai/extract`), Edit modal, Import CSV modal, Export (xlsx), delete with ConfirmDialog. Uses `IdCard`, `BookUser`, `Sparkles`, `Loader2`. `modal-shell` on all modals, `tanoor-input` on all inputs.
- `attendance.tsx` — DataTable + Add modal + 4 stat cards + delete.
- `leave.tsx` — DataTable + Apply modal + Approve/Reject inline actions + 3 balance cards + delete.
- `payroll.tsx` — DataTable + Run Payroll modal + Payslip modal + BarChart + 4 stat cards + delete + GOSI note.
- `documents.tsx` — DataTable + Add modal with upload + expiry alerts panel + 3 stat cards + delete.
- `recruitment.tsx` — Kanban board with `@dnd-kit/core` (PointerSensor, draggable cards, droppable columns), 6 stages, Add Candidate modal, delete on cards.
- `kpi.tsx` — DataTable + score distribution BarChart + Add/Edit modal + 4 stat cards + delete.
- `reports.tsx` — Saudization section + summary + 4 charts + Export All Employees + Export Full Report buttons.

### 5. Library files
- `src/lib/excel.ts` — `exportToExcel` + `exportMultiSheet` using `xlsx`.
- `src/components/language-provider.tsx` — extended with all dashboard i18n keys (`nav.*`, `company.*`, `emp.*`, `att.*`, `leave.*`, `pay.*`, `doc.*`, `rec.*`, `kpi.*`, `rep.*`, `footer.*`, `dash.*`, `ai.*`, `det.*`). `t()` now accepts `{var}` interpolation. ThemeProvider added to `layout.tsx`.

### 6. Error boundary
- `src/app/error.tsx` — Retry UI with error digest display.

## Critical rules followed
- Regular imports (NOT `next/dynamic`) in `dashboard.tsx` ✓
- `<div>` (not `motion.div`) for cards ✓
- `<img>` (not `next/image`) ✓
- NATIVE `<select>` in `FilterSelect` ✓
- `modal-shell` class on all modal containers ✓
- `tanoor-input` class on all text inputs ✓
- `const ease = [0.22, 1, 0.36, 1] as const;` ✓
- RTL-aware (`ps/pe/start/end`, `min-w-0`) ✓
- All `"use client"` where needed ✓

## Verification
- `bun run db:push` — schema in sync.
- `bun run prisma/seed.ts` — all 12 employees + 65 attendance + 8 leave + payroll(3mo) + 30 docs + 5 candidates + 8 KPIs seeded.
- `bun run lint` — clean (0 errors, 0 warnings).
- Live endpoints tested: `GET /` → 200, `GET /api/reports` → 200, `GET /api/employees` → 200, `POST /api/auth/login` (admin + hr) → 200 with valid user data, `POST /api/ai/chat` → 200 with real DB-grounded reply ("We currently have 12 employees in total (6 Saudi and 6 expat).").

## Login credentials
- `admin / tanoor2025` (admin role)
- `hr / hr2025` (hr role)
