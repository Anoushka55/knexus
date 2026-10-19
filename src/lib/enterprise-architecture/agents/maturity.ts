import "server-only";
/** Port of agents/maturity_agent.py — EA Maturity Assessment. */
import { callClaude, parseJsonLenient } from "../claude";
import { MATURITY_SYSTEM_PROMPT } from "../prompts";
import { getIndustryContext } from "../industryContext";
import { DIMENSION_TO_FRAMEWORK_KEY } from "../questionnaire";
import type { AssessmentResultsPayload, MaturityDimension, MaturityResult } from "../types";

export interface RunMaturityInput {
  industry?: string;
  sub_sector?: string;
  governance?: string;
  ea_framework?: string;
  ea_tools?: string;
  cloud_strategy?: string;
  cmdb_tool?: string;
  known_integrations?: string;
  additional_context?: string;
  mapping_complexity?: string;
  assessment_results?: AssessmentResultsPayload | null;
  [key: string]: unknown;
}

export async function runMaturity(input: RunMaturityInput): Promise<MaturityResult> {
  let enrichedPrompt = MATURITY_SYSTEM_PROMPT;

  if (input.industry) enrichedPrompt += getIndustryContext(input.industry, input.sub_sector);

  const assessmentResults = input.assessment_results;
  const hasAssessment = !!(assessmentResults && assessmentResults.dimensions?.length);

  if (hasAssessment && assessmentResults) {
    const dims = assessmentResults.dimensions;
    const dimLines = dims.map((d) => `  - ${d.label}: score=${d.score}, band=${d.band}`).join("\n");
    enrichedPrompt += `

### Human Assessment Results (PRIMARY EVIDENCE — 30-question structured questionnaire):
These scores come from ${assessmentResults.respondent_count} respondent(s) (${assessmentResults.respondent_names.join(", ")}) who completed the
30-question EA Maturity Assessment covering 8 dimensions across 4 pillars (Vision, People,
Process, Technology). Use these as the PRIMARY basis for your scoring. Your 8
dimensions should be mapped to and anchored by these evidence-based scores.

Overall Score: ${assessmentResults.overall_score}/5 (${assessmentResults.overall_band})
Dimension Scores:
${dimLines}

Pillar mapping guide (questionnaire dimension → framework dimension key):
  - vision_strategy       → vision_and_strategy        (Pillar: Vision & Strategy)
  - organization          → organization               (Pillar: People)
  - leadership_governance → leadership_and_governance  (Pillar: People)
  - behavior_culture      → behaviour_and_culture      (Pillar: People)
  - metrics_analysis      → metrics_and_analysis       (Pillar: Processes)
  - policy_standards      → policy_and_standards       (Pillar: Processes)
  - enabling_processes    → enabling_processes          (Pillar: Processes)
  - tools_technology      → tools_and_technology       (Pillar: Technology)

When generating gaps and improvements per dimension, reference the specific question areas
that scored low from the assessment data above.
`;
  } else {
    enrichedPrompt +=
      "\n### Note: No structured questionnaire results provided. Assessment based on portfolio signals and context only. Accuracy is lower — recommend running the 30-question assessment for evidence-based scoring.\n";
  }

  const ctxFields: string[] = [];
  const labels: Array<[keyof RunMaturityInput, string]> = [
    ["governance", "Governance structure"],
    ["ea_framework", "EA framework in use"],
    ["ea_tools", "EA tooling"],
    ["cloud_strategy", "Cloud strategy"],
    ["cmdb_tool", "CMDB / ITSM tool"],
    ["known_integrations", "Known integration patterns"],
    ["additional_context", "Additional context"],
    ["mapping_complexity", "Dependency complexity (from MAPPING stage)"],
  ];
  for (const [key, label] of labels) {
    const val = input[key];
    if (val) ctxFields.push(`${label}: ${val}`);
  }
  if (ctxFields.length) enrichedPrompt += "\n### Client-Provided Organisational Context:\n" + ctxFields.join("\n") + "\n";

  const userMessage = `Conduct a full 8-dimension EA maturity assessment. ${
    hasAssessment
      ? "Use the structured questionnaire results above as PRIMARY evidence for scoring."
      : "No questionnaire data available — base on portfolio signals only."
  } Return a structured JSON result:\n${JSON.stringify(input, null, 2)}`;

  const resultStr = await callClaude(enrichedPrompt, userMessage);
  const result = parseJsonLenient<MaturityResult>(resultStr);

  // Anchor dimension scores directly to questionnaire evidence (best-effort),
  // mirroring the Python agent's post-processing step.
  try {
    if (hasAssessment && assessmentResults && result.dimensions && typeof result.dimensions === "object") {
      for (const dim of assessmentResults.dimensions) {
        const fwKey = DIMENSION_TO_FRAMEWORK_KEY[dim.id] ?? "";
        if (!fwKey || !(fwKey in result.dimensions)) continue;
        const existing = result.dimensions[fwKey] as MaturityDimension | undefined;
        const target: MaturityDimension = existing ?? { score: 0, band: "Low", positive_findings: [], improvement_areas: [] };
        if (dim.score !== null && dim.score !== undefined) {
          target.score = Math.round(dim.score * 100) / 100;
          target.band = dim.band;
        }
        result.dimensions[fwKey] = target;
      }

      const dimScores = Object.values(result.dimensions)
        .map((v) => v?.score)
        .filter((s): s is number => typeof s === "number");
      if (dimScores.length) {
        const overall = Math.round((dimScores.reduce((a, b) => a + b, 0) / dimScores.length) * 100) / 100;
        result.overall_maturity_score = overall;
        result.overall_band = overall > 3.5 ? "High" : overall > 2 ? "Medium" : "Low";
      }

      const pillarDimMap: Record<string, string[]> = {
        "Vision & Strategy": ["vision_and_strategy"],
        People: ["organization", "leadership_and_governance", "behaviour_and_culture"],
        Processes: ["metrics_and_analysis", "policy_and_standards", "enabling_processes"],
        Technology: ["tools_and_technology"],
      };
      if (typeof result.pillar_scores !== "object" || !result.pillar_scores) result.pillar_scores = {};
      for (const [pillar, keys] of Object.entries(pillarDimMap)) {
        const pscores = keys
          .map((k) => result.dimensions?.[k]?.score)
          .filter((s): s is number => typeof s === "number");
        if (pscores.length) {
          result.pillar_scores[pillar] = Math.round((pscores.reduce((a, b) => a + b, 0) / pscores.length) * 100) / 100;
        }
      }
    }
  } catch {
    // anchoring is best-effort; keep Claude's original output if anything goes wrong
  }

  return result;
}
