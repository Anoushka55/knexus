import { salesforceCrm } from '@/lib/kpmg-dice/lib/crm'
import { DEMO_NOW } from '@/lib/kpmg-dice/data/reference'
import type { Lead, RecoveryCase } from '@/lib/kpmg-dice/types'
import type {
  Agent,
  AgentActionPlan,
  AgentContext,
  AgentFinding,
  AgentRunResult,
  CrmWrite,
  DecisionLogEntry,
} from './types'
import { AGENTS_BY_ID } from './registry'
import {
  CHAINS_BY_ID,
  NON_CHAINING_AGENT_IDS,
  type ChainStepResult,
} from './chains'
import { baselineConfidence, withCorroboration } from './confidence'
import { detectConflicts, type AgentConflict } from './conflicts'

/**
 * Runs an agent end to end: detect → recommend → (optionally) execute.
 *
 * Execution is deliberately a separate step, so the gallery can show what the
 * agent intends to write before anything touches the CRM.
 */
export async function runAgent(
  agent: Agent,
  ctx: AgentContext,
): Promise<AgentRunResult> {
  const findings = await agent.detect(ctx)
  const actions = await agent.recommendAction(findings, ctx)

  const summary = findings.length
    ? (
        await ctx.ai.complete({
          system: 'You are a real-estate CRM analyst summarising an agent run.',
          messages: [
            {
              role: 'user',
              content: `${agent.name} found ${findings.length} issue(s). Top finding: ${findings[0].headline}. ${findings[0].detail}`,
            },
          ],
          context: { agentId: agent.id },
        })
      ).text
    : 'No matching records in the current book — nothing to action.'

  return {
    agentId: agent.id,
    findings,
    actions,
    summary,
    totalFindings: findings.length,
    ranAt: DEMO_NOW.toISOString(),
  }
}

/**
 * Who proposed the write, so the decision log can name them.
 *
 * Optional throughout: a write committed straight from a screen — a rep
 * flagging a lead from the transcript — is still a decision worth keeping, it
 * just has no agent behind it.
 */
export interface DecisionMeta {
  agentId?: string
  /** Falls back to the registry name for `agentId`, then to a plain actor. */
  agentName?: string
  label?: string
  crmEffect?: string
  contested?: boolean
  contestedWith?: string
}

/** The lead a write lands on, where it lands on one. */
function leadIdOf(write: CrmWrite): string | undefined {
  return 'leadId' in write ? write.leadId : undefined
}

/**
 * Commits one CRM write through the Salesforce facade and returns a
 * human-readable record of what landed.
 *
 * Every approved write in the app passes through here — the agent gallery, the
 * chain, the copilot chat shell and Risk Alerts all call it — which is why the
 * decision log is written here rather than at each of those call sites. A log
 * that depends on four screens remembering to append to it is a log that goes
 * stale the first time a fifth screen is added.
 */
export function executeWrite(write: CrmWrite, meta: DecisionMeta = {}): string {
  const result = commitWrite(write)

  const entry: Omit<DecisionLogEntry, 'id' | 'at'> = {
    agentId: meta.agentId,
    agentName:
      meta.agentName ??
      (meta.agentId ? AGENTS_BY_ID[meta.agentId]?.name : undefined) ??
      'Committed by a person',
    leadId: leadIdOf(write),
    label: meta.label ?? result,
    crmEffect: meta.crmEffect ?? result,
    writeKind: write.kind,
    result,
    contested: meta.contested ?? false,
    contestedWith: meta.contestedWith,
  }
  salesforceCrm.recordDecision(entry)

  return result
}

