import { NextRequest, NextResponse } from "next/server";
import type { ArbResult } from "@/lib/enterprise-architecture/types";

const OVERRIDE_MAP: Record<string, string> = {
  override_approved: "APPROVED",
  override_conditional: "CONDITIONAL",
  override_rejected: "REJECTED",
};

/**
 * Mirrors POST /arb/signoff. The Python version persists the signoff
 * audit trail to Supabase; this console has no database, so the signoff
 * is returned to the caller to hold in session state (src/lib/enterprise-architecture/session.tsx)
 * instead of being written to a store.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const arbDecision: ArbResult = body.arb_decision ?? {};
    const architectName: string = (body.architect_name ?? "").trim();
    const archDecision: string = body.architect_decision ?? "accept";
    const architectNotes: string = (body.architect_notes ?? "").trim();
    const cioName: string = (body.cio_name ?? "").trim();
    const cioDecision: string = body.cio_decision ?? "";
    const cioNotes: string = (body.cio_notes ?? "").trim();
    const signedAt: string = body.signed_at ?? new Date().toISOString();

    const aiDecision = String(arbDecision.decision || "UNKNOWN").toUpperCase();
    let effectiveDecision = OVERRIDE_MAP[archDecision] ?? aiDecision;
    if (cioDecision === "rejected") effectiveDecision = "REJECTED";
    else if (cioDecision === "more_info") effectiveDecision = "PENDING_MORE_INFO";

    const signoff = {
      architect: { name: architectName, decision: archDecision, notes: architectNotes },
      cio: cioName ? { name: cioName, decision: cioDecision, notes: cioNotes } : null,
      effective_decision: effectiveDecision,
      ai_decision: aiDecision,
      signed_at: signedAt,
    };

    return NextResponse.json({ ...arbDecision, signoff, effective_decision: effectiveDecision });
  } catch (e) {
    return NextResponse.json({ detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
