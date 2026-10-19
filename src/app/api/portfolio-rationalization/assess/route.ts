import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { extractJson } from "@/lib/portfolio-rationalization/normalize";
import { SYSTEM_PROMPT, buildAssessPrompt } from "@/lib/portfolio-rationalization/prompts";
import type { Assessment, Duplication, Tool } from "@/lib/portfolio-rationalization/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-6";

function regexSection(raw: string, key: string): string {
  const m = raw.match(new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "s"));
  return m ? m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') : "";
}

async function aiAssess(tools: Tool[], dups: Duplication[], industry: string, focus: string): Promise<Assessment> {
  const prompt = buildAssessPrompt(tools, dups, industry, focus);
  const resp = await anthropic.messages.create({
    model: MODEL,
    temperature: 0.2,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = resp.content[0].type === "text" ? resp.content[0].text : "";
  try {
    return extractJson(raw) as Assessment;
  } catch {
    const eco = regexSection(raw, "tool_ecosystem");
    const ovlp = regexSection(raw, "overlapping_tools");
    const bench = regexSection(raw, "benchmarking");
    const kpis = regexSection(raw, "kpis_success_factors");
    const rec = regexSection(raw, "recommendations");
    const road = regexSection(raw, "rollout_roadmap");
    const pAsis = regexSection(raw, "as_is_assessment");
    const pGov = regexSection(raw, "governance_framework");
    const pStd = regexSection(raw, "tools_standardization");
    if (eco || ovlp) {
      return {
        executive_summary: {
          tool_ecosystem: eco || "See full assessment.",
          overlapping_tools: ovlp,
          benchmarking: bench,
          kpis_success_factors: kpis,
          recommendations: rec,
          rollout_roadmap: road,
        },
        three_pillars: { as_is_assessment: pAsis, governance_framework: pGov, tools_standardization: pStd },
      };
    }
    return {
      executive_summary: {
        tool_ecosystem: raw.slice(0, 1000),
        overlapping_tools: "",
        benchmarking: "",
        kpis_success_factors: "",
        recommendations: "",
        rollout_roadmap: "",
      },
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tools: Tool[] = body.tools || [];
    const duplications: Duplication[] = body.duplications || [];
    const industry: string = body.industry || "telecom";
    const focus: string = body.focus || "";

    if (!tools.length) {
      return NextResponse.json({ error: "No tools provided." }, { status: 400 });
    }

    const result = await aiAssess(tools, duplications, industry, focus);
    return NextResponse.json(result);
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
    return NextResponse.json({ error: `Assessment failed: ${msg}` }, { status: 500 });
  }
}
