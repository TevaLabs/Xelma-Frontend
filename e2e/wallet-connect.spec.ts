import { test, expect } from '@playwright/test';
import { mockFreighter, MOCK_FREIGHTER_ADDRESS } from './helpers/mock-freighter';

/** Mocks the backend auth challenge/connect round trip Dashboard's connect() flow makes. */
function mockAuthBackend(page: import('@playwright/test').Page) {
  return Promise.all([
    page.route('**/api/auth/challenge', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ challenge: 'mock_challenge' }),
      }),
    ),
    page.route('**/api/auth/connect', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'mock_jwt_token' }),
      }),
    ),
  ]);
}

function mockHorizonBalance(page: import('@playwright/test').Page) {
  return page.route('**/horizon-testnet.stellar.org/accounts/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        balances: [{ asset_type: 'native', balance: '100.00' }],
      }),
    }),
  );
}

/**
 * Suppresses the onboarding checklist modal, which is unrelated to wallet
 * connection but would otherwise intercept clicks on every other element.
 * `mockFreighter` already does this as part of its own init script; use this
 * directly for a spec that deliberately does not mock Freighter (e.g. to
 * assert the real disconnected state).
 */
function dismissOnboarding(page: import('@playwright/test').Page) {
  return page.addInitScript(() => {
    localStorage.setItem('xelma_onboarding_dismissed', 'true');
  });
}

async function dismissModalIfPresent(page: import('@playwright/test').Page) {
  const modalOverlay = page.locator('.fixed.inset-0.z-\\[200\\]');
  if (await modalOverlay.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
}

test.describe('Wallet Connect – Freighter Mocked', () => {
  test('Connect page shows wallet prompt and Connect Wallet button', async ({ page }) => {
    // Freighter has never granted this site access, so the page loads into
    // the disconnected "Connect Wallet" state rather than auto-connecting.
    await mockFreighter(page, { alreadyAuthorized: false });
    await mockHorizonBalance(page);
    await mockAuthBackend(page);

    await page.goto('/connect');
    await dismissModalIfPresent(page);

    const connectButton = page.locator('.glass-card').getByRole('button', { name: /connect wallet|checking wallet/i });
    await expect(connectButton).toBeVisible();
  });

  test('Dashboard shows wallet prompt when not connected, then navigates to connect page', async ({ page }) => {
    // Deliberately no Freighter mock at all: this test asserts the
    // disconnected state, which is what a real page load with no extension
    // looks like.
    await dismissOnboarding(page);
    await mockHorizonBalance(page);
    await mockAuthBackend(page);

    await page.goto('/dashboard');

    const walletPrompt = page.locator('[data-testid="dashboard-wallet-prompt"]');
    await expect(walletPrompt).toBeVisible();
    await expect(walletPrompt).toContainText('Connect your wallet');

    await page.click('[data-testid="dashboard-connect-now"]');
    await page.waitForURL('**/connect');
    await dismissModalIfPresent(page);

    const connectButton = page.locator('.glass-card').getByRole('button', { name: /connect wallet|checking wallet/i });
    await expect(connectButton).toBeVisible();
  });

  /**
   * A returning user whose Freighter already authorized this site connects
   * automatically on page load (Dashboard's `checkConnection()` effect) —
   * no click required. This exercises the mocked `isConnected()` ->
   * `getAddress()` -> `getNetwork()` chain end to end (issue #614).
   */
  test('a previously-authorized wallet auto-connects on load and clears the dashboard wallet prompt', async ({
    page,
  }) => {
    await mockFreighter(page, { address: MOCK_FREIGHTER_ADDRESS, network: 'TESTNET', alreadyAuthorized: true });
    await mockHorizonBalance(page);
    await mockAuthBackend(page);

    await page.goto('/dashboard');
    await dismissModalIfPresent(page);

    await expect(page.locator('[data-testid="dashboard-wallet-prompt"]')).not.toBeVisible({ timeout: 15000 });
  });

  /**
   * `waitForExtension()` (src/lib/wallets/freighter.ts) treats "not yet
   * authorized" the same as "not installed": it polls `isConnected()` and
   * only proceeds to `requestAccess()` once that reports true. A Freighter
   * that has genuinely never granted this site access therefore cannot
   * reach the access-request prompt through this app's UI at all — clicking
   * through the picker surfaces the "install Freighter" card instead of a
   * permission prompt. This is a real, if perhaps unintended, product
   * behavior worth pinning down with a test rather than silently assuming
   * the picker flow reaches `requestAccess()` for every wallet state.
   */
  test('a wallet that has never granted access shows Freighter Extension Required, not a permission prompt', async ({
    page,
  }) => {
    await mockFreighter(page, { alreadyAuthorized: false });
    await mockHorizonBalance(page);
    await mockAuthBackend(page);

    await page.goto('/connect');
    await dismissModalIfPresent(page);

    const connectButton = page.locator('.glass-card').getByRole('button', { name: /connect wallet/i });
    await expect(connectButton).toBeEnabled();
    await connectButton.click();

    const freighterOption = page.getByRole('button', { name: /freighter/i });
    await expect(freighterOption).toBeVisible();
    await freighterOption.click();

    await expect(page.getByText(/freighter extension required/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /continue to dashboard/i })).not.toBeVisible();
  });

  /**
   * The extension is present and previously granted the isConnected() check
   * (`waitForExtension()` needs this to succeed before it will even attempt
   * `requestAccess()`), but the user declines the access prompt itself. This
   * is a different failure than "extension not installed" and must not be
   * confused with it in the UI.
   */
  test('a rejected Freighter access request leaves the wallet disconnected with no crash', async ({ page }) => {
    await mockFreighter(page, { rejectAccess: true, alreadyAuthorized: true });
    await mockHorizonBalance(page);
    await mockAuthBackend(page);

    await page.goto('/connect');
    await dismissModalIfPresent(page);

    // isConnected() is mocked true, so checkConnection() calls getAddress()
    // on mount — which, on the real extension, returns the previously
    // granted address regardless of a *future* requestAccess() decision.
    // Our mock's REQUEST_PUBLIC_KEY handler is unconditional, so this scenario
    // starts already connected; explicitly disconnect first to reach the
    // "Connect Wallet" button and exercise the rejected-request path fresh.
    await expect(page.getByRole('button', { name: /disconnect/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /disconnect/i }).click();

    const connectButton = page.locator('.glass-card').getByRole('button', { name: /connect wallet/i });
    await expect(connectButton).toBeVisible();
    await connectButton.click();

    const freighterOption = page.getByRole('button', { name: /freighter/i });
    await expect(freighterOption).toBeVisible();
    await freighterOption.click();

    // Still on /connect, not silently redirected to a connected dashboard,
    // and specifically not showing the (wrong) "extension missing" card.
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/connect/);
    await expect(page.getByRole('button', { name: /continue to dashboard/i })).not.toBeVisible();
    await expect(page.getByText(/freighter extension required/i)).not.toBeVisible();
  });
});
