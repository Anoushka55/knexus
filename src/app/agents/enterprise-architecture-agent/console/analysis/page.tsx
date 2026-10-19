"use client";

import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, Sparkles, Image as ImageIcon, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { useSession } from "@/lib/enterprise-architecture/session";
import { timeIngest, timeFull, type TimeIngestResponse } from "@/lib/enterprise-architecture/client";
import { INDUSTRIES } from "@/lib/enterprise-architecture/types";
import { INDUSTRY_CONTEXT } from "@/lib/enterprise-architecture/industryContext";
import { Card, Pill, StatTile, ActionBadge, Spinner, EmptyState } from "@/components/enterprise-architecture/primitives";

export default function AnalysisPage() {
  const { eaContext, setEaContext, timeResult, setTimeResult } = useSession();
  const [ingest, setIngest] = useState<TimeIngestResponse | null>(null);
  const [freeText, setFreeText] = useState("");
  const [busy, setBusy] = useState<"ingest" | "narrative" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const subSectors = INDUSTRY_CONTEXT[eaContext.industry]?.sub_sectors ?? [];

  async function handleFile(file: File) {
    setError(null);
    setBusy("ingest");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "json") {
        const text = await file.text();
        const data = JSON.parse(text);
        const rows = Array.isArray(data) ? data : Object.values(data)[0];
        const res = await timeIngest({ applications: rows as Record<string, unknown>[] });
        setIngest(res);
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
        const res = await timeIngest({ applications: rows });
        setIngest(res);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function handleImage(file: File) {
    setError(null);
    setBusy("ingest");
    try {
      const data = await fileToBase64(file);
      const res = await timeIngest({ image: { data, media_type: file.type || "image/png" } });
      setIngest(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function handleFreeText() {
    if (!freeText.trim()) return;
    setError(null);
    setBusy("ingest");
    try {
      const res = await timeIngest({ free_text: freeText });
      setIngest(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function generateNarrative() {
    if (!ingest) return;
    setError(null);
    setBusy("narrative");
    try {
      const result = await timeFull({
        applications: ingest.applications,
        industry: eaContext.industry,
        sub_sector: eaContext.sub_sector,
      });
      setTimeResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const activeResult = timeResult ?? (ingest ? { applications: ingest.applications, duplications: ingest.duplications, portfolio_summary: ingest.summary, assessment: {} } : null);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Step 1 — EA Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Portfolio Rationalization (TIME / 6R): upload your application inventory to score every tool and
          detect redundancy.
        </p>
      </div>

      <Card title="Context">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs">
            <span className="block mb-1 text-muted-foreground">Industry</span>
            <select
              className="w-full h-9 border border-border rounded-ea-sm px-2 bg-background text-sm"
              value={eaContext.industry}
              onChange={(e) => setEaContext({ industry: e.target.value, sub_sector: "" })}
            >
              <option value="">Select industry…</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-muted-foreground">Sub-sector</span>
            <select
              className="w-full h-9 border border-border rounded-ea-sm px-2 bg-background text-sm disabled:opacity-50"
              value={eaContext.sub_sector}
              disabled={!subSectors.length}
              onChange={(e) => setEaContext({ sub_sector: e.target.value })}
            >
              <option value="">None</option>
              {subSectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card title="Upload Portfolio" subtitle="CSV, Excel (.xlsx/.xls), or JSON">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => fileInput.current?.click()}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 h-10 px-4 border border-border rounded-ea-sm text-sm hover:border-navy disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" /> Upload CSV / Excel / JSON
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <button
            onClick={() => imageInput.current?.click()}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 h-10 px-4 border border-border rounded-ea-sm text-sm hover:border-navy disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4" /> Upload Image (slide / diagram)
          </button>
          <input
            ref={imageInput}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
          />
        </div>

        <div className="mt-4">
          <span className="block mb-1 text-xs text-muted-foreground">Or paste free text describing your applications</span>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={4}
            placeholder="e.g. We run Salesforce for CRM, SAP ECC for ERP (15 years old), Splunk for logging..."
            className="w-full border border-border rounded-ea-sm p-2.5 text-sm bg-background"
          />
          <button
            onClick={handleFreeText}
            disabled={busy !== null || !freeText.trim()}
            className="mt-2 inline-flex items-center gap-2 h-9 px-3.5 bg-navy text-white rounded-ea-sm text-sm disabled:opacity-50"
          >
            {busy === "ingest" ? <Spinner /> : <Upload className="w-4 h-4" />} Extract &amp; Score
          </button>
        </div>

        {busy === "ingest" && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Parsing and scoring portfolio…
          </div>
        )}
        {error && <div className="mt-3 text-xs text-crimson">{error}</div>}
      </Card>

      {activeResult && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Applications" value={activeResult.portfolio_summary.total_apps} />
            <StatTile
              label="Total annual cost"
              value={`$${activeResult.portfolio_summary.total_annual_cost.toLocaleString()}`}
            />
            <StatTile label="Duplications found" value={activeResult.portfolio_summary.duplications_found} />
            <StatTile
              label="Potential savings"
              value={`$${activeResult.portfolio_summary.potential_savings.toLocaleString()}`}
              tone="success"
            />
          </div>

          <Card
            title="Scored Applications"
            subtitle={`${activeResult.applications.length} apps`}
            action={
              !timeResult && (
                <button
                  onClick={generateNarrative}
                  disabled={busy !== null}
                  className="inline-flex items-center gap-2 h-8 px-3 bg-navy text-white rounded-ea-sm text-xs disabled:opacity-50"
                >
                  {busy === "narrative" ? <Spinner /> : <Sparkles className="w-3.5 h-3.5" />} Generate Executive
                  Assessment
                </button>
              )
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-1.5 pr-3">Name</th>
                    <th className="py-1.5 pr-3">Category</th>
                    <th className="py-1.5 pr-3">6R Action</th>
                    <th className="py-1.5 pr-3">Composite</th>
                    <th className="py-1.5 pr-3">Annual Cost</th>
                    <th className="py-1.5 pr-3">Users</th>
                    <th className="py-1.5 pr-3">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {activeResult.applications.map((a) => (
                    <tr key={a.id} className="border-b border-border/60">
                      <td className="py-1.5 pr-3 font-medium">{a.name}</td>
                      <td className="py-1.5 pr-3 text-muted-foreground">{a.category}</td>
                      <td className="py-1.5 pr-3">
                        <ActionBadge action={a.rationalization_action} />
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums">{a.composite_score?.toFixed(1)}</td>
                      <td className="py-1.5 pr-3 tabular-nums">
                        {a.annual_cost ? `$${a.annual_cost.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums">{a.user_count ?? "—"}</td>
                      <td className="py-1.5 pr-3 text-muted-foreground">{a.confidence_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {activeResult.duplications.length > 0 && (
            <Card title="Duplication / Consolidation Opportunities">
              <div className="space-y-2">
                {activeResult.duplications.map((d) => (
                  <div key={d.id} className="border border-border rounded-ea-sm p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {d.tool_a} ↔ {d.tool_b}
                      </span>
                      <div className="flex items-center gap-2">
                        <Pill tone={d.priority === "High" ? "crimson" : d.priority === "Medium" ? "amber" : "muted"}>
                          {d.priority}
                        </Pill>
                        <span className="text-xs text-muted-foreground">{d.overlap_percentage}% overlap</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{d.rationale}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {timeResult?.assessment?.executive_summary && (
            <Card title="Executive Assessment">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{timeResult.assessment.executive_summary}</p>
              {timeResult.assessment.top_recommendations && timeResult.assessment.top_recommendations.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Top Recommendations</h4>
                  {timeResult.assessment.top_recommendations.map((r, i) => (
                    <div key={i} className="border border-border rounded-ea-sm p-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          #{r.rank} {r.title}
                        </span>
                        <Pill tone={r.priority === "Critical" ? "crimson" : r.priority === "High" ? "amber" : "default"}>
                          {r.priority}
                        </Pill>
                      </div>
                      <p className="text-muted-foreground mt-1">{r.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {!activeResult && !busy && (
        <Card>
          <EmptyState
            icon={<FileSpreadsheet className="w-10 h-10" />}
            title="No portfolio loaded yet"
            body="Upload a CSV/Excel/JSON inventory, an architecture slide image, or paste free text to begin scoring."
          />
        </Card>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
