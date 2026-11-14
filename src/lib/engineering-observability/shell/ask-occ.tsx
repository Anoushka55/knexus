"use client";

import Link from "next/link";
import { obsHref } from "@/lib/engineering-observability/paths";
import { ArrowRight, BrainCircuit, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { askOcc, suggestedQueries, type AskResult } from "@/lib/engineering-observability/enterprise-data";
import { cn } from "@/lib/engineering-observability/utils";

export function AskOccButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-kpmg-dark"
    >
      <BrainCircuit className="h-4 w-4" />
      <span className="hidden sm:inline">Ask OCC</span>
    </button>
  );
}

interface Message {
  role: "user" | "assistant";
  text: string;
  result?: AskResult;
}

export function AskOccOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || thinking) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setQuery("");
    setThinking(true);
    setTimeout(() => {
      const result = askOcc(trimmed);
      setMessages((m) => [...m, { role: "assistant", text: result.answer, result }]);
      setThinking(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[color:color-mix(in_oklab,var(--foreground)_40%,transparent)] p-4 pt-[10vh]">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border bg-kpmg-light px-4 py-3">
          <BrainCircuit className="h-5 w-5 text-primary" />
          <div className="leading-tight">
            <div className="text-sm font-bold text-foreground">Ask OCC</div>
            <div className="text-[11px] text-muted-foreground">
              AI copilot reasoning across the engineering knowledge graph
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded p-1 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
          {messages.length === 0 && (
            <div>
              <p className="text-sm text-muted-foreground">
                Ask about incidents, services, journeys, cost or agents — I&apos;ll traverse the graph
                and answer with evidence.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {suggestedQueries.map((q) => (
                  <button
                    key={q}
                    onClick={() => submit(q)}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary hover:bg-kpmg-light"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-foreground",
                  )}
                >
                  {m.role === "assistant" && (
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ai">
                      <Sparkles className="h-3 w-3" /> OCC Reasoning
                    </div>
                  )}
                  {m.text}
                  {m.result?.route && (
                    <Link
                      href={obsHref(m.result.route)}
                      onClick={onClose}
                      className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-kpmg-dark"
                    >
                      {m.result.routeLabel} <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-muted-foreground">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
                  </span>
                  Traversing knowledge graph…
                </div>
              </div>
            )}
          </div>
        </div>

        <form
          className="flex items-center gap-2 border-t border-border bg-card p-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit(query);
          }}
        >
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about incidents, services, journeys, cost…"
            className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            className="flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-kpmg-dark"
          >
            Ask <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
