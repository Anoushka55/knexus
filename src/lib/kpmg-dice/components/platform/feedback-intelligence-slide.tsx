'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * SPAR AI Engine for Customer Intelligence — the KPMG "Our PoV" slide.
 *
 * The layout, colours and body content reproduce the source faithfully. The
 * heading does not: it carries the product's own name rather than the deck's,
 * by request. Everything below it is still verbatim, casing included.
 *
 * Built on a fixed 1600x900 stage scaled to whatever width it is given, so
 * proportions and line breaks match the slide rather than reflowing to the
 * browser.
 *
 * One deliberate departure from the spec: the type is the interface's own Inter
 * rather than the spec's Open Sans stand-in, so the slide reads as part of this
 * product. Inter is the wider face, which is why several strings carry explicit
 * breaks — they are load-bearing, not decoration.
 *
 * Colour tokens live on the root element rather than in the Tailwind theme.
 * They describe this one slide and would be noise in a design system.
 */

const DATA_INPUTS = [
  'Customer and project profile',
  'CSAT/NPS invitations and responses',
  'Respondent and non-respondent history',
  'Survey date, time, and comm. channels',
  'Transaction milestones',
  'Survey performance',
]

const OUTCOMES = [
  {
    title: 'Higher voluntary participation',
    support: 'More customers willingly complete CSAT/NPS surveys',
  },
  {
    title: 'Broader representation',
    support: 'Feedback includes different customer profiles and stages',
  },
  {
    title: 'More meaningful responses',
    support: 'Customers explain reasons behind their ratings',
  },
  {
    title: 'Better response knowledge',
    support: 'Understand who responds, when and through which channel',
  },
]

const PATHWAY = [
  { label: 'Assess', token: 'var(--s1)', lines: ['Analyse Data &', 'Response Patterns'] },
  {
    label: 'Design',
    token: 'var(--s2)',
    lines: ['Define AI targeting and', 'personalization logic'],
  },
  {
    label: 'Pilot',
    token: 'var(--s3)',
    lines: ['Test with selected projects', 'or customer groups'],
  },
  {
    label: 'Measure',
    token: 'var(--s4)',
    lines: ['Track response rate,', 'completion & feedback quality'],
  },
  { label: 'Scale', token: 'var(--s5)', lines: ['Refine and expand', 'what works'] },
]

/*
 * The four principles are numbered by the acronym they spell, not by reading
 * order: S-mart follow-up, P-referred channel, A-t the right moment,
 * R-elevant questions. The source had A and R transposed, which left the
 * engine's own name unaccounted for on the slide that names it.
 *
 * The array stays in acronym order because that is what it means. Where each
 * one sits is a separate question, answered at the placement below — they run
 * clockwise, so 3 is under 2 and 4 is left of 3.
 *
 * `dark` is not on the items for the same reason: it alternates by corner, so
 * carrying it in the data would break the checkerboard the moment two items
 * swap places. It is passed at each placement instead, which makes the
 * positional rule true by construction rather than by comment.
 */
const PRINCIPLES = [
  { n: '1', lines: ['Smart', 'Follow-up'] },
  { n: '2', lines: ['Preferred', 'Channel'] },
  { n: '3', lines: ['At the Right', 'moment'] },
  { n: '4', lines: ['Relevant', 'questions'] },
]

const BY_N = Object.fromEntries(PRINCIPLES.map((p) => [p.n, p]))

const STAGE_W = 1600
const STAGE_H = 900

