import "server-only";
/** Port of agents/insights_agent.py — executive synthesis across all agents. */
import { callClaude, parseJsonLenient } from "../claude";
import { INSIGHTS_SYSTEM_PROMPT } from "../prompts";
import { getIndustryContext } from "../industryContext";
import type { InsightsResult } from "../types";

export async function runInsights(inputData: Record<string, unknown>): Promise<InsightsResult> {
  let enrichedPrompt = INSIGHTS_SYSTEM_PROMPT;
  const industry = (inputData.industry as string) || "";
  const subSector = (inputData.sub_sector as string) || "";
  if (industry) enrichedPrompt += getIndustryContext(industry, subSector);

  const userMessage = `Generate executive-level strategic insights and recommendations based on the following EA agent outputs and data. Return a structured JSON result:\n${JSON.stringify(inputData, null, 2)}`;
  const resultStr = await callClaude(enrichedPrompt, userMessage);
  return parseJsonLenient<InsightsResult>(resultStr);
}
