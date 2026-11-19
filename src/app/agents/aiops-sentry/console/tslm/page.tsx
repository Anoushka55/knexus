"use client";

import Link from "next/link";
import { ArrowRight, Database, ExternalLink, Network, Route as RouteIcon, ScanSearch, Share2, Upload } from "lucide-react";
import { Card } from "@/components/aiops/primitives";

/**
 * Where "Open TSLM" goes. The site opens on its Home tab; to land straight on
 * the knowledge graph, replace this with the KG Explorer address.
 */
const TSLM_URL = "https://kslm.space/";

const BASE = "/agents/aiops-sentry/console";

const FLOW = [
  { icon: Upload, title: "Ingest", desc: "Operational and customer data is loaded in" },
  { icon: Database, title: "Ontology", desc: "Gives it structure: what things exist and how they relate" },
  { icon: Share2, title: "Knowledge graph", desc: "Links services, events, customers and assets together" },
  { icon: ScanSearch, title: "Graph search", desc: "Follows those links to find causes, with cited evidence" },
];

const POWERS = [
  {
    tab: "Event Correlation Explorer",
    href: `${BASE}/correlation`,
    icon: Network,
    what: "Turning many separate alerts into one problem",
    how: "The graph knows which events belong to the same service, site or asset, so related signals are joined instead of staying as noise.",
  },
  {
    tab: "Service Journeys",
    href: `${BASE}/journeys`,
    icon: RouteIcon,
    what: "Mapping a customer-facing service down to the components carrying it",
    how: "The graph holds the dependencies between services, so the path from business service to failing component can be traced.",
  },
  {
    tab: "Problems & Incidents",
    href: `${BASE}/problems`,
    icon: ScanSearch,
    what: "Naming the probable root cause",
    how: "Searching the graph from the symptom back toward its likely cause produces an answer that points to the data it came from.",
  },
];

export default function TslmPage() {
  return (
    <div className="p-5 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-navy">TSLM: the intelligence backbone</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Telecom Intelligence Center: the knowledge-graph engine that powers event correlation, service mapping and root cause
          in this console.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="p-5 flex flex-wrap items-center justify-between gap-4 bg-background">
          <div className="max-w-xl">
            <div className="text-sm font-semibold text-foreground">See the engine behind AI Operations</div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              This console shows what the AI concludes. TSLM is where it works that out: a graph of how everything connects,
              searched to find causes. Open it to explore the graph directly.
            </p>
          </div>
          <a
            href={TSLM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-aiops-md bg-navy text-navy-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Open TSLM <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </Card>

      <Card title="How it works" subtitle="From raw data to an explained answer">
        <ol className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          {FLOW.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="relative rounded-aiops-md border border-border bg-background p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-7 h-7 rounded-md bg-surface border border-border flex items-center justify-center text-navy">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground">STEP {i + 1}</span>
                </div>
                <div className="text-sm font-semibold text-foreground">{s.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</div>
              </li>
            );
          })}
        </ol>
      </Card>

      <Card title="What it powers here" subtitle="Where you see TSLM's work in this console">
        <ul className="divide-y divide-border">
          {POWERS.map((p) => {
            const Icon = p.icon;
            return (
              <li key={p.tab} className="p-4 flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3 min-w-0 max-w-2xl">
                  <span className="mt-0.5 w-8 h-8 shrink-0 rounded-md bg-background border border-border flex items-center justify-center text-navy">
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{p.what}</div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{p.how}</p>
                  </div>
                </div>
                <Link href={p.href} className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline shrink-0">
                  {p.tab} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Once you open it" subtitle="A quick guide to the tabs along the bottom">
        <dl className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-3 text-sm">
          {[
            ["KG Explorer", "Start here. Browse the knowledge graph itself and see how things connect."],
            ["Ontology", "The model behind the graph: the kinds of things it holds and how they relate."],
            ["Ingestion", "How data gets into the graph."],
            ["Customer 360", "Everything the graph holds about one customer: billing, complaints, service disruptions."],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="font-semibold text-foreground">{k}</dt>
              <dd className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Note: the TSLM demo data is built around customers and billing, while this console shows network events. It is the same
        engine working on different data, so the screens will not match one for one.
      </p>
    </div>
  );
}
