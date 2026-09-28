"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Card, Gauge, Pill, SeverityBadge, Sparkline } from "@/components/aiops/primitives";
import { ConfidenceBar, HealthDot, SlaPill, StatusPill } from "@/components/aiops/charts";
import { ProblemDrawer } from "@/components/aiops/problem-drawer";
import {
  actionById,
  buildEvents,
  journeyById,
  journeyHealth,
  journeys as journeyCatalog,
  scenarioById,
  metricLabel,
  predictionById,
  serviceName,
  type Problem,
} from "@/lib/aiops";
import { useClock, useSession } from "@/lib/aiops/session";

export default function JourneysPage() {
  const { shift, scenario } = useSession();
  const clock = useClock();
  const [openId, setOpenId] = useState<string>("JRN-CONN");
  const [selected, setSelected] = useState<Problem | null>(null);

  // Demo Mode: bring the journey behind the focused scenario to the front.
  useEffect(() => {
    if (scenario === "all") return;
    const domainId = scenarioById[scenario]?.domainId;
    const match = journeyCatalog.find((j) => j.domainId === domainId);
    if (match) setOpenId(match.id);
  }, [scenario]);

  const journeys = journeyHealth(shift);
  const events = buildEvents(shift);
  const open = journeys.find((j) => j.journeyId === openId) ?? journeys[0];
  const definition = journeyById[open.journeyId];

  return (
    <div className="p-5 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-navy">Enterprise Service Journeys</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Service assurance viewed end to end, from the business service a customer buys down to the
          component carrying it.
        </p>
      </div>

      {/* Journey cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {journeys.map((j) => {
          const isOpen = j.journeyId === open.journeyId;
          return (
            <button
              key={j.journeyId}
              onClick={() => setOpenId(j.journeyId)}
              className={`text-left bg-surface border rounded-aiops-md p-3 transition-colors ${
                isOpen ? "border-navy ring-1 ring-navy/20" : "border-border hover:border-navy"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-semibold leading-tight">{j.name}</span>
                <SlaPill risk={j.slaRisk} />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Gauge value={j.score} size={52} />
                <div className="text-[11px] text-muted-foreground leading-tight">
                  <div>
                    <span className="text-foreground font-medium tabular-nums">
                      {j.activeProblems.length}
                    </span>{" "}
                    active problems
                  </div>
                  <div>
                    <span className="text-foreground font-medium tabular-nums">
                      {j.services.length}
                    </span>{" "}
                    services
                  </div>
                  <div>
                    <span className="text-foreground font-medium tabular-nums">
                      {j.predictionIds.length}
                    </span>{" "}
                    predicted risks
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1">
                  {j.activeProblems.slice(0, 3).map((p) => (
                    <SeverityBadge key={p.id} s={p.severity} />
                  ))}
                </div>
                <Sparkline data={j.trend} color="var(--blue)" width={56} height={18} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Drill-down for the selected journey */}
      <Card
        title={open.name}
        subtitle={open.description}
        action={
          <div className="flex items-center gap-2">
            <Pill tone="muted">Health {open.score}</Pill>
            <SlaPill risk={open.slaRisk} />
          </div>
        }
      >
        {/* Drill path */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {definition?.drilldown.map((step, i) => (
            <span key={`${step}-${i}`} className="flex items-center shrink-0">
              <span
                className={`px-2.5 h-7 inline-flex items-center rounded-aiops-sm border text-[11px] ${
                  i === (definition.drilldown.length ?? 1) - 1
                    ? "bg-teal/10 border-teal text-teal font-medium"
                    : i === 0
                      ? "bg-navy text-white border-navy font-medium"
                      : "bg-surface border-border"
                }`}
              >
                {step}
              </span>
              {i < definition.drilldown.length - 1 && (
                <ChevronRight className="w-3 h-3 text-muted-foreground mx-0.5 shrink-0" />
              )}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-4 mt-2">
          {/* Services in this journey */}
          <div className="col-span-12 lg:col-span-4">
            <h4 className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
              Affected services
            </h4>
            <ul className="space-y-1.5">
              {open.services.map((s) => (
                <li
                  key={s.serviceId}
                  className="flex items-center gap-2 border border-border rounded-aiops-sm px-2.5 py-2"
                >
                  <HealthDot score={s.score} />
                  <span className="text-xs font-medium flex-1 truncate">{s.name}</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{s.score}</span>
                  <SlaPill risk={s.slaRisk} />
                </li>
              ))}
            </ul>
          </div>

          {/* Active problems */}
          <div className="col-span-12 lg:col-span-4">
            <h4 className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
              Active problems
            </h4>
            {open.activeProblems.length === 0 ? (
              <div className="border border-border rounded-aiops-sm p-3 text-xs text-muted-foreground">
                No active problems on this journey. Services are inside their SLA commitments.
              </div>
            ) : (
              <ul className="space-y-1.5">
                {open.activeProblems.map((p) => (
                  <li
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="border border-border rounded-aiops-sm p-2.5 cursor-pointer hover:border-navy"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge s={p.severity} />
                      <span className="font-mono text-[11px] text-muted-foreground">{p.id}</span>
                      <StatusPill status={p.status} />
                    </div>
                    <div className="text-xs font-medium">{p.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {p.rootCause} · {p.correlatedEventCount} events · {p.aiConfidence}% confidence
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Predictions and recommendations */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div>
              <h4 className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
                Predicted risks
              </h4>
              {open.predictionIds.length === 0 ? (
                <div className="border border-border rounded-aiops-sm p-3 text-xs text-muted-foreground">
                  No degradation patterns currently projected for this journey.
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {open.predictionIds.map((id) => {
                    const p = predictionById[id];
                    return (
                      <li key={id} className="border border-border rounded-aiops-sm p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] truncate">{p.deviceId}</span>
                          <Pill tone="amber">in {p.minutesToImpact} min</Pill>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{p.headline}</div>
                        <div className="mt-1.5">
                          <ConfidenceBar value={p.probability} label="Probability" />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div>
              <h4 className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
                AI recommendations
              </h4>
              <ul className="space-y-1.5">
                {open.activeProblems.map((p) => {
                  const a = actionById[p.recommendedActionId];
                  if (!a) return null;
                  return (
                    <li key={p.id} className="border border-border rounded-aiops-sm p-2.5">
                      <div className="text-xs font-medium">{a.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        For {p.id} · {a.confidence}% confidence ·{" "}
                        {a.automatable ? "automatable" : "manual"}
                      </div>
                    </li>
                  );
                })}
                {open.activeProblems.length === 0 && (
                  <li className="border border-border rounded-aiops-sm p-3 text-xs text-muted-foreground">
                    Nothing to action on this journey right now.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Recent events on this journey */}
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
            Recent events on this journey
          </h4>
          <ul className="divide-y divide-border max-h-[220px] overflow-auto border border-border rounded-aiops-sm">
            {events
              .filter((e) => open.services.some((s) => s.serviceId === e.serviceId))
              .slice(0, 20)
              .map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-3 py-1.5 text-[11px]">
                  <span className="font-mono text-muted-foreground w-11 shrink-0">
                    {clock(e.minutesAgo)}
                  </span>
                  <SeverityBadge s={e.severity} />
                  <span className="font-mono text-blue w-32 shrink-0 truncate">{e.deviceId}</span>
                  <span className="truncate flex-1">{e.message}</span>
                  <span className="hidden lg:inline text-muted-foreground shrink-0">
                    {metricLabel(e.metric)}
                  </span>
                </li>
              ))}
            {events.filter((e) => open.services.some((s) => s.serviceId === e.serviceId)).length ===
              0 && (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                No events on this journey in the current window.
              </li>
            )}
          </ul>
        </div>
      </Card>

      <p className="text-[11px] text-muted-foreground">
        Journey health is derived from component telemetry, active problems and the SLA position of
        each service in the journey. {serviceName("SVC-SDWAN")} and its peers roll up to the journey
        score shown above.
      </p>

      {selected && <ProblemDrawer problem={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
