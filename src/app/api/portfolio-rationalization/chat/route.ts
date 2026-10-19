import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { buildChatSystemPrompt, type ChatContext } from "@/lib/portfolio-rationalization/prompts";
import type { ChatMessage, Tool } from "@/lib/portfolio-rationalization/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-6";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: string = body.message || "";
    const history: ChatMessage[] = body.history || [];
    const tools: Tool[] = body.tools || [];
    const context: ChatContext | undefined = body.context;

    if (!message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const system = buildChatSystemPrompt(tools, context);
    const msgs = history
      .slice(-20)
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));
    msgs.push({ role: "user", content: message });

    const resp = await anthropic.messages.create({
      model: MODEL,
      system,
      messages: msgs,
      max_tokens: 2000,
      temperature: 0.2,
    });
    const reply = resp.content[0].type === "text" ? resp.content[0].text : "";
    return NextResponse.json({ reply });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "authentication_error: invalid x-api-key — set a valid ANTHROPIC_API_KEY." },
        { status: 401 },
      );
    }
    if (err instanceof Anthropic.APIError && String(err.message).toLowerCase().includes("credit balance")) {
      return NextResponse.json(
        { error: "Anthropic account is out of credits. Add credits in Anthropic Console → Plans & Billing." },
        { status: 402 },
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Chat failed: ${msg}` }, { status: 500 });
  }
}
