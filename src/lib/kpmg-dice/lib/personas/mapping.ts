
import type { AIService } from '@/lib/kpmg-dice/lib/ai'
import type {
  Customer,
  Engagement,
  Lead,
  Persona,
  PersonaAssignment,
  PersonaMatch,
} from '@/lib/kpmg-dice/types'
import { ref, personaById } from '@/lib/kpmg-dice/data/active-reference'

/**
 * Persona mapping engine.
 *
 * Scores a lead against every persona from its attributes and behaviour, then
 * returns the best fit with a confidence and — importantly for the demo — the
 * exact signals that produced it. Nothing is assigned without a reason a rep
 * can read.
 */

export interface MappingInput {
  lead: Lead
  customer?: Customer
  engagements?: Engagement[]
}

interface Rule {
  /** Points added when the predicate holds. */
  weight: number
  /** Signal text shown as evidence when it fires. */
  signal: (input: MappingInput) => string
  when: (input: MappingInput, persona: Persona) => boolean
}

/** Referral and walk-in campaigns are a direct persona tell. */
const REFERRAL_CAMPAIGNS = new Set(['cmp-refer-earn', 'cmp-walkin'])
const INVESTOR_CAMPAIGNS = new Set(['cmp-portals', 'cmp-broker'])
const PREMIUM_CAMPAIGNS = new Set(['cmp-premium-living'])

const HNI_OCCUPATIONS = new Set(['Business Owner', 'Doctor', 'Lawyer'])

function budgetFit(lead: Lead, persona: Persona) {
  const [min, max] = persona.budgetRangeCr
  return lead.budgetCr >= min && lead.budgetCr <= max
}

/**
 * Shared rule table. Each rule is evaluated for every persona, so the same
 * signal can support one persona and count against another.
 */
const RULES: Rule[] = [
  {
    weight: 34,
    when: ({ lead }, persona) => budgetFit(lead, persona),
    signal: ({ lead }) => `Budget ₹${lead.budgetCr} Cr sits inside the persona band`,
  },
  {
    weight: 26,
    when: ({ customer, lead }, persona) =>
      persona.id === 'persona-nri' &&
      (customer?.isNri === true || lead.phone.startsWith('+971') || !lead.phone.startsWith('+91')),
    signal: () => 'Overseas contact number — buying from outside India',
  },
  {
    weight: -30,
    when: ({ customer, lead }, persona) =>
      persona.id !== 'persona-nri' &&
      (customer?.isNri === true || lead.phone.startsWith('+971')),
    signal: () => 'Overseas buyer — domestic personas de-prioritised',
  },
  {
    weight: 28,
    when: ({ lead }, persona) =>
      persona.id === 'persona-referral' &&
      REFERRAL_CAMPAIGNS.has(lead.sourceCampaignId),
    signal: () => 'Arrived through a referral or walk-in source',
  },
  {
    weight: 18,
    when: ({ lead }, persona) =>
      persona.id === 'persona-investor' &&
      INVESTOR_CAMPAIGNS.has(lead.sourceCampaignId),
    signal: () => 'Sourced through a portal or broker — typical investor route',
  },
  {
    weight: 16,
    when: ({ lead }, persona) =>
      persona.id === 'persona-hni' && PREMIUM_CAMPAIGNS.has(lead.sourceCampaignId),
    signal: () => 'Came in through the Premium Living Expo',
  },
  {
    weight: 20,
    when: ({ lead }, persona) =>
      persona.id === 'persona-hni' && lead.budgetCr >= 3.5,
    signal: ({ lead }) => `₹${lead.budgetCr} Cr budget is in luxury inventory territory`,
  },
  {
    weight: 15,
    when: ({ lead, customer }, persona) =>
      persona.id === 'persona-hni' &&
      !!customer &&
      HNI_OCCUPATIONS.has(customer.occupation),
    signal: ({ customer }) => `Occupation (${customer?.occupation}) indexes to an HNI profile`,
  },
  {
    weight: 18,
    when: ({ lead }, persona) =>
      persona.id === 'persona-upgrade' && lead.familySize >= 3 && lead.budgetCr >= 1.6,
    signal: ({ lead }) =>
      `Family of ${lead.familySize} with a ₹${lead.budgetCr} Cr budget — classic trade-up profile`,
  },
  {
    weight: 18,
    when: ({ lead }, persona) =>
      persona.id === 'persona-first-time' && lead.familySize <= 3 && lead.budgetCr <= 1.6,
    signal: ({ lead }) =>
      `Small household (${lead.familySize}) at an entry budget of ₹${lead.budgetCr} Cr`,
  },
  {
    weight: 16,
    when: ({ lead }, persona) =>
      persona.id === 'persona-investor' && lead.interestedProjectIds.length > 1 && lead.familySize <= 2,
    signal: ({ lead }) =>
      `Evaluating ${lead.interestedProjectIds.length} projects with no occupancy driver`,
  },
  {
    weight: 12,
    when: ({ lead }, persona) =>
      persona.id === 'persona-upgrade' && lead.evidence.siteVisitsAttended >= 1,
    signal: ({ lead }) =>
      `${lead.evidence.siteVisitsAttended} site visit(s) attended with family`,
  },
  {
    weight: 10,
    when: ({ lead }, persona) =>
      persona.bestFitProjects.some((p) => lead.interestedProjectIds.includes(p)),
    signal: () => 'Shortlisted inventory matches the persona’s best-fit projects',
  },
  {
    weight: 9,
    when: ({ engagements }, persona) =>
      persona.id === 'persona-nri' &&
      !!engagements?.some((e) =>
        /video|virtual|cannot travel|timezone|overseas/i.test(`${e.subject} ${e.summary}`),
      ),
    signal: () => 'Asked for a virtual or video alternative to a site visit',
  },
  {
    weight: 9,
    when: ({ engagements }, persona) =>
      persona.id === 'persona-first-time' &&
      !!engagements?.some((e) => /loan|emi|eligibility|pre-approved/i.test(`${e.subject} ${e.summary}`)),
    signal: () => 'Loan eligibility raised in conversation',
  },
  {
    weight: 8,
    when: ({ engagements }, persona) =>
      persona.id === 'persona-upgrade' &&
      !!engagements?.some((e) =>
        /possession|lease|current (flat|home)|rental lease/i.test(`${e.subject} ${e.summary}`),
      ),
    signal: () => 'Possession timing tied to an existing lease or home sale',
  },
]

