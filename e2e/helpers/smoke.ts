import type { Page } from '@playwright/test';

/** Navigate without waiting for slow `load` events (service worker, pending fetches). */
export async function visitRoute(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
}

/** Hide first-run onboarding overlay so it does not block route assertions. */
export async function prepareSmokeSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('xelma_onboarding_dismissed', 'true');
  });
}

/** Dashboard waits on `/api/rounds/active` before rendering the wallet prompt. */
export async function mockActiveRoundApi(page: Page) {
  await page.route('**/api/rounds/active', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: 'null',
    });
  });
}

/** Learn page needs education endpoints; stub empty responses for a fast, stable shell check. */
export async function mockEducationApis(page: Page) {
  await page.route('**/api/education/guides', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });
  await page.route('**/api/education/tip', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: 'null',
    });
  });
}
