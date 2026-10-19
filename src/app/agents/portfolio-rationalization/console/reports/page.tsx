"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Loader2, Printer } from "lucide-react";
import { useSession } from "@/lib/portfolio-rationalization/session";
import { buildReport } from "@/lib/portfolio-rationalization/client";
import { ActionBadge, EmptyState, SectionCard } from "../_components";

export default function ReportsPage() {
  const { tools, duplications, assessment, chatHistory } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const chatContext = chatHistory.length
    ? chatHistory.map((m) => `${m.role === "user" ? "Client question" : "AI Advisor"}: ${m.content}`).join("\n")
    : null;

  async function download() {
    setLoading(true);
    setError("");
    try {
      const html = await buildReport(tools, duplications, assessment ?? {}, chatContext);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tool-rationalization-report-${new Date().toISOString().slice(0, 10)}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function printPdf() {
    setLoading(true);
    setError("");
    try {
      const html = await buildReport(tools, duplications, assessment ?? {}, chatContext);
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        win.onload = () => win.print();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  if (!tools.length) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <SectionCard title="Reports">
          <EmptyState message="Ingest data to see a portfolio snapshot." />
          <div className="text-center mt-2">
            <Link href="/agents/portfolio-rationalization/console/ingest" className="text-sm text-[var(--ptr-blue)] font-medium hover:underline">
              Go to Data Ingest →
            </Link>
          </div>
        </SectionCard>
      </div>
    );
  }

  const totalCost = tools.reduce((a, t) => a + (t.annual_cost || 0), 0);
  const potSavings = duplications.reduce((a, d) => a + d.potential_annual_savings, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <SectionCard title="Generate Report">
        <p className="text-sm text-[var(--ptr-muted)] mb-4">
          Export a full consulting-style rationalization report covering the executive summary, 6R action plan, risk highlights, and
          per-tool analysis.
          {!assessment && " Run an AI Assessment first for the richest report, or export now with the scored portfolio alone."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={download}
            disabled={loading}
            className="h-11 px-4 rounded-md bg-[var(--ptr-navy)] text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download HTML Report
          </button>
          <button
            onClick={printPdf}
            disabled={loading}
            className="h-11 px-4 rounded-md border border-[var(--ptr-border)] text-sm text-[var(--ptr-navy)] flex items-center gap-2 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-[var(--ptr-red)]">{error}</p>}
      </SectionCard>

      <SectionCard title="Portfolio Snapshot">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Stat label="Tools" value={String(tools.length)} />
          <Stat label="Annual Spend" value={`$${totalCost.toLocaleString()}`} />
          <Stat label="Overlap Pairs" value={String(duplications.length)} />
          <Stat label="Est. Savings" value={`$${potSavings.toLocaleString()}`} />
        </div>
        <div className="max-h-80 overflow-y-auto ptr-scroll divide-y divide-[var(--ptr-border)]">
          {tools.slice(0, 30).map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2 text-sm">
              <ActionBadge action={t.rationalization_action} />
              <span className="flex-1 truncate">{t.name}</span>
              <span className="text-[var(--ptr-muted)] text-xs">{t.category}</span>
              <span className="font-semibold text-xs w-14 text-right">{(t.composite_score ?? 0).toFixed(1)}/10</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {assessment && (
        <SectionCard title="Assessment Status">
          <p className="text-sm text-[var(--ptr-green)] font-medium">
            ✓ AI assessment complete — the downloaded report will include the executive summary, roadmap and risk highlights.
          </p>
        </SectionCard>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--ptr-background)] rounded-lg p-3 text-center">
      <div className="text-[10px] uppercase tracking-wide text-[var(--ptr-muted)]">{label}</div>
      <div className="text-base font-extrabold text-[var(--ptr-navy)] mt-1">{value}</div>
    </div>
  );
}
