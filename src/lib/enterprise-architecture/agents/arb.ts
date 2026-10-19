import "server-only";
/**
 * Port of agents/arb_agent.py. The Python version also enriches the
 * prompt with Supabase-backed memory (past decisions, standards, the
 * live application portfolio). This console has no database, so those
 * enrichments are omitted — Supabase was already optional in the source
 * app (every fetch_* helper degrades to an empty list when unconfigured),
 * so the agent's behaviour here matches that "no memory configured" path.
 */
import { callClaude, parseJsonLenient } from "../claude";
import { ARB_SYSTEM_PROMPT } from "../prompts";
import type { ArbResult } from "../types";

export async function runArb(inputData: Record<string, unknown>): Promise<ArbResult> {
  const userMessage = `Evaluate this architecture proposal and return a JSON decision:\n${JSON.stringify(inputData, null, 2)}`;
  const resultStr = await callClaude(ARB_SYSTEM_PROMPT, userMessage);
  return parseJsonLenient<ArbResult>(resultStr);
}
