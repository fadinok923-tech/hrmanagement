"use client";

import { useLanguage } from "@/components/language-provider";
import { useDashStore } from "./dash-store";
import { Sparkles } from "lucide-react";

export function DashFooter() {
  const { t } = useLanguage();
  const { setAiOpen } = useDashStore();

  return (
    <footer className="mt-auto border-t border-border bg-card/60 backdrop-blur px-4 py-3 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-xs text-muted-foreground">
          © 2025 {t("brand.name")} — {t("footer.rights")}
        </p>
        <button
          onClick={() => setAiOpen(true)}
          className="group inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-semibold text-amber-700 shadow-sm transition-all hover:border-amber-400 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30"
        >
          <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
          {t("footer.ai")}
        </button>
      </div>
    </footer>
  );
}

