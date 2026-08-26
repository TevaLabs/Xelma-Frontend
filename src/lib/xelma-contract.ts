import { rpc, Contract, TransactionBuilder, BASE_FEE, Networks, Address, nativeToScVal, scValToNative, xdr } from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';

const RPC_URL = import.meta.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const XELMA_CONTRACT_ID = import.meta.env.VITE_XELMA_CONTRACT_ID || 'CD7V3L7JIP52EXWLYSOWXND4F3N65QZ2R54H6M77Y3S37Z55XHLXELMA';
const NETWORK_PASSPHRASE = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;

const rpcServer = new rpc.Server(RPC_URL);

export interface ContractTransactionResult {
  txHash: string;
  ledger: number;
}

/** Fee and resource breakdown from a Soroban simulation. */
export interface FeeEstimate {
  /** Network base fee (stroops → XLM). */
  baseFee: string;
  /** Minimum resource fee charged by Soroban (stroops → XLM). */
  resourceFee: string;
  /** Total fee = baseFee + resourceFee (XLM). */
  totalFee: string;
  /** CPU instructions consumed by the contract call. */
  instructions: string;
  /** Ledger read bytes. */
  readBytes: string;
  /** Ledger write bytes. */
  writeBytes: string;
  /** Prepared transaction XDR for previewing the unsigned payload. */
  xdr: string;
  /** Prepared transaction hash for previewing the payload. */
  hash: string;
  /** Network passphrase used to build the preview transaction. */
  networkPassphrase: string;
}

export interface SorobanInspectorSnapshot {
  source: 'rpc' | 'mock';
  status?: 'ok' | 'error';
  /** Raw, undecoded position ScVal — kept for the "View raw JSON" disclosure. */
  position?: unknown;
  /** Raw, undecoded round ScVal — kept for the "View raw JSON" disclosure. */
  round?: unknown;
  /** Structured fields decoded from `position`/`round`, when recognizable. */
  fields?: SorobanInspectorFields;
  error?: string;
  inspectedAt?: string;
}

/** Structured, human-readable fields decoded from the raw position/round ScVals. */
export interface SorobanInspectorFields {
  positionSide?: string;
  stake?: string;
  roundId?: string;
  poolSplit?: string;
}

/** Decodes an ScVal-shaped value, returning null when it cannot be converted. */
function decodeScVal(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  try {
    return scValToNative(value as xdr.ScVal);
  } catch {
    return null;
  }
}

/**
 * Reads a field off a decoded map/object by trying several plausible key
 * spellings (contracts vary in whether they use snake_case, camelCase, or
 * short aliases) — mirrors the defensive lookup used for round ids in
 * prediction-events.ts.
 */
function pickField(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function stringifyFieldValue(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'number' || typeof value === 'string') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  try {
    return JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v));
  } catch {
    return undefined;
  }
}

/**
 * Best-effort extraction of structured, human-readable fields (position side,
 * stake, round id, pool split) from the decoded position/round contract
 * return values. Field names are not guaranteed by the contract ABI, so every
 * lookup tries multiple plausible key spellings and simply omits a field it
 * cannot find rather than throwing — callers should treat any field as
 * optional and fall back to the raw JSON disclosure when nothing is found.
 */
export function extractInspectorFields(position: unknown, round: unknown): SorobanInspectorFields {
  const decodedPosition = decodeScVal(position);
  const decodedRound = decodeScVal(round);

  const positionRecord =
    decodedPosition && typeof decodedPosition === 'object' && !Array.isArray(decodedPosition)
      ? (decodedPosition as Record<string, unknown>)
      : {};
  const roundRecord =
    decodedRound && typeof decodedRound === 'object' && !Array.isArray(decodedRound)
      ? (decodedRound as Record<string, unknown>)
      : {};

  const side = pickField(positionRecord, ['side', 'position_side', 'positionSide', 'direction']);
  const stake = pickField(positionRecord, ['stake', 'amount', 'wager']);
  const roundId = pickField(roundRecord, ['round_id', 'roundId', 'id', 'round']) ?? pickField(positionRecord, ['round_id', 'roundId', 'round']);
  const poolUp = pickField(roundRecord, ['pool_up', 'poolUp', 'up_pool']);
  const poolDown = pickField(roundRecord, ['pool_down', 'poolDown', 'down_pool']);
  const poolSplitRaw = pickField(roundRecord, ['pool_split', 'poolSplit']);

  let poolSplit = stringifyFieldValue(poolSplitRaw);
  if (!poolSplit && (poolUp !== undefined || poolDown !== undefined)) {
    const up = stringifyFieldValue(poolUp) ?? '0';
    const down = stringifyFieldValue(poolDown) ?? '0';
    poolSplit = `${up} / ${down}`;
  }

  return {
    positionSide: stringifyFieldValue(side),
    stake: stringifyFieldValue(stake),
    roundId: stringifyFieldValue(roundId),
    poolSplit,
  };
}

