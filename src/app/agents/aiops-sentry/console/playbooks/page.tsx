"use client";

import { useState } from "react";
import { ChevronDown, ShieldCheck, Zap, Check } from "lucide-react";
import { Card, Pill } from "@/components/aiops/primitives";
import { StatusPill } from "@/components/aiops/charts";
import { MaturityLadder } from "@/components/aiops/maturity";
import {
  domainById,
  playbooks,
  serviceName,
  type Playbook,
  type PlaybookStatus,
} from "@/lib/aiops";
import { useSession } from "@/lib/aiops/session";


const evolution = [
  { name: "Monitoring", caption: "Thresholds raise alerts", state: "past" },
  {
    name: "AIOps",
    caption: "Events correlate into problems with a probable cause",
    state: "current",
  },
  { name: "Predictive AI", caption: "Patterns are projected before impact", state: "current" },
  {
    name: "Agentic AI",
    caption: "Approved actions execute and verify themselves",
    state: "current",
  },
] as const;

const stageOrder: PlaybookStatus[] = [
  "AI Recommended",
  "Awaiting Approval",
  "Approved",
  "Simulated Execution",
  "Verified",
];

export default function PlaybooksPage() {
  const { inFocus } = useSession();
  const [open, setOpen] = useState<string | null>("PB-01");
  const [progress, setProgress] = useState<Record<string, PlaybookStatus>>({});

  const visible = playbooks.filter((p) => inFocus(p.scenarioId));
  // Keep a row expanded even when the focused scenario filters out the default.
  const expandedId = visible.some((p) => p.id === open) ? open : (visible[0]?.id ?? null);

  const statusOf = (p: Playbook) => progress[p.id] ?? p.status;

  const advance = (p: Playbook) => {
    const current = statusOf(p);
    const next = stageOrder[Math.min(stageOrder.indexOf(current) + 1, stageOrder.length - 1)];
    setProgress((s) => ({ ...s, [p.id]: next }));
    if (next === "Simulated Execution") {
      window.setTimeout(() => setProgress((s) => ({ ...s, [p.id]: "Verified" })), 1600);
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-navy">Agentic Playbooks</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Recommend, approve, execute and verify. Execution in this environment is simulated; the
          platform holds no live control of infrastructure here.
        </p>
      </div>

      {/* Evolution */}
      <div className="bg-surface border border-border rounded-aiops-md grid grid-cols-2 lg:grid-cols-4">
        {evolution.map((e, i) => (
          <div
            key={e.name}
            className={`px-4 py-3 ${i > 0 ? "lg:border-l border-border" : ""} ${i % 2 === 1 ? "border-l lg:border-l" : ""} ${i >= 2 ? "border-t lg:border-t-0" : ""}`}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`w-4 h-4 rounded-aiops-sm flex items-center justify-center text-[9px] font-bold ${
                  e.state === "current"
                    ? "bg-teal text-white"
                    : "bg-background border border-border text-muted-foreground"
                }`}
              >
                {e.state === "current" ? <Check className="w-2.5 h-2.5" /> : i + 1}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-navy">
                {e.name}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 leading-tight">{e.caption}</div>
          </div>
        ))}
      </div>

      {/* Playbook list */}
      <Card title="Playbooks" subtitle={`${visible.length} configured`}>
        <ul className="-m-4 divide-y divide-border">
          {visible.map((p) => {
            const status = statusOf(p);
            const isOpen = expandedId === p.id;
            return (
              <li key={p.id}>
                <button
                  onClick={() => setOpen(isOpen ? null : p.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background text-left"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0 ${
                      isOpen ? "" : "-rotate-90"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold">{p.name}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{p.id}</span>
                      <Pill tone="muted">{domainById[p.domainId]?.short}</Pill>
                      <Pill tone={p.autonomyLevel === "Agentic" ? "teal" : "blue"}>
                        {p.autonomyLevel}
                      </Pill>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {serviceName(p.serviceId)} · trigger: {p.trigger}
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-4 shrink-0 text-[11px] text-muted-foreground">
                    <span className="tabular-nums">{p.timesRun} runs</span>
                    <span className="tabular-nums">{p.successRate}% success</span>
                    <span className="tabular-nums">{p.engineerMinutesSaved}m saved</span>
                  </div>
                  <StatusPill status={status} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 bg-background border-t border-border">
                    <StageFlow playbook={p} status={status} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-4">
                      <Detail label="Linked problem">
                        {p.linkedProblemId ? (
                          <span className="font-mono">{p.linkedProblemId}</span>
                        ) : (
                          "None"
                        )}
                      </Detail>
                      <Detail label="Approval">{p.approval}</Detail>
                      <Detail label="Verification criterion">{p.verification}</Detail>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {status !== "Verified" ? (
                        <button
                          onClick={() => advance(p)}
                          disabled={status === "Simulated Execution"}
                          className="inline-flex items-center gap-1.5 h-9 px-3 text-sm bg-teal text-white rounded-aiops-sm hover:opacity-90 disabled:opacity-60"
                        >
                          <Zap className="w-4 h-4" />
                          {status === "AI Recommended"
                            ? "Send for approval"
                            : status === "Awaiting Approval"
                              ? "Approve"
                              : status === "Approved"
                                ? "Run simulated execution"
                                : "Executing…"}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 border border-success/40 bg-success/5 rounded-aiops-sm px-3 py-2">
                          <ShieldCheck className="w-4 h-4 text-success" />
                          <span className="text-xs">
                            <b className="text-success">Verified.</b> {p.verification}
                          </span>
                        </div>
                      )}
                      {progress[p.id] && (
                        <button
                          onClick={() =>
                            setProgress((s) => {
                              const next = { ...s };
                              delete next[p.id];
                              return next;
                            })
                          }
                          className="h-9 px-3 text-xs border border-border rounded-aiops-sm hover:border-navy"
                        >
                          Reset
                        </button>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        Execution is simulated. No infrastructure is changed by this environment.
                      </span>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="AI operations maturity" subtitle="Where agentic operations sits on the ladder">
        <MaturityLadder />
      </Card>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-aiops-sm p-2.5 bg-surface">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-xs mt-0.5">{children}</div>
    </div>
  );
}

/** Trigger → AI Diagnosis → Recommended Action → Approval → Execution → Verification */
function StageFlow({ playbook, status }: { playbook: Playbook; status: PlaybookStatus }) {
  const stages = [
    { name: "Trigger", body: playbook.trigger },
    { name: "AI Diagnosis", body: playbook.diagnosis },
    { name: "Recommended Action", body: playbook.recommendation },
    { name: "Approval", body: playbook.approval },
    { name: "Execution", body: playbook.execution },
    { name: "Verification", body: playbook.verification },
  ];

  // How far along the flow the current status places this playbook.
  const reached =
    status === "Verified"
      ? 6
      : status === "Simulated Execution"
        ? 5
        : status === "Approved"
          ? 4
          : status === "Awaiting Approval"
            ? 3
            : 2;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-2 pt-4">
      {stages.map((s, i) => {
        const done = i < reached;
        const active = i === reached - 1;
        return (
          <div
            key={s.name}
            className={`rounded-aiops-sm border p-2.5 ${
              active
                ? "border-teal bg-teal/5"
                : done
                  ? "border-border bg-surface"
                  : "border-dashed border-border bg-surface/50"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`w-4 h-4 rounded-aiops-sm flex items-center justify-center text-[9px] font-bold shrink-0 ${
                  done ? "bg-teal text-white" : "border border-border text-muted-foreground"
                }`}
              >
                {done ? <Check className="w-2.5 h-2.5" /> : i + 1}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide ${
                  done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.name}
              </span>
            </div>
            <div
              className={`text-[11px] mt-1.5 leading-tight ${
                done ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
