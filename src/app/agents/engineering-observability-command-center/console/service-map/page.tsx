"use client";

import Link from "next/link";
import { obsHref } from "@/lib/engineering-observability/paths";
import { AlertTriangle, ArrowRight, Database, Layers, Server } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/lib/engineering-observability/page-header";
import { Card, StatusPill } from "@/lib/engineering-observability/ui-atoms";
import { incidentById, journeyById, serviceById, services } from "@/lib/engineering-observability/enterprise-data";


// Deterministic layout for the checkout-journey topology
const nodePos: Record<string, { x: number; y: number }> = {
  "svc-gateway": { x: 60, y: 200 },
  "svc-checkout": { x: 260, y: 110 },
  "svc-cart": { x: 260, y: 290 },
  "svc-pricing": { x: 260, y: 400 },
  "svc-payment": { x: 480, y: 110 },
  "svc-order": { x: 480, y: 260 },
  "svc-fraud": { x: 480, y: 400 },
  "svc-inventory": { x: 700, y: 260 },
  "svc-notification": { x: 700, y: 400 },
  "svc-payment-db": { x: 700, y: 110 },
  "svc-redis": { x: 700, y: 30 },
  "svc-kafka": { x: 880, y: 330 },
  "svc-k8s": { x: 880, y: 150 },
};

const statusStroke: Record<string, string> = {
  healthy: "#16A34A",
  degraded: "#EA580C",
  critical: "#DC2626",
  down: "#991B1B",
};

const statusFill: Record<string, string> = {
  healthy: "#F0FDF4",
  degraded: "#FFF7ED",
  critical: "#FEF2F2",
  down: "#FEE2E2",
};

