"use client";
import { useMemo, useState } from "react";
import { Card } from "@/lib/demand-planning/ui/Card";
import { Badge, rootCauseToVariant, tierToVariant } from "@/lib/demand-planning/ui/Badge";
import { Button } from "@/lib/demand-planning/ui/Button";
import { Select } from "@/lib/demand-planning/ui/Select";
import { AgentInsightCard } from "@/lib/demand-planning/ui/AgentInsightCard";
import { SKU_SEGMENTS, computeConfidence, getSegmentColor, DemandRecord } from "@/lib/demand-planning/data/mockData";
import { useOverrides, getEffectiveStatus } from "@/lib/demand-planning/state/overrideContext";
import { useDataContext } from "@/lib/demand-planning/state/dataContext";
import { AgentThinking } from "@/lib/demand-planning/ui/AgentThinking";
import { formatINR } from "@/lib/demand-planning/utils";
import { AlertTriangle, Sparkles, X, Brain, ChevronDown, ChevronRight, CheckCircle2, ShieldAlert, ArrowUpRight } from "lucide-react";

export default function ExceptionsPage() {
  const { overrides, exceptionStatusOverrides, setExceptionStatus } = useOverrides();
  const { activeDataset } = useDataContext();
  const [rootCauseFilter, setRootCauseFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"impact" | "confidence">("impact");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const openExceptions = useMemo(() => {
    return activeDataset
      .filter((r) => {
        const status = getEffectiveStatus(r, exceptionStatusOverrides);
        return (status === "Open" || status === "Escalated") && r.root_cause_tag !== "None";
      })
      .filter((r) => rootCauseFilter === "all" || r.root_cause_tag === rootCauseFilter)
      .filter((r) => tierFilter === "all" || r.approval_tier === tierFilter)
      .sort((a, b) => sortBy === "impact"
        ? b.financial_impact_inr - a.financial_impact_inr
        : a.rca_confidence_pct - b.rca_confidence_pct);
  }, [activeDataset, exceptionStatusOverrides, rootCauseFilter, tierFilter, sortBy]);

  const totalImpact = openExceptions.reduce((s, r) => s + r.financial_impact_inr, 0);
  const tierCounts = openExceptions.reduce((acc, r) => {
    acc[r.approval_tier] = (acc[r.approval_tier] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleDecision = (r: DemandRecord, decision: "Closed" | "Escalated", reason: string) => {
    setExceptionStatus(r, decision, reason);
    setExpandedRow(null);
    showToast(`Decision recorded — agent will learn from this override.`);
  };

  const rowKey = (r: DemandRecord) => `${r.sku_id}|${r.depot_id}|${r.account_id}|${r.period}`;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-coral font-bold">DemandIQ Agent · Exception Engine</div>
        <h1 className="text-3xl font-extrabold text-navy mt-1 flex items-center gap-2">
          <AlertTriangle className="text-coral" size={28} /> Exception Report
        </h1>
        <p className="text-sm text-muted mt-1">Manage and resolve autonomous demand planning exceptions.</p>
      </div>

      <AgentInsightCard
        sentiment="negative"
        text="3 of the 12 open exceptions share the 'Data Quality' root cause and originate from the same depot — possible systemic data issue at Mumbai Logistics Park worth investigating."
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Total Open Exceptions</div>
          <div className="text-4xl font-extrabold text-navy mt-2">{openExceptions.length}</div>
        </Card>
        <Card>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Total Financial Impact</div>
          <div className="text-4xl font-extrabold text-coral mt-2">{formatINR(totalImpact)}</div>
        </Card>
        <Card>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-3">Breakdown by Tier</div>
          <div className="flex flex-wrap gap-2">
            {(["Director", "L2", "L1", "Auto-Close"] as const).map((t) =>
              tierCounts[t] ? <Badge key={t} variant={tierToVariant(t)}>{t}: {tierCounts[t]}</Badge> : null
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 mb-5 items-end">
          <Select label="Root Cause" value={rootCauseFilter} onChange={(e) => setRootCauseFilter(e.target.value)} className="min-w-[160px]">
            <option value="all">All</option>
            <option value="Data Quality">Data Quality</option>
            <option value="Promo">Promo</option>
            <option value="Seasonality">Seasonality</option>
            <option value="Supply">Supply</option>
            <option value="Market Event">Market Event</option>
          </Select>
          <Select label="Approval Tier" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="min-w-[160px]">
            <option value="all">All</option>
            <option value="Director">Director</option>
            <option value="L2">L2</option>
            <option value="L1">L1</option>
            <option value="Auto-Close">Auto-Close</option>
          </Select>
          <Select label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value as "impact" | "confidence")} className="min-w-[160px]">
            <option value="impact">Financial Impact (high → low)</option>
            <option value="confidence">Confidence (low → high)</option>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted text-left border-b border-[#E7DDCB]">
                <th className="font-bold py-3 pr-3 w-8"></th>
                <th className="font-bold py-3 pr-3">SKU</th>
                <th className="font-bold py-3 pr-3">Account</th>
                <th className="font-bold py-3 pr-3">Segment</th>
                <th className="font-bold py-3 pr-3 text-right">FA / Bias</th>
                <th className="font-bold py-3 pr-3">Root Cause</th>
                <th className="font-bold py-3 pr-3 text-right">Confidence</th>
                <th className="font-bold py-3 pr-3 text-right">Impact</th>
                <th className="font-bold py-3 pr-3">Tier</th>
                <th className="font-bold py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {openExceptions.length === 0 && (
                <tr><td colSpan={10} className="text-center py-10 text-sm text-muted">No open exceptions in current filter.</td></tr>
              )}
              {openExceptions.map((r) => {
                const key = rowKey(r);
                const isOpen = expandedRow === key;
                const seg = SKU_SEGMENTS[r.sku_id];
                const segColor = seg ? getSegmentColor(seg.segment) : { bg: "bg-navy/10", text: "text-navy", label: "Unknown" };
                return (
                  <RowWithDrawer
                    key={key}
                    record={r}
                    isOpen={isOpen}
                    onToggle={() => setExpandedRow(isOpen ? null : key)}
                    onDecision={handleDecision}
                    segColor={segColor}
                    allData={activeDataset}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-navy text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-2 text-sm">
          <CheckCircle2 size={18} className="text-success" /> {toast}
        </div>
      )}
    </div>
  );
}

function RowWithDrawer({ record, isOpen, onToggle, onDecision, segColor, allData }: {
  record: DemandRecord;
  isOpen: boolean;
  onToggle: () => void;
  onDecision: (r: DemandRecord, d: "Closed" | "Escalated", reason: string) => void;
  segColor: { bg: string; text: string; label: string };
  allData: DemandRecord[];
}) {
  const seg = SKU_SEGMENTS[record.sku_id];
  return (
    <>
      <tr className="border-b border-[#F2E9D8] hover:bg-cream/50 cursor-pointer" onClick={onToggle}>
        <td className="py-3 pr-3">
          {isOpen ? <ChevronDown size={16} className="text-coral" /> : <ChevronRight size={16} className="text-muted" />}
        </td>
        <td className="py-3 pr-3 font-semibold text-navy">{record.sku_name}</td>
        <td className="text-xs text-navy/80 pr-3">{record.account_name}</td>
        <td className="pr-3"><Badge variant="navy" className={`${segColor.bg} ${segColor.text} border-transparent`}>{seg?.segment ?? "Unknown"}</Badge></td>
        <td className="text-right font-mono pr-3"><span className="text-critical font-bold">{record.fa_pct.toFixed(0)}%</span> / <span className="text-critical font-bold">{record.bias_pct.toFixed(0)}%</span></td>
        <td className="pr-3"><Badge variant={rootCauseToVariant(record.root_cause_tag)}>{record.root_cause_tag}</Badge></td>
        <td className="text-right pr-3"><ConfidenceMeter value={record.rca_confidence_pct} /></td>
        <td className="text-right pr-3 font-mono font-bold text-coral">{formatINR(record.financial_impact_inr)}</td>
        <td className="pr-3"><Badge variant={tierToVariant(record.approval_tier)}>{record.approval_tier}</Badge></td>
        <td className="text-right">
          <Button size="sm" variant={isOpen ? "outline" : "primary"} onClick={(e) => { e.stopPropagation(); onToggle(); }}>
            {isOpen ? "Close" : "Open"}
          </Button>
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={10} className="px-0 pb-4">
            <ExceptionDetail record={record} onDecision={onDecision} onClose={onToggle} allData={allData} />
          </td>
        </tr>
      )}
    </>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const color = value >= 80 ? "bg-success" : value >= 60 ? "bg-warning" : "bg-critical";
  return (
    <div className="inline-flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono font-bold text-navy">{value}%</span>
    </div>
  );
}

const EXCEPTION_THINKING_STEPS = [
  "Re-running RCA rules...",
  "Pulling override history...",
  "Calculating confidence breakdown...",
];

const REASON_OPTIONS: Record<string, string[]> = {
  "Data Quality": [
    "Confirmed data error at source",
    "Master data corrected",
    "False positive — data is accurate",
  ],
  "Promo": [
    "Promo realization factor adjusted",
    "Promo lift confirmed accurate",
    "No promo impact found",
  ],
  "Seasonality": [
    "Seasonal pattern confirmed",
    "One-off spike, not seasonal",
    "Seasonal index updated",
  ],
  "Supply": [
    "Reallocation authorized",
    "Supply constraint confirmed temporary",
    "Stock issue resolved at source",
  ],
  "Market Event": [
    "External driver confirmed",
    "Insufficient evidence — holding",
    "Market event resolved",
  ],
};
const FALLBACK_REASONS = ["Reviewed — no issue found", "Resolved manually", "Other"];

function ExceptionDetail({ record, onDecision, onClose, allData }: {
  record: DemandRecord;
  onDecision: (r: DemandRecord, d: "Closed" | "Escalated", reason: string) => void;
  onClose: () => void;
  allData: DemandRecord[];
}) {
  const [ready, setReady] = useState(false);
  const { overrides } = useOverrides();
  const seg = (SKU_SEGMENTS[record.sku_id] ?? { segment: "Stable" as const }).segment;
  const confBreakdown = computeConfidence(
    record.root_cause_tag,
    seg,
    record.rca_signals.length,
    record.rca_signals.length || 1,
    overrides
  );

  // Similar cases — same root cause, different SKU/depot
  const similar = allData
    .filter((r) =>
      r.root_cause_tag === record.root_cause_tag &&
      !(r.sku_id === record.sku_id && r.depot_id === record.depot_id && r.account_id === record.account_id)
    )
    .slice(0, 3);

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [showEscalateForm, setShowEscalateForm] = useState(false);

  const reasonOptions = REASON_OPTIONS[record.root_cause_tag] ?? FALLBACK_REASONS;
  const isAutoClose = record.approval_tier === "Auto-Close";

  const handleAutoResolve = () => {
    onDecision(record, "Closed", "Planner approved agent's recommendation");
  };

  const openEscalateForm = () => {
    setShowEscalateForm(true);
    setSelectedReason(null);
    setNotes("");
  };

  const cancelEscalate = () => {
    setShowEscalateForm(false);
    setSelectedReason(null);
    setNotes("");
  };

  const submitEscalate = () => {
    if (!selectedReason) return;
    const combined = notes.trim() ? `${selectedReason} — ${notes.trim()}` : selectedReason;
    onDecision(record, "Escalated", combined);
  };

  if (!ready) {
    return (
      <div className="bg-cream border border-[#E7DDCB] rounded-xl m-2 px-5 py-4 flex items-center gap-3">
        <AgentThinking steps={EXCEPTION_THINKING_STEPS} onComplete={() => setReady(true)} stepDuration={500} />
      </div>
    );
  }

  return (
    <div className="bg-cream border border-[#E7DDCB] rounded-xl m-2 overflow-hidden">
      <div className="px-5 py-3 bg-navy text-white flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-coral font-bold mb-0.5">Agent Reasoning Trace</div>
          <div className="text-sm font-bold">{record.sku_name} · {record.depot_name} · {record.account_name}</div>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white"><X size={18} /></button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 p-5">
        {/* How the agent found this */}
        <div className="bg-white rounded-lg border border-[#E7DDCB] p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={16} className="text-coral" />
            <h4 className="text-sm font-bold text-navy">How the agent found this</h4>
          </div>
          <p className="text-xs text-navy/80 leading-relaxed mb-3">
            The DemandIQ Agent classified this exception by evaluating signals across the data, promo, supply, and seasonality dimensions.
            The following signals fired:
          </p>
          <ul className="space-y-1.5 mb-3">
            {record.rca_signals.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-navy">
                <span className="w-1.5 h-1.5 rounded-full bg-coral flex-shrink-0 mt-1.5" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <div className="bg-coral-soft rounded-md p-2.5 text-xs text-navy">
            <strong className="text-coral">Classification:</strong> {record.root_cause_tag} (priority rule matched: {record.rca_signals.length} of {record.rca_signals.length || 1} expected signals).
          </div>
        </div>

        {/* Confidence breakdown */}
        <div className="bg-white rounded-lg border border-[#E7DDCB] p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={16} className="text-teal" />
            <h4 className="text-sm font-bold text-navy">Confidence: {record.rca_confidence_pct}%</h4>
          </div>
          <div className="space-y-2 text-xs text-navy/80">
            <div className="flex justify-between"><span className="text-muted">Historical sample size:</span><span className="font-mono font-bold">{confBreakdown.breakdown.sampleSize}</span></div>
            <div className="flex justify-between"><span className="text-muted">Recent validation:</span><span className="font-mono font-bold">{confBreakdown.breakdown.recentValidations}/{confBreakdown.breakdown.recentTotal}</span></div>
            <div className="flex justify-between"><span className="text-muted">Base validation rate:</span><span className="font-mono font-bold">{confBreakdown.breakdown.baseRate}%</span></div>
            <div className="flex justify-between"><span className="text-muted">Rule strength:</span><span className="font-mono font-bold">{Math.round(confBreakdown.breakdown.ruleStrength * 100)}%</span></div>
            <div className="flex justify-between"><span className="text-muted">Segment ({seg}):</span><span className="font-mono font-bold">applied</span></div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F2E9D8] text-[11px] text-navy/70 italic leading-relaxed">
            {confBreakdown.breakdown.explanation}
          </div>
        </div>

        {/* Similar cases */}
        <div className="bg-white rounded-lg border border-[#E7DDCB] p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight size={16} className="text-teal" />
            <h4 className="text-sm font-bold text-navy">Similar Cases</h4>
          </div>
          {similar.length === 0
            ? <div className="text-xs text-muted">No comparable cases in the dataset.</div>
            : (
              <div className="space-y-1.5">
                {similar.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-cream rounded">
                    <span className="text-navy">{s.sku_name} <span className="text-muted">· {s.depot_name}</span></span>
                    <span className="font-mono text-navy/70"><span className="text-critical font-bold">{s.fa_pct.toFixed(0)}%</span> FA, <span className="text-critical font-bold">{s.bias_pct.toFixed(0)}%</span> Bias</span>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Recommended action */}
        <div className="bg-white rounded-lg border-2 border-coral p-4 lg:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-coral" />
            <h4 className="text-sm font-bold text-navy">Agent Recommendation</h4>
          </div>
          <p className="text-xs text-navy leading-relaxed mb-3">{record.recommended_action}</p>
          <div className="text-[11px] text-muted mb-3">
            Owner: <strong className="text-navy">{record.owner}</strong> · SLA: <strong className="text-navy">{record.sla_date}</strong>
          </div>
        </div>

        {/* ── Bottom panel: Auto-Close → read-only card; else → Take Action ── */}
        {isAutoClose ? (
          /* Read-only "Action Taken" card for Auto-Close exceptions */
          <div className="bg-white rounded-lg border border-[#E7DDCB] p-4 lg:col-span-3">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} className="text-success" />
              <h4 className="text-sm font-bold text-navy">Action Taken — Auto-Resolved by Agent</h4>
            </div>
            <p className="text-sm text-navy leading-relaxed mb-3">{record.recommended_action}</p>
            <div className="bg-success/5 border border-success/20 rounded-lg px-3 py-2.5 text-xs text-navy/75 leading-relaxed">
              This exception was automatically resolved based on the agent&apos;s confidence score ({record.rca_confidence_pct}%) and low financial impact ({formatINR(record.financial_impact_inr)}). No planner action required.
            </div>
          </div>
        ) : (
          /* Take Action panel for L1, L2, Director tiers */
          <div className="bg-white rounded-lg border border-[#E7DDCB] p-4 lg:col-span-3">
            <h4 className="text-sm font-bold text-navy mb-3">Take Action</h4>

            {!showEscalateForm ? (
              /* Two-button choice */
              <div className="grid lg:grid-cols-3 gap-3">
                <button
                  onClick={handleAutoResolve}
                  className="p-3 rounded-lg border-2 text-left transition-all border-[#E7DDCB] hover:border-success/50 hover:bg-success/5"
                >
                  <div className="text-sm font-bold text-navy mb-1">Auto-Resolve</div>
                  <div className="text-[11px] text-muted">Approve the agent&apos;s recommendation and close the exception immediately.</div>
                </button>
                <button
                  onClick={openEscalateForm}
                  className="p-3 rounded-lg border-2 text-left transition-all border-[#E7DDCB] hover:border-warning/50 hover:bg-warning/5"
                >
                  <div className="text-sm font-bold text-navy mb-1">Escalate to Human</div>
                  <div className="text-[11px] text-muted">Route to next approval tier for review. Requires a reason.</div>
                </button>
              </div>
            ) : (
              /* Escalate form — reason radios + notes */
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Reason (required)</div>
                  <div className="space-y-1.5">
                    {reasonOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedReason(opt)}
                        className={`w-full text-left px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                          selectedReason === opt
                            ? "border-coral bg-coral/5 text-navy font-semibold"
                            : "border-[#E7DDCB] text-navy/80 hover:border-coral/40 hover:bg-cream"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                            selectedReason === opt ? "border-coral bg-coral" : "border-[#C4B9A8]"
                          }`}>
                            {selectedReason === opt && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                          </span>
                          {opt}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1.5">
                    Additional notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add context or observations..."
                    rows={2}
                    className="w-full px-3 py-2 bg-cream border border-[#E7DDCB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral/30 resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={cancelEscalate}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={submitEscalate} disabled={!selectedReason}>Submit decision</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