function commitWrite(write: CrmWrite): string {
  switch (write.kind) {
    case 'flag-lead': {
      const lead = salesforceCrm.getLead(write.leadId)
      salesforceCrm.flagLead(write.leadId, write.flags, write.reason)
      const fields = Object.keys(write.flags).join(', ')
      return `Lead ${lead?.name ?? write.leadId}: updated ${fields}`
    }

    case 'update-lead': {
      salesforceCrm.updateLead(write.leadId, write.patch, {
        action: write.action,
        detail: write.detail,
      })
      return `Lead ${write.leadId}: ${write.action}`
    }

    case 'create-task': {
      const task = salesforceCrm.createTask({
        subject: write.subject,
        whatId: write.leadId,
        ownerId: write.ownerId,
        dueInDays: write.dueInDays,
        priority: write.priority,
        createdBy: 'DICE',
      })
      return `Task ${task.id} created: ${task.subject}`
    }

    case 'log-activity': {
      salesforceCrm.logActivity({
        object: write.object,
        recordId: write.recordId,
        recordName: write.recordName,
        action: write.action,
        detail: write.detail,
        source: 'DICE',
      })
      return `${write.object} ${write.recordName}: ${write.action}`
    }

    case 'suppress-campaign': {
      salesforceCrm.suppressCampaign(write.campaignId, write.reason)
      return `Campaign ${write.campaignId}: outreach suppressed`
    }

    case 'ingest-sanitized': {
      salesforceCrm.ingestSanitizedData(write.leadIds)
      return `${write.leadIds.length} record(s) ingested via EAI`
    }

    case 'schedule-survey': {
      salesforceCrm.scheduleSurveyInvite(write.inviteId, write.reason)
      return `Survey invite ${write.inviteId} scheduled`
    }

    case 'suppress-survey': {
      salesforceCrm.suppressSurveyInvite(write.inviteId, write.reason)
      return `Survey invite ${write.inviteId} suppressed — ${write.reason}`
    }

    case 'create-recovery-case': {
      const recoveryCase = salesforceCrm.createRecoveryCase({
        responseId: write.responseId,
        leadId: write.leadId,
        ownerId: write.ownerId,
        severity: write.severity,
        themeId: write.themeId,
        slaDays: write.slaDays,
        recommendedResponse: write.recommendedResponse,
        sourceTicketId: write.sourceTicketId,
      })
      return `Recovery case ${recoveryCase.id} opened for ${recoveryCase.customerName}`
    }

    case 'tag-feedback': {
      salesforceCrm.logActivity({
        object: 'Activity',
        recordId: write.responseId,
        recordName: write.recordName,
        action: `Feedback tagged ${write.tag}`,
        detail: write.reason,
        source: 'DICE',
      })
      return `${write.recordName}: tagged ${write.tag}`
    }
  }
}

/* ------------------------------------------------------------------ */
/* Recovery, as a bundle rather than a single case                     */
/* ------------------------------------------------------------------ */

export interface RecoveryBundleInput {
  responseId: string
  customerName: string
  /** The lead the response belongs to — the record the loop has to close on. */
  lead: Pick<Lead, 'id' | 'name' | 'stage' | 'crmStatus' | 'evidenceStatus'>
  ownerId: string
  ownerName: string
  severity: RecoveryCase['severity']
  themeId: string
  /** What the customer complained about, for the task subject. */
  aspect: string
  slaDays: number
  recommendedResponse: string
  sourceTicketId?: string
}

/**
 * Everything opening a recovery should actually change.
 *
 * Opening a case on its own is the failure mode this exists to fix: the
 * platform claims recovery changes the pipeline rather than filing a ticket,
 * and until this bundle existed it filed a ticket. A case nobody owns, on a
 * lead still reading "Qualified", is a record of a complaint rather than a
 * response to one.
 *
 * The lead write is conditional on purpose. A closed-won customer has no
 * pipeline status left to correct — downgrading their evidence would be
 * theatre — so post-handover recovery is a case and an owned task, and the
 * caller can see that is all it is before approving.
 */
