import {
  actionById,
  alertCountOf,
  buildEvents,
  domainById,
  getProblem,
  getProblems,
  kpis,
  predictions,
  serviceHealth,
  serviceName,
  siteById,
} from "./index";
import { playbookById } from "./predictions";

/**
 * Operational copilot.
 *
 * Replies are composed from the centralized dataset by deterministic intent
 * matching. No external service is called and no model runs in the browser:
 * the agent reads the same numbers the rest of the application renders.
 */

export interface AgentFact {
  label: string;
  value: string;
}

export interface AgentAction {
  label: string;
  /** "execute" advances the simulated remediation conversation. */
  kind: "execute" | "verify" | "link";
  to?: string;
}

export interface AgentResponse {
  text: string;
  facts?: AgentFact[];
  bullets?: string[];
  confidence?: number;
  action?: AgentAction;
  simulated?: boolean;
  /** Marks the message as the outcome of a simulated action. */
  verification?: boolean;
}

export const suggestedQuestions = [
  "Why is SD-WAN health declining in Mumbai?",
  "Which services are currently at SLA risk?",
  "What caused the largest incident today?",
  "What incidents can we predict?",
  "What action do you recommend for WAN-EDGE-MUM-07?",
  "What happens if we do nothing?",
];

type Intent =
  | "sdwan_health"
  | "sla_risk"
  | "largest_incident"
  | "predictions"
  | "recommend"
  | "do_nothing"
  | "execute"
  | "verify"
  | "cloud"
  | "security"
  | "summary";

const intentKeywords: Record<Intent, string[]> = {
  sdwan_health: ["sd-wan", "sdwan", "mumbai", "declining", "wan health"],
  sla_risk: ["sla", "at risk", "breach", "threshold"],
  largest_incident: ["largest", "biggest", "worst", "caused", "today"],
  predictions: ["predict", "forecast", "future", "going to", "next"],
  recommend: ["recommend", "what should", "best action", "wan-edge-mum-07", "advise"],
  do_nothing: ["do nothing", "nothing", "if we wait", "no action"],
  execute: ["execute", "run it", "do it", "go ahead", "approve", "failover", "fail over"],
  verify: ["verify", "did it work", "confirm", "check"],
  cloud: ["cloud", "capacity", "cpu", "memory", "saturation", "pune"],
  security: ["security", "anomaly", "endpoint", "firewall", "soc", "delhi", "authentication"],
  summary: [],
};

