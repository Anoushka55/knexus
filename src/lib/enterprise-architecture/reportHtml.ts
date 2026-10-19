/**
 * Generates a self-contained, printable HTML report from a pipeline run.
 *
 * The source app renders the equivalent report server-side as a PDF binary
 * (utils/report_generator.py, via reportlab). Next.js API routes have no
 * lightweight equivalent for rasterising a PDF without a headless browser
 * dependency, so this port renders the same content as an HTML document the
 * browser can preview inline and print/"Save as PDF" — see the final
 * report for the full list of adaptations.
 */
import type { PipelineResult } from "./types";

const ESCAPE_MAP: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ESCAPE_MAP[c] ?? c);
}

function money(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `$${Math.round(n).toLocaleString()}`;
}

export function generatePipelineHtml(pipeline: PipelineResult, title = "EA Intelligence Report"): string {
  const { TIME, ARB, MAPPING, COMPLIANCE, MATURITY, INSIGHTS, pipeline_summary: summary } = pipeline;

  const appsRows =
    TIME?.applications
      ?.slice()
      .sort((a, b) => (a.composite_score ?? 0) - (b.composite_score ?? 0))
      .map(
        (a) => `
      <tr>
        <td>${esc(a.name)}</td>
        <td>${esc(a.category)}</td>
        <td>${esc(a.rationalization_action)}</td>
        <td>${esc(a.composite_score?.toFixed?.(1) ?? a.composite_score)}</td>
        <td>${money(a.annual_cost)}</td>
      </tr>`,
      )
      .join("") ?? "";

  const dupRows =
    TIME?.duplications
      ?.map(
        (d) => `
      <tr>
        <td>${esc(d.tool_a)} ↔ ${esc(d.tool_b)}</td>
        <td>${esc(d.category)}</td>
        <td>${d.overlap_percentage}%</td>
        <td>${esc(d.priority)}</td>
        <td>${money(d.potential_annual_savings)}</td>
      </tr>`,
      )
      .join("") ?? "";

  const dimRows = MATURITY?.dimensions
    ? Object.entries(MATURITY.dimensions)
        .map(
          ([key, d]) => `
      <tr>
        <td>${esc(key.replace(/_/g, " "))}</td>
        <td>${esc(d.pillar)}</td>
        <td>${esc(d.score)}</td>
        <td>${esc(d.band)}</td>
      </tr>`,
        )
        .join("")
    : "";

  const risksList = INSIGHTS?.risk_profile?.top_risks
    ?.map((r) => `<li><strong>${esc(r.risk)}</strong> — ${esc(r.impact)}. Mitigation: ${esc(r.mitigation)}</li>`)
    .join("") ?? "";

  const recsList = INSIGHTS?.strategic_recommendations
    ?.map((r) => `<li>[P${esc(r.priority)}] ${esc(r.recommendation)} — ${esc(r.business_value)} (${esc(r.effort)} effort, ${esc(r.timeline)})</li>`)
    .join("") ?? "";

  const quickWins = INSIGHTS?.quick_wins?.map((q) => `<li>${esc(q)}</li>`).join("") ?? "";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, sans-serif; color: #0C233C; margin: 0; padding: 32px; max-width: 920px; margin: 0 auto; }
  h1 { font-size: 26px; margin-bottom: 2px; }
  h2 { font-size: 17px; border-bottom: 2px solid #1E49E2; padding-bottom: 6px; margin-top: 36px; }
  .sub { color: #64748B; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 10px; }
  th, td { border-bottom: 1px solid #DDE3EC; padding: 6px 8px; text-align: left; }
  th { color: #64748B; font-weight: 600; text-transform: uppercase; font-size: 10.5px; letter-spacing: .04em; }
  .kpis { display: flex; gap: 16px; margin-top: 16px; flex-wrap: wrap; }
  .kpi { background: #F8FAFC; border: 1px solid #DDE3EC; border-radius: 10px; padding: 12px 16px; min-width: 140px; }
  .kpi .v { font-size: 20px; font-weight: 800; }
  .kpi .l { font-size: 11px; color: #64748B; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700; }
  .b-approved, .b-high { background: #DCFCE7; color: #166534; }
  .b-rejected, .b-critical { background: #FEE2E2; color: #991B1B; }
  .b-conditional, .b-medium { background: #FEF3C7; color: #92400E; }
  p { line-height: 1.6; font-size: 13.5px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>EA Intelligence Report</h1>
  <div class="sub">
    Industry: ${esc(summary.industry || "General")}${summary.sub_sector ? " — " + esc(summary.sub_sector) : ""} ·
    Generated ${new Date().toLocaleString()}
  </div>

  <div class="kpis">
    <div class="kpi"><div class="v">${summary.total_apps_assessed}</div><div class="l">Applications assessed</div></div>
    <div class="kpi"><div class="v">${money(summary.total_annual_cost)}</div><div class="l">Total annual cost</div></div>
    <div class="kpi"><div class="v">${money(summary.potential_savings)}</div><div class="l">Potential savings</div></div>
    <div class="kpi"><div class="v">${summary.maturity_score ?? "—"}</div><div class="l">Maturity score /5</div></div>
    <div class="kpi"><div class="v">${summary.compliance_score ?? "—"}</div><div class="l">Compliance score /100</div></div>
  </div>

  ${
    INSIGHTS?.executive_summary
      ? `<h2>Executive Summary</h2><p>${esc(INSIGHTS.executive_summary)}</p>`
      : TIME?.assessment?.executive_summary
        ? `<h2>Executive Summary</h2><p>${esc(TIME.assessment.executive_summary)}</p>`
        : ""
  }

  ${
    ARB
      ? `<h2>ARB Governance Decision</h2>
  <p><span class="badge b-${esc(String(ARB.decision).toLowerCase())}">${esc(ARB.decision)}</span>
  &nbsp; Confidence: ${esc(ARB.confidence_score)}/100 &nbsp; Compliance: ${esc(ARB.compliance_score)}/100 &nbsp;
  Integration complexity: ${esc(ARB.integration_complexity)}</p>
  <p>${esc(ARB.reasoning)}</p>`
      : ""
  }

  ${
    TIME
      ? `<h2>Portfolio Rationalization (TIME)</h2>
  <table>
    <thead><tr><th>Application</th><th>Category</th><th>6R Action</th><th>Score</th><th>Annual Cost</th></tr></thead>
    <tbody>${appsRows}</tbody>
  </table>`
      : ""
  }

  ${
    TIME?.duplications?.length
      ? `<h2>Duplication / Consolidation Opportunities</h2>
  <table>
    <thead><tr><th>Pair</th><th>Category</th><th>Overlap</th><th>Priority</th><th>Est. Savings</th></tr></thead>
    <tbody>${dupRows}</tbody>
  </table>`
      : ""
  }

  ${
    MAPPING && !MAPPING.skipped
      ? `<h2>Dependency Mapping</h2>
  <p>Overall impact level: <strong>${esc(MAPPING.overall_impact_level)}</strong></p>
  <p>${esc(MAPPING.pipeline_context)}</p>`
      : ""
  }

  ${
    COMPLIANCE && !COMPLIANCE.skipped
      ? `<h2>Compliance Gap Analysis</h2>
  <p>Overall compliance score: <strong>${esc(COMPLIANCE.overall_compliance_score)}/100</strong></p>
  <p>Regulations checked: ${esc((COMPLIANCE.regulations_checked || []).join(", "))}</p>`
      : ""
  }

  ${
    MATURITY
      ? `<h2>EA Maturity Assessment</h2>
  <p>Overall maturity score: <strong>${esc(MATURITY.overall_maturity_score)}/5 (${esc(MATURITY.overall_band)})</strong></p>
  <table>
    <thead><tr><th>Dimension</th><th>Pillar</th><th>Score</th><th>Band</th></tr></thead>
    <tbody>${dimRows}</tbody>
  </table>`
      : ""
  }

  ${risksList ? `<h2>Top Risks</h2><ul>${risksList}</ul>` : ""}
  ${recsList ? `<h2>Strategic Recommendations</h2><ul>${recsList}</ul>` : ""}
  ${quickWins ? `<h2>Quick Wins</h2><ul>${quickWins}</ul>` : ""}

</body>
</html>`;
}
