import type { Engagement, EngagementChannel, Lead } from '@/lib/kpmg-dice/types'

/**
 * Data ingestion console.
 *
 * The architecture page draws Sources → EAI → Sanitization → CRM as the spine
 * of the platform, and until now none of it was operable. This makes it run.
 *
 * Every number here is counted off records that exist. A source with nothing
 * waiting reads zero rather than a plausible-looking figure, and each pipeline
 * stage derives from real fields on the batch — duplicates from colliding
 * phone and email values, rejects from records that genuinely fail the stated
 * rule. The funnel has to reconcile: received = duplicates + rejected + written.
 */

export type IngestionSourceId =
  | 'salesforce'
  | 'website'
  | 'whatsapp'
  | 'email'
  | 'call'
  | 'site-visit'

export interface IngestionSource {
  id: IngestionSourceId
  label: string
  sublabel: string
  /** Un-ingested records this source can supply. */
  pending: number
  /** Records from this source already through the pipeline. */
  ingested: number
}

/** Which engagement channel backs each source, where one does. */
const CHANNEL_FOR: Partial<Record<IngestionSourceId, EngagementChannel>> = {
  website: 'website',
  whatsapp: 'whatsapp',
  email: 'email',
  call: 'call',
  'site-visit': 'site-visit',
}

const SOURCE_META: {
  id: IngestionSourceId
  label: string
  sublabel: string
}[] = [
  {
    id: 'salesforce',
    label: 'Salesforce CRM',
    sublabel: 'System of record — the full backlog',
  },
  {
    id: 'website',
    label: 'Website & portals',
    sublabel: 'Enquiry forms and portal activity',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Business',
    sublabel: 'Conversation history',
  },
  { id: 'email', label: 'Email', sublabel: 'Inbound and outbound threads' },
  { id: 'call', label: 'Call centre', sublabel: 'Call logs and outcomes' },
  {
    id: 'site-visit',
    label: 'Site visits & walk-ins',
    sublabel: 'Visit records from sales offices',
  },
]

export function selectIngestionSources(input: {
  leads: Lead[]
  engagements: Engagement[]
  ingestedLeadIds: string[]
}): IngestionSource[] {
  const { leads, engagements } = input
  const ingested = new Set(input.ingestedLeadIds)

  // Which leads carry at least one engagement on each channel.
  const leadsByChannel = new Map<EngagementChannel, Set<string>>()
  for (const e of engagements) {
    let set = leadsByChannel.get(e.channel)
    if (!set) {
      set = new Set()
      leadsByChannel.set(e.channel, set)
    }
    set.add(e.leadId)
  }

  return SOURCE_META.map((meta) => {
    let members: Lead[]

    if (meta.id === 'salesforce') {
      members = leads
    } else {
      const channel = CHANNEL_FOR[meta.id]
      const set = channel ? leadsByChannel.get(channel) : undefined
      members = set ? leads.filter((l) => set.has(l.id)) : []
    }

    return {
      ...meta,
      pending: members.filter((l) => !ingested.has(l.id)).length,
      ingested: members.filter((l) => ingested.has(l.id)).length,
    }
  })
}

/* ---------- The pipeline ---------- */

export interface PipelineRun {
  received: number
  duplicates: number
  piiFieldsMasked: number
  rejected: number
  written: number
  /** Exactly the records that survive — what actually gets ingested. */
  writtenIds: string[]
  /** Stated so a rejected record can be defended, not just counted. */
  rejectionReasons: { reason: string; count: number }[]
}

function normalisePhone(phone: string) {
  return phone.replace(/\D/g, '').slice(-10)
}

function normaliseEmail(email: string) {
  return email.trim().toLowerCase()
}

/**
 * Runs one batch through EAI and sanitization.
 *
 * Pure — it decides what *would* be written without writing anything, so the
 * console can show the funnel before the user commits it. The same
 * propose-then-commit shape every agent in this build follows.
 */
