import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTRACT_ERROR_FALLBACK, extractInspectorFields, humanizeContractError, inspectSorobanState, place_bet, place_precision_prediction } from '../xelma-contract';
import { signTransaction } from '@stellar/freighter-api';

// Mock the Freighter API
vi.mock('@stellar/freighter-api', () => ({
  signTransaction: vi.fn(),
}));

// Hoist mock functions so they are accessible inside vi.mock factories
const {
  mockGetAccount,
  mockSimulateTransaction,
  mockPrepareTransaction,
  mockSendTransaction,
  mockGetTransaction,
} = vi.hoisted(() => ({
  mockGetAccount: vi.fn(),
  mockSimulateTransaction: vi.fn(),
  mockPrepareTransaction: vi.fn(),
  mockSendTransaction: vi.fn(),
  mockGetTransaction: vi.fn(),
}));

// Fully mock the Stellar SDK — no real crypto/validation runs in unit tests
vi.mock('@stellar/stellar-sdk', async () => {
  /** Stub a minimal Transaction-like object so prepareTransaction / toXDR don't crash */
  const stubTx = { toXDR: () => 'AAAA', toEnvelope: () => ({}) };

  class MockTransactionBuilder {
    addOperation() { return this; }
    setTimeout() { return this; }
    build() { return stubTx; }
    static fromXDR() { return stubTx; }
  }

  class MockContract {
    call() { return {}; }
  }

  class MockAddress {
    constructor(public addr: string) {}
    toScVal() { return {}; }
    toString() { return this.addr; }
  }

  class MockServer {
    getAccount = mockGetAccount;
    simulateTransaction = mockSimulateTransaction;
    prepareTransaction = mockPrepareTransaction;
    sendTransaction = mockSendTransaction;
    getTransaction = mockGetTransaction;
  }

  return {
    // Primitives used by xelma-contract.ts
    BASE_FEE: '100',
    Networks: { TESTNET: 'Test SDF Network ; September 2015' },
    TransactionBuilder: MockTransactionBuilder as any,
    Contract: MockContract as any,
    Address: MockAddress as any,
    nativeToScVal: vi.fn().mockReturnValue({}),
    scValToNative: vi.fn((value) => value),
    rpc: {
      Server: MockServer as any,
    },
  };
});