const STROOPS_PER_XLM = 10_000_000;

function stroopsToXlm(stroops: number): string {
  return (stroops / STROOPS_PER_XLM).toFixed(7);
}

/**
 * Polls for the transaction status until it is no longer PENDING.
 */
async function pollTransaction(txHash: string): Promise<ContractTransactionResult> {
  const maxAttempts = 30;
  const intervalMs = 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const txResult = await rpcServer.getTransaction(txHash);

      if (txResult.status === 'SUCCESS') {
        return {
          txHash,
          ledger: txResult.ledger,
        };
      }

      if (txResult.status === 'FAILED') {
        throw new Error(`Transaction failed on-chain: ${txResult.resultMetaXdr || 'unknown failure reason'}`);
      }
    } catch (err) {
      // If error is not a pending response, propagate it
      if (err instanceof Error && !err.message.includes('pending')) {
        throw err;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Transaction polling timed out after 60 seconds.');
}

export async function inspectSorobanState(userAddress: string): Promise<SorobanInspectorSnapshot> {
  try {
    const account = await rpcServer.getAccount(userAddress);
    const contractInstance = new Contract(XELMA_CONTRACT_ID);

    const positionTx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contractInstance.call('get_position', new Address(userAddress).toScVal()))
      .setTimeout(60)
      .build();

    const roundTx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contractInstance.call('get_round', new Address(userAddress).toScVal()))
      .setTimeout(60)
      .build();

    const [positionSimulation, roundSimulation] = await Promise.all([
      rpcServer.simulateTransaction(positionTx),
      rpcServer.simulateTransaction(roundTx),
    ]);

    const positionResult = 'results' in positionSimulation && Array.isArray(positionSimulation.results)
      ? positionSimulation.results[0]?.retval
      : undefined;
    const roundResult = 'results' in roundSimulation && Array.isArray(roundSimulation.results)
      ? roundSimulation.results[0]?.retval
      : undefined;

    return {
      source: 'rpc',
      status: 'ok',
      position: positionResult,
      round: roundResult,
      fields: extractInspectorFields(positionResult, roundResult),
      inspectedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      source: 'mock',
      status: 'error',
      error: err instanceof Error ? err.message : 'RPC unavailable',
    };
  }
}

/**
 * Common transaction preparation and sign/submit wrapper
 */
