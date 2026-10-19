import { NextRequest, NextResponse } from "next/server";
import { runPipelineFromStep3 } from "@/lib/enterprise-architecture/agents/fullPipeline";
import { generatePipelineHtml } from "@/lib/enterprise-architecture/reportHtml";

/**
 * Mirrors POST /ea-pipeline/step: the wizard step-by-step endpoint — runs
 * MATURITY → INSIGHTS using the TIME + MAPPING + ARB results the console
 * already computed on earlier pages, then builds the final report.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pipeline = await runPipelineFromStep3(body);
    const reportHtml = generatePipelineHtml(pipeline);
    return NextResponse.json({ ...pipeline, report_html: reportHtml });
  } catch (e) {
    return NextResponse.json({ detail: `Wizard pipeline failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
}
