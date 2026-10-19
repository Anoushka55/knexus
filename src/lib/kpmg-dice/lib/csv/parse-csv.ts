/**
 * RFC 4180 CSV reader.
 *
 * Written rather than taken as a dependency: the file is read whole through
 * FileReader anyway, so a streaming parser's reason to exist does not apply
 * here, and quoted-field parsing is a two-state scanner rather than a subtle
 * algorithm.
 *
 * What it must survive is not theoretical. The platform's own exported files
 * carry 1,642 rows whose summary contains a comma, transcript turns serialised
 * as JSON, and a UTF-8 BOM for Excel. A `split(',')` reader opens those files
 * happily and returns silently wrong data, which is the worst failure mode
 * available — so every case below is handled explicitly.
 */

import { createSlicer } from '@/lib/kpmg-dice/lib/async'

export interface CsvTable {
  headers: string[]
  rows: string[][]
  /** Rows whose raw field count did not match the header count. */
  raggedRowCount: number
  /** EOF arrived inside an open quote, or the row cap was reached. */
  truncated: boolean
  delimiter: string
}

export interface ParseCsvOptions {
  delimiter?: string
  /** Stop after this many body rows. Guards against a pathological file. */
  maxRows?: number
}

const DEFAULT_MAX_ROWS = 200_000

/**
 * Pick the delimiter from the header line.
 *
 * Counted outside quotes only — a quoted header containing a comma would
 * otherwise vote for the wrong character. Indian and European exports use
 * semicolons often enough to be worth detecting rather than assuming.
 */
function sniffDelimiter(text: string): string {
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 }
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') i += 1
      else inQuotes = !inQuotes
    } else if (!inQuotes) {
      if (ch === '\n' || ch === '\r') break
      if (ch in counts) counts[ch] += 1
    }
  }

  let best = ','
  for (const [d, n] of Object.entries(counts)) {
    if (n > counts[best]) best = d
  }
  return best
}

export function parseCsv(text: string, options: ParseCsvOptions = {}): CsvTable {
  // The BOM must go before anything else looks at the text, or the first
  // header carries an invisible character and never matches a known name.
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const delimiter = options.delimiter ?? sniffDelimiter(source)
  const maxRows = options.maxRows ?? DEFAULT_MAX_ROWS

  const records: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  /** A field that opened with a quote keeps its surrounding whitespace. */
  let quoted = false
  let truncated = false

  const endField = () => {
    row.push(quoted ? field : field.trim())
    field = ''
    quoted = false
  }
  const endRow = () => {
    endField()
    // A blank line is not a record.
    if (row.length > 1 || row[0] !== '') records.push(row)
    row = []
  }

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i]

    if (inQuotes) {
      if (ch === '"') {
        // A doubled quote is a literal quote; a lone one closes the field.
        if (source[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"' && field === '') {
      // Only a quote at the start of a field opens a quoted field, so a stray
      // quote mid-value stays literal instead of corrupting everything after it.
      inQuotes = true
      quoted = true
    } else if (ch === delimiter) {
      endField()
    } else if (ch === '\n') {
      endRow()
      if (records.length > maxRows) {
        truncated = true
        break
      }
    } else if (ch === '\r') {
      // Handles CRLF and a bare CR terminator alike.
      if (source[i + 1] === '\n') i += 1
      endRow()
      if (records.length > maxRows) {
        truncated = true
        break
      }
    } else {
      field += ch
    }
  }

  // EOF inside a quote: close the field rather than lose it, and say so.
  if (inQuotes) truncated = true
  if (field !== '' || row.length) endRow()

  return finalise(records, truncated, delimiter)
}

export interface ParseProgress {
  /** Characters consumed, against the length of the whole file. */
  bytes: number
  totalBytes: number
  /** Rows closed so far, header included. */
  rows: number
}

export interface ParseCsvAsyncOptions extends ParseCsvOptions {
  onProgress?: (progress: ParseProgress) => void
}

/**
 * The same scanner, yielding to the browser as it goes.
 *
 * The character loop below is the sync one above, unchanged — deliberately so.
 * Every rule that file-level comment defends is load-bearing on real exports,
 * and a reimplementation that drifted by one case would return silently wrong
 * data. What differs is only the bounds: an outer driver runs the loop until a
 * frame's budget is spent, reports where it is, and hands the thread back.
 *
 * The split is safe at any iteration boundary because both lookahead cases —
 * a doubled quote and a CRLF pair — consume their second character with `i += 1`
 * *before* control returns to the top of the loop. So the cursor is never left
 * pointing between two characters that belong together.
 */
export async function parseCsvAsync(
  text: string,
  options: ParseCsvAsyncOptions = {},
): Promise<CsvTable> {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const delimiter = options.delimiter ?? sniffDelimiter(source)
  const maxRows = options.maxRows ?? DEFAULT_MAX_ROWS
  const { onProgress } = options

  const records: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let quoted = false
  let truncated = false

  const endField = () => {
    row.push(quoted ? field : field.trim())
    field = ''
    quoted = false
  }
  const endRow = () => {
    endField()
    if (row.length > 1 || row[0] !== '') records.push(row)
    row = []
  }

  const slicer = createSlicer()
  let i = 0

  while (i < source.length) {
    if (slicer.expired()) {
      onProgress?.({ bytes: i, totalBytes: source.length, rows: records.length })
      await slicer.next()
    }

    const ch = source[i]

    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      i += 1
      continue
    }

    if (ch === '"' && field === '') {
      inQuotes = true
      quoted = true
    } else if (ch === delimiter) {
      endField()
    } else if (ch === '\n') {
      endRow()
      if (records.length > maxRows) {
        truncated = true
        i += 1
        break
      }
    } else if (ch === '\r') {
      if (source[i + 1] === '\n') i += 1
      endRow()
      if (records.length > maxRows) {
        truncated = true
        i += 1
        break
      }
    } else {
      field += ch
    }

    i += 1
  }

  if (inQuotes) truncated = true
  if (field !== '' || row.length) endRow()

  onProgress?.({
    bytes: source.length,
    totalBytes: source.length,
    rows: records.length,
  })

  return finalise(records, truncated, delimiter)
}

