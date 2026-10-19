import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** £1,248,000 -> "£1.25M" */
export function formatCurrency(value: number, currency = '£'): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${currency}${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}${currency}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}${currency}${Math.round(abs / 1_000)}K`;
  return `${sign}${currency}${abs.toFixed(0)}`;
}

/** 12800 -> "12.8K" */
export function formatCompact(value: number, digits = 1): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(digits)}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(digits)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(digits)}K`;
  return `${sign}${abs.toString()}`;
}

/** 1248 -> "1,248" */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-GB');
}

/** 96.234 -> "96.2%" */
export function formatPct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

/** 6.4 -> "+6.4%" | -12 -> "-12%" */
export function formatDelta(value: number, suffix = '%', digits = 1): string {
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(digits);
  return `${value > 0 ? '+' : ''}${rounded}${suffix}`;
}

/** 1820 -> "1.82s" | 842 -> "842ms" */
export function formatDuration(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
}
