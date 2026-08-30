import { Networks } from '@stellar/stellar-sdk';

/** Resolved Soroban RPC endpoint. */
export const SOROBAN_RPC_URL =
  import.meta.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';

/** Xelma smart-contract address on Soroban. */
export const XELMA_CONTRACT_ID =
  import.meta.env.VITE_XELMA_CONTRACT_ID ||
  'CD7V3L7JIP52EXWLYSOWXND4F3N65QZ2R54H6M77Y3S37Z55XHLXELMA';

/** Stellar network passphrase used when building transactions. */
export const NETWORK_PASSPHRASE =
  import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;

/** Whether the Dev Settings drawer is enabled (opt-in via env flag). */
export const SHOW_DEV_SETTINGS =
  (import.meta.env.VITE_SHOW_DEV_SETTINGS ?? '').toLowerCase() === 'true';