/**
 * Header extraction and row squaring, shared by both scanners.
 *
 * Pulled out rather than duplicated: the ragged-row count is reported to the
 * user, and two copies of this could disagree about what "ragged" meant.
 */
function finalise(
  records: string[][],
  truncated: boolean,
  delimiter: string,
): CsvTable {
  const headers = dedupeHeaders(records.shift() ?? [])
  const width = headers.length

  let raggedRowCount = 0
  const rows = records.map((record) => {
    if (record.length === width) return record
    raggedRowCount += 1
    return record.length < width
      ? [...record, ...Array<string>(width - record.length).fill('')]
      : record.slice(0, width)
  })

  return { headers, rows, raggedRowCount, truncated, delimiter }
}

/** Duplicate headers would make a column unaddressable by name. */
function dedupeHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>()
  return headers.map((raw) => {
    const name = raw.trim()
    const n = seen.get(name) ?? 0
    seen.set(name, n + 1)
    return n === 0 ? name : `${name} (${n + 1})`
  })
}

/** Rows as objects keyed by header — the shape every caller actually wants. */
export function toObjects(table: CsvTable): Record<string, string>[] {
  return table.rows.map((row) => toObject(table.headers, row))
}

function toObject(headers: string[], row: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  headers.forEach((h, i) => {
    out[h] = row[i] ?? ''
  })
  return out
}

/**
 * The same conversion, yielding between slices.
 *
 * Cheaper per row than the scan, but 115 columns across 39,000 rows is four
 * and a half million property writes — enough to hold the frame on its own.
 */
export async function toObjectsAsync(
  table: CsvTable,
  onProgress?: (done: number, total: number) => void,
): Promise<Record<string, string>[]> {
  const out: Record<string, string>[] = []
  const slicer = createSlicer()

  for (let i = 0; i < table.rows.length; i += 1) {
    if (slicer.expired()) {
      onProgress?.(i, table.rows.length)
      await slicer.next()
    }
    out.push(toObject(table.headers, table.rows[i]))
  }

  onProgress?.(table.rows.length, table.rows.length)
  return out
}
