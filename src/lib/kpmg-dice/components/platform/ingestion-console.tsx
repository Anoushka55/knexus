'use client'

import { useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  CircleCheck,
  Copy,
  Database,
  Download,
  Info,
  ShieldCheck,
  TriangleAlert,
  Upload
} from 'lucide-react'

import { Button } from '@/lib/kpmg-dice/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import {
  runIngestionPipeline,
  selectBatch,
  selectIngestionSources,
  type IngestionSourceId,
  type PipelineRun,
} from '@/lib/kpmg-dice/lib/selectors/ingestion'
import { formatDate, formatNumber } from '@/lib/kpmg-dice/lib/format'
import { Progress } from '@/lib/kpmg-dice/components/ui/progress'
import { yieldToPaint } from '@/lib/kpmg-dice/lib/async'
import { parseCsvAsync, toObjectsAsync } from '@/lib/kpmg-dice/lib/csv/parse-csv'
import { planMergeAsync, summarise, type MergePlan } from '@/lib/kpmg-dice/lib/ingestion/merge-plan'
import {
  detectType,
  RECORD_TYPES,
  SCHEMAS,
  type RecordType,
} from '@/lib/kpmg-dice/lib/ingestion/schemas'
import { salesforceCrm } from '@/lib/kpmg-dice/lib/crm/salesforce-crm'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { AGENTS } from '@/lib/kpmg-dice/lib/agents/registry'
import { useAgentContext } from '@/lib/kpmg-dice/lib/agents/use-agent-context'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Data ingestion console.
 *
 * Two ways in. The source list pulls a batch from the book already loaded and
 * runs it through the EAI and sanitization steps the architecture page draws.
 * The file import reads real CSVs, detects what each one is from its headers,
 * validates and deduplicates them, and merges the survivors into the book —
 * where every other screen then reads them.
 *
 * Nothing streams in real time and there is no server: an import is parsed in
 * the browser and kept in this browser. Records are keyed on id, so importing
 * the same file twice replaces those rows rather than duplicating them.
 *
 * The funnel is computed before anything is committed and has to reconcile:
 * received = duplicates + rejected + written. Only the survivors are ingested,
 * which is what makes the numbers mean something.
 */

const BATCH_SIZE = 1000

/**
 * How much of the commit bar validation owns.
 *
 * The remainder belongs to the store write, which is atomic and cannot report
 * from inside itself — so the bar legitimately rests here while it lands rather
 * than pretending to a granularity it does not have.
 */
const VALIDATE_SHARE = 90

const idsOf = (rows: { id: string }[]) => new Set(rows.map((r) => r.id))

interface ParsedFile {
  key: string
  name: string
  headers: string[]
  rows: Record<string, string>[]
  /** Detected from the headers, or set by the user. Null means unrecognised. */
  type: RecordType | null
  warnings: string[]
}

/** One union rather than a pile of booleans that can contradict each other. */
type ImportPhase =
  | { step: 'idle' }
  | { step: 'working'; label: string; percent: number }
  | { step: 'review'; files: ParsedFile[] }
  | { step: 'done'; plan: MergePlan; label: string }
  | { step: 'error'; message: string }

