'use client'

import { useEffect, useRef, useState } from 'react'

import { CHAINS, NON_CHAINING_AGENT_IDS } from '@/lib/kpmg-dice/lib/agents/chains'
import { AGENTS, AGENTS_BY_ID } from '@/lib/kpmg-dice/lib/agents/registry'

/**
 * DICE Agent Collaboration Fabric — how the seventeen agents hand conclusions
 * to one another.
 *
 * Every name, lane and sequence on this slide is read from the running agent
 * modules rather than retyped. A diagram that restates the code is a diagram
 * that goes quietly wrong the first time a chain changes, and the drawing would
 * still look right — which is the worst kind of wrong. Same reasoning as the
 * SPAR framework card.
 *
 * Built on the house 1600x900 stage scaled to whatever width it is given, so
 * proportions hold rather than reflowing to the browser.
 *
 * Colour tokens live on the root element rather than in the Tailwind theme.
 * They describe this one slide and would be noise in a design system.
 */

const STAGE_W = 1600
const STAGE_H = 900

/* The stage is 1600 wide with 46px of padding, so 1508 of content. */
const LANE_LABEL_W = 152
const NODE_W = 306
const ARROW_W = 44

/** Circled digits, so a node can name the step it cites without a legend. */
const MARK = ['①', '②', '③', '④']

const KIND_TOKEN: Record<string, string> = {
  Contested: 'var(--amber)',
  Reactive: 'var(--orange)',
  Proactive: 'var(--green)',
  Diagnostic: 'var(--blue)',
}

/**
 * The three groups, computed rather than listed.
 *
 * Chain participants come from the chains themselves; the book-level five name
 * themselves in chains.ts; the remainder is whatever is left. Stated this way
 * the three counts cannot drift apart or double-count an agent, and they always
 * sum to the roster.
 */
const CHAIN_AGENT_IDS = Array.from(
  new Set(CHAINS.flatMap((c) => c.steps.map((s) => s.agentId))),
)
const RESERVE_AGENT_IDS = AGENTS.filter(
  (a) => !CHAIN_AGENT_IDS.includes(a.id) && !NON_CHAINING_AGENT_IDS.includes(a.id),
).map((a) => a.id)

/** The registry suffixes every name with "Agent"; the column heads say so once. */
function shortName(agentId: string) {
  return (AGENTS_BY_ID[agentId]?.name ?? agentId).replace(' Agent', '')
}

