import { NextRequest, NextResponse } from "next/server";
import { runTime } from "@/lib/enterprise-architecture/agents/time";

/** Mirrors POST /time/full: score + Claude TIME narrative in one call. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await runTime(body);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
