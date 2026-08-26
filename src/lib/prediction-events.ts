/**
 * Reads prediction and settlement events emitted by the Xelma contract.
 *
 * Events come from Soroban RPC `getEvents`, scanned backwards from the latest
 * ledger. When RPC is unreachable or the contract has no event history, the
 * caller receives an empty list and can render an empty state.
 */

import { rpc, scValToNative, type xdr } from '@stellar/stellar-sdk';

const RPC_URL = import.meta.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const XELMA_CONTRACT_ID =
  import.meta.env.VITE_XELMA_CONTRACT_ID ||
  'CD7V3L7JIP52EXWLYSOWXND4F3N65QZ2R54H6M77Y3S37Z55XHLXELMA';

const eventsRpc = new rpc.Server(RPC_URL);

/**
 * How many ledgers back to scan. Soroban RPC retains roughly 24h of events, and
 * ledgers close about every 5s, so this covers the retention window.
 */
const LEDGER_LOOKBACK = 17_280;
const DEFAULT_LIMIT = 50;

export type PredictionEventKind = 'settlement' | 'prediction' | 'round' | 'other';

export interface PredictionEvent {
  /** RPC event id, unique per event. */
  id: string;
  /** First topic, the contract's event name (e.g. `settle`). */
  name: string;
  kind: PredictionEventKind;
  /** Round id parsed from the event topics or payload, when present. */
  roundId: string | null;
  ledger: number;
  /** ISO timestamp of the ledger close. */
  timestamp: string;
  /** Transaction hash, when RPC reports one. */
  txHash: string | null;
  /** Decoded event payload, for display. */
  payload: unknown;
}

export class PredictionEventsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PredictionEventsError';
  }
}

function classify(name: string): PredictionEventKind {
  const lower = name.toLowerCase();
  if (lower.includes('settle') || lower.includes('resolve') || lower.includes('payout')) {
    return 'settlement';
  }
  if (lower.includes('bet') || lower.includes('predict')) return 'prediction';
  if (lower.includes('round')) return 'round';
  return 'other';
}

/** Decodes an ScVal, returning null when the value cannot be converted. */
function decode(value: xdr.ScVal | undefined): unknown {
  if (!value) return null;
  try {
    return scValToNative(value);
  } catch {
    return null;
  }
}

/**
 * Pulls a round id out of the decoded topics or payload.
 *
 * Contracts vary in where they put it — a later topic, or a `round_id` /
 * `roundId` field on the payload — so both shapes are checked.
 */
function extractRoundId(topics: unknown[], payload: unknown): string | null {
  for (const topic of topics.slice(1)) {
    if (typeof topic === 'bigint' || typeof topic === 'number') return String(topic);
    if (typeof topic === 'string' && /^\d+$/.test(topic)) return topic;
  }

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    const candidate = record.round_id ?? record.roundId ?? record.round;
    if (typeof candidate === 'bigint' || typeof candidate === 'number') return String(candidate);
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }

  return null;
}

/**
 * Fetches recent contract events, newest first.
 *
 * @throws {PredictionEventsError} when RPC cannot be reached.
 */
export async function fetchPredictionEvents(limit = DEFAULT_LIMIT): Promise<PredictionEvent[]> {
  let startLedger: number;
  try {
    const { sequence } = await eventsRpc.getLatestLedger();
    startLedger = Math.max(1, sequence - LEDGER_LOOKBACK);
  } catch {
    throw new PredictionEventsError('Could not reach Stellar RPC. Try again in a moment.');
  }

  let response;
  try {
    response = await eventsRpc.getEvents({
      startLedger,
      filters: [{ type: 'contract', contractIds: [XELMA_CONTRACT_ID] }],
      limit,
    });
  } catch {
    throw new PredictionEventsError('Could not load on-chain events from Stellar RPC.');
  }

  const events = response.events ?? [];

  return events
    .map((event): PredictionEvent => {
      const topics = (event.topic ?? []).map((t) => decode(t));
      const payload = decode(event.value);
      const name = typeof topics[0] === 'string' ? topics[0] : 'unknown';

      return {
        id: event.id,
        name,
        kind: classify(name),
        roundId: extractRoundId(topics, payload),
        ledger: event.ledger,
        timestamp: event.ledgerClosedAt,
        txHash: event.txHash ?? null,
        payload,
      };
    })
    .reverse();
}

/** Filters events to a single round id. An empty filter returns everything. */
export function filterByRound(events: PredictionEvent[], roundId: string): PredictionEvent[] {
  const trimmed = roundId.trim();
  if (!trimmed) return events;
  return events.filter((event) => event.roundId === trimmed);
}
