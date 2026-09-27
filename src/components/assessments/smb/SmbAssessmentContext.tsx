"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  isDefaultPain,
  pains,
  type Landscape,
  type Segment,
} from "@/data/smb/assessment";
import { assessSmb, type SmbAssessmentResult } from "@/lib/smb/scoring";

const STORAGE_KEY = "smb.assessment.v1";

const DEFAULT_SEGMENT: Segment = "mid-market";
const DEFAULT_LANDSCAPE: Landscape = "no-it-team";

function defaultSelection(segment: Segment, landscape: Landscape): string[] {
  return pains.filter((p) => isDefaultPain(p, segment, landscape)).map((p) => p.id);
}

interface Ctx {
  segment: Segment;
  landscape: Landscape;
  selectedPainIds: string[];
  setSegment: (s: Segment) => void;
  setLandscape: (l: Landscape) => void;
  togglePain: (id: string) => void;
  resetToDefaults: () => void;
  result: SmbAssessmentResult;
}

const SmbCtx = createContext<Ctx | null>(null);

export function SmbAssessmentProvider({ children }: { children: ReactNode }) {
  const [segment, setSegmentState] = useState<Segment>(DEFAULT_SEGMENT);
  const [landscape, setLandscapeState] = useState<Landscape>(DEFAULT_LANDSCAPE);
  const [selectedPainIds, setSelectedPainIds] = useState<string[]>(() =>
    defaultSelection(DEFAULT_SEGMENT, DEFAULT_LANDSCAPE)
  );
  // Once the conversation has corrected a pain by hand, changing the
  // segment/landscape dropdowns should stop silently overwriting that —
  // only the still-untouched defaults should move.
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.segment) setSegmentState(saved.segment);
      if (saved.landscape) setLandscapeState(saved.landscape);
      if (Array.isArray(saved.selectedPainIds)) {
        setSelectedPainIds(saved.selectedPainIds);
        setTouched(true);
      }
    } catch {
      /* first run, or storage blocked — defaults are fine */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ segment, landscape, selectedPainIds }));
    } catch {
      /* storage blocked — the session still works, it just won't persist */
    }
  }, [segment, landscape, selectedPainIds]);

  function setSegment(s: Segment) {
    setSegmentState(s);
    if (!touched) setSelectedPainIds(defaultSelection(s, landscape));
  }

  function setLandscape(l: Landscape) {
    setLandscapeState(l);
    if (!touched) setSelectedPainIds(defaultSelection(segment, l));
  }

  function togglePain(id: string) {
    setTouched(true);
    setSelectedPainIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  function resetToDefaults() {
    setTouched(false);
    setSelectedPainIds(defaultSelection(segment, landscape));
  }

  const result = useMemo(() => assessSmb(selectedPainIds), [selectedPainIds]);

  return (
    <SmbCtx.Provider
      value={{
        segment,
        landscape,
        selectedPainIds,
        setSegment,
        setLandscape,
        togglePain,
        resetToDefaults,
        result,
      }}
    >
      {children}
    </SmbCtx.Provider>
  );
}

export function useSmbAssessment() {
  const ctx = useContext(SmbCtx);
  if (!ctx) throw new Error("useSmbAssessment must be used inside SmbAssessmentProvider");
  return ctx;
}
