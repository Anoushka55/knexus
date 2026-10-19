import { NextRequest, NextResponse } from "next/server";
import { runArb } from "@/lib/enterprise-architecture/agents/arb";
import type { Application, ArbProposal, ArbResult } from "@/lib/enterprise-architecture/types";

const ACTION_REQUIRED = new Set(["Retire", "Replace", "Refactor", "Rehost", "Replatform"]);

/**
 * Mirrors POST /arb/evaluate: auto-builds the governance proposal from the
 * flagged applications in a TIME result, then runs the ARB agent against it.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const applications: Application[] = body.applications ?? [];
    const flagged = applications.filter((a) => ACTION_REQUIRED.has(a.rationalization_action ?? ""));

    const flaggedNames = flagged.map((a) => a.name || "Unknown");
    const vendors = Array.from(new Set(applications.map((a) => a.vendor).filter(Boolean))).slice(0, 8) as string[];
    const totalCost = applications.reduce((s, a) => s + (a.annual_cost ?? 0), 0);
    const flaggedCost = flagged.reduce((s, a) => s + (a.annual_cost ?? 0), 0);

    const eaCtx = body.ea_context ?? {};
    const ratSummary = body.rationalization_summary ?? {};

    const proposal: ArbProposal & Record<string, unknown> = {
      proposal_title:
        body.proposal_title ||
        `Portfolio Rationalization — ${flagged.length} Application${flagged.length !== 1 ? "s" : ""} Requiring Architectural Action`,
      description:
        body.description ||
        `EA Rationalization analysis of ${applications.length} applications identifies ${flagged.length} requiring architectural change: ${flaggedNames.slice(0, 6).join(", ")}${flaggedNames.length > 6 ? "..." : ""}. Annual portfolio spend: $${totalCost.toLocaleString()}. Flagged application spend: $${flaggedCost.toLocaleString()}.`,
      technology_stack: vendors,
      timeline: body.timeline || "12-18 months",
      estimated_cost: body.estimated_cost || 0,
      annual_running_cost: body.annual_running_cost || 0,
      business_case:
        body.business_case ||
        `Portfolio analysis shows ${flagged.length} of ${applications.length} applications are flagged for action (Retire/Replace/Refactor/Rehost/Replatform). Rationalization will reduce technical debt, eliminate duplications (${ratSummary.duplications_found ?? 0} found), and align the portfolio with strategic business outcomes. Industry: ${eaCtx.industry || "not specified"}. EA framework: ${eaCtx.ea_framework || "not specified"}. ${eaCtx.additional_context || ""}`.trim(),
      current_system: `Portfolio of ${applications.length} applications`,
      integration_points:
        body.integration_points ||
        `Applications span ${new Set(applications.map((a) => a.category).filter(Boolean)).size} categories`,
      security_compliance: eaCtx.governance || "To be assessed",
      data_sensitivity: body.data_sensitivity || "Mixed — includes Critical and High business systems",
      alternatives_considered: body.alternatives_considered || "Maintain status quo (rejected — unsustainable cost and technical debt trajectory)",
      flagged_applications: flagged.map((a) => ({
        name: a.name,
        vendor: a.vendor,
        category: a.category,
        rationalization_action: a.rationalization_action,
        annual_cost: a.annual_cost,
        composite_score: a.composite_score,
        end_of_life: a.end_of_life,
      })),
      full_portfolio_summary: ratSummary,
      ea_context: eaCtx,
    };

    let result: ArbResult;
    try {
      result = await runArb(proposal);
    } catch (e) {
      return NextResponse.json({ detail: `ARB evaluation failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
    }

    // If parsing failed, try to re-extract a JSON block from the raw response.
    if (result.parse_error && result.raw_response) {
      const match = result.raw_response.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          result = JSON.parse(match[0]);
        } catch {
          // keep original
        }
      }
    }

    let decision = String(result.decision || "").toUpperCase();
    if (!["APPROVED", "REJECTED", "CONDITIONAL"].includes(decision)) decision = "CONDITIONAL";

    return NextResponse.json({
      decision,
      confidence_score: result.confidence_score ?? 0,
      compliance_score: result.compliance_score ?? 0,
      risks: result.risks ?? [],
      anti_patterns_detected: result.anti_patterns_detected ?? [],
      redundancy_flags: result.redundancy_flags ?? [],
      integration_complexity: result.integration_complexity ?? "UNKNOWN",
      recommendations: result.recommendations ?? [],
      conditions: result.conditions ?? [],
      reasoning: result.reasoning ?? "",
      proposal,
      flagged_count: flagged.length,
      total_apps: applications.length,
    });
  } catch (e) {
    return NextResponse.json({ detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