export function IngestionConsole() {
  const leads = useCrmStore((s) => s.leads)
  const engagements = useCrmStore((s) => s.engagements)
  const ingestedLeadIds = useCrmStore((s) => s.ingestedLeadIds)
  const storeLeads = leads
  const customers = useCrmStore((s) => s.customers)
  const siteVisits = useCrmStore((s) => s.siteVisits)
  const bookings = useCrmStore((s) => s.bookings)
  const payments = useCrmStore((s) => s.payments)
  const serviceTickets = useCrmStore((s) => s.serviceTickets)
  const transcripts = useCrmStore((s) => s.transcripts)
  const tasks = useCrmStore((s) => s.tasks)
  const surveyInvites = useCrmStore((s) => s.surveyInvites)
  const surveyResponses = useCrmStore((s) => s.surveyResponses)
  const recoveryCases = useCrmStore((s) => s.recoveryCases)
  const importedBatchIds = useCrmStore((s) => s.importedBatchIds)
  const lastImportReport = useCrmStore((s) => s.lastImportReport)
  const importRecords = useCrmStore((s) => s.importRecords)
  const clearImportedData = useCrmStore((s) => s.clearImportedData)

  const [sourceId, setSourceId] = useState<IngestionSourceId>('salesforce')
  const [preview, setPreview] = useState<PipelineRun | null>(null)
  const [committed, setCommitted] = useState<number | null>(null)

  /*
   * The CSV import.
   *
   * Files are read in the browser, their type detected from the headers rather
   * than the filename, and the whole set planned before anything is written —
   * the same propose-then-commit shape every agent in this build follows.
   */
  const fileRef = useRef<HTMLInputElement>(null)
  const [imp, setImp] = useState<ImportPhase>({ step: 'idle' })
  /*
   * Merge adds to the book; replace swaps it.
   *
   * Off by default — replace throws away everything currently loaded, and that
   * is not a thing to do because a checkbox happened to be remembered.
   */
  const [replaceBook, setReplaceBook] = useState(false)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = [...(e.target.files ?? [])]
    // Reset the input so choosing the same file twice still fires a change.
    e.target.value = ''
    if (!picked.length) return

    /*
     * Progress is weighted by file size, not file count.
     *
     * A 9 MB export and a 40 KB reference set are one file each and nowhere
     * near one unit of work each — counting files would park the bar at 50%
     * for a minute and then finish instantly.
     */
    const totalBytes = picked.reduce((sum, f) => sum + f.size, 0) || 1
    let doneBytes = 0

    setImp({ step: 'working', label: `Reading ${picked.length} file(s)`, percent: 0 })
    try {
      const parsed: ParsedFile[] = []

      for (const file of picked) {
        const share = file.size / totalBytes
        const report = (verb: string, fraction: number) =>
          setImp({
            step: 'working',
            label: `${verb} ${file.name}`,
            percent: Math.min(
              99,
              Math.round((doneBytes / totalBytes + share * fraction) * 100),
            ),
          })

        report('Reading', 0)
        const text = await file.text()

        // Scanning dominates; turning rows into objects is the rest.
        const table = await parseCsvAsync(text, {
          onProgress: (p) => report('Parsing', 0.7 * (p.bytes / p.totalBytes)),
        })

        if (!table.rows.length) {
          parsed.push({
            key: `${file.name}-empty`,
            name: file.name,
            headers: table.headers,
            rows: [],
            type: null,
            warnings: ['no data rows'],
          })
          doneBytes += file.size
          continue
        }

        const warnings: string[] = []
        if (table.truncated) warnings.push('file appears truncated')
        if (table.raggedRowCount) warnings.push(`${table.raggedRowCount} ragged row(s)`)

        const objects = await toObjectsAsync(table, (done, total) =>
          report('Indexing', 0.7 + 0.3 * (total ? done / total : 1)),
        )

        /*
         * The combined export carries every type in one file, so it is split
         * here by its own recordType column. A per-entity file is identified by
         * its header signature instead.
         */
        if (table.headers.includes('recordType')) {
          const groups = new Map<string, Record<string, string>[]>()
          for (const row of objects) {
            const t = row.recordType
            if (!t) continue
            const bucket = groups.get(t) ?? []
            bucket.push(row)
            groups.set(t, bucket)
          }
          for (const [t, rows] of groups) {
            const known = (RECORD_TYPES as string[]).includes(t)
            parsed.push({
              key: `${file.name}-${t}`,
              name: `${file.name} → ${known ? SCHEMAS[t as RecordType].label : t}`,
              headers: table.headers,
              rows,
              type: known ? (t as RecordType) : null,
              warnings,
            })
          }
          doneBytes += file.size
          continue
        }

        const { type } = detectType(table.headers)
        parsed.push({
          key: file.name,
          name: file.name,
          headers: table.headers,
          rows: objects,
          type,
          warnings,
        })
        doneBytes += file.size
      }

      setImp({ step: 'review', files: parsed })
    } catch (error) {
      setImp({
        step: 'error',
        message:
          error instanceof Error
            ? `Could not read the file: ${error.message}`
            : 'Could not read the file.',
      })
    }
  }

  function setFileType(key: string, type: RecordType | '') {
    setImp((prev) =>
      prev.step === 'review'
        ? {
            ...prev,
            files: prev.files.map((f) =>
              f.key === key ? { ...f, type: type === '' ? null : type } : f,
            ),
          }
        : prev,
    )
  }

  const readyTypes =
    imp.step === 'review' ? imp.files.filter((f) => f.type && f.rows.length) : []
  const readyRows = readyTypes.reduce((a, f) => a + f.rows.length, 0)
  /* No second import while one is mid-flight — the two would interleave. */
  const working = imp.step === 'working'

  async function handleImportCommit() {
    if (imp.step !== 'review') return

    const grouped: Partial<Record<RecordType, Record<string, string>[]>> = {}
    for (const f of imp.files) {
      if (!f.type || !f.rows.length) continue
      grouped[f.type] = [...(grouped[f.type] ?? []), ...f.rows]
    }

    const label = imp.files.map((f) => f.name).join(', ').slice(0, 80)
    setImp({ step: 'working', label: 'Validating records', percent: 0 })

    try {
      /*
       * Existing ids for every type, not only the four that are foreign-key
       * targets. The extra ones are not needed to resolve references, but they
       * are what lets the plan report how many rows will REPLACE an existing
       * record rather than add one — without them that figure reads zero and
       * quietly understates what the import is about to do.
       */
      const plan = await planMergeAsync(
        grouped,
        {
          leads: idsOf(storeLeads),
          customers: idsOf(customers),
          engagements: idsOf(engagements),
          siteVisits: idsOf(siteVisits),
          bookings: idsOf(bookings),
          payments: idsOf(payments),
          serviceTickets: idsOf(serviceTickets),
          transcripts: idsOf(transcripts),
          tasks: idsOf(tasks),
          surveyInvites: idsOf(surveyInvites),
          surveyResponses: idsOf(surveyResponses),
          recoveryCases: idsOf(recoveryCases),
        },
        (p) => {
          const fraction = p.rowsTotal ? p.rowsDone / p.rowsTotal : 1
          setImp({
            step: 'working',
            label: `Validating ${SCHEMAS[p.type].label.toLowerCase()}`,
            percent: Math.round(fraction * VALIDATE_SHARE),
          })
        },
      )

      const records: Partial<Record<RecordType, { id: string }[]>> = {}
      for (const t of plan.byType) {
        if (t.accepted.length) records[t.type] = t.accepted
      }

      /*
       * The write itself is not sliced, and must not be: it happens inside one
       * store update so that nothing ever renders against a half-merged book.
       * It is also the cheapest step. One yield first, so this last label is
       * actually painted before the thread is taken.
       */
      setImp({ step: 'working', label: 'Writing to the book', percent: VALIDATE_SHARE })
      await yieldToPaint()

      const mode = replaceBook ? 'replace' : 'merge'
      importRecords(records, {
        batchId: `imp-${Date.now()}`,
        label,
        mode,
        // Kept on the store so the outcome outlives this screen.
        report: summarise(plan, { label, mode }),
      })
      setImp({ step: 'done', plan, label })
    } catch (error) {
      setImp({
        step: 'error',
        message:
          error instanceof Error
            ? `Could not complete the import: ${error.message}`
            : 'Could not complete the import.',
      })
    }
  }

  /*
   * Which agents will have something to say about the book as it now stands.
   *
   * An agent going quiet after an import usually is not a bug — a book with no
   * overdue payments should leave the payment agent silent — but a screen that
   * simply shows nothing reads as broken. So the count is stated, and anything
   * silent says what it was looking for.
   *
   * detectSync is a pure rule pass, so seventeen of them are safe to run
   * inline. The context is built once and shared: several agents walk every
   * verbatim, and rebuilding per agent would rescan the book seventeen times.
   */
  const agentCtx = useAgentContext()
  const readiness = useMemo(() => {
    if (imp.step !== 'done') return null
    return AGENTS.map((agent) => ({
      id: agent.id,
      name: agent.name.replace(' Agent', ''),
      count: agent.detectSync(agentCtx).length,
      looksFor: agent.aiSolution,
    }))
  }, [imp.step, agentCtx])

  const sources = useMemo(
    () => selectIngestionSources({ leads, engagements, ingestedLeadIds }),
    [leads, engagements, ingestedLeadIds],
  )

  const active = sources.find((s) => s.id === sourceId)
  const totalPending = leads.length - ingestedLeadIds.length

  function handlePull() {
    const batch = selectBatch({
      leads,
      engagements,
      ingestedLeadIds,
      sourceId,
      size: BATCH_SIZE,
    })
    setPreview(runIngestionPipeline(batch))
    setCommitted(null)
  }

  function handleCommit() {
    if (!preview) return
    // Only the survivors. Duplicates and rejects never reach the CRM, which is
    // the whole point of showing the funnel before writing it.
    salesforceCrm.ingestSanitizedData(preview.writtenIds)
    setCommitted(preview.written)
    setPreview(null)
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatTile
          label="Awaiting ingestion"
          value={formatNumber(totalPending)}
          sub="Records not yet through EAI"
          icon={Download}
        />
        <StatTile
          label="Ingested"
          value={formatNumber(ingestedLeadIds.length)}
          sub="Eligible for DICE reasoning"
          icon={CircleCheck}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
        <StatTile
          label="Connected sources"
          value={`${sources.filter((s) => s.pending + s.ingested > 0).length}`}
          sub={`of ${sources.length} configured`}
          icon={Database}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[340px_minmax(0,1fr)]">
        {/* Sources */}
        <Card className="flex min-w-0 flex-col">
          <CardHeader>
            <CardTitle>Source systems</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul>
              {sources.map((source) => {
                const selected = source.id === sourceId
                return (
                  <li key={source.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSourceId(source.id)
                        setPreview(null)
                        setCommitted(null)
                      }}
                      className={cn(
                        'flex w-full items-center gap-2.5 border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-0',
                        selected ? 'bg-kpmg-blue/[0.06]' : 'hover:bg-slate-50',
                      )}
                    >
                      <span
                        className={cn(
                          'size-2 shrink-0 rounded-full',
                          source.pending > 0
                            ? 'bg-kpmg-teal'
                            : 'bg-slate-300',
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-semibold text-slate-900">
                          {source.label}
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">
                          {source.sublabel}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="nums block text-[12.5px] font-bold text-slate-900">
                          {formatNumber(source.pending)}
                        </span>
                        <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                          records
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Bring your own files — parsed, validated and merged into the book */}
        <Card className="lg:col-start-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Upload className="size-4 text-kpmg-blue" />
              Import CSV files
            </CardTitle>
            <span className="text-[10.5px] font-medium text-slate-400">
              {importedBatchIds.length ? `${importedBatchIds.length} import(s) merged` : 'Up to 12 at once'}
            </span>
          </CardHeader>
          <CardContent className="pb-4">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              multiple
              onChange={handleFiles}
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={working}
              >
                <Upload />
                Choose CSV files
              </Button>
              {imp.step === 'review' && (
                <Button onClick={handleImportCommit} disabled={!readyTypes.length}>
                  <ShieldCheck />
                  {readyTypes.length
                    ? `${replaceBook ? 'Replace book with' : 'Merge'} ${formatNumber(readyRows)} record(s)`
                    : 'No recognised files'}
                </Button>
              )}
              {importedBatchIds.length > 0 && (
                <Button variant="ghost" onClick={clearImportedData} disabled={working}>
                  Clear imported data
                </Button>
              )}
            </div>

            {imp.step === 'working' && (
              <div className="mt-3">
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <p className="truncate text-[12px] font-medium text-slate-600">
                    {imp.label}…
                  </p>
                  <span className="nums shrink-0 text-[12px] font-bold text-kpmg-blue">
                    {imp.percent}%
                  </span>
                </div>
                <Progress value={imp.percent} />
              </div>
            )}

            {imp.step === 'error' && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[12px] text-amber-800">
                {imp.message}
              </p>
            )}

            {imp.step === 'review' && (
              <>
              <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
                <input
                  type="checkbox"
                  checked={replaceBook}
                  onChange={(e) => setReplaceBook(e.target.checked)}
                  className="mt-0.5 size-3.5 shrink-0 accent-kpmg-blue"
                />
                <span className="text-[11.5px] leading-snug text-slate-600">
                  <b className="font-semibold text-slate-800">
                    Replace the current book
                  </b>{' '}
                  — clear everything loaded now and show only these files, so the
                  platform reads as a different client entirely. Leave unticked to
                  add these records alongside what is already here. Either way,
                  Clear or Reset restores the original book.
                </span>
              </label>

              <div className="mt-3 space-y-1.5">
                {imp.files.map((f) => (
                  <div
                    key={f.key}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold text-slate-800">
                        {f.name}
                      </span>
                      <span className="nums block text-[11px] text-slate-500">
                        {formatNumber(f.rows.length)} row(s) · {f.headers.length} column(s)
                        {f.warnings.length ? ` · ${f.warnings.join(' · ')}` : ''}
                      </span>
                    </span>
                    {/*
                      Detected from the headers, not the filename — a renamed
                      file must still import. The override exists because a
                      confident guess is still a guess.
                    */}
                    <select
                      value={f.type ?? ''}
                      onChange={(e) => setFileType(f.key, e.target.value as RecordType | '')}
                      className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11.5px] text-slate-700"
                    >
                      <option value="">— not recognised —</option>
                      {RECORD_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {SCHEMAS[t].label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              </>
            )}

            {imp.step === 'done' && (
              <div className="mt-3 rounded-lg border border-kpmg-teal/25 bg-kpmg-teal/[0.05] p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-kpmg-teal">
                  <CircleCheck className="size-3" strokeWidth={2.6} />
                  Merged into the book
                </p>
                <div className="mt-2 space-y-0.5">
                  {imp.plan.byType.map((t) => (
                    <p key={t.type} className="nums text-[11.5px] text-slate-600">
                      {SCHEMAS[t.type].label}: {formatNumber(t.accepted.length)} written
                      {t.replacing > 0 ? `, ${formatNumber(t.replacing)} replaced` : ''}
                      {t.rejected > 0 ? `, ${formatNumber(t.rejected)} rejected` : ''}
                      {t.reasons.length
                        ? ` — ${t.reasons.map((r) => `${r.reason} (${formatNumber(r.count)})`).join(' · ')}`
                        : ''}
                      {t.repaired.length
                        ? ` · ${t.repaired.map((r) => `${r.reason} (${formatNumber(r.count)})`).join(' · ')}`
                        : ''}
                    </p>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  Records are keyed on id, so re-importing the same file replaces
                  those rows rather than adding a second copy. Imported data is
                  held in this browser and is removed by Clear or by Reset.
                </p>
              </div>
            )}

            {imp.step === 'done' && readiness && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-kpmg-violet">
                  Agent readiness ·{' '}
                  {readiness.filter((r) => r.count > 0).length} of {readiness.length}{' '}
                  will produce findings
                </p>
                {readiness.some((r) => r.count === 0) ? (
                  <>
                    <p className="mt-1.5 text-[11.5px] leading-snug text-slate-500">
                      These found nothing in this book. That is often correct — an
                      agent with nothing to report should stay quiet — but here is
                      what each was looking for.
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {readiness
                        .filter((r) => r.count === 0)
                        .map((r) => (
                          <div key={r.id}>
                            <p className="text-[11.5px] font-semibold text-slate-800">
                              {r.name}
                            </p>
                            <p className="text-[11px] leading-snug text-slate-500">
                              {r.looksFor}
                            </p>
                          </div>
                        ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-1.5 text-[11.5px] leading-snug text-slate-500">
                    Every agent found something to report in this book.
                  </p>
                )}
              </div>
            )}

            {imp.step !== 'done' && lastImportReport && (
              /*
               * The same counts, after the fact.
               *
               * The done-step report is rendered once and lost on the next
               * navigation, which leaves no way to tell "this customer has no
               * conversations" from "every conversation row was refused".
               */
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Last import · {formatDate(lastImportReport.savedAt)} ·{' '}
                  {lastImportReport.mode === 'replace' ? 'replaced the book' : 'merged'}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  {lastImportReport.label}
                </p>
                <div className="mt-2 space-y-0.5">
                  {lastImportReport.byType.map((t) => (
                    <p key={t.type} className="nums text-[11.5px] text-slate-600">
                      {SCHEMAS[t.type].label}: {formatNumber(t.accepted)} written
                      {t.rejected > 0 ? `, ${formatNumber(t.rejected)} rejected` : ''}
                      {t.reasons.length
                        ? ` — ${t.reasons.map((r) => `${r.reason} (${formatNumber(r.count)})`).join(' · ')}`
                        : ''}
                      {t.repaired.length
                        ? ` · ${t.repaired.map((r) => `${r.reason} (${formatNumber(r.count)})`).join(' · ')}`
                        : ''}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {imp.step === 'idle' && (
              <p className="mt-2.5 text-[11.5px] leading-relaxed text-slate-500">
                Select one file or many — the type of each is detected from its
                headers, so the order does not matter. Records are validated,
                deduplicated and merged into the book, and show up on every
                screen. Contact details are stored as given in this browser; they
                are not masked, and Clear is the only way to remove them.
              </p>
            )}
          </CardContent>
        </Card>

      {/* Pipeline */}
        <Card className="flex min-w-0 flex-col">
          <CardHeader>
            <CardTitle>EAI &rarr; sanitization &rarr; CRM</CardTitle>
            <span className="text-[10.5px] font-medium text-slate-400">
              Batch of {formatNumber(BATCH_SIZE)}
            </span>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handlePull} disabled={!active?.pending}>
                <Download />
                {active?.pending
                  ? `Pull batch from ${active.label}`
                  : 'No records left on this source'}
              </Button>
              {preview && (
                <Button variant="outline" onClick={handleCommit}>
                  <ShieldCheck />
                  Write {formatNumber(preview.written)} to CRM
                </Button>
              )}
            </div>

            {committed !== null && (
              <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-kpmg-teal/25 bg-kpmg-teal/[0.05] p-3">
                <CircleCheck
                  className="mt-0.5 size-4 shrink-0 text-kpmg-teal"
                  strokeWidth={2.3}
                />
                <p className="text-[12px] leading-relaxed text-slate-600">
                  {formatNumber(committed)} record(s) written to Salesforce and
                  logged to the CRM activity feed. They are now eligible for DICE
                  reasoning — Next Best Action and the copilots can act on them.
                </p>
              </div>
            )}

            {preview && <PipelineFunnel run={preview} />}

            {!preview && committed === null && (
              <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
                Pull a batch to see what the EAI layer would deliver and what
                sanitization would do to it. Nothing is written until you commit
                it.
              </p>
            )}

            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-kpmg-blue/20 bg-kpmg-blue/[0.04] p-3">
              <Info
                className="mt-0.5 size-4 shrink-0 text-kpmg-blue"
                strokeWidth={2.1}
              />
              <p className="text-[12px] leading-relaxed text-slate-600">
                Demonstration pipeline. Records are pulled from the seeded book
                rather than streamed from a live system, but every count is
                computed from the records in the batch — duplicates from
                colliding contact details, rejections from conflicts already
                recorded against the lead.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * The EAI -> sanitization -> CRM funnel.
 *
 * Extracted so the source-pull path and the CSV path render the same thing.
 * Two copies would drift, and the reconciliation line below — the one that
 * proves nothing was lost between stages — has to live in exactly one place.
 */
function PipelineFunnel({ run }: { run: PipelineRun }) {
  return (
    <>
                            <ol className="mt-3 space-y-2">
                  <Stage
                    icon={Download}
                    label="Received via EAI"
                    value={run.received}
                    note="Connectors, event routing, rate and retry handling"
                  />
                  <Stage
                    icon={Copy}
                    label="De-duplication"
                    value={run.duplicates}
                    note="Colliding phone or email against records already seen"
                    tone="amber"
                  />
                  <Stage
                    icon={ShieldCheck}
                    label="PII masked"
                    value={run.piiFieldsMasked}
                    note="Phone and email values masked on the way in"
                  />
                  <Stage
                    icon={TriangleAlert}
                    label="Validation rejected"
                    value={run.rejected}
                    note={
                      run.rejectionReasons.length
                        ? run.rejectionReasons
                            .map((r) => `${r.reason} (${formatNumber(r.count)})`)
                            .join(' · ')
                        : 'Every record passed the validation rules'
                    }
                    tone="amber"
                  />
                  <Stage
                    icon={CircleCheck}
                    label="Written to CRM"
                    value={run.written}
                    note="Cleaned records landing in Salesforce as native objects"
                    tone="teal"
                  />
                </ol>

                <p className="nums mt-2.5 text-[11px] text-slate-400">
                  {formatNumber(run.received)} received ={' '}
                  {formatNumber(run.duplicates)} duplicates +{' '}
                  {formatNumber(run.rejected)} rejected +{' '}
                  {formatNumber(run.written)} written
                </p>
    </>
  )
}

function Stage({
  icon: Icon,
  label,
  value,
  note,
  tone = 'slate',
}: {
  icon: typeof Download
  label: string
  value: number
  note: string
  tone?: 'slate' | 'amber' | 'teal'
}) {
  const ink =
    tone === 'teal'
      ? 'text-kpmg-teal'
      : tone === 'amber' && value > 0
        ? 'text-amber-600'
        : 'text-slate-400'

  return (
    <li className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5">
      <Icon className={cn('mt-0.5 size-4 shrink-0', ink)} strokeWidth={2.1} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[12.5px] font-semibold text-slate-900">{label}</p>
          <p className="nums shrink-0 text-[13px] font-bold text-slate-900">
            {formatNumber(value)}
          </p>
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{note}</p>
      </div>
      <ArrowRight className="sr-only" aria-hidden />
    </li>
  )
}
