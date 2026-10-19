import "server-only";
/** Port of orchestrator.py — routes a free-text query to one or more agents. */
import { callClaude, parseJsonLenient } from "../claude";
import { MULTI_CHAIN_SYSTEM_PROMPT, ROUTING_SYSTEM_PROMPT } from "../prompts";
import type { AgentName } from "../types";

const VALID_INTENTS = new Set(["ARB", "TIME", "MAPPING", "MATURITY", "INSIGHTS", "MULTI"]);
const VALID_AGENTS = new Set<AgentName>(["ARB", "TIME", "MAPPING", "MATURITY", "INSIGHTS"]);

export async function routeRequest(query: string): Promise<string> {
  const userMessage = `User query: ${query}`;
  const raw = (await callClaude(ROUTING_SYSTEM_PROMPT, userMessage)).trim().toUpperCase();
  const intent = raw ? raw.split(/\s+/)[0].replace(/[.|,]+$/, "") : "INSIGHTS";
  return VALID_INTENTS.has(intent) ? intent : "INSIGHTS";
}

export async function resolveAgents(intent: string, query: string): Promise<AgentName[]> {
  if (intent !== "MULTI") return [intent as AgentName];

  const userMessage = `User query that requires multiple agents: ${query}`;
  const raw = (await callClaude(MULTI_CHAIN_SYSTEM_PROMPT, userMessage)).trim();
  const rawClean = raw.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();

  try {
    const chain = JSON.parse(rawClean);
    if (Array.isArray(chain)) {
      const valid = (chain as string[]).map((a) => a.toUpperCase()).filter((a) => VALID_AGENTS.has(a as AgentName)) as AgentName[];
      if (valid.length) return valid;
    }
  } catch {
    // fall through to default chain
  }
  return ["TIME", "MAPPING", "INSIGHTS"];
}

export { parseJsonLenient };
