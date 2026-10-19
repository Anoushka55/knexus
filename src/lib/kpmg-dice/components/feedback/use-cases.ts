import {
  ClipboardList,
  Gauge,
  Layers,
  LifeBuoy,
  MessageSquareText,
  Radar,
  ScanSearch,
  SlidersHorizontal,
  TowerControl,
  type LucideIcon,
} from 'lucide-react'

/**
 * The nine use cases, as the brief defines them.
 *
 * Modelled on ARCHETYPE_META and the agent card's four-column story: the hub
 * renders these directly, so the capability table and the running product stay
 * the same artefact rather than drifting apart.
 */

/**
 * Internal only. "Type 1" and "Type 2" are the brief's own taxonomy and useful
 * for reasoning about the feature, but they mean nothing to a client, so they
 * stay out of every rendered string.
 */
export type FeedbackType = 'type-1' | 'type-2'

/** The three-beat narrative the Type 2 screens are ordered by. */
export type NarrativeBeat = 'collect' | 'understand' | 'act'

export const FEEDBACK_TYPE_META: Record<
  FeedbackType,
  { label: string; blurb: string; caption?: string; accent: string }
> = {
  'type-1': {
    label: 'CSAT & NPS Reporting',
    blurb:
      'Descriptive reporting. Answers what happened, and establishes the baseline.',
    // Slate rather than a brand accent: the plainness is the argument.
    accent: 'text-slate-500',
  },
  'type-2': {
    label: 'AI-Powered Customer Feedback Intelligence',
    blurb:
      'Extends reporting into prediction, personalisation, diagnosis and action orchestration.',
    caption: 'Prediction · Diagnosis · Orchestration',
    accent: 'text-kpmg-violet',
  },
}

export const BEAT_META: Record<
  NarrativeBeat,
  { label: string; band: string; text: string }
> = {
  collect: {
    label: 'Collect better',
    band: 'bg-kpmg-teal',
    text: 'text-white',
  },
  understand: {
    label: 'Understand better',
    band: 'bg-kpmg-violet',
    text: 'text-white',
  },
  act: {
    label: 'Act faster',
    band: 'bg-kpmg-magenta',
    text: 'text-white',
  },
}

export interface UseCaseDef {
  /** URL slug — /csat-nps/[useCase]. */
  slug: string
  name: string
  type: FeedbackType
  beat?: NarrativeBeat
  icon: LucideIcon
  /** The brief's four columns, verbatim. */
  problem: string
  visuals: string
  aiAction: string
  value: string
  /** Agent backing this use case, where one does. */
  agentId?: string
  agentName?: string
  /**
   * Type 1 use cases share one screen and are reached by anchor, so the card
   * deep-links to a named section rather than its own route.
   */
  anchor?: string
}

