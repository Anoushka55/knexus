import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithHistory } from "@/lib/enterprise-architecture/claude";
import { EA_CHAT_PROMPT } from "@/lib/enterprise-architecture/prompts";

/** Mirrors POST /chat — the EA Intelligence floating assistant. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages;
    if (!messages || !Array.isArray(messages) || !messages.length) {
      return NextResponse.json({ detail: "messages required" }, { status: 400 });
    }
    const response = await callClaudeWithHistory(EA_CHAT_PROMPT, messages);
    return NextResponse.json({ response });
  } catch (e) {
    return NextResponse.json({ detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
