/**
 * Server-only file parsers for the ingest pipeline (CSV / Excel / PDF /
 * PPTX text extraction). Mirrors the Python `parse_csv_bytes`,
 * `parse_excel_bytes`, `parse_pdf_bytes`, `parse_pptx_bytes` and `_df`
 * helpers. Only import this module from API route handlers (Node runtime) —
 * it pulls in `xlsx`, `jszip` and `pdf-parse`.
 */
import * as XLSX from "xlsx";
import JSZip from "jszip";
import type { Tool } from "./types";
import { detectHeaderRow, rowsToTools } from "./normalize";

function sheetMatrixToRows(matrix: unknown[][]): Record<string, unknown>[] {
  if (!matrix.length) return [];
  const hi = detectHeaderRow(matrix);
  const headerRow = matrix[hi] ?? [];
  const width = Math.max(...matrix.map((r) => r.length), headerRow.length);
  const cols: string[] = [];
  for (let j = 0; j < width; j++) {
    const v = headerRow[j];
    cols.push(v !== null && v !== undefined && String(v).trim() !== "" ? String(v).trim() : `col_${j}`);
  }
  const dataRows = matrix.slice(hi + 1);
  const rows = dataRows.map((r) => {
    const obj: Record<string, unknown> = {};
    cols.forEach((c, j) => {
      obj[c] = r[j] ?? null;
    });
    return obj;
  });
  const isBlank = (v: unknown) => v === null || v === undefined || String(v).trim() === "";
  const nonEmptyCols = cols.filter((c) => rows.some((r) => !isBlank(r[c])));
  return rows
    .map((r) => {
      const o: Record<string, unknown> = {};
      nonEmptyCols.forEach((c) => {
        o[c] = r[c];
      });
      return o;
    })
    .filter((r) => Object.values(r).some((v) => !isBlank(v)));
}

export function parseCsvBuffer(buf: Buffer): { tools: Tool[]; detectedBudget: number | null } {
  const wb = XLSX.read(buf, { type: "buffer", raw: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true }) as unknown[][];
  return rowsToTools(sheetMatrixToRows(matrix));
}

export function parseExcelBuffer(buf: Buffer): { tools: Tool[]; detectedBudget: number | null } {
  const wb = XLSX.read(buf, { type: "buffer" });
  let allRows: Record<string, unknown>[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][];
    allRows = allRows.concat(sheetMatrixToRows(matrix));
  }
  return rowsToTools(allRows);
}

export function parseJsonBuffer(buf: Buffer): Record<string, unknown>[] {
  const data = JSON.parse(buf.toString("utf-8"));
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    for (const v of Object.values(data)) {
      if (Array.isArray(v)) return v as Record<string, unknown>[];
    }
  }
  return [];
}

export async function parsePdfBuffer(buf: Buffer): Promise<string> {
  try {
    // Import the inner implementation directly (bypasses pdf-parse's
    // index.js, which runs a `!module.parent` debug self-test against a
    // bundled sample PDF that doesn't exist once webpack bundles this route).
    const { createRequire } = await import("module");
    const req = createRequire(import.meta.url);
    const pdfParseFn = req("pdf-parse/lib/pdf-parse.js") as (b: Buffer) => Promise<{ text: string }>;
    const data = await pdfParseFn(buf);
    return (data.text || "").slice(0, 20000);
  } catch {
    return "";
  }
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export async function parsePptxBuffer(buf: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buf);
    const slideFiles = Object.keys(zip.files)
      .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide(\d+)/)?.[1] ?? "0", 10);
        const nb = parseInt(b.match(/slide(\d+)/)?.[1] ?? "0", 10);
        return na - nb;
      });
    const lines: string[] = [];
    for (const f of slideFiles) {
      const xml = await zip.files[f].async("text");
      // Each <a:tr> is a table row; each <a:tc> a cell — flatten runs within a cell, join cells with " | ".
      const rowMatches = [...xml.matchAll(/<a:tr[ >][\s\S]*?<\/a:tr>/g)];
      if (rowMatches.length) {
        for (const row of rowMatches) {
          const cells = [...row[0].matchAll(/<a:tc[ >][\s\S]*?<\/a:tc>/g)].map((cellMatch) => {
            const runs = [...cellMatch[0].matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => decodeXmlEntities(m[1]));
            return runs.join(" ").trim();
          });
          const rowText = cells.filter(Boolean).join(" | ");
          if (rowText) lines.push(rowText);
        }
      } else {
        const runs = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => decodeXmlEntities(m[1]));
        if (runs.length) lines.push(runs.join(" "));
      }
    }
    return lines.join("\n").slice(0, 8000);
  } catch {
    return "";
  }
}
