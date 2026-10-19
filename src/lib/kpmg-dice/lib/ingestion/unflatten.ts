import { SCHEMAS, type FieldSpec, type RecordType } from './schemas'

/**
 * CSV row -> typed record.
 *
 * The exact inverse of the flattening the exporter applies. Every rule here
 * pairs with one there, and they have to stay paired: a mismatch does not throw,
 * it produces a record that looks right and is wrong — an `evidence` object of
 * strings scores differently from one of numbers, and nothing announces it.
 *
 * Coercion never throws. A cell that cannot be read falls to the field's empty
 * value and is reported through `issues`, so a bad column is visible rather than
 * silently absorbed.
 */

export interface CoerceResult<T> {
  record: T
  /** Fields that could not be read as their declared type. */
  issues: string[]
}

function coerceNumber(raw: string, field: string, issues: string[]): number {
  if (raw === '') return 0
  // Tolerates the thousands separators and currency marks a hand-edited file
  // picks up; anything left over is a genuine problem worth reporting.
  const cleaned = raw.replace(/[₹,\s]/g, '')
  const value = Number(cleaned)
  if (!Number.isFinite(value)) {
    issues.push(`${field}: "${raw}" is not a number`)
    return 0
  }
  return value
}

function coerceBoolean(raw: string): boolean {
  const v = raw.trim().toLowerCase()
  return v === 'true' || v === '1' || v === 'yes' || v === 'y'
}

function coerceJson(raw: string, field: string, issues: string[]): unknown {
  if (raw === '') return []
  try {
    return JSON.parse(raw)
  } catch {
    issues.push(`${field}: not valid JSON`)
    return []
  }
}

function coerceField(
  spec: FieldSpec,
  raw: string,
  issues: string[],
): unknown | undefined {
  // An empty cell for an optional field means the field was absent, whatever
  // its type. Returning the type's zero instead would turn a missing
  // durationMins into a recorded call of zero minutes — wrong, and invisible.
  if (raw === '' && spec.optional) return undefined

  switch (spec.type) {
    case 'number':
      return coerceNumber(raw, spec.name, issues)
    case 'boolean':
      return coerceBoolean(raw)
    case 'string[]':
      // Semicolon, not comma — the exporter chose it precisely so these values
      // never need quoting, and splitting on a comma here would shred them.
      return raw === '' ? [] : raw.split(';').map((p) => p.trim()).filter(Boolean)
    case 'json':
      return coerceJson(raw, spec.name, issues)
    case 'string':
    default:
      return raw
  }
}

/** Rebuilds `evidence.websiteVisits` and friends into a nested object. */
function assignDotted(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.')
  let node = target
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]
    if (typeof node[key] !== 'object' || node[key] === null) node[key] = {}
    node = node[key] as Record<string, unknown>
  }
  node[parts[parts.length - 1]] = value
}

export function coerceRow<T>(
  type: RecordType,
  row: Record<string, string>,
): CoerceResult<T> {
  const schema = SCHEMAS[type]
  const record: Record<string, unknown> = {}
  const issues: string[] = []

  for (const spec of schema.fields) {
    const raw = row[spec.name]
    if (raw === undefined) {
      // Column absent from this file. Required fields are caught by validation
      // downstream; optional ones simply stay unset.
      if (!spec.optional && !spec.name.includes('.')) {
        issues.push(`${spec.name}: column missing`)
      }
      continue
    }
    const value = coerceField(spec, raw, issues)
    if (value === undefined) continue
    if (spec.name.includes('.')) assignDotted(record, spec.name, value)
    else record[spec.name] = value
  }

  return { record: record as T, issues }
}

export function coerceRows<T>(
  type: RecordType,
  rows: Record<string, string>[],
): { records: T[]; issues: { row: number; problems: string[] }[] } {
  const records: T[] = []
  const issues: { row: number; problems: string[] }[] = []

  rows.forEach((row, i) => {
    const { record, issues: problems } = coerceRow<T>(type, row)
    records.push(record)
    // Row 1 is the header, so the first body row is row 2 to a human reading
    // the file in Excel.
    if (problems.length) issues.push({ row: i + 2, problems })
  })

  return { records, issues }
}