async function executeContractCall(
  userAddress: string,
  functionName: string,
  args: xdr.ScVal[],
  onStatus?: (status: 'preparing' | 'signing' | 'submitting') => void
): Promise<ContractTransactionResult> {
  // 1. Fetch source account from RPC
  onStatus?.('preparing');
  let account;
  try {
    account = await rpcServer.getAccount(userAddress);
  } catch (err) {
    console.error('Failed to get account details from RPC:', err);
    throw new Error('Stellar account not found or unfunded on Testnet. Please fund your address first.');
  }

  // 2. Build the initial transaction
  const contractInstance = new Contract(XELMA_CONTRACT_ID);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contractInstance.call(functionName, ...args))
    .setTimeout(60)
    .build();

  // 3. Simulate the transaction to find resource fees/footprint
  let simulation;
  try {
    simulation = await rpcServer.simulateTransaction(tx);
  } catch (err) {
    console.error('Transaction simulation request failed:', err);
    throw new Error('Simulation failed. Network error or contract invocation rejected.');
  }

  if ('error' in simulation && simulation.error) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }

  // 4. Prepare transaction with simulation footprint results
  let preparedTx;
  try {
    preparedTx = await rpcServer.prepareTransaction(tx);
  } catch (err) {
    console.error('Failed to prepare transaction footprint:', err);
    throw new Error('Failed to assemble transaction layout with simulated resources.');
  }

  // 5. Sign with Freighter wallet
  let signedResult;
  try {
    onStatus?.('signing');
    signedResult = await signTransaction(preparedTx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });
  } catch (err) {
    console.error('Freighter sign transaction error:', err);
    throw new Error('Failed to sign transaction with Freighter wallet.');
  }

  let signedXdrString: string | null = null;
  if (typeof signedResult === 'string') {
    signedXdrString = signedResult;
  } else if (signedResult && typeof signedResult === 'object') {
    if ('error' in signedResult && signedResult.error) {
      throw new Error(`Freighter signing rejected: ${signedResult.error}`);
    }
    signedXdrString = (signedResult as { signedTxXdr?: string }).signedTxXdr || null;
  }

  if (!signedXdrString) {
    throw new Error('Signing cancelled or rejected by user.');
  }

  // 6. Submit the signed transaction to RPC
  const transactionToSubmit = TransactionBuilder.fromXDR(signedXdrString, NETWORK_PASSPHRASE);
  let submission;
  try {
    onStatus?.('submitting');
    submission = await rpcServer.sendTransaction(transactionToSubmit);
  } catch (err) {
    console.error('Transaction submission request failed:', err);
    throw new Error('Failed to broadcast transaction to Stellar RPC.');
  }

  if (submission.status === 'ERROR') {
    throw new Error(`Transaction rejected by network: ${submission.errorResult || 'unknown error'}`);
  }

  // 7. Poll for transaction completion
  return pollTransaction(submission.hash);
}

/**
 * Build, simulate, and prepare a Soroban transaction — returns a fee/resource
 * estimate without requiring a Freighter signature. This lets the UI show
 * costs before the user approves in their wallet.
 *
 * Throws on simulation failure so the caller can display a clear error.
 */
async function simulateContractCall(
  userAddress: string,
  functionName: string,
  args: xdr.ScVal[],
): Promise<FeeEstimate> {
  let account;
  try {
    account = await rpcServer.getAccount(userAddress);
  } catch {
    throw new Error('Stellar account not found or unfunded on Testnet. Please fund your address first.');
  }

  const contractInstance = new Contract(XELMA_CONTRACT_ID);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contractInstance.call(functionName, ...args))
    .setTimeout(60)
    .build();

  let simulation;
  try {
    simulation = await rpcServer.simulateTransaction(tx);
  } catch {
    throw new Error('Simulation failed. Network error or contract invocation rejected.');
  }

  if (!rpc.Api.isSimulationSuccess(simulation)) {
    const errorMsg = 'error' in simulation ? simulation.error : 'Simulation was not successful';
    throw new Error(`Simulation failed: ${errorMsg}`);
  }

  // Apply simulation footprint & resource fee to the tx
  const preparedTx = await rpcServer.prepareTransaction(tx);

  const baseFeeStroops = Number(BASE_FEE) || 100;
  const resourceFeeStroops = 'minResourceFee' in simulation && simulation.minResourceFee
    ? Number(simulation.minResourceFee)
    : 0;
  const cost = 'cost' in simulation ? simulation.cost : undefined;

  const hashValue = typeof preparedTx.hash === 'function' ? preparedTx.hash() : null;
  const hash: string = !hashValue
    ? ''
    : Buffer.isBuffer(hashValue)
      ? hashValue.toString('hex')
      : String(hashValue);

  return {
    baseFee: stroopsToXlm(baseFeeStroops),
    resourceFee: stroopsToXlm(resourceFeeStroops),
    totalFee: stroopsToXlm(baseFeeStroops + resourceFeeStroops),
    instructions: cost?.cpuInsns ? String(cost.cpuInsns) : '0',
    readBytes: (cost as unknown as { readBytes?: string | number })?.readBytes ? String((cost as unknown as { readBytes: string | number }).readBytes) : '0',
    writeBytes: (cost as unknown as { writeBytes?: string | number })?.writeBytes ? String((cost as unknown as { writeBytes: string | number }).writeBytes) : '0',
    xdr: typeof (preparedTx as { toXDR?: () => string }).toXDR === 'function'
      ? (preparedTx as { toXDR: () => string }).toXDR()
      : '',
    hash,
    networkPassphrase: NETWORK_PASSPHRASE,
  };
}

