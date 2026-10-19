"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Network, X, Brain, Activity, RefreshCw, Database } from "lucide-react";

const BASE = "/agents/demand-planning-agent/console";
const TOTAL_STAGES = 6;
const CORAL = "#E0355C";
const TEAL  = "#17A2A0";
const NAVY  = "#2A2755";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AM = (props: any) => <animateMotion {...props} />;

function Dot({ d, dur, begin, color, r = 0.45 }: {
  d: string; dur: string; begin: string; color: string; r?: number;
}) {
  return (
    <circle r={r} fill={color} fillOpacity="0.9">
      <AM dur={dur} repeatCount="indefinite" begin={begin} path={d} />
    </circle>
  );
}

// Card/element fade+slide reveal
function reveal(on: boolean, delay = 0): React.CSSProperties {
  return {
    opacity: on ? 1 : 0,
    transform: on ? "translateY(0px)" : "translateY(10px)",
    transition: "opacity 0.5s ease, transform 0.5s ease",
    transitionDelay: on ? `${delay}ms` : "0ms",
    pointerEvents: on ? "auto" : "none",
  };
}

// Hub node reveal (centered with translate(-50%,-50%), so we must combine)
function hubReveal(on: boolean, delay = 0): React.CSSProperties {
  return {
    opacity: on ? 1 : 0,
    transform: on ? "translate(-50%,-50%) scale(1)" : "translate(-50%,-50%) scale(0.8)",
    transition: on ? `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms` : "none",
    pointerEvents: on ? "auto" : "none",
  };
}

// SVG group fade
function sgFade(on: boolean, delay = 0): React.CSSProperties {
  return {
    opacity: on ? 1 : 0,
    transition: on ? `opacity 0.5s ease ${delay}ms` : "opacity 0.15s ease",
  };
}

// ─── SVG path coordinates (0-100 space = canvas %) ──────────────────────────
// DemandIQ:  left:20%, top:4%, width:54% → right edge x=74, bottom y≈28, center x=47
// HC:        left:2%,  top:48%, width:27% → right x=29, top-center=(15,48), right-center=(29,67)
// Supply:    right:2%, top:48%, width:27% → left:71%, left-center=(71,67), top-center=(85,48)
//
// Hub nodes are HTML elements (position:absolute) with transform:translate(-50%,-50%)
// Their CSS center positions (left%, top%) map to SVG (x,y) directly:
//   L_HUB → left:12%, top:36%  → SVG(12,36)
//   R_HUB → left:87%, top:36%  → SVG(87,36)
//   C_HUB → left:47%, top:58%  → SVG(47,58)
//   D1    → left:33%, top:72%  → SVG(33,72)
//   D2    → left:55%, top:72%  → SVG(55,72)
//   Loop top-left               → SVG(10,87)

// Stage 4 — Left: DemandIQ ↔ L_HUB ↔ HC
const P_L_OUT = "M 23 28 L 12 36 L 15 48"; // DQ → HC  (coral)
const P_L_IN  = "M 15 48 L 12 36 L 23 28"; // HC → DQ  (teal)

// Stage 5 — Right: DemandIQ right ↔ R_HUB ↔ Supply
const P_R_OUT = "M 74 16 L 87 36 L 85 48"; // DQ right → R_HUB → Supply (coral)
const P_R_ARC = "M 85 48 L 87 36 L 87 6 L 72 6"; // Supply → R_HUB → arc top → DQ top-right (teal)

// Stage 5 — Center: DemandIQ ↔ C_HUB (Validated Forecast)
const P_C_DN  = "M 47 28 L 47 58"; // down (navy)
const P_C_UP  = "M 47 58 L 47 28"; // up   (coral)

// Stage 5 — Bottom horizontal: HC right ↔ Supply left through data relays
const P_BOT   = "M 29 67 L 33 72 L 55 72 L 71 67"; // HC → Supply (teal)
const P_BOT_R = "M 71 67 L 55 72 L 33 72 L 29 67"; // Supply → HC (navy)

// Stage 6 — Down: C_HUB → Learning Loop
const P_LOOP  = "M 47 58 L 47 87";

// Stage 6 — Feedback arc: Learning Loop → DemandIQ left side
const P_FEED  = "M 10 87 C 2 68 2 8 20 16";