export function recoveryBundle(input: RecoveryBundleInput): CrmWrite[] {
  const writes: CrmWrite[] = [
    {
      kind: 'create-recovery-case',
      responseId: input.responseId,
      leadId: input.lead.id,
      ownerId: input.ownerId,
      severity: input.severity,
      themeId: input.themeId,
      slaDays: input.slaDays,
      recommendedResponse: input.recommendedResponse,
      sourceTicketId: input.sourceTicketId,
    },
    {
      kind: 'create-task',
      leadId: input.lead.id,
      subject: `Recovery call — ${input.customerName} (${input.aspect})`,
      ownerId: input.ownerId,
      dueInDays: input.slaDays,
      priority: input.severity === 'critical' ? 'High' : 'Normal',
    },
  ]

  // Only where there is still a pipeline claim to contradict, and only where
  // it does not already say so — re-flagging a lead that is already
  // contradicted would fill the activity feed with a change that changed
  // nothing.
  if (
    OPEN_TO_CORRECT.includes(input.lead.stage) &&
    input.lead.evidenceStatus !== 'contradicted'
  ) {
    writes.push({
      kind: 'flag-lead',
      leadId: input.lead.id,
      flags: { evidenceStatus: 'contradicted' },
      reason: `Detractor feedback on ${input.aspect} contradicts the CRM status "${input.lead.crmStatus}".`,
    })
  }

  return writes
}

/** Stages where a CRM status is still a live claim about an open deal. */
const OPEN_TO_CORRECT: Lead['stage'][] = [
  'lead',
  'engaged',
  'qualified',
  'site-visit',
  'proposal',
  'booking',
]

/**
 * What each write in a bundle will do, in the words shown before approval.
 *
 * The preview is the governance, not decoration: a bundle that silently
 * changed a lead's evidence status would break the propose-then-commit rule on
 * the one screen most likely to be demoed.
 */
export function describeWrite(write: CrmWrite): string {
  switch (write.kind) {
    case 'create-recovery-case':
      return `Open a recovery case with a ${write.slaDays}-day SLA`
    case 'create-task':
      return `Create a task for the owner, due in ${write.dueInDays} days`
    case 'flag-lead':
      return `Set the lead's evidence status to contradicted`
    default:
      return write.kind
  }
}

export function executeAction(
  action: AgentActionPlan,
  meta: Omit<DecisionMeta, 'agentId' | 'label' | 'crmEffect'> = {},
): string {
  return executeWrite(action.write, {
    ...meta,
    agentId: action.agentId,
    label: action.label,
    crmEffect: action.crmEffect,
  })
}

/* ---------- Chained runs ---------- */

export interface ChainRunResult {
  chainId: string
  leadId: string
  steps: ChainStepResult[]
  /** Every plan the chain produced, deduplicated. */
  plans: AgentActionPlan[]
  /** How many steps actually rested on an earlier agent's conclusion. */
  handoffs: number
  /**
   * The book-level agents' read on what the chain found.
   *
   * These five cannot be per-customer steps — their findings are about themes,
   * campaigns and the pipeline, not about one person. But they can answer "is
   * this customer's problem a pattern or a one-off?", which is exactly the
   * context a human needs before committing. So they run last and are matched
   * against what the chain concluded.
   */
  context: ContextResult[]
  /** Where two agents want opposite things for this customer. */
  conflicts: AgentConflict[]
}

export interface ContextResult {
  agentId: string
  agentName: string
  status: 'concluded' | 'nothing-to-add'
  headline?: string
  detail?: string
  evidence?: string[]
  confidence?: number
  /** The chain conclusion this context was matched against. */
  matchedOn?: string
}

/**
 * Runs a declared chain for one customer.
 *
 * Each step sees what earlier steps concluded through `ctx.priorFindings`, so
 * a later agent can cite a conclusion instead of re-deriving it from raw
 * records. Findings are filtered to this lead first — a chain is about one
 * customer, and passing the whole book forward would let an agent cite a
 * finding about somebody else.
 *
 * Nothing is written. The chain proposes; the human commits, exactly as a solo
 * agent run does.
 */
