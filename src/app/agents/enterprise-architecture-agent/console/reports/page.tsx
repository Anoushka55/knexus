"use client";

import { useMemo, useState } from "react";
import { FileBarChart, Printer, Trash2 } from "lucide-react";
import { useSession } from "@/lib/enterprise-architecture/session";
import { generatePipelineHtml } from "@/lib/enterprise-architecture/reportHtml";
import { Card, Pill, EmptyState } from "@/components/enterprise-architecture/primitives";

export default function ReportsPage() {
  const { savedReports, deleteReport, buildPipeline, timeResult } = useSession();
  const [viewingId, setViewingId] = useState<string | null>(null);

  const viewing = savedReports.find((r) => r.id === viewingId);
  const liveHtml = useMemo(() => generatePipelineHtml(buildPipeline()), [buildPipeline]);
  const html = viewing ? generatePipelineHtml(viewing.pipeline) : liveHtml;

  function printReport() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Saved pipeline runs and the live preview of the current session's results. Print or
            &quot;Save as PDF&quot; from the browser's print dialog.
          </p>
        </div>
        <button
          onClick={printReport}
          disabled={!timeResult && !viewing}
          className="inline-flex items-center gap-2 h-9 px-3.5 bg-navy text-white rounded-ea-sm text-sm disabled:opacity-50"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Saved Reports" className="lg:col-span-1">
          {savedReports.length === 0 ? (
            <EmptyState
              icon={<FileBarChart className="w-8 h-8" />}
              title="No saved reports yet"
              body="Run the full pipeline from Command Center to generate and save a report."
            />
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setViewingId(null)}
                className={`w-full text-left border rounded-ea-sm p-2.5 text-xs ${!viewingId ? "border-navy bg-navy/5" : "border-border"}`}
              >
                <div className="font-medium">Live session preview</div>
                <div className="text-muted-foreground">Current, unsaved pipeline state</div>
              </button>
              {savedReports.map((r) => (
                <div
                  key={r.id}
                  className={`border rounded-ea-sm p-2.5 text-xs cursor-pointer ${viewingId === r.id ? "border-navy bg-navy/5" : "border-border"}`}
                  onClick={() => setViewingId(r.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{r.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteReport(r.id);
                        if (viewingId === r.id) setViewingId(null);
                      }}
                      className="text-muted-foreground hover:text-crimson"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-muted-foreground mt-0.5">{new Date(r.createdAt).toLocaleString()}</div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {r.pipeline.pipeline_summary.maturity_score !== undefined && r.pipeline.pipeline_summary.maturity_score !== null && (
                      <Pill tone="blue">Maturity {r.pipeline.pipeline_summary.maturity_score}/5</Pill>
                    )}
                    <Pill tone="muted">{r.pipeline.pipeline_summary.total_apps_assessed} apps</Pill>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <section className="lg:col-span-2 bg-surface border border-border rounded-ea-md overflow-hidden">
          <header className="flex items-center h-11 px-4 border-b border-border">
            <h3 className="text-[13px] font-semibold text-foreground">Report Preview</h3>
          </header>
          <iframe title="EA report preview" srcDoc={html} className="w-full h-[70vh] border-0 bg-white block" />
        </section>
      </div>
    </div>
  );
}
