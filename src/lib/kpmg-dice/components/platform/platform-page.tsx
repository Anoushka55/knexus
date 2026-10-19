'use client'

import { CircleCheck, Info, TriangleAlert, Workflow } from 'lucide-react'

import { ArchitectureDiagram, PIPELINE_NOTE } from './architecture-diagram'
import { ArchitectureTiles } from './architecture-tiles'
import { SPAR_NOTE, SparFramework } from './spar-framework'
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { AGENTS, ARCHETYPE_META, type AgentArchetype } from '@/lib/kpmg-dice/lib/agents'
import { BRAND } from '@/lib/kpmg-dice/config/brand'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/** What Agentforce alone sees vs what DICE adds on top of the same record. */
const COMPARISON: { capability: string; agentforce: string; dice: string }[] = [
  {
    capability: 'Lead status',
    agentforce: 'Whatever the rep last typed into the field',
    dice: 'Status tested against call, email, WhatsApp and site-visit evidence',
  },
  {
    capability: 'Pipeline forecast',
    agentforce: 'Sums the qualified column as recorded',
    dice: 'Flags unsupported records — the daily pipeline truth, not the typed one',
  },
  {
    capability: 'Live calls',
    agentforce: 'Transcript stored after the call, unread',
    dice: 'Intent and sentiment detected mid-call, flag written before it ends',
  },
  {
    capability: 'Customer view',
    agentforce: 'The single enquiry assigned to that rep',
    dice: 'Every project browsed across every channel, merged into one profile',
  },
  {
    capability: 'Segmentation',
    agentforce: 'Static list views and manual tags',
    dice: 'Six buyer personas scored per lead, with the signals behind each',
  },
  {
    capability: 'Next action',
    agentforce: 'Generic task reminders',
    dice: 'Ranked next best action with a stated reason and an owner',
  },
]

const ARCHETYPE_ORDER: AgentArchetype[] = [
  'pattern-identifier',
  'predictive-algorithm',
  'information-extractor',
  'digital-assistant',
  'content-generator',
  'language-translator',
  'code-generator',
]

