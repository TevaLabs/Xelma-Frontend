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

    await page.route('**/api/education/guides', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'guide-1',
            title: 'How UP/DOWN rounds work',
            description: 'Learn how to predict whether the XLM price will rise or fall.',
            category: 'Basics',
            readTime: '4 min',
            createdAt: '2026-01-10T09:00:00.000Z',
          },
          {
            id: 'guide-2',
            title: 'Precision predictions explained',
            description: 'Call the exact closing price and earn a larger share of the pool.',
            category: 'Strategy',
            readTime: '6 min',
            createdAt: '2026-01-12T09:00:00.000Z',
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
          title: 'Pro tip',
          content: 'Watch the pool split before you predict: a lopsided pool pays out more when you are right.',
          category: 'Strategy',
          createdAt: '2026-01-20T09:00:00.000Z',
        }),
      }),
    );

    await page.route('**/api/pools', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            asset: 'BTC',
            totalVolume: 1250000,
            volumeTrend: [980000, 1010000, 1040000, 1120000, 1180000, 1210000, 1250000],
            upDownPool: { total: 850000, up: 450000, down: 400000 },
            precisionPool: { total: 400000, predictions: 312 },
            historicalYield: 14.2,
          },
          {
            asset: 'ETH',
            totalVolume: 890000,
            volumeTrend: [710000, 750000, 790000, 820000, 850000, 870000, 890000],
            upDownPool: { total: 600000, up: 290000, down: 310000 },
            precisionPool: { total: 290000, predictions: 198 },
            historicalYield: 11.8,
          },
          {
            asset: 'XLM',
            totalVolume: 2100000,
            volumeTrend: [1600000, 1750000, 1820000, 1950000, 2010000, 2060000, 2100000],
            upDownPool: { total: 1500000, up: 820000, down: 680000 },
            precisionPool: { total: 600000, predictions: 540 },
            historicalYield: 16.5,
          },
        ]),
      }),
    );

    await page.route('**/api/user/profile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          avatarUrl: null,
          name: 'Stellar Voyager',
          bio: 'Decentralized prediction trader on Stellar.',
          twitterLink: 'https://twitter.com/stellarvoyager',
          streamerMode: false,
        }),
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

    // Verify main academy heading
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('Academy');

    // Verify guides section heading
    const guidesHeading = page.getByRole('heading', { name: /Expert Guides/i });
    await expect(guidesHeading).toBeVisible();

    // Verify guide card is rendered
    await expect(page.getByText('How UP/DOWN rounds work')).toBeVisible();

    // Verify tip card is rendered
    await expect(page.getByText('Pro tip')).toBeVisible();
  });

  test('Profile page loads and renders correctly', async ({ page }) => {
    await mockFreighter(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page).toHaveTitle(/Xelma/i);

    // Verify main heading
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toHaveText('Profile');

    // Verify settings button/link is available
    const settingsButton = page.locator('[data-testid="profile-open-settings"]');
    await expect(settingsButton).toBeVisible();

    // Verify profile identity section
    await expect(page.getByText('Player identity')).toBeVisible();
  });

  test('Pools page loads and renders correctly', async ({ page }) => {
    await page.goto('/pools');
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page).toHaveTitle(/Xelma/i);

    // Verify main heading
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('Liquidity Pools');

    // Verify pool cards are rendered
    await expect(page.getByRole('heading', { name: /BTC Pool/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /ETH Pool/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /XLM Pool/i })).toBeVisible();
  });
});
