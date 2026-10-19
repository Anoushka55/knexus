'use client'

import { create } from 'zustand'

import { buildSeedDataset } from '@/lib/kpmg-dice/data/generator'
import { DATA_SOURCE_SEEDS, buildFeedback } from '@/lib/kpmg-dice/data/feedback-generator'
import { DEMO_NOW } from '@/lib/kpmg-dice/data/reference'
import { ref, themeById, resetActiveReference, setActiveReference } from '@/lib/kpmg-dice/data/active-reference'
import type {
  Booking,
  TouchpointId,
  Customer,
  Engagement,
  Lead,
  Payment,
  RecoveryCase,
  ServiceTicket,
  SfActivity,
  SfTask,
  SiteVisit,
  SurveyInvite,
  SurveyResponse,
  Transcript,
  Unit,
} from '@/lib/kpmg-dice/types'
import { TOUCHPOINT_LABEL } from '@/lib/kpmg-dice/types'
import type { DecisionLogEntry } from '@/lib/kpmg-dice/lib/agents/types'
import type { ImportReport } from '@/lib/kpmg-dice/lib/ingestion/merge-plan'
import type { RecordType } from '@/lib/kpmg-dice/lib/ingestion/schemas'
import {
  isReferenceType,
  mergeOrder,
  REFERENCE_TYPES,
} from '@/lib/kpmg-dice/lib/ingestion/schemas'
import {
  clearImports,
  readImports,
  writeImports,
  type ImportPayload,
} from '@/lib/kpmg-dice/lib/ingestion/import-storage'

/**
 * The in-memory Salesforce stand-in.
 *
 * Everything the app reads lives here, and every write lands here — so flagging
 * a lead from a transcript, a copilot or an agent shows up immediately on the
 * Overview, the Customer 360 and the activity feed with no plumbing in between.
 *
 * Seed generation is deterministic, so the state the server renders and the
 * state the browser hydrates are identical.
 */

let activitySeq = 0
let taskSeq = 0
let recoverySeq = 0

let decisionSeq = 0

/** Newest entries only — see `recordDecision`. */
const MAX_DECISION_LOG = 200

function nextId(prefix: string, seq: number) {
  return `${prefix}-${String(seq).padStart(5, '0')}`
}

/** The collections a CSV import can write. Store keys match RecordType names. */
const IMPORTABLE_TYPES: RecordType[] = [
  'leads', 'customers', 'engagements', 'siteVisits', 'bookings', 'payments',
  'serviceTickets', 'transcripts', 'tasks', 'surveyInvites', 'surveyResponses',
  'recoveryCases',
]

/**
 * Write the imported slice of state to disk.
 *
 * Only records carrying a batch id are stored — the seeded book is regenerated
 * on every load and storing it too would waste the quota on data that is
 * already free.
 */
function persistImports(state: CrmState, mode: 'merge' | 'replace') {
  const records: Partial<Record<RecordType, unknown[]>> = {}
  for (const type of IMPORTABLE_TYPES) {
    const rows = state[type as keyof CrmState] as { importedBatchId?: string }[]
    if (!Array.isArray(rows)) continue
    const mine = rows.filter((r) => r.importedBatchId)
    if (mine.length) records[type] = mine
  }
  const current = ref()
  const payload: ImportPayload = {
    version: 1,
    batchIds: state.importedBatchIds,
    savedAt: new Date().toISOString(),
    mode,
    records,
    report: state.lastImportReport ?? undefined,
    reference: {
      projects: current.projects,
      reps: current.reps,
      campaigns: current.campaigns,
      personas: current.personas,
      themes: current.themes,
      microMarkets: current.microMarkets,
    },
  }
  return writeImports(payload)
}

