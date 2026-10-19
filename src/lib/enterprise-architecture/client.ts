"use client";

/**
 * Typed fetch wrappers for the Enterprise Architecture API routes
 * (src/app/api/enterprise-architecture/*). Mirrors the fetch() calls the
 * original frontend/index.html made to the FastAPI backend (/time/ingest,
 * /arb/evaluate, /mapping/analyse, etc.) — same endpoints, same payload
 * shapes, now same-origin Next.js routes instead of a separate Python
 * server.
 */
import type {
  AgentQueryResponse,
  Application,
  ArbProposal,
  ArbResult,
  ArbSignoff,
  AssessmentResultsPayload,
  ComplianceResult,
  Duplication,
  MappingResult,
  MaturityResult,
  PipelineResult,
  TimeResult,
} from "./types";

const BASE = "/api/enterprise-architecture";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${path} failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

// ── TIME / Portfolio Rationalization ──

export interface TimeIngestResponse {
  success: boolean;
  tools_scored: number;
  applications: Application[];
  duplications: Duplication[];
  summary: {
    total_apps: number;
    total_annual_cost: number;
    duplications_found: number;
    potential_savings: number;
    action_breakdown: Record<string, number>;
  };
}

export function timeIngest(body: {
  applications?: Record<string, unknown>[];
  free_text?: string;
  image?: { data: string; media_type: string };
}): Promise<TimeIngestResponse> {
  return postJson("/time/ingest", body);
}

export function timeFull(body: {
  applications?: Application[];
  free_text?: string;
  industry?: string;
  sub_sector?: string;
}): Promise<TimeResult> {
  return postJson("/time/full", body);
}

// ── ARB Governance ──

export function arbIngest(body: {
  free_text?: string;
  image?: { data: string; media_type: string };
}): Promise<ArbProposal> {
  return postJson("/arb/ingest", body);
}

export function arbEvaluate(body: {
  applications: Application[];
  ea_context?: Record<string, unknown>;
  rationalization_summary?: Record<string, unknown>;
  proposal_title?: string;
  business_case?: string;
  timeline?: string;
}): Promise<
  ArbResult & { proposal: ArbProposal; flagged_count: number; total_apps: number }
> {
  return postJson("/arb/evaluate", body);
}

export function arbSignoff(body: {
  arb_decision: ArbResult;
  architect_name?: string;
  architect_decision?: string;
  architect_notes?: string;
  cio_name?: string;
  cio_decision?: string;
  cio_notes?: string;
}): Promise<ArbResult & { signoff: ArbSignoff; effective_decision: string }> {
  return postJson("/arb/signoff", body);
}

// ── Mapping + Compliance ──

export function mappingAnalyse(body: {
  applications: Application[];
  arb_result?: ArbResult | null;
  ea_context?: Record<string, unknown>;
  mapping_context?: Record<string, unknown>;
}): Promise<MappingResult> {
  return postJson("/mapping/analyse", body);
}

export function complianceCheck(body: {
  applications: Application[];
  regulations: string[];
  mapping_output?: MappingResult | null;
  industry?: string;
  sub_sector?: string;
  governance?: string;
  additional_context?: string;
}): Promise<ComplianceResult> {
  return postJson("/compliance/check", body);
}

// ── Full pipeline / wizard ──

export function eaFull(body: Record<string, unknown>): Promise<PipelineResult> {
  return postJson("/ea-full", body);
}

export function eaPipelineStep(body: {
  time_result: TimeResult;
  mapping_result?: MappingResult | null;
  compliance_result?: ComplianceResult | null;
  assessment_results?: AssessmentResultsPayload | null;
  arb_result?: ArbResult | null;
  industry?: string;
  sub_sector?: string;
  governance?: string;
  ea_framework?: string;
  ea_tools?: string;
  cloud_strategy?: string;
  additional_context?: string;
}): Promise<PipelineResult> {
  return postJson("/ea-pipeline/step", body);
}

// ── Chat + general agent query ──

export function chat(messages: Array<{ role: "user" | "assistant"; content: string }>): Promise<{ response: string }> {
  return postJson("/chat", { messages });
}

export function agentQuery(body: { query: string; data?: Record<string, unknown>; agent_override?: string }): Promise<AgentQueryResponse> {
  return postJson("", body);
}
