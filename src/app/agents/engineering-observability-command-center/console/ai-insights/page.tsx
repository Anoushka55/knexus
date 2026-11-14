"use client";

import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Cog,
  Database,
  History,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Server,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PageHeader } from "@/lib/engineering-observability/page-header";
import { Card, ProgressBar } from "@/lib/engineering-observability/ui-atoms";
import {
  graphStats,
  matchingAgents,
  rootCauseHypothesis,
} from "@/lib/engineering-observability/enterprise-data";
import { cn } from "@/lib/engineering-observability/utils";


// ---------------------------------------------------------------------------
// Investigation graph model (shared entities from the platform data model)
// ---------------------------------------------------------------------------

type Category =
  | "start"
  | "journey"
  | "service"
  | "database"
  | "infra"
  | "change"
  | "telemetry"
  | "related"
  | "capability"
  | "agent";

const categoryColors: Record<Category, string> = {
  start: "#00338D",
  journey: "#00338D",
  service: "#00338D",
  database: "#16A34A",
  infra: "#64748B",
  change: "#7C3AED",
  telemetry: "#7C3AED",
  related: "#94A3B8",
  capability: "#7C3AED",
  agent: "#00338D",
};

const categoryIcons: Record<Category, ReactNode> = {
  start: <User className="h-3.5 w-3.5" />,
  journey: <ShoppingCart className="h-3.5 w-3.5" />,
  service: <Cog className="h-3.5 w-3.5" />,
  database: <Database className="h-3.5 w-3.5" />,
  infra: <Server className="h-3.5 w-3.5" />,
  change: <Rocket className="h-3.5 w-3.5" />,
  telemetry: <TrendingUp className="h-3.5 w-3.5" />,
  related: <ShoppingCart className="h-3.5 w-3.5" />,
  capability: <Sparkles className="h-3.5 w-3.5" />,
  agent: <Bot className="h-3.5 w-3.5" />,
};

interface GNode {
  id: string;
  typeLabel: string;
  label: string;
  sub?: string;
  category: Category;
  x: number;
  y: number;
  revealStep: number; // traversal step at which the node appears
  agentNode?: boolean;
}

const gNodes: GNode[] = [
  { id: "problem", typeLabel: "User Problem", label: "Checkout failures increased", category: "start", x: 330, y: 0, revealStep: 0 },
  { id: "journey", typeLabel: "Customer Journey", label: "Online Checkout", category: "journey", x: 330, y: 110, revealStep: 1 },
  { id: "checkout", typeLabel: "Service", label: "Checkout Service", category: "service", x: 330, y: 220, revealStep: 2 },
  { id: "payment", typeLabel: "Service", label: "Payment API", category: "service", x: 330, y: 330, revealStep: 3 },
  { id: "db", typeLabel: "Database", label: "Connection Pool Saturation", category: "database", x: 330, y: 470, revealStep: 6 },
  { id: "k8s", typeLabel: "Infrastructure", label: "Kubernetes Cluster", category: "infra", x: 330, y: 600, revealStep: 7 },
  { id: "cart", typeLabel: "Service", label: "Cart Service", category: "related", x: 40, y: 150, revealStep: 3 },
  { id: "inventory", typeLabel: "Service", label: "Inventory Service", category: "related", x: 620, y: 140, revealStep: 3 },
  { id: "pricing", typeLabel: "Service", label: "Pricing Service", category: "related", x: 20, y: 290, revealStep: 3 },
  { id: "order", typeLabel: "Service", label: "Order Service", category: "related", x: 640, y: 290, revealStep: 3 },
  { id: "change", typeLabel: "Recent Change", label: "payment-service v4.8.2 deployed", sub: "4 min ago", category: "change", x: 40, y: 430, revealStep: 4 },
  { id: "telemetry", typeLabel: "Telemetry", label: "Latency ↑ 42%", sub: "Errors ↑ 17%", category: "telemetry", x: 620, y: 440, revealStep: 5 },
  // Agent-matching traversal nodes
  { id: "caps", typeLabel: "Required Capabilities", label: "Payment API Diagnostics · Log Analysis", sub: "Dependency Analysis · Incident Investigation", category: "capability", x: 330, y: 700, revealStep: 0, agentNode: true },
  { id: "agent1", typeLabel: "Agent · 94% match", label: "Payment Incident Investigator", sub: "Payments CoE", category: "agent", x: 90, y: 810, revealStep: 0, agentNode: true },
  { id: "agent2", typeLabel: "Agent · 82% match", label: "Cloud DB Optimization Agent", sub: "Cloud CoE", category: "agent", x: 570, y: 810, revealStep: 0, agentNode: true },
];

