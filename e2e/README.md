# End-to-end tests

Run the full Playwright suite locally with:

```sh
pnpm run test:e2e
```

Run only the browser-based axe scans with:

```sh
pnpm exec playwright test e2e/accessibility.spec.ts
```

The axe scan covers `/` and `/dashboard` in Chromium and fails when axe reports `serious` or `critical` accessibility violations.
