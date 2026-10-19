import "server-only";
/** Port of agents/mapping_agent.py — dependency / impact analysis. */
import { callClaude, parseJsonLenient } from "../claude";
import { BATCH_MAPPING_PROMPT, MAPPING_SYSTEM_PROMPT } from "../prompts";
import { getIndustryContext } from "../industryContext";
import type { Application, ArbResult, MappingResult } from "../types";

export interface RunMappingBatchInput {
  applications: Application[]; // flagged apps only
  all_apps?: Application[];
  industry?: string;
  sub_sector?: string;
  governance?: string;
  ea_framework?: string;
  cloud_target?: string;
  known_integrations?: string;
  planned_changes?: string;
  data_sensitivity?: string;
  integration_complexity?: string;
  cmdb_tool?: string;
  additional_context?: string;
}

/** Single-target dependency analysis (/mapping/analyse single-system variant). Mirrors run_mapping(). */
export async function runMapping(inputData: Record<string, unknown>): Promise<MappingResult> {
  let enrichedPrompt = MAPPING_SYSTEM_PROMPT;
  const industry = (inputData.industry as string) || "";
  const subSector = (inputData.sub_sector as string) || "";
  if (industry) enrichedPrompt += getIndustryContext(industry, subSector);

  const userMessage = `Analyze the dependencies and impact for the following system/change request. Return a structured JSON result:\n${JSON.stringify(inputData, null, 2)}`;
  const resultStr = await callClaude(enrichedPrompt, userMessage, 8192);
  return parseJsonLenient<MappingResult>(resultStr);
}

/** Batch dependency analysis across flagged apps. Mirrors run_mapping_batch(). */
export async function runMappingBatch(input: RunMappingBatchInput): Promise<MappingResult> {
  const flaggedApps = input.applications ?? [];
  const allApps = input.all_apps ?? [];

  let enrichedPrompt =
    BATCH_MAPPING_PROMPT +
    `\n\n### Full Application Portfolio (${allApps.length} apps — use for dependency context):\n` +
    JSON.stringify(
      allApps.map((a) => ({
        name: a.name,
        category: a.category,
        rationalization_action: a.rationalization_action,
        integrations: a.integrations,
        criticality: a.criticality,
        deployment: a.deployment,
        annual_cost: a.annual_cost,
      })),
      null,
      2,
    );

  const contextBlock: string[] = [];
  if (input.governance) contextBlock.push(`Governance structure: ${input.governance}`);
  if (input.ea_framework) contextBlock.push(`EA framework: ${input.ea_framework}`);
  if (input.cloud_target) contextBlock.push(`Cloud migration target: ${input.cloud_target}`);
  if (input.cmdb_tool) contextBlock.push(`CMDB/ITSM tool: ${input.cmdb_tool}`);
  if (input.data_sensitivity) contextBlock.push(`Data sensitivity: ${input.data_sensitivity}`);
  if (input.integration_complexity) contextBlock.push(`Integration complexity: ${input.integration_complexity}`);
  if (input.known_integrations) contextBlock.push(`Known integrations provided by client:\n${input.known_integrations}`);
  if (input.planned_changes) contextBlock.push(`Planned changes/decommissions:\n${input.planned_changes}`);
  if (input.additional_context) contextBlock.push(`Additional context: ${input.additional_context}`);
  if (contextBlock.length) enrichedPrompt += "\n### Client-Provided Context:\n" + contextBlock.join("\n") + "\n";

  if (input.industry) enrichedPrompt += getIndustryContext(input.industry, input.sub_sector);

  const appSummary = flaggedApps.map((a) => ({
    name: a.name,
    category: a.category,
    time_classification: a.time_classification,
    rationalization_action: a.rationalization_action,
    composite_score: a.composite_score,
    integrations: a.integrations,
    annual_cost: a.annual_cost,
    criticality: a.criticality,
    deployment: a.deployment,
    end_of_life: a.end_of_life,
  }));

  const userMessage = `Analyse dependencies for these ${flaggedApps.length} applications (from a portfolio of ${allApps.length} total). Return a comprehensive batch JSON dependency analysis:\n${JSON.stringify(appSummary, null, 2)}`;
  const resultStr = await callClaude(enrichedPrompt, userMessage, 8192);
  return parseJsonLenient<MappingResult>(resultStr);
}

/** Builds the mapping/analyse endpoint's input from a TIME result + ARB result + contexts. */
export function buildMappingBatchInput(
  applications: Application[],
  arbResult: ArbResult | null | undefined,
  eaCtx: Record<string, unknown>,
  mapCtx: Record<string, unknown>,
): RunMappingBatchInput {
  const flagged = applications.filter((a) =>
    ["Retire", "Replace", "Refactor", "Rehost", "Replatform"].includes(a.rationalization_action ?? ""),
  );

  let arbSummary = "";
  if (arbResult) {
    arbSummary = `ARB Decision: ${arbResult.decision || "NOT_RUN"}. Compliance: ${arbResult.compliance_score || 0}. Key risks: ${(arbResult.risks || []).slice(0, 3).join("; ")}.`;
  }
  const additionalCtx = (eaCtx.additional_context as string) || "";
  const mapNotes = (mapCtx.additional_notes as string) || "";
  const combinedCtx = [additionalCtx, arbSummary, mapNotes].filter(Boolean).join("\n");

  return {
    applications: flagged,
    all_apps: applications,
    industry: (eaCtx.industry as string) || "",
    sub_sector: (eaCtx.sub_sector as string) || "",
    governance: (eaCtx.governance as string) || "",
    ea_framework: (eaCtx.ea_framework as string) || "",
    cloud_target: (eaCtx.cloud_strategy as string) || (mapCtx.cloud_target as string) || "",
    known_integrations: (mapCtx.known_integrations as string) || "",
    planned_changes: (mapCtx.planned_changes as string) || "",
    data_sensitivity: (mapCtx.data_sensitivity as string) || "",
    integration_complexity: (mapCtx.integration_complexity as string) || "",
    cmdb_tool: (mapCtx.cmdb_tool as string) || "",
    additional_context: combinedCtx,
  };
}
