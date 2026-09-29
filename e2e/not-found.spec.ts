import { test, expect } from '@playwright/test';

/**
 * Regression coverage for catch-all routing (#698).
 *
 * `src/App.tsx` renders `<Route path="*" element={<NotFound />} />`, so an
 * unmatched path must resolve to the 404 page. The failure mode this guards
 * against is a *silent* one: if the catch-all were dropped or a route
 * mis-ordered, an unknown path can fall through to the Landing page and still
 * render successfully — so a "page loads" assertion would pass. These
 * assertions are therefore written to positively identify NotFound by its own
 * content and to negatively rule out Landing.
 *
 * Deliberately a separate file from `smoke.spec.ts`: that suite's
 * `beforeEach` installs a Freighter mock, route stubs and localStorage flags.
 * None of that is needed here, and inheriting it would make a routing test
 * depend on wallet plumbing. This spec uses the plain `page` fixture and never
 * touches a wallet, an auth session, or any application state.
 */

/** A path that cannot collide with a real route in App.tsx. */
const UNKNOWN_ROUTE = '/this-route-definitely-does-not-exist';

/**
 * The app mounts an <OnboardingChecklist> modal on every route, which covers
 * the page and intercepts pointer events. `e2e/smoke.spec.ts` already
 * dismisses it with this same localStorage flag, so this is the established
 * convention rather than a test-only hack. It is UI chrome only — it has no
 * bearing on routing, and dismissing it keeps the click assertions honest
 * (the CTA is genuinely reachable, not force-clicked past an overlay).
 */
async function dismissOnboarding(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('xelma_onboarding_dismissed', 'true');
  });
}

test.describe('Unknown route handling', () => {
  test('renders the 404 page instead of redirecting to Landing', async ({ page }) => {
    await dismissOnboarding(page);
    const response = await page.goto(UNKNOWN_ROUTE);

    // A 404 status is a useful signal but is NOT the assertion: the SPA
    // fallback server may legitimately serve 200 for client-routed paths, so
    // the content checks below carry the real weight.
    expect(response?.status()).toBeLessThan(500);

    // --- NotFound-specific content, by role and accessible name ---
    await expect(
      page.getByRole('heading', { level: 1, name: "This path doesn't exist" }),
    ).toBeVisible();

    // Distinguishing copy that exists only on the 404 page.
    await expect(page.getByText('Unknown route')).toBeVisible();
    await expect(
      page.getByText(/The route you navigated to has no matching endpoint/i),
    ).toBeVisible();

    // Both CTAs, asserted as links by role + name (stable, not class-based).
    const backHome = page.getByRole('link', { name: 'Back to Home' });
    const openTerminal = page.getByRole('link', { name: 'Open Terminal' });
    await expect(backHome).toBeVisible();
    await expect(openTerminal).toBeVisible();
    await expect(backHome).toHaveAttribute('href', '/');
    await expect(openTerminal).toHaveAttribute('href', '/dashboard');

    // --- Rule out Landing ---
    // Landing's <h1> is "Read the market. / Anticipate the move." If the catch-
    // all regressed into a redirect to "/", this heading would be present and
    // the assertion below would fail — which is the point of the spec.
    await expect(
      page.getByRole('heading', { level: 1, name: /Read the market/i }),
    ).toHaveCount(0);

    // The Landing hero CTA must not be present either.
    await expect(
      page.getByRole('link', { name: /Enter Prediction Terminal/i }),
    ).toHaveCount(0);

    // The URL must still be the unknown path, not rewritten to "/".
    await expect(page).toHaveURL(new RegExp(`${UNKNOWN_ROUTE}$`));
  });

  test('keeps rendering 404 for a deep unknown path with no wallet connected', async ({
    page,
  }) => {
    // No wallet mock, no auth: the router must resolve unknown paths on its
    // own. The only state seeded is the onboarding-dismissed UI flag.
    await dismissOnboarding(page);
    await page.goto('/definitely/not/a/real/nested/route');

    await expect(
      page.getByRole('heading', { level: 1, name: "This path doesn't exist" }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Home' })).toBeVisible();
  });

  test('recovers to the app when the 404 CTA is followed', async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto(UNKNOWN_ROUTE);

    await page.getByRole('link', { name: 'Back to Home' }).click();

    // Proves the CTA is wired to real routing, and that the 404 page is a
    // genuine route rather than a dead end.
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { level: 1, name: /Read the market/i }),
    ).toBeVisible();
  });
});
