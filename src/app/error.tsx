"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          An unexpected error occurred while loading the dashboard. You can try again — if the
          problem persists, please contact your system administrator.
        </p>
        {error?.message && (
          <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs font-mono text-muted-foreground">
            {error.message}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition hover:bg-foreground/90"
      >
        <RotateCcw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
}
