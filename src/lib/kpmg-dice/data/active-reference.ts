import type { Persona, Project, SalesRep } from '@/lib/kpmg-dice/types'
import { CAMPAIGNS, MICRO_MARKETS, PROJECTS, REPS, type SeedCampaign } from './reference'
import { PERSONAS } from './personas'
import { THEME_DEFS, type ThemeDef } from './feedback'

/**
 * The six reference sets the platform is currently showing.
 *
 * Projects, reps, campaigns, personas, themes and micro-markets used to be
 * fixed in code, which meant an imported dataset could replace every record and
 * still render the previous client's project names and rep names. They are now
 * defaults that an import can override.
 *
 * The static arrays are deliberately left alone as the seed's source:
 * `buildSeedDataset` iterates `CAMPAIGNS[].targets` to emit exactly 12,842 leads
 * and draws from `PROJECTS` and `MICRO_MARKETS` through the seeded PRNG. The
 * generator keeps importing them directly and never learns any of this happened.
 *
 * This module imports nothing from the store, so no cycle is possible — the
 * store already imports the generator, which imports reference.
 *
 * It is not reactive on its own. Pure functions read `ref()`; components must go
 * through `useReference()`, which subscribes to the version counter so React
 * knows to re-render.
 */

export interface ReferenceSets {
  projects: Project[]
  reps: SalesRep[]
  campaigns: SeedCampaign[]
  personas: Persona[]
  themes: ThemeDef[]
  microMarkets: string[]
}

const DEFAULTS: ReferenceSets = {
  projects: PROJECTS,
  reps: REPS,
  campaigns: CAMPAIGNS,
  personas: PERSONAS,
  themes: THEME_DEFS,
  microMarkets: [...MICRO_MARKETS],
}

let active: ReferenceSets = { ...DEFAULTS }

/*
 * Lookups are rebuilt whenever the sets change rather than captured once.
 *
 * A map built at module load is the defect this feature invites: it keeps
 * serving the previous client's themes long after the records changed, and it
 * compiles and renders perfectly while doing so.
 */
let themesById: Record<string, ThemeDef> = index(active.themes)
let personasById: Record<string, Persona> = index(active.personas)
let projectsById: Record<string, Project> = index(active.projects)
let repsById: Record<string, SalesRep> = index(active.reps)

function index<T extends { id: string }>(rows: T[]): Record<string, T> {
  return Object.fromEntries(rows.map((r) => [r.id, r]))
}

function reindex() {
  themesById = index(active.themes)
  personasById = index(active.personas)
  projectsById = index(active.projects)
  repsById = index(active.reps)
}

/** The sets in force right now. Safe to call from pure code. */
export const ref = (): ReferenceSets => active

export const themeById = (id: string) => themesById[id]
export const personaById = (id: string) => personasById[id]
export const projectById = (id: string) => projectsById[id]
export const repById = (id: string) => repsById[id]

/**
 * Replace some or all of the sets.
 *
 * A set the caller omits keeps its current value. An import that ships no
 * personas file means "unchanged", not "no personas" — emptying it would break
 * the persona screens for no reason the user asked for.
 */
export function setActiveReference(next: Partial<ReferenceSets>) {
  active = { ...active, ...prune(next) }
  reindex()
}

/** Back to the sets the seeded book was built against. */
export function resetActiveReference() {
  active = { ...DEFAULTS }
  reindex()
}

/** Empty arrays are treated as "not supplied", for the reason above. */
function prune(next: Partial<ReferenceSets>): Partial<ReferenceSets> {
  const out: Partial<ReferenceSets> = {}
  for (const [key, value] of Object.entries(next)) {
    if (Array.isArray(value) && value.length) {
      out[key as keyof ReferenceSets] = value as never
    }
  }
  return out
}
