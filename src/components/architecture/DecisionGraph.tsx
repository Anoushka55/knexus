"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  architecturePatterns,
  capabilities,
  challenges,
  domains,
  technologyOptions,
  type ArchitecturePattern,
  type Capability,
  type Challenge,
  type DomainId,
  type Ecosystem,
  type Tier,
  type TechnologyOption,
} from "@/data/architecture/graph";
import { cn } from "@/lib/utils";

// A domain-filterable, four-column, bidirectional trace graph. Visual chrome
// (column bars, card styling, focus rings, motion handling, connector-line
// rendering) is cloned from CapabilityMap.tsx; the trace logic underneath is
// new — a real BFS across three distinct typed edges rather than one shared
// key, because there is no single field every node carries this time.

type NodeKind = "challenge" | "capability" | "tech" | "pattern";
type ColumnKey = "challenges" | "capabilities" | "technologyOptions" | "architecturePatterns";

interface NodeRef {
  kind: NodeKind;
  id: string;
}

function refKey(r: NodeRef): string {
  return `${r.kind}:${r.id}`;
}

const COLUMN_LABELS: Record<ColumnKey, string> = {
  challenges: "Challenges",
  capabilities: "Capabilities",
  technologyOptions: "Technology options",
  architecturePatterns: "Architecture patterns",
};

const ECOSYSTEM_LABEL: Record<Ecosystem, string> = {
  microsoft: "Microsoft",
  sap: "SAP",
  open: "Open",
};

// Three distinct, consistent colors reused across the whole component —
// existing design tokens, nothing new invented.
const ECOSYSTEM_DOT: Record<Ecosystem, string> = {
  microsoft: "bg-brand-blue",
  sap: "bg-brand-violet",
  open: "bg-brand-green",
};

const TIER_LABEL: Record<Tier, string> = { low: "Low", medium: "Medium", high: "High" };
const TIER_LEVEL: Record<Tier, number> = { low: 1, medium: 2, high: 3 };

interface MapNode {
  ref: NodeRef;
  id: string;
  column: ColumnKey;
  title: string;
  caption?: string;
  ecosystem?: Ecosystem;
  domainIds: DomainId[];
}

// ---- the three typed edges, and the BFS that walks all of them ----

const capabilityById = new Map(capabilities.map((c) => [c.id, c]));
const techById = new Map(technologyOptions.map((t) => [t.id, t]));
const patternById = new Map(architecturePatterns.map((p) => [p.id, p]));

/**
 * Connected set reachable from `start`, walked across all three edge types —
 * bounded to the direct chain rather than an unrestricted graph-wide BFS.
 *
 * An unbounded walk was tried first and rejected: architecture patterns share
 * enough technology options (model-ms alone sits in all four patterns) that
 * the graph is one fully connected component — every node reaches all 48,
 * every hover highlights everything, and nothing is ever dimmed. That passes
 * the letter of "reaches its tech options and the patterns containing them"
 * but defeats the entire purpose of a trace.
 *
 * So each edge type is only crossed once outward from the origin, in the
 * direction the origin implies, and once back the other way — never through
 * a node's *other* connections. Concretely: from a capability, its own
 * challenges (1 hop back) and its own tech options (1 hop forward), then the
 * patterns that contain THOSE tech options (2 hops forward) — not that
 * pattern's other tech options, and not the capabilities behind those.
 */
