"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send, Bot, User, ShieldCheck, ArrowRight } from "lucide-react";
import { Card, Pill } from "@/components/aiops/primitives";
import { ConfidenceBar, SlaPill } from "@/components/aiops/charts";
import { ask, suggestedQuestions, type AgentResponse } from "@/lib/aiops/agent";
import { getProblems, kpis, playbooks, predictions, serviceName } from "@/lib/aiops";
import { relative, useSession } from "@/lib/aiops/session";

type Msg = { role: "user"; text: string } | { role: "agent"; response: AgentResponse };

export default function AgentPage() {
  const { shift } = useSession();
  const k = kpis(shift);
  const problems = getProblems(shift).filter((p) => p.status !== "Resolved");
  const worst = [...problems].sort((a, b) => b.correlatedEventCount - a.correlatedEventCount)[0];

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "agent",
      response: {
        text: `I am watching ${k.activeProblems} active problems across five operational domains. ${k.slaRisks} are carrying SLA risk and ${k.predictedIncidents} incidents are predicted ahead of impact. What would you like to look at?`,
        facts: [
          {
            label: "Highest-event problem",
            value: worst ? `${worst.id} · ${worst.correlatedEventCount} events` : "None",
          },
          { label: "Nearest predicted impact", value: `${k.nearestImpactMinutes} minutes` },
        ],
      },
    },
  ]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const lastIntent = useRef<Parameters<typeof ask>[1]["lastIntent"]>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = (text: string) => {
    if (!text.trim() || typing) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    window.setTimeout(() => {
      const { response, intent } = ask(text, { shift, lastIntent: lastIntent.current });
      lastIntent.current = intent;
      setTyping(false);
      setMessages((m) => [...m, { role: "agent", response }]);
    }, 700);
  };

  return (
    <div className="grid grid-cols-12 gap-4 p-5 h-[calc(100vh-3.5rem)]">
      <section className="col-span-12 lg:col-span-8 bg-surface border border-border rounded-aiops-md flex flex-col min-h-0">
        <header className="h-14 border-b border-border px-4 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-aiops-sm bg-navy flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">Operations Copilot</div>
            <div className="text-[11px] text-muted-foreground truncate">
              Reads the same correlated dataset the console renders. Actions are simulated.
            </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex gap-2 justify-end">
                <div className="max-w-[80%] rounded-aiops-md px-3 py-2 text-sm border bg-background text-foreground border-border">
                  {m.text}
                </div>
                <div className="w-7 h-7 rounded-aiops-sm bg-background border border-border flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
              </div>
            ) : (
              <AgentBubble key={i} response={m.response} onAction={send} />
            ),
          )}
          {typing && (
            <div className="flex gap-2 items-center">
              <div className="w-7 h-7 rounded-aiops-sm bg-navy flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-navy/5 border border-border rounded-aiops-md px-3 py-2 flex gap-1">
                <Dot />
                <Dot delay="150ms" />
                <Dot delay="300ms" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border p-3 shrink-0">
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {suggestedQuestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-[11px] h-7 px-2.5 border border-border rounded-full hover:border-navy hover:bg-background"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about problems, root causes, SLA risk, predictions or recommended actions…"
              className="flex-1 h-10 px-3 bg-background border border-border rounded-aiops-sm text-sm focus:outline-none focus:border-blue"
            />
            <button className="h-10 px-3 bg-navy text-white rounded-aiops-sm flex items-center gap-1.5 text-sm">
              <Send className="w-4 h-4" /> Send
            </button>
          </form>
        </div>
      </section>

      <aside className="col-span-12 lg:col-span-4 space-y-3 overflow-y-auto min-h-0">
        <Card title="Operational context" subtitle="What the copilot can see">
          <ul className="text-xs space-y-2">
            <Row k="Active problems" v={`${k.activeProblems} (${k.bySeverity.P1} P1)`} />
            <Row k="Events correlated" v={String(k.eventsCorrelated)} />
            <Row k="Services at risk" v={`${k.servicesAtRisk} of ${k.totalServices}`} />
            <Row k="SLA risks" v={String(k.slaRisks)} />
            <Row k="Predicted incidents" v={String(k.predictedIncidents)} />
            <Row k="Playbooks available" v={String(playbooks.length)} />
          </ul>
        </Card>

        <Card title="Problems in view">
          <ul className="space-y-2">
            {problems.slice(0, 4).map((p) => (
              <li key={p.id} className="border border-border rounded-aiops-sm p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px]">{p.id}</span>
                  <SlaPill risk={p.slaRisk} />
                </div>
                <div className="text-xs mt-0.5">{p.rootCause}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {serviceName(p.serviceId)} · {p.siteId} · opened {relative(p.openedMinutesAgo)}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Predictions in view">
          <ul className="space-y-2">
            {predictions.map((p) => (
              <li key={p.id} className="flex items-center gap-2 text-xs">
                <span className="font-mono truncate flex-1">{p.deviceId}</span>
                <Pill tone="amber">
                  {p.probability}% · {p.minutesToImpact}m
                </Pill>
              </li>
            ))}
          </ul>
        </Card>
      </aside>
    </div>
  );
}

function AgentBubble({
  response,
  onAction,
}: {
  response: AgentResponse;
  onAction: (text: string) => void;
}) {
  return (
    <div className="flex gap-2">
      <div className="w-7 h-7 rounded-aiops-sm bg-navy flex items-center justify-center shrink-0">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div
        className={`max-w-[88%] rounded-aiops-md px-3 py-2.5 text-sm border ${
          response.verification
            ? "bg-success/5 border-success/40"
            : response.simulated
              ? "bg-teal/5 border-teal/40"
              : "bg-navy text-white border-navy"
        }`}
      >
        {response.simulated && (
          <div
            className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${
              response.verification ? "text-success" : "text-teal"
            }`}
          >
            {response.verification ? <ShieldCheck className="w-3 h-3" /> : null}
            Simulation
          </div>
        )}

        <p className={response.simulated ? "text-foreground" : ""}>{response.text}</p>

        {response.facts && response.facts.length > 0 && (
          <div
            className={`mt-2 rounded-aiops-sm border p-2 space-y-1 ${
              response.simulated ? "bg-surface border-border" : "bg-white/5 border-white/10"
            }`}
          >
            {response.facts.map((f) => (
              <div key={f.label} className="flex justify-between gap-3 text-xs">
                <span className={response.simulated ? "text-muted-foreground" : "text-white/70"}>
                  {f.label}
                </span>
                <span
                  className={`text-right font-medium ${response.simulated ? "text-foreground" : "text-teal"}`}
                >
                  {f.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {response.bullets && response.bullets.length > 0 && (
          <ul
            className={`mt-2 space-y-1 text-xs ${response.simulated ? "text-muted-foreground" : "text-white/80"}`}
          >
            {response.bullets.map((b, i) => (
              <li key={i}>• {b}</li>
            ))}
          </ul>
        )}

        {response.confidence !== undefined && !response.simulated && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/70">AI confidence</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-aiops-sm overflow-hidden">
                <div className="h-full bg-teal" style={{ width: `${response.confidence}%` }} />
              </div>
              <span className="text-xs font-semibold">{response.confidence}%</span>
            </div>
          </div>
        )}

        {response.confidence !== undefined && response.simulated && (
          <div className="mt-2">
            <ConfidenceBar value={response.confidence} />
          </div>
        )}

        {response.action && (
          <div className="mt-2.5">
            {response.action.kind === "link" && response.action.to ? (
              <Link
                href={response.action.to}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs bg-teal text-white rounded-aiops-sm hover:opacity-90"
              >
                {response.action.label} <ArrowRight className="w-3 h-3" />
              </Link>
            ) : (
              <button
                onClick={() =>
                  onAction(response.action?.kind === "verify" ? "Verify the result" : "Execute it")
                }
                className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs bg-teal text-white rounded-aiops-sm hover:opacity-90"
              >
                {response.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium tabular-nums">{v}</span>
    </li>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-muted-foreground aiops-pulse-dot"
      style={{ animationDelay: delay }}
    />
  );
}
