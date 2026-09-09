"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useAssessment } from "@/components/test/AssessmentContext";
import { p2p } from "@/data/finance/p2p";
import { recommendAgents } from "@/lib/assessment/scoring";
import { MODE_LABEL } from "@/lib/assessment/types";
import { cn } from "@/lib/utils";

// Same shape as the Capability Map, joined on activity instead of pillar.
type ColumnKey = "activities" | "challenges" | "agents" | "proof";

interface MapNode {
  id: string;
  column: ColumnKey;
  title: string;
  caption?: string;
  activityIds: string[];
}

const COLUMN_LABELS: Record<ColumnKey, string> = {
  activities: "Activities to fix",
  challenges: "Challenges",
  agents: "Agents",
  proof: "Proof points",
};

const COLUMN_DOTS: Partial<Record<ColumnKey, string>> = {
  activities: "bg-brand-blue",
  agents: "bg-brand-violet",
};

function sharesActivity(a: MapNode, b: MapNode): boolean {
  return a.activityIds.some((id) => b.activityIds.includes(id));
}

interface Line {
  id: string;
  d: string;
}

const DESKTOP_BREAKPOINT = 1024;

export function RoadmapMap() {
  const { result } = useAssessment();

  const allNodes = useMemo<MapNode[]>(() => {
    // Only rows with time still on the table earn a place on the map.
    const open = result.activities
      .filter((r) => r.recoverableMinutes > 0.5)
      .sort((a, b) => b.recoverableMinutes - a.recoverableMinutes);

    const openIds = new Set(open.map((r) => r.activity.id));

    const activityNodes: MapNode[] = open.map((r) => ({
      id: `activity:${r.activity.id}`,
      column: "activities",
      title: r.activity.label,
      caption: `${MODE_LABEL[r.currentMode]} → ${MODE_LABEL[r.ceilingMode]} · ${r.recoverableMinutes.toFixed(0)} min`,
      activityIds: [r.activity.id],
    }));

    const challengeNodes: MapNode[] = p2p.challenges
      .filter((c) => result.liveChallengeIds.includes(c.id))
      .map((c) => ({
        id: `challenge:${c.id}`,
        column: "challenges" as const,
        title: c.label,
        caption: "Surfaced by the rows still below automated",
        activityIds: p2p.activities
          .filter((a) => a.challengeIds.includes(c.id) && openIds.has(a.id))
          .map((a) => a.id),
      }));

    const agentNodes: MapNode[] = recommendAgents(p2p, result).map((m) => ({
      id: `agent:${m.agent.id}`,
      column: "agents" as const,
      title: m.agent.title,
      caption: `${m.agent.status === "live" ? "Built" : "In build"} · ${m.minutes.toFixed(0)} min across ${m.activityIds.length} ${m.activityIds.length === 1 ? "activity" : "activities"}`,
      activityIds: m.activityIds,
    }));

    // Only creds carrying activityIds surface here; `descriptor` is the
    // anonymized client string, so no real client name ever reaches the map.
    const proofNodes: MapNode[] = p2p.proof
      .filter((pp) => pp.activityIds.some((id) => openIds.has(id)))
      .map((pp) => ({
        id: `proof:${pp.id}`,
        column: "proof" as const,
        title: pp.descriptor,
        caption: pp.blurb,
        activityIds: pp.activityIds.filter((id) => openIds.has(id)),
      }));

    return [...activityNodes, ...challengeNodes, ...agentNodes, ...proofNodes];
  }, [result]);

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
      if (n.id !== activeId && sharesActivity(activeNode, n)) set.add(n.id);
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

  return (
    <div>
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
                        {column.dot && (
                          <span className={cn("mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full", column.dot)} />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-900 leading-snug">{node.title}</p>
                          {node.caption && (
                            <p className="mt-1 text-xs text-slate-500 leading-snug">{node.caption}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {column.nodes.length === 0 && (
                  <p className="p-3 text-xs text-slate-400">Nothing outstanding here.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-400 leading-relaxed max-w-3xl">
        Minutes are recoverable human time per {p2p.unit}, after the net-increment rule — an activity
        already running unattended contributes only the step from automated to AI, not the full swing
        from manual. Proof points are representative, anonymized KPMG engagements mapped to an
        activity for illustration — not client-specific measurements.
      </p>
    </div>
  );
}
