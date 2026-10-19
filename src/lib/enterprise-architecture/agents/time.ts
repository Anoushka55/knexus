import "server-only";
/**
 * Port of agents/time_agent.py (Portfolio Rationalization / TIME agent).
 * Scoring + duplication detection are pure/deterministic (scoringEngine.ts,
 * duplicationDetector.ts); only tool extraction from free text or an
 * image, and the executive narrative, call Claude.
 */
import { callClaude, callClaudeVision, parseJsonLenient } from "../claude";
import { ASSESSMENT_NARRATIVE_PROMPT, EXTRACT_TOOLS_PROMPT } from "../prompts";
import { getIndustryContext } from "../industryContext";
import { normalizeTool } from "../normalizeTool";
import { scoreApplication } from "../scoringEngine";
import { detectDuplications } from "../duplicationDetector";
import type { Application, Duplication, TimeAssessment, TimeResult } from "../types";

export async function extractToolsFromText(text: string): Promise<Record<string, unknown>[]> {
  const userMsg = `Extract all applications and tools from this text:\n\n${text.slice(0, 6000)}`;
  const resultStr = await callClaude(EXTRACT_TOOLS_PROMPT, userMsg);
  const data = parseJsonLenient<Record<string, unknown>>(resultStr);
  for (const v of Object.values(data)) {
    if (Array.isArray(v)) return v as Record<string, unknown>[];
  }
  return [];
}

export async function extractToolsFromImage(imageBase64: string, mediaType: string): Promise<Record<string, unknown>[]> {
  const promptText =
    "This image may contain an architecture diagram, portfolio slide, technology landscape, " +
    "or list of enterprise applications. Extract every application, tool, or system you can identify. " +
    "Return ONLY a valid JSON object with a 'tools' array.";
  const resultStr = await callClaudeVision(EXTRACT_TOOLS_PROMPT, imageBase64, mediaType, promptText);
  const data = parseJsonLenient<Record<string, unknown>>(resultStr);
  for (const v of Object.values(data)) {
    if (Array.isArray(v)) return v as Record<string, unknown>[];
  }
  return [];
}

export function scoreTools(toolsRaw: Record<string, unknown>[]): Application[] {
  return toolsRaw.map((raw) => scoreApplication(normalizeTool(raw)));
}

/** Scoring + duplication detection only — mirrors the deterministic half of /time/ingest. */
export function ingestAndScore(toolsRaw: Record<string, unknown>[]): { applications: Application[]; duplications: Duplication[] } {
  const scored = scoreTools(toolsRaw);
  const duplications = detectDuplications(scored);
  return { applications: scored, duplications };
}

async function generateNarrative(
  scoredTools: Application[],
  duplications: Duplication[],
  industry?: string,
  subSector?: string,
): Promise<TimeAssessment> {
  let enrichedPrompt = ASSESSMENT_NARRATIVE_PROMPT;
  if (industry) enrichedPrompt += getIndustryContext(industry, subSector);

  const toolSummary = scoredTools.map((t) => ({
    name: t.name,
    category: t.category,
    annual_cost: t.annual_cost,
    user_count: t.user_count,
    composite_score: t.composite_score,
    time_classification: t.time_classification,
    rationalization_action: t.rationalization_action,
    confidence_level: t.confidence_level,
    risk_score: t.scores?.risk_score,
  }));

  const userMsg = `Portfolio (pre-scored):\n${JSON.stringify(toolSummary, null, 2)}\n\nDuplication overlaps:\n${JSON.stringify(duplications.slice(0, 10), null, 2)}`;
  const resultStr = await callClaude(enrichedPrompt, userMsg);
  return parseJsonLenient<TimeAssessment>(resultStr);
}

export interface RunTimeInput {
  applications?: Record<string, unknown>[];
  free_text?: string;
  industry?: string;
  sub_sector?: string;
}

/** Full TIME run: score → detect duplications → Claude executive narrative. Mirrors run_time(). */
export async function runTime(input: RunTimeInput): Promise<TimeResult> {
  let appsIn = input.applications ?? [];
  if (!appsIn.length && input.free_text) {
    appsIn = await extractToolsFromText(input.free_text);
  }

  const scoredTools = scoreTools(appsIn);
  const duplications = detectDuplications(scoredTools);

  // Align rationalization actions with duplication findings (consolidate candidates
  // that scored "Retain" contradict the duplication recommendation).
  const consolidateMap = new Map<string, string>();
  for (const d of duplications) {
    if (d.consolidate_candidate) consolidateMap.set(d.consolidate_candidate, d.priority);
  }
  for (const t of scoredTools) {
    if (t.rationalization_action === "Retain" && t.name && consolidateMap.has(t.name)) {
      const priority = consolidateMap.get(t.name);
      t.rationalization_action = priority === "High" || priority === "Medium" ? "Replace" : "Replatform";
    }
  }

  const assessment = await generateNarrative(scoredTools, duplications, input.industry, input.sub_sector);

  const actionCounts: Record<string, number> = {};
  for (const t of scoredTools) {
    const action = t.rationalization_action ?? "Replatform";
    actionCounts[action] = (actionCounts[action] ?? 0) + 1;
  }

  return {
    applications: scoredTools,
    portfolio_summary: {
      total_apps: scoredTools.length,
      total_annual_cost: scoredTools.reduce((s, t) => s + (t.annual_cost ?? 0), 0),
      action_breakdown: actionCounts,
      duplications_found: duplications.length,
      potential_savings: duplications.reduce((s, d) => s + (d.potential_annual_savings ?? 0), 0),
    },
    duplications,
    assessment,
  };
}
