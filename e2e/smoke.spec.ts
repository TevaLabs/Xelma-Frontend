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
    // Mock education content so the Learn page renders its sections instead of
    // its error state (no backend runs during e2e — requests to
    // http://localhost:3000 would otherwise fail with ERR_CONNECTION_REFUSED).
    await page.route('**/api/education/guides', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'guide-1',
            title: 'Reading the Market',
            description: 'How to interpret short-term price action before you stake.',
            category: 'Basics',
            readTime: '5 min read',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ]),
      }),
    );
    await page.route('**/api/education/tip', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'tip-1',
          title: 'Alpha tip of the day',
          content: 'Wait for candle confirmation before entering a position.',
          category: 'Strategy',
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
      }),
    );
    // Stub the round-events SSE stream so the EventSource does not retry
    // against a backend that does not exist during e2e runs.
    await page.route('**/api/rounds/events', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'retry: 600000\n\n',
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

  test('Learn page loads and renders correctly', async ({ page }) => {
    await page.goto('/learn');
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page).toHaveTitle(/Xelma/i);

    // Verify main heading is present
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('Academy');

    // Verify Expert Guides section heading is present
    const guidesHeading = page.locator('h2').filter({ hasText: 'Expert Guides' });
    await expect(guidesHeading).toBeVisible({ timeout: 10000 });
  });

  test('Profile page loads and renders correctly', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page).toHaveTitle(/Xelma/i);

    // Verify main heading is present
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('Profile');

    // Verify profile section label
    const profileLabel = page.locator('p').filter({ hasText: 'Player identity' });
    await expect(profileLabel).toBeVisible();
  });

  test('Pools page loads and renders correctly', async ({ page }) => {
    await page.goto('/pools');
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page).toHaveTitle(/Xelma/i);

    // Verify main heading is present
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('Liquidity Pools');

    // Verify subtitle is present
    const subtitle = page.locator('p').filter({ hasText: 'Transparency and historical stats' });
    await expect(subtitle).toBeVisible({ timeout: 10000 });
  });

  test('Tournament page loads and renders correctly', async ({ page }) => {
    await page.goto('/tournament');
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page).toHaveTitle(/Xelma/i);

    // Verify main heading is present
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();

    // Verify Coming Soon badge is present (scope to the page's <main> — the
    // navbar also renders a "Coming Soon" chip, which breaks strict mode)
    const comingSoonBadge = page.locator('#main-content').getByText('Coming Soon');
    await expect(comingSoonBadge).toBeVisible();
  });
});
