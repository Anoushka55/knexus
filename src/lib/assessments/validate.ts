/**
 * Development-only integrity checks.
 *
 * The content is hand-authored across five files that reference each other by
 * string id, and there is no test runner in this project. These assertions are
 * the substitute: they run once at import time in development and throw with a
 * specific message, so a mistyped agent id surfaces the moment the page loads
 * rather than as a silently missing recommendation.
 */

import { agents } from "@/data/agents";
import { challenges, priorities, solutions } from "@/data/tmtSolutions";
import { CATEGORIES } from "@/data/tmtOntology";
import type { AssessmentDefinition } from "./types";

export function assertDefinition(definition: AssessmentDefinition): void {
  const problems: string[] = [];
  const where = `[assessment:${definition.slug}]`;

  const agentIds = new Set(agents.map((a) => a.id));
  const challengeIds = new Set(challenges.map((c) => c.id));
  const priorityIds = new Set(priorities.map((p) => p.id));
  const pillarIds = new Set(solutions.map((s) => s.id));
  const categoryIds = new Set(CATEGORIES.map((c) => c.id));
  const groupIds = new Set(definition.groups.map((g) => g.id));

  if (definition.rubric.length !== 5) {
    problems.push(`rubric has ${definition.rubric.length} rungs, expected 5`);
  }
  definition.rubric.forEach((rung, i) => {
    if (rung.level !== i + 1) problems.push(`rubric[${i}] has level ${rung.level}`);
  });

  for (const group of definition.groups) {
    for (const id of group.pillarIds) {
      if (!pillarIds.has(id)) problems.push(`group "${group.id}" → unknown pillar "${id}"`);
    }
    for (const id of group.ontologyCategoryIds) {
      if (!categoryIds.has(id)) {
        problems.push(`group "${group.id}" → unknown ontology category "${id}"`);
      }
    }
    const members = definition.capabilities.filter((c) => c.groupId === group.id);
    if (members.length === 0) problems.push(`group "${group.id}" has no capabilities`);
  }

  const seen = new Set<string>();
  for (const capability of definition.capabilities) {
    if (seen.has(capability.id)) problems.push(`duplicate capability id "${capability.id}"`);
    seen.add(capability.id);

    if (!groupIds.has(capability.groupId)) {
      problems.push(`capability "${capability.id}" → unknown group "${capability.groupId}"`);
    }
    for (const id of capability.agentIds) {
      if (!agentIds.has(id)) problems.push(`capability "${capability.id}" → unknown agent "${id}"`);
    }
    for (const id of capability.challengeIds) {
      if (!challengeIds.has(id)) {
        problems.push(`capability "${capability.id}" → unknown challenge "${id}"`);
      }
    }
    for (const id of capability.priorityIds) {
      if (!priorityIds.has(id)) {
        problems.push(`capability "${capability.id}" → unknown priority "${id}"`);
      }
    }
  }

  for (const benchmark of definition.benchmarks) {
    if (!benchmark.disclosure.trim()) {
      problems.push(`benchmark "${benchmark.id}" has an empty disclosure`);
    }
    for (const capability of definition.capabilities) {
      if (!benchmark.rows[capability.id]) {
        problems.push(`benchmark "${benchmark.id}" has no row for "${capability.id}"`);
      }
    }
    for (const id of Object.keys(benchmark.rows)) {
      if (!seen.has(id)) problems.push(`benchmark "${benchmark.id}" has a stray row "${id}"`);
    }
  }

  if (!definition.benchmarks.some((b) => b.id === definition.defaultBenchmarkId)) {
    problems.push(`defaultBenchmarkId "${definition.defaultBenchmarkId}" does not exist`);
  }

  if (problems.length > 0) {
    throw new Error(`${where} content is inconsistent:\n  - ${problems.join("\n  - ")}`);
  }
}
