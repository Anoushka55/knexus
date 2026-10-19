"use client";
import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

interface Props {
  steps: string[];
  onComplete: () => void;
  stepDuration?: number;
}

export function AgentThinking({ steps, onComplete, stepDuration = 600 }: Props) {
  const [index, setIndex] = useState(0);
  // Stable ref so onComplete never goes into the effect dependency array
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (index >= steps.length) {
      onCompleteRef.current();
      return;
    }
    const t = setTimeout(() => setIndex((i) => i + 1), stepDuration);
    return () => clearTimeout(t);
  }, [index, steps.length, stepDuration]);

  const label = steps[Math.min(index, steps.length - 1)];

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-shrink-0">
        <Sparkles size={13} className="text-teal animate-dp-pulse-soft" />
      </div>
      <span className="text-[10px] font-mono uppercase tracking-widest text-teal font-bold">
        {label}
      </span>
    </div>
  );
}
