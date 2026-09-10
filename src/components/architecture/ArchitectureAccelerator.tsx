"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { layers, scenarios, stacks, type ArchCapability, type LayerId } from "@/data/architecture/scenarios";
import { cn } from "@/lib/utils";

// The per-capability correlation map: three columns — Challenges / Stack
// options / Recommendation (rendered separately, below, not as a map node).
// Same visual structure and interaction as CapabilityMap.tsx: header bars,
// hover-trace, click-to-lock, connector lines, focus-visible rings,
// useReducedMotion — cloned directly rather than inventing a new model.

type ColumnKey = "challenges" | "stacks";

interface MapNode {
  id: string;
  column: ColumnKey;
  title: string;
  caption?: string;
  challengeId: string;
}

const COLUMN_LABELS: Record<ColumnKey, string> = {
  challenges: "Challenges",
  stacks: "Stack options",
};

const DESKTOP_BREAKPOINT = 1024;

interface Line {
  id: string;
  d: string;
}

function CorrelationMap({ capability }: { capability: ArchCapability }) {
  const allNodes = useMemo<MapNode[]>(() => {
    const challengeNodes: MapNode[] = capability.challenges.map((c) => ({
      id: `challenge:${c.id}`,
      column: "challenges",
      title: c.label,
      challengeId: c.id,
    }));

    const stackNodes: MapNode[] = capability.challenges.flatMap((c) =>
      c.responses.map((r) => {
        const stackLabel = stacks.find((s) => s.id === r.stackId)?.label ?? r.stackId;
        return {
          id: `stack:${c.id}:${r.stackId}`,
          column: "stacks" as const,
          title: stackLabel,
          caption: r.summary,
          challengeId: c.id,
        };
      })
    );

    return [...challengeNodes, ...stackNodes];
  }, [capability]);

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

  const connectedIds = useMemo(() => {
    if (!activeId) return null;
    const active = nodeById.get(activeId);
    if (!active) return null;
    const set = new Set<string>([activeId]);
    for (const n of allNodes) {
      if (n.id !== activeId && n.challengeId === active.challengeId) set.add(n.id);
    }
    return set;
  }, [activeId, allNodes, nodeById]);

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

  const recommendedStack = stacks.find((s) => s.id === capability.recommendation.stackId)?.label;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-5">
        <p className="text-sm text-slate-500">
          {lockedId
            ? "Trace locked — click the node again, click another node, or reset."
            : "Hover or focus a challenge to see how each stack answers it."}
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
        <div ref={containerRef} className="relative flex flex-col lg:flex-row gap-6 lg:min-w-[900px]">
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
              className={cn(
                "flex flex-col rounded-xl border border-slate-200 overflow-hidden lg:h-[520px]",
                column.key === "challenges" ? "lg:w-64 lg:flex-shrink-0" : "lg:flex-1 lg:min-w-0"
              )}
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
                      <p className="text-sm font-semibold text-slate-900 leading-snug">{node.title}</p>
                      {node.caption && (
                        <p className="mt-1 text-xs text-slate-500 leading-snug">{node.caption}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-brand-blue/20 bg-brand-soft p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-blue mb-1">
          Recommendation &middot; {recommendedStack}
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">{capability.recommendation.note}</p>
      </div>
    </div>
  );
}

export function ArchitectureAccelerator() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0];

  const activeLayers = useMemo(
    () =>
      layers
        .filter((l) => scenario.capabilities.some((c) => c.layerId === l.id))
        .sort((a, b) => a.order - b.order),
    [scenario]
  );

  const [layerId, setLayerId] = useState<LayerId | null>(activeLayers[0]?.id ?? null);

  // Reset layer/capability selection whenever the scenario changes so a stale
  // layer id from the previous scenario can't linger.
  useEffect(() => {
    setLayerId(activeLayers[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  const layerCapabilities = useMemo(
    () => scenario.capabilities.filter((c) => c.layerId === layerId),
    [scenario, layerId]
  );

  const [activeCapabilityId, setActiveCapabilityId] = useState<string | null>(
    layerCapabilities[0]?.id ?? null
  );

  useEffect(() => {
    setActiveCapabilityId(layerCapabilities[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerId, scenarioId]);

  const activeCapability = layerCapabilities.find((c) => c.id === activeCapabilityId) ?? null;

  return (
    <div>
      {/* ---- scenario picker ---- */}
      <div className="mb-8 max-w-md">
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">
          Scenario
        </label>
        <select
          value={scenarioId}
          onChange={(e) => setScenarioId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id} disabled={s.status === "coming-soon"}>
              {s.label}
              {s.status === "coming-soon" ? " (in progress)" : ""}
            </option>
          ))}
        </select>
      </div>

      {scenario.status === "coming-soon" ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
          <p className="text-sm text-slate-500">This scenario is in progress. Check back soon.</p>
        </div>
      ) : (
        <>
          {/* ---- layer navigation ---- */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {activeLayers.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLayerId(l.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
                  layerId === l.id
                    ? "bg-brand-blue text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-400 mb-8">
            Same capability-mapping approach used across our TMT and process-automation tools.
          </p>

          {/* ---- capability cards for the active layer ---- */}
          <div className="grid gap-3 sm:grid-cols-2 mb-10">
            {layerCapabilities.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCapabilityId(c.id)}
                className={cn(
                  "text-left rounded-xl border bg-white p-4 transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
                  activeCapabilityId === c.id
                    ? "border-brand-blue shadow-card-hover"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <p className="text-sm font-bold text-slate-900 leading-snug mb-1.5">{c.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{c.rationale}</p>
              </button>
            ))}
          </div>

          {/* ---- correlation map for the active capability ---- */}
          {activeCapability && <CorrelationMap capability={activeCapability} />}
        </>
      )}
    </div>
  );
}
