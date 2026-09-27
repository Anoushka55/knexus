"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, ExternalLink } from "lucide-react";

interface AgentCard {
  id: string;
  title: string;
  description: string;
  accuracy: number;
  live: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  agents?: AgentCard[];
}

const WELCOME: Message = {
  role: "assistant",
  content: "Hello! What business challenge can I help you solve today?",
};

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      // Build history for API: skip welcome, convert assistant messages to plain text
      const apiMessages = updated.slice(1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply ?? "Here's what I found.",
          agents: data.agents ?? [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* ── Chat panel ── */}
      {open && (
        <div
          data-chatbot
          className="fixed right-5 z-50 flex flex-col w-[420px] max-w-[calc(100vw-1.5rem)]"
          style={{
            bottom: "5.5rem",
            maxHeight: "calc(100vh - 7rem)",
            borderRadius: "16px",
            background: "#0f172a",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{
              background: "linear-gradient(135deg, #1a3a8f 0%, #1e40af 100%)",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/d/db/KPMG_blue_logo.svg"
                alt="KPMG"
                width={22}
                height={22}
                style={{ objectFit: "contain" }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">K Nexus - AI Assistant</p>
              <p className="text-blue-200 text-xs">Powered by KPMG</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#334155 transparent" }}
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-2"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-white shrink-0 mt-0.5 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/d/db/KPMG_blue_logo.svg"
                      alt="KPMG"
                      width={14}
                      height={14}
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-2">
                  {/* Text bubble */}
                  <div className={msg.role === "user" ? "flex justify-end" : ""}>
                    <div
                      className={`inline-block text-sm leading-relaxed px-3.5 py-2.5 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-sm max-w-[85%]"
                          : "text-slate-200 rounded-tl-sm"
                      }`}
                      style={
                        msg.role === "assistant"
                          ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }
                          : {}
                      }
                    >
                      {msg.content}
                    </div>
                  </div>

                  {/* Agent cards */}
                  {msg.agents && msg.agents.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs text-slate-400 font-medium px-1">
                        Here are some agents that should give you a head start
                      </p>
                      {msg.agents.map((agent) => (
                        <a
                          key={agent.id}
                          href={`/agents/${agent.id}`}
                          className="block rounded-xl p-3 transition-all group"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.09)",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(29,78,216,0.18)";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.4)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)";
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white text-xs font-semibold group-hover:text-blue-300 transition-colors truncate">
                                  {agent.title}
                                </span>
                                <span
                                  className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    agent.live
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : "bg-slate-500/20 text-slate-400"
                                  }`}
                                >
                                  {agent.live ? "LIVE" : "SOON"}
                                </span>
                              </div>
                              <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                                {agent.description}
                              </p>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                              <ExternalLink size={12} className="text-slate-500 group-hover:text-blue-400 transition-colors mt-0.5" />
                              <span className="text-[10px] text-slate-500 font-medium">{agent.accuracy}%</span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start gap-2">
                <div className="w-6 h-6 rounded-full bg-white shrink-0 mt-0.5 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/d/db/KPMG_blue_logo.svg"
                    alt="KPMG"
                    width={14}
                    height={14}
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <div
                  className="rounded-2xl rounded-tl-sm px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <Loader2 size={15} className="text-blue-400 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="px-3 py-3 shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div
              className="flex items-end gap-2 rounded-xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about our AI agents..."
                rows={1}
                className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 resize-none outline-none leading-relaxed"
                style={{ maxHeight: "80px", overflowY: "auto" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: input.trim() && !loading ? "#1d4ed8" : "rgba(255,255,255,0.07)",
                  color: input.trim() && !loading ? "white" : "#475569",
                }}
                aria-label="Send message"
              >
                <Send size={14} />
              </button>
            </div>
            <p className="text-slate-600 text-[10px] text-center mt-1.5">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      {/* ── Floating button ── */}
      <div data-chatbot className="fixed bottom-6 right-5 z-50">
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{ border: "2px solid rgba(29,78,216,0.55)", animationDuration: "2s" }}
        />
        <span
          className="absolute rounded-full animate-ping"
          style={{
            inset: "-5px",
            border: "2px solid rgba(29,78,216,0.25)",
            animationDuration: "2s",
            animationDelay: "0.6s",
          }}
        />
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Open K Nexus AI Assistant"
          className="relative w-14 h-14 rounded-full bg-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          style={{ boxShadow: "0 0 0 3px #1d4ed8, 0 8px 28px rgba(29,78,216,0.55)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/d/db/KPMG_blue_logo.svg"
            alt="KPMG AI Assistant"
            width={34}
            height={34}
            style={{ objectFit: "contain" }}
          />
        </button>
      </div>
    </>
  );
}
