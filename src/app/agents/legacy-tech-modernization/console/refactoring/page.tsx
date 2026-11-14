"use client";

import { Check, Code2, GitPullRequest, Play, RotateCcw, Sparkles, X } from "lucide-react";
import { useState } from "react";

import {
  Dot,
  InsightBar,
  KpiCard,
  PageHeader,
  Panel,
  PanelLink,
  ProgressBar,
  StatusPill,
  type Tone,
} from "@/lib/legacy-modernization/primitives";
import { cn } from "@/lib/utils";

const pipeline = [
  { stage: "Analyze", count: 42, tone: "brand" as Tone, pct: 100 },
  { stage: "Generate", count: 28, tone: "intel" as Tone, pct: 82 },
  { stage: "Review", count: 16, tone: "warning" as Tone, pct: 54 },
  { stage: "Test", count: 11, tone: "success" as Tone, pct: 38 },
  { stage: "Merge", count: 96, tone: "success" as Tone, pct: 100 },
];

const diffs = [
  {
    id: "TR-4821",
    title: "Java 8 → Java 17 modernization",
    file: "billing-core/src/main/java/InvoiceProcessor.java",
    confidence: 96,
    before: [
      "public class InvoiceProcessor {",
      "  private static final Logger log =",
      "    Logger.getLogger(InvoiceProcessor.class);",
      "",
      "  public List<Invoice> process(List<Order> orders) {",
      "    List<Invoice> result = new ArrayList<Invoice>();",
      "    for (Order o : orders) {",
      "      if (o.getStatus().equals(\"OPEN\")) {",
      "        result.add(convert(o));",
      "      }",
      "    }",
      "    return result;",
      "  }",
      "}",
    ],
    after: [
      "public class InvoiceProcessor {",
      "  private static final Logger log =",
      "    LoggerFactory.getLogger(InvoiceProcessor.class);",
      "",
      "  public List<Invoice> process(List<Order> orders) {",
      "    return orders.stream()",
      "      .filter(o -> \"OPEN\".equals(o.status()))",
      "      .map(this::convert)",
      "      .toList();",
      "  }",
      "}",
    ],
  },
  {
    id: "TR-4822",
    title: "Replace deprecated Oracle JDBC driver",
    file: "billing-core/src/main/java/db/ConnectionFactory.java",
    confidence: 91,
    before: [
      "Class.forName(\"oracle.jdbc.driver.OracleDriver\");",
      "Connection c = DriverManager.getConnection(url, u, p);",
      "c.setAutoCommit(false);",
    ],
    after: [
      "HikariConfig cfg = new HikariConfig();",
      "cfg.setJdbcUrl(url);",
      "cfg.setMaximumPoolSize(24);",
      "Connection c = dataSource.getConnection();",
    ],
  },
  {
    id: "TR-4823",
    title: "Extract dunning rules into domain service",
    file: "billing-core/src/main/java/DunningRules.java",
    confidence: 84,
    before: [
      "if (acct.daysPastDue > 30 && acct.balance > 100) {",
      "  sendNotice(acct, \"L1\");",
      "} else if (acct.daysPastDue > 60) {",
      "  sendNotice(acct, \"L2\");",
      "}",
    ],
    after: [
      "dunningPolicy.evaluate(account)",
      "  .ifPresent(notice -> noticeSender.send(account, notice));",
    ],
  },
];

const recommendations = [
  { title: "Migrate 214 JUnit 4 tests to JUnit 5", impact: "Unlocks parallel test execution", confidence: 94, effort: "Low", tone: "success" as Tone },
  { title: "Replace WebLogic JMS with Kafka producers", impact: "Removes app-server lock-in for 9 services", confidence: 88, effort: "Medium", tone: "brand" as Tone },
  { title: "Introduce hexagonal ports for billing domain", impact: "Enables Oracle → PostgreSQL swap", confidence: 82, effort: "High", tone: "intel" as Tone },
  { title: "Deduplicate 31 copies of tax calculation", impact: "Removes 12.4K duplicated lines", confidence: 90, effort: "Medium", tone: "warning" as Tone },
];

const recent = [
  { id: "TR-4818", change: "Payments Gateway upgraded to Java 17", author: "AI Agent · reviewed by M. Chen", status: "Merged", time: "2 hrs ago", tone: "success" as Tone },
  { id: "TR-4817", change: "Null-safety annotations added to CRM DTOs", author: "AI Agent · reviewed by S. Patel", status: "Merged", time: "5 hrs ago", tone: "success" as Tone },
  { id: "TR-4816", change: "Batch scheduler rewritten to Quartz 2.5", author: "AI Agent", status: "In Review", time: "8 hrs ago", tone: "warning" as Tone },
  { id: "TR-4814", change: "Legacy SOAP client replaced with REST façade", author: "AI Agent · reviewed by L. Novak", status: "Rejected", time: "1 day ago", tone: "danger" as Tone },
];

function DiffColumn({ lines, variant }: { lines: string[]; variant: "before" | "after" }) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-lg border">
      <div
        className={cn(
          "border-b px-3 py-1.5 text-[11px] font-semibold",
          variant === "before" ? "bg-danger-soft text-danger" : "bg-success-soft text-success",
        )}
      >
        {variant === "before" ? "Before — Java 8" : "After — Java 17"}
      </div>
      <pre className="num overflow-x-auto p-3 font-mono text-[11px] leading-5 text-foreground">
        {lines.map((l, i) => (
          <div key={i} className={cn("whitespace-pre", variant === "before" ? "bg-[color:color-mix(in_oklch,var(--danger-soft)_40%,transparent)]" : "bg-[color:color-mix(in_oklch,var(--success-soft)_40%,transparent)]")}>
            <span className="mr-3 inline-block w-5 text-right text-muted-foreground">{i + 1}</span>
            {l || " "}
          </div>
        ))}
      </pre>
    </div>
  );
}

