import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical Routes', () => {
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

  test('Dashboard page loads and renders correctly', async ({ page }, testInfo) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/dashboard');

    // Verify page title
    await expect(page).toHaveTitle(/Xelma/i);

    // Verify dashboard content is present
    // The dashboard shows wallet connection prompt when not connected
    const walletPrompt = page.locator('[data-testid="dashboard-wallet-prompt"]');
    try {
      await page.waitForSelector('[data-testid="dashboard-wallet-prompt"]', { timeout: 15000 });
    } catch (err) {
      await testInfo.attach('page-screenshot', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
      await testInfo.attach('page-html', { body: await page.content(), contentType: 'text/html' });
      throw err;
    }
    await expect(walletPrompt).toBeVisible();
    await expect(walletPrompt).toContainText('Connect your wallet');

    // Verify connect button is present
    const connectButton = page.locator('[data-testid="dashboard-connect-now"]');
    await expect(connectButton).toBeVisible();
  });

  test('Leaderboard page loads and renders correctly', async ({ page }) => {
    await page.goto('/leaderboard');

    // Verify page title
    await expect(page).toHaveTitle(/Xelma/i);

    // Verify main heading is present
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('Leaderboard');
  });
});
