"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Bot, User } from "lucide-react";
import { chat } from "@/lib/enterprise-architecture/client";
import { Spinner } from "@/components/enterprise-architecture/primitives";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTED = [
  "What should I do first?",
  "How do I run the Maturity Assessment?",
  "What does the ARB agent check for?",
  "How do I generate the final report?",
];

export default function AdvisoryPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "1. Welcome to the EA Intelligence Assistant.\nNEXT: Upload your application inventory (CSV/Excel) on the EA Analysis page to start Portfolio Rationalization.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await chat(next);
      setMessages((m) => [...m, { role: "assistant", content: res.response }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${e instanceof Error ? e.message : String(e)}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-5 h-[calc(100vh-3.5rem)] max-w-3xl mx-auto flex flex-col">
      <div className="mb-3">
        <h1 className="text-xl font-bold text-navy">AI Advisory</h1>
        <p className="text-xs text-muted-foreground">
          Turn-by-turn guidance through the 6-step EA Intelligence pipeline.
        </p>
      </div>

      <div className="flex-1 bg-surface border border-border rounded-ea-md flex flex-col min-h-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex gap-2 justify-end">
                <div className="max-w-[80%] rounded-ea-md px-3 py-2 text-sm border bg-background border-border">{m.content}</div>
                <div className="w-7 h-7 rounded-ea-sm bg-background border border-border flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
              </div>
            ) : (
              <div key={i} className="flex gap-2">
                <div className="w-7 h-7 rounded-ea-sm bg-navy flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="max-w-[85%] rounded-ea-md px-3 py-2.5 text-sm border bg-navy text-white border-navy whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
            ),
          )}
          {busy && (
            <div className="flex gap-2 items-center">
              <div className="w-7 h-7 rounded-ea-sm bg-navy flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-navy/5 border border-border rounded-ea-md px-3 py-2">
                <Spinner />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border p-3 shrink-0">
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {SUGGESTED.map((s) => (
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
              placeholder="Ask what to do next…"
              className="flex-1 h-10 px-3 bg-background border border-border rounded-ea-sm text-sm focus:outline-none focus:border-blue"
            />
            <button className="h-10 px-3 bg-navy text-white rounded-ea-sm flex items-center gap-1.5 text-sm">
              <Send className="w-4 h-4" /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
