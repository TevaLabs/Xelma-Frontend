import { test, expect } from '@playwright/test';
import {
  mockActiveRoundApi,
  mockEducationApis,
  prepareSmokeSession,
  visitRoute,
} from './helpers/smoke';

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
    await prepareSmokeSession(page);
    await mockFreighter(page);

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
  });

  test('Landing page loads and renders correctly', async ({ page }) => {
    await visitRoute(page, '/');
    await expect(page).toHaveURL(/\/$/);
    await expect(page).toHaveTitle(/Xelma/i);

    const mainHeading = page.getByRole('heading', { level: 1 });
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('Read the market');

    await expect(
      page.getByText('Xelma is a trustless, dual-mode prediction market'),
    ).toBeVisible();

    await expect(
      page.getByRole('link', { name: 'Enter Prediction Terminal' }),
    ).toBeVisible();
  });

  test('Dashboard page loads and renders correctly', async ({ page }) => {
    await mockActiveRoundApi(page);
    await visitRoute(page, '/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page).toHaveTitle(/Xelma/i);

    const walletPrompt = page.getByTestId('dashboard-wallet-prompt');
    await expect(walletPrompt).toBeVisible({ timeout: 15_000 });
    await expect(walletPrompt).toContainText('Connect your wallet');

    await expect(page.getByTestId('dashboard-connect-now')).toBeVisible();
  });

  test('Leaderboard page loads and renders correctly', async ({ page }) => {
    await visitRoute(page, '/leaderboard');
    await expect(page).toHaveURL(/\/leaderboard$/);
    await expect(page).toHaveTitle(/Xelma/i);

    const mainHeading = page.getByRole('heading', { name: 'Leaderboard', level: 1 });
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('Leaderboard');
  });

  test('Learn page loads and renders correctly', async ({ page }) => {
    await mockEducationApis(page);
    await visitRoute(page, '/learn');
    await expect(page).toHaveURL(/\/learn$/);
    await expect(page).toHaveTitle(/Xelma/i);

    await expect(page.getByRole('heading', { name: /Xelma Academy/i, level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Expert Guides', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Quick Alpha', level: 2 })).toBeVisible();
  });

  test('Profile page loads and renders correctly', async ({ page }) => {
    await visitRoute(page, '/profile');
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page).toHaveTitle(/Xelma/i);

    const profileHeading = page.getByRole('heading', { name: 'Profile', level: 1 });
    await expect(profileHeading).toBeVisible();
    await expect(profileHeading).toContainText('Profile');

    const settingsLink = page.getByTestId('profile-open-settings');
    await expect(settingsLink).toBeVisible();
    await expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  test('Pools page loads and renders correctly', async ({ page }) => {
    await visitRoute(page, '/pools');
    await expect(page).toHaveURL(/\/pools$/);
    await expect(page).toHaveTitle(/Xelma/i);

    const poolsHeading = page.getByRole('heading', { name: 'Liquidity Pools', level: 1 });
    await expect(poolsHeading).toBeVisible();
    await expect(poolsHeading).toContainText('Liquidity Pools');

    await expect(page.getByRole('heading', { name: 'BTC Pool', level: 2 })).toBeVisible({
      timeout: 5_000,
    });
  });

  test('Tournament page loads and renders correctly', async ({ page }) => {
    await visitRoute(page, '/tournament');
    await expect(page).toHaveURL(/\/tournament$/);
    await expect(page).toHaveTitle(/Xelma/i);

    const tournamentHeading = page.getByRole('heading', { name: /Tournaments?/, level: 1 });
    await expect(tournamentHeading).toBeVisible();
    await expect(tournamentHeading).toContainText('Tournament');

    await expect(
      page.getByText(/Compete against other predictors in structured tournament brackets/i),
    ).toBeVisible();
  });
});
