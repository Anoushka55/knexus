"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, Loader2, Send, User } from "lucide-react";
import { useSession } from "@/lib/portfolio-rationalization/session";
import { sendChatMessage } from "@/lib/portfolio-rationalization/client";
import { SectionCard } from "../_components";

const CHIPS = [
  "Which tools should we retire?",
  "Identify APM stack duplication",
  "Create a telecom CMP rationalization roadmap",
  "What's our biggest cost-saving opportunity?",
  "Summarise our highest-risk tools",
];

export default function AdvisorPage() {
  const pathname = usePathname();
  const { tools, chatHistory, addChatMessage, phase, assessment, wizard } = useSession();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    setInput("");
    setError("");
    addChatMessage({ role: "user", content: message });
    setLoading(true);
    try {
      const reply = await sendChatMessage(message, chatHistory, tools, {
        current_tab: pathname ?? undefined,
        current_phase: phase,
        tools_loaded: tools.length,
        assessment_done: !!assessment,
        organisation: wizard.org.organisation,
        industry: wizard.org.industry,
      });
      addChatMessage({ role: "assistant", content: reply });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      queueMicrotask(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto h-[calc(100vh-56px)] flex flex-col">
      <SectionCard className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--ptr-border)] mb-3">
          <Bot className="w-5 h-5 text-[var(--ptr-navy)]" />
          <h3 className="text-sm font-bold text-[var(--ptr-navy)]">AI Advisor</h3>
          <span className="text-xs text-[var(--ptr-muted)] ml-auto">{tools.length} tools in context</span>
        </div>

        <div className="flex gap-2 flex-wrap mb-3">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => send(c)}
              className="text-[11px] px-2.5 py-1.5 rounded-full border border-[var(--ptr-border)] text-[var(--ptr-navy)] hover:bg-[var(--ptr-background)]"
            >
              {c}
            </button>
          ))}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto ptr-scroll space-y-3 pr-1 min-h-[200px]">
          {chatHistory.length === 0 && (
            <div className="text-center text-sm text-[var(--ptr-muted)] py-10">
              Ask anything about your tool portfolio, rationalization decisions, or the 6R model.
            </div>
          )}
          {chatHistory.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-[var(--ptr-navy)] text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                  m.role === "user" ? "bg-[var(--ptr-navy)] text-white" : "bg-[var(--ptr-background)] text-[var(--ptr-text)]"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-[var(--ptr-border)] text-[var(--ptr-navy)] flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[var(--ptr-navy)] text-white flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="rounded-lg px-3.5 py-2.5 bg-[var(--ptr-background)] flex items-center gap-2 text-sm text-[var(--ptr-muted)]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-[var(--ptr-red)] mt-2">{error}</p>}

        <div className="flex gap-2 pt-3 border-t border-[var(--ptr-border)] mt-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={2}
            className="ptr-input resize-none flex-1"
            placeholder="Ask anything — 'Which tools should we retire?', 'Identify APM stack duplication'…"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="h-auto px-4 rounded-md bg-[var(--ptr-navy)] text-white text-sm font-semibold disabled:opacity-40 flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
