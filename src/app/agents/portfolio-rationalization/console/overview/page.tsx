"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { useSession } from "@/lib/portfolio-rationalization/session";

const BASE = "/agents/portfolio-rationalization/console";

/**
 * Ported from the standalone app's "Overview" tab: the landing screen with the
 * six-segment portfolio lifecycle wheel. Each segment jumps to the matching
 * phase of the Data Ingest wizard (the standalone did the same with
 * `go('ingest'); gotoPhase(n)`).
 */
const SEGMENTS = [
  { phase: 1, label: "DISCOVER", path: "M50 50 L50 2 L91.6 26 Z", fill: "#00338D", x: 64, y: 27, hint: "Organisation context" },
  { phase: 2, label: "ANALYSE", path: "M50 50 L91.6 26 L91.6 74 Z", fill: "#0052ff", x: 78, y: 51, hint: "Tool inventory" },
  { phase: 3, label: "MEASURE", path: "M50 50 L91.6 74 L50 98 Z", fill: "#6a3ad0", x: 64, y: 75, hint: "Business priorities" },
  { phase: 4, label: "DECIDE", path: "M50 50 L50 98 L8.4 74 Z", fill: "#131b2e", x: 36, y: 75, hint: "Technical constraints" },
  { phase: 5, label: "EXECUTE", path: "M50 50 L8.4 74 L8.4 26 Z", fill: "#283044", x: 22, y: 51, hint: "Financial targets" },
  { phase: 6, label: "ITERATE", path: "M50 50 L8.4 26 L50 2 Z", fill: "#005471", x: 36, y: 27, hint: "Review and run assessment" },
] as const;

const SPOKES: Array<[number, number]> = [
  [50, 2],
  [91.6, 26],
  [91.6, 74],
  [50, 98],
  [8.4, 74],
  [8.4, 26],
];

const STEPS = [
  { label: "Assess", muted: false },
  { label: "Analyse", muted: true },
  { label: "Recommend", muted: true },
  { label: "Deliver Outcomes", muted: false, accent: true },
];

export default function OverviewPage() {
  const router = useRouter();
  const { setPhase, tools } = useSession();

  function openPhase(n: number) {
    setPhase(n);
    router.push(`${BASE}/ingest`);
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-white">
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(#e2e8f0 1px,transparent 1px),linear-gradient(90deg,#e2e8f0 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-[1200px] mx-auto px-6 md:px-12 py-10 text-center">
        <div className="mb-10">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#E2E8F0] bg-[#f2f3ff] mb-6">
            <span className="text-[#0077C8] text-[10px] font-bold mr-2">●</span>
            <span className="font-mono text-xs font-medium text-[#6B7280] tracking-[0.08em] uppercase">
              Portfolio Intelligence Platform
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1A1F36] leading-tight tracking-tight mb-1">
            Portfolio Rationalization
          </h1>
          <div className="text-2xl md:text-[32px] font-bold text-[#00338D] leading-snug mb-4">
            AI-Powered Platform Intelligence
          </div>
          <p className="text-base md:text-lg text-[#6B7280] max-w-[640px] mx-auto leading-relaxed">
            A structured decision-support engine that assesses your technology portfolio and produces an actionable
            AI-powered roadmap aligned with enterprise strategy.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex flex-wrap items-center justify-center gap-y-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center">
              {i > 0 && <div className="w-8 h-px bg-[#E2E8F0]" />}
              <div
                className={`flex items-center px-4 py-2 rounded-full border font-mono text-sm font-medium ${
                  "accent" in s && s.accent
                    ? "border-[rgba(0,51,141,0.3)] bg-[rgba(0,51,141,0.08)] text-[#001452] shadow-sm"
                    : `border-[#E2E8F0] bg-[#F4F6F9] ${s.muted ? "opacity-50 text-[#6B7280]" : "text-[#1A1F36]"}`
                }`}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Lifecycle wheel */}
        <div className="relative w-full max-w-[600px] aspect-square mx-auto mb-10 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[rgba(0,62,199,0.05)] blur-[80px] pointer-events-none" />
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full overflow-visible"
            style={{ filter: "drop-shadow(0 20px 60px rgba(0,0,0,.18))" }}
            role="group"
            aria-label="Portfolio lifecycle"
          >
            {SEGMENTS.map((s) => (
              <g
                key={s.phase}
                className="cursor-pointer group"
                role="button"
                tabIndex={0}
                aria-label={`${s.label} — ${s.hint}`}
                onClick={() => openPhase(s.phase)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openPhase(s.phase);
                  }
                }}
              >
                <title>{`${s.label} — ${s.hint}`}</title>
                <path
                  d={s.path}
                  fill={s.fill}
                  className="transition-opacity group-hover:opacity-85 group-focus:opacity-85 outline-none"
                />
                <text
                  fill="white"
                  fontFamily="Arial,sans-serif"
                  fontSize="2.8"
                  fontWeight="bold"
                  textAnchor="middle"
                  x={s.x}
                  y={s.y}
                  pointerEvents="none"
                >
                  {s.label}
                </text>
              </g>
            ))}
            {SPOKES.map(([x, y]) => (
              <line key={`${x}-${y}`} x1="50" y1="50" x2={x} y2={y} stroke="white" strokeWidth="0.4" opacity="0.25" pointerEvents="none" />
            ))}
          </svg>

          {/* Centre disc */}
          <button
            type="button"
            onClick={() => router.push(`${BASE}/dashboard`)}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28%] aspect-square rounded-full bg-white border border-[#E2E8F0] shadow-[0_8px_40px_rgba(0,0,0,.15)] flex flex-col items-center justify-center p-3 transition hover:scale-105 hover:shadow-[0_12px_50px_rgba(0,62,199,.25)]"
            aria-label="Open Portfolio Dashboard"
          >
            <svg viewBox="0 0 32 32" width={44} height={44} className="mb-1.5">
              <rect x="3" y="3" width="11" height="11" fill="#003366" />
              <rect x="18" y="3" width="11" height="11" fill="#005EB8" />
              <rect x="3" y="18" width="11" height="11" fill="#005EB8" />
              <rect x="18" y="18" width="11" height="11" fill="#00B0A0" />
            </svg>
            <div className="font-mono text-[10px] font-semibold text-[#6B7280] leading-relaxed tracking-[0.08em]">
              PORTFOLIO
              <br />
              RATIONALIZATION
            </div>
          </button>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-4">
          <button
            type="button"
            onClick={() => router.push(`${BASE}/dashboard`)}
            className="inline-flex items-center gap-4 px-8 py-4 bg-[#00338D] text-white rounded-lg text-lg font-bold shadow-[0_4px_20px_rgba(0,62,199,.25)] hover:bg-[#002a75] transition-colors"
          >
            Portfolio Dashboard <ArrowRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => router.push(`${BASE}/command-center`)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#1A1F36] border border-[#E2E8F0] rounded-xl text-lg font-semibold hover:bg-[#F4F6F9] transition-colors"
          >
            <LayoutGrid className="w-5 h-5" /> Operations Command Center
          </button>
        </div>

        {tools.length > 0 && (
          <p className="text-xs text-[#6B7280] mt-4">
            {tools.length} tool{tools.length === 1 ? "" : "s"} loaded in this session
          </p>
        )}
      </div>
    </div>
  );
}