function computeConnected(start: NodeRef): Set<string> {
  const visited = new Set<string>([refKey(start)]);
  const add = (kind: NodeKind, id: string) => visited.add(refKey({ kind, id }));

  switch (start.kind) {
    case "challenge": {
      // -> capabilities citing it (1 hop)
      const caps = capabilities.filter((c) => c.challengeIds.includes(start.id));
      caps.forEach((c) => add("capability", c.id));
      // -> their tech options (2 hops)
      const capIds = new Set(caps.map((c) => c.id));
      const techs = technologyOptions.filter((t) => t.capabilityIds.some((id) => capIds.has(id)));
      techs.forEach((t) => add("tech", t.id));
      // -> patterns containing those tech options (3 hops)
      const techIds = new Set(techs.map((t) => t.id));
      architecturePatterns
        .filter((p) => p.techOptionIds.some((id) => techIds.has(id)))
        .forEach((p) => add("pattern", p.id));
      break;
    }
    case "capability": {
      const capability = capabilityById.get(start.id);
      if (!capability) break;
      // its own challenges (1 hop back)
      capability.challengeIds.forEach((id) => add("challenge", id));
      // its own tech options (1 hop forward)
      const techs = technologyOptions.filter((t) => t.capabilityIds.includes(start.id));
      techs.forEach((t) => add("tech", t.id));
      // patterns containing those tech options (2 hops forward) — not
      // those patterns' other tech options, which is what caused the
      // full-graph collapse in the unbounded version.
      const techIds = new Set(techs.map((t) => t.id));
      architecturePatterns
        .filter((p) => p.techOptionIds.some((id) => techIds.has(id)))
        .forEach((p) => add("pattern", p.id));
      break;
    }
    case "tech": {
      const tech = techById.get(start.id);
      if (!tech) break;
      // its own capabilities (1 hop back) and their challenges (2 hops back)
      tech.capabilityIds.forEach((capId) => {
        add("capability", capId);
        capabilityById.get(capId)?.challengeIds.forEach((id) => add("challenge", id));
      });
      // patterns containing this tech option (1 hop forward)
      architecturePatterns
        .filter((p) => p.techOptionIds.includes(start.id))
        .forEach((p) => add("pattern", p.id));
      break;
    }
    case "pattern": {
      const pattern = patternById.get(start.id);
      if (!pattern) break;
      // its own tech options (1 hop back), their capabilities (2 hops
      // back), and those capabilities' challenges (3 hops back) — the
      // full recipe behind this pattern, not sibling patterns that
      // happen to share one of the same tech options.
      pattern.techOptionIds.forEach((techId) => {
        add("tech", techId);
        techById.get(techId)?.capabilityIds.forEach((capId) => {
          add("capability", capId);
          capabilityById.get(capId)?.challengeIds.forEach((id) => add("challenge", id));
        });
      });
      break;
    }
  }

  return visited;
}

const DESKTOP_BREAKPOINT = 1024;

interface Line {
  id: string;
  d: string;
}

function TierBar({ label, tier }: { label: string; tier: Tier }) {
  const level = TIER_LEVEL[tier];
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span
          className={cn(
            "text-xs font-bold",
            tier === "high" ? "text-brand-blue" : tier === "medium" ? "text-slate-600" : "text-slate-400"
          )}
        >
          {TIER_LABEL[tier]}
        </span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3].map((seg) => (
          <span
            key={seg}
            className={cn("h-1.5 flex-1 rounded-full", seg <= level ? "bg-brand-blue" : "bg-slate-200")}
          />
        ))}
      </div>
    </div>
  );
}

