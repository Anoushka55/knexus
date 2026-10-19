import { NextRequest, NextResponse } from "next/server";
import { callClaude, callClaudeVision, parseJsonLenient } from "@/lib/enterprise-architecture/claude";
import { ARB_EXTRACT_PROMPT } from "@/lib/enterprise-architecture/prompts";
import type { ArbProposal } from "@/lib/enterprise-architecture/types";

/**
 * Mirrors POST /arb/ingest. The Python version also accepts PDF, PPTX,
 * DOCX and XLSX uploads via multipart form-data; this port accepts
 * free text or a base64-encoded image (png/jpg/gif/webp) — the two paths
 * that need no extra document-parsing dependency. See the final report
 * for what's not ported 1:1.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const freeText: string | undefined = body.free_text;
    const image: { data: string; media_type: string } | undefined = body.image;

    let raw: string;
    if (image?.data) {
      raw = await callClaudeVision(
        ARB_EXTRACT_PROMPT,
        image.data,
        image.media_type,
        "Extract all architecture proposal details visible in this image. Return structured JSON.",
      );
    } else if (freeText) {
      raw = await callClaude(ARB_EXTRACT_PROMPT, `Extract the ARB proposal details from this document:\n\n${freeText.slice(0, 8000)}`);
    } else {
      return NextResponse.json({ detail: "No file or text provided." }, { status: 400 });
    }

    const parsed = parseJsonLenient<ArbProposal>(raw);
    if ((parsed as unknown as { parse_error?: unknown }).parse_error) {
      return NextResponse.json({ detail: `Could not structure the extracted content.` }, { status: 422 });
    }
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
