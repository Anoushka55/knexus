"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, CheckCircle2, Circle, FileDown } from "lucide-react";
import { useSession } from "@/lib/enterprise-architecture/session";
import { eaFull } from "@/lib/enterprise-architecture/client";
import { Card, Pill, StatTile, Spinner, EmptyState } from "@/components/enterprise-architecture/primitives";

const BASE = "/agents/enterprise-architecture-agent/console";
const STAGES = ["TIME", "MAPPING", "COMPLIANCE", "MATURITY", "INSIGHTS"];

export default function CommandCenterPage() {
  const {
    timeResult,
    setTimeResult,
    arbResult,
    mappingResult,
    setMappingResult,
    complianceResult,
    setComplianceResult,
    maturityResult,
    setMaturityResult,
    insightsResult,
    setInsightsResult,
    assessmentResults,
    eaContext,
    mappingContext,
    selectedRegulations,
    saveReport,
  } = useSession();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);

  async function runFullPipeline() {
    setBusy(true);
    setError(null);
    setDone([]);
    try {
      const body: Record<string, unknown> = {
        applications: timeResult?.applications,
        industry: eaContext.industry,
        sub_sector: eaContext.sub_sector,
        ea_context: eaContext,
        mapping_context: mappingContext,
        arb_result: arbResult,
        regulations: selectedRegulations,
        compliance_result: complianceResult,
        assessment_results: assessmentResults,
      };
      const result = await eaFull(body);
      if (result.TIME) setTimeResult(result.TIME);
      if (result.MAPPING) setMappingResult(result.MAPPING);
      if (result.COMPLIANCE) setComplianceResult(result.COMPLIANCE);
      if (result.MATURITY) setMaturityResult(result.MATURITY);
      if (result.INSIGHTS) setInsightsResult(result.INSIGHTS);
      setDone(result.pipeline_summary.stages_completed);
      const html = (result as unknown as { report_html?: string }).report_html;
      if (html) setReportHtml(html);
      saveReport(`Pipeline run — ${new Date().toLocaleString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Command Center</h1>
        <p className="text-sm text-muted-foreground">
          Run the full 4-stage EA Intelligence pipeline (TIME → MAPPING → COMPLIANCE → MATURITY →
          INSIGHTS) in one pass, using whatever context has already been gathered on the other pages.
        </p>
      </div>

      {!timeResult && (
        <Card>
          <EmptyState title="No portfolio loaded" body="Upload your application inventory on the EA Analysis page first, then come back here to run the full pipeline." />
        </Card>
      )}

      <Card title="Pipeline Stages">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STAGES.map((s) => (
            <div key={s} className="flex items-center gap-2 border border-border rounded-ea-sm p-2.5 text-xs">
              {done.includes(s) ? (
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              {s}
            </div>
          ))}
        </div>
        <button
          onClick={runFullPipeline}
          disabled={busy || !timeResult}
          className="mt-4 inline-flex items-center gap-2 h-10 px-4 bg-navy text-white rounded-ea-sm text-sm font-medium disabled:opacity-50"
        >
          {busy ? <Spinner /> : <Sparkles className="w-4 h-4" />} Run Full Pipeline
        </button>
        {error && <div className="mt-3 text-xs text-crimson">{error}</div>}
      </Card>

      {(timeResult || maturityResult || insightsResult) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label="Applications" value={timeResult?.applications.length ?? 0} />
          <StatTile label="Compliance score" value={complianceResult?.overall_compliance_score ?? "—"} />
          <StatTile label="Maturity score" value={maturityResult ? `${maturityResult.overall_maturity_score}/5` : "—"} />
          <StatTile
            label="Overall risk"
            value={insightsResult?.risk_profile?.overall_risk ?? "—"}
            tone={insightsResult?.risk_profile?.overall_risk === "CRITICAL" ? "crimson" : "default"}
          />
        </div>
      )}

      {insightsResult && (
        <Card title="Executive Summary">
          <p className="text-sm leading-relaxed">{insightsResult.executive_summary}</p>
          {insightsResult.quick_wins && insightsResult.quick_wins.length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Quick Wins</h4>
              <div className="flex flex-wrap gap-1.5">
                {insightsResult.quick_wins.map((q, i) => (
                  <Pill key={i} tone="success">
                    {q}
                  </Pill>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {reportHtml && (
        <Card
          title="Generated Report"
          action={
            <Link
              href={`${BASE}/reports`}
              className="inline-flex items-center gap-1.5 h-8 px-3 border border-border rounded-ea-sm text-xs hover:border-navy"
            >
              <FileDown className="w-3.5 h-3.5" /> Open in Reports
            </Link>
          }
        >
          <p className="text-xs text-muted-foreground">
            The full report has been saved to the Reports page, where you can preview it full-screen and print
            it (or &quot;Save as PDF&quot;) from the browser&apos;s print dialog.
          </p>
        </Card>
      )}
    </div>
  );
}