describe('Smart Contract Bindings', () => {
  const userPublicKey = 'GD3BFFX7DTNJAGDVVM5RYGGQQNURZTH4VSBLWF55YXY3L6T2WWZK57EI';

  beforeEach(() => {
    vi.resetAllMocks();

    mockGetAccount.mockResolvedValue({ sequenceNumber: () => '100', accountId: () => userPublicKey });
    mockSimulateTransaction.mockResolvedValue({ results: [{}] });
    mockPrepareTransaction.mockImplementation((tx: any) => tx);
    mockSendTransaction.mockResolvedValue({ status: 'PENDING', hash: 'tx_hash_example' });
    mockGetTransaction.mockResolvedValue({ status: 'SUCCESS', ledger: 1001 });
    vi.mocked(signTransaction).mockResolvedValue('signed_xdr_payload');
  });

  it('place_bet: calls getAccount, simulate, sign, send, poll and returns txHash', async () => {
    const result = await place_bet(userPublicKey, 'UP', '10');

    expect(mockGetAccount).toHaveBeenCalledWith(userPublicKey);
    expect(mockSimulateTransaction).toHaveBeenCalled();
    expect(mockPrepareTransaction).toHaveBeenCalled();
    expect(signTransaction).toHaveBeenCalled();
    expect(mockSendTransaction).toHaveBeenCalled();
    expect(mockGetTransaction).toHaveBeenCalledWith('tx_hash_example');
    expect(result).toEqual({ txHash: 'tx_hash_example', ledger: 1001 });
  });

  it('place_precision_prediction: calls getAccount, simulate, sign, send, poll and returns txHash', async () => {
    const result = await place_precision_prediction(userPublicKey, 'DOWN', '25', '0.2295');

    expect(mockGetAccount).toHaveBeenCalledWith(userPublicKey);
    expect(mockSimulateTransaction).toHaveBeenCalled();
    expect(signTransaction).toHaveBeenCalled();
    expect(mockSendTransaction).toHaveBeenCalled();
    expect(result.txHash).toBe('tx_hash_example');
  });

  it('throws descriptive error when account loading fails', async () => {
    mockGetAccount.mockRejectedValue(new Error('Horizon error 404'));

    await expect(place_bet(userPublicKey, 'UP', '10')).rejects.toThrow(
      /Stellar account not found or unfunded on Testnet/
    );
  });

  it('throws error when transaction simulation returns an error field', async () => {
    mockSimulateTransaction.mockResolvedValue({ error: 'Contract invocation panicked' });

    await expect(place_bet(userPublicKey, 'UP', '10')).rejects.toThrow(/Simulation failed/);
  });

  it('throws error when user rejects Freighter signature', async () => {
    vi.mocked(signTransaction).mockResolvedValue({ error: 'User rejected' } as any);

    // The wallet adapter surfaces the wallet's own rejection message.
    await expect(place_bet(userPublicKey, 'UP', '10')).rejects.toThrow(/User rejected/);
  });

  it('inspectSorobanState returns rpc snapshot for read-only calls', async () => {
    mockSimulateTransaction
      .mockResolvedValueOnce({ results: [{ retval: { direction: 'UP' } }] })
      .mockResolvedValueOnce({ results: [{ retval: { state: 'open' } }] });

    const result = await inspectSorobanState(userPublicKey);

    expect(result.source).toBe('rpc');
    expect(result.position).toEqual({ direction: 'UP' });
    expect(result.round).toEqual({ state: 'open' });
  });

  it('inspectSorobanState decodes structured fields from the position/round retvals', async () => {
    mockSimulateTransaction
      .mockResolvedValueOnce({ results: [{ retval: { side: 'UP', stake: 500n } }] })
      .mockResolvedValueOnce({ results: [{ retval: { round_id: 42, pool_up: 1000, pool_down: 400 } }] });

    const result = await inspectSorobanState(userPublicKey);

    expect(result.fields).toEqual({
      positionSide: 'UP',
      stake: '500',
      roundId: '42',
      poolSplit: '1000 / 400',
    });
  });

  it('inspectSorobanState returns mock fallback when RPC fails', async () => {
    mockSimulateTransaction.mockRejectedValue(new Error('RPC unavailable'));

    const result = await inspectSorobanState(userPublicKey);

    expect(result.source).toBe('mock');
    expect(result.error).toMatch(/RPC unavailable/);
  });

  it('invokes onStatus callback with preparing/signing/submitting', async () => {
    const onStatus = vi.fn();
    await place_bet(userPublicKey, 'UP', '10', onStatus);

    expect(onStatus).toHaveBeenCalledWith('preparing');
    expect(onStatus).toHaveBeenCalledWith('signing');
    expect(onStatus).toHaveBeenCalledWith('submitting');
  });
});