export async function runChain(
  chainId: string,
  leadId: string,
  ctx: AgentContext,
  /**
   * Run every agent blind to the others, as the gallery does.
   *
   * This has to be a real mode rather than a display filter. Blanking
   * priorFindings on the context does nothing — runChain replaces it per step
   * with its own accumulator — so hiding the citation line while leaving the
   * evidence untouched would fake the comparison the toggle exists to prove.
   */
  opts: { isolated?: boolean } = {},
): Promise<ChainRunResult> {
  const chain = CHAINS_BY_ID[chainId]
  if (!chain) throw new Error(`Unknown chain: ${chainId}`)

  const steps: ChainStepResult[] = []
  const plans: AgentActionPlan[] = []
  const pooled: AgentFinding[] = []
  let handoffs = 0

  /*
   * Narrow the book to this customer before running anything.
   *
   * Agents rank the whole book and cap their output, so running them globally
   * and filtering afterwards silently drops the customer whenever they are not
   * in that agent's worst-N. Two agents can both have something to say about a
   * customer and still never overlap. Scoping the context first makes each
   * agent evaluate the customer in front of it, which is what a per-customer
   * chain actually means — and it needs no change to any agent.
   */
  const scoped = scopeToLead(ctx, leadId)

  for (const step of chain.steps) {
    const agent = AGENTS_BY_ID[step.agentId]
    if (!agent) continue

    const stepCtx: AgentContext = {
      ...scoped,
      priorFindings: opts.isolated ? [] : [...pooled],
    }
    const found = agent
      .detectSync(stepCtx)
      .filter((f) => f.leadId === leadId)

    if (!found.length) {
      steps.push({
        agentId: agent.id,
        agentName: agent.name,
        role: step.role,
        status: 'nothing-to-add',
        findings: [],
      })
      continue
    }

    // Resolve the citation for display, if this agent took one.
    const citing = found.find((f) => f.citesFindingId)
    const source = citing
      ? pooled.find((f) => f.id === citing.citesFindingId)
      : undefined
    if (source) handoffs += 1

    steps.push({
      agentId: agent.id,
      agentName: agent.name,
      role: step.role,
      status: 'concluded',
      findings: found,
      cited: source
        ? {
            agentName: AGENTS_BY_ID[source.agentId ?? '']?.name ?? 'Earlier step',
            headline: source.headline,
            evidence: source.evidence,
          }
        : undefined,
    })

    pooled.push(...found)
    plans.push(...(await agent.recommendAction(found, stepCtx)))
  }

  /*
   * Corroboration is applied after the fact, not during.
   *
   * An agent cannot know while it runs whether a later one will agree, so
   * weighting a conclusion by agreement has to happen once every step has had
   * its say. Each finding is raised by how many *other* agents independently
   * concluded something about the same customer.
   */
  const perAgent = new Set(pooled.map((f) => f.agentId))
  for (const step of steps) {
    step.findings = step.findings.map((f) =>
      withCorroboration(
        { ...f, confidence: f.confidence ?? baselineConfidence(f) },
        Math.max(0, perAgent.size - 1),
      ),
    )
  }

  const deduped = dedupePlans(plans)

  return {
    chainId,
    leadId,
    steps,
    plans: deduped,
    handoffs,
    context: bookLevelContext(scoped, pooled),
    conflicts: detectConflicts(deduped),
  }
}

/**
 * What the book-level agents make of the chain's conclusions.
 *
 * Matching is on shared words between the chain's headlines and each aggregate
 * agent's subject — the theme, campaign or touchpoint it reports on. Crude, but
 * honest: it only fires on a genuine textual overlap, and an agent with no
 * overlap says it has nothing to add rather than being shown attached to a
 * customer it never mentioned.
 */
