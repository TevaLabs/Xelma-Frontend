import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical Routes', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.text(), msg.location().url));
    page.on('pageerror', (err) => console.error('BROWSER PAGE ERROR:', err));

    await page.route('**/api/rounds/active', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      })
    );

    await page.route('**/api/stats/network', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    );

    await page.route('**/api/rounds/events', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'text/event-stream',
        body: '',
      })
    );
  });

  test('Landing page loads and renders correctly', async ({ page }) => {
    await page.goto('/');

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
    await page.goto('/dashboard');

    // Verify page title
    await expect(page).toHaveTitle(/Xelma/i);

    // Verify dashboard content is present
    // The dashboard shows wallet connection prompt when not connected
    const walletPrompt = page.locator('[data-testid="dashboard-wallet-prompt"]');
    await expect(walletPrompt).toBeVisible();
    await expect(walletPrompt).toContainText('Connect your wallet');

    // Verify connect button is present
    const connectButton = page.locator('[data-testid="dashboard-connect-now"]');
    await expect(connectButton).toBeVisible();
  });

  test('Leaderboard page loads and renders correctly', async ({ page }) => {
    // Mock leaderboard API
    await page.route('**/api/leaderboard**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await page.goto('/leaderboard');

    // Verify page title
    await expect(page).toHaveTitle(/Xelma/i);

    // Verify main heading is present
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('Leaderboard');
  });
});
