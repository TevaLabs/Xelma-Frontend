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
- `/dashboard` is the **single primary prediction terminal**. It includes the price chart, round lifecycle timeline, connection status, end-round modal, and opt-in community chat. This is the live dashboard used for all connected prediction flows.
- `/play` is **deprecated** and permanently redirects to `/dashboard`. The `LegacyDashboard` component is retained only for reference and is no longer routed. New work should target `/dashboard` exclusively.

All routed pages are composed under the dark terminal shell in `src/App.tsx`: `<OfflineBanner />`, `<Navbar />`, lazy routes, `<Footer />` (except the landing route), and `<Toaster />`. Avoid adding a second global shell or duplicate header. Prefer existing dark palette utilities and shared components.

**Canonical shared UI:** Import `PanelHeader` only from `src/components/ui/PanelHeader.tsx`. Do not recreate a root-level `src/components/PanelHeader.tsx` — the duplicate was removed to prevent API drift.

## Stellar Wave contributor quick-start

Xelma participates in the Stellar Wave hackathon program. This section is the fastest path
for a new contributor to find rebuildable stubs and start shipping.

### 1. Find rebuild stubs with ContributorTaskPlaceholder

The `ContributorTaskPlaceholder` component (`src/components/ContributorTaskPlaceholder.tsx`)
is a temporary shell that marks UI surfaces intentionally stubbed for contributor rebuilds.
It renders a dashed cyan border with a title and an `issueHint` linking back to the
relevant GitHub issue.

Search for import references to find all active stubs:

```bash
grep -r "ContributorTaskPlaceholder" src/
```

Active stubs (search for the component name in [open Stellar Wave issues](https://github.com/TevaLabs/Xelma-Frontend/issues?q=is%3Aissue+is%3Aopen+label%3A%22Stellar+Wave%22) to find the corresponding rebuild issue):

| Component | Location |
| --- | --- |
| `RoundTimer.tsx` | `src/components/RoundTimer.tsx` |
| `RankProgressBar.tsx` | `src/components/RankProgressBar.tsx` |
| `ModeCards.tsx` | `src/components/ModeCards.tsx` |
| `NewsRibbon.tsx` | `src/components/NewsRibbon.tsx` |
| `HowItWorks.tsx` | `src/components/HowItWorks.tsx` |
| `LiveGameStatsPanel.tsx` | `src/components/LiveGameStatsPanel.tsx` |
| `HudStatusRow.tsx` | `src/components/hud/HudStatusRow.tsx` |
| `GuideCard.tsx` | `src/components/education/GuideCard.tsx` |
| `TipCard.tsx` | `src/components/education/TipCard.tsx` |

### 2. How to claim a rebuild issue

1. Browse [open Stellar Wave issues](https://github.com/TevaLabs/Xelma-Frontend/issues?q=is%3Aissue+is%3Aopen+label%3A%22Stellar+Wave%22).
2. Comment on the issue to express interest and share your approach.
3. Replace the `ContributorTaskPlaceholder` wrapper with real UI that matches the
   issue's acceptance criteria and the project's dark terminal design system.
4. Remove the `ContributorTaskPlaceholder` import once the stub is fully replaced.
5. Open a PR referencing the issue (e.g., `Closes #254`).

### 3. Freighter + Soroban environment variables

To interact with the Stellar blockchain (wallet connection and on-chain contract calls),
you may need these additional environment variables. Add them to your local `.env` file:

| Variable | Required? | Default / notes |
| --- | --- | --- |
| `VITE_STELLAR_RPC_URL` | Optional for testnet | `https://soroban-testnet.stellar.org` — Soroban JSON-RPC endpoint. |
| `VITE_XELMA_CONTRACT_ID` | Optional for testnet | Defaults to the checked-in testnet contract id in `src/lib/xelma-contract.ts`. |
| `VITE_STELLAR_NETWORK_PASSPHRASE` | Optional for testnet | `Test SDF Network ; September 2015` — network passphrase for signing transactions. |
| `VITE_STELLAR_NETWORK` | Optional | `TESTNET` — human-readable network label shown in the navbar badge. |

> **Freighter wallet** (`@stellar/freighter-api`) is the supported browser extension for
> connecting a Stellar wallet. Install it from [freighter.app](https://www.freighter.app/).
> Connection logic lives in `src/store/useWalletStore.ts` and `src/components/WalletConnect.tsx`.

## Before opening a PR

- [ ] Link the GitHub issue the PR addresses. Use `Closes #123` when appropriate.
- [ ] Keep the PR focused on one concern.
- [ ] Run `pnpm lint` and fix reported issues.
- [ ] Run `pnpm test:unit` for unit coverage.
- [ ] Run `pnpm test:e2e` to ensure Playwright smoke tests pass.
- [ ] Run `pnpm build` for the TypeScript/Vite production build.
- [ ] Include screenshots or a short screen recording for visible UI changes.
- [ ] Mention any env vars, migrations, or manual QA steps reviewers need.

## Socket.IO Event Map & MSW Fixtures

The frontend uses strongly-typed Socket.IO event maps defined in `src/lib/socket-events.ts` and exported through `src/lib/socket.ts`.

Event categories covered:
- **Price**: Real-time asset price updates (`price:update`).
- **Stats**: Live game statistics, predictions, and round state changes (`game:stats`, `round:started`, `round:resolved`, `prediction:created`).
- **Chat**: Room-scoped live chat messaging (`chat:message`, `chat:send`, `join:chat`, `leave:chat`).
- **Notifications**: System notification alerts (`notification`, `join:notifications`).

### Mock Socket Fixtures for Local Demos and Tests

When developing UI components or running local demos without a connected Socket.IO backend, use the MSW socket fixtures located in `src/test/msw-socket-fixtures.ts`.

```ts
import { mockSocketFixtures, createSocketMSWHandlers } from './src/test/msw-socket-fixtures';

// Access categorized mock payloads:
const mockPrice = mockSocketFixtures.price.single;
const mockChatMsg = mockSocketFixtures.chat.message;
const mockStats = mockSocketFixtures.stats.liveStats;
const mockNotification = mockSocketFixtures.notifications.single;
```

To run a local demo against mock socket data using MSW:
1. Import `createSocketMSWHandlers` in your MSW setup.
2. Intercept WebSocket connections to `http://localhost:3000`.
3. Emit `mockSocketFixtures` payloads to simulate backend events.

## Finding work


Start with the repository issue tracker:

- [Open frontend issues](https://github.com/TevaLabs/Xelma-Frontend/issues?q=is%3Aissue+is%3Aopen)
- [Open enhancement issues](https://github.com/TevaLabs/Xelma-Frontend/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

If an issue is stale or underspecified, comment with your proposed approach before investing in a large change.
