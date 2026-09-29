import { test, expect } from '@playwright/test';

const MOCK_ADDRESS = 'GBHExampleAddressForTestingPurposesOnly1234567890ABCDE';

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
        Promise.resolve({ address: connected ? mockAddress : '', error: null }),
      getNetwork: () => Promise.resolve({ network: 'TESTNET', error: null }),
      signMessage: (message: string) =>
        Promise.resolve({ signedMessage: `mocked_signature_${message}`, error: null }),
    };
  }, MOCK_ADDRESS);
}

test.describe('Smoke Tests - Critical Routes', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message, err.stack));

    await page.addInitScript(() => {
      window.localStorage.setItem('xelma_onboarding_dismissed', 'true');
      let connected = false;
      (window as unknown as Record<string, unknown>).freighter = {
        isConnected: () => Promise.resolve({ isConnected: connected }),
        requestAccess: () => {
          connected = true;
          return Promise.resolve({ address: 'GBHExampleAddressForTestingPurposesOnly1234567890ABCDE', error: null });
        },
        getAddress: () =>
          Promise.resolve({ address: 'GBHExampleAddressForTestingPurposesOnly1234567890ABCDE', error: null }),
        getNetwork: () => Promise.resolve({ network: 'TESTNET', error: null }),
        signMessage: (message: string) =>
          Promise.resolve({ signedMessage: `mocked_signature_${message}`, error: null }),
      };
    });

    await page.route('**/horizon-testnet.stellar.org/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          balances: [{ asset_type: 'native', balance: '100.00' }],
        }),
      }),
    );

    await page.route('**/api/auth/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ challenge: 'mock_challenge', token: 'mock_jwt_token' }),
      }),
    );
    await page.route('**/api/rounds/active', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'No active round' }),
      }),
    );
  });
  test('Landing page loads and renders correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page).toHaveTitle(/Xelma/i);

    // Verify main heading is present
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('Read the market');
    
    // Verify subheading is present
    const subheading = page.locator('p').filter({ hasText: 'Xelma is a trustless, dual-mode prediction market' });
    await expect(subheading).toBeVisible();

    // Verify CTA button is present
    const ctaButton = page.locator('a', { hasText: 'Enter Prediction Terminal' });
    await expect(ctaButton).toBeVisible();
  });

  test('Dashboard page loads and renders correctly', async ({ page }) => {
    await mockFreighter(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Close any modal overlay that might be present (e.g., onboarding checklist)
    const modalOverlay = page.locator('.fixed.inset-0');
    if (await modalOverlay.first().isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
    }

    // Verify page title
    await expect(page).toHaveTitle(/Xelma/i);

    // Verify dashboard content is present
    // The dashboard shows wallet connection prompt when not connected
    const walletPrompt = page.locator('[data-testid="dashboard-wallet-prompt"]');
    await expect(walletPrompt).toBeVisible({ timeout: 15000 });
    await expect(walletPrompt).toContainText('Connect your wallet');

    // Verify connect button is present
    const connectButton = page.locator('[data-testid="dashboard-connect-now"]');
    await expect(connectButton).toBeVisible();
  });

  test('Leaderboard page loads and renders correctly', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page).toHaveTitle(/Xelma/i);

    // Verify main heading is present
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('Leaderboard');
  });

  // Issue #658: a second `path="*"` route redirecting to `/` used to shadow
  // the NotFound page, so unknown URLs bounced back to the landing page.
  test('Unknown route renders the branded 404 page instead of redirecting home', async ({ page }) => {
    await page.goto('/definitely-not-a-route');
    await page.waitForLoadState('networkidle');

    // Still on the unknown URL — no silent redirect to the landing page.
    await expect(page).toHaveURL(/\/definitely-not-a-route$/);

    // Branded 404 UI is rendered.
    await expect(page.getByRole('heading', { level: 1, name: /this path doesn't exist/i })).toBeVisible();
    await expect(page.getByText('Unknown route')).toBeVisible();

    // Skip-to-content link and layout chrome (navbar) still work on the 404.
    const skipLink = page.getByRole('link', { name: /skip to main content/i });
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toHaveAttribute('href', '#main-content');
    await expect(page.getByRole('main')).toHaveAttribute('id', 'main-content');
    await expect(page.getByRole('navigation').first()).toBeVisible();

    // 404 CTAs lead to real destinations.
    await expect(page.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
    await expect(page.getByRole('link', { name: /open terminal/i })).toHaveAttribute('href', '/dashboard');
  });
});