// ─── Small hub node icon (2×2 grid, matches reference style) ─────────────────
function HubIcon({ color, size = 34 }: { color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: 10,
      background: `${color}14`,
      border: `1.5px solid ${color}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr",
        gap: 2.5, width: 14, height: 14,
      }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ background: `${color}80`, borderRadius: 1.5 }} />
        ))}
      </div>
    </div>
  );
}

// ─── Data relay icon ─────────────────────────────────────────────────────────
function DataIcon() {
  return (
    <div style={{
      width: 26, height: 26,
      borderRadius: 8,
      background: `${NAVY}0d`,
      border: `1.2px solid ${NAVY}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr",
        gap: 2, width: 10, height: 10,
      }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ background: `${NAVY}60`, borderRadius: 1 }} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ArchitecturePage() {
  const router = useRouter();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setStage(n => (n >= TOTAL_STAGES ? 0 : n + 1));
      }
      if (e.key === "Escape") router.push(`${BASE}/overview`);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  const s = (n: number) => stage >= n;

  const drawIn = (stageN: number, delay = 0): React.CSSProperties => ({
    strokeDasharray: "300 300",
    strokeDashoffset: s(stageN) ? 0 : 300,
    transition: s(stageN) ? `stroke-dashoffset 0.8s ease ${delay}ms` : "none",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden select-none"
      style={{ background: "#EEE9E0" }}
    >
      {/* ── Top bar ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-[#E0D8CC] bg-white/70 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          <Network size={14} className="text-coral" />
          <span className="text-[10px] uppercase tracking-widest text-coral font-bold">
            DemandIQ · AI Architecture
          </span>
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STAGES + 1 }).map((_, i) => (
            <span
              key={i}
              className={`block rounded-full transition-all duration-300 ${
                stage === i ? "w-3 h-3 bg-coral"
                  : stage > i ? "w-2 h-2 bg-coral/50"
                  : "w-2 h-2 bg-navy/15"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => router.push(`${BASE}/overview`)}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-navy transition-colors"
        >
          <X size={13} /> Exit
        </button>
      </header>

      {/* ── Canvas ── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Stage-0 prompt */}
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ opacity: stage === 0 ? 1 : 0, transition: "opacity 0.5s ease", pointerEvents: stage === 0 ? "auto" : "none" }}
        >
          <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-navy/25 animate-pulse">
            Press SPACE to begin
          </span>
        </div>

        {/* ── SVG overlay — ONLY paths + particles, no circles or text ── */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 5, pointerEvents: "none" }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <marker id="arr-c" markerWidth="4" markerHeight="3.5" refX="3.5" refY="1.75" orient="auto">
              <polygon points="0,0 4,1.75 0,3.5" fill={CORAL} fillOpacity="0.75" />
            </marker>
            <marker id="arr-t" markerWidth="4" markerHeight="3.5" refX="3.5" refY="1.75" orient="auto">
              <polygon points="0,0 4,1.75 0,3.5" fill={TEAL} fillOpacity="0.75" />
            </marker>
            <marker id="arr-n" markerWidth="4" markerHeight="3.5" refX="3.5" refY="1.75" orient="auto">
              <polygon points="0,0 4,1.75 0,3.5" fill={NAVY} fillOpacity="0.55" />
            </marker>
          </defs>

          {/* ── Stage 4: Left connections HC ↔ DemandIQ via L_HUB ── */}
          <g style={sgFade(s(4))}>
            <path d={P_L_OUT} fill="none" stroke={CORAL} strokeWidth="0.2" strokeOpacity="0.55"
              markerEnd="url(#arr-c)" style={drawIn(4, 0)} />
            <path d={P_L_IN} fill="none" stroke={TEAL} strokeWidth="0.2" strokeOpacity="0.5"
              markerEnd="url(#arr-t)" style={drawIn(4, 200)} />
            <g style={sgFade(s(4), 700)}>
              <Dot d={P_L_OUT} dur="1.8s" begin="0s"     color={CORAL} />
              <Dot d={P_L_OUT} dur="1.8s" begin="-0.9s"  color={CORAL} />
              <Dot d={P_L_IN}  dur="1.8s" begin="-0.45s" color={TEAL}  />
              <Dot d={P_L_IN}  dur="1.8s" begin="-1.35s" color={TEAL}  />
            </g>
          </g>

          {/* ── Stage 5: Right connections Supply ↔ DemandIQ via R_HUB ── */}
          <g style={sgFade(s(5))}>
            <path d={P_R_OUT} fill="none" stroke={CORAL} strokeWidth="0.2" strokeOpacity="0.55"
              markerEnd="url(#arr-c)" style={drawIn(5, 0)} />
            <path d={P_R_ARC} fill="none" stroke={TEAL} strokeWidth="0.2" strokeOpacity="0.5"
              markerEnd="url(#arr-t)" style={drawIn(5, 220)} />
            <g style={sgFade(s(5), 750)}>
              <Dot d={P_R_OUT} dur="1.8s" begin="0s"     color={CORAL} />
              <Dot d={P_R_OUT} dur="1.8s" begin="-0.9s"  color={CORAL} />
              <Dot d={P_R_ARC} dur="2.2s" begin="-0.55s" color={TEAL}  />
              <Dot d={P_R_ARC} dur="2.2s" begin="-1.65s" color={TEAL}  />
            </g>
          </g>

          {/* ── Stage 5: Center vertical DemandIQ ↔ C_HUB ── */}
          <g style={sgFade(s(5))}>
            <path d={P_C_DN} fill="none" stroke={NAVY} strokeWidth="0.2" strokeOpacity="0.5"
              markerEnd="url(#arr-n)" style={drawIn(5, 400)} />
            <path d={P_C_UP} fill="none" stroke={CORAL} strokeWidth="0.2" strokeOpacity="0.45"
              markerEnd="url(#arr-c)" style={drawIn(5, 550)} />
            <g style={sgFade(s(5), 900)}>
              <Dot d={P_C_DN} dur="1.6s" begin="0s"    color={NAVY}  />
              <Dot d={P_C_DN} dur="1.6s" begin="-0.8s" color={NAVY}  />
              <Dot d={P_C_UP} dur="1.6s" begin="-0.4s" color={CORAL} />
            </g>
          </g>

          {/* ── Stage 5: Bottom horizontal HC ↔ Supply via Data relays ── */}
          <g style={sgFade(s(5))}>
            <path d={P_BOT}   fill="none" stroke={TEAL} strokeWidth="0.2" strokeOpacity="0.48"
              markerEnd="url(#arr-t)" style={drawIn(5, 650)} />
            <path d={P_BOT_R} fill="none" stroke={NAVY} strokeWidth="0.18" strokeOpacity="0.32"
              markerEnd="url(#arr-n)" style={drawIn(5, 800)} />
            <g style={sgFade(s(5), 1050)}>
              <Dot d={P_BOT}   dur="2.4s" begin="0s"    color={TEAL} />
              <Dot d={P_BOT}   dur="2.4s" begin="-1.2s" color={TEAL} />
              <Dot d={P_BOT_R} dur="2.4s" begin="-0.6s" color={NAVY} r={0.38} />
            </g>
          </g>

          {/* ── Stage 6: C_HUB → Learning Loop ── */}
          <g style={sgFade(s(6))}>
            <path d={P_LOOP} fill="none" stroke={TEAL} strokeWidth="0.2" strokeOpacity="0.5"
              markerEnd="url(#arr-t)" style={drawIn(6, 0)} />
            <g style={sgFade(s(6), 550)}>
              <Dot d={P_LOOP} dur="1.4s" begin="0s"    color={TEAL} />
              <Dot d={P_LOOP} dur="1.4s" begin="-0.7s" color={TEAL} />
            </g>
          </g>

          {/* ── Stage 6: Feedback arc Learning Loop → DemandIQ ── */}
          <path
            d={P_FEED}
            fill="none"
            stroke={TEAL}
            strokeWidth="0.32"
            strokeOpacity={s(6) ? 0.7 : 0}
            style={{
              strokeDasharray: "300 300",
              strokeDashoffset: s(6) ? 0 : 300,
              transition: s(6)
                ? "stroke-dashoffset 1.1s ease 250ms, stroke-opacity 0.3s ease"
                : "none",
            }}
          />
          <g style={sgFade(s(6), 950)}>
            <Dot d={P_FEED} dur="2.3s" begin="0s"    color={TEAL} r={0.6} />
            <Dot d={P_FEED} dur="2.3s" begin="-1.15s" color={TEAL} r={0.6} />
          </g>
        </svg>

        {/* ════════════════════════════════════════════════════════════════
            HTML ELEMENTS — Cards + Hub Nodes (no SVG distortion)
            ════════════════════════════════════════════════════════════════ */}

        {/* ── DemandIQ Agent card (top-center) ─────────────────────────────── */}
        <div
          style={{
            position: "absolute", left: "20%", top: "4%", width: "54%",
            zIndex: 10,
            opacity: s(1) ? 1 : 0,
            transform: s(1) ? "translateY(0px)" : "translateY(14px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
            pointerEvents: s(1) ? "auto" : "none",
          }}
        >
          <div
            className="bg-white rounded-2xl px-5 py-4"
            style={{
              border: `2px solid ${NAVY}`,
              boxShadow: `0 8px 40px rgba(42,39,85,0.16), 0 2px 8px rgba(42,39,85,0.07)`,
            }}
          >
            <div className="flex items-stretch gap-4">
              {/* Left: agent info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: NAVY }}>
                    <Brain size={18} color="white" />
                  </div>
                  <div>
                    <div className="text-[14px] font-extrabold leading-tight" style={{ color: NAVY }}>
                      DemandIQ Agent
                    </div>
                    <div className="text-[9px] mt-0.5" style={{ color: `${NAVY}70` }}>
                      Reasons about demand &amp; forecast
                    </div>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {[
                    "FA% / Bias% + root-cause classification",
                    "Confidence scoring from validation history",
                  ].map(b => (
                    <li key={b} className="flex items-start gap-2">
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: CORAL }} />
                      <span className="text-[9px] leading-snug" style={{ color: `${NAVY}AA` }}>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Vertical divider */}
              <div className="w-px self-stretch flex-shrink-0" style={{ background: `${NAVY}16` }} />

              {/* Right: Knowledge Base → Planner Loop */}
              <div className="flex items-center gap-3 pl-1 flex-shrink-0">
                {/* Knowledge Base node */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ background: `${NAVY}0d`, border: `1.5px solid ${NAVY}28` }}>
                    <Database size={16} style={{ color: `${NAVY}88` }} />
                  </div>
                  <span className="text-center font-semibold leading-tight"
                    style={{ fontSize: 8, color: `${NAVY}77` }}>
                    Knowledge<br />Base
                  </span>
                </div>

                {/* Arrow */}
                <div style={{ paddingBottom: 16, display: "flex", alignItems: "center" }}>
                  <div style={{ width: 18, height: 1, background: `${TEAL}88` }} />
                  <div style={{
                    width: 0, height: 0,
                    borderLeft: `5px solid ${TEAL}99`,
                    borderTop: "3px solid transparent",
                    borderBottom: "3px solid transparent",
                  }} />
                </div>

                {/* Planner Loop node */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ background: `${TEAL}10`, border: `1.5px solid ${TEAL}38` }}>
                    <RefreshCw size={16} style={{ color: TEAL, animation: "spin 4s linear infinite" }} />
                  </div>
                  <span className="text-center font-semibold leading-tight"
                    style={{ fontSize: 8, color: `${NAVY}77` }}>
                    Planner<br />Loop
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Health Check Agent card (bottom-left) ────────────────────────── */}
        <div style={{ position: "absolute", left: "2%", top: "48%", width: "27%", zIndex: 10, ...reveal(s(2), 0) }}>
          <div className="bg-white rounded-2xl px-4 py-4"
            style={{ border: `1.5px solid ${NAVY}28`, boxShadow: "0 4px 20px rgba(42,39,85,0.1)" }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${NAVY}0d` }}>
                <Activity size={14} style={{ color: NAVY }} />
              </div>
              <div>
                <div className="text-[11px] font-extrabold leading-tight" style={{ color: NAVY }}>Health Check Agent</div>
                <div className="text-[8px] mt-0.5" style={{ color: `${NAVY}66` }}>Watches the data layer</div>
              </div>
            </div>
            <ul className="space-y-1.5">
              {["Anomaly detection on incoming records", "Auto-reconciliation vs master data"].map(b => (
                <li key={b} className="flex items-start gap-2">
                  <span className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full" style={{ background: CORAL }} />
                  <span className="text-[8px] leading-snug" style={{ color: `${NAVY}99` }}>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Supply Agent card (bottom-right) ─────────────────────────────── */}
        <div style={{ position: "absolute", right: "2%", top: "48%", width: "27%", zIndex: 10, ...reveal(s(3), 0) }}>
          <div className="bg-white rounded-2xl px-4 py-4"
            style={{ border: `1.5px solid ${NAVY}28`, boxShadow: "0 4px 20px rgba(42,39,85,0.1)" }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${TEAL}14` }}>
                <RefreshCw size={14} style={{ color: TEAL }} />
              </div>
              <div>
                <div className="text-[11px] font-extrabold leading-tight" style={{ color: NAVY }}>Supply Agent</div>
                <div className="text-[8px] mt-0.5" style={{ color: `${NAVY}66` }}>Reasons about stock coverage</div>
              </div>
            </div>
            <ul className="space-y-1.5">
              {["Coverage-risk scoring", "Reallocation recommendations"].map(b => (
                <li key={b} className="flex items-start gap-2">
                  <span className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full" style={{ background: TEAL }} />
                  <span className="text-[8px] leading-snug" style={{ color: `${NAVY}99` }}>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── L_HUB: Data Quality Signals (HTML, no SVG distortion) ────────── */}
        <div style={{ position: "absolute", left: "12%", top: "36%", zIndex: 8, ...hubReveal(s(4), 200) }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <HubIcon color={CORAL} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: `${NAVY}88`, lineHeight: 1.25, whiteSpace: "nowrap" }}>Data Quality</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: `${NAVY}88`, lineHeight: 1.25, whiteSpace: "nowrap" }}>Signals</div>
            </div>
          </div>
        </div>

        {/* ── R_HUB: Inventory Constraints (HTML) ──────────────────────────── */}
        <div style={{ position: "absolute", left: "87%", top: "36%", zIndex: 8, ...hubReveal(s(5), 200) }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <HubIcon color={TEAL} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: `${NAVY}88`, lineHeight: 1.25, whiteSpace: "nowrap" }}>Inventory</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: `${NAVY}88`, lineHeight: 1.25, whiteSpace: "nowrap" }}>Constraints</div>
            </div>
          </div>
        </div>

        {/* ── C_HUB: Validated Forecast (HTML) ─────────────────────────────── */}
        <div style={{ position: "absolute", left: "47%", top: "58%", zIndex: 8, ...hubReveal(s(5), 450) }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <HubIcon color={NAVY} size={38} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: `${NAVY}88`, lineHeight: 1.25, whiteSpace: "nowrap" }}>Validated</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: `${NAVY}88`, lineHeight: 1.25, whiteSpace: "nowrap" }}>Forecast</div>
            </div>
          </div>
        </div>

        {/* ── D1: Data relay (bottom center-left) ──────────────────────────── */}
        <div style={{ position: "absolute", left: "33%", top: "72%", zIndex: 8, ...hubReveal(s(5), 700) }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <DataIcon />
            <div style={{ fontSize: 8, fontWeight: 700, color: `${NAVY}77`, whiteSpace: "nowrap" }}>Data</div>
          </div>
        </div>

        {/* ── D2: Data relay (bottom center-right) ─────────────────────────── */}
        <div style={{ position: "absolute", left: "55%", top: "72%", zIndex: 8, ...hubReveal(s(5), 800) }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <DataIcon />
            <div style={{ fontSize: 8, fontWeight: 700, color: `${NAVY}77`, whiteSpace: "nowrap" }}>Data</div>
          </div>
        </div>

        {/* ── Continuous Learning Loop band (bottom) ───────────────────────── */}
        <div style={{ position: "absolute", bottom: "2%", left: "4%", right: "4%", zIndex: 10, ...reveal(s(6), 400) }}>
          <div
            className="relative rounded-2xl px-5 py-4 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${NAVY} 0%, rgba(23,162,160,0.88) 100%)`,
              border: "1px solid rgba(23,162,160,0.4)",
              boxShadow: "0 4px 28px rgba(42,39,85,0.22)",
            }}
          >
            {/* Glow ring — fires 1.3s after stage 6 */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
              border: `2px solid ${TEAL}`,
              opacity: s(6) ? 1 : 0,
              transition: s(6) ? "opacity 0.7s ease 1.4s" : "opacity 0.2s ease",
              boxShadow: "0 0 24px rgba(23,162,160,0.55), inset 0 0 24px rgba(23,162,160,0.1)",
            }} />
            <div className="relative flex items-center gap-4">
              <RefreshCw size={18} style={{ color: TEAL, filter: "brightness(1.9)", animation: "spin 3s linear infinite", flexShrink: 0 }} />
              <div>
                <div className="text-[11px] font-extrabold text-white leading-tight">Continuous Learning Loop</div>
                <div className="text-[8.5px] mt-0.5" style={{ color: "rgba(255,255,255,0.58)" }}>
                  Planner decisions re-weight agent confidence every cycle
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="flex-shrink-0 flex items-center justify-center px-6 py-2 border-t border-[#E0D8CC] bg-white/50">
        {stage === 0 ? (
          <span className="text-[10px] font-mono uppercase tracking-widest text-navy/30 animate-pulse">
            Press SPACE to begin
          </span>
        ) : stage >= TOTAL_STAGES ? (
          <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: TEAL }}>
            Complete · SPACE to restart · ESC to exit
          </span>
        ) : (
          <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "rgba(42,39,85,0.3)" }}>
            SPACE for next · {stage}/{TOTAL_STAGES}
          </span>
        )}
      </div>
    </div>
  );
}