function ServiceMapPage() {
  const [selectedId, setSelectedId] = useState<string>("svc-payment");
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  const selected = serviceById(selectedId);
  const journey = journeyById("jrn-checkout");
  const inc = incidentById("INC-8421");

  // Wheel zoom: non-passive native listener, magnitude-scaled, cursor-anchored
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      setView((v) => {
        const next = Math.min(2.2, Math.max(0.5, v.z * Math.exp(-dy * 0.0015)));
        const rect = el.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const k = next / v.z;
        return { z: next, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const edges = useMemo(() => {
    const list: Array<{ from: string; to: string }> = [];
    for (const s of services) {
      if (!nodePos[s.id]) continue;
      for (const dep of s.dependencies) {
        if (nodePos[dep]) list.push({ from: s.id, to: dep });
      }
    }
    return list;
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: viewRef.current.x, oy: viewRef.current.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setView((v) => ({ ...v, x: d.ox + (e.clientX - d.startX), y: d.oy + (e.clientY - d.startY) }));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Service Map"
        subtitle="Dependency topology for the Online Checkout journey · scroll to zoom, drag to pan"
        actions={
          <button
            onClick={() => setView({ x: 0, y: 0, z: 1 })}
            className="rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
          >
            Reset view
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Topology canvas */}
        <Card
          title="Online Checkout — Dependency Topology"
          subtitle="13 services & infrastructure nodes"
          className="xl:col-span-2"
          bodyClassName="p-0"
        >
          <div
            ref={containerRef}
            className="relative h-[520px] cursor-grab touch-none overflow-hidden rounded-b-lg bg-background active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <svg
              className="absolute inset-0 h-full w-full"
              style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`, transformOrigin: "0 0" }}
              viewBox="0 0 1000 460"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* edges */}
              {edges.map((e) => {
                const a = nodePos[e.from]!;
                const b = nodePos[e.to]!;
                const hot = e.from === "svc-payment" || e.to === "svc-payment" || e.to === "svc-payment-db";
                return (
                  <line
                    key={`${e.from}-${e.to}`}
                    x1={a.x + 70}
                    y1={a.y + 24}
                    x2={b.x + 70}
                    y2={b.y + 24}
                    stroke={hot ? "#DC2626" : "#CBD5E1"}
                    strokeWidth={hot ? 2 : 1.25}
                    strokeDasharray={hot ? "5 4" : undefined}
                    opacity={hot ? 0.9 : 0.8}
                  />
                );
              })}
              {/* nodes */}
              {services
                .filter((s) => nodePos[s.id])
                .map((s) => {
                  const p = nodePos[s.id]!;
                  const isSel = s.id === selectedId;
                  return (
                    <g
                      key={s.id}
                      transform={`translate(${p.x}, ${p.y})`}
                      onPointerDown={(ev) => ev.stopPropagation()}
                      onClick={() => setSelectedId(s.id)}
                      className="cursor-pointer"
                    >
                      <rect
                        width={140}
                        height={48}
                        rx={8}
                        fill={statusFill[s.health]}
                        stroke={isSel ? "#00338D" : statusStroke[s.health]}
                        strokeWidth={isSel ? 2.5 : 1.5}
                      />
                      <text x={10} y={20} fontSize={11} fontWeight={700} fill="#0F172A">
                        {s.name.length > 18 ? s.name.slice(0, 17) + "…" : s.name}
                      </text>
                      <text x={10} y={36} fontSize={9.5} fill="#64748B">
                        {s.type} · {s.errorRate}% err
                      </text>
                      <circle cx={128} cy={12} r={5} fill={statusStroke[s.health]} />
                    </g>
                  );
                })}
            </svg>
            <div className="pointer-events-none absolute bottom-3 left-3 flex gap-3 rounded-md border border-border bg-[color:color-mix(in_oklab,var(--card)_90%,transparent)] px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-healthy" /> Healthy</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Degraded</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-critical" /> Critical</span>
            </div>
          </div>
        </Card>

        {/* Inspector */}
        <div className="space-y-6">
          {selected && (
            <Card
              title={selected.name}
              subtitle={`${selected.type} · ${selected.domain}`}
              action={<StatusPill status={selected.health} />}
            >
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Metric label="Health score" value={`${selected.healthScore}%`} />
                <Metric label="SLO" value={`${selected.slo}%`} />
                <Metric label="Latency p95" value={`${selected.latencyP95}ms`} />
                <Metric label="Error rate" value={`${selected.errorRate}%`} />
                <Metric label="Throughput" value={selected.throughputTps ?? selected.requestsPerMin + "/min"} />
                <Metric label="Owner" value={selected.owner} />
              </dl>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selected.techStack.map((t) => (
                  <span key={t} className="rounded border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>

              {selected.id === "svc-payment" && inc && (
                <div className="mt-4 rounded-lg border border-[color:color-mix(in_oklab,var(--critical)_30%,transparent)] bg-critical-soft p-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-critical">
                    <AlertTriangle className="h-4 w-4" /> Active incident: {inc.id}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-foreground">{inc.title} — {inc.description}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                    <span>Transactions: <strong className="text-foreground">{inc.impact.transactions}</strong></span>
                    <span>Exposure: <strong className="text-critical">{inc.impact.revenueExposure}</strong></span>
                  </div>
                  <Link
                    href={obsHref("/incidents")}
                    className="mt-2.5 inline-flex items-center gap-1 rounded-md bg-critical px-2.5 py-1.5 text-xs font-semibold text-critical-soft hover:opacity-90"
                  >
                    Open investigation <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}

              <div className="mt-4">
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Depends on
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.dependencies.length === 0 && (
                    <span className="text-xs text-muted-foreground">No upstream dependencies</span>
                  )}
                  {selected.dependencies.map((d) => {
                    const dep = serviceById(d);
                    if (!dep) return null;
                    return (
                      <button
                        key={d}
                        onClick={() => setSelectedId(d)}
                        className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground hover:border-primary"
                      >
                        {dep.type === "Infrastructure" ? (
                          <Database className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Server className="h-3 w-3 text-muted-foreground" />
                        )}
                        {dep.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {journey && (
            <Card title="Journey Context" subtitle={journey.name} action={<Layers className="h-4 w-4 text-muted-foreground" />}>
              <p className="text-xs leading-relaxed text-muted-foreground">{journey.description}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-muted p-2">
                  <div className="text-sm font-bold text-foreground">{journey.transactionsPerHour}</div>
                  <div className="text-[10px] text-muted-foreground">txn / hr</div>
                </div>
                <div className="rounded-md bg-muted p-2">
                  <div className="text-sm font-bold text-foreground">{journey.revenuePerHour}</div>
                  <div className="text-[10px] text-muted-foreground">revenue / hr</div>
                </div>
                <div className="rounded-md bg-critical-soft p-2">
                  <div className="text-sm font-bold text-critical">{journey.exposure}</div>
                  <div className="text-[10px] text-muted-foreground">exposure</div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold text-foreground">{value}</dd>
    </div>
  );
}

export default ServiceMapPage;
