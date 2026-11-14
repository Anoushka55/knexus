"use client";

import { Filter, Maximize2, Minus, Network, Plus, Share2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  InsightBar,
  KpiCard,
  PageHeader,
  Panel,
  PanelLink,
  ProgressBar,
  StatusPill,
  type Tone,
} from "@/lib/legacy-modernization/primitives";
import { cn } from "@/lib/utils";

type Layer = "Business Capability" | "Application" | "Service" | "API" | "Data Store" | "Infrastructure";

const layerTone: Record<Layer, { color: string; tone: Tone }> = {
  "Business Capability": { color: "var(--chart-5)", tone: "intel" },
  Application: { color: "var(--chart-1)", tone: "brand" },
  Service: { color: "var(--chart-2)", tone: "success" },
  API: { color: "var(--chart-3)", tone: "warning" },
  "Data Store": { color: "var(--chart-6)", tone: "neutral" },
  Infrastructure: { color: "var(--chart-4)", tone: "danger" },
};

type GNode = {
  id: string;
  label: string;
  layer: Layer;
  x: number;
  y: number;
  risk: "Low" | "Medium" | "High" | "Critical";
  detail: {
    owner: string;
    stack: string;
    criticality: string;
    dependencies: number;
    consumers: number;
    debt: string;
    health: number;
    capabilities: string[];
  };
};

