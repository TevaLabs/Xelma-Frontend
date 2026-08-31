/**
 * Wallet adapter contract.
 *
 * Every supported wallet is expressed as a `WalletAdapter`. The app talks only
 * to this interface, so adding a wallet means adding one adapter file and one
 * registry entry — no changes to the store or to any component.
 */

export type WalletId = 'freighter' | 'albedo' | 'lobstr';

/** Why an adapter cannot currently be used. */
export type WalletUnavailableReason =
  | 'NOT_INSTALLED'
  | 'NOT_IMPLEMENTED'
  | 'UNSUPPORTED_PLATFORM';

export interface WalletAvailability {
  isAvailable: boolean;
  reason?: WalletUnavailableReason;
}

export interface WalletConnection {
  /** Connected G-address. */
  address: string;
  /** Network reported by the wallet, e.g. `TESTNET`. Null when unknown. */
  network: string | null;
}

export interface SignOptions {
  networkPassphrase: string;
  address?: string;
}

export interface WalletAdapter {
  readonly id: WalletId;
  /** Display name shown in the picker. */
  readonly name: string;
  /** One-line description shown under the name. */
  readonly description: string;
  /**
   * True once the adapter is fully wired. Adapters that exist only to reserve
   * a slot in the picker report false and render as "Coming soon".
   */
  readonly isImplemented: boolean;

  /**
   * Extra context shown as a tooltip / screen-reader hint on "Coming soon"
   * rows, so users understand *why* the wallet is disabled instead of
   * assuming the app is broken. Only meaningful when `isImplemented` is
   * `false`; implemented adapters leave this unset.
   */
  readonly comingSoonHint?: string;

  /**
   * Whether this wallet can be used right now — typically an extension-presence
   * check. Must not prompt the user.
   */
  isAvailable(): Promise<WalletAvailability>;

  /** Requests access and returns the connected address and network. */
  connect(): Promise<WalletConnection>;

  /** Signs an arbitrary message, used for backend challenge/response auth. */
  signMessage(message: string, options: SignOptions): Promise<string>;

  /** Signs a transaction XDR and returns the signed XDR. */
  signTransaction(xdr: string, options: SignOptions): Promise<string>;
}

/** Thrown when an adapter cannot complete a request. */
export class WalletAdapterError extends Error {
  readonly walletId: WalletId;

  constructor(walletId: WalletId, message: string) {
    super(message);
    this.name = 'WalletAdapterError';
    this.walletId = walletId;
  }
}
