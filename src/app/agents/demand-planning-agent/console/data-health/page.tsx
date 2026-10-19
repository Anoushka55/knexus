"use client";
import { useState, useRef, useMemo, useCallback } from "react";
import { Card, CardHeader } from "@/lib/demand-planning/ui/Card";
import { Badge } from "@/lib/demand-planning/ui/Badge";
import { Button } from "@/lib/demand-planning/ui/Button";
import { AgentInsightCard } from "@/lib/demand-planning/ui/AgentInsightCard";
import { useDataContext } from "@/lib/demand-planning/state/dataContext";
import { parseCsvFile } from "@/lib/demand-planning/data/csvImport";
import { Database, ShieldCheck, AlertCircle, Mail, Clock, Sparkles, CheckCircle2, RefreshCw, Upload, ChevronDown, ChevronRight, FileText, X } from "lucide-react";

interface Source {
  name: string;
  status: "Reconciled" | "Pending Review";
  lastSynced: string;
  conflictDescription?: string;
}

const initialSources: Source[] = [
  { name: "Sales System (ERP)", status: "Reconciled", lastSynced: "2026-06-12 08:00 AM" },
  { name: "Inventory System (WMS)", status: "Pending Review", lastSynced: "2026-06-12 09:15 AM", conflictDescription: "New field 'reserved_qty' detected in incoming feed but not mapped to demand model. Schema version bumped from 2.4 to 2.5." },
  { name: "Promo Calendar System", status: "Reconciled", lastSynced: "2026-06-11 11:30 PM" },
  { name: "Logistics Master Data", status: "Reconciled", lastSynced: "2026-06-12 04:45 AM" },
];

interface DetectedIssue {
  id: string;
  description: string;
  suggestion: string;
  status: "Needs Approval" | "Auto-Resolved" | "Resolved";
}

const initialDetectedIssues: DetectedIssue[] = [
  {
    id: "DI001",
    description: "Ultra-Hydrate 1L showing 3 consecutive months of Bias > 25% — possible structural shift in demand pattern.",
    suggestion: "Recalibrate forecast baseline for this SKU/Depot combination using last 6 months as the new reference window.",
    status: "Needs Approval",
  },
  {
    id: "DI002",
    description: "Promo Calendar feed missed a planned promotion entry for CleanMax Detergent 2kg in 2026-06.",
    suggestion: "Backfilled entry from historical promo log. Awaiting confirmation.",
    status: "Needs Approval",
  },
  {
    id: "DI003",
    description: "Outlier detected in PowerGrain Bar 50g — Mumbai Logistics Park (offtake 3.4σ above mean).",
    suggestion: "Auto-flagged. Confidence is high (89%) that this is a one-off event. Excluded from baseline calc.",
    status: "Auto-Resolved",
  },
];

