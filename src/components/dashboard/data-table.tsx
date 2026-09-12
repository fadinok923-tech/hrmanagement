"use client";

import { type ReactNode, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBadge } from "./shared";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
};

const PAGE_SIZE = 20;

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  emptyTitle = "No records",
  emptyDescription,
  onRowClick,
  rowActions,
  selectable,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: (ids: string[]) => void;
}) {
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = useMemo(
    () => rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [rows, safePage],
  );

  const alignClass = (a?: string) =>
    a === "center" ? "text-center" : a === "end" ? "text-end" : "text-start";

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm p-12 text-center">
        <p className="font-semibold text-foreground">{emptyTitle}</p>
        {emptyDescription && <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="tanoor-scroll overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {selectable && (
                <th className="w-10 px-4 py-4">
                  <input
                    aria-label={ar ? "تحديد جميع الصفوف" : "Select all rows"}
                    type="checkbox"
                    checked={pageRows.length > 0 && pageRows.every((r) => selectedIds?.has(r.id))}
                    onChange={() => onToggleSelectAll?.(pageRows.map((r) => r.id))}
                  />
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn("whitespace-nowrap px-4 py-4 text-xs font-semibold tracking-wide text-muted-foreground", alignClass(c.align), c.className)}
                >
                  {c.header}
                </th>
              ))}
              {rowActions && <th className="px-4 py-4 text-end text-xs font-semibold tracking-wide text-muted-foreground">{ar ? "الإجراءات" : "Actions"}</th>}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onRowClick?.(row); } }}
                className={cn(
                  "border-b border-border/60 transition-colors last:border-0",
                  onRowClick && "cursor-pointer hover:bg-muted/40",
                )}
              >
                {selectable && (
                  <td className="w-10 px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      aria-label={ar ? "تحديد الصف" : "Select row"}
                      type="checkbox"
                      checked={selectedIds?.has(row.id) || false}
                      onChange={() => onToggleSelect?.(row.id)}
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-4 text-foreground align-middle", alignClass(c.align), c.className)}>
                    {c.render ? c.render(row) : (row as any)[c.key] ?? "—"}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-4 py-4 text-end" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">{rowActions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-4">
          <p className="text-xs text-muted-foreground">
            {ar ? "عرض" : "Showing"} {safePage * PAGE_SIZE + 1}-{Math.min((safePage + 1) * PAGE_SIZE, rows.length)} {ar ? "من" : "of"} {rows.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
              aria-label={ar ? "الصفحة السابقة" : "Previous page"}
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </button>
            <span className="px-2 text-xs font-medium text-foreground">
              {safePage + 1} / {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage === pageCount - 1}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
              aria-label={ar ? "الصفحة التالية" : "Next page"}
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { StatusBadge };