interface GEdge {
  id: string;
  source: string;
  target: string;
  kind: "path" | "related" | "evaluating" | "resolved" | "agent";
  dashed?: boolean;
  agentEdge?: boolean;
}

const gEdges: GEdge[] = [
  { id: "e1", source: "problem", target: "journey", kind: "path" },
  { id: "e2", source: "journey", target: "checkout", kind: "path" },
  { id: "e3", source: "checkout", target: "payment", kind: "path" },
  { id: "e4", source: "payment", target: "db", kind: "path" },
  { id: "e5", source: "db", target: "k8s", kind: "path" },
  { id: "e6", source: "checkout", target: "cart", kind: "related", dashed: true },
  { id: "e7", source: "checkout", target: "inventory", kind: "related", dashed: true },
  { id: "e8", source: "payment", target: "pricing", kind: "related", dashed: true },
  { id: "e9", source: "payment", target: "order", kind: "related", dashed: true },
  { id: "e10", source: "payment", target: "change", kind: "evaluating" },
  { id: "e11", source: "payment", target: "telemetry", kind: "evaluating" },
  { id: "e12", source: "change", target: "db", kind: "evaluating", dashed: true },
  { id: "e13", source: "telemetry", target: "db", kind: "resolved", dashed: true },
  { id: "e14", source: "payment", target: "caps", kind: "agent", agentEdge: true },
  { id: "e15", source: "caps", target: "agent1", kind: "agent", agentEdge: true },
  { id: "e16", source: "caps", target: "agent2", kind: "agent", agentEdge: true },
];

const edgeColors: Record<GEdge["kind"], string> = {
  path: "#00338D",
  related: "#CBD5E1",
  evaluating: "#7C3AED",
  resolved: "#16A34A",
  agent: "#7C3AED",
};

// Node inspector content — values from the shared data model
const nodeDetails: Record<string, Array<[string, string]>> = {
  problem: [
    ["Type", "User Problem"],
    ["Signal", "Checkout failure rate ↑ 17%"],
    ["Window", "Last 30 minutes"],
    ["Linked incident", "INC-8421"],
  ],
  journey: [
    ["Type", "Customer Journey"],
    ["Status", "Critical"],
    ["Transactions / hr", "12.8K"],
    ["Revenue / hr", "£412K"],
    ["Exposure", "£184K / hr"],
  ],
  checkout: [
    ["Type", "Service"],
    ["Health", "Degraded"],
    ["Latency p95", "842 ms"],
    ["Error rate", "3.14%"],
    ["SLO", "96.2%"],
    ["Owner", "Digital Commerce CoE"],
  ],
  payment: [
    ["Type", "Service"],
    ["Health", "Degraded"],
    ["Latency", "+42%"],
    ["Error rate", "+17%"],
    ["SLO", "96.2%"],
    ["Owner", "Payments Engineering"],
    ["Dependencies", "Connection Pool · Payment Database"],
    ["Customer impact", "Online Checkout"],
    ["Incidents", "INC-8421"],
  ],
  db: [
    ["Type", "Database"],
    ["Health", "Critical"],
    ["Pool utilisation", "96%"],
    ["Engine", "PostgreSQL 15 · RDS"],
    ["Owner", "Cloud CoE"],
    ["Incidents", "INC-8420"],
  ],
  k8s: [
    ["Type", "Infrastructure"],
    ["Health", "Healthy"],
    ["Platform", "EKS 1.29"],
    ["SLO", "99.9%"],
    ["Owner", "Cloud CoE"],
  ],
  change: [
    ["Type", "Recent Change"],
    ["Deployment", "payment-service v4.8.2"],
    ["Deployed", "10:14 AM · 4 min before degradation"],
    ["Blast radius", "High"],
    ["Environment", "Production"],
  ],
  telemetry: [
    ["Type", "Telemetry"],
    ["Latency", "↑ 42%"],
    ["Errors", "↑ 17%"],
    ["Signals correlated", "17"],
    ["Source", "Observability (Datadog)"],
  ],
  cart: [
    ["Type", "Service"],
    ["Health", "Healthy"],
    ["Latency p95", "142 ms"],
    ["Owner", "Digital Commerce CoE"],
  ],
  inventory: [
    ["Type", "Service"],
    ["Health", "Degraded"],
    ["Latency p95", "312 ms"],
    ["Owner", "Fulfilment CoE"],
  ],
  pricing: [
    ["Type", "Service"],
    ["Health", "Healthy"],
    ["Latency p95", "168 ms"],
    ["Owner", "Digital Commerce CoE"],
  ],
  order: [
    ["Type", "Service"],
    ["Health", "Healthy"],
    ["Latency p95", "276 ms"],
    ["Owner", "Fulfilment CoE"],
  ],
  caps: [
    ["Type", "Required Capabilities"],
    ["Derived from", "Checkout Payment Degradation"],
    ["Capabilities", "Payment API Diagnostics · Log Analysis · Dependency Analysis · Incident Investigation"],
  ],
  agent1: [
    ["Type", "AI Agent"],
    ["Match", "94%"],
    ["Owner", "Payments CoE"],
    ["Track record", "14 similar incidents resolved (90 days)"],
  ],
  agent2: [
    ["Type", "AI Agent"],
    ["Match", "82%"],
    ["Owner", "Cloud CoE"],
    ["Track record", "DB saturation detected in 7 similar incidents"],
  ],
};