export function AgentCollaborationSlide() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      // Never scale past 1:1 — the canvas is the design size, not a minimum.
      setScale(Math.min(1, entry.contentRect.width / STAGE_W))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={wrapRef} className="w-full overflow-hidden">
      <div
        style={{
          height: STAGE_H * scale,
          // Sampled from the two sibling slides so the three read as one deck.
          ['--navy' as string]: '#1F3864',
          ['--orange' as string]: '#C55A11',
          ['--violet' as string]: '#4B3FA8',
          ['--blue' as string]: '#1F6FB8',
          ['--green' as string]: '#2E7D5B',
          ['--amber' as string]: '#B9770E',
          ['--arrow' as string]: '#64789B',
          ['--line' as string]: '#B4C0D6',
          ['--hair' as string]: '#D6DCE8',
          ['--tile' as string]: '#DCE3EF',
          // The one new value: a violet tint for the citation line, mixed to sit
          // with --violet the way --tile sits with --navy.
          ['--cite' as string]: '#EAE7F6',
          ['--grey' as string]: '#4A5568',
        }}
      >
        <div
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          className="flex flex-col rounded-xl border border-slate-200 bg-white px-[46px] py-[34px] text-[color:var(--navy)] shadow-card"
        >
          {/* ---- Title ---- */}
          <div className="flex items-baseline justify-between gap-[20px]">
            <h1 className="text-[39px] font-extrabold leading-[1.06] tracking-[-0.015em]">
              <span style={{ color: 'var(--orange)' }}>AGENT COLLABORATION</span> Fabric
            </h1>
            <p className="text-[14px] font-semibold" style={{ color: 'var(--grey)' }}>
              {AGENTS.length} agents &middot; {CHAINS.length} chains &middot; 3 roles
            </p>
          </div>
          <p className="mt-[7px] text-[14.5px] italic" style={{ color: '#404F66' }}>
            Each step stops, stamps its finding, and passes it forward. An agent that
            cites another did not re-derive that conclusion &mdash; it inherited it.
          </p>

          {/* ---- Step header ---- */}
          <div
            className="mt-[16px] grid"
            style={{
              gridTemplateColumns: `${LANE_LABEL_W}px repeat(3, ${NODE_W}px ${ARROW_W}px) ${NODE_W}px`,
            }}
          >
            <span />
            {MARK.map((mark, i) => (
              <div key={mark} className="contents">
                <p
                  className="text-center text-[11.5px] font-bold uppercase tracking-[0.09em]"
                  style={{ color: 'var(--grey)' }}
                >
                  {mark} Step {i + 1}
                </p>
                {i < MARK.length - 1 && <span />}
              </div>
            ))}
          </div>

          {/* ---- Swimlanes: one per chain, agents in their real positions ---- */}
          <div
            className="mt-[8px] grid min-h-0 flex-1 gap-y-[9px]"
            style={{
              gridTemplateColumns: `${LANE_LABEL_W}px repeat(3, ${NODE_W}px ${ARROW_W}px) ${NODE_W}px`,
              gridTemplateRows: `repeat(${CHAINS.length}, 1fr)`,
            }}
          >
            {CHAINS.map((chain) =>
              chain.steps.map((step, i) => {
                const accent = KIND_TOKEN[chain.kind] ?? 'var(--navy)'
                const contested = chain.kind === 'Contested' && i === chain.steps.length - 1
                return (
                  <div key={`${chain.id}-${step.agentId}-${i}`} className="contents">
                    {/* Lane label, once per chain */}
                    {i === 0 && (
                      <div className="flex min-w-0 flex-col justify-center pr-[12px]">
                        <p
                          className="text-[10px] font-bold uppercase tracking-[0.1em]"
                          style={{ color: accent }}
                        >
                          {chain.kind}
                        </p>
                        <p className="mt-[2px] text-[13px] font-bold leading-[1.2]">
                          {chain.name}
                        </p>
                      </div>
                    )}

                    <div
                      className="flex min-w-0 flex-col justify-center rounded-[5px] border bg-white px-[11px] py-[8px]"
                      style={{
                        borderColor: 'var(--line)',
                        borderLeft: `3px solid ${accent}`,
                      }}
                    >
                      <div className="flex items-baseline justify-between gap-[8px]">
                        <p className="truncate text-[14px] font-bold leading-[1.2]">
                          {shortName(step.agentId)}
                        </p>
                        <span
                          className="shrink-0 text-[9.5px] font-bold uppercase tracking-[0.08em]"
                          style={{ color: 'var(--grey)' }}
                        >
                          {step.role}
                        </span>
                      </div>

                      {/*
                        The third line is the whole point of the slide: step one
                        has nothing to inherit, so it reads the record. Every
                        later step names the step it took its input from.
                      */}
                      <p
                        className="mt-[5px] rounded-[3px] px-[6px] py-[3px] text-[11.5px] font-semibold leading-[1.2]"
                        style={{
                          background: i === 0 ? 'var(--tile)' : 'var(--cite)',
                          color: i === 0 ? 'var(--grey)' : 'var(--violet)',
                        }}
                      >
                        {contested
                          ? `⚠ cites ${MARK[i - 1]} · conflict raised`
                          : i === 0
                            ? '● reads the record'
                            : `● cites ${MARK[i - 1]}`}
                      </p>
                    </div>

                    {/* Handoff arrow — the visible unit of collaboration */}
                    {i < chain.steps.length - 1 && (
                      <div
                        className="flex items-center justify-center text-[17px]"
                        style={{ color: 'var(--violet)' }}
                        aria-hidden
                      >
                        &#10230;
                      </div>
                    )}
                  </div>
                )
              }),
            )}
          </div>

          {/* ---- Bottom band: state vocabulary, the agents outside lanes, stats ---- */}
          <div
            className="mt-[14px] grid gap-[12px]"
            style={{ gridTemplateColumns: '408px 476px 1fr' }}
          >
            {/* What a completed step looks like */}
            <section
              className="rounded-[5px] border p-[11px_12px]"
              style={{ borderColor: 'var(--hair)' }}
            >
              <BandHead>What a step reports when it is done</BandHead>
              <ul className="mt-[7px] space-y-[4px]">
                <State glyph="●" token="var(--green)" term="concluded">
                  found something, stamped it, passed it on
                </State>
                <State glyph="○" token="var(--grey)" term="nothing-to-add">
                  ran, found nothing here &mdash; not a failure
                </State>
                <State glyph="⚠" token="var(--amber)" term="contested">
                  opposes an earlier step; a human settles it
                </State>
                <State glyph="▣" token="var(--violet)" term="brief">
                  the consolidated read, proposed not written
                </State>
              </ul>
            </section>

            {/* The eight agents that are not lane steps, named rather than omitted */}
            <section
              className="rounded-[5px] border p-[11px_12px]"
              style={{ borderColor: 'var(--hair)' }}
            >
              <BandHead>
                The {NON_CHAINING_AGENT_IDS.length + RESERVE_AGENT_IDS.length} agents that
                are not lane steps
              </BandHead>
              <p className="mt-[7px] text-[11px] font-bold" style={{ color: 'var(--blue)' }}>
                BOOK-LEVEL ({NON_CHAINING_AGENT_IDS.length}) &mdash; report on the whole
                book, matched against every run
              </p>
              <p className="text-[12px] leading-[1.35]">
                {NON_CHAINING_AGENT_IDS.map(shortName).join(' · ')}
              </p>
              <p
                className="mt-[6px] text-[11px] font-bold"
                style={{ color: 'var(--grey)' }}
              >
                RESERVE ({RESERVE_AGENT_IDS.length}) &mdash; per-customer capable, no chain
                yet
              </p>
              <p className="text-[12px] leading-[1.35]">
                {RESERVE_AGENT_IDS.map(shortName).join(' · ')}
              </p>
              <p
                className="mt-[6px] text-[11px] italic"
                style={{ color: 'var(--grey)' }}
              >
                {CHAIN_AGENT_IDS.length} in lanes + {NON_CHAINING_AGENT_IDS.length}{' '}
                book-level + {RESERVE_AGENT_IDS.length} reserve = {AGENTS.length}
              </p>
            </section>

            {/* Where the numbers surface */}
            <section
              className="rounded-[5px] border p-[11px_12px]"
              style={{ borderColor: 'var(--hair)' }}
            >
              <BandHead>Where the statistics are shown</BandHead>
              <Surface screen="Agent Chain">
                handoff count &middot; confidence weight and band &middot; conflicts raised
                &middot; how many book-level agents matched
              </Surface>
              <Surface screen="Customer 360 · AI Insights">
                agents that contributed &middot; conclusions carried forward &middot;
                proposed writes
              </Surface>
              <Surface screen="CRM activity feed">
                what was committed, by whom, attributed to DICE
              </Surface>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function BandHead({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-bold uppercase tracking-[0.09em]"
      style={{ color: 'var(--navy)' }}
    >
      {children}
    </p>
  )
}

function State({
  glyph,
  token,
  term,
  children,
}: {
  glyph: string
  token: string
  term: string
  children: React.ReactNode
}) {
  return (
    <li className="flex items-baseline gap-[7px] text-[12px] leading-[1.3]">
      <span className="shrink-0 text-[11px]" style={{ color: token }} aria-hidden>
        {glyph}
      </span>
      <span>
        <b className="text-[11.5px] font-bold" style={{ color: token }}>
          {term}
        </b>{' '}
        &mdash; {children}
      </span>
    </li>
  )
}

function Surface({
  screen,
  children,
}: {
  screen: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-[7px]">
      <p className="text-[11.5px] font-bold" style={{ color: 'var(--violet)' }}>
        {screen}
      </p>
      <p className="text-[11.5px] leading-[1.3]" style={{ color: '#33415C' }}>
        {children}
      </p>
    </div>
  )
}
