"use client";

import { ArrowRight } from "lucide-react";
import { Card, Pill } from "@/components/enterprise-architecture/primitives";

export default function ArchitecturePage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">EA Intelligence Architecture</h1>
        <p className="text-sm text-muted-foreground">
          How the platform&apos;s layers and agents fit together, end to end.
        </p>
      </div>

      <Card title="Platform Layer Flow">
        <FlowRow
          steps={[
            "Console (Next.js pages)",
            "API routes (/api/enterprise-architecture/*)",
            "Agent logic (lib/enterprise-architecture/agents/*)",
            "Claude (Anthropic API)",
          ]}
        />
        <p className="text-xs text-muted-foreground mt-3">
          Each console page calls a typed client wrapper (<code>lib/enterprise-architecture/client.ts</code>),
          which posts to a same-origin API route. The route runs the matching agent module server-side —
          deterministic scoring and duplication detection run in plain TypeScript; everything that needs
          judgement calls the Claude API with the same system prompt the source Python agent used.
        </p>
      </Card>

      <Card title="Multi-Agent Orchestration Model">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <AgentBox name="ARB" role="Governance" desc="Evaluates proposals, detects anti-patterns, returns a decision." />
          <AgentBox name="TIME" role="Rationalization" desc="Scores apps 0-10 across 7 dimensions, assigns a 6R action." />
          <AgentBox name="MAPPING" role="Dependency Analysis" desc="Coupling, SPOFs, migration sequencing for flagged apps." />
          <AgentBox name="MATURITY" role="Capability Assessment" desc="KPMG 4-pillar / 8-dimension EA maturity scoring." />
          <AgentBox name="INSIGHTS" role="Executive Synthesis" desc="Aggregates every other agent into a C-suite summary." />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          A free-text query is routed to one agent, or to a chain of agents (<Pill tone="blue">MULTI</Pill>) when
          it needs more than one. INSIGHTS almost always runs last because it synthesises everyone else&apos;s output.
        </p>
      </Card>

      <Card title="Full Pipeline Execution Flow">
        <div className="space-y-3">
          <PipelineStage
            n={1}
            title="TIME — Portfolio Rationalization"
            desc="Normalize the uploaded inventory, score every tool, detect duplications, generate an executive narrative."
          />
          <PipelineStage
            n={2}
            title="ARB — Governance Gate"
            desc="Auto-build a proposal from the applications flagged for action; get an APPROVE / REJECT / CONDITIONAL decision."
          />
          <PipelineStage
            n={3}
            title="MAPPING + COMPLIANCE"
            desc="Dependency / impact analysis for flagged apps, plus an optional regulatory gap analysis against selected regulations."
          />
          <PipelineStage
            n={4}
            title="MATURITY — EA Capability Assessment"
            desc="30-question questionnaire results (if available) anchor the KPMG 4-pillar / 8-dimension scoring."
          />
          <PipelineStage
            n={5}
            title="INSIGHTS — Executive Synthesis"
            desc="All four prior stages are aggregated into financial impact, risk profile, recommendations and KPIs."
          />
          <PipelineStage n={6} title="Report" desc="A printable HTML report is generated from the full pipeline output." last />
        </div>
      </Card>
    </div>
  );
}

function FlowRow({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className="border border-border rounded-ea-sm px-3 py-2 text-xs font-medium bg-background">{s}</div>
          {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        </div>
      ))}
    </div>
  );
}

function AgentBox({ name, role, desc }: { name: string; role: string; desc: string }) {
  return (
    <div className="border border-border rounded-ea-sm p-3">
      <div className="text-xs font-bold text-navy">{name}</div>
      <div className="text-[11px] font-medium text-muted-foreground mb-1">{role}</div>
      <div className="text-[11px] text-foreground leading-snug">{desc}</div>
    </div>
  );
}

function PipelineStage({ n, title, desc, last }: { n: number; title: string; desc: string; last?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
          {n}
        </div>
        {!last && <div className="w-px flex-1 bg-border mt-1" />}
      </div>
      <div className="pb-3">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}