export function PlatformPage() {
  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="rounded-xl bg-rail-800 p-5 text-white shadow-card">
        <div className="flex items-center gap-2">
          <Workflow className="size-4" />
          <h2 className="text-[19px] font-bold tracking-[-0.01em]">
            How {BRAND.product} works
          </h2>
        </div>
        <p className="mt-1 max-w-3xl text-[12.5px] leading-relaxed text-white/60">
          {BRAND.demoClient} already runs Salesforce CRM and Agentforce.{' '}
          {BRAND.product} does not replace either — it sits on top as the
          intelligence and orchestration layer, fed by sanitized data through
          the EAI infrastructure layer.
        </p>
      </div>

      {/* Architecture */}
      <Card>
        <CardHeader>
          <CardTitle>Reference architecture</CardTitle>
          <p className="shrink-0 text-[11.5px] text-slate-400">
            Source → EAI → sanitization → CRM → intelligence → experience
          </p>
        </CardHeader>
        <CardContent>
          <ArchitectureDiagram />

          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-kpmg-blue/20 bg-kpmg-blue/[0.04] p-3.5">
            <Info
              className="mt-0.5 size-4 shrink-0 text-kpmg-blue"
              strokeWidth={2.1}
            />
            <p className="text-[12px] leading-relaxed text-slate-600">
              {PIPELINE_NOTE}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reference architectures — each opens full width on its own page */}
      <Card>
        <CardHeader>
          <CardTitle>Reference architectures</CardTitle>
          <p className="shrink-0 text-[11.5px] text-slate-400">
            Open one to see the full stack and what this build covers
          </p>
        </CardHeader>
        <CardContent>
          <ArchitectureTiles />
        </CardContent>
      </Card>

      {/* Agentforce vs Agentforce + DICE */}
      <Card>
        <CardHeader>
          <CardTitle>Agentforce alone vs Agentforce + DICE</CardTitle>
          <p className="shrink-0 text-[11.5px] text-slate-400">
            Same records, same org — the difference is what gets derived from them
          </p>
        </CardHeader>
        <CardContent>
          <div className="scrollbar-slim overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed">
              <thead>
                <tr className="text-left">
                  <th className="w-[18%] pb-2 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                    Capability
                  </th>
                  <th className="w-[41%] pb-2 pl-3 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
                    Agentforce alone
                  </th>
                  <th className="w-[41%] pb-2 pl-3 text-[10.5px] font-semibold uppercase tracking-wide text-kpmg-violet">
                    Agentforce + DICE
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr
                    key={row.capability}
                    className="border-t border-slate-100 align-top"
                  >
                    <td className="py-3 pr-3 text-[12.5px] font-semibold text-slate-800">
                      {row.capability}
                    </td>
                    <td className="py-3 pl-3">
                      <div className="flex gap-2 rounded-lg bg-slate-50 p-2.5">
                        <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                        <span className="text-[11.5px] leading-snug text-slate-600">
                          {row.agentforce}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pl-3">
                      <div className="flex gap-2 rounded-lg border border-kpmg-violet/15 bg-kpmg-violet/[0.05] p-2.5">
                        <CircleCheck
                          className="mt-0.5 size-3.5 shrink-0 text-kpmg-violet"
                          strokeWidth={2.2}
                        />
                        <span className="text-[11.5px] leading-snug text-slate-700">
                          {row.dice}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* KPMG AI archetype framework */}
      <Card>
        <CardHeader>
          <CardTitle>KPMG AI archetype framework</CardTitle>
          <p className="shrink-0 text-[11.5px] text-slate-400">
            Every DICE agent is an instance of one archetype
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {ARCHETYPE_ORDER.map((archetype) => {
              const meta = ARCHETYPE_META[archetype]
              const agents = AGENTS.filter((a) => a.archetype === archetype)

              return (
                <div
                  key={archetype}
                  className={cn(
                    'rounded-xl border p-3.5',
                    agents.length
                      ? 'border-slate-200'
                      : 'border-dashed border-slate-200 bg-slate-50/50',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        'text-[12.5px] font-bold leading-tight',
                        agents.length ? meta.accent : 'text-slate-400',
                      )}
                    >
                      {meta.label}
                    </p>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
                        meta.priority === 'High'
                          ? 'bg-red-50 text-red-700'
                          : meta.priority === 'Medium'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      {meta.priority}
                    </span>
                  </div>

                  <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
                    {meta.blurb}
                  </p>

                  <div className="mt-2.5 border-t border-slate-100 pt-2">
                    {agents.length ? (
                      <ul className="space-y-1">
                        {agents.map((agent) => (
                          <li
                            key={agent.id}
                            className="flex gap-1.5 text-[11px] leading-snug text-slate-600"
                          >
                            <span className="mt-[6px] size-1 shrink-0 rounded-full bg-slate-300" />
                            {agent.name.replace(' Agent', '')}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] italic text-slate-400">
                        Not used in this build
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* KPMG SPAR AI Engine framework */}
      <Card>
        <CardHeader>
          <CardTitle>KPMG SPAR AI Engine framework</CardTitle>
          <a
            href="/agents/kpmg-dice/console/csat-nps/survey-optimizer"
            className="shrink-0 text-[11.5px] font-semibold text-kpmg-violet hover:underline"
          >
            Running live in Survey Participation Optimizer &rarr;
          </a>
        </CardHeader>
        <CardContent>
          <SparFramework />

          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-kpmg-violet/20 bg-kpmg-violet/[0.04] p-3.5">
            <Info
              className="mt-0.5 size-4 shrink-0 text-kpmg-violet"
              strokeWidth={2.1}
            />
            <p className="text-[12px] leading-relaxed text-slate-600">
              {SPAR_NOTE}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
