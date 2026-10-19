"use client";

import { useState } from "react";
import { Blocks, Sparkles } from "lucide-react";
import { agentQuery } from "@/lib/enterprise-architecture/client";
import { useSession } from "@/lib/enterprise-architecture/session";
import { Card, Pill, Spinner, EmptyState } from "@/components/enterprise-architecture/primitives";
import type { AgentQueryResponse } from "@/lib/enterprise-architecture/types";

const AGENTS = [
  { id: "ARB", desc: "Architecture Review Board — governance decisions" },
  { id: "TIME", desc: "Portfolio Rationalization — 6R scoring" },
  { id: "MAPPING", desc: "Dependency Analysis — coupling & impact" },
  { id: "MATURITY", desc: "EA Maturity — KPMG 4-pillar assessment" },
  { id: "INSIGHTS", desc: "Executive Synthesis — C-suite summary" },
];

export default function AgentsPage() {
  const { timeResult } = useSession();
  const [query, setQuery] = useState("");
  const [override, setOverride] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AgentQueryResponse | null>(null);

  async function run() {
    if (!query.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await agentQuery({
        query,
        data: timeResult ? { applications: timeResult.applications, industry: "" } : {},
        agent_override: override || undefined,
      });
      setResponse(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">AI Agents</h1>
        <p className="text-sm text-muted-foreground">
          Ask a free-text question — the orchestrator routes it to the right agent (or a multi-agent
          chain), the same way <code>/ea-agent</code> did in the source platform.
        </p>
      </div>

      <Card title="Agent Catalogue">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {AGENTS.map((a) => (
            <button
              key={a.id}
              onClick={() => setOverride(override === a.id ? "" : a.id)}
              className={`text-left border rounded-ea-sm p-2.5 text-xs transition-colors ${
                override === a.id ? "border-navy bg-navy/5" : "border-border hover:border-navy/50"
              }`}
            >
              <div className="font-bold text-navy mb-0.5">{a.id}</div>
              <div className="text-muted-foreground leading-snug">{a.desc}</div>
            </button>
          ))}
        </div>
        {override && (
          <div className="mt-2 text-xs text-muted-foreground">
            Forcing agent: <Pill tone="navy">{override}</Pill>{" "}
            <button onClick={() => setOverride("")} className="underline ml-1">
              clear
            </button>
          </div>
        )}
      </Card>

      <Card title="Ask a question">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="e.g. What are our top portfolio risks and quick wins?"
            className="flex-1 h-10 px-3 border border-border rounded-ea-sm text-sm bg-background"
          />
          <button
            onClick={run}
            disabled={busy || !query.trim()}
            className="inline-flex items-center gap-2 h-10 px-4 bg-navy text-white rounded-ea-sm text-sm disabled:opacity-50"
          >
            {busy ? <Spinner /> : <Sparkles className="w-4 h-4" />} Ask
          </button>
        </div>
        {error && <div className="mt-2 text-xs text-crimson">{error}</div>}
      </Card>

      {response && (
        <Card title={`Response — ${response.agent_used}`} subtitle={`Chain: ${response.agents_chain.join(" → ")}`}>
          <pre className="text-xs bg-background border border-border rounded-ea-sm p-3 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(response.result, null, 2)}
          </pre>
        </Card>
      )}

      {!response && !busy && (
        <Card>
          <EmptyState icon={<Blocks className="w-10 h-10" />} title="No query run yet" body="Ask a question above, or pin a specific agent to force it to run regardless of routing." />
        </Card>
      )}
    </div>
  );
}