const nodes: GNode[] = [
  { id: "cap-rev", label: "Revenue Management", layer: "Business Capability", x: 140, y: 70, risk: "High", detail: { owner: "CFO Office", stack: "Capability", criticality: "Tier 1", dependencies: 6, consumers: 18, debt: "$8.1M", health: 58, capabilities: ["Invoicing", "Revenue Recognition"] } },
  { id: "cap-cust", label: "Customer Management", layer: "Business Capability", x: 430, y: 70, risk: "Medium", detail: { owner: "CCO Office", stack: "Capability", criticality: "Tier 1", dependencies: 5, consumers: 22, debt: "$3.4M", health: 71, capabilities: ["Onboarding", "Servicing"] } },
  { id: "cap-risk", label: "Risk & Compliance", layer: "Business Capability", x: 720, y: 70, risk: "Medium", detail: { owner: "CRO Office", stack: "Capability", criticality: "Tier 1", dependencies: 4, consumers: 11, debt: "$2.2M", health: 74, capabilities: ["Regulatory Reporting", "AML"] } },

  { id: "app-billing", label: "Billing Platform", layer: "Application", x: 120, y: 200, risk: "Critical", detail: { owner: "Finance Engineering", stack: "Java 8 · Oracle 11g · WebLogic 12c", criticality: "Tier 1 — Mission Critical", dependencies: 42, consumers: 18, debt: "$6.2M", health: 42, capabilities: ["Revenue Management", "Invoicing", "Dunning"] } },
  { id: "app-crm", label: "CRM Platform", layer: "Application", x: 420, y: 200, risk: "Medium", detail: { owner: "Customer Engineering", stack: ".NET Framework 4.6 · SQL Server 2016", criticality: "Tier 1", dependencies: 28, consumers: 24, debt: "$3.1M", health: 64, capabilities: ["Customer Management", "Case Management"] } },
  { id: "app-claims", label: "Claims Processing", layer: "Application", x: 700, y: 200, risk: "Critical", detail: { owner: "Insurance Ops IT", stack: "COBOL · DB2 · z/OS", criticality: "Tier 1", dependencies: 34, consumers: 9, debt: "$4.8M", health: 31, capabilities: ["Risk & Compliance", "Claims Adjudication"] } },

  { id: "svc-invoice", label: "Invoice Service", layer: "Service", x: 60, y: 320, risk: "High", detail: { owner: "Finance Engineering", stack: "Spring Boot 2.3", criticality: "Tier 2", dependencies: 9, consumers: 14, debt: "$0.9M", health: 55, capabilities: ["Invoicing"] } },
  { id: "svc-pay", label: "Payments Gateway", layer: "Service", x: 250, y: 320, risk: "Low", detail: { owner: "Payments Platform", stack: "Java 17 · Kubernetes", criticality: "Tier 1", dependencies: 6, consumers: 21, debt: "$0.4M", health: 88, capabilities: ["Payment Capture"] } },
  { id: "svc-profile", label: "Customer Profile Svc", layer: "Service", x: 440, y: 320, risk: "Medium", detail: { owner: "Customer Engineering", stack: "Node 18", criticality: "Tier 2", dependencies: 7, consumers: 19, debt: "$0.6M", health: 72, capabilities: ["Customer Management"] } },
  { id: "svc-adjud", label: "Adjudication Engine", layer: "Service", x: 700, y: 320, risk: "High", detail: { owner: "Insurance Ops IT", stack: "COBOL Batch", criticality: "Tier 1", dependencies: 12, consumers: 6, debt: "$1.8M", health: 38, capabilities: ["Claims Adjudication"] } },

  { id: "api-billing", label: "/v1/billing", layer: "API", x: 150, y: 430, risk: "High", detail: { owner: "Finance Engineering", stack: "REST · OAuth2", criticality: "Tier 1", dependencies: 3, consumers: 32, debt: "$0.2M", health: 61, capabilities: ["Invoicing"] } },
  { id: "api-cust", label: "/v1/customers", layer: "API", x: 430, y: 430, risk: "Low", detail: { owner: "Customer Engineering", stack: "REST · OAuth2", criticality: "Tier 1", dependencies: 2, consumers: 46, debt: "$0.1M", health: 84, capabilities: ["Customer Management"] } },
  { id: "api-claims", label: "/v1/claims", layer: "API", x: 700, y: 430, risk: "Medium", detail: { owner: "Insurance Ops IT", stack: "SOAP → REST façade", criticality: "Tier 2", dependencies: 4, consumers: 12, debt: "$0.4M", health: 52, capabilities: ["Claims Adjudication"] } },

  { id: "db-oracle", label: "Oracle 11g — BILLDB", layer: "Data Store", x: 120, y: 530, risk: "Critical", detail: { owner: "Data Platform", stack: "Oracle 11g (EOL)", criticality: "Tier 1", dependencies: 1, consumers: 27, debt: "$2.6M", health: 34, capabilities: ["Revenue Management"] } },
  { id: "db-sql", label: "SQL Server — CRMDB", layer: "Data Store", x: 420, y: 530, risk: "Medium", detail: { owner: "Data Platform", stack: "SQL Server 2016", criticality: "Tier 1", dependencies: 1, consumers: 18, debt: "$0.8M", health: 66, capabilities: ["Customer Management"] } },
  { id: "db-db2", label: "DB2 — CLAIMSDB", layer: "Data Store", x: 700, y: 530, risk: "High", detail: { owner: "Mainframe Services", stack: "DB2 z/OS", criticality: "Tier 1", dependencies: 1, consumers: 11, debt: "$1.4M", health: 44, capabilities: ["Claims Adjudication"] } },

  { id: "inf-weblogic", label: "WebLogic Cluster", layer: "Infrastructure", x: 190, y: 630, risk: "Critical", detail: { owner: "Platform Ops", stack: "WebLogic 12c · RHEL 7", criticality: "Tier 1", dependencies: 0, consumers: 14, debt: "$1.9M", health: 39, capabilities: ["Revenue Management"] } },
  { id: "inf-k8s", label: "AKS Cluster (Prod)", layer: "Infrastructure", x: 470, y: 630, risk: "Low", detail: { owner: "Platform Ops", stack: "Kubernetes 1.29", criticality: "Tier 1", dependencies: 0, consumers: 62, debt: "$0.3M", health: 91, capabilities: ["Customer Management", "Payment Capture"] } },
  { id: "inf-mf", label: "z/OS LPAR", layer: "Infrastructure", x: 720, y: 630, risk: "High", detail: { owner: "Mainframe Services", stack: "z/OS 2.4", criticality: "Tier 1", dependencies: 0, consumers: 9, debt: "$2.1M", health: 46, capabilities: ["Claims Adjudication"] } },
];

const edges: Array<[string, string]> = [
  ["cap-rev", "app-billing"],
  ["cap-cust", "app-crm"],
  ["cap-risk", "app-claims"],
  ["cap-rev", "app-crm"],
  ["app-billing", "svc-invoice"],
  ["app-billing", "svc-pay"],
  ["app-crm", "svc-profile"],
  ["app-crm", "svc-pay"],
  ["app-claims", "svc-adjud"],
  ["svc-invoice", "api-billing"],
  ["svc-pay", "api-billing"],
  ["svc-profile", "api-cust"],
  ["svc-adjud", "api-claims"],
  ["api-billing", "db-oracle"],
  ["api-cust", "db-sql"],
  ["api-claims", "db-db2"],
  ["db-oracle", "inf-weblogic"],
  ["db-sql", "inf-k8s"],
  ["db-db2", "inf-mf"],
  ["svc-pay", "inf-k8s"],
  ["app-billing", "db-oracle"],
];

