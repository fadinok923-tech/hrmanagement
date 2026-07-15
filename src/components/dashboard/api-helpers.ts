"use client";

// Normalize API responses to a consistent shape for the UI.

export interface NormalEmployee {
  id: string;
  empNo: string;
  fullName: string;
  fullNameAr: string | null;
  nationality: string;
  gender: string;
  dateOfBirth: string | null;
  maritalStatus: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergencyContact: string | null;
  jobTitle: string;
  department: string;
  employmentType: string;
  hireDate: string | null;
  activeDate: string | null;
  contractEnd: string | null;
  basicSalary: number;
  allowances: number;
  bankAccount: string | null;
  iban: string | null;
  passportNo: string | null;
  passportExpiry: string | null;
  iqamaNo: string | null;
  iqamaExpiry: string | null;
  visaType: string | null;
  status: string;
  profilePhoto: string | null;
  iqamaPhoto: string | null;
  passportPhoto: string | null;
  avatarColor: string;
  notes: string | null;
  leaveAnnual: number;
  leaveSick: number;
  leaveEmergency: number;
  leaveCasualPerWeek: number;
}

export interface NormalAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  empNo: string;
  department: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  workHours: number;
  overtime: number;
  notes: string | null;
}

export interface NormalLeave {
  id: string;
  employeeId: string;
  employeeName: string;
  empNo: string;
  department: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: string;
  approver: string | null;
}

export interface NormalPayroll {
  id: string;
  employeeId: string;
  employeeName: string;
  empNo: string;
  department: string;
  month: string;
  basicSalary: number;
  allowances: number;
  overtime: number;
  deductions: number;
  gosi: number;
  netSalary: number;
  status: string;
  payDate: string | null;
}

export interface NormalDocument {
  id: string;
  employeeId: string | null;
  employeeName: string | null;
  empNo: string | null;
  title: string;
  type: string;
  fileUrl: string | null;
  fileName: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  status: string;
  notes: string | null;
}

export interface NormalCandidate {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  position: string;
  department: string | null;
  source: string | null;
  experience: number | null;
  status: string;
  rating: number;
  expectedSalary: number | null;
  notes: string | null;
  appliedAt: string;
}

export interface NormalKpi {
  id: string;
  employeeId: string;
  employeeName: string;
  empNo: string;
  department: string;
  period: string;
  productivity: number;
  quality: number;
  teamwork: number;
  punctuality: number;
  initiative: number;
  finalScore: number;
  comments: string | null;
}

export interface NormalReport {
  overview: {
    totalEmployees: number;
    activeCount: number;
    onLeaveCount: number;
    saudiCount: number;
    expatCount: number;
    saudizationRate: number;
    totalMonthlySalary: number;
    pendingLeaves: number;
    approvedLeaves: number;
    rejectedLeaves: number;
    totalLeaves: number;
    avgKpi: number;
    totalCandidates: number;
    totalDocuments: number;
  };
  attendance: { present: number; late: number; absent: number; leave: number };
  byDepartment: Record<string, number>;
  byVisa: Record<string, number>;
  payrollByMonth: Record<string, { total: number; gosi: number; count: number }>;
  deptSalary: Record<string, { total: number; count: number }>;
  documents: { valid: number; expiring: number; expired: number; total: number };
  candidatePipeline: Record<string, number>;
  topPerformers: { employeeId: string; name: string; empNo: string; department: string; finalScore: number; period: string }[];
}

function iso(d: any): string | null {
  if (!d) return null;
  try { return new Date(d).toISOString(); } catch { return null; }
}

function dateOnly(d: any): string | null {
  if (!d) return null;
  try {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  } catch { return null; }
}

export function normalizeEmployee(e: any): NormalEmployee {
  return {
    id: e.id,
    empNo: e.empNo || "",
    fullName: e.fullName || "",
    fullNameAr: e.fullNameAr ?? null,
    nationality: e.nationality || "",
    gender: e.gender || "male",
    dateOfBirth: dateOnly(e.dateOfBirth),
    maritalStatus: e.maritalStatus ?? null,
    phone: e.phone ?? null,
    email: e.email ?? null,
    address: e.address ?? null,
    emergencyContact: e.emergencyContact ?? null,
    jobTitle: e.jobTitle || "",
    department: e.department || "",
    employmentType: e.employmentType || "full_time",
    hireDate: dateOnly(e.hireDate),
    activeDate: dateOnly(e.activeDate),
    contractEnd: dateOnly(e.contractEnd),
    basicSalary: Number(e.basicSalary) || 0,
    allowances: Number(e.allowances) || 0,
    bankAccount: e.bankAccount ?? null,
    iban: e.iban ?? null,
    passportNo: e.passportNo ?? null,
    passportExpiry: dateOnly(e.passportExpiry),
    iqamaNo: e.iqamaNo ?? null,
    iqamaExpiry: dateOnly(e.iqamaExpiry),
    visaType: e.visaType ?? null,
    status: e.status || "active",
    profilePhoto: e.profilePhoto ?? null,
    iqamaPhoto: e.iqamaPhoto ?? null,
    passportPhoto: e.passportPhoto ?? null,
    avatarColor: e.avatarColor || "#1e3a8a",
    notes: e.notes ?? null,
    leaveAnnual: Number(e.leaveAnnual) ?? 21,
    leaveSick: Number(e.leaveSick) ?? 30,
    leaveEmergency: Number(e.leaveEmergency) ?? 3,
    leaveCasualPerWeek: Number(e.leaveCasualPerWeek) ?? 1,
  };
}

