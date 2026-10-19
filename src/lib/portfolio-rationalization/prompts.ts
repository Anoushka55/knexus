/**
 * Prompts ported 1:1 from the Python reference (api/index.py SYSTEM_PROMPT,
 * `ai_assess`'s inline prompt, `/api/chat`'s system-prompt construction, and
 * the file-text extraction prompt used by `ai_parse_text`).
 */
import type { Duplication, Tool } from "./types";

export const SYSTEM_PROMPT = `You are an Enterprise Technology Strategy AI Agent specializing in Platform, Application, and Tools Assessment & Rationalization, aligned with KPMG-style consulting frameworks and telecom/large enterprise transformation programs (e.g., Airtel, Tanla-like environments).

You combine the expertise of:
- Senior Enterprise Architect
- Technology Due-Diligence Consultant
- CIO/CTO Advisory Analyst
- Telecom Digital Transformation Expert

PRIMARY OBJECTIVE: Maximize business value, reduce cost, mitigate risk, and simplify the technology landscape by assessing tools across 7 dimensions and applying the 6R Rationalization model.

6R MODEL:
- Retain    -> Strategic, healthy, high-value (Score >=7.5, Risk <=4)
- Rehost    -> Lift-and-shift to cloud (Score >=6, on-prem, cloud-ready)
- Replatform -> Minor modernization (Score 5-7)
- Refactor  -> Significant redesign needed (Score 3-5)
- Replace   -> Better alternative exists (Score <5 or cost-inefficient)
- Retire    -> Decommission -- redundant, EOL, or very low value

SCORING DIMENSIONS (0-10 each):
1. Business Value -- Strategic importance, revenue impact, criticality
2. Adoption Rate -- User adoption %, utilization signals
3. Integration Depth -- API dependencies, systemic coupling
4. Vendor Support -- Roadmap clarity, vendor health, EOL status
5. Cost Efficiency -- Cost-per-user vs market benchmarks
6. Technical Health -- Modernity, tech debt, maintenance burden
7. Risk Score -- Security, compliance, obsolescence, vendor lock-in (higher = more risky)

TELECOM FILTERS (apply when telecom/TMT context): Latency sensitivity, 24x7 SLA, TRAI/GDPR compliance, transaction volume at scale, customer SLA impact.

BEHAVIOR: Be data-driven. State assumptions explicitly. Tag recommendations with confidence: High/Medium/Low. Provide trade-offs, not just conclusions. Use executive-grade language. Never give generic recommendations.

OUTPUT: Always produce structured recommendations with rationale, impact analysis, roadmap (0-3 months | 3-12 months | 12-24 months), and expected outcomes.`;

export const FILE_PARSE_PROMPT = `Extract ALL actual tools/apps/platforms from the text — do not skip any real tool entry.
IMPORTANT: Do NOT include column header rows (e.g. rows containing "Tool Name", "Vendor", "Category", "Annual Cost", "Users" as values — these are headers, not tools). Only include actual named software products, platforms, or applications.
Return ONLY valid JSON with a "tools" array, no markdown.
Each item: name, vendor(or null), category(Monitoring/Logging/APM/Security/ITSM/Collaboration/CRM/ERP/BSS/OSS/Cloud/Analytics/DevOps/Network/Storage/Database/AI/Other),
description(brief/null), annual_cost(number/null), user_count(number/null),
criticality(Critical/High/Medium/Low/null), deployment(Cloud/On-Prem/Hybrid/null),
integrations(number/null), age_years(number/null), end_of_life(bool), compliance_required(bool), business_unit(string/null).
TEXT:
`;

export const IMAGE_PARSE_PROMPT =
  "This image shows a software/tool inventory or IT portfolio. " +
  "Extract EVERY tool or application visible — do not skip any. For each tool return: " +
  "name, vendor, category, annual_cost (number only, omit currency symbols), " +
  "user_count (number only), criticality (Critical/High/Medium/Low), " +
  "deployment (Cloud/On-Prem/Hybrid), age_years (number), " +
  "integrations (number), end_of_life (true/false). " +
  'Return ONLY a JSON array: [{"name":"...","vendor":"...",...}, ...]. ' +
  "Omit fields not visible. Always include name. Include ALL tools visible.";

