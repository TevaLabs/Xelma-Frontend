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

Run only the unknown-route (404) regression spec with:

```sh
pnpm exec playwright test e2e/not-found.spec.ts
```

`not-found.spec.ts` asserts that an unmatched path renders the `NotFound` page
rather than falling through to the Landing page. It needs no wallet, no auth
session, and no API stubs — it uses the plain `page` fixture.

### Note on the dev-server build

The `webServer` in `playwright.config.ts` runs `pnpm run build` before serving
`dist/`, so a TypeScript error anywhere in the app will fail **every** e2e
spec before a single test runs. Run `pnpm run build` first if the e2e suite
fails to start.