function PatternDetailPanel({ pattern }: { pattern: ArchitecturePattern }) {
  const recommendedForLabels = pattern.recommendedFor
    .map((id) => capabilityById.get(id)?.label)
    .filter((label): label is string => Boolean(label));

  return (
    <div className="mt-4 rounded-xl border border-brand-blue/20 bg-brand-soft p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-blue mb-1">
            Architecture pattern
          </p>
          <p className="text-base font-bold text-slate-900">{pattern.label}</p>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">{pattern.description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TCO</p>
          <p className="text-sm font-bold text-slate-800">{TIER_LABEL[pattern.tco]}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mb-4">
        <TierBar label="Capability fit" tier={pattern.tradeoffs.capabilityFit} />
        <TierBar label="Complexity" tier={pattern.tradeoffs.complexity} />
        <TierBar label="Portability" tier={pattern.tradeoffs.portability} />
        <TierBar label="Vendor dependency" tier={pattern.tradeoffs.vendorDependency} />
        <TierBar label="Scalability" tier={pattern.tradeoffs.scalability} />
        <TierBar label="Integration effort" tier={pattern.tradeoffs.integrationEffort} />
      </div>

      <p className="text-sm text-slate-700 leading-relaxed mb-3">{pattern.rationale}</p>

      {recommendedForLabels.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">
            Recommended for
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {recommendedForLabels.map((label) => (
              <li
                key={label}
                className="rounded-full bg-white border border-brand-blue/20 px-2.5 py-1 text-xs font-medium text-brand-blue"
              >
                {label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function DecisionGraph() {
  // ---- domain filter: multi-select chips, empty set = "All" ----
  const [selectedDomains, setSelectedDomains] = useState<Set<DomainId>>(new Set());

  function toggleDomain(id: DomainId) {
    setSelectedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedDomains(new Set());
  }

  const domainVisible = useCallback(
    (domainIds: DomainId[]) => selectedDomains.size === 0 || domainIds.some((d) => selectedDomains.has(d)),
    [selectedDomains]
  );

  // ---- build the four node columns, filtered by domain ----
  const allNodes = useMemo<MapNode[]>(() => {
    const challengeNodes: MapNode[] = (challenges as Challenge[])
      .filter((c) => domainVisible(c.domainIds))
      .map((c) => ({
        ref: { kind: "challenge", id: c.id },
        id: refKey({ kind: "challenge", id: c.id }),
        column: "challenges",
        title: c.label,
        domainIds: c.domainIds,
      }));

    const capabilityNodes: MapNode[] = (capabilities as Capability[])
      .filter((c) => domainVisible(c.domainIds))
      .map((c) => ({
        ref: { kind: "capability", id: c.id },
        id: refKey({ kind: "capability", id: c.id }),
        column: "capabilities",
        title: c.label,
        caption: c.rationale,
        domainIds: c.domainIds,
      }));

    const techNodes: MapNode[] = (technologyOptions as TechnologyOption[])
      .filter((t) => domainVisible(t.domainIds))
      .map((t) => ({
        ref: { kind: "tech", id: t.id },
        id: refKey({ kind: "tech", id: t.id }),
        column: "technologyOptions",
        title: t.label,
        caption: t.note,
        ecosystem: t.ecosystem,
        domainIds: t.domainIds,
      }));

    const patternNodes: MapNode[] = (architecturePatterns as ArchitecturePattern[])
      .filter((p) => domainVisible(p.domainIds))
      .map((p) => ({
        ref: { kind: "pattern", id: p.id },
        id: refKey({ kind: "pattern", id: p.id }),
        column: "architecturePatterns",
        title: p.label,
        caption: p.description,
        domainIds: p.domainIds,
      }));

    return [...challengeNodes, ...capabilityNodes, ...techNodes, ...patternNodes];
  }, [domainVisible]);

  const nodeById = useMemo(() => new Map(allNodes.map((n) => [n.id, n])), [allNodes]);

  const columns = useMemo(
    () =>
      (Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => ({
        key,
        nodes: allNodes.filter((n) => n.column === key),
      })),
    [allNodes]
  );

  const [hoverId, setHoverId] = useState<string | null>(null);
  const [lockedId, setLockedId] = useState<string | null>(null);
  const activeId = lockedId ?? hoverId;
  const prefersReducedMotion = useReducedMotion();

  // BFS runs over the full, unfiltered graph — domain filtering only decides
  // what is rendered; a node not currently visible simply never appears, so
  // there's nothing to highlight regardless of whether it's in the set.
  const connectedIds = useMemo(() => {
    if (!activeId) return null;
    const activeNode = nodeById.get(activeId);
    if (!activeNode) return null;
    return computeConnected(activeNode.ref);
  }, [activeId, nodeById]);

  const activeNode = activeId ? nodeById.get(activeId) ?? null : null;
  const activePattern =
    activeNode?.ref.kind === "pattern" ? patternById.get(activeNode.ref.id) ?? null : null;

  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const [lines, setLines] = useState<Line[]>([]);

  const recomputeLines = useCallback(() => {
    if (
      !activeId ||
      !connectedIds ||
      typeof window === "undefined" ||
      window.innerWidth < DESKTOP_BREAKPOINT
    ) {
      setLines([]);
      return;
    }
    const container = containerRef.current;
    const activeMapNode = nodeById.get(activeId);
    const activeEl = nodeRefs.current.get(activeId);
    if (!container || !activeMapNode || !activeEl) {
      setLines([]);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const next: Line[] = [];

    connectedIds.forEach((targetId) => {
      if (targetId === activeId) return;
      const targetNode = nodeById.get(targetId);
      if (!targetNode || targetNode.column === activeMapNode.column) return;
      const targetEl = nodeRefs.current.get(targetId);
      if (!targetEl) return;

      const targetRect = targetEl.getBoundingClientRect();
      const activeIsLeft = activeRect.left < targetRect.left;
      const x1 = (activeIsLeft ? activeRect.right : activeRect.left) - containerRect.left;
      const y1 = activeRect.top + activeRect.height / 2 - containerRect.top;
      const x2 = (activeIsLeft ? targetRect.left : targetRect.right) - containerRect.left;
      const y2 = targetRect.top + targetRect.height / 2 - containerRect.top;
      const dx = (x2 - x1) / 2;

      next.push({
        id: `${activeId}->${targetId}`,
        d: `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`,
      });
    });

    setLines(next);
  }, [activeId, connectedIds, nodeById]);

  useLayoutEffect(() => {
    recomputeLines();
  }, [recomputeLines]);

  useEffect(() => {
    if (!activeId) return;
    const scroller = containerRef.current?.parentElement;
    window.addEventListener("resize", recomputeLines);
    scroller?.addEventListener("scroll", recomputeLines, { passive: true });
    return () => {
      window.removeEventListener("resize", recomputeLines);
      scroller?.removeEventListener("scroll", recomputeLines);
    };
  }, [activeId, recomputeLines]);

  function handleHoverStart(id: string) {
    if (lockedId) return;
    setHoverId(id);
  }
  function handleHoverEnd() {
    if (lockedId) return;
    setHoverId(null);
  }
  function handleNodeClick(id: string) {
    setLockedId((current) => (current === id ? null : id));
  }
  function handleReset() {
    setLockedId(null);
    setHoverId(null);
  }

  return (
    <div>
      {/* ---- domain filter row ---- */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          type="button"
          onClick={selectAll}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
            selectedDomains.size === 0
              ? "bg-brand-blue text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          All
        </button>
        {domains
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => toggleDomain(d.id)}
              aria-pressed={selectedDomains.has(d.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
                selectedDomains.has(d.id)
                  ? "bg-brand-blue text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {d.label}
            </button>
          ))}
      </div>

      {/* ---- ecosystem legend ---- */}
      <div className="flex flex-wrap items-center gap-4 mb-5">
        {(Object.keys(ECOSYSTEM_LABEL) as Ecosystem[]).map((eco) => (
          <span key={eco} className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className={cn("h-2 w-2 rounded-full", ECOSYSTEM_DOT[eco])} />
            {ECOSYSTEM_LABEL[eco]}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 mb-5">
        <p className="text-sm text-slate-500">
          {lockedId
            ? "Trace locked — click the node again, click another node, or reset."
            : "Hover or focus any node to trace its connections across the graph."}
        </p>
        <button
          type="button"
          onClick={handleReset}
          disabled={!lockedId}
          className={cn(
            "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
            lockedId
              ? "border-brand-blue text-brand-blue hover:bg-brand-soft"
              : "border-slate-200 text-slate-300 cursor-not-allowed"
          )}
        >
          Reset
        </button>
      </div>

      <div className="overflow-x-auto pb-2">
        <div ref={containerRef} className="relative flex flex-col lg:flex-row gap-6 lg:min-w-[1096px]">
          <svg
            className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
            aria-hidden="true"
          >
            {lines.map((line) => (
              <path key={line.id} d={line.d} stroke="rgba(26,58,143,0.5)" strokeWidth={1} fill="none" />
            ))}
          </svg>

          {columns.map((column) => (
            <div
              key={column.key}
              className="flex flex-col lg:w-64 lg:flex-shrink-0 rounded-xl border border-slate-200 overflow-hidden lg:h-[600px]"
            >
              <div className="flex items-baseline justify-between gap-2 bg-brand-navy px-4 py-3 flex-shrink-0">
                <p className="text-sm font-bold text-white">{COLUMN_LABELS[column.key]}</p>
                <p className="text-xs font-semibold text-white/60 flex-shrink-0">{column.nodes.length}</p>
              </div>

              <div className="flex-1 lg:overflow-y-auto bg-slate-50 p-3 space-y-2">
                {column.nodes.map((node) => {
                  const status: "active" | "dimmed" | "normal" = !activeId || !connectedIds
                    ? "normal"
                    : connectedIds.has(node.id)
                      ? "active"
                      : "dimmed";

                  const showRecommendedBadge =
                    node.ref.kind === "pattern" &&
                    activeNode?.ref.kind === "capability" &&
                    patternById.get(node.ref.id)?.recommendedFor.includes(activeNode.ref.id);

                  return (
                    <button
                      key={node.id}
                      ref={(el) => {
                        if (el) nodeRefs.current.set(node.id, el);
                        else nodeRefs.current.delete(node.id);
                      }}
                      type="button"
                      aria-pressed={lockedId === node.id}
                      onMouseEnter={() => handleHoverStart(node.id)}
                      onMouseLeave={handleHoverEnd}
                      onFocus={() => handleHoverStart(node.id)}
                      onBlur={handleHoverEnd}
                      onClick={() => handleNodeClick(node.id)}
                      className={cn(
                        "w-full text-left rounded-lg border bg-white p-3",
                        "transition-[transform,box-shadow,border-color,background-color] duration-200 motion-reduce:transition-none",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
                        status === "active" &&
                          (prefersReducedMotion
                            ? "border-brand-blue bg-brand-soft"
                            : "border-brand-blue shadow-card-hover scale-[1.02]"),
                        status === "dimmed" &&
                          (prefersReducedMotion
                            ? "border-slate-100 bg-slate-50"
                            : "border-slate-200 opacity-30"),
                        status === "normal" && "border-slate-200"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {node.ecosystem && (
                          <span
                            className={cn(
                              "mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full",
                              ECOSYSTEM_DOT[node.ecosystem]
                            )}
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900 leading-snug">
                              {node.title}
                            </p>
                            {showRecommendedBadge && (
                              <span className="flex-shrink-0 rounded-full bg-brand-green/10 px-2 py-0.5 text-[10px] font-bold text-brand-green">
                                Recommended
                              </span>
                            )}
                          </div>
                          {node.caption && (
                            <p className="mt-1 text-xs text-slate-500 leading-snug">{node.caption}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {column.nodes.length === 0 && (
                  <p className="p-3 text-xs text-slate-400">No nodes for the selected domains.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {activePattern && <PatternDetailPanel pattern={activePattern} />}
    </div>
  );
}
