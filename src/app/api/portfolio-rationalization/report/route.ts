import { NextRequest, NextResponse } from "next/server";
import { buildReportHtml } from "@/lib/portfolio-rationalization/report";
import type { Assessment, Duplication, Tool } from "@/lib/portfolio-rationalization/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tools: Tool[] = body.tools || [];
    const duplications: Duplication[] = body.duplications || [];
    const assessment: Assessment = body.assessment || {};
    const chatContext: string | null = body.chat_context ?? null;

    const html = buildReportHtml(tools, duplications, assessment, chatContext);
    return NextResponse.json({ html });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Report generation failed: ${msg}` }, { status: 500 });
  }
}
