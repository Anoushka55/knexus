"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { useAssessmentRun } from "./AssessmentRunContext";
import { buildTemplateNarrative, narrativeFacts } from "@/lib/assessments/narrative";
import { Card } from "./Card";

/**
 * The executive read.
 *
 * Renders the deterministic template immediately, then swaps in the model's
 * prose if the call succeeds. It never shows a spinner in place of content and
 * never shows an error: a restricted account, a missing API key and a failed
 * request all land on the same complete paragraph.
 */
export function AssessmentNarrative() {
  const { outcome, opportunities, input, definition } = useAssessmentRun();

  const scope = definition.scopes.find((s) => s.id === input.scopeId)?.label ?? "Enterprise";
  const facts = useMemo(
    () => narrativeFacts(outcome, opportunities, { industry: input.industryLabel, scope }),
    [outcome, opportunities, input.industryLabel, scope],
  );

  const template = useMemo(() => buildTemplateNarrative(facts), [facts]);
  const [narrative, setNarrative] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setNarrative(null);

    // A guard, not a formality: if the model returns any number that is not in
    // the computed facts, the prose is discarded and the template stands.
    const allowed = new Set(
      JSON.stringify(facts)
        .match(/\d+(?:\.\d+)?/g)
        ?.map((n) => n) ?? [],
    );

    fetch("/api/assessments/narrative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facts }),
    })
      .then((r) => r.json())
      .then((data: { narrative?: string | null }) => {
        if (cancelled || !data.narrative) return;
        const used = data.narrative.match(/\d+(?:\.\d+)?/g) ?? [];
        if (used.some((n) => !allowed.has(n))) return;
        setNarrative(data.narrative);
      })
      .catch(() => {
        /* the template is already on screen */
      });

    return () => {
      cancelled = true;
    };
  }, [facts]);

  return (
    <Card>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900">
        <Sparkles className="h-4 w-4 text-brand-blue" />
        Executive read
      </h2>
      <p className="text-sm leading-relaxed text-slate-600">{narrative ?? template}</p>
    </Card>
  );
}
