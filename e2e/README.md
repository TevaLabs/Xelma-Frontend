# End-to-end tests

Run the full Playwright suite locally with:

```sh
pnpm run test:e2e
```

Run only the route smoke checks (fast critical-path coverage) with:

```sh
pnpm run test:e2e:smoke
```

Smoke specs assert that key routes render their expected headings and shell UI in Chromium:

| Route | Visibility checks |
| --- | --- |
| `/` | Landing hero and CTA |
| `/dashboard` | Wallet connect prompt |
| `/leaderboard` | Leaderboard heading |
| `/learn` | Xelma Academy heading and guide sections |
| `/profile` | Profile heading and settings link |
| `/pools` | Liquidity Pools heading and pool cards |
| `/tournament` | Tournament coming-soon shell |

Failures name the missing heading or element so you can tell which route regressed. Shared helpers live in `e2e/helpers/smoke.ts` (navigation, API stubs, onboarding dismissal).

Run only the browser-based axe scans with:

```sh
pnpm run test:e2e:a11y
```

The axe scan covers `/` and `/dashboard` in Chromium and fails when axe reports `serious` or `critical` accessibility violations.
