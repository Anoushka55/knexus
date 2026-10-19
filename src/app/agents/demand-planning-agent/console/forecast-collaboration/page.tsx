"use client";
import { Fragment, useMemo, useState } from "react";
import { Card, CardHeader } from "@/lib/demand-planning/ui/Card";
import { Badge } from "@/lib/demand-planning/ui/Badge";
import { AgentInsightCard } from "@/lib/demand-planning/ui/AgentInsightCard";
import {
  Users,
  GitMerge,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  collabRecords,
  getCollabSummary,
  computeConsensusForecast,
  CollabRecord,
  SUBMISSION_DEADLINE,
} from "@/lib/demand-planning/data/forecastCollabData";

// ─── helpers ─────────────────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${parseInt(d, 10)} ${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}

function AdjBadge({ pct }: { pct: number }) {
  if (pct === 0)
    return <span className="font-mono text-navy/35 text-xs">—</span>;
  const pos = pct > 0;
  const Icon = pos ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-xs font-bold ${
        pos ? "text-success" : "text-critical"
      }`}
    >
      <Icon size={11} strokeWidth={2.5} />
      {pos ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

function StatusBadge({ status }: { status: CollabRecord["submission_status"] }) {
  const map: Record<CollabRecord["submission_status"], "success" | "warning" | "info"> = {
    Submitted: "success",
    Pending: "warning",
    "Reminder Sent": "info",
  };
  return <Badge variant={map[status]}>{status}</Badge>;
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ForecastCollabPage() {
  const [expandedOwner, setExpandedOwner] = useState<string | null>(null);

  const summary = useMemo(() => getCollabSummary(), []);
  const consensus = useMemo(() => computeConsensusForecast(), []);

  // ── aggregate stats ────────────────────────────────────────────────────────
  const totalSkus = collabRecords.length;
  const submittedSkus = collabRecords.filter((r) => r.submission_status === "Submitted").length;
  const totalOwners = summary.length;
  const completeOwners = summary.filter((s) => s.status === "Complete").length;
  const pendingOwners = summary.filter((s) => s.status === "In Progress");
  const autoReminderCount = summary.filter((s) => s.reminder_sent).length;

  const overallAvgAdj =
    Math.round(
      (collabRecords.reduce((s, r) => s + r.adjustment_pct, 0) / totalSkus) * 10
    ) / 10;

  const adjustedConsensusCount = consensus.filter(
    (r) => r.adjusted_forecast_qty !== null && r.adjusted_forecast_qty !== r.stat_forecast_qty
  ).length;

  const toggle = (owner: string) =>
    setExpandedOwner((prev) => (prev === owner ? null : owner));

  // ── agent insight text ─────────────────────────────────────────────────────
  const insightText = (() => {
    if (completeOwners === totalOwners) {
      return `All ${totalOwners} brand owners have submitted. Consensus forecast is ready — ${adjustedConsensusCount} SKUs carry owner adjustments vs. the statistical baseline.`;
    }
    const pendingNames = pendingOwners.map((o) => o.owner_name).join(", ");
    const reminderClause =
      autoReminderCount > 0
        ? ` The agent has automatically sent reminders to ${autoReminderCount} owner${autoReminderCount > 1 ? "s" : ""} ahead of the ${fmtDate(SUBMISSION_DEADLINE)} deadline.`
        : "";
    return `${completeOwners} of ${totalOwners} brand owners have completed submissions (${submittedSkus}/${totalSkus} SKUs). Pending: ${pendingNames}.${reminderClause}`;
  })();

  return (
    <div className="space-y-6">
      {/* ── header ── */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-coral font-bold">
          Planning Cycle
        </div>
        <h1 className="text-3xl font-extrabold text-navy mt-1">Forecast Collaboration</h1>
        <p className="text-sm text-muted mt-1">
          Statistical forecast → brand owner adjustments → consensus forecast for governance.
        </p>
      </div>

      {/* ── agent insight ── */}
      <AgentInsightCard
        sentiment={completeOwners === totalOwners ? "positive" : "neutral"}
        text={insightText}
      />

      {/* ── summary stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CalendarDays size={17} className="text-coral" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-muted mb-0.5">
                Stat Forecast Imported
              </div>
              <div className="text-lg font-extrabold text-navy">3 Jun 2026</div>
              <div className="text-xs text-muted mt-0.5">Statistical model run complete</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users size={17} className="text-coral" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-muted mb-0.5">
                Owners Submitted
              </div>
              <div className="text-lg font-extrabold text-navy">
                {submittedSkus}{" "}
                <span className="text-sm font-semibold text-muted">/ {totalSkus} SKUs</span>
              </div>
              <div className="text-xs text-muted mt-0.5">
                {completeOwners} of {totalOwners} owners complete
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                overallAvgAdj > 0 ? "bg-success/10" : overallAvgAdj < 0 ? "bg-critical/10" : "bg-navy/10"
              }`}
            >
              {overallAvgAdj >= 0 ? (
                <TrendingUp size={17} className={overallAvgAdj > 0 ? "text-success" : "text-navy/40"} />
              ) : (
                <TrendingDown size={17} className="text-critical" />
              )}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-muted mb-0.5">
                Avg Adjustment
              </div>
              <div
                className={`text-lg font-extrabold ${
                  overallAvgAdj > 0
                    ? "text-success"
                    : overallAvgAdj < 0
                    ? "text-critical"
                    : "text-navy/40"
                }`}
              >
                {overallAvgAdj > 0 ? "+" : ""}
                {overallAvgAdj.toFixed(1)}%
              </div>
              <div className="text-xs text-muted mt-0.5">Across all {totalSkus} SKUs</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── owner summary table ── */}
      <Card>
        <CardHeader
          title="Brand Owner Submissions"
          subtitle="Click a row to see SKU-level adjustments"
          icon={<Users size={18} className="text-coral" />}
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted text-left border-b border-[#E7DDCB]">
                <th className="font-bold pb-2.5 pr-4">Owner</th>
                <th className="font-bold pb-2.5 pr-4">Brand(s)</th>
                <th className="font-bold pb-2.5 pr-4 text-right">SKUs</th>
                <th className="font-bold pb-2.5 pr-4 text-right">Submitted</th>
                <th className="font-bold pb-2.5 pr-4 text-right">Avg Adj %</th>
                <th className="font-bold pb-2.5 pr-4">Status</th>
                <th className="font-bold pb-2.5 pr-4">Deadline</th>
                <th className="font-bold pb-2.5">Reminder</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => {
                const ownerSkus = collabRecords.filter((r) => r.owner_name === row.owner_name);
                const isExpanded = expandedOwner === row.owner_name;

                return (
                  <Fragment key={row.owner_name}>
                    {/* owner summary row */}
                    <tr
                      className="border-t border-[#F2E9D8] hover:bg-cream/60 transition-colors cursor-pointer"
                      onClick={() => toggle(row.owner_name)}
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5 font-semibold text-navy">
                          {isExpanded ? (
                            <ChevronDown size={14} className="text-coral flex-shrink-0" />
                          ) : (
                            <ChevronRight size={14} className="text-muted flex-shrink-0" />
                          )}
                          {row.owner_name}
                        </div>
                      </td>
                      <td className="pr-4 text-xs text-navy/65">{row.brands.join(", ")}</td>
                      <td className="pr-4 text-right font-mono font-bold text-navy">
                        {row.total_skus}
                      </td>
                      <td className="pr-4 text-right font-mono font-bold text-navy">
                        {row.submitted_count}
                      </td>
                      <td className="pr-4 text-right">
                        <AdjBadge pct={row.avg_adjustment_pct} />
                      </td>
                      <td className="pr-4">
                        <Badge variant={row.status === "Complete" ? "success" : "warning"}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="pr-4 text-xs text-navy/65 whitespace-nowrap">
                        {fmtDate(row.deadline)}
                      </td>
                      <td>
                        {row.status === "Complete" ? (
                          <span className="text-xs text-muted">—</span>
                        ) : row.reminder_sent ? (
                          <Badge variant="info">
                            Auto-sent {fmtDate(row.reminder_sent_date!)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                    </tr>

                    {/* expanded SKU detail rows */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="pb-3 pt-0 px-0">
                          <div className="mx-6 rounded-xl border border-[#E7DDCB] overflow-hidden bg-cream/50">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-[9px] uppercase tracking-wider text-muted text-left border-b border-[#E7DDCB] bg-white/60">
                                  <th className="font-bold px-4 py-2 pr-3">SKU</th>
                                  <th className="font-bold py-2 pr-3 text-right">Stat Forecast</th>
                                  <th className="font-bold py-2 pr-3 text-right">Adjusted</th>
                                  <th className="font-bold py-2 pr-3 text-right">Adj %</th>
                                  <th className="font-bold py-2 pr-4">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ownerSkus.map((sku) => (
                                  <tr key={sku.sku_id} className="border-t border-[#F2E9D8]">
                                    <td className="px-4 py-2.5 pr-3 font-semibold text-navy">
                                      {sku.sku_name}
                                      <span className="ml-2 text-[9px] text-muted font-normal font-mono">
                                        {sku.sku_id}
                                      </span>
                                    </td>
                                    <td className="py-2.5 pr-3 text-right font-mono text-navy/55">
                                      {sku.stat_forecast_qty.toLocaleString()}
                                    </td>
                                    <td className="py-2.5 pr-3 text-right font-mono font-bold text-navy">
                                      {sku.submission_status === "Submitted"
                                        ? sku.adjusted_forecast_qty.toLocaleString()
                                        : <span className="text-muted font-normal italic">—</span>}
                                    </td>
                                    <td className="py-2.5 pr-3 text-right">
                                      {sku.submission_status === "Submitted" ? (
                                        <AdjBadge pct={sku.adjustment_pct} />
                                      ) : (
                                        <span className="text-muted">—</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 pr-4">
                                      <StatusBadge status={sku.submission_status} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── consensus forecast table ── */}
      <Card>
        <CardHeader
          title="Consensus Forecast"
          subtitle={`${adjustedConsensusCount} SKUs carry owner adjustments vs. statistical baseline — this consensus feeds into the Governance Pre-Read.`}
          icon={<GitMerge size={18} className="text-teal" />}
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted text-left border-b border-[#E7DDCB]">
                <th className="font-bold pb-2.5 pr-4">SKU</th>
                <th className="font-bold pb-2.5 pr-3 text-right">Stat Forecast</th>
                <th className="font-bold pb-2.5 pr-3 text-right">Adjusted</th>
                <th className="font-bold pb-2.5 text-right">Consensus</th>
              </tr>
            </thead>
            <tbody>
              {consensus.map((row) => {
                const differs =
                  row.adjusted_forecast_qty !== null &&
                  row.adjusted_forecast_qty !== row.stat_forecast_qty;
                return (
                  <tr key={row.sku_id} className="border-t border-[#F2E9D8]">
                    <td className="py-2.5 pr-4 font-semibold text-navy">
                      {row.sku_name}
                      <span className="ml-1.5 text-[9px] text-muted font-normal font-mono">
                        {row.sku_id}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-navy/55 text-xs">
                      {row.stat_forecast_qty.toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-xs">
                      {row.adjusted_forecast_qty !== null ? (
                        <span className={differs ? "font-bold text-navy" : "text-navy/55"}>
                          {row.adjusted_forecast_qty.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-warning font-medium text-[10px]">Pending</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`font-mono font-bold text-sm ${
                          differs ? "text-teal" : "text-navy/50"
                        }`}
                      >
                        {row.consensus_qty.toLocaleString()}
                      </span>
                      {differs && (
                        <span className="ml-2 text-[9px] bg-teal/10 text-teal px-1.5 py-0.5 rounded font-sans font-semibold">
                          adjusted
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted border-t border-[#F2E9D8] pt-3">
          Pending SKUs use the statistical forecast as consensus until the owner submits. Consensus
          figures are automatically incorporated into the Governance Pre-Read once all owners have
          submitted.
        </p>
      </Card>
    </div>
  );
}