/**
 * Estimate fee and resources for an UP/DOWN bet without sending a transaction.
 */
export async function estimatePlaceBet(
  userAddress: string,
  direction: 'UP' | 'DOWN',
  stake: string,
): Promise<FeeEstimate> {
  const amountStroops = BigInt(Math.round(parseFloat(stake) * 10_000_000));
  const args = [
    new Address(userAddress).toScVal(),
    nativeToScVal(direction, { type: 'symbol' }),
    nativeToScVal(amountStroops, { type: 'u128' }),
  ];
  return simulateContractCall(userAddress, 'place_bet', args);
}

/**
 * Estimate fee and resources for a precision / Legend prediction without
 * sending a transaction.
 */
export async function estimatePrecisionPrediction(
  userAddress: string,
  direction: 'UP' | 'DOWN',
  stake: string,
  exactPrice: string,
): Promise<FeeEstimate> {
  const amountStroops = BigInt(Math.round(parseFloat(stake) * 10_000_000));
  const exactPriceScaled = BigInt(Math.round(parseFloat(exactPrice) * 10_000));
  const args = [
    new Address(userAddress).toScVal(),
    nativeToScVal(direction, { type: 'symbol' }),
    nativeToScVal(amountStroops, { type: 'u128' }),
    nativeToScVal(exactPriceScaled, { type: 'u64' }),
  ];
  return simulateContractCall(userAddress, 'place_precision_prediction', args);
}

/**
 * Places a standard UP or DOWN bet on the active round.
 * @param userAddress The public key of the user.
 * @param direction "UP" | "DOWN"
 * @param stake Amount in XLM (converted to stroops).
 */
export async function place_bet(
  userAddress: string,
  direction: 'UP' | 'DOWN',
  stake: string,
  onStatus?: (status: 'preparing' | 'signing' | 'submitting') => void
): Promise<ContractTransactionResult> {
  const amountStroops = BigInt(Math.round(parseFloat(stake) * 10_000_000));
  const args = [
    new Address(userAddress).toScVal(),
    nativeToScVal(direction, { type: 'symbol' }),
    nativeToScVal(amountStroops, { type: 'u128' }),
  ];

  return executeContractCall(userAddress, 'place_bet', args, onStatus);
}

/**
 * Places a precision / Legend prediction on the active round.
 * @param userAddress The public key of the user.
 * @param direction "UP" | "DOWN"
 * @param stake Amount in XLM (converted to stroops).
 * @param exactPrice Target exact price.
 */
export async function place_precision_prediction(
  userAddress: string,
  direction: 'UP' | 'DOWN',
  stake: string,
  exactPrice: string,
  onStatus?: (status: 'preparing' | 'signing' | 'submitting') => void
): Promise<ContractTransactionResult> {
  const amountStroops = BigInt(Math.round(parseFloat(stake) * 10_000_000));
  // Scale the exact price to a 4-decimal integer for contract representation
  const exactPriceScaled = BigInt(Math.round(parseFloat(exactPrice) * 10_000));

  const args = [
    new Address(userAddress).toScVal(),
    nativeToScVal(direction, { type: 'symbol' }),
    nativeToScVal(amountStroops, { type: 'u128' }),
    nativeToScVal(exactPriceScaled, { type: 'u64' }),
  ];

  return executeContractCall(userAddress, 'place_precision_prediction', args, onStatus);
}

/**
 * Claims pending winnings for the user.
 * @param userAddress The public key of the user.
 */
export async function claim_winnings(
  userAddress: string,
  onStatus?: (status: 'preparing' | 'signing' | 'submitting') => void
): Promise<ContractTransactionResult> {
  const args = [
    new Address(userAddress).toScVal(),
  ];

  return executeContractCall(userAddress, 'claim_winnings', args, onStatus);
}