export interface CrmState {
  leads: Lead[]
  leadsById: Record<string, Lead>
  customers: Customer[]
  engagements: Engagement[]
  siteVisits: SiteVisit[]
  bookings: Booking[]
  /** Physical inventory — every unit, sold and unsold. */
  units: Unit[]
  payments: Payment[]
  serviceTickets: ServiceTicket[]
  transcripts: Transcript[]
  tasks: SfTask[]
  activities: SfActivity[]
  surveyInvites: SurveyInvite[]
  surveyResponses: SurveyResponse[]
  recoveryCases: RecoveryCase[]

  /** Every AI-influenced decision a human committed, newest first. */
  decisionLog: DecisionLogEntry[]

  /** Campaigns DICE has suppressed outreach on. */
  suppressedCampaignIds: string[]
  /** Leads whose interaction history has been ingested and sanitised. */
  ingestedLeadIds: string[]
  /** Batches of imported CSV data currently merged into the book. */
  importedBatchIds: string[]
  /**
   * Bumped whenever the reference sets change.
   *
   * The sets themselves live in `active-reference`, not here — two copies that
   * must be kept in step is the drift this design avoids. This counter exists
   * only so components can subscribe and re-render.
   */
  referenceVersion: number

  /* ---- writes ---- */
  updateLead: (
    id: string,
    patch: Partial<Lead>,
    meta?: { source?: SfActivity['source']; action?: string; detail?: string },
  ) => void
  flagLead: (
    id: string,
    flags: Partial<
      Pick<Lead, 'intent' | 'cold' | 'dnd' | 'crmStatus' | 'evidenceStatus' | 'score'>
    >,
    reason: string,
    source?: SfActivity['source'],
  ) => void
  createTask: (input: {
    subject: string
    whatId: string
    ownerId: string
    dueInDays?: number
    priority?: SfTask['priority']
    createdBy?: SfTask['createdBy']
  }) => SfTask
  completeTask: (id: string) => void
  logActivity: (input: Omit<SfActivity, 'id' | 'at'> & { at?: string }) => void
  /**
   * Records one AI-influenced decision a human committed.
   *
   * Called from `executeWrite`, which every approved write already passes
   * through — so this cannot fall behind by a call site somebody forgot.
   */
  recordDecision: (
    input: Omit<DecisionLogEntry, 'id' | 'at'> & { at?: string },
  ) => void
  upsertContact: (customer: Customer) => void
  suppressCampaign: (campaignId: string, reason: string) => void
  ingestSanitizedData: (leadIds: string[]) => void
  /** Merge parsed CSV records into the book, upserting on id. */
  importRecords: (
    records: Partial<Record<RecordType, { id: string }[]>>,
    meta: {
      batchId: string
      label: string
      mode?: 'merge' | 'replace'
      /** Counts to keep, so the outcome survives navigation and a reload. */
      report?: ImportReport
    },
  ) => void
  /** What the last import accepted and refused; null until one has run. */
  lastImportReport: ImportReport | null
  /** Drop everything a CSV import brought in, in memory and on disk. */
  clearImportedData: () => void
  /** Restore a previous import after a reload. Effect-only — never in render. */
  rehydrateImports: () => Promise<void>

  /* ---- feedback writes ---- */
  createRecoveryCase: (input: {
    responseId: string
    leadId: string
    ownerId: string
    severity: RecoveryCase['severity']
    themeId: string
    slaDays: number
    recommendedResponse: string
    sourceTicketId?: string
  }) => RecoveryCase
  updateRecoveryCase: (
    id: string,
    patch: Partial<RecoveryCase>,
    note?: string,
  ) => void
  scheduleSurveyInvite: (inviteId: string, reason: string) => void
  suppressSurveyInvite: (inviteId: string, reason: string) => void
  /**
   * Resolves a post-sales ticket.
   *
   * Tickets were immutable, so the loop the platform is built to close could
   * never actually be closed: it flagged that advocacy was at risk and nothing
   * could act on it.
   */
  resolveServiceTicket: (id: string, note: string) => void
  /**
   * Regenerates the feedback book for a data source.
   *
   * Only feedback is rebuilt: the lead book, campaigns and reps are the same
   * organisation either way, so re-rolling them would make the switch look like
   * a different company rather than a different feed.
   */
  setFeedbackSource: (source: 'example' | 'client') => void
  /**
   * How many times the feedback book has been re-rolled. 0 is the canonical
   * book every rehearsed figure refers to.
   */
  feedbackVariant: number
  /**
   * Draws a fresh feedback book.
   *
   * Deliberately separate from reset, which restores. Reset promises the same
   * numbers every time so a rehearsed line still holds; this promises new ones.
   * One button cannot make both promises.
   */
  shuffleFeedback: (source: 'example' | 'client') => void