export default function DataHealthPage() {
  const [sources, setSources] = useState(initialSources);
  const [issues, setIssues] = useState(initialDetectedIssues);
  const [modalSource, setModalSource] = useState<Source | null>(null);

  const { activeDataset, dataSource, uploadedFileName, setUploadedData, resetToMockData } = useDataContext();

  // CSV upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState<{ fileName: string; recordCount: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formatOpen, setFormatOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dqAlerts = useMemo(
    () => activeDataset.filter((r) => r.data_quality_flag !== "none").slice(0, 6),
    [activeDataset]
  );

  const [pendingRecords, setPendingRecords] = useState<{ records: ReturnType<typeof Array.prototype.filter>; fileName: string } | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setUploadErrors(["Only .csv files are supported."]);
      setUploadSuccess(null);
      return;
    }
    setIsProcessing(true);
    setUploadErrors([]);
    setUploadSuccess(null);
    const result = await parseCsvFile(file);
    setIsProcessing(false);
    if (result.errors.length > 0) {
      setUploadErrors(result.errors);
    } else {
      setUploadSuccess({ fileName: file.name, recordCount: result.records.length });
      // Don't auto-switch — let the user click "Switch to this data"
      setPendingRecords({ records: result.records, fileName: file.name });
    }
  }, []);

  const activateUpload = () => {
    if (!pendingRecords) return;
    setUploadedData(pendingRecords.records as Parameters<typeof setUploadedData>[0], pendingRecords.fileName);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const resolveSource = () => {
    if (!modalSource) return;
    setSources((prev) => prev.map((s) => s.name === modalSource.name ? { ...s, status: "Reconciled", lastSynced: "Just now" } : s));
    setModalSource(null);
  };

  const decideIssue = (id: string, decision: "approve" | "dismiss") => {
    setIssues((prev) => prev.map((i) => i.id === id ? { ...i, status: decision === "approve" ? "Resolved" : "Auto-Resolved" } : i));
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-coral font-bold">Health Check Agent</div>
        <h1 className="text-3xl font-extrabold text-navy mt-1">Data Health</h1>
        <p className="text-sm text-muted mt-1">Manage and reconcile autonomous data pipelines.</p>
      </div>

      <AgentInsightCard
        sentiment="neutral"
        text="One data source (Inventory System) has a pending schema review. Resolving this should reduce data quality alerts by ~15% based on historical patterns."
      />

      {/* Data Source Card */}
      <Card>
        <CardHeader
          title="Data Source"
          subtitle="Connect your own CSV or continue with the loaded dataset"
          icon={<Upload size={18} />}
          action={
            <Badge variant={dataSource === "mock" ? "navy" : "success"}>
              {dataSource === "mock" ? "India FMCG Dataset" : (uploadedFileName ?? "Uploaded")}
            </Badge>
          }
        />

        {/* Current source status */}
        {dataSource === "uploaded" && (
          <div className="mb-4 bg-success/5 border border-success/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <CheckCircle2 size={18} className="text-success flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-navy">{uploadedFileName}</div>
              <div className="text-xs text-muted">{activeDataset.length} records loaded · Full RCA pipeline applied</div>
            </div>
            <Button size="sm" variant="outline" onClick={resetToMockData}>
              Switch to built-in dataset
            </Button>
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-colors px-6 py-10 flex flex-col items-center justify-center gap-3 text-center
            ${isDragging ? "border-coral bg-coral/5" : "border-[#E7DDCB] bg-cream hover:border-coral hover:bg-coral/5"}`}
        >
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
          {isProcessing ? (
            <>
              <RefreshCw size={28} className="text-coral animate-spin" />
              <div className="text-sm font-semibold text-navy">Parsing CSV…</div>
            </>
          ) : (
            <>
              <Upload size={28} className={isDragging ? "text-coral" : "text-muted"} />
              <div>
                <div className="text-sm font-semibold text-navy">Drag &amp; drop a CSV file here</div>
                <div className="text-xs text-muted mt-1">or click to browse · .csv files only</div>
              </div>
            </>
          )}
        </div>

        {/* Upload errors */}
        {uploadErrors.length > 0 && (
          <div className="mt-3 bg-critical/5 border border-critical/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <X size={16} className="text-critical" />
              <span className="text-sm font-bold text-critical">Upload failed</span>
            </div>
            <ul className="space-y-1">
              {uploadErrors.map((e, i) => (
                <li key={i} className="text-xs text-critical flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">•</span> {e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload success */}
        {uploadSuccess && dataSource !== "uploaded" && (
          <div className="mt-3 bg-success/5 border border-success/30 rounded-xl p-4 flex items-center gap-4">
            <CheckCircle2 size={20} className="text-success flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-navy">{uploadSuccess.fileName}</div>
              <div className="text-xs text-muted">{uploadSuccess.recordCount} records parsed · RCA pipeline ready</div>
            </div>
            <Button size="sm" variant="primary" onClick={activateUpload}>
              Switch to this data
            </Button>
          </div>
        )}

        {/* Collapsible expected format */}
        <button
          onClick={() => setFormatOpen((v) => !v)}
          className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted hover:text-navy transition-colors"
        >
          {formatOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Expected CSV format
        </button>
        {formatOpen && (
          <div className="mt-2 bg-cream rounded-xl border border-[#E7DDCB] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E7DDCB] flex items-center gap-2">
              <FileText size={14} className="text-teal" />
              <span className="text-xs font-semibold text-navy">Required column headers</span>
              <span className="text-xs text-muted">(case-insensitive, spaces/hyphens treated as underscores)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted text-left border-b border-[#E7DDCB]">
                    <th className="font-bold py-2 px-4">Column</th>
                    <th className="font-bold py-2 px-4">Type</th>
                    <th className="font-bold py-2 px-4">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {CSV_FORMAT_EXAMPLES.map((row) => (
                    <tr key={row.col} className="border-b border-[#F2E9D8] last:border-0">
                      <td className="py-1.5 px-4 font-mono text-navy font-semibold">{row.col}</td>
                      <td className="py-1.5 px-4 text-muted">{row.type}</td>
                      <td className="py-1.5 px-4 font-mono text-navy/70">{row.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Freshness banner */}
      <div className="bg-success/10 border border-success/30 rounded-xl px-4 py-3 flex items-center gap-3">
        <CheckCircle2 size={20} className="text-success flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-navy">Data refresh complete</div>
          <div className="text-xs text-muted">Last sync: {today} · All sources within tolerance</div>
        </div>
        <Badge variant="success">Auto-Synced</Badge>
      </div>

      <Card>
        <CardHeader
          title="Data Sources"
          subtitle="Status of source system connections and reconciliation"
          icon={<Database size={18} />}
          action={
            <Badge variant="teal" className="flex items-center gap-1.5">
              <ShieldCheck size={12} /> Autonomous Guardrails Active
            </Badge>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted text-left">
                <th className="font-bold pb-3 pr-3">Source System</th>
                <th className="font-bold pb-3 pr-3">Status</th>
                <th className="font-bold pb-3 pr-3">Last Synced</th>
                <th className="font-bold pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.name} className="border-t border-[#F2E9D8]">
                  <td className="py-3 pr-3 text-sm font-semibold text-navy">{s.name}</td>
                  <td className="pr-3">
                    {s.status === "Reconciled"
                      ? <Badge variant="success">✓ Reconciled</Badge>
                      : <Badge variant="warning">⚠ Pending Review</Badge>}
                  </td>
                  <td className="pr-3 text-xs text-navy/70 font-mono">{s.lastSynced}</td>
                  <td className="text-right">
                    {s.status === "Pending Review"
                      ? <Button size="sm" variant="primary" onClick={() => setModalSource(s)}>Resolve</Button>
                      : <span className="text-[11px] text-teal font-semibold inline-flex items-center gap-1"><RefreshCw size={11} /> Auto-Syncing</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 bg-teal-soft border border-teal/30 rounded-lg p-3 flex items-start gap-2.5">
          <ShieldCheck size={16} className="text-teal mt-0.5 flex-shrink-0" />
          <div className="text-xs text-navy/80 leading-relaxed">
            <strong className="text-navy">Autonomous Guardrail Note:</strong> The DemandIQ Agent auto-reconciles 95% of records within tolerance thresholds.
            Structural conflicts (schema mismatches, metadata shifts) require explicit human approval to maintain system integrity.
          </div>
        </div>
      </Card>

      {/* Detected Issues */}
      <Card>
        <CardHeader
          title="Detected Issues"
          subtitle="New problems identified by the agent in this cycle"
          icon={<AlertCircle size={18} />}
        />
        <div className="space-y-3">
          {issues.map((i) => (
            <div key={i.id} className="bg-cream border border-[#E7DDCB] rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold text-muted">{i.id}</span>
                    {i.status === "Needs Approval" && <Badge variant="warning">Needs Approval</Badge>}
                    {i.status === "Auto-Resolved" && <Badge variant="info">Auto-Resolved</Badge>}
                    {i.status === "Resolved" && <Badge variant="success">✓ Resolved</Badge>}
                  </div>
                  <div className="text-sm font-semibold text-navy mb-1">{i.description}</div>
                  <div className="text-xs text-muted flex items-start gap-1.5">
                    <Sparkles size={12} className="text-teal mt-0.5 flex-shrink-0" />
                    <span><strong className="text-teal">Agent suggests:</strong> {i.suggestion}</span>
                  </div>
                </div>
                {i.status === "Needs Approval" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="primary" onClick={() => decideIssue(i.id, "approve")}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => decideIssue(i.id, "dismiss")}>Dismiss</Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Data Quality Alerts + Agent Activity Log */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Data Quality Alerts" subtitle="Transactional and master data flags detected by agent" icon={<AlertCircle size={18} />} />
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted text-left">
                <th className="font-bold pb-2 pr-3">SKU / Depot</th>
                <th className="font-bold pb-2 pr-3">Flag Type</th>
                <th className="font-bold pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {dqAlerts.length === 0 && (
                <tr><td colSpan={3} className="text-center py-6 text-xs text-muted">No data quality alerts in current dataset.</td></tr>
              )}
              {dqAlerts.map((r, i) => (
                <tr key={i} className="border-t border-[#F2E9D8]">
                  <td className="py-2.5 pr-3">
                    <div className="font-semibold text-navy text-[13px]">{r.sku_name}</div>
                    <div className="text-[11px] text-muted">{r.depot_name} · {r.period}</div>
                  </td>
                  <td className="pr-3"><Badge variant="teal">{r.data_quality_flag.replace("_", " ")}</Badge></td>
                  <td className="text-right">
                    {r.data_quality_flag === "outlier" || r.data_quality_flag === "missing_value"
                      ? <Badge variant="teal"><Mail size={10} className="inline mr-1" /> Auto-mail sent</Badge>
                      : <Badge variant="warning">Pending Correction</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader title="Agent Activity Log" subtitle="Real-time autonomous decision stream" icon={<Clock size={18} />} />
          <div className="space-y-3">
            {[
              { icon: <Mail size={14} />, ago: "10 mins ago", text: "Agent flagged outlier in Ultra-Hydrate 500ml / Delhi Hub — auto-mail sent to data owner." },
              { icon: <RefreshCw size={14} />, ago: "1 hour ago", text: "Daily sync completed successfully for Sales System (ERP)." },
              { icon: <Sparkles size={14} />, ago: "2 hours ago", text: "Agent detected seasonal shift in Beverages — baseline adjusted by +8% for next quarter." },
              { icon: <AlertCircle size={14} />, ago: "4 hours ago", text: "Stock-out risk predicted for DailyGrain Rice 10kg in Mumbai Logistics Park." },
              { icon: <Sparkles size={14} />, ago: "Yesterday", text: "Agent auto-closed 12 low-impact bias exceptions based on historical validation." },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-[#F2E9D8] last:border-0 last:pb-0">
                <div className="w-7 h-7 rounded-lg bg-teal-soft text-teal flex items-center justify-center flex-shrink-0">{a.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-navy leading-snug">{a.text}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted font-bold mt-1">{a.ago}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Resolve modal */}
      {modalSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm" onClick={() => setModalSource(null)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-navy mb-2">Schema Conflict Resolution</h3>
            <p className="text-sm text-muted mb-1 font-semibold">{modalSource.name}</p>
            <p className="text-sm text-navy mb-5 leading-relaxed">{modalSource.conflictDescription}</p>
            <div className="bg-teal-soft rounded-lg p-3 mb-5 text-xs text-navy">
              <strong className="text-teal">Agent recommends:</strong> Approve the new field mapping. The agent will treat the new field as optional input and reconcile across both schema versions.
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setModalSource(null)}>Cancel</Button>
              <Button variant="primary" onClick={resolveSource}>Approve Mapping</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const CSV_FORMAT_EXAMPLES: Array<{ col: string; type: string; example: string }> = [
  { col: "sku_id", type: "string", example: "SKU001" },
  { col: "sku_name", type: "string", example: "Sunrise Atta 5kg" },
  { col: "category", type: "string", example: "Staples" },
  { col: "brand_name", type: "string", example: "Sunrise" },
  { col: "depot_id", type: "string", example: "DEP_MUM" },
  { col: "depot_name", type: "string", example: "Mumbai Logistics Park" },
  { col: "account_id", type: "string", example: "ACC_RL" },
  { col: "account_name", type: "string", example: "Reliance Retail" },
  { col: "period", type: "YYYY-MM", example: "2025-07" },
  { col: "forecast_qty", type: "number", example: "1200" },
  { col: "sell_in_qty", type: "number", example: "1150" },
  { col: "offtake_qty", type: "number", example: "1100" },
  { col: "stock_on_hand", type: "number", example: "2200" },
  { col: "lead_time_days", type: "number", example: "7" },
  { col: "promo_flag", type: "true/false", example: "false" },
  { col: "promo_lift_pct", type: "number", example: "0" },
  { col: "promo_has_history", type: "true/false", example: "false" },
];
