"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const ease = [0.22, 1, 0.36, 1] as const;

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {label && (
        <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="tanoor-input h-9 w-full min-w-0 appearance-none rounded-lg border border-input bg-background px-3 pe-8 text-sm text-foreground shadow-sm transition focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        style={label ? { top: "calc(50% + 9px)" } : undefined}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon && (
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  title,
  value,
  delta,
  icon,
  accent = "default",
}: {
  title: string;
  value: string | number;
  delta?: string;
  icon?: ReactNode;
  accent?: "default" | "gold" | "green" | "red" | "blue";
}) {
  const accents: Record<string, string> = {
    default: "bg-muted text-foreground",
    gold: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    blue: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {delta && <p className="mt-0.5 text-[11px] text-muted-foreground">{delta}</p>}
        </div>
        {icon && (
          <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", accents[accent])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function ModalShell({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  if (!open) return null;
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`modal-shell relative z-10 w-full ${sizes[size]} max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl`}>
        <div className="h-1.5 w-full bg-gradient-to-r from-[var(--color-brand-deep)] to-[var(--color-brand-light)]" />
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="tanoor-scroll max-h-[calc(90vh-90px)] overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status, variant }: { status: string; variant?: "default" | "success" | "warning" | "danger" | "info" }) {
  const v = variant || (
    ["active", "present", "approved", "paid", "valid", "hired", "processed"].includes(status)
      ? "success"
      : ["pending", "expiring", "late", "applied", "screening", "on_leave", "interview"].includes(status)
        ? "warning"
        : ["rejected", "expired", "absent", "terminated", "inactive"].includes(status)
          ? "danger"
          : ["offered"].includes(status) ? "info" : "default"
  );
  const classes: Record<string, string> = {
    default: "bg-muted text-foreground",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    info: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${classes[v]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