const stepperStages = [
  "Understanding Question",
  "Traversing Knowledge Graph",
  "Analyzing & Correlating",
  "Generating Answer",
];

const summaryItems: Array<{ label: string; doneAt: number }> = [
  { label: "Customer Journey identified", doneAt: 1 },
  { label: "Impacted Services found", doneAt: 3 },
  { label: "Telemetry correlated", doneAt: 5 },
  { label: "Recent Changes analyzed", doneAt: 4 },
  { label: "Dependencies evaluated", doneAt: 6 },
  { label: "Root Cause candidates identified", doneAt: 7 },
];

const suggestedQuestions = [
  "Why are checkout failures increasing?",
  "What changed in the last 30 minutes?",
  "What is the blast radius?",
  "Which customer journeys are impacted?",
  "Is there an agent that can help resolve this?",
];

const questionHistory = [
  "Checkout failures have increased in the last 30 minutes. What is causing the issue?",
  "What is the blast radius of INC-8421?",
  "Which customer journeys are impacted?",
  "Is there an agent that can help with the payment incident?",
];

const DEFAULT_QUESTION = questionHistory[0]!;

const evidenceLinks: Array<{ label: string; value: string; nodeId?: string }> = [
  { label: "Payment API latency increased", value: "+42%", nodeId: "telemetry" },
  { label: "Checkout failure rate increased", value: "+17%", nodeId: "telemetry" },
  { label: "Database connection pool reached 96%", value: "96%", nodeId: "db" },
  { label: "Deployment occurred 4 minutes before degradation", value: "v4.8.2", nodeId: "change" },
  { label: "Payment API depends on affected database", value: "Confirmed", nodeId: "payment" },
  { label: "Similar historical incidents were correlated", value: "3 in 30 days" },
];

type Phase = "empty" | "running" | "complete";
type AgentPhase = "idle" | "matching" | "ready";
type Approval = "none" | "approved";

