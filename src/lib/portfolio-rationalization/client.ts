"use client";

/**
 * Thin fetch wrappers around the /api/portfolio-rationalization/* route
 * handlers — the client-side equivalent of calling the Python FastAPI
 * endpoints (/api/ingest, /api/assess, /api/chat, /api/report).
 */
import type { Assessment, ChatMessage, Duplication, IngestResult, Tool } from "./types";
import type { ChatContext } from "./prompts";

const BASE = "/api/portfolio-rationalization";

async function asJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function ingestFiles(files: File[]): Promise<IngestResult> {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  const res = await fetch(`${BASE}/ingest`, { method: "POST", body: form });
  return asJson<IngestResult>(res);
}

export async function ingestText(text: string): Promise<IngestResult> {
  const form = new FormData();
  form.append("text", text);
  const res = await fetch(`${BASE}/ingest`, { method: "POST", body: form });
  return asJson<IngestResult>(res);
}

export async function runAssessment(
  tools: Tool[],
  duplications: Duplication[],
  industry: string,
  focus?: string,
): Promise<Assessment> {
  const res = await fetch(`${BASE}/assess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tools, duplications, industry, focus }),
  });
  return asJson<Assessment>(res);
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  tools: Tool[],
  context?: ChatContext,
): Promise<string> {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, tools, context }),
  });
  const data = await asJson<{ reply: string }>(res);
  return data.reply;
}

export async function buildReport(
  tools: Tool[],
  duplications: Duplication[],
  assessment: Assessment,
  chatContext?: string | null,
): Promise<string> {
  const res = await fetch(`${BASE}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tools, duplications, assessment, chat_context: chatContext }),
  });
  const data = await asJson<{ html: string }>(res);
  return data.html;
}
