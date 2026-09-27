import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { NarrativeFacts } from "@/lib/assessments/narrative";

/**
 * Rewrites an already-computed result as a short executive read.
 *
 * Two rules this route exists to enforce:
 *   1. It receives computed numbers and labels only — never raw answers — so
 *      the model cannot be the source of any figure on the page.
 *   2. It always returns HTTP 200, following /api/search. A narrative is a
 *      nicety; the scorecard behind it is complete without one, and a failed
 *      call must never surface as an error on a client-facing result.
 */

const MODEL = "claude-haiku-4-5-20251001";

export async function POST(req: Request) {
  try {
    const { facts } = (await req.json()) as { facts?: NarrativeFacts };
    if (!facts || !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ narrative: null });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 320,
      system:
        "You write the executive read at the top of a capability-maturity scorecard for a telecom operator. " +
        "You are given the computed result as JSON. Write three to four sentences of continuous prose, no headings, no bullets, no markdown. " +
        "Lead with what the numbers mean rather than restating them. Name the binding constraint and say what it blocks. " +
        "Use only figures present in the JSON — never invent, round differently, or infer a number. " +
        "Do not use the words 'leverage', 'journey', 'robust' or 'exciting'. Write plainly, as a partner would to a client who is paying attention.",
      messages: [{ role: "user", content: JSON.stringify(facts) }],
    });

    const block = response.content[0];
    const narrative = block?.type === "text" ? block.text.trim() : null;

    return NextResponse.json({ narrative: narrative || null });
  } catch {
    // Degrade to the deterministic template rather than failing the page.
    return NextResponse.json({ narrative: null });
  }
}