function bookLevelContext(
  ctx: AgentContext,
  chainFindings: AgentFinding[],
): ContextResult[] {
  // Words the chain actually used, minus filler that would match anything.
  const STOP = new Set([
    'the', 'and', 'for', 'with', 'this', 'that', 'from', 'has', 'was', 'not',
    'open', 'days', 'day', 'scored', 'customer', 'lead', 'no', 'a', 'an', 'in',
    'on', 'of', 'to', 'is', 'are', 'by', 'at', 'it', 'its',
  ])
  const chainWords = new Set(
    chainFindings
      .flatMap((f) => `${f.headline} ${f.detail}`.toLowerCase().split(/[^a-z]+/))
      // Six characters and up. The first cut allowed four and matched
      // "cross" from "Cross-project" against an unrelated chain — a context
      // panel that fires on noise is worse than one that stays quiet.
      .filter((w) => w.length >= 6 && !STOP.has(w)),
  )

  return NON_CHAINING_AGENT_IDS.map((agentId) => {
    const agent = AGENTS_BY_ID[agentId]
    if (!agent) {
      return { agentId, agentName: agentId, status: 'nothing-to-add' as const }
    }

    let findings: AgentFinding[] = []
    try {
      // These read the whole book on purpose — that is what makes them context.
      findings = agent.detectSync(ctx)
    } catch {
      findings = []
    }

    /*
     * Match on the agent's own subject — the theme or campaign it reports on —
     * not on its headline prose. The headline carries counts and verbs that
     * collide with anything; the subject is what the finding is actually about.
     */
    const hit = findings.find((f) =>
      f.subjectName
        .toLowerCase()
        .split(/[^a-z]+/)
        .some((w) => w.length >= 6 && chainWords.has(w)),
    )

    if (!hit) {
      return {
        agentId,
        agentName: agent.name,
        status: 'nothing-to-add' as const,
      }
    }

    const matched = [...chainWords].find((w) =>
      hit.subjectName.toLowerCase().includes(w),
    )

    return {
      agentId,
      agentName: agent.name,
      status: 'concluded' as const,
      headline: hit.headline,
      detail: hit.detail,
      evidence: hit.evidence,
      confidence: hit.confidence ?? baselineConfidence(hit),
      matchedOn: matched,
    }
  })
}

/**
 * Collapses plans that would make the same write.
 *
 * Two agents reaching the same conclusion is a signal, not a reason to write
 * twice. Keyed on the write itself rather than on the agent, so the duplicate
 * is caught however it was arrived at.
 */
function dedupePlans(plans: AgentActionPlan[]): AgentActionPlan[] {
  const seen = new Map<string, AgentActionPlan>()
  for (const p of plans) {
    const key = `${p.write.kind}::${p.leadId ?? ''}::${p.label}`
    if (!seen.has(key)) seen.set(key, p)
  }
  return [...seen.values()]
}

/**
 * The book as it concerns one customer.
 *
 * Everything keyed by lead is filtered; reference data the agents need for
 * context (campaigns, reps) is left whole. Survey responses drive the recovery
 * and feedback agents, so those are narrowed by lead too.
 */
function scopeToLead(ctx: AgentContext, leadId: string): AgentContext {
  const responseIds = new Set(
    ctx.surveyResponses.filter((r) => r.leadId === leadId).map((r) => r.id),
  )
  return {
    ...ctx,
    leads: ctx.leads.filter((l) => l.id === leadId),
    engagements: ctx.engagements.filter((e) => e.leadId === leadId),
    siteVisits: ctx.siteVisits.filter((v) => v.leadId === leadId),
    bookings: ctx.bookings.filter((b) => b.leadId === leadId),
    payments: ctx.payments.filter((p) => p.leadId === leadId),
    serviceTickets: ctx.serviceTickets.filter((t) => t.leadId === leadId),
    // A task points at its record through whatId, not a leadId.
    tasks: ctx.tasks.filter((t) => t.whatId === leadId),
    surveyInvites: ctx.surveyInvites.filter((i) => i.leadId === leadId),
    surveyResponses: ctx.surveyResponses.filter((r) => r.leadId === leadId),
    recoveryCases: ctx.recoveryCases.filter((c) => c.leadId === leadId),
    feedbackThemes: ctx.feedbackThemes.filter((t) =>
      t.responseIds.some((id) => responseIds.has(id)),
    ),
  }
}

/**
 * Customers this chain actually has something to say about, best first.
 *
 * A chain is only worth showing on a customer whose records trigger several of
 * its steps, and that cannot be guessed — it has to be measured against the
 * book. Scoring candidates here means the picker offers customers where the
 * chain genuinely fires instead of leaving the viewer to hunt for one.
 *
 * Cheap because detectSync is a pure rule pass with no AI call.
 */
export interface ChainCandidate {
  leadId: string
  name: string
  steps: number
  handoffs: number
  /** Two of this chain's agents want opposite things for this customer. */
  contested?: boolean
}

