"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useSession } from "@/lib/enterprise-architecture/session";
import { Card, Pill } from "@/components/enterprise-architecture/primitives";

export default function SettingsPage() {
  const { resetPipeline } = useSession();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Settings</h1>
        <p className="text-sm text-muted-foreground">Session state and platform information.</p>
      </div>

      <Card title="API Configuration">
        <div className="space-y-2 text-sm">
          <Row k="Model" v="claude-sonnet-4-6" />
          <Row k="Provider" v="Anthropic (server-side, via @anthropic-ai/sdk)" />
          <Row k="Routes" v="/api/enterprise-architecture/*" />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          All Claude calls run server-side in Next.js API routes using <code>ANTHROPIC_API_KEY</code> from the
          environment. No API key or portfolio data is ever sent anywhere except this app&apos;s own server.
        </p>
      </Card>

      <Card title="Session">
        <p className="text-xs text-muted-foreground mb-3">
          Clears every result from the current pipeline run (TIME, ARB, MAPPING, COMPLIANCE, MATURITY,
          INSIGHTS) and all context fields. Saved reports and the maturity questionnaire session are kept.
        </p>
        {!confirmOpen ? (
          <button
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-3.5 border border-crimson text-crimson rounded-ea-sm text-sm hover:bg-crimson/5"
          >
            <RotateCcw className="w-4 h-4" /> Reset Pipeline
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                resetPipeline();
                setConfirmOpen(false);
              }}
              className="h-9 px-3.5 bg-crimson text-white rounded-ea-sm text-sm"
            >
              Confirm reset
            </button>
            <button onClick={() => setConfirmOpen(false)} className="h-9 px-3.5 border border-border rounded-ea-sm text-sm">
              Cancel
            </button>
          </div>
        )}
      </Card>

      <Card title="About">
        <p className="text-sm leading-relaxed">
          EA Intelligence is a multi-agent Enterprise Architecture platform: ARB governance, portfolio
          rationalization (TIME / 6R), dependency mapping, EA maturity assessment, and executive insights —
          ported into the K-Nexus marketplace as a fully internal console.
        </p>
        <div className="mt-3 flex gap-1.5">
          <Pill tone="blue">ARB</Pill>
          <Pill tone="blue">TIME</Pill>
          <Pill tone="blue">MAPPING</Pill>
          <Pill tone="blue">MATURITY</Pill>
          <Pill tone="blue">INSIGHTS</Pill>
        </div>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono text-xs">{v}</span>
    </div>
  );
}
