"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { useAssessmentRun } from "./AssessmentRunContext";
import { encodeRun, SHARE_PARAM } from "@/lib/assessments/share";

/** Copies a link that carries the whole run, since there is nowhere to store it. */
export function ShareButton() {
  const { input, definition } = useAssessmentRun();
  const [copied, setCopied] = useState(false);

  async function copy() {
    const token = encodeRun(input, definition);
    const url = `${window.location.origin}/assessments/${definition.slug}/results?${SHARE_PARAM}=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context, or denied) — show the URL so it
      // can still be copied by hand rather than failing silently.
      window.prompt("Copy this link", url);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-brand-blue print:hidden"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-brand-green" /> : <Link2 className="h-3.5 w-3.5" />}
      {copied ? "Link copied" : "Share result"}
    </button>
  );
}
