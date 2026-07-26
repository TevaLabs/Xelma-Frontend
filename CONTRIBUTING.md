# Contributing to Xelma Frontend

Thanks for contributing to Xelma — a trustless, dual-mode prediction market on Stellar. This guide is the starting point for local setup, app architecture, and pull request expectations.

## Local setup

```bash
pnpm install          # primary package manager; updates pnpm-lock.yaml
npm install           # keep package-lock.json in sync because CI uses npm ci
pnpm dev              # start the Vite dev server
pnpm test:unit        # run the Vitest unit suite
pnpm lint             # run ESLint
pnpm build            # run TypeScript build plus Vite production build
```

> CI runs `npm ci`, then the project checks from `package-lock.json`. If you change dependencies, refresh both `pnpm-lock.yaml` and `package-lock.json` before opening a PR.

## Environment variables

Create a local `.env` file when you need non-default services. Vite only exposes variables prefixed with `VITE_`.

| Variable | Required? | Default / notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Required for integrated backend testing | Backend/API origin. Falls back to `VITE_API_URL`, then `http://localhost:3000`. |
| `VITE_API_URL` | Optional legacy alias | Used only when `VITE_API_BASE_URL` is not set. |
| `VITE_STELLAR_RPC_URL` | Optional for testnet defaults | Defaults to `https://soroban-testnet.stellar.org`. |
| `VITE_XELMA_CONTRACT_ID` | Optional for current testnet contract | Defaults to the checked-in testnet contract id in `src/lib/xelma-contract.ts`. |
| `VITE_STELLAR_NETWORK` | Optional display/config hint | Defaults to `TESTNET` where consumed. |
| `VITE_STELLAR_NETWORK_PASSPHRASE` | Optional for testnet defaults | Defaults to Stellar Test SDF Network passphrase. |

Do not commit private keys, wallet secrets, production tokens, or personal RPC credentials.

## Frontend architecture

The app has a dual-dashboard model plus a standalone landing page:

- `/` renders the bespoke public landing experience.
- `/dashboard` renders the current terminal dashboard used for the primary connected prediction flow.
- `/play` renders the legacy play dashboard kept available while terminal-dashboard work continues.

All routed pages are composed under the dark terminal shell in `src/App.tsx`: `<OfflineBanner />`, `<Navbar />`, lazy routes, `<Footer />` (except the landing route), and `<Toaster />`. Avoid adding a second global shell or duplicate header. Prefer existing dark palette utilities and shared components.

## Before opening a PR

- [ ] Link the GitHub issue the PR addresses. Use `Closes #123` when appropriate.
- [ ] Keep the PR focused on one concern.
- [ ] Run `pnpm lint` and fix reported issues.
- [ ] Run `pnpm test:unit` for unit coverage.
- [ ] Run `pnpm build` for the TypeScript/Vite production build.
- [ ] Include screenshots or a short screen recording for visible UI changes.
- [ ] Mention any env vars, migrations, or manual QA steps reviewers need.

## Finding work

Start with the repository issue tracker:

- [Open frontend issues](https://github.com/TevaLabs/Xelma-Frontend/issues?q=is%3Aissue+is%3Aopen)
- [Open enhancement issues](https://github.com/TevaLabs/Xelma-Frontend/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

If an issue is stale or underspecified, comment with your proposed approach before investing in a large change.