export function FeedbackIntelligenceSlide() {
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
          // Slide-local tokens, sampled from the source.
          ['--navy' as string]: '#1F3864',
          ['--orange' as string]: '#C55A11',
          ['--blue' as string]: '#1F6FB8',
          ['--line' as string]: '#B4C0D6',
          ['--hair' as string]: '#D6DCE8',
          ['--grey' as string]: '#595959',
          ['--tile' as string]: '#DCE3EF',
          ['--predict' as string]: '#CFE0F5',
          ['--time' as string]: '#F3D9DF',
          ['--personalize' as string]: '#D8DDF3',
          ['--select' as string]: '#D3E2F2',
          ['--spar' as string]: '#FCF7DC',
          ['--sparline' as string]: '#E3D9A4',
          ['--s1' as string]: '#1F3864',
          ['--s2' as string]: '#1F5FB0',
          ['--s3' as string]: '#2E75B6',
          ['--s4' as string]: '#7C4DA8',
          ['--s5' as string]: '#9B7FC4',
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
          <h1 className="text-[39px] font-extrabold leading-[1.06] tracking-[-0.015em]">
            <span style={{ color: 'var(--orange)' }}>SPAR AI ENGINE</span>{' '}
            for Customer Intelligence
          </h1>
          <p className="mt-[7px] text-[14.5px] italic" style={{ color: '#404F66' }}>
            Using existing customer and survey data to deliver timely, relevant and
            low-effort feedback experiences.
          </p>

          {/* ---- Flow ---- */}
          <div
            className="mt-[18px] grid min-h-0 flex-1"
            style={{
              gridTemplateColumns: '352px 40px 604px 40px 452px',
              gridTemplateRows: '1fr auto',
            }}
          >
            {/* C2 — existing data */}
            <section className="flex min-h-0 flex-col px-[6px]">
              <ColumnHead>
                Existing Customer
                <br />
                &amp; Survey Data
              </ColumnHead>
              <div
                className="mt-[14px] flex min-h-0 flex-1 flex-col rounded-[4px] border p-[11px_12px]"
                style={{ borderColor: 'var(--hair)' }}
              >
                <p className="pb-[9px] text-center text-[13.5px] font-bold">
                  Key data inputs
                </p>
                {DATA_INPUTS.map((text) => (
                  <div
                    key={text}
                    className="flex flex-1 items-center justify-center border-t px-[4px] py-[6px] text-center text-[13px] leading-[1.3]"
                    style={{ borderColor: 'var(--hair)' }}
                  >
                    {text}
                  </div>
                ))}
              </div>
            </section>

            <Connector />

            {/* C3 — the engine */}
            <section className="flex min-h-0 flex-col px-[6px]">
              <ColumnHead>AI Feedback Engagement Engine</ColumnHead>
              <div
                className="relative mt-[14px] grid min-h-0 flex-1 rounded-[5px] border border-dashed px-[18px] pb-[8px] pt-[16px]"
                style={{
                  borderColor: '#9FB0C9',
                  gridTemplateColumns: '1fr 74px 1fr',
                  gridTemplateRows: '1fr auto 1fr auto',
                }}
              >
                {/* Time -> Select, down the right */}
                <span
                  className="absolute bottom-[36%] top-[36%] right-[15%] w-0 border-l"
                  style={{ borderColor: '#7F8FA6' }}
                  aria-hidden
                >
                  <i
                    className="absolute -bottom-[9px] -left-[5px] text-[12px] not-italic"
                    style={{ color: '#54627A' }}
                  >
                    &#9660;
                  </i>
                </span>
                {/* Personalize -> Predict, up the left */}
                <span
                  className="absolute bottom-[36%] left-[15%] top-[36%] w-0 border-l"
                  style={{ borderColor: '#7F8FA6' }}
                  aria-hidden
                >
                  <i
                    className="absolute -left-[5px] -top-[9px] text-[12px] not-italic"
                    style={{ color: '#54627A' }}
                  >
                    &#9650;
                  </i>
                </span>

                <Quad fill="var(--predict)" title="Predict">
                  Who is most likely to respond?
                </Quad>
                <Arrow>&#10230;</Arrow>
                <Quad fill="var(--time)" title="Time">
                  When is the right moment to ask?
                </Quad>

                {/* SPAR core */}
                <div className="col-span-full flex flex-col items-center py-[6px]">
                  <p
                    className="mb-[5px] text-[14px] font-bold"
                    style={{ color: 'var(--blue)' }}
                  >
                    KPMG SPAR AI Engine
                  </p>
                  {/*
                    A cycle, so it is drawn as one: 1 and 2 across the top, 3
                    under 2, 4 left of 3, and the four connectors closing the
                    loop clockwise. Auto-flow cannot express that once arrows
                    occupy cells, so the nine children are written out in
                    row-major order and land in the tracks by position.
                  */}
                  <div
                    className="grid w-[76%] rounded-[5px] border px-[18px] py-[11px]"
                    style={{
                      background: 'var(--spar)',
                      borderColor: 'var(--sparline)',
                      gridTemplateColumns: '1fr auto 1fr',
                      gap: '4px 14px',
                    }}
                  >
                    <Principle p={BY_N['1']} dark />
                    <Cyc>&#10230;</Cyc>
                    <Principle p={BY_N['2']} />

                    <Cyc align="start">&#9650;</Cyc>
                    <span />
                    <Cyc align="end">&#9660;</Cyc>

                    <Principle p={BY_N['4']} dark />
                    <Cyc>&#10229;</Cyc>
                    <Principle p={BY_N['3']} />
                  </div>
                </div>

                <Quad fill="var(--personalize)" title="Personalize">
                  What message &amp; questions should be sent?
                </Quad>
                <Arrow>&#10229;</Arrow>
                <Quad fill="var(--select)" title="Select">
                  Which channel should be used?
                </Quad>

                <p
                  className="col-span-full pt-[8px] text-center text-[14px] font-bold"
                  style={{ color: 'var(--blue)' }}
                >
                  Customer-Friendly Survey Experience
                </p>
              </div>

              <div className="mt-[9px] flex justify-center">
                <span
                  className="rounded-[3px] px-[34px] py-[5px] text-[13px] tracking-[0.02em]"
                  style={{ background: '#E4E7EC', color: '#33415C' }}
                >
                  Timely&nbsp; | &nbsp;Relevant&nbsp; | &nbsp;Short&nbsp; |
                  &nbsp;Transparent
                </span>
              </div>
            </section>

            <Connector />

            {/* C4 — outcomes */}
            <section className="flex min-h-0 flex-col px-[6px]">
              <ColumnHead>
                Expected Participation &amp; Feedback
                <br />
                Outcomes
              </ColumnHead>
              <div
                className="mt-[14px] flex min-h-0 flex-1 flex-col gap-[9px] rounded-[4px] border p-[11px_12px]"
                style={{ borderColor: 'var(--hair)' }}
              >
                <p className="text-center text-[13.5px] font-semibold">
                  Specific outcome of the AI intervention
                </p>
                {OUTCOMES.map((outcome) => (
                  <div
                    key={outcome.title}
                    className="flex flex-1 flex-col justify-center rounded-[4px] border px-[12px] py-[9px]"
                    style={{ background: '#F4F6FA', borderColor: 'var(--hair)' }}
                  >
                    <b className="text-[14px] font-bold leading-[1.2]">
                      {outcome.title}
                    </b>
                    <span
                      className="mt-[4px] text-[11.5px] leading-[1.35]"
                      style={{ color: 'var(--grey)' }}
                    >
                      {outcome.support}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Row 2 — the two italic captions */}
            <p
              className="pt-[12px] text-center text-[14px] italic"
              style={{ gridColumn: '1 / 3', color: '#33415C' }}
            >
              Data-Driven Transition
            </p>
            <p
              className="pt-[12px] text-center text-[14px] italic"
              style={{ gridColumn: '3 / 6', color: '#33415C' }}
            >
              Outcome-Driven Transition
            </p>
          </div>

          {/* ---- Pathway band ---- */}
          <div
            className="mt-[14px] border-t pt-[12px]"
            style={{ borderColor: 'var(--hair)' }}
          >
            <h2 className="mb-[11px] text-[18px] font-bold">
              Proven Pathway to AI-Powered Feedback Transformation
            </h2>
            <div className="grid grid-cols-5 gap-[16px]">
              {PATHWAY.map((step) => (
                <div key={step.label} className="flex items-center gap-[11px]">
                  <span
                    className="min-w-[92px] flex-none rounded-[4px] px-[8px] py-[11px] text-center text-[14px] font-bold text-white"
                    style={{ background: step.token }}
                  >
                    {step.label}
                  </span>
                  <p className="text-[12.5px] leading-[1.35]" style={{ color: '#33415C' }}>
                    {step.lines[0]}
                    <br />
                    {step.lines[1]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ColumnHead({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="rounded-[5px] px-[10px] py-[9px] text-center text-[13.5px] font-bold leading-[1.25] text-white"
      style={{ background: 'var(--navy)' }}
    >
      {children}
    </h2>
  )
}

/** Column separator: a dashed rule with the flow arrow centred on it. */
function Connector() {
  return (
    <div
      className="flex items-center justify-center border-l border-dashed text-[19px]"
      style={{ borderColor: 'var(--hair)', color: '#54627A' }}
      aria-hidden
    >
      &#8658;
    </div>
  )
}

function Quad({
  fill,
  title,
  children,
}: {
  fill: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className="flex flex-col justify-center rounded-[5px] px-[14px] py-[10px] text-center"
      style={{ background: fill }}
    >
      <b className="block text-[16px] font-bold" style={{ color: 'var(--navy)' }}>
        {title}
      </b>
      <span className="mt-[3px] text-[13px] leading-[1.3]" style={{ color: '#2A3B57' }}>
        {children}
      </span>
    </div>
  )
}

/** One principle: its number, then its two-line label. */
function Principle({
  p,
  dark,
}: {
  p: { n: string; lines: string[] }
  dark?: boolean
}) {
  return (
    <div className="flex items-center gap-[9px]">
      <b
        className="min-w-[19px] text-[25px] font-bold leading-none"
        style={{ color: 'var(--blue)' }}
      >
        {p.n}
      </b>
      <span
        className="text-[13.5px] font-bold leading-[1.2]"
        style={{ color: dark ? 'var(--navy)' : 'var(--blue)' }}
      >
        {p.lines[0]}
        <br />
        {p.lines[1]}
      </span>
    </div>
  )
}

/*
 * A connector inside the SPAR cycle.
 *
 * The verticals hug the edges rather than centring, so each sits against the
 * column it belongs to instead of drifting into the middle of the box.
 */
function Cyc({
  children,
  align = 'center',
}: {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
}) {
  return (
    <div
      className={cn(
        'flex items-center text-[13px]',
        align === 'start'
          ? 'justify-start'
          : align === 'end'
            ? 'justify-end'
            : 'justify-center',
      )}
      style={{ color: '#54627A' }}
      aria-hidden
    >
      {children}
    </div>
  )
}

function Arrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-center text-[15px]"
      style={{ color: '#54627A' }}
      aria-hidden
    >
      {children}
    </div>
  )
}
