"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Minimal stand-in for the `sonner` toast the standalone app used (knexus
 * doesn't ship sonner). Supports only what this console calls:
 * `toast.success(title, { description })`, rendered by <LtmToaster />.
 */
type Toast = { id: number; title: string; description?: string };

let nextId = 0;
const listeners = new Set<(t: Toast) => void>();

export const toast = {
  success(title: string, opts?: { description?: string }) {
    const t = { id: ++nextId, title, description: opts?.description };
    listeners.forEach((l) => l(t));
  },
};

export function LtmToaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const add = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000);
    };
    listeners.add(add);
    return () => {
      listeners.delete(add);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-[340px] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="animate-scale-in pointer-events-auto flex gap-3 rounded-lg border bg-card p-3.5 shadow-panel"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground">{t.title}</p>
            {t.description ? <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
