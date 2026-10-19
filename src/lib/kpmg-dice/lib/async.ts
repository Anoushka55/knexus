/**
 * Cooperative chunking for work that would otherwise freeze the tab.
 *
 * The import parses, coerces and merges tens of thousands of records on the
 * main thread. Done in one pass that is not slow so much as *invisible*: the
 * browser cannot paint until the call stack unwinds, so a progress bar updated
 * inside the loop would render exactly once, at 100%, after the work is done.
 *
 * The fix is to hand the thread back periodically. What matters is how often.
 * A fixed row or byte count is wrong in both directions — thousands of pointless
 * yields on a small file, a visible stall on a large one, and the right constant
 * differs per machine. A time budget self-tunes: do a frame's worth of work,
 * yield, repeat.
 */

/**
 * One frame's worth of work, near enough.
 *
 * Longer and an interaction during the import feels dropped; shorter and the
 * yields start costing more than the work between them.
 */
export const SLICE_MS = 16

/**
 * Hands the thread back so the browser can paint, then resumes.
 *
 * `setTimeout` rather than `requestAnimationFrame`: rAF does not fire in a
 * background tab, which would stall an import the moment the user switched away
 * to find another file.
 */
export const yieldToPaint = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

export interface Slicer {
  /** True once the current slice has spent its budget. */
  expired: () => boolean
  /** Paint, then start a fresh slice. */
  next: () => Promise<void>
}

export function createSlicer(budgetMs: number = SLICE_MS): Slicer {
  let startedAt = performance.now()
  return {
    expired: () => performance.now() - startedAt >= budgetMs,
    next: async () => {
      await yieldToPaint()
      startedAt = performance.now()
    },
  }
}
