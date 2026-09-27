"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  AnswerPatch,
  AssessmentDefinition,
  AssessmentRunInput,
  Level,
  Scale,
} from "@/lib/assessments/types";
import { assess, createRunInput, type AssessmentOutcome } from "@/lib/assessments/scoring";
import { decodeRun, SHARE_PARAM } from "@/lib/assessments/share";
import {
  recommendOpportunities,
  type OpportunityResult,
} from "@/lib/assessments/opportunities";

/**
 * Holds one run.
 *
 * Mounted at [slug]/layout.tsx, above every step route, so state survives the
 * whole flow without a store and navigating between results views never
 * recomputes. Persistence is localStorage only — this project has no server
 * storage — hydrated after mount so server and client markup agree on the first
 * paint.
 */

interface RunContextValue {
  definition: AssessmentDefinition;
  input: AssessmentRunInput;
  outcome: AssessmentOutcome;
  opportunities: OpportunityResult;
  /** True once the grid has been reviewed, which is what unlocks Results. */
  isComplete: boolean;
  setField: (patch: Partial<AssessmentRunInput>) => void;
  setAnswer: (capabilityId: string, scale: Scale | "target", level: Level) => void;
  clearAnswer: (capabilityId: string) => void;
  markComplete: () => void;
  reset: () => void;
}

const RunContext = createContext<RunContextValue | null>(null);

function storageKey(definition: AssessmentDefinition) {
  // Versioned by content too: if capability ids change, an old saved run would
  // silently resolve against rows that no longer exist.
  return `assessment.${definition.slug}.v${definition.contentVersion}`;
}

export function AssessmentRunProvider({
  definition,
  children,
}: {
  definition: AssessmentDefinition;
  children: React.ReactNode;
}) {
  const [input, setInput] = useState<AssessmentRunInput>(() => createRunInput(definition));

  useEffect(() => {
    // A share link wins over whatever is in storage: someone who opened a link
    // means to see that run, not the one they last worked on.
    try {
      const token = new URLSearchParams(window.location.search).get(SHARE_PARAM);
      const shared = token ? decodeRun(token, definition) : null;
      if (shared) {
        setInput({ ...createRunInput(definition), ...shared });
        return;
      }
    } catch {
      /* malformed link — fall through to storage */
    }

    try {
      const raw = localStorage.getItem(storageKey(definition));
      if (raw) {
        const saved = JSON.parse(raw) as Partial<AssessmentRunInput>;
        // Spread over defaults so a newly added field does not break a saved run.
        setInput({ ...createRunInput(definition), ...saved });
      }
    } catch {
      /* first run, or storage blocked — defaults are fine */
    }
  }, [definition]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(definition), JSON.stringify(input));
    } catch {
      /* storage blocked — the session still works, it just will not persist */
    }
  }, [definition, input]);

  const outcome = useMemo(() => assess(definition, input), [definition, input]);
  const opportunities = useMemo(() => recommendOpportunities(outcome), [outcome]);

  const value = useMemo<RunContextValue>(
    () => ({
      definition,
      input,
      outcome,
      opportunities,
      isComplete: input.completedOn !== null,
      setField: (patch) => setInput((prev) => ({ ...prev, ...patch })),
      setAnswer: (capabilityId, scale, level) =>
        setInput((prev) => {
          const existing: AnswerPatch = prev.answers[capabilityId] ?? {};
          return {
            ...prev,
            answers: { ...prev.answers, [capabilityId]: { ...existing, [scale]: level } },
          };
        }),
      clearAnswer: (capabilityId) =>
        setInput((prev) => {
          const answers = { ...prev.answers };
          delete answers[capabilityId];
          return { ...prev, answers };
        }),
      markComplete: () =>
        setInput((prev) => ({
          ...prev,
          completedOn: prev.completedOn ?? new Date().toISOString(),
        })),
      reset: () => setInput(createRunInput(definition)),
    }),
    [definition, input, outcome, opportunities],
  );

  return <RunContext.Provider value={value}>{children}</RunContext.Provider>;
}

export function useAssessmentRun(): RunContextValue {
  const value = useContext(RunContext);
  if (!value) {
    throw new Error("useAssessmentRun must be used inside an AssessmentRunProvider");
  }
  return value;
}