function detect(question: string, lastIntent: Intent | null): Intent {
  const q = question.toLowerCase();

  // "What do you recommend?" and "Execute it." depend on what came before.
  if (/^(what do you recommend|what now|and then)/.test(q.trim())) return "recommend";

  let best: Intent = "summary";
  let bestScore = 0;
  for (const [intent, words] of Object.entries(intentKeywords) as [Intent, string[]][]) {
    const score = words.reduce((acc, w) => (q.includes(w) ? acc + w.length : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }

  if (best === "summary" && lastIntent === "execute") return "verify";
  return best;
}

export interface AgentContext {
  shift: number;
  /** Intent of the previous exchange, used for follow-up questions. */
  lastIntent: Intent | null;
}

export interface AgentResult {
  response: AgentResponse;
  intent: Intent;
}

export function ask(question: string, ctx: AgentContext): AgentResult {
  const intent = detect(question, ctx.lastIntent);
  return { response: build(intent, ctx), intent };
}

function build(intent: Intent, ctx: AgentContext): AgentResponse {
  const { shift } = ctx;
  const k = kpis(shift);

  switch (intent) {
    case "sdwan_health": {
      const p = getProblem("INC-4417", shift);
      if (!p) break;
      const sites = new Set(
        buildEvents(shift)
          .filter((e) => e.scenarioId === "sdwan")
          .map((e) => e.siteId),
      );
      return {
        text: `I found ${p.correlatedEventCount} correlated events across ${sites.size} sites. The dominant pattern is increasing packet loss and latency on the primary WAN path at ${p.siteId}. ${p.impact.affectedServiceIds.length} enterprise services are approaching their SLA threshold.`,
        facts: [
          { label: "Problem", value: `${p.id} · ${p.rootCause}` },
          { label: "Component", value: p.deviceId },
          {
            label: "Correlated events",
            value: `${p.correlatedEventCount} across ${alertCountOf(p)} alerts`,
          },
          { label: "AI confidence", value: `${p.aiConfidence}%` },
        ],
        bullets: [
          "Packet loss, latency, jitter and interface errors are rising together on one circuit.",
          "The secondary path at Mumbai-05 is unaffected, which rules out a shared upstream fault.",
          `Affected: ${p.impact.affectedServiceIds.map(serviceName).join(", ")}.`,
        ],
        confidence: p.aiConfidence,
        action: {
          label: "Open INC-4417 in Correlation Explorer",
          kind: "link",
          to: "/agents/aiops-sentry/console/correlation",
        },
      };
    }

    case "sla_risk": {
      const health = serviceHealth(shift).filter((h) => h.slaRisk !== "Within SLA");
      const problems = getProblems(shift).filter(
        (p) => p.status !== "Resolved" && p.slaRisk !== "Within SLA",
      );
      return {
        text: `${health.length} services are currently carrying SLA risk, driven by ${problems.length} active problems.`,
        facts: health.slice(0, 5).map((h) => ({
          label: h.name,
          value: `${h.slaRisk} · health ${h.score}`,
        })),
        bullets: problems.map((p) => `${p.id} — ${p.slaDetail}`),
        action: { label: "Open Problems workspace", kind: "link", to: "/agents/aiops-sentry/console/problems" },
      };
    }

    case "largest_incident": {
      const problems = getProblems(shift)
        .filter((p) => p.status !== "Resolved")
        .sort((a, b) => b.correlatedEventCount - a.correlatedEventCount);
      const top = problems[0];
      if (!top) break;
      return {
        text: `The largest active problem is ${top.id}: ${top.title}. It absorbed ${top.correlatedEventCount} events into a single incident.`,
        facts: [
          { label: "Probable root cause", value: top.rootCause },
          { label: "AI confidence", value: `${top.aiConfidence}%` },
          { label: "Customers affected", value: top.impact.affectedCustomerIds.join(", ") },
          { label: "Users affected", value: top.impact.usersAffected.toLocaleString() },
        ],
        bullets: [top.rootCauseNarrative],
        confidence: top.aiConfidence,
      };
    }

    case "predictions": {
      const nearest = [...predictions].sort((a, b) => a.minutesToImpact - b.minutesToImpact)[0];
      return {
        text: `I am tracking ${predictions.length} degradation patterns projected to cause impact. The nearest is ${nearest.deviceId} on ${serviceName(nearest.serviceId)} at ${nearest.probability}% probability, roughly ${nearest.minutesToImpact} minutes out.`,
        facts: predictions.map((p) => ({
          label: `${p.deviceId} · ${serviceName(p.serviceId)}`,
          value: `${p.probability}% · ${p.minutesToImpact} min`,
        })),
        bullets: [nearest.explanation],
        action: { label: "Open Predictive AI", kind: "link", to: "/agents/aiops-sentry/console/predictive" },
      };
    }

    case "recommend": {
      const p = getProblem("INC-4417", shift);
      const action = p ? actionById[p.recommendedActionId] : undefined;
      if (!p || !action) break;
      return {
        text: `The highest-confidence action is to fail over critical traffic to the secondary WAN path. AI confidence: ${action.confidence}%.`,
        facts: [
          { label: "Action", value: action.title },
          { label: "Target", value: `${p.deviceId} → WAN-EDGE-MUM-12` },
          { label: "Approval", value: action.approval },
          { label: "Expected outcome", value: action.expectedOutcome },
        ],
        bullets: [action.detail],
        confidence: action.confidence,
        action: { label: "Execute (simulated)", kind: "execute" },
      };
    }

    case "do_nothing": {
      const pred = predictions[0];
      const p = getProblem("INC-4417", shift);
      return {
        text: `If no action is taken, the current trend reaches service-affecting levels in about ${pred.minutesToImpact} minutes at ${pred.probability}% probability.`,
        facts: [
          { label: "Time to impact", value: `${pred.minutesToImpact} minutes` },
          { label: "Probability", value: `${pred.probability}%` },
          { label: "Severity if unhandled", value: pred.severityIfUnhandled },
          { label: "SLA position", value: p ? p.slaDetail : "3 services approaching threshold" },
        ],
        bullets: [
          pred.preventedImpact,
          "The secondary WAN path currently has the headroom to absorb the critical traffic classes.",
        ],
        confidence: pred.probability,
        action: { label: "Execute recommended action (simulated)", kind: "execute" },
      };
    }

    case "execute": {
      const pb = playbookById["PB-01"];
      return {
        text: "Simulation: traffic failover initiated. Critical traffic classes are being re-pointed from WAN-EDGE-MUM-07 to the secondary path on WAN-EDGE-MUM-12.",
        facts: [
          { label: "Playbook", value: `${pb.id} · ${pb.name}` },
          { label: "Approval", value: pb.approval },
          { label: "Mode", value: "Simulated execution" },
          { label: "Verification", value: pb.verification },
        ],
        simulated: true,
        action: { label: "Show verification", kind: "verify" },
      };
    }

    case "verify": {
      return {
        text: "Simulation verified: packet loss reduced and service health restored.",
        facts: [
          { label: "Packet loss", value: "3.4% → 0.11%" },
          { label: "Latency", value: "124ms → 42ms" },
          { label: "Services back inside SLA", value: "3 of 3" },
          { label: "Engineer time saved", value: "34 minutes" },
        ],
        bullets: [
          "No infrastructure was changed. This is a simulated outcome shown for the demonstration.",
        ],
        simulated: true,
        verification: true,
      };
    }

    case "cloud": {
      const p = getProblem("INC-4420", shift);
      const pred = predictions.find((x) => x.scenarioId === "cloud");
      if (!p || !pred) break;
      return {
        text: `${serviceName(p.serviceId)} at ${p.siteId} is building toward capacity saturation on ${p.deviceId}. I put this at ${pred.probability}% probability of degradation, roughly ${pred.minutesToImpact} minutes out.`,
        facts: [
          { label: "Problem", value: `${p.id} · ${p.rootCause}` },
          { label: "AI confidence", value: `${p.aiConfidence}%` },
          {
            label: "Correlated events",
            value: `${p.correlatedEventCount} across ${alertCountOf(p)} alerts`,
          },
          { label: "Recommended action", value: actionById[p.recommendedActionId].title },
        ],
        bullets: [pred.explanation],
        confidence: pred.probability,
      };
    }

    case "security": {
      const p = getProblem("INC-4418", shift);
      if (!p) break;
      return {
        text: `Authentication failures, firewall blocks and endpoint anomalies at ${p.siteId} are rising together. I correlated them into ${p.id} as a ${p.rootCause.toLowerCase()}.`,
        facts: [
          { label: "AI confidence", value: `${p.aiConfidence}%` },
          {
            label: "Correlated events",
            value: `${p.correlatedEventCount} across ${alertCountOf(p)} alerts`,
          },
          { label: "Primary endpoint", value: p.deviceId },
          { label: "Recommended action", value: actionById[p.recommendedActionId].title },
        ],
        bullets: [p.rootCauseNarrative],
        confidence: p.aiConfidence,
      };
    }

    default:
      break;
  }

  // Situational summary.
  const worst = getProblems(shift)
    .filter((p) => p.status !== "Resolved")
    .sort((a, b) => b.correlatedEventCount - a.correlatedEventCount)[0];
  return {
    text: `I am watching ${k.activeProblems} active problems across ${Object.keys(domainById).length} operational domains, with ${k.slaRisks} carrying SLA risk and ${k.predictedIncidents} predicted incidents ahead. ${worst ? `The one I would look at first is ${worst.id} at ${siteById[worst.siteId]?.name ?? worst.siteId}.` : ""}`,
    facts: [
      { label: "Active problems", value: `${k.activeProblems} (${k.bySeverity.P1} P1)` },
      { label: "Events correlated", value: String(k.eventsCorrelated) },
      { label: "Services at risk", value: `${k.servicesAtRisk} of ${k.totalServices}` },
      { label: "Nearest predicted impact", value: `${k.nearestImpactMinutes} minutes` },
    ],
  };
}
