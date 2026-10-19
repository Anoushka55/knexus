/**
 * Deterministic PRNG shared by the seed generators.
 *
 * Lives in its own module so the feedback generator can hold a *separate*
 * instance without importing the lead generator — drawing from the same
 * sequence would shift every subsequent draw and silently move numbers that
 * are already on the dashboard.
 */

function mulberry32(seed: number) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Rng {
  private next: () => number
  constructor(seed: number) {
    this.next = mulberry32(seed)
  }
  float(min = 0, max = 1) {
    return min + this.next() * (max - min)
  }
  int(min: number, max: number) {
    return Math.floor(this.float(min, max + 1))
  }
  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)]
  }
  chance(p: number) {
    return this.next() < p
  }
}