const TOTAL_STEPS = 8;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function AiInvestigationPage() {
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [phase, setPhase] = useState<Phase>("empty");
  const [step, setStep] = useState(0);
  const [agentPhase, setAgentPhase] = useState<AgentPhase>("idle");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [highlightNode, setHighlightNode] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [approval, setApproval] = useState<Approval>("none");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const runId = useRef(0);

  useEffect(() => {
    setMounted(true);
    // Auto-start the investigation with the default question (Overview AI
    // Priority #1 lands here with the investigation context selected).
    startInvestigation(DEFAULT_QUESTION);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startInvestigation(q: string) {
    runId.current += 1;
    setQuestion(q);
    setPhase("running");
    setStep(0);
    setAgentPhase("idle");
    setSelectedNode(null);
    setHighlightNode(null);
    setSelectedAgent(null);
    setApproval("none");
    setHistoryOpen(false);
  }

  function resetAll() {
    runId.current += 1;
    setQuestion("");
    setPhase("empty");
    setStep(0);
    setAgentPhase("idle");
    setSelectedNode(null);
    setHighlightNode(null);
    setSelectedAgent(null);
    setApproval("none");
    setSearch("");
    setHistoryOpen(false);
  }

  // Traversal animation driver — one hop every ~650ms, then answer generation.
  useEffect(() => {
    if (phase !== "running") return;
    const id = runId.current;
    const delay = step >= TOTAL_STEPS ? 900 : 650;
    const t = setTimeout(() => {
      if (runId.current !== id) return;
      if (step >= TOTAL_STEPS) setPhase("complete");
      else setStep((s) => s + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [phase, step]);

  // Agent matching animation
  useEffect(() => {
    if (agentPhase !== "matching") return;
    const id = runId.current;
    const t = setTimeout(() => {
      if (runId.current !== id) return;
      setAgentPhase("ready");
    }, 2000);
    return () => clearTimeout(t);
  }, [agentPhase]);

  const stageIndex =
    phase === "complete"
      ? 4
      : step <= 1
        ? 0
        : step <= 4
          ? 1
          : step <= 7
            ? 2
            : 3;

  const showAgents = agentPhase !== "idle";

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return gNodes
      .filter((n) => !n.agentNode)
      .filter(
        (n) =>
          n.label.toLowerCase().includes(q) ||
          n.typeLabel.toLowerCase().includes(q) ||
          (n.id === "payment" && "inc-8421".includes(q)),
      )
      .slice(0, 6);
  }, [search]);

  const selectedGNode = selectedNode ? gNodes.find((n) => n.id === selectedNode) : null;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <PageHeader
        title="AI Investigation"
        subtitle="Ask questions about your engineering environment. The knowledge graph will reason across data to give you answers."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" /> New Question
            </button>
            <div className="relative">
              <button
                onClick={() => setHistoryOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                <History className="h-3.5 w-3.5" /> History
              </button>
              {historyOpen && (
                <div className="absolute right-0 top-full z-30 mt-1 w-96 rounded-lg border border-border bg-card shadow-lg">
                  <div className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
                    Previous investigations
                  </div>
                  <ul className="max-h-64 overflow-y-auto p-1.5">
                    {questionHistory.map((q) => (
                      <li key={q}>
                        <button
                          onClick={() => startInvestigation(q)}
                          className="w-full rounded-md px-2.5 py-2 text-left text-xs text-foreground hover:bg-kpmg-light"
                        >
                          {q}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* Question input */}
      <Card bodyClassName="p-4">
        <label htmlFor="ai-question" className="mb-2 block text-xs font-semibold text-muted-foreground">
          Ask a question
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <textarea
            id="ai-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            placeholder="Why are checkout failures increasing?"
            className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => question.trim() && startInvestigation(question.trim())}
            disabled={!question.trim()}
            className="flex items-center justify-center gap-1.5 self-start rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-kpmg-dark disabled:opacity-40 sm:self-stretch"
          >
            Ask OCC <Sparkles className="h-4 w-4" />
          </button>
        </div>
        {phase === "empty" && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => startInvestigation(q)}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:border-[color:color-mix(in_oklab,var(--primary)_40%,transparent)] hover:text-primary"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Investigation stepper */}
      {phase !== "empty" && (
        <div className="flex flex-wrap items-center gap-y-2 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          {stepperStages.map((label, i) => {
            const done = phase === "complete" || i < stageIndex;
            const active = phase === "running" && i === stageIndex;
            return (
              <div key={label} className="flex items-center">
                {i > 0 && <div className={cn("mx-3 h-px w-8 sm:w-14", done || active ? "bg-primary" : "bg-border")} />}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold",
                      done
                        ? "border-healthy bg-healthy text-primary-foreground"
                        : active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      done ? "text-foreground" : active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                  {done && <CheckCircle2 className="h-3.5 w-3.5 text-healthy" />}
                  {active && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main investigation workspace */}
      <div className="grid gap-5 xl:grid-cols-12">
        {/* Knowledge Graph Traversal */}
        <Card
          title="Knowledge Graph Traversal"
          subtitle={
            phase === "complete"
              ? "Traversal complete — the highlighted path produced the root-cause hypothesis"
              : "The graph is being traversed to find relevant entities and relationships..."
          }
          className="xl:col-span-6"
          bodyClassName="p-0"
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:color-mix(in_oklab,var(--critical)_30%,transparent)] bg-critical-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-critical">
              <span className="h-1.5 w-1.5 rounded-full bg-critical animate-pulse-dot" /> Live
            </span>
          }
        >
          {/* Search + reset toolbar */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search entities — Payment API, Online Checkout, INC-8421…"
                className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {searchOpen && searchResults.length > 0 && (
                <div className="absolute left-0 top-full z-30 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
                  <ul className="p-1.5">
                    {searchResults.map((n) => (
                      <li key={n.id}>
                        <button
                          onClick={() => {
                            setHighlightNode(n.id);
                            setSelectedNode(n.id);
                            setSearchOpen(false);
                            setSearch(n.label);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-kpmg-light"
                        >
                          <span className="h-2 w-2 rounded-sm" style={{ background: categoryColors[n.category] }} />
                          <span className="font-semibold text-foreground">{n.label}</span>
                          <span className="text-muted-foreground">{n.typeLabel}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="relative h-[560px] w-full overflow-hidden rounded-b-lg">
            {!mounted ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading graph…
              </div>
            ) : phase === "empty" ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <Sparkles className="h-8 w-8 text-ai" />
                <p className="max-w-sm text-sm text-muted-foreground">
                  Ask a question above and the AI will traverse the Engineering Knowledge Graph to
                  find evidence-backed answers.
                </p>
              </div>
            ) : (
              <ReactFlowProvider>
                <TraversalGraph
                  step={step}
                  phase={phase}
                  showAgents={showAgents}
                  agentPhase={agentPhase}
                  highlightNode={highlightNode}
                  onNodeClick={(id) => setSelectedNode(id)}
                />
              </ReactFlowProvider>
            )}

            {/* Legend */}
            {phase !== "empty" && (
              <div className="absolute left-3 top-3 z-10 rounded-md border border-border bg-[color:color-mix(in_oklab,var(--card)_95%,transparent)] px-3 py-2 shadow-sm backdrop-blur">
                <ul className="space-y-1 text-[10px] font-medium text-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-0.5 w-5 rounded bg-kpmg-blue" /> Starting Point
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-5 rounded bg-kpmg-blue" /> Traversal Path
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-0.5 w-5 rounded bg-slate-300" /> Related Entities
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-0.5 w-5 rounded bg-ai" /> Evaluating
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-0.5 w-5 rounded bg-healthy" /> Resolved
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-0.5 w-5 border-t border-dashed border-slate-300" /> Pending
                  </li>
                </ul>
              </div>
            )}

            {/* Node inspector */}
            {selectedGNode && phase !== "empty" && (
              <div className="absolute right-3 top-3 z-10 w-64 rounded-lg border border-border bg-card shadow-lg">
                <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-2">
                  <div>
                    <div className="text-xs font-bold text-foreground">{selectedGNode.label}</div>
                    <div className="text-[10px] text-muted-foreground">{selectedGNode.typeLabel}</div>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="rounded p-0.5 text-muted-foreground hover:bg-muted"
                    aria-label="Close entity details"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <dl className="max-h-64 space-y-1.5 overflow-y-auto p-3">
                  {(nodeDetails[selectedGNode.id] ?? []).map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-2 text-[11px]">
                      <dt className="shrink-0 text-muted-foreground">{k}</dt>
                      <dd className="text-right font-semibold text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </Card>

        {/* Middle column: summary + root cause + next action */}
        <div className="space-y-5 xl:col-span-3">
          <Card title="Traversal Summary" subtitle="Structured reasoning over connected data">
            <ul className="space-y-2">
              {summaryItems.map((item) => {
                const done = phase === "complete" || step >= item.doneAt;
                const processing = phase === "running" && !done && step === item.doneAt - 1;
                return (
                  <li key={item.label} className="flex items-center gap-2 text-xs">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-healthy" />
                    ) : processing ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                    ) : (
                      <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
                    )}
                    <span className={done ? "font-medium text-foreground" : "text-muted-foreground"}>
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          {(phase === "complete" || step >= TOTAL_STEPS) && (
            <>
              <Card
                title="Identified Root Cause (Hypothesis)"
                action={
                  <span className="rounded-full bg-ai-soft px-2 py-0.5 text-[10px] font-bold text-ai">
                    AI
                  </span>
                }
              >
                <p className="text-xs font-medium leading-relaxed text-foreground">
                  {rootCauseHypothesis.detail}
                </p>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">Confidence</span>
                    <span className="font-bold text-foreground">{rootCauseHypothesis.confidence}%</span>
                  </div>
                  <ProgressBar value={rootCauseHypothesis.confidence} tone="primary" />
                </div>
                <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                  {[
                    { l: "Latency", v: "↑ 42%", nodeId: "telemetry" },
                    { l: "Error Rate", v: "↑ 17%", nodeId: "telemetry" },
                    { l: "DB Utilization", v: "96%", nodeId: "db" },
                    { l: "Impact", v: "High", nodeId: "payment" },
                  ].map((m) => (
                    <button
                      key={m.l}
                      onClick={() => setHighlightNode(m.nodeId)}
                      className="rounded-md border border-border bg-background p-1.5 hover:border-[color:color-mix(in_oklab,var(--primary)_40%,transparent)]"
                    >
                      <div className="text-[9px] text-muted-foreground">{m.l}</div>
                      <div className="text-[11px] font-bold text-foreground">{m.v}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Evidence supporting this hypothesis
                  </div>
                  <ul className="space-y-1">
                    {evidenceLinks.map((e) => (
                      <li key={e.label}>
                        <button
                          onClick={() => e.nodeId && setHighlightNode(e.nodeId)}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-md bg-muted px-2.5 py-1.5 text-left text-[11px]",
                            e.nodeId && "hover:bg-kpmg-light",
                          )}
                        >
                          <span className="text-muted-foreground">{e.label}</span>
                          <span className="shrink-0 font-semibold text-foreground">{e.value}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[10px] italic text-muted-foreground">
                    Click evidence to highlight the supporting entity in the graph.
                  </p>
                </div>
              </Card>

              <Card title="Next Best Action">
                <p className="text-xs text-muted-foreground">
                  Find an agent that can help investigate or resolve this issue.
                </p>
                <button
                  onClick={() => setAgentPhase("matching")}
                  disabled={agentPhase !== "idle"}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-kpmg-dark disabled:opacity-50"
                >
                  {agentPhase === "idle" ? (
                    <>
                      Find Matching Agents <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  ) : agentPhase === "matching" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Traversing agent capability graph…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> 2 agents matched
                    </>
                  )}
                </button>
              </Card>
            </>
          )}
        </div>

        {/* Right column: matching agents */}
        <div className="space-y-5 xl:col-span-3">
          <Card
            title={`Matching Agents${agentPhase === "ready" ? " (2)" : ""}`}
            subtitle="Top agents from company pool"
            action={<Bot className="h-4 w-4 text-ai" />}
          >
            {agentPhase === "idle" && (
              <p className="text-xs text-muted-foreground">
                {phase === "complete"
                  ? "Use Next Best Action to search the enterprise agent pool for agents capable of helping with this issue."
                  : "Agent matching becomes available once the investigation identifies a root cause."}
              </p>
            )}
            {agentPhase === "matching" && (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <div key={i} className="animate-pulse rounded-lg border border-border bg-muted p-4">
                    <div className="h-3 w-2/3 rounded bg-border" />
                    <div className="mt-2 h-2.5 w-full rounded bg-border" />
                    <div className="mt-1.5 h-2.5 w-4/5 rounded bg-border" />
                  </div>
                ))}
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin text-ai" />
                  Traversing: Problem → Required Capabilities → Agent Capability Graph → Available Agents
                </p>
              </div>
            )}
            {agentPhase === "ready" && (
              <div className="space-y-4">
                {matchingAgents.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      "rounded-lg border p-3.5",
                      a.match >= 90 ? "border-[color:color-mix(in_oklab,var(--healthy)_40%,transparent)] bg-[color:color-mix(in_oklab,var(--healthy-soft)_40%,transparent)]" : "border-border bg-background",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-md",
                            a.match >= 90 ? "bg-healthy-soft" : "bg-kpmg-light",
                          )}
                        >
                          <Bot className={cn("h-[18px] w-[18px]", a.match >= 90 ? "text-healthy" : "text-primary")} />
                        </span>
                        <div className="text-xs font-bold leading-tight text-foreground">{a.name}</div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          a.match >= 90 ? "bg-healthy-soft text-healthy" : "bg-kpmg-light text-primary",
                        )}
                      >
                        {a.match}% Match
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{a.description}</p>
                    <div className="mt-2">
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Capabilities
                      </div>
                      <ul className="space-y-0.5">
                        {a.capabilities.map((c) => (
                          <li key={c} className="flex items-center gap-1.5 text-[11px] text-foreground">
                            <Check className="h-3 w-3 text-healthy" /> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-2 text-[11px]">
                      <span className="font-semibold text-muted-foreground">Why this agent?</span>
                      <p className="italic text-muted-foreground">{a.reason}.</p>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Owner: <span className="font-semibold text-foreground">{a.owner}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedAgent(a.id);
                        setApproval("none");
                      }}
                      className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-kpmg-dark"
                    >
                      Select Agent
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Business impact */}
      {phase === "complete" && (
        <Card title="Business Impact" subtitle="Quantified exposure from the shared platform model">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Transactions affected", value: rootCauseHypothesis.businessImpact.transactions },
              { label: "Customers potentially affected", value: rootCauseHypothesis.businessImpact.customers },
              { label: "Estimated exposure / hour", value: rootCauseHypothesis.businessImpact.exposure, tone: "text-critical" },
              { label: "Services impacted", value: String(rootCauseHypothesis.businessImpact.services) },
              { label: "Customer journeys impacted", value: String(rootCauseHypothesis.businessImpact.journeys) },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-background p-3 text-center">
                <div className={cn("text-lg font-bold tabular-nums text-foreground", s.tone)}>{s.value}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Bottom knowledge graph status bar */}
      <div className="flex flex-col items-start justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center">
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            The Engineering Knowledge Graph connects{" "}
            <strong className="text-foreground">{graphStats.totalEntities}</strong> entities and{" "}
            <strong className="text-foreground">{graphStats.relationships}</strong> relationships across
            people, services, infrastructure, applications and business context.
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
          <span>Last updated: {refreshedAt ?? graphStats.lastUpdated}</span>
          <button
            onClick={() => {
              setRefreshing(true);
              setTimeout(() => {
                setRefreshing(false);
                setRefreshedAt("just now");
              }, 900);
            }}
            className="flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Agent detail / human approval modal */}
      {selectedAgent && (
        <AgentModal
          agentId={selectedAgent}
          approval={approval}
          onApprove={() => setApproval("approved")}
          onClose={() => {
            setSelectedAgent(null);
            setApproval("none");
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Traversal graph (React Flow)
// ---------------------------------------------------------------------------

function TraversalGraph({
  step,
  phase,
  showAgents,
  agentPhase,
  highlightNode,
  onNodeClick,
}: {
  step: number;
  phase: Phase;
  showAgents: boolean;
  agentPhase: AgentPhase;
  highlightNode: string | null;
  onNodeClick: (id: string) => void;
}) {
  const rf = useReactFlow();

  // Center on highlighted node
  useEffect(() => {
    if (!highlightNode) return;
    const n = gNodes.find((g) => g.id === highlightNode);
    if (n) rf.setCenter(n.x + 85, n.y + 32, { zoom: 1.15, duration: 500 });
  }, [highlightNode, rf]);

  // Frame the graph when agents appear
  useEffect(() => {
    if (!showAgents && phase !== "complete") return undefined;
    const t = setTimeout(() => rf.fitView({ duration: 500, padding: 0.12 }), 60);
    return () => clearTimeout(t);
  }, [showAgents, phase, rf]);

  const nodes: Node[] = useMemo(() => {
    return gNodes
      .filter((n) => (n.agentNode ? showAgents : phase !== "empty" && step >= n.revealStep))
      .map((n) => {
        const color = categoryColors[n.category];
        const isHighlighted = highlightNode === n.id;
        const isAgentPending = n.agentNode && agentPhase === "matching";
        return {
          id: n.id,
          position: { x: n.x, y: n.y },
          data: {
            label: (
              <div className="flex items-start gap-1.5 text-left">
                <span style={{ color }} className="mt-0.5 shrink-0">
                  {categoryIcons[n.category]}
                </span>
                <span>
                  <span className="block text-[8px] font-bold uppercase tracking-wide" style={{ color }}>
                    {n.typeLabel}
                  </span>
                  <span className="block text-[10px] font-bold leading-tight text-slate-900">{n.label}</span>
                  {n.sub && <span className="block text-[8.5px] text-slate-500">{n.sub}</span>}
                </span>
              </div>
            ),
          },
          style: {
            background: "#ffffff",
            border: `1.5px solid ${color}`,
            borderRadius: 10,
            padding: "6px 10px",
            width: 170,
            boxShadow: isHighlighted
              ? `0 0 0 4px ${color}55, 0 2px 6px rgba(15,23,42,0.12)`
              : "0 1px 3px rgba(15,23,42,0.10)",
            opacity: isAgentPending ? 0.35 : 1,
            transition: "opacity 300ms, box-shadow 300ms",
          },
        } satisfies Node;
      });
  }, [step, phase, showAgents, agentPhase, highlightNode]);

  const edges: Edge[] = useMemo(() => {
    return gEdges
      .filter((e) => {
        if (e.agentEdge) return showAgents;
        const s = gNodes.find((n) => n.id === e.source);
        const t = gNodes.find((n) => n.id === e.target);
        if (!s || !t) return false;
        return step >= Math.max(s.revealStep, t.revealStep);
      })
      .map((e) => {
        const color = edgeColors[e.kind];
        const isPath = e.kind === "path";
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          animated: isPath || e.kind === "evaluating" || e.kind === "agent",
          style: {
            stroke: color,
            strokeWidth: isPath ? 2.25 : 1.25,
            strokeDasharray: e.dashed ? "5 4" : undefined,
            opacity: e.agentEdge && agentPhase === "matching" ? 0.4 : 1,
          },
        } satisfies Edge;
      });
  }, [step, showAgents, agentPhase]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.3}
      maxZoom={2}
      onNodeClick={(_, node) => onNodeClick(node.id)}
      proOptions={{ hideAttribution: true }}
      nodesConnectable={false}
    >
      <Background gap={24} color="#E2E8F0" />
      <Controls showInteractive={false} position="bottom-right" />
      <button
        onClick={() => rf.fitView({ duration: 400, padding: 0.15 })}
        className="absolute right-3 top-3 z-10 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold text-primary shadow-sm hover:bg-muted"
      >
        Reset View
      </button>
    </ReactFlow>
  );
}

// ---------------------------------------------------------------------------
// Agent detail modal with human-in-the-loop approval
// ---------------------------------------------------------------------------

function AgentModal({
  agentId,
  approval,
  onApprove,
  onClose,
}: {
  agentId: string;
  approval: Approval;
  onApprove: () => void;
  onClose: () => void;
}) {
  const agent = matchingAgents.find((a) => a.id === agentId);
  if (!agent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:color-mix(in_oklab,var(--kpmg-dark)_40%,transparent)] p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Agent details: ${agent.name}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ai-soft">
              <Bot className="h-5 w-5 text-ai" />
            </span>
            <div>
              <div className="text-sm font-bold text-foreground">{agent.name}</div>
              <div className="text-xs text-muted-foreground">
                {agent.owner} · <span className="font-bold text-primary">{agent.match}% match</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-xs leading-relaxed text-muted-foreground">{agent.description}</p>

          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Capabilities
            </div>
            <div className="flex flex-wrap gap-1.5">
              {agent.capabilities.map((c) => (
                <span key={c} className="rounded border border-border bg-muted px-2 py-0.5 text-[11px] text-foreground">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-md border border-border bg-background p-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Relevant history
              </div>
              <div className="mt-1 font-medium text-foreground">{agent.reason}</div>
            </div>
            <div className="rounded-md border border-border bg-background p-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Recommended task
              </div>
              <div className="mt-1 font-medium text-foreground">
                Investigate INC-8421 root cause on Payment API
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border bg-background p-2.5 text-xs">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Estimated action
            </div>
            <div className="mt-1 font-medium text-foreground">
              {agent.id === "agent-payment-investigator"
                ? "Analyse Payment API logs & traces, confirm connection-pool saturation hypothesis, propose remediation runbook."
                : "Analyse Payments DB connection pool, recommend capacity increase and connection-limit tuning."}
            </div>
          </div>

          {approval === "approved" ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-md border border-[color:color-mix(in_oklab,var(--healthy)_30%,transparent)] bg-healthy-soft px-3 py-2.5 text-xs font-semibold text-healthy">
                <CheckCircle2 className="h-4 w-4" /> Action approved for simulation.
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-[11px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin text-primary" /> Simulation action queued — no changes
                will be made to production systems.
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-[color:color-mix(in_oklab,var(--warning)_40%,transparent)] bg-warning-soft px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-warning">
                <ShieldCheck className="h-4 w-4" /> Human approval required
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                The AI investigates and recommends — a human reviews and approves before any action is
                simulated. No autonomous changes to production.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Review
                </button>
                <button
                  onClick={onApprove}
                  className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-kpmg-dark"
                >
                  Approve
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AiInvestigationPage;
