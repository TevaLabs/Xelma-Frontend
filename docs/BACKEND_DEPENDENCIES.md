# Backend Dependency Matrix for Frontend Features

This document provides a single source of truth detailing the backend endpoints, WebSockets, Soroban RPC services, and external APIs required by each core frontend feature in **Xelma**.

Contributors can use this matrix to understand:
- What backend endpoints/events each feature requires
- Whether a feature works without a backend (fully static, mock-seeded, or partially degraded)
- What mocks, stubs, and fixtures are available to develop offline or without a running backend

---

## 📊 Feature Dependency Matrix

| Feature Area | Route & Primary Source Files | Required Backend Endpoint(s) / Event(s) / Services | Works Without Backend? | Mock & Stub Availability Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Landing** | Route: `/`<br>[`src/pages/Landing.tsx`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/src/pages/Landing.tsx)<br>[`src/hooks/useNetworkStats.ts`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/src/hooks/useNetworkStats.ts) | • `GET /api/stats/network` (via `statsApi.getNetworkStats()`) | **Partially (Mock Fallback)**<br>Renders immediately with fallback metrics. Shows an amber "Cached metrics" status pill if API fails. | Seeded with static fallback data [`mockLandingStats`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/src/data/mockData.ts#L195-L199) in `src/data/mockData.ts`. |
| **Dashboard** | Route: `/dashboard`<br>[`src/pages/Dashboard.tsx`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/src/pages/Dashboard.tsx)<br>[`src/store/useRoundStore.ts`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/src/store/useRoundStore.ts)<br>[`src/components/PriceChart.tsx`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/src/components/PriceChart.tsx) | • `GET /api/education/tip` (`educationApi.getTip()`)<br>• `GET /api/stats` (`statsApi.getUserStats()`)<br>• `GET /api/predictions/user/:userId` (`predictionsApi.getUserHistory()`)<br>• `POST /api/predictions/submit` (`predictionsApi.submit()`)<br>• `GET /api/rounds/active` (`roundsApi.getActive()`)<br>• `GET /api/price` (`priceApi.getPriceSeries()`)<br>• **Socket.IO / SSE**: `price`, `round:started`, `round:resolved`, `chat:message`<br>• **Soroban RPC**: JSON-RPC calls via `VITE_STELLAR_RPC_URL` | **Partially (Mock Fallback)**<br>Full prediction terminal experience works using mock datasets, generated chart price walks, and local prediction simulations if backend or sockets are offline. | • Mock datasets: `mockRounds`, `mockPriceData`, `mockUserStats`, `mockRecentActivity` in [`src/data/mockData.ts`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/src/data/mockData.ts).<br>• Socket event fixtures in [`src/test/msw-socket-fixtures.ts`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/src/test/msw-socket-fixtures.ts).<br>• In-browser console injection in [`docs/freighter-less-fixtures.md`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/docs/freighter-less-fixtures.md). |
| **Play Page (Deprecated)** | Route: `/play`<br>[`src/App.tsx#L53`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/src/App.tsx#L53) | • **None** (Permanently redirects to `/dashboard`) | **Fully Static (100% Works)**<br>Redirects to `/dashboard` via `react-router-dom` `<Navigate to="/dashboard" replace />`. | Not applicable. Former `LegacyDashboard` has been consolidated into `/dashboard`. |
| **Leaderboard** | Route: `/leaderboard`<br>[`src/components/Leaderboard.tsx`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/src/components/Leaderboard.tsx) | • `GET /api/leaderboard?mode=UP_DOWN` (`leaderboardApi.getLeaderboard()`) | **Requires Backend**<br>Displays loading state and then error card with retry button if backend is offline. Does not fall back to hardcoded mock rankings in production. | • Schema validation: `LeaderboardEntrySchema` in [`src/lib/api-schemas.ts`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/src/lib/api-schemas.ts).<br>• Interceptable by MSW in unit/integration tests. |
| **Learn** | Route: `/learn`<br>[`src/pages/Learn.tsx`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/src/pages/Learn.tsx) | • `GET /api/education/guides` (`educationApi.getGuides()`)<br>• `GET /api/education/tip` (`educationApi.getTip()`) | **Partially (Degrades Gracefully)**<br>Uses `Promise.allSettled` so guides or daily tips render independently. Displays empty state cards if backend returns empty lists. | • Types defined in [`src/types/education.ts`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/src/types/education.ts).<br>• Interceptable by MSW in unit/integration tests. |
| **Wallet Auth** | Route: `/connect`<br>Modal: `WalletModal.tsx`<br>[`src/pages/Connect.tsx`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/src/pages/Connect.tsx)<br>[`src/store/useWalletStore.ts`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/src/store/useWalletStore.ts) | • `POST /api/auth/challenge`<br>• `POST /api/auth/connect`<br>• **Stellar Horizon RPC**: `GET ${HORIZON_URL}/accounts/${address}` (native XLM balance)<br>• **Stellar Friendbot**: `POST https://friendbot.stellar.org?addr=${address}` (testnet faucet)<br>• **Freighter SDK**: `@stellar/freighter-api` | **Partially (Watch-Only & Stub Fallback)**<br>• **Watch-Only Mode**: Look up any valid Stellar G-address balance and positions with zero backend auth or extension.<br>• **Auth Graceful Fallback**: If backend auth fails, wallet state connects with error code `AUTH_FAILED`. | • Console injection snippet: [`docs/freighter-less-fixtures.md`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/docs/freighter-less-fixtures.md).<br>• Playwright fixture `mockFreighter`: [`e2e/wallet-connect.spec.ts`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/e2e/wallet-connect.spec.ts). |

---

## 🛠️ Developing & Testing Without a Live Backend

Contributors building or refining UI components do **not** need a running backend service. Xelma provides multiple mock methods:

### 1. In-Browser Console Injection (Full UI Demo < 15 Mins)
Paste the `window.freighter` mock snippet into your browser DevTools console on `http://localhost:5173`.
See full instructions in [`docs/freighter-less-fixtures.md`](./freighter-less-fixtures.md).

### 2. Built-in Watch-Only Mode
Navigate to `/connect`, click **Watch-only: view an address without signing**, enter any valid Stellar G-address (e.g. `GBHExampleAddressForTestingPurposesOnly1234567890ABCDE`), and click **View in Watch-Only Mode**.

### 3. Ladle Component Workbench
Run component stories in visual isolation without loading router or network layers:
```bash
pnpm storybook
```

### 4. Socket & API Fixtures for Unit/E2E Tests
- Mock socket payloads and fixtures live in [`src/test/msw-socket-fixtures.ts`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/src/test/msw-socket-fixtures.ts).
- Playwright E2E tests automatically stub Freighter via `mockFreighter` in [`e2e/wallet-connect.spec.ts`](file:///c:/Users/Administrator/Desktop/Xelma-Frontend/e2e/wallet-connect.spec.ts).
