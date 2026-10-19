import { NextRequest, NextResponse } from "next/server";
import { routeRequest, resolveAgents } from "@/lib/enterprise-architecture/agents/orchestrator";
import { runArb } from "@/lib/enterprise-architecture/agents/arb";
import { runTime } from "@/lib/enterprise-architecture/agents/time";
import { runMapping } from "@/lib/enterprise-architecture/agents/mapping";
import { runMaturity, type RunMaturityInput } from "@/lib/enterprise-architecture/agents/maturity";
import { runInsights } from "@/lib/enterprise-architecture/agents/insights";
import type { RunTimeInput } from "@/lib/enterprise-architecture/agents/time";
import type { AgentName } from "@/lib/enterprise-architecture/types";

/**
 * Mirrors POST /ea-agent from main.py: routes a free-text query to the
 * right agent (or chain of agents via MULTI), runs each, and — when more
 * than one agent ran — appends an INSIGHTS synthesis pass.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string = body.query ?? "";
    const data: Record<string, unknown> = body.data ?? {};
    const agentOverride: string | undefined = body.agent_override;

    const AGENT_MAP: Record<AgentName, (input: Record<string, unknown>) => Promise<unknown>> = {
      ARB: runArb,
      TIME: (input) => runTime(input as RunTimeInput),
      MAPPING: runMapping,
      MATURITY: (input) => runMaturity(input as RunMaturityInput),
      INSIGHTS: runInsights,
    };

    let agentsToRun: AgentName[];
    if (agentOverride) {
      const override = agentOverride.toUpperCase() as AgentName;
      if (!(override in AGENT_MAP)) {
        return NextResponse.json(
          { detail: `Unknown agent '${agentOverride}'. Valid: ${Object.keys(AGENT_MAP).join(", ")}` },
          { status: 400 },
        );
      }
      agentsToRun = [override];
    } else {
      const intent = await routeRequest(query);
      agentsToRun = await resolveAgents(intent, query);
    }

    const results: Record<string, unknown> = {};
    for (const agentName of agentsToRun) {
      if (agentName in AGENT_MAP) {
        results[agentName] = await AGENT_MAP[agentName](data);
      }
    }

    let chain = agentsToRun;
    if (chain.length > 1 && !chain.includes("INSIGHTS")) {
      results.INSIGHTS = await runInsights(results);
      chain = [...chain, "INSIGHTS"];
    }

    return NextResponse.json({
      agent_used: chain.length === 1 ? chain[0] : "MULTI",
      result: results,
      agents_chain: chain,
    });
  } catch (e) {
    return NextResponse.json({ detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
