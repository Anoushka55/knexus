import { NextRequest, NextResponse } from "next/server";
import { runCompliance } from "@/lib/enterprise-architecture/agents/compliance";

/** Mirrors POST /compliance/check: regulatory gap analysis for selected regulations. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await runCompliance(body);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ detail: `Compliance check failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
}
