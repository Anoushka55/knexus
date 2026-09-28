"use client";

import { ResultsCockpit } from "@/components/assessments/results/ResultsCockpit";

/**
 * The cockpit owns its own full-height layout, so this route renders it bare —
 * no header band, no step footer, nothing that could push it past one viewport.
 */
export default function ResultsPage() {
  return <ResultsCockpit />;
}
