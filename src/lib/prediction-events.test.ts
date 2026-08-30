import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nativeToScVal } from '@stellar/stellar-sdk';

const getLatestLedger = vi.fn();
const getEvents = vi.fn();

vi.mock('@stellar/stellar-sdk', async () => {
  const actual = await vi.importActual<typeof import('@stellar/stellar-sdk')>(
    '@stellar/stellar-sdk',
  );
  return {
    ...actual,
    rpc: {
      ...actual.rpc,
      Server: class {
        getLatestLedger = getLatestLedger;
        getEvents = getEvents;
      },
    },
  };
});

const { fetchPredictionEvents, filterByRound, PredictionEventsError } = await import(
  './prediction-events'
);
type PredictionEvent = Awaited<ReturnType<typeof fetchPredictionEvents>>[number];

function rawEvent(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'evt-1',
    ledger: 1000,
    ledgerClosedAt: '2026-07-30T10:00:00Z',
    txHash: 'txhash1',
    topic: [nativeToScVal('settle', { type: 'symbol' }), nativeToScVal(7, { type: 'u32' })],
    value: nativeToScVal(42, { type: 'u32' }),
    ...overrides,
  };
}

describe('prediction-events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLatestLedger.mockResolvedValue({ sequence: 50_000 });
  });

  describe('fetchPredictionEvents', () => {
    it('queries the contract from a ledger window behind the latest ledger', async () => {
      getEvents.mockResolvedValue({ events: [] });

      await fetchPredictionEvents();

      const request = getEvents.mock.calls[0][0];
      expect(request.startLedger).toBeGreaterThan(0);
      expect(request.startLedger).toBeLessThan(50_000);
      expect(request.filters[0].type).toBe('contract');
    });

    it('decodes an event and classifies a settle topic as a settlement', async () => {
      getEvents.mockResolvedValue({ events: [rawEvent()] });

      const [event] = await fetchPredictionEvents();

      expect(event.name).toBe('settle');
      expect(event.kind).toBe('settlement');
      expect(event.ledger).toBe(1000);
      expect(event.txHash).toBe('txhash1');
    });

    it('reads the round id from a numeric topic', async () => {
      getEvents.mockResolvedValue({ events: [rawEvent()] });

      const [event] = await fetchPredictionEvents();

      expect(event.roundId).toBe('7');
    });

    it('falls back to a round_id field on the payload', async () => {
      getEvents.mockResolvedValue({
        events: [
          rawEvent({
            topic: [nativeToScVal('bet_placed', { type: 'symbol' })],
            value: nativeToScVal({ round_id: 12 }),
          }),
        ],
      });

      const [event] = await fetchPredictionEvents();

      expect(event.roundId).toBe('12');
      expect(event.kind).toBe('prediction');
    });

    it('returns null for a round id when neither topics nor payload carry one', async () => {
      getEvents.mockResolvedValue({
        events: [
          rawEvent({
            topic: [nativeToScVal('ping', { type: 'symbol' })],
            value: nativeToScVal('nothing-useful'),
          }),
        ],
      });

      const [event] = await fetchPredictionEvents();

      expect(event.roundId).toBeNull();
      expect(event.kind).toBe('other');
    });

    it('returns an empty list when the contract has no events', async () => {
      getEvents.mockResolvedValue({ events: [] });

      await expect(fetchPredictionEvents()).resolves.toEqual([]);
    });

    it('throws a PredictionEventsError when the ledger lookup fails', async () => {
      getLatestLedger.mockRejectedValue(new Error('rpc down'));

      await expect(fetchPredictionEvents()).rejects.toBeInstanceOf(PredictionEventsError);
    });

    it('throws a PredictionEventsError when the event query fails', async () => {
      getEvents.mockRejectedValue(new Error('rpc down'));

      await expect(fetchPredictionEvents()).rejects.toBeInstanceOf(PredictionEventsError);
    });
  });

  describe('filterByRound', () => {
    const events = [
      { roundId: '1' },
      { roundId: '2' },
      { roundId: null },
    ] as PredictionEvent[];

    it('returns every event for an empty filter', () => {
      expect(filterByRound(events, '')).toHaveLength(3);
      expect(filterByRound(events, '   ')).toHaveLength(3);
    });

    it('keeps only events matching the round id', () => {
      expect(filterByRound(events, '2')).toEqual([{ roundId: '2' }]);
    });

    it('returns nothing when no event matches', () => {
      expect(filterByRound(events, '99')).toEqual([]);
    });
  });
});