export async function candidatesForChain(
  chainId: string,
  ctx: AgentContext,
  limit = 6,
): Promise<ChainCandidate[]> {
  const chain = CHAINS_BY_ID[chainId]
  if (!chain) return []

  // Leads any step of this chain flags across the whole book.
  const seen = new Set<string>()
  for (const step of chain.steps) {
    const agent = AGENTS_BY_ID[step.agentId]
    if (!agent) continue
    for (const f of agent.detectSync(ctx)) if (f.leadId) seen.add(f.leadId)
  }

  /*
   * Disagreement will not show up in that set.
   *
   * Agents rank the whole book and report their worst five, so two of them
   * landing on the same customer globally is rare — the contested cases are
   * customers neither agent ranks highly on its own but both have something to
   * say about once you look at them directly. So for the contested chain the
   * search widens to customers with a service ticket or a survey response,
   * which is where an opt-out and a recovery case can genuinely collide.
   */
  if (chain.kind === 'Contested') {
    const ticketed = new Set(ctx.serviceTickets.map((t) => t.leadId))
    const answered = new Set(ctx.surveyResponses.map((r) => r.leadId))
    let widened = 0
    for (const lead of ctx.leads) {
      if (widened >= CONTESTED_SCAN_LIMIT) break
      if (ticketed.has(lead.id) || answered.has(lead.id)) {
        seen.add(lead.id)
        widened += 1
      }
    }
  }

  const scored: ChainCandidate[] = []

  for (const leadId of seen) {
    const scoped = scopeToLead(ctx, leadId)
    const pooled: AgentFinding[] = []
    let hits = 0
    let handoffs = 0

    /*
     * Replay the chain with detectSync only — no AI call, no plans — so this
     * stays cheap enough to score every candidate. Counting handoffs rather
     * than steps is the point: a customer where four agents each speak but none
     * cites another demonstrates nothing, and that is exactly what ranking by
     * step count alone kept surfacing.
     */
    for (const step of chain.steps) {
      const agent = AGENTS_BY_ID[step.agentId]
      if (!agent) continue
      const found = agent
        .detectSync({ ...scoped, priorFindings: [...pooled] })
        .filter((f) => f.leadId === leadId)
      if (!found.length) continue
      hits += 1
      if (found.some((f) => f.citesFindingId && pooled.some((p) => p.id === f.citesFindingId))) {
        handoffs += 1
      }
      pooled.push(...found)
    }

    const contested =
      chain.kind === 'Contested' && hits > 1
        ? detectConflicts(await plansFor(chain, scoped)).length > 0
        : false

    if (hits > 1) {
      scored.push({
        leadId,
        name: ctx.leads.find((l) => l.id === leadId)?.name ?? leadId,
        steps: hits,
        handoffs,
        contested,
      })
    }
  }

  /*
   * A contested customer outranks everything: it is the case the chain exists
   * to show. After that a visible handoff beats a longer chain that never
   * passes anything.
   */
  return scored
    .sort(
      (a, b) =>
        Number(b.contested ?? false) - Number(a.contested ?? false) ||
        b.handoffs - a.handoffs ||
        b.steps - a.steps,
    )
    .slice(0, limit)
}

/** How many record-bearing customers the contested scan will look at. */
const CONTESTED_SCAN_LIMIT = 260

/**
 * The plans this chain's agents would propose for one already-scoped customer.
 *
 * recommendAction is genuinely async, so this awaits it rather than reading a
 * promise as if it were an array — that shortcut would have silently found no
 * conflicts at all while looking like it worked.
 */
async function plansFor(
  chain: { steps: { agentId: string }[] },
  scoped: AgentContext,
): Promise<AgentActionPlan[]> {
  const out: AgentActionPlan[] = []
  for (const step of chain.steps) {
    const agent = AGENTS_BY_ID[step.agentId]
    if (!agent) continue
    const found = agent.detectSync(scoped)
    if (!found.length) continue
    out.push(...(await agent.recommendAction(found, scoped)))
  }
  return out
}
