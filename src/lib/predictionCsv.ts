import type { UserPrediction } from './api-client';

/** Column order of the prediction-history export. */
export const PREDICTION_CSV_HEADERS = ['asset', 'direction', 'stake', 'result', 'timestamp'] as const;

/** How long to keep the blob URL alive after starting a download (ms). */
const REVOKE_DELAY_MS = 1000;

// Spreadsheet apps treat text that starts with one of these as a formula.
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;

/**
 * Escape one CSV field.
 *
 * - Fields containing a comma, double quote or line break are wrapped in
 *   quotes, with inner quotes doubled (RFC 4180).
 * - Text that a spreadsheet would run as a formula (starts with `=`, `+`, `-`,
 *   `@`, tab or CR) is prefixed with a single quote so it opens as plain text
 *   (CSV injection). Plain numbers such as `-5` are left alone.
 */
export function escapeCsvField(value: string): string {
  let text = value;
  if (FORMULA_TRIGGER.test(text) && !PLAIN_NUMBER.test(text)) {
    text = `'${text}`;
  }
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Text fields: only real strings are exported, anything else becomes empty. */
function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** The stake may arrive as a string or a number; anything else becomes empty. */
function stakeText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

/**
 * Build the CSV text for a prediction history: a header row, then one row per
 * prediction with asset, direction, stake, result (status) and timestamp.
 * Missing or malformed fields become empty cells. Lines are joined with `\n`.
 */
export function buildPredictionCsv(predictions: readonly UserPrediction[]): string {
  const rows = predictions.map((prediction) =>
    [
      asString(prediction.asset),
      asString(prediction.direction),
      stakeText(prediction.stake),
      asString(prediction.status),
      asString(prediction.createdAt),
    ]
      .map(escapeCsvField)
      .join(','),
  );

  return [PREDICTION_CSV_HEADERS.join(','), ...rows].join('\n');
}

/** File name for the export, safe for any file system. */
export function predictionCsvFilename(userId: string | null | undefined): string {
  const safeId = (userId ?? 'user').replace(/[^\w.-]+/g, '_');
  return `prediction_history_${safeId}.csv`;
}

/**
 * Trigger a browser download of `csv` as `filename`.
 *
 * The object URL is revoked after a short delay rather than immediately, since
 * revoking it in the same tick can cancel the download in some browsers.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}
