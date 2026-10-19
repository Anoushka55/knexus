"use client";
import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/lib/demand-planning/ui/Card";
import { Badge } from "@/lib/demand-planning/ui/Badge";
import { Button } from "@/lib/demand-planning/ui/Button";
import { FilterBar } from "@/lib/demand-planning/ui/FilterBar";
import { AgentInsightCard } from "@/lib/demand-planning/ui/AgentInsightCard";
import { SKU_SEGMENTS, getSegmentColor } from "@/lib/demand-planning/data/mockData";
import { DEFAULT_FILTERS, applyFilters, Filters } from "@/lib/demand-planning/data/options";
import { useDataContext } from "@/lib/demand-planning/state/dataContext";
import { AgentThinking } from "@/lib/demand-planning/ui/AgentThinking";
import { formatINR, formatNumber } from "@/lib/demand-planning/utils";
import { Package, CheckCircle2, X } from "lucide-react";

export default function CoveragePage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [approved, setApproved] = useState<Record<string, boolean>>({});
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [dialogReady, setDialogReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { activeDataset } = useDataContext();

  const filtered = useMemo(() => applyFilters(activeDataset, filters), [activeDataset, filters]);
  const latestPeriod = useMemo(() => [...filtered].map((r) => r.period).sort().pop(), [filtered]);
  const latest = useMemo(() => filtered.filter((r) => r.period === latestPeriod), [filtered, latestPeriod]);

  const rows = useMemo(() =>
    [...latest].sort((a, b) => a.coverage_weeks - b.coverage_weeks),
    [latest]
  );

  const lowCoverage = rows.filter((r) => r.coverage_weeks < 2);
  const totalExposure = lowCoverage.reduce((s, r) => {
    const price = r.category === "Staples" ? 280 : r.category === "Beverages" ? 65 : r.category === "Home Care" ? 220 : r.category === "Personal Care" ? 150 : 45;
    return s + Math.max(0, r.offtake_qty - r.stock_on_hand) * price;
  }, 0);

  const key = (r: typeof rows[0]) => `${r.sku_id}|${r.depot_id}|${r.account_id}`;

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const closeDialog = () => { setConfirmKey(null); setDialogReady(false); };

  const approve = () => {
    if (!confirmKey) return;
    setApproved((p) => ({ ...p, [confirmKey]: true }));
    closeDialog();
    showToast("Reallocation approved — Supply Agent will execute on next cycle.");
  };

  const confirmRecord = confirmKey ? rows.find((r) => key(r) === confirmKey) : null;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-coral font-bold">Supply Agent</div>
        <h1 className="text-3xl font-extrabold text-navy mt-1">Coverage &amp; Reallocation</h1>
        <p className="text-sm text-muted mt-1">Stock coverage analysis with autonomous reallocation recommendations.</p>
      </div>

      <AgentInsightCard
        sentiment={lowCoverage.length > 0 ? "negative" : "positive"}
        text={lowCoverage.length > 0
          ? `${lowCoverage.length} SKU-depot-account combinations are below the 2-week safety threshold. The Supply Agent recommends reallocation from surplus depots with combined coverage > 5 weeks.`
          : "All SKU-depot-account combinations are above the 2-week safety threshold. No reallocation required this cycle."}
      />

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Combos Below 2 Weeks</div>
          <div className="text-4xl font-extrabold text-coral mt-2">{lowCoverage.length}</div>
          <div className="text-xs text-muted mt-1">of {rows.length} total combinations</div>
        </Card>
        <Card>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Financial Exposure</div>
          <div className="text-4xl font-extrabold text-coral mt-2">{formatINR(totalExposure)}</div>
          <div className="text-xs text-muted mt-1">Estimated lost-sale risk</div>
        </Card>
        <Card>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Actions Approved</div>
          <div className="text-4xl font-extrabold text-success mt-2">{Object.values(approved).filter(Boolean).length}</div>
          <div className="text-xs text-muted mt-1">This session</div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Coverage by SKU × Depot × Account" subtitle="Latest period — sorted by lowest coverage first" icon={<Package size={18} />} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted text-left">
                <th className="font-bold py-3 pr-3">SKU</th>
                <th className="font-bold py-3 pr-3">Depot</th>
                <th className="font-bold py-3 pr-3">Account</th>
                <th className="font-bold py-3 pr-3">Segment</th>
                <th className="font-bold py-3 pr-3 text-right">Stock on Hand</th>
                <th className="font-bold py-3 pr-3 text-right">Lead Time</th>
                <th className="font-bold py-3 pr-3 text-right">Coverage</th>
                <th className="font-bold py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const k = key(r);
                const isLow = r.coverage_weeks < 2;
                const isMed = r.coverage_weeks >= 2 && r.coverage_weeks < 4;
                const seg = SKU_SEGMENTS[r.sku_id];
                const segColor = getSegmentColor(seg.segment);
                const covVariant = isLow ? "critical" : isMed ? "warning" : "success";
                return (
                  <tr key={k} className="border-b border-[#F2E9D8]">
                    <td className="py-3 pr-3 font-semibold text-navy text-[13px]">{r.sku_name}</td>
                    <td className="text-xs text-navy/80 pr-3">{r.depot_name}</td>
                    <td className="text-xs text-navy/80 pr-3">{r.account_name}</td>
                    <td className="pr-3"><Badge variant="navy" className={`${segColor.bg} ${segColor.text} border-transparent`}>{seg.segment}</Badge></td>
                    <td className="text-right font-mono pr-3">{formatNumber(r.stock_on_hand)}</td>
                    <td className="text-right font-mono pr-3 text-navy/70 text-xs">{r.lead_time_days}d</td>
                    <td className="text-right pr-3">
                      <Badge variant={covVariant}>{r.coverage_weeks.toFixed(1)} wks</Badge>
                    </td>
                    <td className="text-right">
                      {isLow
                        ? approved[k]
                          ? <Badge variant="success"><CheckCircle2 size={11} className="inline mr-1" />Approved</Badge>
                          : <Button size="sm" variant="primary" onClick={() => { setConfirmKey(k); setDialogReady(false); }}>Approve Reallocation</Button>
                        : <span className="text-[11px] text-muted italic">No action needed</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {confirmRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm" onClick={closeDialog}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-coral font-bold">Confirm Reallocation</div>
                <h3 className="text-lg font-bold text-navy mt-1">Approve Supply Agent Action</h3>
              </div>
              <button onClick={closeDialog} className="text-muted hover:text-navy"><X size={20} /></button>
            </div>
            {!dialogReady ? (
              <div className="py-4">
                <AgentThinking
                  steps={["Agent validating reallocation feasibility..."]}
                  onComplete={() => setDialogReady(true)}
                  stepDuration={1000}
                />
              </div>
            ) : (
              <>
                <div className="bg-cream rounded-lg p-3 mb-4 text-sm">
                  <div className="font-semibold text-navy">{confirmRecord.sku_name}</div>
                  <div className="text-xs text-muted">{confirmRecord.depot_name} · {confirmRecord.account_name}</div>
                  <div className="mt-2 text-xs text-navy/80">
                    Current coverage: <strong className="text-critical">{confirmRecord.coverage_weeks.toFixed(1)} weeks</strong> ·
                    Lead time: <strong>{confirmRecord.lead_time_days} days</strong>
                  </div>
                </div>
                <p className="text-sm text-navy mb-4 leading-relaxed">{confirmRecord.recommended_action}</p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button variant="primary" onClick={approve}>Approve &amp; Trigger</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-navy text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-2 text-sm">
          <CheckCircle2 size={18} className="text-success" /> {toast}
        </div>
      )}
    </div>
  );
}
