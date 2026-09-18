"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  HORIZON_DOT,
  agents,
  automationOpportunities,
  challenges,
  horizons,
  personas,
  problemStatements,
  themeLabels,
  type Horizon,
} from "@/data/finance/personas";
import { cn } from "@/lib/utils";

// Cloned from CapabilityMap.tsx: same five-column geometry, same single
// shared-key trace (here `themeId` instead of `pillarId`), same hover/lock/
// connector-line mechanics. The one addition is the DILO/MILO/YILO control,
// which filters only the Problem Statement column — every other column
// stays fully visible, exactly as no column in the original map is ever
// filtered; only what a user hovers changes.

type ColumnKey = "personas" | "problems" | "challenges" | "automation" | "agents";

interface MapNode {
  id: string;
  column: ColumnKey;
  title: string;
  caption?: string;
  badge?: string;
  themeIds: string[];
  horizonDots?: Horizon[];
}

const COLUMN_LABELS: Record<ColumnKey, string> = {
  personas: "Personas",
  problems: "Problem Statements",
  challenges: "Challenges",
  automation: "Automation Opportunity",
  agents: "Agents",
};

const COLUMN_DOTS: Partial<Record<ColumnKey, string>> = {
  personas: "bg-brand-blue",
  agents: "bg-brand-green",
};

function sharesTheme(a: MapNode, b: MapNode): boolean {
  return a.themeIds.some((id) => b.themeIds.includes(id));
}

interface Line {
  id: string;
  d: string;
}

const DESKTOP_BREAKPOINT = 1024;

const personaById = new Map(personas.map((p) => [p.id, p]));

// Which horizons each persona actually has a problem statement in — drives
// the small dot row on the persona card, always visible regardless of the
// active horizon filter.
const personaHorizons = new Map<string, Horizon[]>(
  personas.map((p) => [
    p.id,
    horizons.map((h) => h.id).filter((h) => problemStatements.some((ps) => ps.personaId === p.id && ps.horizon === h)),
  ])
);

function buildNodes(activeHorizon: Horizon): MapNode[] {
  const personaNodes: MapNode[] = personas.map((p) => ({
    id: `persona:${p.id}`,
    column: "personas",
    title: p.title,
    themeIds: p.themeIds,
    horizonDots: personaHorizons.get(p.id) ?? [],
  }));

  const problemNodes: MapNode[] = problemStatements
    .filter((ps) => ps.horizon === activeHorizon)
    .map((ps) => ({
      id: `problem:${ps.id}`,
      column: "problems",
      title: ps.label,
      caption: personaById.get(ps.personaId)?.title,
      themeIds: ps.themeIds,
    }));

  const challengeNodes: MapNode[] = challenges.map((c) => ({
    id: `challenge:${c.id}`,
    column: "challenges",
    title: c.label,
    caption: themeLabels(c.themeIds),
    themeIds: c.themeIds,
  }));

  const automationNodes: MapNode[] = automationOpportunities.map((a) => ({
    id: `automation:${a.id}`,
    column: "automation",
    title: a.label,
    caption: themeLabels(a.themeIds),
    themeIds: a.themeIds,
  }));

  const agentNodes: MapNode[] = agents.map((a) => ({
    id: `agent:${a.id}`,
    column: "agents",
    title: a.title,
    caption: a.description,
    badge: a.status === "live" ? "Built" : "In build",
    themeIds: a.themeIds,
  }));

  return [...personaNodes, ...problemNodes, ...challengeNodes, ...automationNodes, ...agentNodes];
}

export function FinancePersonaMap() {
  const [activeHorizon, setActiveHorizon] = useState<Horizon>("dilo");
  const activeHorizonInfo = horizons.find((h) => h.id === activeHorizon)!;

  const allNodes = useMemo(() => buildNodes(activeHorizon), [activeHorizon]);
  const nodeById = useMemo(() => new Map(allNodes.map((n) => [n.id, n])), [allNodes]);
  const columns = useMemo(
    () =>
      (Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => ({
        key,
        nodes: allNodes.filter((n) => n.column === key),
        dot: COLUMN_DOTS[key],
      })),
    [allNodes]
  );

  const [hoverId, setHoverId] = useState<string | null>(null);
  const [lockedId, setLockedId] = useState<string | null>(null);
  const activeId = lockedId ?? hoverId;
  const prefersReducedMotion = useReducedMotion();

  const connectedIds = useMemo(() => {
    if (!activeId) return null;
    const activeNode = nodeById.get(activeId);
    if (!activeNode) return null;
    const set = new Set<string>([activeId]);
    for (const n of allNodes) {
      if (n.id !== activeId && sharesTheme(activeNode, n)) set.add(n.id);
    }
    return set;
  }, [activeId, allNodes, nodeById]);

  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const [lines, setLines] = useState<Line[]>([]);

  const recomputeLines = useCallback(() => {
    if (!activeId || !connectedIds || typeof window === "undefined" || window.innerWidth < DESKTOP_BREAKPOINT) {
      setLines([]);
      return;
    }
    const container = containerRef.current;
    const activeNode = nodeById.get(activeId);
    const activeEl = nodeRefs.current.get(activeId);
    if (!container || !activeNode || !activeEl) {
      setLines([]);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const next: Line[] = [];

    connectedIds.forEach((targetId) => {
      if (targetId === activeId) return;
      const targetNode = nodeById.get(targetId);
      if (!targetNode || targetNode.column === activeNode.column) return;
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

  function selectHorizon(h: Horizon) {
    setActiveHorizon(h);
    handleReset();
  }

  return (
    <div>
      {/* ---- DILO / MILO / YILO ---- */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {horizons.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => selectHorizon(h.id)}
            aria-pressed={activeHorizon === h.id}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
              activeHorizon === h.id
                ? "bg-brand-blue text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", HORIZON_DOT[h.id], activeHorizon === h.id && "bg-white")} />
            {h.shortLabel} &middot; {h.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400 mb-6">{activeHorizonInfo.definition}</p>

      <div className="flex items-center justify-between gap-4 mb-5">
        <p className="text-sm text-slate-500">
          {lockedId
            ? "Trace locked — click the node again, click another node, or reset."
            : "Hover or focus any node to trace its connections."}
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
        <div ref={containerRef} className="relative flex flex-col lg:flex-row gap-6 lg:min-w-[1376px]">
          <svg className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block" aria-hidden="true">
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
                      {node.horizonDots && node.horizonDots.length > 0 && (
                        <div className="flex items-center gap-1 mb-1.5">
                          {node.horizonDots.map((h) => (
                            <span key={h} className={cn("h-1.5 w-1.5 rounded-full", HORIZON_DOT[h])} />
                          ))}
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        {column.dot && !node.horizonDots && (
                          <span className={cn("mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full", column.dot)} />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900 leading-snug">{node.title}</p>
                            {node.badge && (
                              <span
                                className={cn(
                                  "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                                  node.badge === "Built"
                                    ? "bg-brand-green/10 text-brand-green"
                                    : "bg-amber-100 text-amber-700"
                                )}
                              >
                                {node.badge}
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
                  <p className="p-3 text-xs text-slate-400">
                    No {COLUMN_LABELS[column.key].toLowerCase()} for this horizon.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-400 leading-relaxed max-w-3xl">
        Personas, problem statements and challenges are illustrative, informed by common finance
        operating-model engagement patterns — not any specific client. Agents marked &ldquo;Built&rdquo;
        already exist in the marketplace; &ldquo;In build&rdquo; agents are on the roadmap.
      </p>
    </div>
  );
}
