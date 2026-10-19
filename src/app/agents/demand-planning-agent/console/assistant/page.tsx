"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/lib/demand-planning/ui/Card";
import { Button } from "@/lib/demand-planning/ui/Button";
import { AgentThinking } from "@/lib/demand-planning/ui/AgentThinking";
import { answerQuestion, AssistantResponse, SUGGESTED_QUESTIONS } from "@/lib/demand-planning/data/assistant";
import { Send, Bot, User, Sparkles, ArrowRight } from "lucide-react";
import { useDataContext } from "@/lib/demand-planning/state/dataContext";

const BASE = "/agents/demand-planning-agent/console";

const THINKING_POOL = [
  "Reading demand records...",
  "Checking override log...",
  "Applying classification rules...",
  "Computing confidence...",
  "Formatting response...",
  "Scanning forecast data...",
  "Cross-referencing periods...",
];

function pickSteps(): string[] {
  const shuffled = [...THINKING_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

interface Msg {
  role: "user" | "agent";
  text: string;
  details?: Array<{ label: string; value: string }>;
  navigateTo?: { label: string; href: string };
  thinking?: boolean;
  thinkingSteps?: string[];
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="font-bold text-navy">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
}

export default function AssistantPage() {
  const { activeDataset } = useDataContext();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "agent",
      text: "Hi, I'm your DemandIQ assistant. Ask me about forecast accuracy, exceptions, segments, or any specific SKU. Try one of the suggested questions below.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const pendingRef = useRef<AssistantResponse | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (q?: string) => {
    const text = (q ?? input).trim();
    if (!text || isThinking) return;
    const res = answerQuestion(text, activeDataset);
    pendingRef.current = res;
    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      { role: "agent", text: "", thinking: true, thinkingSteps: pickSteps() },
    ]);
    setIsThinking(true);
    setInput("");
  };

  const handleThinkingComplete = () => {
    const res = pendingRef.current;
    if (!res) return;
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy.length - 1;
      if (copy[last]?.thinking) {
        copy[last] = { role: "agent", text: res.text, details: res.details, navigateTo: res.navigateTo };
      }
      return copy;
    });
    setIsThinking(false);
    pendingRef.current = null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-h-[900px]">
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-widest text-coral font-bold">Conversational Layer</div>
        <h1 className="text-3xl font-extrabold text-navy mt-1 flex items-center gap-2">
          <Bot className="text-coral" size={28} /> AI Assistant
        </h1>
        <p className="text-sm text-muted mt-1">Ask the DemandIQ Agent about your data in plain English.</p>
      </div>

      <Card className="flex-1 flex flex-col min-h-0 p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((m, i) => (
            <MessageBubble key={i} m={m} onThinkingComplete={handleThinkingComplete} />
          ))}
          <div ref={endRef} />
        </div>

        {/* Suggested questions */}
        <div className="border-t border-[#E7DDCB] bg-cream/40 px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
            <Sparkles size={11} className="text-coral" /> Suggested Questions
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.slice(0, 5).map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="text-xs text-navy bg-white border border-[#E7DDCB] hover:border-coral hover:bg-coral/5 px-3 py-1.5 rounded-full transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-[#E7DDCB] p-3 flex items-center gap-2 bg-white">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
            placeholder="Ask anything about your demand data..."
            className="flex-1 px-4 py-2.5 bg-cream border border-[#E7DDCB] rounded-lg text-sm text-navy focus:outline-none focus:ring-2 focus:ring-coral/30"
          />
          <Button variant="primary" onClick={() => send()} disabled={!input.trim() || isThinking}>
            <Send size={14} /> Send
          </Button>
        </div>
      </Card>
    </div>
  );
}

function MessageBubble({ m, onThinkingComplete }: { m: Msg; onThinkingComplete: () => void }) {
  const router = useRouter();
  const isUser = m.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? "bg-coral text-white" : "bg-teal text-white"}`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
          isUser ? "bg-coral text-white rounded-tr-sm" : "bg-cream border border-[#E7DDCB] text-navy rounded-tl-sm"
        }`}>
          {m.thinking
            ? <AgentThinking steps={m.thinkingSteps ?? ["Thinking..."]} onComplete={onThinkingComplete} stepDuration={600} />
            : isUser ? m.text : renderInline(m.text)
          }
        </div>
        {!m.thinking && m.details && m.details.length > 0 && (
          <div className="bg-white border border-[#E7DDCB] rounded-lg p-2.5 mt-1 grid grid-cols-3 gap-3">
            {m.details.map((d, i) => (
              <div key={i}>
                <div className="text-[10px] uppercase tracking-wider font-bold text-muted">{d.label}</div>
                <div className="text-sm font-bold text-navy">{d.value}</div>
              </div>
            ))}
          </div>
        )}
        {!m.thinking && !isUser && m.navigateTo && (
          <div className="mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`${BASE}${m.navigateTo!.href}`)}
            >
              {m.navigateTo.label} <ArrowRight size={13} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
