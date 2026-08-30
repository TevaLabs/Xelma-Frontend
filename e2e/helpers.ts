import type { Page } from '@playwright/test';

/** Prevent the first-visit onboarding overlay from covering page content. */
export async function skipOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('xelma_onboarding_dismissed', 'true');
  });
}

/** Click the overlay away if it still rendered after navigation. */
export async function dismissOnboardingIfPresent(page: Page) {
  const dismiss = page.getByRole('button', { name: 'Dismiss onboarding checklist' });
  if (await dismiss.isVisible().catch(() => false)) {
    await dismiss.click();
  }
}
