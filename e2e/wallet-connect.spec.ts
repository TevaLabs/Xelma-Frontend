import { test, expect } from '@playwright/test';

const MOCK_ADDRESS = 'GBHExampleAddressForTestingPurposesOnly1234567890ABCDE';
const ONBOARDING_KEY = 'xelma_onboarding_dismissed';

/**
 * Emulate the Freighter extension inside the page.
 *
 * The app talks to `@stellar/freighter-api` v6, which does not call
 * `window.freighter.*` methods — it exchanges `postMessage` events with the
 * extension (`FREIGHTER_EXTERNAL_MSG_REQUEST` / `..._RESPONSE`). The mock below
 * answers those requests the way the real extension would: the wallet is
 * installed (`window.freighter` exists) but the account is only revealed after
 * `REQUEST_ACCESS`, mirroring the user granting access in the picker.
 */
function mockFreighter(page: import('@playwright/test').Page) {
  return page.addInitScript(
    (mockAddress: string) => {
      // Presence of `window.freighter` is what `isConnected()` checks.
      (window as unknown as Record<string, unknown>).freighter = {};

      let accessGranted = false;

      window.addEventListener('message', (event) => {
        const data = event.data as {
          source?: string;
          messageId?: unknown;
          type?: string;
          blob?: string;
        };
        if (!data || data.source !== 'FREIGHTER_EXTERNAL_MSG_REQUEST') return;

        let payload: Record<string, unknown>;
        switch (data.type) {
          case 'REQUEST_ACCESS':
            accessGranted = true;
            payload = { publicKey: mockAddress };
            break;
          case 'REQUEST_PUBLIC_KEY':
            payload = { publicKey: accessGranted ? mockAddress : '' };
            break;
          case 'REQUEST_NETWORK_DETAILS':
            payload = {
              networkDetails: {
                network: 'TESTNET',
                networkPassphrase: 'Test SDF Network ; September 2015',
              },
            };
            break;
          case 'REQUEST_CONNECTION_STATUS':
            payload = { isConnected: true };
            break;
          case 'REQUEST_ALLOWED_STATUS':
            payload = { isAllowed: true };
            break;
          case 'SUBMIT_BLOB':
            payload = {
              signedBlob: `mocked_signature_${String(data.blob ?? '')}`,
              signerAddress: mockAddress,
            };
            break;
          default:
            payload = {};
        }

        window.postMessage(
          // NB: freighter-api matches responses on `messagedId` (sic), not `messageId`.
          { source: 'FREIGHTER_EXTERNAL_MSG_RESPONSE', messagedId: data.messageId, ...payload },
          window.location.origin,
        );
      });
    },
    MOCK_ADDRESS,
  );
}

/** Dismiss the first-visit onboarding modal so it never covers the page. */
function dismissOnboarding(page: import('@playwright/test').Page) {
  return page.addInitScript((key: string) => {
    localStorage.setItem(key, 'true');
  }, ONBOARDING_KEY);
}

test.describe('Wallet Connect – Freighter Mocked', () => {
  test('Connect page shows wallet prompt and Connect Wallet button', async ({ page }) => {
    await mockFreighter(page);
    await dismissOnboarding(page);

    // Mock Horizon balance request
    await page.route('**/horizon-testnet.stellar.org/accounts/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          balances: [{ asset_type: 'native', balance: '100.00' }],
        }),
      }),
    );

    // Mock backend auth endpoints
    await page.route('**/api/auth/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ challenge: 'mock_challenge', token: 'mock_jwt_token' }),
      }),
    );

    await page.goto('/connect');

    // The Connect page renders the WalletConnect component
    const connectButton = page.getByTestId('wallet-connect-button');
    await expect(connectButton).toBeVisible();
  });

  test('Dashboard shows wallet prompt when not connected, then connects via Freighter', async ({ page }) => {
    await mockFreighter(page);
    await dismissOnboarding(page);

    // Mock Horizon balance request
    await page.route('**/horizon-testnet.stellar.org/accounts/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          balances: [{ asset_type: 'native', balance: '100.00' }],
        }),
      }),
    );

    // Mock backend auth endpoints
    await page.route('**/api/auth/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ challenge: 'mock_challenge', token: 'mock_jwt_token' }),
      }),
    );

    await page.goto('/dashboard');

    // Should show wallet prompt when not connected
    const walletPrompt = page.locator('[data-testid="dashboard-wallet-prompt"]');
    await expect(walletPrompt).toBeVisible();
    await expect(walletPrompt).toContainText('Connect your wallet');

    // Click "Connect now" which navigates to /connect
    const connectNow = page.locator('[data-testid="dashboard-connect-now"]');
    await expect(connectNow).toBeVisible();
    await connectNow.click();

    // Should navigate to /connect
    await expect(page).toHaveURL(/\/connect/);

    // Click "Connect Wallet" button to open the wallet picker
    const connectButton = page.getByTestId('wallet-connect-button');
    await expect(connectButton).toBeVisible();
    await connectButton.click();

    // Choose Freighter in the picker to initiate the connection flow
    await page.getByRole('button', { name: /freighter browser extension/i }).click();

    // After connection, the "Continue to Dashboard" button should appear
    const continueBtn = page.getByRole('button', { name: /continue to dashboard/i });
    await expect(continueBtn).toBeVisible({ timeout: 10000 });
  });
});
