import "server-only";
/** Port of agents/compliance_agent.py — regulatory gap analysis. */
import { callClaude, parseJsonLenient } from "../claude";
import { COMPLIANCE_SYSTEM_PROMPT } from "../prompts";
import { getIndustryContext } from "../industryContext";
import type { Application, ComplianceResult, MappingResult } from "../types";

export interface RunComplianceInput {
  applications: Application[];
  regulations: string[];
  industry?: string;
  sub_sector?: string;
  mapping_output?: MappingResult | null;
  governance?: string;
  additional_context?: string;
}

export async function runCompliance(input: RunComplianceInput): Promise<ComplianceResult> {
  const { regulations, applications } = input;
  if (!regulations || !regulations.length) {
    return { skipped: true, reason: "No regulations selected — compliance check was skipped." };
  }

  let enrichedPrompt = COMPLIANCE_SYSTEM_PROMPT;
  const contextLines: string[] = [];
  if (input.governance) contextLines.push(`Governance structure: ${input.governance}`);
  if (input.additional_context) contextLines.push(`Additional context: ${input.additional_context}`);
  if (contextLines.length) enrichedPrompt += "\n### Client Context:\n" + contextLines.join("\n") + "\n";

  if (input.mapping_output && !input.mapping_output.skipped) {
    const appRisks: Record<string, unknown> = {};
    for (const a of input.mapping_output.app_analyses ?? []) {
      appRisks[a.app_name ?? ""] = {
        impact_level: a.impact_level,
        coupling_score: a.coupling_score,
        single_points_of_failure: a.single_points_of_failure ?? [],
      };
    }
    if (Object.keys(appRisks).length) {
      enrichedPrompt += `\n### Mapping Risk Signals (use for data sensitivity inference):\n${JSON.stringify(appRisks, null, 2)}\n`;
    }
  }

  if (input.industry) enrichedPrompt += getIndustryContext(input.industry, input.sub_sector);

  const appSummary = applications.map((a) => ({
    name: a.name,
    category: a.category,
    criticality: a.criticality,
    deployment: a.deployment,
    vendor: a.vendor,
    annual_cost: a.annual_cost,
    user_count: a.user_count,
    compliance_required: a.compliance_required,
    rationalization_action: a.rationalization_action,
    time_classification: a.time_classification,
    end_of_life: a.end_of_life,
    integrations: a.integrations,
  }));

  const userMessage = `Assess the following ${applications.length}-app portfolio against these regulations: ${regulations.join(", ")}.\n\nReturn a comprehensive compliance gap analysis JSON:\n${JSON.stringify(appSummary, null, 2)}`;
  const resultStr = await callClaude(enrichedPrompt, userMessage, 8192);
  return parseJsonLenient<ComplianceResult>(resultStr);
}
