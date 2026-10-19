import { cn } from "../utils";
import { Sparkles } from "lucide-react";

interface Props {
  text: string;
  sentiment?: "positive" | "negative" | "neutral";
  className?: string;
}

export function AgentInsightCard({ text, sentiment = "neutral", className }: Props) {
  const toneClass =
    sentiment === "positive" ? "border-success/30 bg-success/5"
    : sentiment === "negative" ? "border-critical/30 bg-critical/5"
    : "border-teal/30 bg-teal/5";

  const dotClass =
    sentiment === "positive" ? "bg-success"
    : sentiment === "negative" ? "bg-critical"
    : "bg-teal";

  return (
    <div className={cn("rounded-xl border-l-4 px-4 py-3 flex items-start gap-3 backdrop-blur-sm", toneClass, className)}>
      <div className="flex-shrink-0 mt-0.5 relative">
        <Sparkles size={18} className="text-teal" />
        <span className={cn("absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-dp-pulse-soft", dotClass)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono uppercase tracking-widest text-teal font-bold mb-0.5">
          Agent Insight
        </div>
        <div className="text-sm text-navy leading-relaxed">{text}</div>
      </div>
    </div>
  );
}