export function buildAssessPrompt(
  tools: Tool[],
  dups: Duplication[],
  industry: string,
  focus: string,
): string {
  const allPain = tools.map((t) => t.pain_points).filter(Boolean) as string[];
  const painContext = allPain.length
    ? `\nKNOWN PAIN POINTS FROM DATA:\n${allPain.slice(0, 20).map((p) => `- ${p}`).join("\n")}`
    : "";

  return `Perform a comprehensive rationalization assessment.
Industry: ${industry.toUpperCase()}${focus ? ` | Focus: ${focus}` : ""}${painContext}

TOOL INVENTORY (pre-scored, first 30):
${JSON.stringify(tools.slice(0, 30), null, 2).slice(0, 8000)}

DUPLICATION ANALYSIS:
${JSON.stringify(dups.slice(0, 10), null, 2).slice(0, 2000)}

Return ONLY valid JSON (no markdown, no explanation) with these exact keys:
{
  "executive_summary": {
    "tool_ecosystem": "Bullet-point list of 4-6 key findings about the current tool ecosystem. Each bullet starts with '- '. Cover: total tool count by category, on-prem vs cloud split, vendor concentration, critical challenges, EOL/legacy exposure. Use specific numbers.",
    "overlapping_tools": "Bullet-point list of each duplicate/overlap pair. Each bullet starts with '- '. Format each bullet as: '- [Tool A] vs [Tool B] ([Category]) — combined cost $X/yr → Consolidate on [Tool] saving $Y/yr'. End with a total savings bullet.",
    "benchmarking": "Bullet-point list of 4-6 benchmarking observations. Each bullet starts with '- '. Compare each flagged tool against market rate or maturity standard.",
    "kpis_success_factors": "Bullet-point list of 5-7 KPI comparisons. Each bullet starts with '- '. Use 'Current X → Target Y' format inline. Cover: tool count, annual spend, duplicate pairs, EOL tools, risk level, cloud adoption %, avg portfolio score.",
    "recommendations": "Bullet-point list of 6-8 specific platform decisions. Each bullet starts with '- [Action]:'. Group by action type (Retain/Replace/Retire/Consolidate).",
    "rollout_roadmap": "Structured phase-wise bullet list with dependencies. Format:\\nPhase 1 — Quick Wins (0-3 Months):\\n- [action]\\nPhase 2 — Strategic Delivery (3-12 Months):\\n- [action] (Depends on: Phase 1 [item])\\nPhase 3 — Transformation (12-24 Months):\\n- [action] (Depends on: Phase 2 [item])"
  },
  "three_pillars": {
    "as_is_assessment": "Bullet-point analysis of 7-9 key findings about the CURRENT AS-IS state of this specific tool portfolio, citing specific tool names and numbers. Each bullet MUST start with '- '.",
    "governance_framework": "Bullet-point list of 7-9 governance recommendations tailored to THIS portfolio (ITIL 4, COBIT 2019, ISO/IEC 27001:2022, FinOps). Each bullet MUST start with '- '.",
    "tools_standardization": "Bullet-point list of 7-9 standardization decisions for THIS portfolio, referencing current market leaders per category. Each bullet MUST start with '- '."
  },
  "portfolio_overview": {"total_tools":<int>,"total_annual_cost":<float>,"portfolio_health":"Healthy|At Risk|Critical","health_rationale":"<brief>"},
  "before_after_comparison": {
    "current_state": {
      "tool_count": <total number of tools>,
      "annual_cost": <total annual cost as number>,
      "duplicate_pairs": <number of overlapping tool pairs>,
      "eol_tools": <number of end-of-life tools>,
      "risk_level": "High|Medium|Low",
      "key_issues": ["<specific issue naming tools>","<specific issue>","<specific issue>","<specific issue>"]
    },
    "future_state": {
      "projected_tool_count": <estimated count after rationalization>,
      "projected_annual_cost": <estimated annual cost after savings>,
      "estimated_annual_savings": <projected annual savings as number>,
      "eol_tools_resolved": <number of EOL issues to be addressed>,
      "risk_level": "High|Medium|Low",
      "improvements": ["<specific improvement>","<specific improvement>","<specific improvement>","<specific improvement>","<specific improvement>"]
    }
  },
  "portfolio_pain_areas": ["<specific pain area 1>","<specific pain area 2>","<specific pain area 3>"],
  "rationalization_summary": {"Retain":<int>,"Rehost":<int>,"Replatform":<int>,"Refactor":<int>,"Replace":<int>,"Retire":<int>},
  "duplicate_tools": [{"tool_a":"<name>","tool_b":"<name>","category":"<cat>","overlap_reason":"<why duplicate>","recommendation":"<action>"}],
  "top_recommendations": [{"rank":1,"title":"<title>","description":"<detail>","impact":"<impact>","effort":"Low|Medium|High","priority":"Critical|High|Medium","confidence":"High|Medium|Low","timeline":"0-3 months|3-12 months|12-24 months"}],
  "tool_analysis": [{"tool_name":"<name>","overview":"<1-2 sentence role in landscape>","facts":[{"label":"Vendor","value":"<v>"}],"strengths":["<strength1>"],"challenges":["<challenge1>"],"gaps":["<gap1>"],"cost_analysis":"<cost vs value narrative>","benchmarking":"<vs market alternatives>","recommendation":"Retain|Rehost|Replatform|Refactor|Replace|Retire"}],
  "consolidation_opportunities": [{"tools":["A","B"],"category":"<cat>","overlap_pct":<int>,"recommended_action":"<action>","estimated_savings":<float>,"rationale":"<why>"}],
  "risk_highlights": [{"risk_type":"Security|Compliance|Vendor|Obsolescence|Operational","severity":"Critical|High|Medium","affected_tools":["<names>"],"description":"<desc>","mitigation":"<action>"}],
  "roadmap": {"short_term":["<0-3m action>"],"medium_term":["<3-12m action>"],"long_term":["<12-24m action>"]},
  "expected_outcomes": {"cost_savings_annual":<float>,"risk_reduction":"<desc>","tool_reduction":"<from X to Y>","strategic_gains":"<value>"}
}

For tool_analysis, include ALL tools (up to 30). Be specific and data-driven for each section.`;
}

