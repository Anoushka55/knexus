import { NextRequest, NextResponse } from "next/server";
import { buildMappingBatchInput, runMappingBatch } from "@/lib/enterprise-architecture/agents/mapping";
import type { Application, ArbResult } from "@/lib/enterprise-architecture/types";

const ACTION_REQUIRED = new Set(["Retire", "Replace", "Refactor", "Rehost", "Replatform"]);

/** Mirrors POST /mapping/analyse: dependency analysis for flagged applications only. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const applications: Application[] = body.applications ?? [];
    const arbResult: ArbResult | null = body.arb_result ?? null;
    const eaCtx: Record<string, unknown> = body.ea_context ?? {};
    const mapCtx: Record<string, unknown> = body.mapping_context ?? {};

    const flagged = applications.filter((a) => ACTION_REQUIRED.has(a.rationalization_action ?? ""));
    if (!flagged.length) {
      return NextResponse.json({
        skipped: true,
        reason: "No applications flagged for action (Retire/Replace/Refactor) — no dependency risk to analyse.",
        overall_impact_level: "LOW",
        mapped_applications: [],
        total_dependencies: 0,
      });
    }

    const input = buildMappingBatchInput(applications, arbResult, eaCtx, mapCtx);
    const result = await runMappingBatch(input);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ detail: `Mapping analysis failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
}
