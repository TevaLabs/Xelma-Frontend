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

The suite also includes smoke coverage across critical routes (`/`, `/dashboard`, `/leaderboard`) and unknown-route 404 error recovery.

## Command palette

`e2e/command-palette.spec.ts` covers the global palette's keyboard path to `/connect` (issue #999):

```sh
pnpm exec playwright test e2e/command-palette.spec.ts
```

It asserts Ctrl+K opens the dialog and focuses the search input, that filtering to "Connect" narrows the
list to the single Connect option, and that pressing Enter navigates to `/connect` and closes the palette.
It also covers arrow-key selection without typing (the palette's default order is Dashboard, Leaderboard,
Learn, Connect, Profile, Pools) and Escape/reopen through the Navbar's Ctrl+K button.
