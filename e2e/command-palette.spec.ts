import { test, expect, type Page } from '@playwright/test';
import { mockFreighter } from './helpers/mock-freighter';

/**
 * Command palette E2E coverage (issue #999).
 *
 * The global palette is mounted in `App` and opened with Cmd/Ctrl+K
 * (or the Navbar's "Ctrl+K" button). These specs exercise the real
 * keyboard path — shortcut, filter, arrow keys, Enter — and assert the
 * router lands on the selected route.
 */

/** Keeps unrelated onboarding/auth network noise out of the assertions. */
async function mockAppBackend(page: Page) {
  await Promise.all([
    page.route('**/horizon-testnet.stellar.org/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          balances: [{ asset_type: 'native', balance: '100.00' }],
        }),
      }),
    ),
    page.route('**/api/auth/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ challenge: 'mock_challenge', token: 'mock_jwt_token' }),
      }),
    ),
    page.route('**/api/rounds/active', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'No active round' }),
      }),
    ),
  ]);
}

function palette(page: Page) {
  return page.getByRole('dialog', { name: 'Command palette' });
}

test.describe('Command palette – navigate to Connect', () => {
  test.beforeEach(async ({ page }) => {
    await mockFreighter(page, { alreadyAuthorized: false });
    await mockAppBackend(page);
  });

  test('Ctrl+K opens the palette, filters to Connect and Enter navigates to /connect', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Control+k');

    const dialog = palette(page);
    await expect(dialog).toBeVisible();

    const input = dialog.getByRole('combobox');
    await expect(input).toBeFocused();
    await input.fill('Connect');

    const options = dialog.getByRole('option');
    await expect(options).toHaveCount(1);
    await expect(options.first()).toContainText('Connect');
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');

    await input.press('Enter');

    await expect(dialog).not.toBeVisible();
    await expect(page).toHaveURL(/\/connect$/);

    // The destination actually rendered, not just a URL change.
    await expect(page.getByRole('heading', { name: 'Connect Wallet' })).toBeVisible();
  });

  test('arrow keys select Connect and Enter navigates, without typing a filter', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Control+k');
    const dialog = palette(page);
    await expect(dialog).toBeVisible();

    const input = dialog.getByRole('combobox');

    // Default order: Dashboard, Leaderboard, Learn, Connect, Profile, Pools.
    await input.press('ArrowDown');
    await input.press('ArrowDown');
    await input.press('ArrowDown');

    const connectOption = dialog.getByRole('option', { name: 'Connect' });
    await expect(connectOption).toHaveAttribute('aria-selected', 'true');

    await input.press('Enter');

    await expect(dialog).not.toBeVisible();
    await expect(page).toHaveURL(/\/connect$/);
  });

  test('the palette can be dismissed with Escape and reopened via the Navbar shortcut button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Control+k');
    const dialog = palette(page);
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole('button', { name: 'Open command palette (Ctrl+K)' }).click();
    await expect(dialog).toBeVisible();

    await dialog.getByRole('combobox').fill('connect');
    await dialog.getByRole('option', { name: 'Connect' }).click();

    await expect(dialog).not.toBeVisible();
    await expect(page).toHaveURL(/\/connect$/);
  });
});