  /**
   * Restores the seeded state.
   *
   * Takes the active source, because rebuilding from the default seed while
   * the interface still reads "Client" would relabel one feed as the other --
   * the exact mislabelling the standing notice exists to prevent.
   */
  resetDemoData: (source?: 'example' | 'client') => void
}


/**
 * One line for the activity feed, specific to the case rather than to its
 * severity band. Falls back gracefully if the source response is missing.
 */
function recoveryCaseDetail(
  recoveryCase: RecoveryCase,
  response: SurveyResponse | undefined,
): string {
  const owner = ref().reps.find((r) => r.id === recoveryCase.ownerId)?.name ?? 'Customer Care'

  /*
   * Leads with a quoted fragment of the verbatim, not the theme. The theme
   * repeats across the top of the queue by construction — the same complaint
   * genuinely is the dominant one — so a feed built from theme + touchpoint
   * still collapsed to a handful of lines for the worst detractors. The
   * customer's own words are unique per response, which is also the standard
   * the rest of this feature already holds evidence to.
   */
  const quote = response
    ? `"${response.verbatim.slice(0, 64)}${response.verbatim.length > 64 ? '…' : ''}"`
    : themeById(recoveryCase.themeId)?.label ?? `${recoveryCase.severity} severity`

  const touchpoint = response
    ? TOUCHPOINT_LABEL[response.touchpoint as TouchpointId]
    : undefined

  const sla = Math.round(
    (new Date(recoveryCase.slaDueAt).getTime() -
      new Date(recoveryCase.openedAt).getTime()) /
      86_400_000,
  )

  return `${quote}${touchpoint ? ` · ${touchpoint}` : ''} · SLA ${sla}d · owner ${owner}`
}

function seedState(source: 'example' | 'client' = 'example') {
  const data = buildSeedDataset()

  // The generator seeds feedback for the example book; re-roll it when the
  // connected feed is the one selected.
  if (source === 'client') {
    Object.assign(
      data,
      buildFeedback({
        leads: data.leads,
        bookings: data.bookings,
        siteVisits: data.siteVisits,
        serviceTickets: data.serviceTickets,
        payments: data.payments,
        engagements: data.engagements,
        seed: DATA_SOURCE_SEEDS.client,
      }),
    )
  }

  const leadsById: Record<string, Lead> = {}
  for (const lead of data.leads) leadsById[lead.id] = lead

  return {
    leads: data.leads,
    leadsById,
    customers: data.customers,
    engagements: data.engagements,
    siteVisits: data.siteVisits,
    bookings: data.bookings,
    units: data.units,
    payments: data.payments,
    serviceTickets: data.serviceTickets,
    transcripts: data.transcripts,
    tasks: data.tasks,
    activities: [] as SfActivity[],
    feedbackVariant: 0,
    surveyInvites: data.surveyInvites,
    surveyResponses: data.surveyResponses,
    recoveryCases: data.recoveryCases,
    decisionLog: [] as DecisionLogEntry[],
    suppressedCampaignIds: [] as string[],
    // Only leads whose history has been ingested can be reasoned over.
    ingestedLeadIds: data.leads.filter((l) => l.ingested).map((l) => l.id),
    importedBatchIds: [] as string[],
    referenceVersion: 0,
    lastImportReport: null,
  }
}

