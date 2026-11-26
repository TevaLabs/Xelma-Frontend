# End-to-end tests

Run the full Playwright suite locally with:

```sh
pnpm run test:e2e
```

Run only smoke tests with:

```sh
pnpm exec playwright test e2e/smoke.spec.ts
```

Run only the browser-based axe scans with:

```sh
pnpm exec playwright test e2e/accessibility.spec.ts
```

## Route Coverage

The Playwright smoke test suite (`e2e/smoke.spec.ts`) provides fast route smoke verification with route mocks across all primary routes:
- `/` - Landing page hero, messaging, and entry CTA
- `/dashboard` - Prediction terminal, wallet connection prompts, and HUD
- `/leaderboard` - Leaderboard rankings and stats
- `/learn` - Xelma Academy guides and daily tips
- `/profile` - User profile identity and settings link
- `/pools` - Liquidity pools and yield metrics

The axe scan covers `/` and `/dashboard` in Chromium and fails when axe reports `serious` or `critical` accessibility violations.

The suite also includes smoke coverage across critical routes (`/`, `/dashboard`, `/leaderboard`) and unknown-route 404 error recovery.
