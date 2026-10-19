"use client";

import Link from "next/link";
import { ListTree, ShieldCheck, Network, Gauge, ArrowRight, Sparkles } from "lucide-react";
import { useSession } from "@/lib/enterprise-architecture/session";
import { Card, Pill, StatTile } from "@/components/enterprise-architecture/primitives";

const BASE = "/agents/enterprise-architecture-agent/console";

export default function OverviewPage() {
  const { timeResult, arbResult, mappingResult, maturityResult, insightsResult } = useSession();

  const steps = [
    {
      href: `${BASE}/analysis`,
      icon: ListTree,
      title: "Step 1 — EA Analysis",
      desc: "Upload your application inventory and run portfolio rationalization (TIME / 6R).",
      done: !!timeResult,
      stat: timeResult ? `${timeResult.applications.length} apps scored` : "Not started",
    },
    {
      href: `${BASE}/arb`,
      icon: ShieldCheck,
      title: "Step 2 — ARB Governance",
      desc: "Submit flagged applications for Architecture Review Board approval.",
      done: !!arbResult,
      stat: arbResult ? `Decision: ${arbResult.decision}` : "Not started",
    },
    {
      href: `${BASE}/mapping`,
      icon: Network,
      title: "Step 3 — Dependency Mapping",
      desc: "Analyse upstream/downstream dependencies and regulatory compliance for flagged apps.",
      done: !!mappingResult,
      stat: mappingResult ? (mappingResult.skipped ? "Skipped" : `Impact: ${mappingResult.overall_impact_level}`) : "Not started",
    },
    {
      href: `${BASE}/maturity`,
      icon: Gauge,
      title: "Step 4 — Maturity Assessment",
      desc: "Complete the 30-question EA Maturity questionnaire and run the KPMG 4-pillar assessment.",
      done: !!maturityResult,
      stat: maturityResult ? `${maturityResult.overall_maturity_score}/5 (${maturityResult.overall_band})` : "Not started",
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-navy">Enterprise Lifecycle Hub</h1>
        <Link
          href={`${BASE}/command-center`}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-navy text-white rounded-ea-sm text-sm font-medium hover:opacity-90"
        >
          <Sparkles className="w-4 h-4" /> Run Full Pipeline
        </Link>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Multi-agent Enterprise Architecture AI platform — ARB, Portfolio Rationalization (TIME), Dependency
        Mapping, Maturity Assessment, and Executive Insights.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-card-hover">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-ea-sm bg-navy/5 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                      <Pill tone={s.done ? "success" : "muted"}>{s.done ? "Done" : "Pending"}</Pill>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs font-medium text-navy">{s.stat}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-navy transition-colors" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatTile label="Applications assessed" value={timeResult?.applications.length ?? 0} />
        <StatTile
          label="Potential savings"
          value={`$${(timeResult?.portfolio_summary.potential_savings ?? 0).toLocaleString()}`}
          tone="success"
        />
        <StatTile label="Maturity score" value={maturityResult ? `${maturityResult.overall_maturity_score}/5` : "—"} />
        <StatTile
          label="Overall risk"
          value={insightsResult?.risk_profile?.overall_risk ?? "—"}
          tone={insightsResult?.risk_profile?.overall_risk === "CRITICAL" ? "crimson" : "default"}
        />
      </div>

      <Card title="Platform Agents">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <AgentBlurb name="ARB" desc="Architecture Review Board — governance decisions, anti-pattern detection." />
          <AgentBlurb name="TIME" desc="Portfolio Rationalization — 6R actions, scoring, duplication detection." />
          <AgentBlurb name="MAPPING" desc="Dependency Analysis — coupling, SPOFs, migration sequencing." />
          <AgentBlurb name="MATURITY" desc="EA Maturity — KPMG 4-pillar / 8-dimension assessment." />
          <AgentBlurb name="INSIGHTS" desc="Executive Synthesis — C-suite summary, KPIs, quick wins." />
        </div>
      </Card>
    </div>
  );
}

function AgentBlurb({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="border border-border rounded-ea-sm p-3">
      <div className="text-[11px] font-bold text-navy mb-1">{name}</div>
      <div className="text-muted-foreground leading-snug">{desc}</div>
    </div>
  );
}
