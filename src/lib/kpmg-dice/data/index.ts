import { buildSeedDataset, type SeedDataset } from './generator'

export * from './reference'
export { buildSeedDataset } from './generator'
export type { SeedDataset } from './generator'
export { FEATURED_PROFILES, FEATURED_TRANSCRIPTS } from './featured'

/**
 * The dataset is built once per runtime and memoised. Generation is
 * deterministic, so the module-level value is identical on the server and in
 * the browser — safe to render from directly.
 */
let cached: SeedDataset | null = null

export function getSeedData(): SeedDataset {
  if (!cached) cached = buildSeedDataset()
  return cached
}

/** Rebuilds from scratch — backs the "Reset demo data" action. */
export function rebuildSeedData(): SeedDataset {
  cached = buildSeedDataset()
  return cached
}