export const useCrmStore = create<CrmState>((set, get) => ({
  ...seedState(),

  updateLead: (id, patch, meta) =>
    set((state) => {
      const existing = state.leadsById[id]
      if (!existing) return state

      const updated = { ...existing, ...patch }
      const changes = Object.entries(patch)
        .filter(([key]) => existing[key as keyof Lead] !== patch[key as keyof Lead])
        .map(([field, after]) => ({
          field,
          before: String(existing[field as keyof Lead] ?? '—'),
          after: String(after ?? '—'),
        }))

      activitySeq += 1
      const activity: SfActivity = {
        id: nextId('ACT', activitySeq),
        object: 'Lead',
        recordId: id,
        recordName: existing.name,
        action: meta?.action ?? 'Lead updated',
        detail: meta?.detail ?? `${changes.length} field(s) updated`,
        source: meta?.source ?? 'DICE',
        changes,
        at: DEMO_NOW.toISOString(),
      }

      return {
        leads: state.leads.map((l) => (l.id === id ? updated : l)),
        leadsById: { ...state.leadsById, [id]: updated },
        activities: [activity, ...state.activities],
      }
    }),

  flagLead: (id, flags, reason, source = 'DICE') =>
    get().updateLead(id, flags, {
      source,
      action: 'Lead flagged',
      detail: reason,
    }),

  createTask: (input) => {
    taskSeq += 1
    const dueAt = new Date(
      DEMO_NOW.getTime() + (input.dueInDays ?? 1) * 86_400_000,
    ).toISOString()

    const task: SfTask = {
      id: nextId('TSK-NEW', taskSeq),
      subject: input.subject,
      whatId: input.whatId,
      ownerId: input.ownerId,
      dueAt,
      priority: input.priority ?? 'Normal',
      status: 'Open',
      createdBy: input.createdBy ?? 'DICE',
      createdAt: DEMO_NOW.toISOString(),
    }

    activitySeq += 1
    const lead = get().leadsById[input.whatId]
    const activity: SfActivity = {
      id: nextId('ACT', activitySeq),
      object: 'Task',
      recordId: task.id,
      recordName: lead?.name ?? input.whatId,
      action: 'Task created',
      detail: task.subject,
      source: task.createdBy,
      at: DEMO_NOW.toISOString(),
    }

    set((state) => ({
      tasks: [task, ...state.tasks],
      activities: [activity, ...state.activities],
    }))

    return task
  },

  completeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status: 'Completed' as const } : t,
      ),
    })),

  logActivity: (input) =>
    set((state) => {
      activitySeq += 1
      return {
        activities: [
          {
            ...input,
            id: nextId('ACT', activitySeq),
            at: input.at ?? DEMO_NOW.toISOString(),
          },
          ...state.activities,
        ],
      }
    }),

  recordDecision: (input) =>
    set((state) => {
      decisionSeq += 1
      return {
        decisionLog: [
          {
            ...input,
            id: nextId('DEC', decisionSeq),
            at: input.at ?? DEMO_NOW.toISOString(),
          },
          // Capped: this appends on every approval, and a long demo session
          // clicking through the agent gallery would otherwise grow it without
          // bound. The newest entries are the ones anybody looks at.
          ...state.decisionLog,
        ].slice(0, MAX_DECISION_LOG),
      }
    }),

  upsertContact: (customer) =>
    set((state) => {
      const exists = state.customers.some((c) => c.id === customer.id)
      activitySeq += 1
      return {
        customers: exists
          ? state.customers.map((c) => (c.id === customer.id ? customer : c))
          : [customer, ...state.customers],
        activities: [
          {
            id: nextId('ACT', activitySeq),
            object: 'Contact' as const,
            recordId: customer.id,
            recordName: customer.name,
            action: exists ? 'Contact updated' : 'Contact created',
            detail: `${customer.name} · ${customer.preferredLocation}`,
            source: 'DICE' as const,
            at: DEMO_NOW.toISOString(),
          },
          ...state.activities,
        ],
      }
    }),

  suppressCampaign: (campaignId, reason) =>
    set((state) => {
      if (state.suppressedCampaignIds.includes(campaignId)) return state
      activitySeq += 1
      return {
        suppressedCampaignIds: [...state.suppressedCampaignIds, campaignId],
        activities: [
          {
            id: nextId('ACT', activitySeq),
            object: 'Activity' as const,
            recordId: campaignId,
            recordName: campaignId,
            action: 'Campaign outreach suppressed',
            detail: reason,
            source: 'DICE' as const,
            at: DEMO_NOW.toISOString(),
          },
          ...state.activities,
        ],
      }
    }),

  /**
   * Represents cleaned customer data arriving in Salesforce through the EAI
   * layer. Ingested leads become eligible for DICE reasoning, and each batch
   * is written to the activity feed so the pipeline is visible in the UI.
   */
  ingestSanitizedData: (leadIds) =>
    set((state) => {
      // Set lookup, not includes(): nothing called this until the demo menu
      // gained an Ingest action, and a batch checked against a list that
      // grows to 12k would be O(n*m) on every click.
      const already = new Set(state.ingestedLeadIds)
      const fresh = leadIds.filter((id) => !already.has(id))
      if (!fresh.length) return state

      activitySeq += 1
      return {
        ingestedLeadIds: [...state.ingestedLeadIds, ...fresh],
        activities: [
          {
            id: nextId('ACT', activitySeq),
            object: 'Lead' as const,
            recordId: fresh[0],
            recordName: `${fresh.length} record(s)`,
            action: 'Sanitized data ingested',
            detail: `${fresh.length} record(s) cleaned and written to Salesforce via EAI`,
            source: 'EAI Ingestion' as const,
            at: DEMO_NOW.toISOString(),
          },
          ...state.activities,
        ],
      }
    }),

  /*
   * Merge imported records into the book.
   *
   * Upsert on id, not append. Every exported row carries the id it left with,
   * so re-importing the platform's own export must replace those records rather
   * than add a second copy of each — otherwise the first upload doubles all
   * 28,327 rows and every figure on every screen with it. This one decision is
   * what makes the round-trip idempotent.
   *
   * Types are merged in dependency order so a row's foreign key resolves
   * against records that are already present.
   */
  importRecords: (records, meta) =>
    set((state) => {
      const next = { ...state } as Record<string, unknown>
      const stamped = { importedBatchId: meta.batchId }
      const replace = meta.mode === 'replace'
      let written = 0
      if (meta.report) next.lastImportReport = meta.report

      /*
       * Replace empties every importable collection first, including the ones
       * this upload does not carry.
       *
       * Leaving them would strand rows pointing at leads that no longer exist —
       * a booking for a customer who is not in the book reads as a bug, not as
       * a partial import. Switching books has to switch all of it.
       */
      if (replace) {
        for (const type of IMPORTABLE_TYPES) next[type] = []
        next.activities = []
      }

      /*
       * The reference sets are applied before the records, so anything drawn
       * immediately afterwards resolves project and rep names against the new
       * set rather than the one being replaced.
       *
       * They do not live in this store — `active-reference` holds them, and
       * `referenceVersion` exists only so components can subscribe. Two copies
       * that must be kept in step is the drift this avoids.
       */
      const referenceUpdate: Record<string, unknown[]> = {}
      for (const type of REFERENCE_TYPES) {
        const rows = records[type]
        if (rows?.length) {
          referenceUpdate[type === 'microMarkets' ? 'microMarkets' : type] =
            type === 'microMarkets'
              ? rows.map((r) => (r as unknown as { marketName?: string }).marketName ?? r.id)
              : rows
        }
      }
      if (replace) resetActiveReference()
      if (Object.keys(referenceUpdate).length) setActiveReference(referenceUpdate)
      const referenceChanged = replace || Object.keys(referenceUpdate).length > 0

      for (const type of mergeOrder(Object.keys(records) as RecordType[])) {
        if (isReferenceType(type)) continue
        const incoming = records[type]
        if (!incoming?.length) continue

        // Map preserves insertion order, so existing records keep their
        // position and genuinely new ones land at the end.
        const merged = new Map<string, unknown>()
        for (const row of (next[type] as { id: string }[]) ?? []) {
          merged.set(row.id, row)
        }
        for (const row of incoming) {
          merged.set(row.id, { ...row, ...stamped })
          written += 1
        }
        next[type] = [...merged.values()]
      }

      // leadsById and the ingested set are derived views of `leads` and would
      // otherwise point at the records the upsert just replaced.
      if (records.leads?.length || replace) {
        const leads = (next.leads ?? []) as Lead[]
        const byId: Record<string, Lead> = {}
        for (const lead of leads) byId[lead.id] = lead
        next.leadsById = byId
        next.ingestedLeadIds = leads.filter((l) => l.ingested).map((l) => l.id)
      }

      activitySeq += 1
      next.importedBatchIds = replace
        ? [meta.batchId]
        : [...state.importedBatchIds, meta.batchId]
      if (referenceChanged) next.referenceVersion = state.referenceVersion + 1
      next.activities = [
        {
          id: nextId('ACT', activitySeq),
          object: 'Lead' as const,
          recordId: meta.batchId,
          recordName: meta.label,
          action: replace ? 'CSV import — book replaced' : 'CSV import committed',
          detail: `${written} record(s) ${replace ? 'replaced the book' : 'merged'} from ${meta.label}`,
          source: 'EAI Ingestion' as const,
          at: DEMO_NOW.toISOString(),
        },
        ...((next.activities ?? []) as SfActivity[]),
      ]

      void persistImports(next as unknown as CrmState, replace ? 'replace' : 'merge')
      return next as unknown as CrmState
    }),

  clearImportedData: () => {
    void clearImports()
    resetActiveReference()
    set((state) => {
      const next = { ...state } as Record<string, unknown>
      for (const type of IMPORTABLE_TYPES) {
        const rows = state[type as keyof CrmState] as { importedBatchId?: string }[]
        if (Array.isArray(rows)) next[type] = rows.filter((r) => !r.importedBatchId)
      }
      const leads = next.leads as Lead[]
      const byId: Record<string, Lead> = {}
      for (const lead of leads) byId[lead.id] = lead
      return {
        ...(next as unknown as CrmState),
        leadsById: byId,
        ingestedLeadIds: leads.filter((l) => l.ingested).map((l) => l.id),
        importedBatchIds: [],
        referenceVersion: state.referenceVersion + 1,
      }
    })
  },

  rehydrateImports: async () => {
    const payload = await readImports()
    if (!payload) return
    // Sets first: importRecords applies them, but restoring them here as well
    // covers a payload that carried sets and no records.
    if (payload.reference) {
      setActiveReference(payload.reference as never)
      set((s) => ({ referenceVersion: s.referenceVersion + 1 }))
    }
    const records = payload.records as Partial<Record<RecordType, { id: string }[]>>
    if (!Object.keys(records).length) return
    get().importRecords(records, {
      batchId: payload.batchIds[0] ?? 'restored',
      label: 'restored from this browser',
      // Restoring a replace as a merge would hand back the replaced book.
      mode: payload.mode,
      // The counts belong to the original import, not to this restore.
      report: payload.report,
    })
  },

  /**
   * Opens a recovery case. Called only after a human approves the agent's
   * recommendation — the copilot proposes, the user commits.
   */
  createRecoveryCase: (input) => {
    recoverySeq += 1
    const response = get().surveyResponses.find((r) => r.id === input.responseId)
    const name = response?.customerName ?? input.leadId
    const owner = ref().reps.find((r) => r.id === input.ownerId)?.name ?? 'Customer Care'

    const recoveryCase: RecoveryCase = {
      id: nextId('REC-NEW', recoverySeq),
      responseId: input.responseId,
      leadId: input.leadId,
      customerName: name,
      severity: input.severity,
      themeId: input.themeId,
      ownerId: input.ownerId,
      openedAt: DEMO_NOW.toISOString(),
      slaDueAt: new Date(
        DEMO_NOW.getTime() + input.slaDays * 86_400_000,
      ).toISOString(),
      status: 'open',
      recommendedResponse: input.recommendedResponse,
      escalationPath: [owner, 'Customer Care lead', 'Head of CX'],
      timeline: [
        {
          at: DEMO_NOW.toISOString(),
          actor: 'DICE',
          note: 'Recovery case opened after human review of the recommendation.',
        },
      ],
      sourceTicketId: input.sourceTicketId,
    }

    activitySeq += 1
    set((state) => ({
      recoveryCases: [recoveryCase, ...state.recoveryCases],
      activities: [
        {
          id: nextId('ACT', activitySeq),
          object: 'Activity' as const,
          recordId: recoveryCase.id,
          recordName: name,
          action: 'Recovery case opened',
          // Names the actual theme, touchpoint and owner rather than repeating
          // severity and SLA — those two are tightly correlated (severity
          // decides the SLA), so a feed built from only them collapses to the
          // same line for every critical case regardless of who it is about.
          detail: recoveryCaseDetail(recoveryCase, response),
          source: 'DICE' as const,
          at: DEMO_NOW.toISOString(),
        },
        ...state.activities,
      ],
    }))

    return recoveryCase
  },

  updateRecoveryCase: (id, patch, note) =>
    set((state) => {
      const existing = state.recoveryCases.find((c) => c.id === id)
      if (!existing) return state

      const updated: RecoveryCase = {
        ...existing,
        ...patch,
        // Closing always stamps the demo clock, so a case closed live sits on
        // the same timeline as every seeded one.
        closedAt:
          patch.status === 'closed'
            ? (patch.closedAt ?? DEMO_NOW.toISOString())
            : (patch.closedAt ?? existing.closedAt),
        timeline: note
          ? [
              ...existing.timeline,
              { at: DEMO_NOW.toISOString(), actor: 'DICE', note },
            ]
          : existing.timeline,
      }

      activitySeq += 1
      return {
        recoveryCases: state.recoveryCases.map((c) => (c.id === id ? updated : c)),
        activities: [
          {
            id: nextId('ACT', activitySeq),
            object: 'Activity' as const,
            recordId: id,
            recordName: existing.customerName,
            action: `Recovery case ${patch.status ?? 'updated'}`,
            detail: note ?? `${Object.keys(patch).length} field(s) updated`,
            source: 'DICE' as const,
            at: DEMO_NOW.toISOString(),
          },
          ...state.activities,
        ],
      }
    }),

  scheduleSurveyInvite: (inviteId, reason) =>
    set((state) => {
      const invite = state.surveyInvites.find((i) => i.id === inviteId)
      if (!invite) return state

      const updated: SurveyInvite = {
        ...invite,
        status: 'sent',
        eligible: true,
        suppressedReason: undefined,
        sentAt: DEMO_NOW.toISOString(),
      }

      activitySeq += 1
      return {
        surveyInvites: state.surveyInvites.map((i) =>
          i.id === inviteId ? updated : i,
        ),
        activities: [
          {
            id: nextId('ACT', activitySeq),
            object: 'Activity' as const,
            recordId: inviteId,
            recordName: invite.customerName,
            action: 'Survey invite scheduled',
            detail: `${invite.channel} · ${invite.recommendedWindow} — ${reason}`,
            source: 'DICE' as const,
            at: DEMO_NOW.toISOString(),
          },
          ...state.activities,
        ],
      }
    }),

  suppressSurveyInvite: (inviteId, reason) =>
    set((state) => {
      const invite = state.surveyInvites.find((i) => i.id === inviteId)
      if (!invite) return state

      const updated: SurveyInvite = {
        ...invite,
        status: 'suppressed',
        eligible: false,
        suppressedReason: reason,
      }

      activitySeq += 1
      return {
        surveyInvites: state.surveyInvites.map((i) =>
          i.id === inviteId ? updated : i,
        ),
        activities: [
          {
            id: nextId('ACT', activitySeq),
            object: 'Activity' as const,
            recordId: inviteId,
            recordName: invite.customerName,
            action: 'Survey invite suppressed',
            detail: reason,
            source: 'DICE' as const,
            at: DEMO_NOW.toISOString(),
          },
          ...state.activities,
        ],
      }
    }),

  resolveServiceTicket: (id, note) =>
    set((state) => {
      const existing = state.serviceTickets.find((t) => t.id === id)
      if (!existing || existing.status === 'resolved') return state

      const updated: ServiceTicket = {
        ...existing,
        status: 'resolved',
        resolvedAt: DEMO_NOW.toISOString(),
      }

      activitySeq += 1
      return {
        serviceTickets: state.serviceTickets.map((t) =>
          t.id === id ? updated : t,
        ),
        activities: [
          {
            id: nextId('ACT', activitySeq),
            object: 'Activity' as const,
            recordId: id,
            recordName: existing.customerName,
            action: 'Service ticket resolved',
            detail: note,
            source: 'Rep' as const,
            at: DEMO_NOW.toISOString(),
          },
          ...state.activities,
        ],
      }
    }),

  shuffleFeedback: (source) =>
    set((state) => {
      const variant = state.feedbackVariant + 1
      // Stepped by a prime rather than randomised, so a given variant number
      // always reproduces the same book. Press it twice, go back, press it
      // twice again, and you land on the same figures.
      const feedback = buildFeedback({
        leads: state.leads,
        bookings: state.bookings,
        siteVisits: state.siteVisits,
        serviceTickets: state.serviceTickets,
        payments: state.payments,
        engagements: state.engagements,
        seed: DATA_SOURCE_SEEDS[source] + variant * 7919,
      })

      activitySeq += 1
      return {
        ...feedback,
        feedbackVariant: variant,
        activities: [
          {
            id: nextId('ACT', activitySeq),
            object: 'Activity' as const,
            recordId: 'data-source',
            recordName: `Variant ${variant}`,
            action: 'Feedback book re-rolled',
            detail: `${feedback.surveyResponses.length} responses loaded`,
            source: 'EAI Ingestion' as const,
            at: DEMO_NOW.toISOString(),
          },
          ...state.activities,
        ],
      }
    }),

  setFeedbackSource: (source) =>
    set((state) => {
      const feedback = buildFeedback({
        leads: state.leads,
        bookings: state.bookings,
        siteVisits: state.siteVisits,
        serviceTickets: state.serviceTickets,
        payments: state.payments,
        engagements: state.engagements,
        seed: DATA_SOURCE_SEEDS[source],
      })

      activitySeq += 1
      return {
        ...feedback,
        feedbackVariant: 0,
        activities: [
          {
            id: nextId('ACT', activitySeq),
            object: 'Activity' as const,
            recordId: 'data-source',
            recordName: source === 'client' ? 'Client org' : 'Example data',
            action: 'Feedback source switched',
            detail: `${feedback.surveyResponses.length} responses loaded`,
            source: 'EAI Ingestion' as const,
            at: DEMO_NOW.toISOString(),
          },
          ...state.activities,
        ],
      }
    }),

  resetDemoData: (source = 'example') => {
    activitySeq = 0
    taskSeq = 0
    recoverySeq = 0
    /*
     * Imports go too, on disk as well as in memory.
     *
     * Reset means "restore the seeded book", and if the rehearsed figures do
     * not come back then reset is a lie. Clearing the store but not IndexedDB
     * would resurrect the import on the next load and make reset look broken —
     * the likeliest bug in this feature, so the two are done together.
     */
    void clearImports()
    // The sets go back with the records; a reset that restored the book but
    // kept another client's project names would not be a reset.
    resetActiveReference()
    // Back to variant 0 -- the book every rehearsed number refers to.
    set((state) => ({
      ...seedState(source),
      referenceVersion: state.referenceVersion + 1,
    }))
  },
}))