/** Scores one lead against every persona. */
export function mapLeadToPersonas(input: MappingInput): PersonaAssignment {
  const matches: PersonaMatch[] = ref().personas.map((persona) => {
    const signals: string[] = []
    let rawScore = 6 // small floor so no persona scores zero

    for (const rule of RULES) {
      if (!rule.when(input, persona)) continue
      rawScore += rule.weight
      if (rule.weight > 0) signals.push(rule.signal(input))
    }

    return { personaId: persona.id, rawScore: Math.max(0, rawScore), confidence: 0, signals }
  })

  /**
   * Confidence is how decisively a persona beats its nearest rival, not its
   * share of all six. A six-way split makes a clear winner look like 35%,
   * which reads as a weak match when it is actually a strong one.
   */
  const sorted = [...matches].sort((a, b) => b.rawScore - a.rawScore)
  for (const match of matches) {
    const rival = sorted.find((m) => m.personaId !== match.personaId)
    const denominator = match.rawScore + (rival?.rawScore ?? 0)
    match.confidence = denominator
      ? Math.round((match.rawScore / denominator) * 100)
      : 0
  }

  return {
    leadId: input.lead.id,
    best: sorted[0],
    runnerUp: sorted[1],
    all: sorted,
  }
}

/**
 * AI-narrated variant used on the drill-in panel. The assignment itself stays
 * deterministic — the model only explains it, so a live demo never shows a
 * different persona on a second run.
 */
export async function explainPersonaMatch(
  input: MappingInput,
  ai: AIService,
): Promise<{ assignment: PersonaAssignment; rationale: string }> {
  const assignment = mapLeadToPersonas(input)
  const persona = personaById(assignment.best.personaId)

  const { text } = await ai.complete({
    system: 'You are a real-estate CRM analyst explaining a persona assignment.',
    messages: [
      {
        role: 'user',
        content: `${input.lead.name} was mapped to "${persona.name}" at ${assignment.best.confidence}% confidence. Signals: ${assignment.best.signals.join('; ')}.`,
      },
    ],
    context: { leadId: input.lead.id, personaId: persona.id },
  })

  return { assignment, rationale: text }
}

/** Bulk mapping for the board — deterministic and cheap enough for the full book. */
export function mapBook(
  leads: Lead[],
  customersById: Record<string, Customer>,
  engagementsByLead: Record<string, Engagement[]>,
): Map<string, PersonaAssignment> {
  const out = new Map<string, PersonaAssignment>()
  for (const lead of leads) {
    out.set(
      lead.id,
      mapLeadToPersonas({
        lead,
        customer: customersById[lead.id],
        engagements: engagementsByLead[lead.id],
      }),
    )
  }
  return out
}
