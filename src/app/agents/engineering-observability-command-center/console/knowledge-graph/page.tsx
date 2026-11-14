"use client";

import Link from "next/link";
import { obsHref } from "@/lib/engineering-observability/paths";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowRight, BrainCircuit, Database, Network, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/lib/engineering-observability/page-header";
import { Card } from "@/lib/engineering-observability/ui-atoms";
import { connectors, graphStats } from "@/lib/engineering-observability/enterprise-data";
import { entityColors, getGraphData, getNodePosition, graphDomains } from "@/lib/engineering-observability/graph-data";
import type { EntityType, KnowledgeNode } from "@/lib/engineering-observability/types";
import { cn } from "@/lib/engineering-observability/utils";


const allTypes = Object.keys(entityColors) as EntityType[];

const incidentPath = ["tel-latency", "inc-8421", "bs-payment", "db-payments", "chg-482", "agent-pii"];

function KnowledgeGraphPage() {
  const [activeTypes, setActiveTypes] = useState<Set<EntityType>>(new Set(allTypes));
  const [domainFilter, setDomainFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<KnowledgeNode | null>(null);
  const [showReasoning, setShowReasoning] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { nodes: flowNodes, edges: flowEdges, raw } = useMemo(() => {
    const data = getGraphData();
    const q = search.trim().toLowerCase();

    const visible = data.nodes.filter((n) => {
      if (!activeTypes.has(n.type)) return false;
      if (domainFilter !== "All" && n.domain && n.domain !== domainFilter) return false;
      if (q && !n.label.toLowerCase().includes(q)) return false;
      return true;
    });
    const visibleIds = new Set(visible.map((n) => n.id));

    const nodes: Node[] = visible.map((n, i) => {
      const isCore = i < 43;
      const pos = getNodePosition(i, visible.length, isCore);
      const color = entityColors[n.type];
      const onPath = showReasoning && incidentPath.includes(n.id);
      return {
        id: n.id,
        position: pos,
        data: { label: n.label },
        style: {
          background: onPath ? color : "#ffffff",
          color: onPath ? "#ffffff" : "#0F172A",
          border: `1.5px solid ${color}`,
          borderRadius: 8,
          fontSize: 10,
          fontWeight: 600,
          padding: "4px 8px",
          width: "auto",
          maxWidth: 150,
          boxShadow: onPath ? `0 0 0 3px ${color}44` : "0 1px 2px rgba(15,23,42,0.08)",
        },
      };
    });

    const edges: Edge[] = data.edges
      .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
      .map((e) => {
        const onPath =
          showReasoning &&
          incidentPath.includes(e.source) &&
          incidentPath.includes(e.target) &&
          Math.abs(incidentPath.indexOf(e.source) - incidentPath.indexOf(e.target)) === 1;
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: onPath ? e.relation : undefined,
          animated: onPath,
          style: {
            stroke: onPath ? "#DC2626" : "#CBD5E1",
            strokeWidth: onPath ? 2 : 1,
          },
          labelStyle: { fontSize: 9, fontWeight: 700, fill: "#DC2626" },
        };
      });

    return { nodes, edges, raw: data };
  }, [activeTypes, domainFilter, search, showReasoning]);

  const toggleType = (t: EntityType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const selectedEdges = selected
    ? raw.edges.filter((e) => e.source === selected.id || e.target === selected.id).slice(0, 8)
    : [];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Engineering Knowledge Graph"
        subtitle="The intelligence backbone — entities, relationships and AI reasoning across the enterprise"
        actions={
          <button
            onClick={() => setShowReasoning((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
              showReasoning
                ? "bg-ai text-primary-foreground"
                : "border border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            <BrainCircuit className="h-3.5 w-3.5" />
            {showReasoning ? "Hide AI reasoning path" : "Show AI reasoning path"}
          </button>
        }
      />

      {/* Data fabric status */}
      <Card title="Enterprise Data Fabric" subtitle="Live connectors feeding the knowledge graph" bodyClassName="p-0">
        <div className="grid grid-cols-2 divide-x divide-border md:grid-cols-4 xl:grid-cols-7">
          {connectors.map((c) => (
            <div key={c.id} className="border-b border-border px-4 py-3 xl:border-b-0">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-healthy animate-pulse-dot" />
                <span className="truncate text-xs font-semibold text-foreground">{c.name}</span>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">{c.category}</div>
              <div className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                {c.entities} entities · {c.lastSync}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-4">
        {/* Filters */}
        <div className="space-y-6 xl:col-span-1">
          <Card title="Entity Filters" subtitle={`${flowNodes.length} of ${raw.nodes.length} entities visible`}>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entities…"
                className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="mb-3 h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground"
              aria-label="Filter by domain"
            >
              <option>All</option>
              {graphDomains.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <div className="grid grid-cols-1 gap-1">
              {allTypes.map((t) => {
                const active = activeTypes.has(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
                      active
                        ? "border-border bg-background text-foreground"
                        : "border-border bg-muted text-muted-foreground opacity-50",
                    )}
                  >
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: entityColors[t] }} />
                    <span className="flex-1 font-medium">{t}</span>
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {raw.nodes.filter((n) => n.type === t).length}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title="Graph Statistics" subtitle="Full enterprise graph">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Entities" value={graphStats.totalEntities} />
              <Stat label="Relationships" value={graphStats.relationships} />
              <Stat label="Domains" value={String(graphStats.domains)} />
              <Stat label="Data sources" value={graphStats.dataSources} />
              <Stat label="New (24h)" value={graphStats.newEntities} />
              <Stat label="Updated (24h)" value={graphStats.updatedEntities} />
            </dl>
            <div className="mt-3 flex items-center gap-1.5 rounded-md bg-healthy-soft px-2.5 py-1.5 text-[11px] font-semibold text-healthy">
              <RefreshCw className="h-3 w-3" /> Synced {graphStats.lastUpdated} · {graphStats.conflictsResolved} conflicts auto-resolved
            </div>
          </Card>
        </div>

        {/* Graph canvas */}
        <Card
          title="Entity Graph"
          subtitle="Drag to pan · scroll to zoom · click a node for details"
          className="xl:col-span-3"
          bodyClassName="p-0"
        >
          <div className="h-[560px] w-full overflow-hidden rounded-b-lg">
            {!mounted ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading graph…
              </div>
            ) : (
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              fitView
              minZoom={0.15}
              maxZoom={2}
              onNodeClick={(_, node) => {
                const found = raw.nodes.find((n) => n.id === node.id);
                setSelected(found ?? null);
              }}
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={24} color="#E2E8F0" />
              <MiniMap
                pannable
                zoomable
                style={{ width: 140, height: 90 }}
                nodeColor={(n) => {
                  const kn = raw.nodes.find((x) => x.id === n.id);
                  return kn ? entityColors[kn.type] : "#CBD5E1";
                }}
              />
              <Controls showInteractive={false} />
            </ReactFlow>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Selected node */}
        <Card
          title={selected ? `Entity: ${selected.label}` : "Entity Inspector"}
          subtitle={selected ? selected.type : "Click any node in the graph"}
          action={
            selected ? (
              <span
                className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground"
                style={{ background: entityColors[selected.type] }}
              >
                {selected.type}
              </span>
            ) : (
              <Network className="h-4 w-4 text-muted-foreground" />
            )
          }
        >
          {selected ? (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Domain" value={selected.domain ?? "Cross-domain"} />
                <Stat label="Status" value={selected.status ?? "n/a"} />
                <Stat label="Relationships" value={String(raw.edges.filter((e) => e.source === selected.id || e.target === selected.id).length)} />
                <Stat label="Detail" value={selected.meta ?? "—"} />
              </div>
              <div className="mt-3">
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Relationships
                </div>
                <ul className="space-y-1">
                  {selectedEdges.map((e) => {
                    const other = e.source === selected.id ? e.target : e.source;
                    const otherNode = raw.nodes.find((n) => n.id === other);
                    return (
                      <li key={e.id} className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 text-xs">
                        <span className="font-bold text-primary">{e.relation}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <button
                          className="font-medium text-foreground hover:text-primary"
                          onClick={() => otherNode && setSelected(otherNode)}
                        >
                          {otherNode?.label ?? other}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select an entity to inspect its type, domain, status and relationships. Try{" "}
              <button className="font-semibold text-primary" onClick={() => setSelected(raw.nodes.find((n) => n.id === "bs-payment") ?? null)}>
                Payment API
              </button>{" "}
              or{" "}
              <button className="font-semibold text-primary" onClick={() => setSelected(raw.nodes.find((n) => n.id === "inc-8421") ?? null)}>
                INC-8421
              </button>
              .
            </p>
          )}
        </Card>

        {/* AI reasoning path */}
        <Card
          title="AI Reasoning Path — INC-8421"
          subtitle="How the AI traversed the graph to reach the root cause"
          action={<BrainCircuit className="h-4 w-4 text-ai" />}
        >
          <ol className="space-y-2">
            {[
              { from: "Telemetry: Latency ↑42%, Errors ↑17%", rel: "CORRELATED_WITH", to: "INC-8421" },
              { from: "INC-8421", rel: "IMPACTS", to: "Payment API" },
              { from: "Payment API", rel: "DEPENDS_ON", to: "Payments DB (pool 96%)" },
              { from: "Payments DB saturation", rel: "CAUSED_BY", to: "Deploy payment-service v4.8.2" },
              { from: "INC-8421", rel: "REQUIRES_CAPABILITY", to: "Payment Incident Investigator (94%)" },
            ].map((hop, i) => (
              <li key={i} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-ai-soft text-[10px] font-bold text-ai">
                  {i + 1}
                </span>
                <span className="font-medium text-foreground">{hop.from}</span>
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                  {hop.rel}
                </span>
                <span className="font-medium text-foreground">{hop.to}</span>
              </li>
            ))}
          </ol>
          <Link
            href={obsHref("/ai-insights")}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-ai px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <Database className="h-3.5 w-3.5" /> Open full AI investigation <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold text-foreground">{value}</dd>
    </div>
  );
}

export default KnowledgeGraphPage;