export interface ChatContext {
  current_tab?: string;
  current_phase?: number;
  tools_loaded?: number;
  assessment_done?: boolean;
  organisation?: string;
  industry?: string;
}

const PHASE_NAMES: Record<number, string> = {
  1: "Organisation",
  2: "Tool Inventory",
  3: "Business Context",
  4: "Technical Context",
  5: "Financial Parameters",
  6: "Assess & Report",
};

export function buildChatSystemPrompt(tools: Tool[], context?: ChatContext): string {
  const parts = [SYSTEM_PROMPT];
  if (tools.length) {
    const summary = tools
      .slice(0, 30)
      .map((t) => `- ${t.name} | ${t.category} | Action:${t.rationalization_action ?? "TBD"} | Score:${t.composite_score ?? "?"}`)
      .join("\n");
    parts.push(`Current tool inventory (${tools.length} tools):\n${summary}`);
  }
  if (context) {
    const tab = context.current_tab ?? "unknown";
    const phase = context.current_phase;
    const toolsN = context.tools_loaded ?? 0;
    const assessed = context.assessment_done ?? false;
    const org = context.organisation ?? "";
    const industry = context.industry ?? "";
    const lines = [
      `User is currently on: ${tab}` + (phase ? ` → Phase ${phase} (${PHASE_NAMES[phase] ?? ""})` : ""),
      `Tools ingested: ${toolsN}`,
      `Assessment completed: ${assessed}`,
    ];
    if (org) lines.push(`Organisation: ${org}`);
    if (industry) lines.push(`Industry: ${industry}`);
    parts.push(
      "CURRENT USER CONTEXT:\n" +
        lines.join("\n") +
        "\n\nYou are an in-app AI Guide. Rules: " +
        "(1) Be concise — 2-4 sentences unless the user asks for detail. " +
        "(2) Always relate your answer to the user's current page/phase. " +
        "(3) If the user asks to navigate or says 'go to X', confirm it and tell them what they'll find there. " +
        "(4) Proactively flag missing inputs that will affect the assessment quality. " +
        "(5) If tools_loaded=0 and user is not on ingest, suggest they ingest data first. " +
        "(6) Use markdown bold (**text**) for emphasis.",
    );
  }
  return parts.join("\n\n");
}