export function normalizeEmployeeList(list: any[]): NormalEmployee[] {
  return list.map(normalizeEmployee);
}

export function normalizeAttendanceList(list: any[]): NormalAttendance[] {
  return list.map((a) => ({
    id: a.id,
    employeeId: a.employeeId,
    employeeName: a.employee?.fullName || "—",
    empNo: a.employee?.empNo || "",
    department: a.employee?.department || "",
    date: dateOnly(a.date) || "",
    checkIn: a.checkIn ? new Date(a.checkIn).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : null,
    checkOut: a.checkOut ? new Date(a.checkOut).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : null,
    status: a.status || "present",
    workHours: Number(a.workHours) || 0,
    overtime: Number(a.overtime) || 0,
    notes: a.notes ?? null,
  }));
}

export function normalizeLeaveList(list: any[]): NormalLeave[] {
  return list.map((l) => ({
    id: l.id,
    employeeId: l.employeeId,
    employeeName: l.employee?.fullName || "—",
    empNo: l.employee?.empNo || "",
    department: l.employee?.department || "",
    type: l.type || "annual",
    startDate: dateOnly(l.startDate) || "",
    endDate: dateOnly(l.endDate) || "",
    days: Number(l.days) || 0,
    reason: l.reason ?? null,
    status: l.status || "pending",
    approver: l.approver ?? null,
  }));
}

export function normalizePayrollList(list: any[]): NormalPayroll[] {
  return list.map((p) => ({
    id: p.id,
    employeeId: p.employeeId,
    employeeName: p.employee?.fullName || "—",
    empNo: p.employee?.empNo || "",
    department: p.employee?.department || "",
    month: p.month || "",
    basicSalary: Number(p.basicSalary) || 0,
    allowances: Number(p.allowances) || 0,
    overtime: Number(p.overtime) || 0,
    deductions: Number(p.deductions) || 0,
    gosi: Number(p.gosi) || 0,
    netSalary: Number(p.netSalary) || 0,
    status: p.status || "processed",
    payDate: dateOnly(p.payDate),
  }));
}

export function normalizeDocumentList(list: any[]): NormalDocument[] {
  return list.map((d) => ({
    id: d.id,
    employeeId: d.employeeId ?? null,
    employeeName: d.employee?.fullName ?? null,
    empNo: d.employee?.empNo ?? null,
    title: d.title || "",
    type: d.type || "other",
    fileUrl: d.fileUrl ?? null,
    fileName: d.fileName ?? null,
    issueDate: dateOnly(d.issueDate),
    expiryDate: dateOnly(d.expiryDate),
    status: d.status || "valid",
    notes: d.notes ?? null,
  }));
}

export function normalizeCandidateList(list: any[]): NormalCandidate[] {
  return list.map((c) => ({
    id: c.id,
    fullName: c.fullName || "",
    email: c.email ?? null,
    phone: c.phone ?? null,
    position: c.position || "",
    department: c.department ?? null,
    source: c.source ?? null,
    experience: c.experience ?? null,
    status: c.status || "applied",
    rating: Number(c.rating) || 3,
    expectedSalary: c.expectedSalary ?? null,
    notes: c.notes ?? null,
    appliedAt: dateOnly(c.appliedAt) || "",
  }));
}

export function normalizeKpiList(list: any[]): NormalKpi[] {
  return list.map((k) => ({
    id: k.id,
    employeeId: k.employeeId,
    employeeName: k.employee?.fullName || "—",
    empNo: k.employee?.empNo || "",
    department: k.employee?.department || "",
    period: k.period || "",
    productivity: Number(k.productivity) || 0,
    quality: Number(k.quality) || 0,
    teamwork: Number(k.teamwork) || 0,
    punctuality: Number(k.punctuality) || 0,
    initiative: Number(k.initiative) || 0,
    finalScore: Number(k.finalScore) || 0,
    comments: k.comments ?? null,
  }));
}

export function normalizeReport(r: any): NormalReport {
  return r as NormalReport;
}

export function formatSAR(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n) + " SAR";
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
