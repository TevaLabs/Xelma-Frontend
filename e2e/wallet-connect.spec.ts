import { test, expect } from '@playwright/test';

const MOCK_ADDRESS = 'GBHExampleAddressForTestingPurposesOnly1234567890ABCDE';

/** Inject a fake Freighter wallet object before any app code runs. */
function mockFreighter(page: import('@playwright/test').Page) {
  return page.addInitScript((mockAddress: string) => {
    let connected = false;
    (window as unknown as Record<string, unknown>).freighter = {
      isConnected: () => Promise.resolve({ isConnected: connected }),
      requestAccess: () => {
        connected = true;
        return Promise.resolve({ address: mockAddress, error: null });
      },
      getAddress: () =>
        Promise.resolve({ address: mockAddress, error: null }),
      getNetwork: () => Promise.resolve({ network: 'TESTNET', error: null }),
      signMessage: (message: string) =>
        Promise.resolve({ signedMessage: `mocked_signature_${message}`, error: null }),
    };
  }, MOCK_ADDRESS);
}

test.describe('Wallet Connect – Freighter Mocked', () => {
  test('Connect page shows wallet prompt and Connect Wallet button', async ({ page }) => {
    await mockFreighter(page);

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
    // Specify the button in the header (desktop), not the mobile drawer
    const connectButton = page.locator('header button:has-text("Connect Wallet")').first();
    await expect(connectButton).toBeVisible();
  });

  test('Dashboard shows wallet prompt when not connected, then navigates to connect page', async ({ page }) => {
    await mockFreighter(page);

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

    // Navigate to /connect page
    await page.goto('/connect');

    // Close any modal overlay that might be present (e.g., onboarding modal)
    const modalOverlay = page.locator('.fixed.inset-0.z-\\[200\\]');
    if (await modalOverlay.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Verify Connect Wallet button is visible on the connect page
    const connectButton = page.getByRole('button', { name: 'Connect Wallet' }).nth(1);
    await expect(connectButton).toBeVisible();
  });
});