describe('humanizeContractError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['insufficient balance', 'Simulation failed: HostError: Status(ContractError(7)) insufficient balance'],
    ['tx_insufficient_balance', 'Transaction rejected by network: tx_insufficient_balance'],
  ])('maps an insufficient-balance failure (%s) to friendly copy', (_label, raw) => {
    expect(humanizeContractError(new Error(raw))).toBe(
      "You don't have enough XLM in your wallet to cover this prediction and its fees. Fund your wallet and try again."
    );
  });

  it('maps a Soroban budget/resource failure to friendly copy', () => {
    expect(humanizeContractError(new Error('Simulation failed: HostError: Status(Budget)'))).toBe(
      'This prediction would use more network resources than allowed. Try a smaller stake.'
    );
  });

  it('maps a closed-round failure to friendly copy', () => {
    expect(humanizeContractError(new Error('Simulation failed: ContractError: round is closed'))).toBe(
      'The current round has closed and is no longer accepting predictions. Try again in the next round.'
    );
  });

  it('maps a user-cancelled Freighter signature to friendly copy', () => {
    expect(humanizeContractError(new Error('Freighter signing rejected: User rejected the request'))).toBe(
      'You cancelled the request in your wallet. No transaction was sent.'
    );
  });

  it('maps an authentication failure to friendly copy', () => {
    expect(humanizeContractError(new Error('Simulation failed: HostError: Status(AuthenticationError)'))).toBe(
      "Your wallet couldn't be verified for this transaction. Approve it in Freighter and try again."
    );
  });

  it('maps an unfunded account to friendly copy', () => {
    expect(humanizeContractError(new Error('Stellar account not found or unfunded on Testnet. Please fund your address first.'))).toBe(
      'Your Stellar account is not funded yet. Add XLM before placing a prediction.'
    );
  });

  it('maps a network timeout to friendly copy', () => {
    expect(humanizeContractError(new Error('Transaction polling timed out after 60 seconds.'))).toBe(
      "The Stellar network didn't respond. Check your connection and try again."
    );
  });

  it('maps a generic contract panic to friendly copy', () => {
    expect(humanizeContractError(new Error('Simulation failed: Contract invocation panicked'))).toBe(
      'The prediction contract rejected this request. Review your details and try again.'
    );
  });

  it('falls back to a safe message for unknown errors', () => {
    expect(humanizeContractError(new Error('Some cryptic internal error code 0xdeadbeef'))).toBe(
      CONTRACT_ERROR_FALLBACK
    );
    expect(humanizeContractError('not even an error object')).toBe(CONTRACT_ERROR_FALLBACK);
    expect(humanizeContractError(null)).toBe(CONTRACT_ERROR_FALLBACK);
  });

  it('keeps the raw error in the console for debugging', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const raw = new Error('Simulation failed: HostError: Status(Budget)');

    humanizeContractError(raw, 'place_bet');

    expect(consoleSpy).toHaveBeenCalledWith('[xelma-contract:place_bet] raw error:', raw);
  });
});

describe('extractInspectorFields', () => {
  it('reads snake_case field names', () => {
    const fields = extractInspectorFields(
      { position_side: 'DOWN', stake: 250 },
      { round_id: 7, pool_split: '60/40' },
    );

    expect(fields).toEqual({
      positionSide: 'DOWN',
      stake: '250',
      roundId: '7',
      poolSplit: '60/40',
    });
  });

  it('reads camelCase field name aliases', () => {
    const fields = extractInspectorFields(
      { positionSide: 'UP', amount: 99 },
      { roundId: 3, poolUp: 700, poolDown: 300 },
    );

    expect(fields.positionSide).toBe('UP');
    expect(fields.stake).toBe('99');
    expect(fields.roundId).toBe('3');
    expect(fields.poolSplit).toBe('700 / 300');
  });

  it('derives pool split from poolUp/poolDown when no explicit pool_split field exists', () => {
    const fields = extractInspectorFields({}, { pool_up: 10, pool_down: 5 });
    expect(fields.poolSplit).toBe('10 / 5');
  });

  it('prefers an explicit pool_split field over deriving from poolUp/poolDown', () => {
    const fields = extractInspectorFields({}, { pool_split: '80/20', pool_up: 10, pool_down: 5 });
    expect(fields.poolSplit).toBe('80/20');
  });

  it('omits fields it cannot find rather than throwing', () => {
    const fields = extractInspectorFields({ unrelated: true }, { also_unrelated: 1 });

    expect(fields).toEqual({
      positionSide: undefined,
      stake: undefined,
      roundId: undefined,
      poolSplit: undefined,
    });
  });

  it('handles null/undefined position and round without throwing', () => {
    expect(() => extractInspectorFields(null, undefined)).not.toThrow();
    expect(extractInspectorFields(null, undefined)).toEqual({
      positionSide: undefined,
      stake: undefined,
      roundId: undefined,
      poolSplit: undefined,
    });
  });

  it('handles non-object (primitive/array) position and round without throwing', () => {
    expect(() => extractInspectorFields('unexpected-string', [1, 2, 3])).not.toThrow();
    expect(extractInspectorFields('unexpected-string', [1, 2, 3])).toEqual({
      positionSide: undefined,
      stake: undefined,
      roundId: undefined,
      poolSplit: undefined,
    });
  });

  it('stringifies bigint values', () => {
    const fields = extractInspectorFields({ side: 'UP', stake: 12345678901234567890n }, {});
    expect(fields.stake).toBe('12345678901234567890');
  });

  it('falls back to the position record for round id when the round record has none', () => {
    const fields = extractInspectorFields({ round_id: 5 }, { state: 'open' });
    expect(fields.roundId).toBe('5');
  });
});
