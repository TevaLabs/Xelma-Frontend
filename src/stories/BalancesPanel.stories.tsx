import type React from 'react';
import BalancesPanel from '../components/BalancesPanel';
import { useWalletStore } from '../store/useWalletStore';

/**
 * BalancesPanel — mocked wallet/Horizon state stories.
 *
 * The panel's only external inputs are:
 * - `useWalletStore` (which wallet address is connected) — configured through
 *   the real store's `setState`, so the panel sees a connected wallet.
 * - `fetchAccountBalances` (the Horizon network request) — the component calls
 *   the global `fetch` against `HORIZON_URL` under the hood, so each story
 *   replaces `window.fetch` with a stub that answers only Horizon `/accounts/*`
 *   requests and forwards everything else to the real fetch.
 *
 * No live Horizon request is made in any story: `window.fetch` never reaches
 * the network and the panel is driven entirely by canned responses.
 */

const HORIZON_ACCOUNT_RE = /^https:\/\/horizon-testnet\.stellar\.org\/accounts\/.+/;

const CONNECTED_WALLET = 'GCEXAMPLE7ADDRESS7FOR7TESTS7ONLY7AAAAAAAAAAAAAAAAAAAAAAAA';

/** Raw Horizon `/accounts/{id}` payload used by the success stories. */
const HORIZON_BALANCES = {
  balances: [
    { asset_type: 'native', balance: '1250.7500000' },
    {
      asset_type: 'credit_alphanum4',
      asset_code: 'USDC',
      asset_issuer: 'GISSUER7EXAMPLE7USDC7ISSUER7AAAAAAAAAAAAAAAAAAAAAAAAAA',
      balance: '420.5000000',
    },
    {
      asset_type: 'credit_alphanum4',
      asset_code: 'FREN',
      asset_issuer: 'GISSUER7EXAMPLE7FREN7ISSUER7AAAAAAAAAAAAAAAAAAAAAAAAAA',
      balance: '12.0000000',
    },
    {
      asset_type: 'credit_alphanum4',
      asset_code: 'RMT',
      asset_issuer: 'GISSUER7EXAMPLE7RMT7ISSUER7AAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      balance: '99.0000000',
      is_authorized: false,
    },
  ],
};

function connectWallet() {
  useWalletStore.setState({
    status: 'connected',
    publicKey: CONNECTED_WALLET,
    network: 'TESTNET',
    balance: null,
    errorMessage: null,
    errorCode: null,
    networkMismatch: false,
    isWatchOnly: false,
  });
}

const originalFetch = window.fetch.bind(window);

/** Answers Horizon account requests with `response`; delegates everything else. */
function mockHorizon(response: Promise<unknown> | (() => Promise<unknown>)) {
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url && HORIZON_ACCOUNT_RE.test(url)) {
      return typeof response === 'function' ? response() : response;
    }
    return originalFetch(input, init);
  }) as typeof fetch;
}

export default {
  title: 'Glass Card Primitives/BalancesPanel',
  decorators: [
    (Story: React.FC) => (
      <div style={{ background: '#0A0F1A', padding: '24px', minHeight: '300px', maxWidth: '420px' }}>
        <Story />
      </div>
    ),
  ],
};

export const Loading = () => {
  connectWallet();
  // Keep the Horizon request pending so the panel stays in its loading state.
  mockHorizon(new Promise(() => {}));
  return <BalancesPanel />;
};

export const Success = () => {
  connectWallet();
  mockHorizon(Promise.resolve({ ok: true, status: 200, json: async () => HORIZON_BALANCES }));
  return <BalancesPanel />;
};

export const UnauthorizedTrustline = () => {
  connectWallet();
  // Same fixture as Success; the RMT trustline has `is_authorized: false`, so
  // the panel renders its amber "Unauthorized" badge.
  mockHorizon(Promise.resolve({ ok: true, status: 200, json: async () => HORIZON_BALANCES }));
  return <BalancesPanel />;
};

export const Error = () => {
  connectWallet();
  // A rejected request surfaces the panel's error state with a Retry button.
  // The rejection is created lazily so the browser never logs an unhandled
  // rejection for a promise that is never awaited.
  mockHorizon(() => Promise.reject(new Error('Horizon is unreachable')));
  return <BalancesPanel />;
};