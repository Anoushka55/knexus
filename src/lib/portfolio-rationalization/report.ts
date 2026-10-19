/**
 * Standalone, downloadable/printable HTML report — ported from the Python
 * `build_report()` in api/index.py. Kept as a single server-safe function
 * returning a full HTML document string, callable from the report API route.
 */
import type { Assessment, Duplication, ExecutiveSummary, Tool } from "./types";

const BADGE_STYLES: Record<string, string> = {
  Retain: "color:#155724;background:#d4edda",
  Rehost: "color:#004085;background:#cce5ff",
  Replatform: "color:#856404;background:#fff3cd",
  Refactor: "color:#7d3c00;background:#fde8d8",
  Replace: "color:#721c24;background:#f8d7da",
  Retire: "color:#383d41;background:#e2e3e5",
  High: "color:#721c24;background:#f8d7da",
  Medium: "color:#856404;background:#fff3cd",
  Low: "color:#155724;background:#d4edda",
  Critical: "color:#fff;background:#c0392b",
};

function badge(a: string): string {
  return `<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;${
    BADGE_STYLES[a] ?? "color:#333;background:#eee"
  }">${esc(a)}</span>`;
}

function esc(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function money(v: number | null | undefined): string {
  return v ? `$${Math.round(v).toLocaleString()}` : "—";
}

function scoreColor(s: number): string {
  return s >= 7 ? "#00A651" : s >= 5 ? "#FFC200" : "#E31837";
}

function bulletsToHtml(text?: string): string {
  if (!text) return "";
  const lines = text.trim().split("\n");
  const parts: string[] = [];
  let inUl = false;
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("- ")) {
      if (!inUl) {
        parts.push('<ul style="margin:0;padding-left:18px;list-style:none">');
        inUl = true;
      }
      parts.push(
        `<li style="padding:5px 0;border-bottom:1px solid rgba(0,0,0,.05);font-size:12px;line-height:1.65;color:#1a2340;display:flex;gap:8px;align-items:flex-start">` +
          `<span style="color:#0063DC;font-weight:700;flex-shrink:0;margin-top:1px">&#8227;</span><span>${esc(t.slice(2))}</span></li>`,
      );
    } else {
      if (inUl) {
        parts.push("</ul>");
        inUl = false;
      }
      if (t) parts.push(`<p style="font-size:12px;font-weight:700;color:#003366;margin:10px 0 4px">${esc(t)}</p>`);
    }
  }
  if (inUl) parts.push("</ul>");
  return parts.join("");
}