export const USE_CASES: UseCaseDef[] = [
  /* ---- Type 1 ---- */
  {
    slug: 'nps-reporting',
    anchor: 'nps-performance',
    name: 'NPS Performance Dashboard',
    type: 'type-1',
    icon: Gauge,
    problem:
      'Leadership requires visibility into customer loyalty and promoter/detractor trends across projects.',
    visuals:
      'NPS score card; promoters/passives/detractors split; monthly trend graph; project-wise comparison.',
    aiAction:
      'Minimal AI value addition. Trend calculations, standard segmentation and basic comparisons.',
    value: 'Improved visibility into customer loyalty and NPS performance.',
  },
  {
    slug: 'nps-reporting',
    anchor: 'csat-service',
    name: 'CSAT Service Reporting',
    type: 'type-1',
    icon: ClipboardList,
    problem:
      'Management needs to understand service performance across customer touchpoints, and compare satisfaction across the journey.',
    visuals:
      'CSAT trend dashboard; touchpoint scores for sales, documentation, payment and handover; project comparison charts.',
    aiAction: 'Basic scoring aggregation and variance identification.',
    value: 'High-level identification of satisfaction gaps across touchpoints.',
  },
  {
    slug: 'nps-reporting',
    anchor: 'sentiment-reporting',
    name: 'Feedback Sentiment Reporting',
    type: 'type-1',
    icon: MessageSquareText,
    problem:
      'Management wants to understand the distribution of positive, neutral and negative feedback, and summarise open-text feedback at a basic level.',
    visuals:
      'Sentiment charts; positive/neutral/negative split; word cloud; theme-frequency chart.',
    aiAction: 'Basic sentiment classification and theme counting.',
    value:
      'General understanding of recurring feedback topics and sentiment direction.',
  },

  /* ---- Type 2 ---- */
  {
    slug: 'survey-optimizer',
    name: 'AI Survey Participation Optimizer',
    type: 'type-2',
    beat: 'collect',
    icon: Radar,
    problem:
      'Low survey completion makes feedback less representative. Prioritise the right customers and improve outreach timing and channel selection.',
    visuals:
      'Survey opportunity queue; response propensity band; recommended contact time; recommended channel; response likelihood heatmap; eligibility status.',
    aiAction:
      'Predict response likelihood; recommend channel and time; identify survey fatigue; propose a short or deferred survey; prepare an outreach action subject to approval.',
    value:
      'Higher participation opportunity; broader response representation; reduced indiscriminate outreach and survey fatigue.',
    agentId: 'agent-survey-optimizer',
    agentName: 'Survey Optimizer Agent',
  },
  {
    slug: 'feedback-journey',
    name: 'Dynamic Customer Feedback Journey',
    type: 'type-2',
    beat: 'collect',
    icon: SlidersHorizontal,
    problem:
      'Customers receive generic surveys despite different personas, projects and journey stages. Improve relevance and feedback depth.',
    visuals:
      'Customer feedback profile; journey-stage ribbon; dynamic survey composer; persona preview; conditional follow-up path.',
    aiAction:
      'Select questions from an approved library; adapt supporting questions to journey stage and persona; generate a context-specific follow-up; recommend channel-specific wording.',
    value:
      'More relevant surveys; lower abandonment opportunity; richer and more actionable responses.',
    agentId: 'agent-feedback-journey',
    agentName: 'Feedback Journey Agent',
  },
  {
    slug: 'voc-analyzer',
    name: 'AI Voice-of-Customer Analyzer',
    type: 'type-2',
    beat: 'understand',
    icon: ScanSearch,
    problem:
      'Open-text responses are difficult to analyse consistently and at scale. Convert feedback into structured, reviewable insight.',
    visuals:
      'Feedback analysis screen; aspect sentiment; theme hierarchy; source-text evidence; confidence indicator; emerging-theme view.',
    aiAction:
      'Extract themes and sub-themes; classify sentiment by aspect; summarise feedback; highlight supporting text; suggest CRM tags; flag new or recurring issues for review.',
    value:
      'Faster feedback analysis; lower manual categorisation effort; consistent insight generation; improved traceability to the customer comment.',
    agentId: 'agent-voc-analyzer',
    agentName: 'VoC Analyzer Agent',
  },
  {
    slug: 'root-cause',
    name: 'Root Cause Intelligence Engine',
    type: 'type-2',
    beat: 'understand',
    icon: Layers,
    problem:
      'Management can see low scores but not the operational drivers behind them. Connect feedback to journey stages, processes and recurring issue patterns.',
    visuals:
      'Root-cause dashboard; journey heatmap; project/persona comparison; repeat-issue trend; issue drill-down.',
    aiAction:
      'Cluster related issues; associate themes with journey stages; detect repeat patterns; identify correlations requiring business validation; prioritise diagnostic areas.',
    value:
      'Better focus on material pain points; faster problem investigation; evidence-led prioritisation of process improvements.',
    agentId: 'agent-root-cause',
    agentName: 'Root Cause Agent',
  },
  {
    slug: 'detractor-recovery',
    name: 'Detractor Recovery Copilot',
    type: 'type-2',
    beat: 'act',
    icon: LifeBuoy,
    problem:
      'Detractor feedback may be captured without clear ownership or timely follow-through. Create a closed-loop recovery workflow.',
    visuals:
      'Detractor queue; recovery case; owner and SLA; recommended response; escalation path; case timeline; closure evidence.',
    aiAction:
      'Detect detractor or high-severity theme; recommend priority and owner; generate a customer-safe response draft; create a recovery case after review; escalate overdue action.',
    value:
      'Faster recovery response; clearer ownership; improved closure discipline; reduced risk of unresolved customer concerns.',
    agentId: 'agent-detractor-recovery',
    agentName: 'Recovery Copilot Agent',
  },
  {
    slug: 'control-tower',
    name: 'Voice-of-Customer Control Tower',
    type: 'type-2',
    beat: 'act',
    icon: TowerControl,
    problem:
      'Leadership cannot easily connect customer feedback with operational improvement priorities. Provide a single view of drivers, risk and interventions.',
    visuals:
      'Executive dashboard; satisfaction/dissatisfaction drivers; issue trends; recovery SLA view; intervention backlog; impact-effort matrix.',
    aiAction:
      'Generate management insight summaries; identify high-concentration issues; recommend improvement themes; prioritise interventions based on configured impact and effort; monitor follow-through.',
    value:
      'Stronger executive visibility; data-led improvement planning; improved accountability for customer-experience actions.',
    agentId: 'agent-voc-control-tower',
    agentName: 'Control Tower Agent',
  },
]

/** The distinct routes — Type 1's three use cases share one screen. */
export const USE_CASE_ROUTES = [...new Set(USE_CASES.map((u) => u.slug))]

export function useCasesOfType(type: FeedbackType) {
  return USE_CASES.filter((u) => u.type === type)
}

export function useCaseBySlug(slug: string) {
  return USE_CASES.find((u) => u.slug === slug)
}

/**
 * The limitation callout, as a mapping rather than a paragraph.
 *
 * Each row names a question traditional reporting cannot answer and the screen
 * that does, which turns the Type 1 → Type 2 argument into a click instead of
 * a claim.
 */
export const TYPE_1_LIMITATIONS: {
  question: string
  slug: string
  answeredBy: string
}[] = [
  {
    question: 'Who should receive a survey',
    slug: 'survey-optimizer',
    answeredBy: 'Survey Participation Optimizer',
  },
  {
    question: 'When and how to engage',
    slug: 'feedback-journey',
    answeredBy: 'Dynamic Customer Feedback Journey',
  },
  {
    question: 'Why a score changed',
    slug: 'root-cause',
    answeredBy: 'Root Cause Intelligence Engine',
  },
  {
    question: 'Which recovery action to trigger',
    slug: 'detractor-recovery',
    answeredBy: 'Detractor Recovery Copilot',
  },
]
