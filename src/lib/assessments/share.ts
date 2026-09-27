import type { AnswerPatch, AssessmentDefinition, AssessmentRunInput, Level } from "./types";

/**
 * Shareable result links.
 *
 * This project has no server storage, so a result travels in the URL rather
 * than behind an id. Answers are encoded positionally against the definition's
 * capability order and the keys are single letters, because the obvious
 * encoding — the answers object as-is — produces a 2,600-character URL for a
 * fully corrected 28-capability run, past the ~2,000 many proxies still
 * truncate at. Positionally it is around 520.
 *
 * Dropping the ids is only safe because `contentVersion` guards it: the type
 * requires it to be bumped whenever capability ids *or their order* change, and
 * decode refuses a payload whose version does not match.
 *
 * The same base64url scheme as src/lib/sso.ts, reimplemented here because those
 * helpers are private to that module and this one also runs in the browser.
 */

export const SHARE_PARAM = "s";

/** null in a slot means "this capability was left on the benchmark". */
type Slot = [number, number, number] | null;

interface SharedRun {
  v: number;
  b: string;
  s: string;
  i: string;
  c: string | null;
  a: Slot[];
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** 0 encodes "not corrected on this field", so the sparseness survives the trip. */
function slotFor(patch: AnswerPatch | undefined): Slot {
  if (!patch) return null;
  const slot: [number, number, number] = [
    patch.business ?? 0,
    patch.agentic ?? 0,
    patch.target ?? 0,
  ];
  return slot.some((n) => n !== 0) ? slot : null;
}

export function encodeRun(input: AssessmentRunInput, definition: AssessmentDefinition): string {
  const payload: SharedRun = {
    v: definition.contentVersion,
    b: input.benchmarkId,
    s: input.scopeId,
    i: input.industryLabel,
    c: input.completedOn,
    a: definition.capabilities.map((c) => slotFor(input.answers[c.id])),
  };
  return toBase64Url(JSON.stringify(payload));
}

function levelOrUndefined(n: unknown): Level | undefined {
  return typeof n === "number" && n >= 1 && n <= 5 ? (n as Level) : undefined;
}

/**
 * Returns null on anything unexpected — a truncated link, a run authored
 * against a different capability set, or a payload that is not ours. A bad
 * share link falls back to a fresh run; it never throws on the page.
 */
export function decodeRun(
  token: string,
  definition: AssessmentDefinition,
): Partial<AssessmentRunInput> | null {
  try {
    const parsed = JSON.parse(fromBase64Url(token)) as SharedRun;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.v !== definition.contentVersion) return null;
    if (!Array.isArray(parsed.a) || parsed.a.length !== definition.capabilities.length) {
      return null;
    }

    const answers: Record<string, AnswerPatch> = {};
    parsed.a.forEach((slot, index) => {
      if (!Array.isArray(slot)) return;
      const patch: AnswerPatch = {};
      const business = levelOrUndefined(slot[0]);
      const agentic = levelOrUndefined(slot[1]);
      const target = levelOrUndefined(slot[2]);
      if (business) patch.business = business;
      if (agentic) patch.agentic = agentic;
      if (target) patch.target = target;
      if (Object.keys(patch).length > 0) {
        answers[definition.capabilities[index].id] = patch;
      }
    });

    return {
      benchmarkId: parsed.b,
      scopeId: parsed.s,
      industryLabel: parsed.i,
      completedOn: parsed.c ?? null,
      answers,
    };
  } catch {
    return null;
  }
}