function roadmapPanel(text?: string): string {
  if (!text) return "";
  const colors: Record<string, string> = { "Phase 1": "#00A651", "Phase 2": "#0063DC", "Phase 3": "#7B2FBE" };
  const bgs: Record<string, string> = { "Phase 1": "#f0faf5", "Phase 2": "#eef5ff", "Phase 3": "#f7f0ff" };
  const icons: Record<string, string> = { "Phase 1": "1", "Phase 2": "2", "Phase 3": "3" };
  const lines = text.trim().split("\n");
  const parts: string[] = [];
  let currentPhase: string | null = null;
  let items: string[] = [];

  const flush = () => {
    if (!currentPhase) return;
    const col = colors[currentPhase] ?? "#0063DC";
    const bg = bgs[currentPhase] ?? "#f8f9ff";
    const ico = icons[currentPhase] ?? "?";
    const itemsHtml = items
      .map(
        (item) =>
          `<li style="padding:5px 0;border-bottom:1px solid rgba(0,0,0,.05);font-size:12px;line-height:1.6;color:#333;display:flex;gap:8px;align-items:flex-start">` +
          `<span style="width:6px;height:6px;border-radius:50%;background:${col};flex-shrink:0;margin-top:5px"></span><span>${esc(item)}</span></li>`,
      )
      .join("");
    parts.push(
      `<div style="background:${bg}!important;border:1px solid rgba(0,0,0,.08);border-top:3px solid ${col};border-radius:8px;padding:14px;margin-bottom:10px">` +
        `<div style="display:flex;align-items:center;gap:9px;margin-bottom:9px">` +
        `<div style="width:26px;height:26px;border-radius:50%;background:${col};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0">${ico}</div>` +
        `<div style="font-size:12px;font-weight:700;color:${col}">${currentPhase}</div></div>` +
        `<ul style="margin:0;padding:0;list-style:none">${itemsHtml}</ul></div>`,
    );
    items = [];
    currentPhase = null;
  };

  for (const raw of lines) {
    const t = raw.trim();
    let matched = false;
    for (const ph of Object.keys(colors)) {
      if (t.toLowerCase().startsWith(ph.toLowerCase())) {
        flush();
        currentPhase = ph;
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (t.startsWith("- ")) items.push(t.slice(2));
      else if (t && !currentPhase) parts.push(`<p style="font-size:12px;color:#555;margin-bottom:6px">${esc(t)}</p>`);
    }
  }
  flush();
  return parts.join("");
}

function exPanel(bg: string, border: string, labelColor: string, label: string, content?: string, isRoadmap = false): string {
  if (!content) return "";
  let body = isRoadmap ? roadmapPanel(content) : bulletsToHtml(content);
  if (!body) body = `<div style="font-size:12px;line-height:1.8;color:#1a2340;white-space:pre-wrap">${esc(content)}</div>`;
  return (
    `<div style="background:${bg}!important;border-left:4px solid ${border};border-radius:0 8px 8px 0;padding:14px 18px">` +
    `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${labelColor};margin-bottom:10px">${label}</div>${body}</div>`
  );
}

function pillarCard(accent: string, bg: string, title: string, subtitle: string, content?: string): string {
  const bullets = content ? bulletsToHtml(content) : '<p style="font-size:12px;color:#999">Run assessment to generate content.</p>';
  return (
    `<div style="background:${bg}!important;border:1px solid rgba(0,0,0,.08);border-top:4px solid ${accent};border-radius:10px;padding:20px">` +
    `<div style="margin-bottom:14px"><div style="font-size:14px;font-weight:800;color:#003366;line-height:1.2">${esc(title)}</div>` +
    `<div style="font-size:10px;color:#6B7A99;margin-top:2px;text-transform:uppercase;letter-spacing:.6px;font-weight:600">${esc(subtitle)}</div></div>${bullets}</div>`
  );
}

export function buildReportHtml(
  tools: Tool[],
  dups: Duplication[],
  assessment: Assessment,
  chatContext?: string | null,
): string {
  const now = new Date();
  const totalCost = tools.reduce((a, t) => a + (t.annual_cost || 0), 0);
  const potSave = dups.reduce((a, d) => a + (d.potential_annual_savings || 0), 0);
  const cnts: Record<string, number> = {};
  for (const t of tools) {
    const a = t.rationalization_action || "TBD";
    cnts[a] = (cnts[a] || 0) + 1;
  }

  const toolRows = tools
    .map(
      (t) =>
        `<tr><td><b>${esc(t.name)}</b></td><td>${esc(t.vendor) || "—"}</td><td>${esc(t.category)}</td>` +
        `<td>${money(t.annual_cost)}</td><td>${t.user_count ?? "—"}</td>` +
        `<td><b style="color:${scoreColor(t.composite_score ?? 0)}">${t.composite_score ?? "—"}/10</b></td>` +
        `<td>${t.scores?.risk_score ?? "—"}/10</td><td>${badge(t.rationalization_action || "TBD")}</td></tr>`,
    )
    .join("");

  const dupRows = dups
    .slice(0, 15)
    .map(
      (d) =>
        `<tr><td>${esc(d.category)}</td><td><b>${esc(d.tool_a)}</b></td><td><b>${esc(d.tool_b)}</b></td>` +
        `<td><b>${d.overlap_percentage}%</b></td><td>${esc(d.retain_candidate)}</td><td>${money(d.potential_annual_savings)}</td>` +
        `<td>${badge(d.priority)}</td></tr>`,
    )
    .join("");

  const totalActions = Object.values(cnts).reduce((a, b) => a + b, 0) || 1;
  const actRows = Object.entries(cnts)
    .map(([a, c]) => `<tr><td>${badge(a)}</td><td><b>${c}</b></td><td>${Math.round((c / totalActions) * 100)}%</td></tr>`)
    .join("");

  const rawEx = assessment.executive_summary;
  const ex = typeof rawEx === "string" ? rawEx : undefined;
  const exObj: ExecutiveSummary | undefined = typeof rawEx === "object" ? rawEx : undefined;

  const exHtml =
    ex !== undefined
      ? `<div style="background:#f8fbff!important;border-left:4px solid #0063DC;padding:18px 20px;border-radius:0 7px 7px 0;font-size:13px;line-height:1.8;white-space:pre-wrap">${esc(ex)}</div>`
      : `<div style="display:flex;flex-direction:column;gap:12px">` +
        exPanel("#f0f4fa", "#003366", "#003366", "Current State of Tool Ecosystem &amp; Challenges", exObj?.tool_ecosystem) +
        exPanel("#fff5f5", "#E31837", "#c0392b", "Overlapping Tools — Cost Reduction Opportunities", exObj?.overlapping_tools) +
        exPanel("#f5f0ff", "#7B2FBE", "#7B2FBE", "Benchmarking Analysis vs Market", exObj?.benchmarking) +
        exPanel("#fff8f0", "#FFC200", "#b08000", "Current KPIs vs To-Be Success Factors", exObj?.kpis_success_factors) +
        exPanel("#f0faf5", "#00A651", "#00A651", "Recommendations — Choosing the Right Platform", exObj?.recommendations) +
        exPanel("#f8fbff", "#0063DC", "#0063DC", "Implementation &amp; Rollout Plan Roadmap", exObj?.rollout_roadmap, true) +
        "</div>";

  const recs = assessment.top_recommendations || [];
  const recHtml = recs
    .slice(0, 5)
    .map(
      (r) =>
        `<div style="background:#f8fbff!important;border:1px solid #dde8f8;border-left:4px solid #0063DC;border-radius:7px;padding:14px;margin-bottom:9px">` +
        `<div style="display:flex;align-items:center;gap:9px;margin-bottom:8px">` +
        `<div style="width:22px;height:22px;background:#0063DC;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${r.rank}</div>` +
        `<strong style="color:#003366;flex:1;font-size:13px">${esc(r.title)}</strong>${badge(r.priority)} ${badge(r.confidence)}</div>` +
        `<p style="font-size:12px;color:#444;line-height:1.6;margin-bottom:5px">${esc(r.description)}</p>` +
        `<p style="font-size:11px;color:#0063DC;font-style:italic">Impact: ${esc(r.impact)} &nbsp;&bull;&nbsp; ${esc(r.timeline)}</p></div>`,
    )
    .join("");

  const rm: Record<string, string[] | undefined> = (assessment.roadmap as unknown as Record<string, string[] | undefined>) || {};
  const phaseCfg: [string, string, string, string, string, string][] = [
    ["#00A651", "#f0faf5", "Phase 1", "Quick Wins", "0 – 3 Months", "short_term"],
    ["#0063DC", "#eef5ff", "Phase 2", "Strategic Delivery", "3 – 12 Months", "medium_term"],
    ["#7B2FBE", "#f7f0ff", "Phase 3", "Transformation", "12 – 24 Months", "long_term"],
  ];
  const rdmapHtml = Object.keys(rm).length
    ? `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px">` +
      phaseCfg
        .map(([col, bg, lbl, title, timeframe, key], i) => {
          const items = rm[key] || [];
          const steps = items.length
            ? items
                .map(
                  (item, j) =>
                    `<div style="display:flex;gap:9px;align-items:flex-start;padding:9px 0;border-bottom:1px solid rgba(0,0,0,.07)">` +
                    `<div style="width:22px;height:22px;border-radius:50%;color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;background:${col}">${j + 1}</div>` +
                    `<div style="font-size:12px;color:#333;line-height:1.6">${esc(item)}</div></div>`,
                )
                .join("")
            : '<div style="font-size:11px;color:#999;padding:8px 0">No items listed</div>';
          return (
            `<div style="display:flex;flex-direction:column;align-items:center">` +
            `<div style="width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;background:${col};margin-bottom:10px">${i + 1}</div>` +
            `<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:3px;color:${col}">${lbl}</div>` +
            `<div style="font-size:14px;font-weight:800;color:#1a2340;margin-bottom:4px;text-align:center">${title}</div>` +
            `<div style="font-size:10px;color:#6B7A99;margin-bottom:12px;background:#eef2f8!important;padding:3px 12px;border-radius:20px;font-weight:700">${timeframe}</div>` +
            `<div style="border:1px solid ${col}66;border-radius:8px;padding:14px 16px;width:100%;background:${bg}!important;border-top:3px solid ${col}">${steps}</div></div>`
          );
        })
        .join("") +
      "</div>"
    : "";

  const sevCol: Record<string, string> = { Critical: "#c0392b", High: "#e67e22", Medium: "#f39c12" };
  const riskHtml = (assessment.risk_highlights || [])
    .map(
      (r) =>
        `<div style="display:flex;gap:11px;background:#fff5f5!important;border:1px solid #fad7d7;border-radius:8px;padding:12px;margin-bottom:8px">` +
        `<div style="font-size:10px;font-weight:700;color:#fff;background:${sevCol[r.severity] ?? "#888"};padding:3px 8px;border-radius:4px;align-self:flex-start;white-space:nowrap">${esc(r.severity).toUpperCase()}</div>` +
        `<div><div style="font-weight:700;color:#1a2340;font-size:12px">${esc(r.risk_type)} Risk</div>` +
        `<div style="font-size:11px;color:#555;margin:3px 0;line-height:1.5">${esc(r.description)}</div>` +
        `<div style="font-size:10px;color:#00A651;font-weight:600">Mitigation: ${esc(r.mitigation)}</div></div></div>`,
    )
    .join("");

  const painAreas = assessment.portfolio_pain_areas || [];
  const dupTools = assessment.duplicate_tools || [];
  const toolAnalysis = assessment.tool_analysis || [];
  const pillars = assessment.three_pillars;
  const bac = assessment.before_after_comparison;
  const oc = assessment.expected_outcomes || {};

  let bacHtml = "";
  if (bac) {
    const cs = bac.current_state || {};
    const fs = bac.future_state || {};
    const issueRows = (cs.key_issues || [])
      .map(
        (x) =>
          `<div style="display:flex;gap:7px;align-items:flex-start;font-size:12px;padding:5px 0;border-bottom:1px solid rgba(0,0,0,.06)"><span style="color:#E31837;flex-shrink:0;font-weight:700">&#9888;</span><span style="color:#333">${esc(x)}</span></div>`,
      )
      .join("");
    const imprRows = (fs.improvements || [])
      .map(
        (x) =>
          `<div style="display:flex;gap:7px;align-items:flex-start;font-size:12px;padding:5px 0;border-bottom:1px solid rgba(0,0,0,.06)"><span style="color:#00A651;flex-shrink:0;font-weight:700">&#10003;</span><span style="color:#333">${esc(x)}</span></div>`,
      )
      .join("");
    bacHtml = `<div style="padding:26px 40px;border-bottom:1px solid #eef1f8">
<h2 style="font-size:15px;font-weight:700;color:#003366;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #0063DC">Before vs After: Rationalization Impact</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
<div style="background:#fff5f5!important;border:1px solid #fad7d7;border-top:4px solid #E31837;border-radius:8px;padding:20px">
<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#E31837;margin-bottom:14px">CURRENT STATE (AS-IS)</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
<div style="background:#fff!important;padding:10px;border-radius:6px;text-align:center"><div style="font-size:22px;font-weight:800;color:#1a2340">${cs.tool_count ?? "--"}</div><div style="font-size:10px;color:#666;text-transform:uppercase;margin-top:2px">Tools</div></div>
<div style="background:#fff!important;padding:10px;border-radius:6px;text-align:center"><div style="font-size:16px;font-weight:800;color:#1a2340">${money(cs.annual_cost)}</div><div style="font-size:10px;color:#666;text-transform:uppercase;margin-top:2px">Annual Cost</div></div>
<div style="background:#fff!important;padding:10px;border-radius:6px;text-align:center"><div style="font-size:22px;font-weight:800;color:#E31837">${cs.duplicate_pairs ?? "--"}</div><div style="font-size:10px;color:#666;text-transform:uppercase;margin-top:2px">Duplicate Pairs</div></div>
<div style="background:#fff!important;padding:10px;border-radius:6px;text-align:center"><div style="font-size:16px;font-weight:800;color:#E31837">${esc(cs.risk_level) || "--"}</div><div style="font-size:10px;color:#666;text-transform:uppercase;margin-top:2px">Risk Level</div></div>
</div>
<div style="font-size:10px;font-weight:700;color:#E31837;text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px">Key Issues Identified</div>
${issueRows || '<div style="font-size:12px;color:#999">No issues listed</div>'}
</div>
<div style="background:#f0faf5!important;border:1px solid #b8e6d0;border-top:4px solid #00A651;border-radius:8px;padding:20px">
<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#00A651;margin-bottom:14px">FUTURE STATE (POST-RATIONALIZATION)</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
<div style="background:#fff!important;padding:10px;border-radius:6px;text-align:center"><div style="font-size:22px;font-weight:800;color:#00A651">${fs.projected_tool_count ?? "--"}</div><div style="font-size:10px;color:#666;text-transform:uppercase;margin-top:2px">Tools (Projected)</div></div>
<div style="background:#fff!important;padding:10px;border-radius:6px;text-align:center"><div style="font-size:16px;font-weight:800;color:#00A651">${money(fs.projected_annual_cost)}</div><div style="font-size:10px;color:#666;text-transform:uppercase;margin-top:2px">Annual Cost (Est.)</div></div>
<div style="background:#fff!important;padding:10px;border-radius:6px;text-align:center"><div style="font-size:22px;font-weight:800;color:#00A651">${money(fs.estimated_annual_savings)}</div><div style="font-size:10px;color:#666;text-transform:uppercase;margin-top:2px">Annual Savings</div></div>
<div style="background:#fff!important;padding:10px;border-radius:6px;text-align:center"><div style="font-size:16px;font-weight:800;color:#00A651">${esc(fs.risk_level) || "--"}</div><div style="font-size:10px;color:#666;text-transform:uppercase;margin-top:2px">Target Risk</div></div>
</div>
<div style="font-size:10px;font-weight:700;color:#00A651;text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px">Improvements After Rationalization</div>
${imprRows || '<div style="font-size:12px;color:#999">No improvements listed</div>'}
</div>
</div>
</div>`;
  }

  let pillarsHtml = "";
  if (pillars && (pillars.as_is_assessment || pillars.governance_framework || pillars.tools_standardization)) {
    pillarsHtml = `<div style="padding:26px 40px;border-bottom:1px solid #eef1f8">
<h2 style="font-size:15px;font-weight:700;color:#003366;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #0063DC">Strategic Pillars: Assessment, Governance &amp; Standardization</h2>
<p style="font-size:12px;color:#6B7A99;margin-bottom:16px">Current-state analysis and forward-looking recommendations across three strategic lenses.</p>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
${pillarCard("#1E49E2", "#f0f6ff", "As-is Tools Assessment", "Current State & Gap Analysis", pillars.as_is_assessment)}
${pillarCard("#00338D", "#f0f4fa", "Governance Framework", "Policy, Compliance & Controls", pillars.governance_framework)}
${pillarCard("#00A651", "#f0faf5", "Tools Standardization", "Platform Decisions & Stack Consolidation", pillars.tools_standardization)}
</div></div>`;
  }

  let chatHtml = "";
  if (chatContext && chatContext.trim()) {
    const rows = chatContext
      .trim()
      .split("\n")
      .filter((l) => l.trim())
      .map((line) => {
        const isQ = line.startsWith("Client question:");
        const idx = line.indexOf(":");
        const label = idx >= 0 ? line.slice(0, idx + 1) : "";
        const body = line.slice(label.length).trim();
        const bg = isQ ? "#f0f6ff" : "#f0faf5";
        const border = isQ ? "#1E49E2" : "#00A651";
        return `<div style="background:${bg}!important;border-left:3px solid ${border};border-radius:0 6px 6px 0;padding:10px 14px;margin-bottom:8px">
<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:${border};margin-bottom:5px">${esc(label)}</div>
<div style="font-size:12px;line-height:1.65;color:#1a2340">${esc(body)}</div></div>`;
      })
      .join("");
    if (rows) {
      chatHtml = `<div style="padding:26px 40px;border-bottom:1px solid #eef1f8">
<h2 style="font-size:15px;font-weight:700;color:#003366;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #0063DC">AI Advisor Session — Key Insights</h2>
<p style="font-size:12px;color:#6B7A99;margin-bottom:16px">Questions and answers generated during the AI Advisor session, incorporated into this assessment.</p>${rows}</div>`;
    }
  }

  const cntR: Record<string, number> = {};
  for (const t of tools) {
    const a = t.rationalization_action || "TBD";
    cntR[a] = (cntR[a] || 0) + 1;
  }
  const retireEol = tools.filter((t) => t.end_of_life || t.rationalization_action === "Retire").length;
  const avgScore = tools.length ? Math.round((tools.reduce((a, t) => a + (t.composite_score || 0), 0) / tools.length) * 10) / 10 : 0;
  const savPct = Math.round(Math.min(100, (potSave / Math.max(totalCost, 1)) * 100));

  const kpiHtml = `<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:1px;background:#ccd6e8;border-bottom:2px solid #ccd6e8">
${kpiCell("TOOLS ASSESSED", String(tools.length), "portfolio active")}
${kpiCell("ANNUAL SPEND", money(totalCost), "technology budget")}
${kpiCell("OVERLAP PAIRS", String(dups.length), "consolidation alerts")}
${kpiCell("EST. SAVINGS", money(potSave), "annual potential", savPct, "#00A651")}
${kpiCell("RETIRE / EOL", String(retireEol), "immediate action", undefined, undefined, "#E31837")}
${kpiCell("AVG TOOL SCORE", String(avgScore), "portfolio health", Math.round(avgScore * 10), scoreColor(avgScore), scoreColor(avgScore))}
</div>`;

  const perToolHtml = toolAnalysis.length
    ? `<div style="padding:26px 40px;border-bottom:1px solid #eef1f8">
<h2 style="font-size:15px;font-weight:700;color:#003366;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #0063DC">Per-Tool Analysis — Consulting View</h2>
${toolAnalysis
  .map(
    (ta) => `<div style="border:1px solid #dde4ef;border-radius:8px;margin-bottom:16px;overflow:hidden">
<div style="background:#003366!important;color:#fff!important;padding:12px 18px;display:flex;align-items:center;gap:12px">
<div style="flex:1"><div style="font-size:14px;font-weight:700">${esc(ta.tool_name)}</div><div style="font-size:11px;opacity:.7;margin-top:2px">${esc(ta.overview)}</div></div>
<span style="background:rgba(255,255,255,.18);color:#fff;font-size:11px;padding:3px 12px;border-radius:10px">${esc(ta.recommendation)}</span>
</div>
<div style="display:flex;flex-wrap:wrap;border-bottom:1px solid #dde4ef;background:#fff!important">
${(ta.facts || [])
  .slice(0, 5)
  .map(
    (f) =>
      `<div style="padding:9px 13px;border-right:1px solid #dde4ef;min-width:110px"><div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#888">${esc(f.label)}</div><div style="font-size:12px;font-weight:600;color:#003366">${esc(f.value) || "--"}</div></div>`,
  )
  .join("")}
</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr">
<div style="padding:11px 14px;border-right:1px solid #dde4ef"><div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#00A651">Strengths</div>${(ta.strengths || []).map((s2) => `<div style="font-size:11px;color:#333;padding:3px 0;border-bottom:1px solid #f0f0f0">${esc(s2)}</div>`).join("")}</div>
<div style="padding:11px 14px;border-right:1px solid #dde4ef"><div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#E31837">Challenges</div>${(ta.challenges || []).map((c) => `<div style="font-size:11px;color:#333;padding:3px 0;border-bottom:1px solid #f0f0f0">${esc(c)}</div>`).join("")}</div>
<div style="padding:11px 14px"><div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#b08000">Gaps</div>${(ta.gaps || []).map((g) => `<div style="font-size:11px;color:#333;padding:3px 0;border-bottom:1px solid #f0f0f0">${esc(g)}</div>`).join("")}</div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #dde4ef">
<div style="padding:11px 14px;border-right:1px solid #dde4ef"><div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#0063DC">Cost Analysis</div><div style="font-size:11px;color:#444;line-height:1.6">${esc(ta.cost_analysis)}</div></div>
<div style="padding:11px 14px"><div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#7B2FBE">Benchmarking</div><div style="font-size:11px;color:#444;line-height:1.6">${esc(ta.benchmarking)}</div></div>
</div>
</div>`,
  )
  .join("")}
</div>`
    : "";

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><title>Tool Rationalization Report — ${now.toLocaleString("en-US", { month: "long", year: "numeric" })}</title>
<style>
@page{size:A4;margin:14mm 14mm 18mm 14mm}
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f0f4fa;color:#1a2340;font-size:13px;line-height:1.5}
.w{max-width:1140px;margin:0 auto;background:#fff;box-shadow:0 0 40px rgba(0,0,0,.1)}
.hdr{background:linear-gradient(135deg,#003366 0%,#0063DC 100%);color:#fff;padding:36px 40px 32px}
.hdr h1{font-size:22px;font-weight:700;margin-bottom:5px}.hdr p{opacity:.75;font-size:12px;margin-top:3px}
table{width:100%;border-collapse:collapse;font-size:12px}
thead th{background:#003366!important;color:#fff!important;padding:9px 12px;text-align:left;font-size:11px;font-weight:600}
tbody td{padding:8px 12px;border-bottom:1px solid #f0f3fa;vertical-align:top}
.sec{padding:26px 40px;border-bottom:1px solid #eef1f8}
h2{font-size:15px;font-weight:700;color:#003366;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #0063DC}
.ftr{background:#1a2340!important;color:#8899bb;padding:16px 40px;display:flex;justify-content:space-between;font-size:11px}
@media print{body{background:#fff!important}.w{max-width:100%;box-shadow:none}}
</style></head>
<body><div class="w">
<div class="hdr">
<div style="display:flex;align-items:center;gap:16px;margin-bottom:22px">
<div style="width:48px;height:48px;background:rgba(255,255,255,.15);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;flex-shrink:0">TR</div>
<div style="border-left:1px solid rgba(255,255,255,.25);padding-left:18px">
<div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1.4px;margin-bottom:3px">Advisory Services</div>
<div style="font-size:13px;font-weight:600;opacity:.9">Portfolio Rationalization Agent</div>
</div>
</div>
<h1>Technology Rationalization Assessment Report</h1>
<p style="margin-top:5px">Enterprise Application &amp; Tools Assessment &nbsp;&bull;&nbsp; AI-Powered Advisory &nbsp;&bull;&nbsp; Rationalization Framework</p>
<p style="margin-top:8px;opacity:.55;font-size:11px">Generated: ${now.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })} &nbsp;&bull;&nbsp; CONFIDENTIAL &nbsp;&bull;&nbsp; For Internal Use Only</p>
</div>
${kpiHtml}
<div class="sec"><h2>Executive Summary</h2>${exHtml}</div>
${bacHtml}
${pillarsHtml}
${chatHtml}
<div class="sec"><h2>Rationalization Action Summary</h2>
<table><thead><tr><th>Action</th><th>Count</th><th>% of Portfolio</th></tr></thead><tbody>${actRows}</tbody></table></div>
${recHtml ? `<div class="sec"><h2>Top Priority Recommendations</h2>${recHtml}</div>` : ""}
${rdmapHtml ? `<div class="sec"><h2>Implementation &amp; Rollout Plan Roadmap</h2>${rdmapHtml}</div>` : ""}
${riskHtml ? `<div class="sec"><h2>Risk Highlights</h2>${riskHtml}</div>` : ""}
${painAreas.length ? `<div class="sec"><h2>Portfolio Pain Areas</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${painAreas.map((pa) => `<div style="background:#fff8f0!important;border:1px solid #fde8c8;border-left:4px solid #FFC200;border-radius:5px;padding:10px 14px;font-size:12px">${esc(pa)}</div>`).join("")}</div></div>` : ""}
${
  dupTools.length
    ? `<div class="sec"><h2>Duplicate &amp; Redundant Tools</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${dupTools
        .slice(0, 10)
        .map(
          (d) =>
            `<div style="background:#fff5f5!important;border:1px solid #fad7d7;border-radius:7px;padding:12px"><div style="font-weight:700;color:#003366;margin-bottom:4px;font-size:13px">${esc(d.tool_a)} &harr; ${esc(d.tool_b)}</div><div style="font-size:11px;color:#666;margin-bottom:5px"><b>${esc(d.category)}</b> &mdash; ${esc(d.overlap_reason)}</div><div style="font-size:11px;font-weight:700;color:#0063DC">&#9654; ${esc(d.recommendation)}</div></div>`,
        )
        .join("")}</div></div>`
    : ""
}
${perToolHtml}
<div class="sec"><h2>Full Tool Portfolio Assessment</h2>
<table><thead><tr><th>Tool</th><th>Vendor</th><th>Category</th><th>Annual Cost</th><th>Users</th><th>Score</th><th>Risk</th><th>Action</th></tr></thead><tbody>${toolRows}</tbody></table></div>
${dups.length ? `<div class="sec"><h2>Duplication &amp; Consolidation Opportunities</h2><table><thead><tr><th>Category</th><th>Tool A</th><th>Tool B</th><th>Overlap</th><th>Retain</th><th>Est. Savings</th><th>Priority</th></tr></thead><tbody>${dupRows}</tbody></table></div>` : ""}
${Object.keys(oc).length ? `<div class="sec"><h2>Expected Business Outcomes</h2><table><tbody>${Object.entries(oc).map(([k, v]) => `<tr><td style="width:40%;font-weight:600">${k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div>` : ""}
<div class="ftr"><span>Portfolio Rationalization Agent &nbsp;&bull;&nbsp; Enterprise Technology Strategy Advisory</span><span>CONFIDENTIAL &nbsp;&bull;&nbsp; ${now.getFullYear()}</span></div>
</div></body></html>`;
}

function kpiCell(label: string, value: string, sub: string, barPct?: number, barColor?: string, valueColor?: string): string {
  const bar =
    barPct !== undefined
      ? `<div style="height:4px;background:#e8edf5;border-radius:2px;margin-top:7px;overflow:hidden"><div style="height:100%;border-radius:2px;width:${barPct}%;background:${barColor ?? "#003366"}"></div></div>`
      : "";
  return `<div style="background:#fff;padding:16px 14px;text-align:center">
<div style="font-size:9px;color:#6B7A99;text-transform:uppercase;letter-spacing:.7px;font-weight:600">${label}</div>
<div style="font-size:22px;font-weight:800;margin:5px 0 1px;color:${valueColor ?? "#003366"}">${value}</div>
<div style="font-size:10px;color:#8899bb">${sub}</div>${bar}</div>`;
}
