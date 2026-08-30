# Xelma — Frontend

Xelma is a **collective market-intelligence prediction game on the Stellar blockchain**.
Users predict short-term price direction (and, in Legend mode, exact prices) on active
rounds that settle trustlessly on-chain via a Soroban smart contract.

This repository contains the **web client** for Xelma — a React + TypeScript single-page
application built with Vite, Tailwind CSS, Zustand, and Socket.IO.

- **Backend repo:** https://github.com/TevaLabs/Xelma-Backend
- **Issue tracker:** https://github.com/TevaLabs/Xelma-Frontend/issues
- **Design reference:** [Figma – Xelma](https://www.figma.com/design/HQp2j9epTTKq6vggiGQRzl/Untitled?node-id=22-685&p=f&t=FZBmcBq74PBjmbF1-0)


---

## Table of contents

- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Environment variables](#environment-variables)
- [Deployment](#deployment) ← production / Vercel guide
- [Education & Learn page](#education--learn-page)
- [Project structure notes](#project-structure-notes)
- [Localization](#localization)
- [Testing](#testing)
- [React Compiler / ESLint notes](#react-compiler--eslint-notes)

---

## Tech stack

| Layer        | Choice                                                |
| ------------ | ----------------------------------------------------- |
| Framework    | [React 19](https://react.dev/) + [TypeScript 5.9](https://www.typescriptlang.org/) |
| Build tool   | [Vite 7](https://vite.dev/)                           |
| Styling      | [Tailwind CSS 4](https://tailwindcss.com/) via the `@tailwindcss/vite` plugin |
| State        | [Zustand](https://zustand-demo.pmnd.rs/)              |
| Routing      | [react-router-dom 7](https://reactrouter.com/)        |
| Realtime     | [socket.io-client 4](https://socket.io/)              |
| Wallet       | [Freighter](https://www.freighter.app/) (`@stellar/freighter-api`) |
| On-chain     | [`@stellar/stellar-sdk` 12](https://developers.stellar.org/) (Soroban contracts) |
| Charts       | [`lightweight-charts`](https://tradingview.github.io/lightweight-charts/) |
| Testing      | [Vitest 4](https://vitest.dev/) + React Testing Library + MSW |
| Linting      | [ESLint 9](https://eslint.org/) flat config + `typescript-eslint` |

---

## Getting started

### Prerequisites

- **Node.js 20.x** (matches CI; Vite 7 + `@tailwindcss/vite` 4 both target modern Node).
- **pnpm 9+** (recommended — the lockfile of record is `pnpm-lock.yaml`). `npm` works as a
  fallback but `pnpm` is what Vercel and CI run on by default.

### Clone & install

```bash
git clone https://github.com/Richardkingz2019/Xelma-Frontend.git
cd Xelma-Frontend
pnpm install
```

> If you don't have pnpm yet: `npm install -g pnpm`.
>
> `npm install` also works; the project ships both `pnpm-lock.yaml` and `package-lock.json`.

### Run the dev server

```bash
pnpm dev
```

The app boots on [http://localhost:5173](http://localhost:5173). During development it
proxies `/api` and `/socket.io` to `http://localhost:3000` (configure via
[`vite.config.ts`](./vite.config.ts) and [`src/lib/config.ts`](./src/lib/config.ts)).

> 💡 **Freighter-less Demo:** Newcomers can demo the full UI, wallet connection, placing bets, and claiming rewards in <15 minutes without installing the Freighter browser extension. See [`docs/freighter-less-fixtures.md`](./docs/freighter-less-fixtures.md).

---

## Available scripts

| Script               | Purpose                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| `pnpm dev`           | Start Vite with HMR (default port `5173`).                             |
| `pnpm build`         | Type-check (`tsc -b`) + produce a production bundle in `dist/`.        |
| `pnpm preview`       | Serve the contents of `dist/` locally to smoke-test the prod build.    |
| `pnpm lint`          | Run the ESLint flat config over the repo.                              |
| `pnpm test:unit`     | Run the Vitest unit/integration suite once (CI mode).                 |
| `pnpm test:a11y`     | Run axe-core accessibility smoke tests on Landing and Dashboard.      |
| `pnpm test`          | Full CI bundle: `lint && build && test:unit`. Use this before pushing. |

> `npm run <script>` works identically if you prefer npm.

---

## Environment variables

All client-side variables **must** be prefixed with `VITE_` so Vite exposes them to the
browser via `import.meta.env`. Anything without that prefix is silently dropped from the
bundle.

| Variable                          | Required | Where it is read              | Default (dev)                                             | Purpose                                                                 |
| --------------------------------- | -------- | ----------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `VITE_API_BASE_URL`               | ✅ yes   | `src/lib/config.ts`           | `http://localhost:3000`                                   | Root URL of the Xelma backend (REST + Socket.IO origin).                |
| `VITE_API_URL`                    | ⚠️ legacy| `src/lib/config.ts` (fallback)| —                                                         | **Deprecated** — kept as a fallback for `VITE_API_BASE_URL`. New deploys should use `VITE_API_BASE_URL`. |
| `VITE_STELLAR_NETWORK`            | optional | `src/components/Navbar.tsx`, `src/lib/horizon.ts`, `src/lib/stellarNetwork.ts` | `TESTNET`                              | Network label (`TESTNET`, `PUBLIC`, or `MAINNET`). Drives the navbar badge, the default Horizon endpoint, the StellarExpert explorer network, the Friendbot CTA, and the network Freighter must be on — a mismatch renders a guidance card with switch instructions. |
| `VITE_STELLAR_NETWORK_PASSPHRASE` | ✅ prod  | `src/lib/xelma-contract.ts`, `src/components/Footer.tsx` | `Test SDF Network ; September 2015` (Networks.TESTNET) | Network passphrase used to build/sign Soroban transactions. Use `Public Global Stellar Network ; September 2015` for mainnet. |
| `VITE_STELLAR_RPC_URL`            | ✅ prod  | `src/lib/xelma-contract.ts`, `src/lib/prediction-events.ts` | `https://soroban-testnet.stellar.org`   | Soroban JSON-RPC endpoint used to simulate/submit/poll transactions and to read contract events. |
| `VITE_STELLAR_HORIZON_URL`        | optional | `src/lib/horizon.ts`          | Derived from `VITE_STELLAR_NETWORK`                       | Horizon endpoint for account balances and trustlines. Defaults to `horizon-testnet.stellar.org`, or `horizon.stellar.org` on `PUBLIC`/`MAINNET`. Set only to override. |
| `VITE_STELLAR_FRIENDBOT_URL`      | optional | `src/lib/friendbot.ts`        | `https://friendbot.stellar.org`                           | Testnet faucet used by the "Fund with Friendbot" CTA. Ignored on `PUBLIC`/`MAINNET`, where the CTA is hidden. |
| `VITE_XELMA_CONTRACT_ID`          | ✅ prod  | `src/lib/xelma-contract.ts`   | Testnet placeholder contract id                           | Deployed Xelma Soroban contract id (`C…`) for the target network.       |

### `.env` examples

Local development (`.env` in the project root):

```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_STELLAR_NETWORK=TESTNET
VITE_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
# VITE_XELMA_CONTRACT_ID is optional in dev (uses the bundled testnet address)
```

Production (`.env.production` — **do not commit**, set these in Vercel instead):

```bash
VITE_API_BASE_URL=https://xelma-backend.onrender.com
VITE_STELLAR_NETWORK=PUBLIC
VITE_STELLAR_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
VITE_STELLAR_RPC_URL=https://soroban-mainnet.stellar.org
VITE_XELMA_CONTRACT_ID=<your-mainnet-contract-id>
```

> ⚠️ The Xelma backend **must allow CORS for the frontend's origin**. On the backend,
> set `CLIENT_URL=https://<your-vercel-domain>.vercel.app` (or your custom domain).

---

## Deployment

This section is the source of truth for shipping a new build to production. It is
written so that a first-time contributor can deploy without re-discovering every
gotcha. If anything here diverges from what Vercel actually shows, **fix the README
first** — that's the bug.

### 1. Vercel project settings

When importing the repo into Vercel, set the following on **Project Settings → General**:

| Setting              | Value                                                                  |
| -------------------- | ---------------------------------------------------------------------- |
| Framework Preset     | **Vite**                                                               |
| Build Command        | `pnpm build`                                                           |
| Output Directory     | `dist`                                                                 |
| Install Command      | `pnpm install --frozen-lockfile`                                       |
| Node.js Version      | **20.x** (override via `NODE_VERSION=20` env var, or `engines` in `package.json`) |
| Root Directory       | `./`                                                                   |

These match the values used by CI (`.github/workflows/ci.yml`, which pins Node 20 and
runs `npm ci` / `npm test`), so a build that passes locally with `pnpm test` will
behave identically on Vercel.

> ℹ️ **Why `pnpm` and not `npm`?** The project is committed with `pnpm-lock.yaml` as
> the lockfile of record. Mixing `npm install` and `pnpm install` on the same
> codebase can desync the lockfile and cause Vercel to install slightly different
> transitive dependencies than CI, which is the #1 source of "works on my machine"
> deploy bugs. If you must use npm locally, regenerate the npm lockfile with
> `npm install` and commit the result.

### 2. Required environment variables on Vercel

Set the following on **Project Settings → Environment Variables**. Use separate
values per environment (Development / Preview / Production) so PR previews don't
talk to production Stellar / database state.

| Variable                          | Production value (example)                                              | Preview value (example)           |
| --------------------------------- | ----------------------------------------------------------------------- | --------------------------------- |
| `VITE_API_BASE_URL`               | `https://xelma-backend.onrender.com`                                    | `https://xelma-backend-staging.onrender.com` |
| `VITE_STELLAR_NETWORK`            | `PUBLIC`                                                                | `TESTNET`                         |
| `VITE_STELLAR_NETWORK_PASSPHRASE` | `Public Global Stellar Network ; September 2015`                        | `Test SDF Network ; September 2015` |
| `VITE_STELLAR_RPC_URL`            | `https://soroban-mainnet.stellar.org`                                   | `https://soroban-testnet.stellar.org` |
| `VITE_XELMA_CONTRACT_ID`          | `<mainnet contract C-address>`                                          | (leave blank — uses default testnet contract id) |

> Every `VITE_*` variable is **embedded into the JS bundle at build time**. Changing
> a value requires a redeploy. If the variable isn't set, Vercel will fall back to
> the dev defaults listed in [Environment variables](#environment-variables) — which
> is fine in Preview, **never** in Production.

### 3. Pre-deployment checklist

Tick these off before clicking **Deploy** (or pushing to `main`):

- [ ] `pnpm-lock.yaml` is committed and up to date (`pnpm install` reports "already up to date").
- [ ] All five `VITE_*` variables in §2 are set in the **Production** environment.
- [ ] Backend has been redeployed with `CLIENT_URL` matching the Vercel domain (and the preview domain wildcard if you want previews to work).
- [ ] `pnpm test` passes locally, including `pnpm lint`, `pnpm build`, and `pnpm test:unit`.
- [ ] No `.env`, `.env.production`, or secrets are about to be committed. Production secrets live in Vercel, not in the repo.
- [ ] Backend dependency matrix is in sync — see [§6](#6-backend-dependency-matrix).

### 4. Deploying from this fork

```bash
git remote -v
# origin   → https://github.com/Richardkingz2019/Xelma-Frontend.git   (your fork)
# upstream → https://github.com/TevaLabs/Xelma-Frontend.git           (canonical)

# Rebase on upstream before opening a PR
git fetch upstream
git rebase upstream/main

# Push your branch to the fork, then open the PR against TevaLabs/Xelma-Frontend
git push -u origin docs/issue-213-vercel-deployment-env
```

Vercel is configured to deploy on push to `main` of `TevaLabs/Xelma-Frontend`; PR
preview URLs are produced automatically for every branch pushed to `origin`.

### 5. Troubleshooting deploy failures

Most production deploy failures come from one of these five causes. Walk through them
in order — they're ordered from most → least likely.

1. **Stale lockfile.** Symptom: Vercel fails with `ERR_PNPM_LOCKFILE_BREAKING_CHANGE`
   or "frozen lockfile can't be satisfied". Fix: run `pnpm install` locally, commit
   the updated `pnpm-lock.yaml`, push again.
2. **`VITE_API_BASE_URL` missing in Production.** Symptom: app loads but every API call
   routes to `http://localhost:3000`, which fails in the browser. Fix: set the variable
   on Vercel and redeploy.
3. **Wrong Stellar network passphrase.** Symptom: wallet signs the transaction but
   Soroban simulation rejects it with `Invalid network`. Fix: ensure
   `VITE_STELLAR_NETWORK_PASSPHRASE` matches the network in `VITE_STELLAR_RPC_URL`.
4. **CORS blocked on the backend.** Symptom: browser shows `No 'Access-Control-Allow-Origin'`.
   Fix: add the Vercel domain to the backend's `CLIENT_URL` env var (and redeploy the backend).
5. **Wrong contract id.** Symptom: simulation fails with `contract not found`. Fix:
   confirm `VITE_XELMA_CONTRACT_ID` is the deployed contract for the *same* network
   that `VITE_STELLAR_RPC_URL` points at.

### 6. Backend dependency matrix

Frontend features depend on backend endpoints contractually. Issue
[`#152` — Document backend dependency matrix for frontend features](https://github.com/TevaLabs/Xelma-Frontend/issues/152)
tracks a single source-of-truth doc that lives next to this README. Until that
lands, treat the API paths called out in [`src/lib/api.ts`](./src/lib/api.ts) and the
backend repo's OpenAPI spec as the working contract. If a frontend feature ships
against an endpoint the backend doesn't expose (or vice versa), update both sides
in the same PR rather than relying on tribal knowledge.

---

## Education & Learn page

The `/learn` page is fully integrated with the backend API. Content can be updated
dynamically without requiring a frontend redeployment.

### Backend endpoints

- `GET /api/education/guides` — fetches the list of educational guides.
- `GET /api/education/tip` — fetches the current "alpha" tip of the day.

### Components

- `LearnPage` — main container fetching and managing state for education content.
- `GuideCard` — premium card component for displaying individual guides.
- `TipCard` — high-impact card component for the daily tip.
- `StatusStates` — reusable Loading, Error, and Empty state components (under `src/components/ui/`).

---

## Project structure notes

```
src/
├── lib/               # Shared helpers (config, api, socket, stellar contract, utils)
├── store/             # Zustand stores (auth, wallet, profile, round, notifications)
├── pages/             # Top-level routes (Dashboard, Pools, Learn, Profile, …)
├── components/        # Reusable UI (Navbar, Footer, StatsCard, BetModal, …)
├── hooks/             # Cross-cutting React hooks
├── types/             # Shared TypeScript types
└── utils/             # Pure utility functions
```

### Dashboard routes

`/dashboard` is the single primary prediction terminal. It now includes the
high-value panels that previously lived only on the legacy `/play` view: the
price chart, the round lifecycle timeline, round-update connection status, the
end-round modal, and opt-in community chat (toggled from the dashboard header so
the default terminal stays uncluttered).

`/play` is **deprecated** and permanently redirects to `/dashboard`. The former
`LegacyDashboard` page has been removed — `/dashboard` is the single dashboard
story. Chat and notifications are available via the in-dashboard toggle; further
social/notification consolidation is tracked in issue
[#130](https://github.com/TevaLabs/Xelma-Frontend/issues/130).

---

## Localization

This project uses `react-i18next` for lightweight frontend internationalization.

- Translation resources live under `src/locales/`.
- The application initializes i18n in `src/i18n.ts` and loads English (`en`) by default.
- A stub Spanish locale (`es`) is included with the same translation keys.
- Missing translations fall back to English, so the app remains stable when a key is absent.
- Add a new language by creating a resource file under `src/locales/`, registering it in `src/i18n.ts`, and adding new translated keys for the supported UI strings.

## Testing

Unit and integration tests are implemented with **Vitest** + **React Testing Library**.
The HTTP layer is mocked with **MSW** (Mock Service Worker) so tests do not hit the
real backend.

Run unit tests:

```bash
pnpm test:unit
```

Run the full CI gate (lint + build + tests):

```bash
pnpm test
```

### Accessibility smoke tests

Accessibility smoke tests run [axe-core](https://github.com/dequelabs/axe-core) against
the **Landing** and **Dashboard** pages in a jsdom environment (Vitest) and fail the
build on **serious** or **critical** violations of WCAG 2.0/2.1 Level A/AA rules.

Run accessibility tests locally:

```bash
pnpm test:a11y
```

These tests are also wired into the CI pipeline (`npm run test:a11y` step) and will
block PRs that introduce serious a11y regressions.

**Note:** The `color-contrast` rule is disabled because it cannot be reliably evaluated
in jsdom (no actual rendering engine). Visual contrast should be verified manually
or via Playwright browser-based tests.

---

## React Compiler / ESLint notes

The React Compiler is not enabled on this project because of its impact on dev & build
performance. To add it, see <https://react.dev/learn/react-compiler/installation>.

The ESLint flat config (`eslint.config.js`) uses `typescript-eslint`'s recommended
ruleset. For stricter type-aware linting, swap `tseslint.configs.recommended` for
`tseslint.configs.recommendedTypeChecked` and add the matching parser options shown
in the default Vite template — we deliberately left it lighter for build speed.

Currently, two official React Fast Refresh plugins are available:

- [`@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) (Babel / oxc)
- [`@vitejs/plugin-react-swc`](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) (SWC)

This project uses `@vitejs/plugin-react`.
