import type { RubricRung } from "@/lib/assessments/types";

/**
 * The shared five-rung spine, authored once and reused by every assessment.
 *
 * Both scales are rated against the same rungs so they can sit on one chart
 * axis, but they measure different things: `business` is how well the capability
 * is run at all, `agentic` is how much of it agents carry. An organisation can
 * be strong on one and weak on the other, and the gap between them is usually
 * the interesting part of the conversation.
 *
 * `coordinate` is what turns a rung into an agent query: an agent is a lever for
 * reaching this rung only if it reaches this scope and autonomy. Level 1 has no
 * coordinate because level 1 means a person does this unaided.
 */
export const MATURITY_RUBRIC: RubricRung[] = [
  {
    level: 1,
    name: "Ad hoc",
    business:
      "Done by hand, differently each time. No owner, no defined process, and no data captured that anyone reviews.",
    agentic: "No AI or ML involvement. People do the work end to end.",
    coordinate: null,
  },
  {
    level: 2,
    name: "Emerging",
    business:
      "A documented process exists and is mostly followed, but it depends on individuals and spreadsheets. Reporting is after the fact.",
    agentic:
      "Point tools assist individual tasks — extraction, drafting, summarising. A person initiates each run and checks the output.",
    coordinate: { scope: 1, autonomy: 1 },
  },
  {
    level: 3,
    name: "Defined",
    business:
      "The process is owned, instrumented and repeatable across teams. Performance is measured against targets rather than described.",
    agentic:
      "Agents run multi-step workflows and surface recommendations, executing once a person approves. Coverage is real but bounded to one function.",
    coordinate: { scope: 3, autonomy: 2 },
  },
  {
    level: 4,
    name: "Managed",
    business:
      "The process runs predictably across functions, with exceptions routed and root causes addressed rather than re-worked.",
    agentic:
      "Agents act inside defined guardrails without waiting for approval, escalating only what is uncertain, and coordinate across system boundaries.",
    coordinate: { scope: 3, autonomy: 3 },
  },
  {
    level: 5,
    name: "Optimising",
    business:
      "The capability improves itself — outcomes are tracked to value, and the operating model adapts on evidence rather than on annual cycles.",
    agentic:
      "Agents orchestrate the end-to-end outcome across processes and act on long-running signals, with humans setting intent and reviewing exceptions.",
    coordinate: { scope: 4, autonomy: 3 },
  },
];
