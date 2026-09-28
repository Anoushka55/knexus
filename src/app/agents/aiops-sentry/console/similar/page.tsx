"use client";

import { useState } from "react";
import { Search, ShieldCheck, ArrowRight } from "lucide-react";
import { Card, Pill } from "@/components/aiops/primitives";
import { ConfidenceBar } from "@/components/aiops/charts";
import {
  actionById,
  getProblems,
  playbooks,
  recommendedActions,
  remediationHistory,
  serviceName,
} from "@/lib/aiops";
import { relative, useSession } from "@/lib/aiops/session";

export default function RemediationPage() {
  const { shift } = useSession();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(remediationHistory[0].id);

  const active = getProblems(shift).filter((p) => p.status !== "Resolved");
  const records = remediationHistory.filter((r) =>
    query.trim() === ""
      ? true
      : `${r.problemId} ${r.recommendation} ${r.action} ${r.result}`
          .toLowerCase()
          .includes(query.toLowerCase()),
  );
  const selected = records.find((r) => r.id === selectedId) ?? records[0];

  /** Which of today's problems the platform would recommend the same action for. */
  const precedentFor = (recommendation: string) =>
    active.filter((p) => actionById[p.recommendedActionId]?.title === recommendation);

  return (
    <div className="p-5 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-navy">Remediation History</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          What was recommended before, what was approved, what was executed and whether it was
          verified. This is the evidence base behind today&apos;s recommendations.
        </p>
      </div>

      <Card>
        <div className="flex items-center gap-2 -m-1">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-9 bg-transparent text-sm focus:outline-none"
            placeholder="Search past remediations by incident, action or outcome…"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-xs text-blue hover:underline">
              Clear
            </button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5">
          <Card title="Past remediations" subtitle={`${records.length} records`}>
            <ul className="-m-4 divide-y divide-border">
              {records.map((r) => (
                <li
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`p-3 cursor-pointer hover:bg-background ${
                    selected?.id === r.id ? "bg-background border-l-[3px] border-navy" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-xs">{r.problemId}</span>
                    <Pill tone="success">Verified</Pill>
                  </div>
                  <div className="text-[13px] font-medium">{r.recommendation}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {relative(r.completedMinutesAgo)} · verified in {r.minutesToVerify}m
                  </div>
                </li>
              ))}
              {records.length === 0 && (
                <li className="p-8 text-center text-xs text-muted-foreground">
                  No remediation records match that search.
                </li>
              )}
            </ul>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-7 space-y-4">
          {selected && (
            <Card
              title={`${selected.problemId} · outcome`}
              subtitle={relative(selected.completedMinutesAgo)}
              action={<Pill tone="success">Verified</Pill>}
            >
              <ol className="space-y-2">
                {[
                  { label: "Recommendation", body: selected.recommendation },
                  { label: "Approval", body: selected.approvedBy },
                  { label: "Action", body: selected.action },
                  { label: "Result", body: selected.result },
                  { label: "Verification", body: selected.verification },
                ].map((step, i) => (
                  <li key={step.label} className="flex gap-3">
                    <span className="w-5 h-5 rounded-aiops-sm bg-navy text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {step.label}
                      </div>
                      <div className="text-xs">{step.body}</div>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5 text-success">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified in {selected.minutesToVerify}{" "}
                  minutes
                </span>
                {precedentFor(selected.recommendation).length > 0 && (
                  <span className="text-muted-foreground">
                    Same action recommended today for{" "}
                    <b className="text-foreground">
                      {precedentFor(selected.recommendation)
                        .map((p) => p.id)
                        .join(", ")}
                    </b>
                  </span>
                )}
              </div>
            </Card>
          )}

          <Card
            title="Recommendation library"
            subtitle="Actions the platform proposes, and how well they have held up"
          >
            <ul className="space-y-2">
              {recommendedActions
                .filter((a) => a.automatable)
                .map((a) => {
                  const pb = a.playbookId
                    ? playbooks.find((p) => p.id === a.playbookId)
                    : undefined;
                  const today = precedentFor(a.title);
                  return (
                    <li key={a.id} className="border border-border rounded-aiops-sm p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold">{a.title}</span>
                        {pb && (
                          <Pill tone="navy">
                            {pb.timesRun} runs · {pb.successRate}% success
                          </Pill>
                        )}
                      </div>
                      <div className="mt-2">
                        <ConfidenceBar value={a.confidence} label="Confidence" />
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1.5">
                        {a.expectedOutcome}
                      </div>
                      {today.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-blue">
                          <ArrowRight className="w-3 h-3" />
                          Recommended now for{" "}
                          {today.map((p) => `${p.id} (${serviceName(p.serviceId)})`).join(", ")}
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          </Card>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Outcome history is what a learning loop would consume to rank future recommendations. This
        environment records outcomes but does not train on them.
      </p>
    </div>
  );
}
