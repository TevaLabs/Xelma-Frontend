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
- `/play` is **deprecated** and permanently redirects to `/dashboard`. The former `LegacyDashboard` page has been removed. New work should target `/dashboard` exclusively.

All routed pages are composed under the dark terminal shell in `src/App.tsx`: `<OfflineBanner />`, `<Navbar />`, lazy routes, `<Footer />` (except the landing route), and `<Toaster />`. Avoid adding a second global shell or duplicate header. Prefer existing dark palette utilities and shared components.

**Canonical shared UI:** Import `PanelHeader` only from `src/components/ui/PanelHeader.tsx`. Do not recreate a root-level `src/components/PanelHeader.tsx` — the duplicate was removed to prevent API drift.

## ContributorTaskPlaceholder rebuild workflow

Several UI surfaces are intentionally left as contributor rebuild tasks for the
[Stellar Wave program](https://github.com/TevaLabs/Xelma-Frontend/issues?q=is%3Aissue+is%3Aopen+label%3A%22Stellar+Wave%22).
This section documents how those stubs work, how to claim them, and what
“done” means.

### How stubs work

1. **`ContributorTaskPlaceholder` shell** — `src/components/ContributorTaskPlaceholder.tsx`
   renders a dashed cyan bordered panel with a title and `issueHint`. It marks
   UI chrome that is safe to replace while surrounding logic stays in place.

2. **`STUBBED` file comments** — stubbed files include a block comment such as
   `STUBBED for contributor rebuild`. Read it before editing; it lists what
   maintainers intentionally preserved (stores, hooks, aria-live regions, modal
   wiring, mock data, tests).

3. **What stays, what goes**
   - **Keep:** data wiring, state machines, accessibility hooks, existing tests,
     and any non-visual behavior called out in the stub comment.
   - **Replace:** the placeholder panel and any temporary “stub” buttons or copy
     inside it with production UI using the dark terminal / glass-card design
     system (`glass-card`, brand blues/teals, no light emerald/rose cards).

4. **Finding stubs in the tree**

```bash
grep -r "ContributorTaskPlaceholder" src/
grep -r "STUBBED for" src/
```

Each `issueHint` string describes the acceptance criteria embedded in the file.
Cross-check with the linked [open Stellar Wave issue](https://github.com/TevaLabs/Xelma-Frontend/issues?q=is%3Aissue+is%3Aopen+label%3A%22Stellar+Wave%22)
before starting work.

### How to claim a rebuild issue

1. Browse [open Stellar Wave issues](https://github.com/TevaLabs/Xelma-Frontend/issues?q=is%3Aissue+is%3Aopen+label%3A%22Stellar+Wave%22).
2. Comment on the issue with your plan and wait for maintainer acknowledgement
   when required by the wave program.
3. Create a focused branch (e.g. `issue-123-rebuild-round-timeline`).
4. Replace the `ContributorTaskPlaceholder` wrapper with real UI that satisfies
   the issue acceptance criteria **and** the stub comment in the file.
5. Remove the `ContributorTaskPlaceholder` import when the surface is fully rebuilt.
6. Open a PR referencing the issue (`Closes #123`) with before/after screenshots
   or a short screen recording for visible UI changes.

> **Tip:** run the file’s existing unit tests after your rebuild. Many stubs keep
> behavioral tests (modal focus traps, aria-live announcements, store hydration)
> that must continue to pass even while visuals change.

### Definition of done (rebuild tasks)

A rebuild issue is complete when **all** of the following are true:

- [ ] `ContributorTaskPlaceholder` is fully removed from the target file(s).
- [ ] The new UI matches the dark terminal design system and any file-level
      `STUBBED` guidance (glass cards, SVG/lucide icons, brand tokens).
- [ ] Preserved logic still works: stores/hooks, keyboard shortcuts, aria-live
      regions, modal open/close, loading states, and mock/API wiring called out
      in the stub comment.
- [ ] Existing unit tests for the component/page still pass; add or update tests
      when behavior changes.
- [ ] No duplicate global shells or conflicting components are introduced.
- [ ] PR links the GitHub issue and includes visual QA evidence for UI changes.

### Currently stubbed components

#### Primary rebuild surfaces

These are the main contributor targets called out for Stellar Wave rebuilds:

| Component | Location | Notes |
| --- | --- | --- |
| `OfflineBanner` | `src/components/OfflineBanner.tsx` | Global connection-lost alert mounted in `App.tsx`. Functional baseline without a placeholder wrapper; use its assertive `aria-live` alert pattern when rebuilding related connection UX. |
| `ProfileSummaryCard` | `src/components/ProfileSummaryCard.tsx` | Store hydrate + `ProfileSettingsModal` wiring kept; rebuild glass-card profile summary. |
| `Pools` | `src/pages/Pools.tsx` | Mock pool data + loading spinner kept; rebuild pools transparency cards. |
| `RoundTimeline` | `src/components/RoundTimeline.tsx` | Round state machine + sr-only aria-live kept; rebuild Upcoming → Live → Resolving → Finished stepper. |
| `EndRoundModal` | `src/components/EndRoundModal.tsx` | Radix dialog wiring, win/loss copy, focus restore, and tests kept; rebuild celebration UI for dark terminal theme. |

#### Additional active stubs (earlier stubs still present)

| Component | Location | Notes |
| --- | --- | --- |
| `HowItWorks` | `src/components/HowItWorks.tsx` | Landing section landmark kept; rebuild 3-step glass-card grid. |
| `HudStatusRow` | `src/components/hud/HudStatusRow.tsx` | Round/wallet/stream/player data attributes kept; rebuild status chip row. |
| `TipCard` | `src/components/education/TipCard.tsx` | Daily tip card shell; rebuild education card UI. |

#### Previously stubbed — now rebuilt

The following were earlier Stellar Wave stubs but no longer import
`ContributorTaskPlaceholder` (rebuild complete):

| Component | Location |
| --- | --- |
| `RoundTimer` | `src/components/RoundTimer.tsx` |
| `RankProgressBar` | `src/components/RankProgressBar.tsx` |
| `ModeCards` | `src/components/ModeCards.tsx` |
| `NewsRibbon` | `src/components/NewsRibbon.tsx` |
| `LiveGameStatsPanel` | `src/components/LiveGameStatsPanel.tsx` |
| `GuideCard` | `src/components/education/GuideCard.tsx` |

### Freighter + Soroban environment variables

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
