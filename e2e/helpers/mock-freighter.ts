import type { Page } from '@playwright/test';

/**
 * Injects a fake Freighter extension for Playwright E2E specs (issue #614).
 *
 * How the mock is injected
 * -------------------------
 * The app never touches a `window.freighter` object directly — it calls into
 * `@stellar/freighter-api` (`isConnected`, `requestAccess`, `getNetwork`,
 * `signMessage`, `signTransaction`), which itself talks to the real Freighter
 * browser extension over `window.postMessage`: it posts a message shaped
 * `{ source: "FREIGHTER_EXTERNAL_MSG_REQUEST", messageId, type, ... }` and
 * waits for a same-origin `message` event whose `data.source` is
 * `"FREIGHTER_EXTERNAL_MSG_RESPONSE"` and whose `data.messagedId` (a typo in
 * the real library, matched here on purpose) equals the request's
 * `messageId`.
 *
 * A version of this mock existed before (`e2e/wallet-connect.spec.ts`) that
 * assigned a `window.freighter = { isConnected: () => ..., ... }` object.
 * That object is never read by `requestAccess()`, `getNetwork()`,
 * `signMessage()`, or `signTransaction()` at all — only `isConnected()` has a
 * legacy fallback that checks `window.freighter` as a plain boolean-ish
 * value. Assigning it an object (also truthy) happened to satisfy that one
 * check by accident, but every other call silently posted a message that
 * nothing ever answered, so it hung until each call's own internal 2-second
 * timeout, and `requestAccess()` (used by `connect()`) always resolved with
 * an empty public key. That mock could never actually complete a connect
 * flow — this one replaces it with a real `postMessage` responder that
 * answers every message type the app's connect flow actually sends.
 *
 * Usage: call before `page.goto(...)`. Note that with the default
 * `alreadyAuthorized: true`, the app's own `checkConnection()` (which runs
 * on mount) will auto-connect the wallet before your test ever clicks
 * anything — this mirrors what a real returning user with Freighter already
 * unlocked and authorized experiences. Pass `alreadyAuthorized: false` to
 * test the explicit "click Connect Wallet" flow instead.
 */
export interface MockFreighterOptions {
  address?: string;
  network?: 'TESTNET' | 'PUBLIC';
  /** Set to simulate the user rejecting the connection request. */
  rejectAccess?: boolean;
  /**
   * Whether Freighter already reports the site as previously authorized
   * (`REQUEST_CONNECTION_STATUS` -> `isConnected: true`). Defaults to `true`,
   * which matches a returning user and makes the app's own on-mount
   * `checkConnection()` auto-connect without any click — this is real app
   * behavior, not a shortcut the mock invents. Set `false` to simulate a
   * fresh Freighter that has never granted this site access, which requires
   * driving the "Connect Wallet" -> pick Freighter -> requestAccess() flow
   * explicitly.
   */
  alreadyAuthorized?: boolean;
}

const DEFAULT_ADDRESS = 'GBHEXAMPLEADDRESSFORTESTINGPURPOSESONLY1234567890ABCDE';

export async function mockFreighter(page: Page, options: MockFreighterOptions = {}): Promise<void> {
  const { address = DEFAULT_ADDRESS, network = 'TESTNET', rejectAccess = false, alreadyAuthorized = true } = options;

  await page.addInitScript(
    ({ address, network, rejectAccess, alreadyAuthorized }) => {
      const passphrase =
        network === 'PUBLIC'
          ? 'Public Global Stellar Network ; September 2015'
          : 'Test SDF Network ; September 2015';

      // The onboarding checklist modal is unrelated to wallet connection and
      // would otherwise intercept every click on the page underneath it.
      localStorage.setItem('xelma_onboarding_dismissed', 'true');

      window.addEventListener('message', (event: MessageEvent) => {
        const data = event.data as
          | { source?: string; messageId?: number; type?: string; blob?: string }
          | undefined;
        if (!data || event.source !== window || data.source !== 'FREIGHTER_EXTERNAL_MSG_REQUEST') {
          return;
        }

        const respond = (payload: Record<string, unknown>) => {
          window.postMessage(
            {
              source: 'FREIGHTER_EXTERNAL_MSG_RESPONSE',
              messagedId: data.messageId,
              ...payload,
            },
            window.location.origin,
          );
        };

        switch (data.type) {
          case 'REQUEST_CONNECTION_STATUS':
            respond({ isConnected: alreadyAuthorized });
            break;
          case 'REQUEST_ACCESS':
            respond(rejectAccess ? { publicKey: '', apiError: 'User declined access' } : { publicKey: address });
            break;
          case 'REQUEST_PUBLIC_KEY':
            respond({ publicKey: address });
            break;
          case 'REQUEST_NETWORK_DETAILS':
            respond({
              networkDetails: {
                network,
                networkName: network === 'PUBLIC' ? 'Mainnet' : 'Testnet',
                networkUrl:
                  network === 'PUBLIC' ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org',
                networkPassphrase: passphrase,
              },
            });
            break;
          case 'REQUEST_ALLOWED_STATUS':
            respond({ isAllowed: true });
            break;
          case 'SUBMIT_TRANSACTION':
            respond({ signedTransaction: 'mock_signed_xdr', signerAddress: address });
            break;
          case 'SUBMIT_BLOB':
            respond({ signedBlob: `mocked_signature_${String(data.blob ?? '')}`, signerAddress: address });
            break;
          default:
            // An unhandled request type would otherwise hang until the
            // caller's own internal timeout — respond empty instead so a
            // spec exercising a not-yet-mocked call fails fast and visibly.
            respond({});
        }
      });
    },
    { address, network, rejectAccess, alreadyAuthorized },
  );
}

export { DEFAULT_ADDRESS as MOCK_FREIGHTER_ADDRESS };