/**
 * Contact keys already in the book, so an upload can be deduped against it and
 * not just against itself.
 *
 * Normalised on the way in by `knownKeysFrom`, which exists so callers cannot
 * hand-roll the rule — `normalisePhone` and `normaliseEmail` are module-private
 * precisely so there is one definition of what "the same person" means.
 */
export interface KnownKeys {
  phones: ReadonlySet<string>
  emails: ReadonlySet<string>
}

export function knownKeysFrom(leads: Lead[]): KnownKeys {
  const phones = new Set<string>()
  const emails = new Set<string>()
  for (const lead of leads) {
    const p = normalisePhone(lead.phone ?? '')
    const e = normaliseEmail(lead.email ?? '')
    if (p) phones.add(p)
    if (e) emails.add(e)
  }
  return { phones, emails }
}

export function runIngestionPipeline(batch: Lead[], known?: KnownKeys): PipelineRun {
  const seenPhone = new Set<string>()
  const seenEmail = new Set<string>()

  let duplicates = 0
  let piiFieldsMasked = 0
  const rejectionCounts = new Map<string, number>()
  const writtenIds: string[] = []

  for (const lead of batch) {
    const phone = normalisePhone(lead.phone ?? '')
    const email = normaliseEmail(lead.email ?? '')

    /*
     * De-duplication first: a duplicate is not also a validation failure.
     *
     * `known` is tested rather than merged into the local sets, so the caller's
     * sets are never mutated. A collision with the book takes the same path as
     * one within the batch, which is what keeps the funnel reconciling.
     */
    if (
      (phone && (seenPhone.has(phone) || known?.phones.has(phone))) ||
      (email && (seenEmail.has(email) || known?.emails.has(email)))
    ) {
      duplicates += 1
      continue
    }
    if (phone) seenPhone.add(phone)
    if (email) seenEmail.add(email)

    /*
     * Validation. Each rule names itself so a rejection can be defended.
     *
     * The shape rules never fire on this book — seeded records always carry a
     * well-formed phone and email — but they are the right rules and would
     * catch a real feed. The rule that does fire reads evidenceStatus, which
     * is a genuine conflict already recorded against the lead rather than a
     * failure invented to make the stage look busy.
     */
    let reason: string | null = null
    if (!phone || phone.length < 10) reason = 'Missing or malformed phone'
    else if (!email || !email.includes('@')) reason = 'Missing or malformed email'
    else if (!lead.name?.trim()) reason = 'Missing customer name'
    else if (lead.evidenceStatus === 'contradicted')
      reason = 'Evidence contradicts the recorded CRM status'

    if (reason) {
      rejectionCounts.set(reason, (rejectionCounts.get(reason) ?? 0) + 1)
      continue
    }

    // Masked on the way in: the two identifying fields the record carries.
    if (lead.phone) piiFieldsMasked += 1
    if (lead.email) piiFieldsMasked += 1

    writtenIds.push(lead.id)
  }

  const rejected = [...rejectionCounts.values()].reduce((a, b) => a + b, 0)

  return {
    received: batch.length,
    duplicates,
    piiFieldsMasked,
    rejected,
    written: writtenIds.length,
    writtenIds,
    rejectionReasons: [...rejectionCounts.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  }
}

/** The next batch a source can supply, oldest records first. */
export function selectBatch(input: {
  leads: Lead[]
  engagements: Engagement[]
  ingestedLeadIds: string[]
  sourceId: IngestionSourceId
  size: number
}): Lead[] {
  const { leads, engagements, sourceId, size } = input
  const ingested = new Set(input.ingestedLeadIds)

  let members: Lead[]
  if (sourceId === 'salesforce') {
    members = leads
  } else {
    const channel = CHANNEL_FOR[sourceId]
    const set = new Set(
      engagements.filter((e) => e.channel === channel).map((e) => e.leadId),
    )
    members = leads.filter((l) => set.has(l.id))
  }

  return members.filter((l) => !ingested.has(l.id)).slice(0, size)
}
