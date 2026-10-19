import { NextRequest, NextResponse } from "next/server";
import { extractToolsFromImage, extractToolsFromText, ingestAndScore } from "@/lib/enterprise-architecture/agents/time";

/**
 * Mirrors POST /time/ingest: score every tool with the ScoringEngine,
 * detect duplications, and return the enriched portfolio — no narrative
 * generation here (that's /time/full). The Python version parses CSV,
 * Excel, PDF, PPTX, DOCX and images server-side from a multipart upload;
 * this port parses CSV/XLSX/JSON client-side (see src/app/agents/enterprise-architecture-agent/console/analysis/page.tsx)
 * and sends the already-parsed rows as `applications`, or sends `free_text`
 * / a base64 `image` for Claude-based extraction — the same two
 * unstructured-input paths the Python agent used Claude for.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const applications: Record<string, unknown>[] | undefined = body.applications;
    const freeText: string | undefined = body.free_text;
    const image: { data: string; media_type: string } | undefined = body.image;
    const industry: string = body.industry ?? "";
    const subSector: string = body.sub_sector ?? "";

    let toolsRaw: Record<string, unknown>[] = [];
    if (applications && applications.length) {
      toolsRaw = applications;
    } else if (image?.data) {
      toolsRaw = await extractToolsFromImage(image.data, image.media_type);
    } else if (freeText) {
      toolsRaw = await extractToolsFromText(freeText);
    }

    if (!toolsRaw.length) {
      return NextResponse.json(
        {
          detail:
            "No application data found. Please upload a file containing your application inventory, or paste free text describing your applications.",
        },
        { status: 400 },
      );
    }

    const NAME_KEYS = new Set([
      "name",
      "application name",
      "application",
      "app name",
      "app",
      "tool name",
      "tool",
      "system name",
      "system",
      "software",
      "product",
      "product name",
      "service",
      "solution",
      "platform",
    ]);
    const hasName = (row: Record<string, unknown>) =>
      Object.entries(row).some(([k, v]) => {
        const kl = String(k).trim().toLowerCase();
        const matched = NAME_KEYS.has(kl) || [...NAME_KEYS].some((nk) => kl.includes(nk));
        return matched && v && !["", "nan", "none", "unknown"].includes(String(v).trim().toLowerCase());
      });

    if (!toolsRaw.some(hasName)) {
      return NextResponse.json(
        {
          detail:
            "The file was read successfully but no recognisable application or tool names were found. Ensure your file contains at least an 'Application Name' or 'Name' column.",
        },
        { status: 422 },
      );
    }

    const { applications: scored, duplications } = ingestAndScore(toolsRaw);

    const actionCounts: Record<string, number> = {};
    for (const t of scored) {
      const action = t.rationalization_action ?? "Replatform";
      actionCounts[action] = (actionCounts[action] ?? 0) + 1;
    }

    return NextResponse.json({
      success: true,
      tools_scored: scored.length,
      industry,
      sub_sector: subSector,
      applications: scored,
      duplications,
      summary: {
        total_apps: scored.length,
        total_annual_cost: scored.reduce((s, t) => s + (t.annual_cost ?? 0), 0),
        duplications_found: duplications.length,
        potential_savings: duplications.reduce((s, d) => s + (d.potential_annual_savings ?? 0), 0),
        action_breakdown: actionCounts,
      },
    });
  } catch (e) {
    return NextResponse.json({ detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
