import { test, expect } from '@playwright/test';
import { dismissOnboardingIfPresent, skipOnboarding } from './helpers';

test.describe('Smoke Tests - Critical Routes', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
  });

  test('Landing page loads and renders correctly', async ({ page }) => {
    await page.goto('/');
    await dismissOnboardingIfPresent(page);

    await expect(page).toHaveTitle(/Xelma/i);

    const mainHeading = page.getByRole('heading', { level: 1, name: /read the market/i });
    await expect(mainHeading).toBeVisible();

    const subheading = page.locator('p').filter({ hasText: 'Xelma is a trustless, dual-mode prediction market' });
    await expect(subheading).toBeVisible();

    const ctaButton = page.getByRole('link', { name: /enter prediction terminal/i });
    await expect(ctaButton).toBeVisible();
  });

  test('Dashboard page loads and renders correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissOnboardingIfPresent(page);

    await expect(page).toHaveTitle(/Xelma/i);

    const walletPrompt = page.locator('[data-testid="dashboard-wallet-prompt"]');
    await expect(walletPrompt).toBeVisible();
    await expect(walletPrompt).toContainText('Connect your wallet');

    const connectButton = page.locator('[data-testid="dashboard-connect-now"]');
    await expect(connectButton).toBeVisible();
  });

  test('Leaderboard page loads and renders correctly', async ({ page }) => {
    await page.goto('/leaderboard');
    await dismissOnboardingIfPresent(page);

    await expect(page).toHaveTitle(/Xelma/i);

    const mainHeading = page.getByRole('heading', { level: 1, name: /leaderboard/i });
    await expect(mainHeading).toBeVisible();
  });
});
