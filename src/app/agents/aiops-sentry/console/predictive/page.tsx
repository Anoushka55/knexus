"use client";

import { useState } from "react";
import { ShieldCheck, Zap, TrendingUp } from "lucide-react";
import { Card, Pill, SeverityBadge } from "@/components/aiops/primitives";
import { ConfidenceBar, MetricChart } from "@/components/aiops/charts";
import {
  deviceById,
  domainById,
  metricLabel,
  predictions,
  serviceName,
  siteById,
} from "@/lib/aiops";
import { findSeries } from "@/lib/aiops/telemetry";
import { forward, useSession } from "@/lib/aiops/session";

const steps = [
  { name: "Detect", caption: "Telemetry crosses a learned baseline" },
  { name: "Predict", caption: "The pattern is projected to an expected time of impact" },
  { name: "Explain", caption: "The contributing signals and the matching pattern are stated" },
  { name: "Recommend", caption: "A preventive action is proposed before impact" },
];

export default function PredictivePage() {
  const { shift, inFocus } = useSession();
  const visible = predictions.filter((p) => inFocus(p.scenarioId));
  const [openId, setOpenId] = useState(visible[0]?.id ?? predictions[0].id);
  const open = visible.find((p) => p.id === openId) ?? visible[0] ?? predictions[0];

  return (
    <div className="p-5 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-navy">Predictive AI</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Degradation patterns projected forward, so operations can act before service impact rather
          than after it.
        </p>
      </div>

      {/* Detect → Predict → Explain → Recommend */}
      <div className="bg-surface border border-border rounded-aiops-md grid grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div
            key={s.name}
            className={`px-4 py-3 ${i > 0 ? "lg:border-l border-border" : ""} ${i % 2 === 1 ? "border-l lg:border-l" : ""} ${i >= 2 ? "border-t lg:border-t-0" : ""}`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-navy text-white text-[9px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-navy">
                {s.name}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 leading-tight">{s.caption}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Prediction list */}
        <div className="col-span-12 lg:col-span-4 space-y-3">
          <h2 className="text-[10px] uppercase tracking-wide text-muted-foreground px-1">
            Predicted incidents ({visible.length})
          </h2>
          {visible.map((p) => {
            const isOpen = p.id === open.id;
            return (
              <button
                key={p.id}
                onClick={() => setOpenId(p.id)}
                className={`w-full text-left bg-surface border rounded-aiops-md p-3 transition-colors ${
                  isOpen ? "border-navy ring-1 ring-navy/20" : "border-border hover:border-navy"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[12px] font-medium truncate">{p.deviceId}</span>
                  <SeverityBadge s={p.severityIfUnhandled} />
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {serviceName(p.serviceId)} · {p.siteId}
                </div>
                <div className="text-xs mt-1.5">{p.headline}</div>
                <div className="flex items-baseline gap-3 mt-2">
                  <div>
                    <div className="text-xl font-semibold text-navy tabular-nums leading-none">
                      {p.probability}%
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">probability</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-amber tabular-nums leading-none">
                      {p.minutesToImpact}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      minutes to impact
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected prediction detail */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <Card
            title={`${open.deviceId} · ${serviceName(open.serviceId)}`}
            subtitle={`${domainById[open.domainId]?.name} · ${siteById[open.siteId]?.name}`}
            action={<Pill tone="amber">Impact {forward(open.minutesToImpact)}</Pill>}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Prediction" value={open.headline} />
              <Stat label="Probability" value={`${open.probability}%`} tone="navy" />
              <Stat label="Time to impact" value={`${open.minutesToImpact} minutes`} tone="amber" />
              <Stat label="Severity if unhandled" value={open.severityIfUnhandled} tone="crimson" />
            </div>

            <div className="mt-4">
              <ConfidenceBar value={open.probability} label="Probability" />
            </div>

            <div className="mt-4 border border-border rounded-aiops-sm p-3 bg-background">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                <TrendingUp className="w-3 h-3" /> AI explanation
              </div>
              <p className="text-xs leading-relaxed mt-1">{open.explanation}</p>
            </div>

            <div className="mt-4">
              <h4 className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
                Contributing signals
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {open.contributingSignals.map((s) => {
                  const spec = findSeries(open.deviceId, s.metric);
                  return (
                    <div key={s.metric}>
                      {spec ? (
                        <MetricChart
                          spec={spec}
                          shift={shift}
                          height={72}
                          label={metricLabel(s.metric)}
                        />
                      ) : (
                        <div className="text-xs font-medium">{metricLabel(s.metric)}</div>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-1">{s.trend}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <PreventiveAction
            key={open.id}
            action={open.recommendedAction}
            prevented={open.preventedImpact}
            device={deviceById[open.deviceId]?.name ?? open.deviceId}
          />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Predictions in this environment are produced by deterministic trend logic over the
        operational dataset. Each one states the signals it was derived from and the pattern those
        signals match; no model is trained or executed in the browser.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "navy" | "amber" | "crimson";
}) {
  const color =
    tone === "navy"
      ? "text-navy"
      : tone === "amber"
        ? "text-amber"
        : tone === "crimson"
          ? "text-crimson"
          : "text-foreground";
  return (
    <div className="border border-border rounded-aiops-sm p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-[13px] font-semibold mt-0.5 leading-tight ${color}`}>{value}</div>
    </div>
  );
}

function PreventiveAction({
  action,
  prevented,
  device,
}: {
  action: string;
  prevented: string;
  device: string;
}) {
  const [stage, setStage] = useState<"idle" | "running" | "done">("idle");

  return (
    <Card title="Recommended preventive action" action={<Pill tone="teal">Before impact</Pill>}>
      <div className="text-[13px] font-semibold text-navy">{action}</div>
      <p className="text-xs text-muted-foreground mt-1">{prevented}</p>

      <div className="mt-3">
        {stage === "idle" && (
          <button
            onClick={() => {
              setStage("running");
              window.setTimeout(() => setStage("done"), 1500);
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-sm bg-teal text-white rounded-aiops-sm hover:opacity-90"
          >
            <Zap className="w-4 h-4" /> Simulate preventive action
          </button>
        )}
        {stage === "running" && (
          <div className="border border-teal/40 bg-teal/5 rounded-aiops-sm p-3 text-xs">
            <div className="flex items-center gap-2 font-medium text-teal">
              <span className="w-2 h-2 rounded-full bg-teal aiops-pulse-dot" />
              Simulation in progress on {device}
            </div>
          </div>
        )}
        {stage === "done" && (
          <div className="border border-success/40 bg-success/5 rounded-aiops-sm p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-success">
              <ShieldCheck className="w-3.5 h-3.5" /> Simulation verified
            </div>
            <div className="mt-1.5 text-xs">
              Contributing signals return below threshold and the predicted impact no longer occurs
              in the projection window.
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">
              Simulated outcome. No infrastructure was changed.
            </div>
            <button
              onClick={() => setStage("idle")}
              className="mt-2 text-[11px] text-blue hover:underline"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