export default function RefactoringPage() {
  const [activeDiff, setActiveDiff] = useState(diffs[0]!.id);
  const diff = diffs.find((d) => d.id === activeDiff)!;

  return (
    <>
      <PageHeader
        title="Refactoring & Code Transformation"
        subtitle="AI-generated transformations with controlled diffs — nothing merges without an explicit human decision."
        actions={
          <>
            <button className="flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-secondary">
              <RotateCcw className="size-3.5" /> Rollback Batch
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-brand-bright">
              <Play className="size-3.5" /> Run Transformation
            </button>
          </>
        }
      />

      <InsightBar action={<PanelLink to="/validation">Send to validation</PanelLink>}>
        Applying the 28 queued Java 17 transformations is projected to raise maintainability by 34% and cut build time
        by 41% with no public API changes.
      </InsightBar>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard label="Transformations Queued" value="28" delta="+9" deltaLabel="today" direction="up" tone="brand" icon={Code2} />
        <KpiCard label="Awaiting Review" value="16" delta="+3" deltaLabel="since yesterday" direction="up" tone="warning" icon={GitPullRequest} />
        <KpiCard label="Merged This Sprint" value="96" delta="+24" deltaLabel="vs prior sprint" direction="up" tone="success" icon={Check} />
        <KpiCard label="Maintainability Gain" value="34" suffix="%" delta="+6%" deltaLabel="vs baseline" direction="up" tone="intel" icon={Sparkles} />
        <KpiCard label="Lines Transformed" value="1.42M" delta="+184K" deltaLabel="this month" direction="up" tone="brand" icon={Code2} />
        <KpiCard label="Rollback Rate" value="1.8" suffix="%" delta="-0.6%" deltaLabel="improved" direction="down" tone="success" icon={RotateCcw} />
      </div>

      <Panel title="Transformation Pipeline" subtitle="Work items by stage">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {pipeline.map((p) => (
            <div key={p.stage} className="rounded-lg border p-3.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Dot tone={p.tone} />
                  {p.stage}
                </span>
                <span className="num text-sm font-semibold text-foreground">{p.count}</span>
              </div>
              <div className="mt-3">
                <ProgressBar value={p.pct} tone={p.tone} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title="Controlled Diff Review"
          subtitle={diff.file}
          actions={
            <div className="flex gap-1.5">
              <button className="flex items-center gap-1.5 rounded-md border border-[color:color-mix(in_oklch,var(--danger)_30%,transparent)] px-2.5 py-1 text-[11px] font-semibold text-danger transition-colors hover:bg-danger-soft">
                <X className="size-3.5" /> Reject
              </button>
              <button className="flex items-center gap-1.5 rounded-md bg-success px-2.5 py-1 text-[11px] font-semibold text-primary-foreground transition-colors hover:opacity-90">
                <Check className="size-3.5" /> Approve & Merge
              </button>
            </div>
          }
          bodyClassName="space-y-3"
        >
          <div className="flex flex-wrap gap-1.5">
            {diffs.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveDiff(d.id)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  activeDiff === d.id
                    ? "border-[color:color-mix(in_oklch,var(--brand)_30%,transparent)] bg-brand-soft text-brand"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                <span className="num mr-1.5">{d.id}</span>
                {d.title}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <StatusPill tone="intel">AI confidence {diff.confidence}%</StatusPill>
            <StatusPill tone="warning">Human approval required</StatusPill>
            <span>Behaviour-preserving · 42 tests attached</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <DiffColumn lines={diff.before} variant="before" />
            <DiffColumn lines={diff.after} variant="after" />
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Impact Metrics" subtitle="Projected for this batch">
            <ul className="space-y-3 text-xs">
              {[
                { label: "Maintainability", value: 34, tone: "success" as Tone, note: "+34%" },
                { label: "Cyclomatic Complexity", value: 28, tone: "success" as Tone, note: "-28%" },
                { label: "Build Time", value: 41, tone: "brand" as Tone, note: "-41%" },
                { label: "Duplicated Lines", value: 22, tone: "warning" as Tone, note: "-22%" },
                { label: "Security Findings", value: 18, tone: "danger" as Tone, note: "-18%" },
              ].map((m) => (
                <li key={m.label}>
                  <div className="mb-1 flex justify-between">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="num font-semibold text-foreground">{m.note}</span>
                  </div>
                  <ProgressBar value={m.value * 2} tone={m.tone} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="AI Recommendations" subtitle="Ranked by value per unit of effort">
            <ul className="space-y-2.5">
              {recommendations.map((r) => (
                <li key={r.title} className="rounded-lg border p-3">
                  <p className="text-xs font-semibold text-foreground">{r.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{r.impact}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <StatusPill tone={r.tone}>{r.confidence}% confidence</StatusPill>
                    <StatusPill tone="neutral">{r.effort} effort</StatusPill>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel title="Recent Automated Changes" subtitle="Every change is attributable and reversible" bodyClassName="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="border-y bg-[color:color-mix(in_oklch,var(--secondary)_60%,transparent)] text-[11px] tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-2.5 font-semibold">ID</th>
                <th className="px-4 py-2.5 font-semibold">Change</th>
                <th className="px-4 py-2.5 font-semibold">Attribution</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-5 py-2.5 font-semibold">When</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-b transition-colors last:border-0 hover:bg-[color:color-mix(in_oklch,var(--secondary)_40%,transparent)]">
                  <td className="num px-5 py-3 font-semibold text-foreground">{r.id}</td>
                  <td className="px-4 py-3 text-foreground">{r.change}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.author}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={r.tone}>{r.status}</StatusPill>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
