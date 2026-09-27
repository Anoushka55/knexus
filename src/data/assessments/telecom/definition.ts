import type { AssessmentDefinition } from "@/lib/assessments/types";
import { MATURITY_RUBRIC } from "@/data/assessments/rubric";
import { TELECOM_GROUPS } from "./groups";
import { TELECOM_CAPABILITIES } from "./capabilities";
import { TELECOM_BENCHMARKS } from "./benchmark";

export const telecomAssessment: AssessmentDefinition = {
  slug: "telecom-ai-agentic-maturity",
  title: "Telecom AI & Agentic Maturity Assessment",
  kicker: "Telecommunications",
  summary:
    "Scores 28 capabilities across six groups on two scales — how well the capability is run, and how much of it agents carry — then names the agents that close the largest gaps.",
  status: "live",
  depth: "deep",
  estimateMinutes: 25,
  iconName: "Radar",
  scopes: [
    {
      id: "enterprise",
      label: "Enterprise Level",
      note: "The operator as a whole, across markets and business units.",
    },
    {
      id: "business-unit",
      label: "Business Unit",
      note: "One market, segment or operating company.",
    },
    {
      id: "function",
      label: "Function",
      note: "A single function — network, care, commercial or technology.",
    },
  ],
  rubric: MATURITY_RUBRIC,
  groups: TELECOM_GROUPS,
  capabilities: TELECOM_CAPABILITIES,
  benchmarks: TELECOM_BENCHMARKS,
  defaultBenchmarkId: "telecom-enterprise",
  contentVersion: 1,
};
