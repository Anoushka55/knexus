import { NextRequest, NextResponse } from "next/server";
import { runFullPipeline } from "@/lib/enterprise-architecture/agents/fullPipeline";
import { generatePipelineHtml } from "@/lib/enterprise-architecture/reportHtml";

/**
 * Mirrors POST /ea-full: the full 4-stage EA Intelligence pipeline
 * (TIME → MAPPING → MATURITY → INSIGHTS). The Python version also returns
 * a gzip-compressed PDF binary (report_b64); this port returns an HTML
 * report string instead (report_html) that the Reports page renders
 * inline and can print/"Save as PDF" — see the final report for why.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pipeline = await runFullPipeline(body);
    const reportHtml = generatePipelineHtml(pipeline);
    return NextResponse.json({ ...pipeline, report_html: reportHtml });
  } catch (e) {
    return NextResponse.json({ detail: `Pipeline execution failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
}
