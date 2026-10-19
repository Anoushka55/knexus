import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { applyScores, detectDups } from "@/lib/portfolio-rationalization/scoring";
import {
  extractJson,
  mergeTools,
  normalize,
  parseStructuredText,
} from "@/lib/portfolio-rationalization/normalize";
import {
  parseCsvBuffer,
  parseExcelBuffer,
  parseJsonBuffer,
  parsePdfBuffer,
  parsePptxBuffer,
} from "@/lib/portfolio-rationalization/parsers";
import { FILE_PARSE_PROMPT, IMAGE_PARSE_PROMPT } from "@/lib/portfolio-rationalization/prompts";
import type { Tool } from "@/lib/portfolio-rationalization/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-6";

async function aiParseChunk(text: string): Promise<Record<string, unknown>[]> {
  const resp = await anthropic.messages.create({
    model: MODEL,
    temperature: 0.1,
    max_tokens: 8000,
    messages: [{ role: "user", content: FILE_PARSE_PROMPT + text }],
  });
  const raw = resp.content[0].type === "text" ? resp.content[0].text : "";
  try {
    const data = extractJson(raw);
    if (Array.isArray(data)) return data as Record<string, unknown>[];
    if (data && typeof data === "object") {
      for (const v of Object.values(data as Record<string, unknown>)) {
        if (Array.isArray(v)) return v as Record<string, unknown>[];
      }
    }
    return [];
  } catch {
    return [];
  }
}

async function aiParseText(text: string): Promise<Record<string, unknown>[]> {
  const CHUNK = 7000;
  const OVERLAP = 500;
  if (text.length <= CHUNK) return aiParseChunk(text);
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK - OVERLAP) chunks.push(text.slice(i, i + CHUNK));
  const seen = new Set<string>();
  const results: Record<string, unknown>[] = [];
  for (const chunk of chunks) {
    const parsed = await aiParseChunk(chunk);
    for (const t of parsed) {
      const key = String(t.name || "").trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        results.push(t);
      }
    }
  }
  return results;
}

async function parseImageBuffer(buf: Buffer, mediaType: "image/jpeg" | "image/png"): Promise<Tool[]> {
  const b64 = buf.toString("base64");
  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    temperature: 0.1,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
          { type: "text", text: IMAGE_PARSE_PROMPT },
        ],
      },
    ],
  });
  const raw = resp.content[0].type === "text" ? resp.content[0].text : "";
  const m = raw.match(/\[[\s\S]*\]/);
  if (!m) return [];
  try {
    const arr = JSON.parse(m[0]) as Record<string, unknown>[];
    return arr.map((t) => normalize(t));
  } catch {
    return [];
  }
}

class IngestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseSingleFile(file: File): Promise<{ tools: Tool[]; detectedBudget: number | null }> {
  const ext = (file.name || "").toLowerCase().split(".").pop() || "";
  const buf = Buffer.from(await file.arrayBuffer());
  if (ext === "csv") return parseCsvBuffer(buf);
  if (ext === "xlsx" || ext === "xls") return parseExcelBuffer(buf);
  if (ext === "json") return { tools: parseJsonBuffer(buf).map((t) => normalize(t)), detectedBudget: null };
  if (ext === "pdf") {
    const raw = await parsePdfBuffer(buf);
    return { tools: raw ? (await aiParseText(raw)).map((t) => normalize(t)) : [], detectedBudget: null };
  }
  if (ext === "pptx" || ext === "ppt") {
    const raw = await parsePptxBuffer(buf);
    return { tools: raw ? (await aiParseText(raw)).map((t) => normalize(t)) : [], detectedBudget: null };
  }
  if (ext === "jpg" || ext === "jpeg") return { tools: await parseImageBuffer(buf, "image/jpeg"), detectedBudget: null };
  if (ext === "png") return { tools: await parseImageBuffer(buf, "image/png"), detectedBudget: null };
  throw new IngestError(400, `Unsupported file type: .${ext}. Supported: CSV, Excel, JSON, PDF, PPT/PPTX, JPG, PNG.`);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0 && !!f.name);
    const text = form.get("text") as string | null;

    let tools: Tool[] = [];
    let detectedBudget: number | null = null;

    if (files.length) {
      const errors: string[] = [];
      const results = await Promise.all(
        files.map(async (f) => {
          try {
            return await parseSingleFile(f);
          } catch (e) {
            errors.push(`${f.name}: ${e instanceof IngestError ? e.message : e instanceof Error ? e.message : String(e)}`);
            return { tools: [] as Tool[], detectedBudget: null };
          }
        }),
      );
      const allParsed = results.flatMap((r) => r.tools);
      for (const r of results) if (r.detectedBudget !== null) detectedBudget = r.detectedBudget;
      if (errors.length && !allParsed.length) {
        return NextResponse.json({ error: "All files failed to parse: " + errors.join("; ") }, { status: 400 });
      }
      tools = mergeTools(allParsed);
    } else if (text && text.trim()) {
      const direct = parseStructuredText(text);
      if (direct.length) {
        tools = direct.map((t) => normalize(t));
      } else {
        tools = (await aiParseText(text)).map((t) => normalize(t));
      }
    } else {
      return NextResponse.json({ error: "No file or text provided." }, { status: 400 });
    }

    tools = applyScores(tools);
    if (!tools.length) {
      return NextResponse.json(
        { error: "No tools found in the uploaded data. Check that your file has a header row and tool names." },
        { status: 400 },
      );
    }

    const dups = detectDups(tools);
    const totalCost = tools.reduce((a, t) => a + (t.annual_cost || 0), 0);

    const explicitPain = tools.map((t) => t.pain_points).filter(Boolean) as string[];
    const autoPain: string[] = [];
    const eolTools = tools.filter((t) => t.end_of_life).map((t) => t.name);
    if (eolTools.length) autoPain.push(`End-of-life / deprecated tools requiring urgent retirement: ${eolTools.slice(0, 4).join(", ")}`);
    const highRisk = tools.filter((t) => (t.scores?.risk_score ?? 0) >= 7).map((t) => t.name);
    if (highRisk.length) autoPain.push(`High-risk tools with security or compliance exposure: ${highRisk.slice(0, 4).join(", ")}`);
    const retireReplace = tools.filter((t) => t.rationalization_action === "Retire" || t.rationalization_action === "Replace");
    if (retireReplace.length)
      autoPain.push(`${retireReplace.length} tools recommended for Retire/Replace: ${retireReplace.slice(0, 4).map((t) => t.name).join(", ")}`);
    if (dups.length) {
      const pot = dups.reduce((a, d) => a + d.potential_annual_savings, 0);
      autoPain.push(`${dups.length} overlapping tool pairs detected — consolidation opportunity ~$${pot.toLocaleString()}/yr savings`);
    }
    const lowAdopt = tools.filter((t) => (t.scores?.adoption_rate ?? 5) < 3 && (t.annual_cost || 0) > 0).map((t) => t.name);
    if (lowAdopt.length) autoPain.push(`Low-adoption high-cost tools: ${lowAdopt.slice(0, 3).join(", ")}`);

    const seen = new Set(explicitPain);
    const painPoints = [...explicitPain];
    for (const p of autoPain) {
      if (!seen.has(p)) {
        painPoints.push(p);
        seen.add(p);
      }
    }

    return NextResponse.json({
      tools,
      duplications: dups,
      pain_points: painPoints,
      detected_budget: detectedBudget,
      summary: {
        total_tools: tools.length,
        total_annual_cost: totalCost,
        duplications_found: dups.length,
        potential_savings: dups.reduce((a, d) => a + d.potential_annual_savings, 0),
      },
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "authentication_error: invalid x-api-key — set a valid ANTHROPIC_API_KEY." },
        { status: 401 },
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Ingest failed: ${msg}` }, { status: 500 });
  }
}
