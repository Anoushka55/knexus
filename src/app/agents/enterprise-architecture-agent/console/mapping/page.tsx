"use client";

import { useState } from "react";
import { Network, Sparkles, ScrollText } from "lucide-react";
import { useSession } from "@/lib/enterprise-architecture/session";
import { mappingAnalyse, complianceCheck } from "@/lib/enterprise-architecture/client";
import { Card, Pill, StatTile, RiskPill, Spinner, EmptyState } from "@/components/enterprise-architecture/primitives";

const FLAGGED_ACTIONS = new Set(["Retire", "Replace", "Refactor", "Rehost", "Replatform"]);
const REGULATIONS = ["GDPR", "HIPAA", "PCI-DSS", "SOX", "CCPA", "ISO 27001", "SOC 2", "FedRAMP", "NIST SP 800-53"];

export default function MappingPage() {
  const {
    timeResult,
    arbResult,
    eaContext,
    mappingContext,
    setMappingContext,
    mappingResult,
    setMappingResult,
    complianceResult,
    setComplianceResult,
    selectedRegulations,
    setSelectedRegulations,
  } = useSession();

  const [busy, setBusy] = useState<"mapping" | "compliance" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const flagged = timeResult?.applications.filter((a) => FLAGGED_ACTIONS.has(a.rationalization_action ?? "")) ?? [];

  async function runMapping() {
    if (!timeResult) return;
    setBusy("mapping");
    setError(null);
    try {
      const result = await mappingAnalyse({
        applications: timeResult.applications,
        arb_result: arbResult,
        ea_context: eaContext as unknown as Record<string, unknown>,
        mapping_context: mappingContext as unknown as Record<string, unknown>,
      });
      setMappingResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function runCompliance() {
    if (!timeResult || !selectedRegulations.length) return;
    setBusy("compliance");
    setError(null);
    try {
      const result = await complianceCheck({
        applications: timeResult.applications,
        regulations: selectedRegulations,
        mapping_output: mappingResult,
        industry: eaContext.industry,
        sub_sector: eaContext.sub_sector,
        governance: eaContext.governance,
        additional_context: eaContext.additional_context,
      });
      setComplianceResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  function toggleRegulation(reg: string) {
    setSelectedRegulations(
      selectedRegulations.includes(reg) ? selectedRegulations.filter((r) => r !== reg) : [...selectedRegulations, reg],
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Step 3 — Dependency Mapping &amp; Compliance</h1>
        <p className="text-sm text-muted-foreground">
          Impact analysis for applications flagged for action, plus an optional regulatory gap analysis.
        </p>
      </div>

      {!timeResult && (
        <Card>
          <EmptyState icon={<Network className="w-10 h-10" />} title="Run EA Analysis first" body="Mapping analyses the applications flagged for action in Step 1." />
        </Card>
      )}

      {timeResult && (
        <Card
          title="Dependency Context"
          subtitle={`${flagged.length} flagged application(s)`}
          action={
            <button
              onClick={runMapping}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 h-8 px-3 bg-navy text-white rounded-ea-sm text-xs disabled:opacity-50"
            >
              {busy === "mapping" ? <Spinner /> : <Sparkles className="w-3.5 h-3.5" />} Run Mapping
            </button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <textarea
              value={mappingContext.known_integrations}
              onChange={(e) => setMappingContext({ known_integrations: e.target.value })}
              placeholder="Known integrations (optional)…"
              rows={2}
              className="border border-border rounded-ea-sm p-2 text-sm bg-background"
            />
            <textarea
              value={mappingContext.planned_changes}
              onChange={(e) => setMappingContext({ planned_changes: e.target.value })}
              placeholder="Planned changes / decommissions (optional)…"
              rows={2}
              className="border border-border rounded-ea-sm p-2 text-sm bg-background"
            />
            <input
              value={mappingContext.cmdb_tool}
              onChange={(e) => setMappingContext({ cmdb_tool: e.target.value })}
              placeholder="CMDB / ITSM tool"
              className="h-9 border border-border rounded-ea-sm px-2 text-sm bg-background"
            />
            <select
              value={mappingContext.integration_complexity}
              onChange={(e) => setMappingContext({ integration_complexity: e.target.value })}
              className="h-9 border border-border rounded-ea-sm px-2 text-sm bg-background"
            >
              <option value="">Integration complexity — not specified</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          {error && <div className="mt-3 text-xs text-crimson">{error}</div>}
        </Card>
      )}

      {mappingResult && !mappingResult.skipped && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Overall impact" value={mappingResult.overall_impact_level} />
            <StatTile label="Apps analysed" value={mappingResult.app_analyses?.length ?? 0} />
            <StatTile label="Cross-app risks" value={mappingResult.cross_app_risks?.length ?? 0} />
            <StatTile label="Quick wins" value={mappingResult.quick_wins?.length ?? 0} />
          </div>

          <Card title="Application Impact Analysis">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-1.5 pr-3">App</th>
                    <th className="py-1.5 pr-3">Impact</th>
                    <th className="py-1.5 pr-3">Coupling</th>
                    <th className="py-1.5 pr-3">Sequence</th>
                    <th className="py-1.5 pr-3">Data confidence</th>
                    <th className="py-1.5 pr-3">Removal risk</th>
                  </tr>
                </thead>
                <tbody>
                  {mappingResult.app_analyses?.map((a, i) => (
                    <tr key={i} className="border-b border-border/60 align-top">
                      <td className="py-1.5 pr-3 font-medium">{a.app_name}</td>
                      <td className="py-1.5 pr-3">
                        <RiskPill level={a.impact_level} />
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums">{a.coupling_score ?? "—"}</td>
                      <td className="py-1.5 pr-3">{a.recommended_sequence}</td>
                      <td className="py-1.5 pr-3 text-muted-foreground">{a.data_confidence}</td>
                      <td className="py-1.5 pr-3 text-muted-foreground max-w-xs">{a.removal_risk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {mappingResult.quick_wins && mappingResult.quick_wins.length > 0 && (
            <Card title="Quick Wins">
              <ul className="space-y-1 text-xs">
                {mappingResult.quick_wins.map((q, i) => (
                  <li key={i}>• {q}</li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {mappingResult?.skipped && (
        <Card>
          <EmptyState icon={<Network className="w-10 h-10" />} title="Mapping skipped" body={mappingResult.reason} />
        </Card>
      )}

      {timeResult && (
        <Card
          title="Compliance Gap Analysis"
          subtitle="Select the regulations to assess"
          action={
            <button
              onClick={runCompliance}
              disabled={busy !== null || !selectedRegulations.length}
              className="inline-flex items-center gap-2 h-8 px-3 bg-navy text-white rounded-ea-sm text-xs disabled:opacity-50"
            >
              {busy === "compliance" ? <Spinner /> : <ScrollText className="w-3.5 h-3.5" />} Run Compliance Check
            </button>
          }
        >
          <div className="flex flex-wrap gap-1.5">
            {REGULATIONS.map((reg) => (
              <button
                key={reg}
                onClick={() => toggleRegulation(reg)}
                className={`h-7 px-2.5 rounded-full border text-xs transition-colors ${
                  selectedRegulations.includes(reg)
                    ? "bg-navy text-white border-navy"
                    : "bg-background text-muted-foreground border-border hover:border-navy"
                }`}
              >
                {reg}
              </button>
            ))}
          </div>

          {complianceResult && !complianceResult.skipped && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatTile label="Compliance score" value={`${complianceResult.overall_compliance_score}/100`} />
                <StatTile label="Critical gaps" value={complianceResult.critical_gaps?.length ?? 0} tone="crimson" />
                <StatTile label="Apps assessed" value={complianceResult.app_compliance_map?.length ?? 0} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-1.5 pr-3">App</th>
                      <th className="py-1.5 pr-3">Status</th>
                      <th className="py-1.5 pr-3">Risk</th>
                      <th className="py-1.5 pr-3">Classification</th>
                      <th className="py-1.5 pr-3">Gaps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceResult.app_compliance_map?.map((row, i) => (
                      <tr key={i} className="border-b border-border/60 align-top">
                        <td className="py-1.5 pr-3 font-medium">{row.app_name}</td>
                        <td className="py-1.5 pr-3">
                          <Pill
                            tone={
                              row.compliance_status === "COMPLIANT"
                                ? "success"
                                : row.compliance_status === "NON_COMPLIANT"
                                  ? "crimson"
                                  : row.compliance_status === "PARTIAL"
                                    ? "amber"
                                    : "muted"
                            }
                          >
                            {row.compliance_status}
                          </Pill>
                        </td>
                        <td className="py-1.5 pr-3">
                          <RiskPill level={row.risk_level} />
                        </td>
                        <td className="py-1.5 pr-3 text-muted-foreground">{row.data_classification}</td>
                        <td className="py-1.5 pr-3 text-muted-foreground max-w-sm">{row.gaps?.join("; ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {error && <div className="mt-3 text-xs text-crimson">{error}</div>}
        </Card>
      )}
    </div>
  );
}