const layers: Layer[] = [
  "Business Capability",
  "Application",
  "Service",
  "API",
  "Data Store",
  "Infrastructure",
];

const layerCounts: Record<Layer, string> = {
  "Business Capability": "3,216",
  Application: "2,184",
  Service: "8,742",
  API: "12,356",
  "Data Store": "4,128",
  Infrastructure: "7,896",
};

const riskTone: Record<GNode["risk"], Tone> = {
  Low: "success",
  Medium: "warning",
  High: "warning",
  Critical: "danger",
};

export default function ArchitectureIntelligencePage() {
  const [selectedId, setSelectedId] = useState("app-billing");
  const [active, setActive] = useState<Layer[]>(layers);
  const [zoom, setZoom] = useState(1);

  const selected = nodes.find((n) => n.id === selectedId)!;
  const visibleNodes = nodes.filter((n) => active.includes(n.layer));
  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = edges.filter(([a, b]) => visibleIds.has(a) && visibleIds.has(b));

  const connected = useMemo(() => {
    const set = new Set<string>();
    edges.forEach(([a, b]) => {
      if (a === selectedId) set.add(b);
      if (b === selectedId) set.add(a);
    });
    return set;
  }, [selectedId]);

  const toggleLayer = (layer: Layer) =>
    setActive((prev) => (prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer]));

  return (
    <>
      <PageHeader
        title="Architecture Intelligence"
        subtitle="A live knowledge graph connecting business capabilities to the applications, services, APIs, data and infrastructure that deliver them."
        actions={
          <>
            <button className="flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-secondary">
              <Share2 className="size-3.5" /> Share View
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-brand-bright">
              <Network className="size-3.5" /> Impact Analysis
            </button>
          </>
        }
      />

      <InsightBar action={<PanelLink to="/planning">Open plan</PanelLink>}>
        Billing Platform sits on the critical path for <span className="font-semibold">Revenue Management</span> with
        42 dependencies and an end-of-life Oracle 11g store — modernizing it de-risks 27 downstream consumers.
      </InsightBar>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard label="Graph Nodes" value="38,522" delta="+1,284" deltaLabel="since last index" direction="up" tone="brand" />
        <KpiCard label="Relationships" value="164,918" delta="+6.2%" deltaLabel="edge growth" direction="up" tone="intel" />
        <KpiCard label="Capabilities Mapped" value="3,216" delta="94%" deltaLabel="coverage" direction="up" tone="success" />
        <KpiCard label="Orphaned Assets" value="286" delta="-42" deltaLabel="reconciled" direction="down" tone="warning" />
        <KpiCard label="Critical Path Nodes" value="118" delta="+7" deltaLabel="new this month" direction="up" tone="danger" />
        <KpiCard label="Last Graph Sync" value="14 min" deltaLabel="continuous ingestion" direction="flat" tone="neutral" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel
          title="Enterprise Architecture Knowledge Graph"
          subtitle="Click any node to inspect lineage, ownership and modernization exposure"
          actions={
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}
                className="flex size-7 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-secondary"
                aria-label="Zoom out"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="num w-10 text-center text-[11px] text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)))}
                className="flex size-7 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-secondary"
                aria-label="Zoom in"
              >
                <Plus className="size-3.5" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="flex size-7 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-secondary"
                aria-label="Reset zoom"
              >
                <Maximize2 className="size-3.5" />
              </button>
            </div>
          }
          bodyClassName="space-y-3"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1.5 pr-1 text-[11px] font-medium text-muted-foreground">
              <Filter className="size-3.5" /> Layers
            </span>
            {layers.map((l) => (
              <button
                key={l}
                onClick={() => toggleLayer(l)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                  active.includes(l) ? "bg-secondary text-foreground" : "text-[color:color-mix(in_oklch,var(--muted-foreground)_60%,transparent)]",
                )}
              >
                <span className="size-2 rounded-full" style={{ background: layerTone[l].color }} />
                {l}
                <span className="num text-muted-foreground">{layerCounts[l]}</span>
              </button>
            ))}
          </div>

          <div className="overflow-auto rounded-lg border bg-[linear-gradient(0deg,var(--secondary)_1px,transparent_1px),linear-gradient(90deg,var(--secondary)_1px,transparent_1px)] [background-size:28px_28px]">
            <svg
              viewBox="0 0 860 700"
              className="w-full"
              style={{ height: 560 * zoom, minWidth: 700 }}
              role="img"
              aria-label="Enterprise architecture knowledge graph"
            >
              {visibleEdges.map(([a, b]) => {
                const na = nodes.find((n) => n.id === a)!;
                const nb = nodes.find((n) => n.id === b)!;
                const highlight = a === selectedId || b === selectedId;
                return (
                  <line
                    key={`${a}-${b}`}
                    x1={na.x + 70}
                    y1={na.y + 18}
                    x2={nb.x + 70}
                    y2={nb.y + 18}
                    stroke={highlight ? "var(--brand)" : "var(--border)"}
                    strokeWidth={highlight ? 2 : 1.2}
                    strokeDasharray={highlight ? undefined : "4 4"}
                  />
                );
              })}
              {visibleNodes.map((n) => {
                const isSelected = n.id === selectedId;
                const isNeighbor = connected.has(n.id);
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x},${n.y})`}
                    onClick={() => setSelectedId(n.id)}
                    className="cursor-pointer"
                  >
                    <rect
                      width={140}
                      height={36}
                      rx={8}
                      fill="var(--card)"
                      stroke={isSelected ? "var(--brand)" : isNeighbor ? layerTone[n.layer].color : "var(--border)"}
                      strokeWidth={isSelected ? 2.5 : 1.4}
                    />
                    <rect width={4} height={36} rx={2} fill={layerTone[n.layer].color} />
                    <circle cx={130} cy={10} r={4} fill={n.risk === "Critical" ? "var(--danger)" : n.risk === "High" ? "var(--warning)" : "var(--success)"} />
                    <text x={14} y={16} fontSize={10} fontWeight={600} fill="var(--foreground)">
                      {n.label.length > 20 ? `${n.label.slice(0, 19)}…` : n.label}
                    </text>
                    <text x={14} y={28} fontSize={8} fill="var(--muted-foreground)">
                      {n.layer}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title={selected.label} subtitle={selected.layer}>
            <div className="space-y-3 text-xs">
              <div className="flex flex-wrap gap-1.5">
                <StatusPill tone={riskTone[selected.risk]}>{selected.risk} Risk</StatusPill>
                <StatusPill tone="neutral">{selected.detail.criticality}</StatusPill>
              </div>
              <dl className="space-y-2">
                {[
                  ["Owner", selected.detail.owner],
                  ["Technology", selected.detail.stack],
                  ["Dependencies", String(selected.detail.dependencies)],
                  ["Consumers", String(selected.detail.consumers)],
                  ["Technical Debt", selected.detail.debt],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="num max-w-[60%] text-right font-medium text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-muted-foreground">Health Score</span>
                  <span className="num font-semibold text-foreground">{selected.detail.health}/100</span>
                </div>
                <ProgressBar
                  value={selected.detail.health}
                  tone={selected.detail.health >= 70 ? "success" : selected.detail.health >= 50 ? "warning" : "danger"}
                />
              </div>
              <div>
                <p className="mb-1.5 text-muted-foreground">Supported Capabilities</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.detail.capabilities.map((c) => (
                    <StatusPill key={c} tone="intel">
                      {c}
                    </StatusPill>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Connected Nodes" subtitle={`${connected.size} direct relationships`}>
            <ul className="space-y-2">
              {nodes
                .filter((n) => connected.has(n.id))
                .map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => setSelectedId(n.id)}
                      className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors hover:bg-secondary"
                    >
                      <span className="size-2 shrink-0 rounded-full" style={{ background: layerTone[n.layer].color }} />
                      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{n.label}</span>
                      <span className="text-[10px] text-muted-foreground">{n.layer}</span>
                    </button>
                  </li>
                ))}
            </ul>
          </Panel>

          <Panel title="Capability to Code Lineage" subtitle="Traceability coverage">
            <ul className="space-y-3 text-xs">
              {[
                { label: "Capability → Application", value: 94, tone: "success" as Tone },
                { label: "Application → Service", value: 88, tone: "success" as Tone },
                { label: "Service → Repository", value: 76, tone: "warning" as Tone },
                { label: "Repository → Business Rule", value: 61, tone: "warning" as Tone },
              ].map((l) => (
                <li key={l.label}>
                  <div className="mb-1 flex justify-between">
                    <span className="text-muted-foreground">{l.label}</span>
                    <span className="num font-semibold text-foreground">{l.value}%</span>
                  </div>
                  <ProgressBar value={l.value} tone={l.tone} />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
