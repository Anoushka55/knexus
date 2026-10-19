import type { ImportReport } from './merge-plan'
import type { RecordType } from './schemas'

/**
 * Where imported records survive a refresh.
 *
 * IndexedDB rather than localStorage, which was the original intent and would
 * not have worked: the platform's own export is 8.9 MB as CSV and larger again
 * as JSON, against a localStorage budget of roughly 5 MB. A full import would
 * have failed at the last step, after all the parsing and merging had already
 * succeeded.
 *
 * Everything here is guarded twice — once for the server, where `indexedDB`
 * does not exist, and once for the browser, where a private window or a
 * disabled-storage setting throws on open. Both degrade to "no imports", never
 * to a crash: losing an import is recoverable, a blank app is not.
 */

const DB_NAME = 'dice-imports'
const DB_VERSION = 1
const STORE = 'payload'
const KEY = 'current'

export interface ImportPayload {
  version: 1
  batchIds: string[]
  savedAt: string
  /*
   * How the import was applied.
   *
   * This has to survive the reload. The seeded book is regenerated on every
   * load, so restoring a replace as a merge would quietly hand back the very
   * records the user replaced — the platform would show both books at once.
   */
  mode: 'merge' | 'replace'
  records: Partial<Record<RecordType, unknown[]>>
  /**
   * The reference sets in force when this was saved.
   *
   * Stored whole rather than as a diff. They are small, and a reload that
   * restored the records but not the project and rep names would show the new
   * client's book under the previous client's labels.
   */
  reference?: Record<string, unknown[]>
  /**
   * What the last import accepted and refused.
   *
   * Persisted because the on-screen report is rendered once and lost on the
   * next navigation, which leaves no way to tell "this customer has no
   * conversations" from "every conversation row was rejected".
   */
  report?: ImportReport
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null)

  return new Promise((resolve) => {
    let request: IDBOpenDBRequest
    try {
      request = window.indexedDB.open(DB_NAME, DB_VERSION)
    } catch {
      resolve(null)
      return
    }
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
    // A blocked upgrade would otherwise hang the promise forever and with it
    // the hydration effect that awaits it.
    request.onblocked = () => resolve(null)
  })
}

export async function readImports(): Promise<ImportPayload | null> {
  const db = await openDb()
  if (!db) return null

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(KEY)
      req.onsuccess = () => resolve(validate(req.result))
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    } finally {
      db.close()
    }
  })
}

export async function writeImports(payload: ImportPayload): Promise<boolean> {
  const db = await openDb()
  if (!db) return false

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(payload, KEY)
      tx.oncomplete = () => resolve(true)
      // Most likely a quota refusal. The import still succeeded in memory, so
      // the caller reports "this session only" rather than failing the whole
      // operation.
      tx.onerror = () => resolve(false)
      tx.onabort = () => resolve(false)
    } catch {
      resolve(false)
    } finally {
      db.close()
    }
  })
}

export async function clearImports(): Promise<void> {
  const db = await openDb()
  if (!db) return

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    } catch {
      resolve()
    } finally {
      db.close()
    }
  })
}

/**
 * Anything failing the shape check is discarded rather than merged.
 *
 * The store is the user's own browser and can be edited by hand; a malformed
 * payload must not reach the reducers.
 */
function validate(value: unknown): ImportPayload | null {
  if (!value || typeof value !== 'object') return null
  const p = value as Partial<ImportPayload>
  if (p.version !== 1) return null
  if (!p.records || typeof p.records !== 'object') return null
  if (!Array.isArray(p.batchIds)) return null

  const records: Partial<Record<RecordType, unknown[]>> = {}
  for (const [type, rows] of Object.entries(p.records)) {
    if (!Array.isArray(rows)) continue
    // Every record must at least be an object carrying a string id, which is
    // what the upsert keys on.
    if (!rows.every((r) => r && typeof r === 'object' && typeof (r as { id?: unknown }).id === 'string')) {
      continue
    }
    records[type as RecordType] = rows
  }

  return {
    version: 1,
    batchIds: p.batchIds.filter((b): b is string => typeof b === 'string'),
    savedAt: typeof p.savedAt === 'string' ? p.savedAt : '',
    mode: p.mode === 'replace' ? 'replace' : 'merge',
    records,
    reference:
      p.reference && typeof p.reference === 'object' ? p.reference : undefined,
    // Shape-checked no further than this: it is display-only, and a malformed
    // report must not cost the user the records it describes.
    report:
      p.report && typeof p.report === 'object' && Array.isArray(p.report.byType)
        ? p.report
        : undefined,
  }
}
