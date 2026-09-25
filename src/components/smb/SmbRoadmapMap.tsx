"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { bundles, overarchingPainIds, pains } from "@/data/smb/assessment";
import { useSmbAssessment } from "@/components/smb/SmbAssessmentContext";
import { cn } from "@/lib/utils";

// Two columns instead of five — Pains and Bundles are the whole model this
// round, no agents defined yet for SMB. Same hover-trace mechanics as the
// other capability maps: shared membership lights up the connection,
// connector lines drawn between whichever columns are visible.

type ColumnKey = "pains" | "bundles";

interface MapNode {
  id: string;
  column: ColumnKey;
  title: string;
  caption?: string;
  connectsTo: Set<string>; // ids in the OTHER column this node relates to
}

const COLUMN_LABELS: Record<ColumnKey, string> = {
  pains: "Confirmed pains",
  bundles: "Bundles",
};

const DESKTOP_BREAKPOINT = 1024;

interface Line {
  id: string;
  d: string;
}

export function SmbRoadmapMap() {
  const { result } = useSmbAssessment();
  const { scoreablePainIds, overarchingSelected } = result;
  const selectedPainIds = useMemo(
    () => [...scoreablePainIds, ...overarchingSelected],
    [scoreablePainIds, overarchingSelected]
  );

  const allNodes = useMemo<MapNode[]>(() => {
    const painNodes: MapNode[] = selectedPainIds.map((id) => {
      const pain = pains.find((p) => p.id === id)!;
      const isOverarching = overarchingPainIds.includes(id);
      const connectsTo = new Set(
        isOverarching
          ? bundles.map((b) => `bundle:${b.id}`) // satisfied by any bundle
          : bundles.filter((b) => b.painIds.includes(id)).map((b) => `bundle:${b.id}`)
      );
      return {
        id: `pain:${id}`,
        column: "pains",
        title: pain.label,
        caption: isOverarching ? `→ ${pain.service} (any bundle)` : `→ ${pain.service}`,
        connectsTo,
      };
    });

    const bundleNodes: MapNode[] = bundles.map((b) => ({
      id: `bundle:${b.id}`,
      column: "bundles",
      title: b.label,
      caption: b.components.join(" + "),
      connectsTo: new Set(
        selectedPainIds
          .filter((id) => overarchingPainIds.includes(id) || b.painIds.includes(id))
          .map((id) => `pain:${id}`)
      ),
    }));

    return [...painNodes, ...bundleNodes];
  }, [selectedPainIds]);

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
    const activeNode = nodeById.get(activeId);
    if (!activeNode) return null;
    const set = new Set<string>([activeId]);
    activeNode.connectsTo.forEach((id) => set.add(id));
    return set;
  }, [activeId, nodeById]);

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

  if (selectedPainIds.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center max-w-2xl">
        <p className="text-sm text-slate-400">
          No pains confirmed yet — go back to the baseline and check at least one.
        </p>
      </div>
    );
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
        <div ref={containerRef} className="relative flex flex-col lg:flex-row lg:items-stretch gap-6">
          <svg className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block" aria-hidden="true">
            {lines.map((line) => (
              <path key={line.id} d={line.d} stroke="rgba(26,58,143,0.5)" strokeWidth={1.5} fill="none" />
            ))}
          </svg>

          {columns.map((column) => (
            <div
              key={column.key}
              className="flex flex-col lg:flex-1 lg:min-w-0 rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="flex items-baseline justify-between gap-2 bg-brand-navy px-4 py-3 flex-shrink-0">
                <p className="text-sm font-bold text-white">{COLUMN_LABELS[column.key]}</p>
                <p className="text-xs font-semibold text-white/60 flex-shrink-0">{column.nodes.length}</p>
              </div>

              <div className="flex-1 bg-slate-50 p-3 space-y-2">
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
    </div>
  );
}
