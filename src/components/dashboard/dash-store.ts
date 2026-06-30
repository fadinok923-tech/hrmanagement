"use client";

import { create } from "zustand";

export type DashPage =
  | "company"
  | "employees"
  | "attendance"
  | "leave"
  | "payroll"
  | "documents"
  | "recruitment"
  | "kpi"
  | "reports";

interface DashState {
  page: DashPage;
  setPage: (p: DashPage) => void;
  aiOpen: boolean;
  setAiOpen: (v: boolean) => void;
  employeeDetailId: string | null;
  setEmployeeDetailId: (id: string | null) => void;
}

export const useDashStore = create<DashState>((set) => ({
  page: "company",
  setPage: (p) => set({ page: p }),
  aiOpen: false,
  setAiOpen: (v) => set({ aiOpen: v }),
  employeeDetailId: null,
  setEmployeeDetailId: (id) => set({ employeeDetailId: id }),
}));
