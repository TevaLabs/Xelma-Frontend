# Freighter-less Contributor Fixture & Quick Demo Guide

This guide enables new contributors to spin up the **Xelma Frontend** application and demo the entire user experience — including wallet connection, market predictions, round lifecycles, transaction signing, and claiming rewards — in **under 15 minutes**, without installing the Freighter browser extension or running a live Soroban backend.

---

## ⚡ Quick-Start (Demo UI in <15 Minutes)

### Step 1: Install Dependencies & Run the Dev Server

```bash
git clone https://github.com/TevaLabs/Xelma-Frontend.git
cd Xelma-Frontend
pnpm install   # or npm install
pnpm dev       # boots Vite on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔌 Method 1: In-Browser Freighter Console Injection (Full Interactive Demo)

To test the complete wallet connection, claim UI, and bet placement workflow with simulated signing and responses, open your browser **DevTools Console** (F12 or `Cmd+Option+I`) on `http://localhost:5173` and paste this snippet:

```js
window.freighter = {
  isConnected: async () => ({ isConnected: true }),
  requestAccess: async () => ({
    address: 'GBHExampleAddressForTestingPurposesOnly1234567890ABCDE',
    error: null,
  }),
  getAddress: async () => ({
    address: 'GBHExampleAddressForTestingPurposesOnly1234567890ABCDE',
    error: null,
  }),
  getNetwork: async () => ({ network: 'TESTNET', error: null }),
  signMessage: async (msg) => ({
    signedMessage: 'mocked_signature_' + msg,
    error: null,
  }),
  signTransaction: async (xdr) => ({
    signedTxXdr: xdr,
    error: null,
  }),
};
console.log('✅ Freighter mock extension injected successfully!');
```

### Testing UI Workflows with the Console Snippet:

1. **Connect Wallet**: Click **Connect Wallet** in the navbar or on `/connect`. Choose **Freighter**. It will immediately authenticate and show a mock balance (`100.00 XLM`).
2. **Place Bets (Bet UI)**: Go to `/dashboard`. Click **Predict UP** or **Predict DOWN** (or enter a target price in Legend mode). The `BetModal` will open, estimate fee resources, and allow submitting a prediction without throwing extension-missing errors.
3. **Claim Rewards (Claim UI)**: Trigger or inspect `EndRoundModal` or click **Claim Rewards** in the header/leaderboard when active rounds finish.

---

## 👁️ Method 2: Watch-Only Address Mode (Zero-Code GUI Demo)

If you do not want to use DevTools, Xelma supports built-in **Watch-Only Mode**:

1. Click **Connect Wallet** in the header or navigate to `/connect`.
2. Scroll to the **Watch-Only / Address Lookup** section.
3. Enter any standard Stellar G-address (e.g. `GBHExampleAddressForTestingPurposesOnly1234567890ABCDE`).
4. Click **View Address**.
5. The application connects in read-only mode, showing live/mock balances and positions on the Dashboard without requiring wallet signing capabilities.

---

## 🧪 Method 3: Ladle Component Workbench (`pnpm storybook`)

For visual development of individual components in isolation without loading the full router or backend:

```bash
pnpm storybook
```

- Opens the Ladle workbench on `http://localhost:61000`.
- Browse isolated component stories for `BetModal`, `EndRoundModal`, `WalletConnect`, `PredictionCard`, `StatsCard`, and more.
- Test different component props, modal states, loading spinners, and error alerts independently.

---

## 🎭 Method 4: Headed Playwright E2E Interactive Mode

Run Playwright in interactive UI or headed browser mode. Playwright automatically injects the Freighter stub (`mockFreighter`) and intercepts network requests with MSW:

```bash
# Launch Playwright Interactive UI Mode
pnpm test:e2e:ui

# Or run tests in a visible browser window
pnpm test:e2e:headed
```

---

## 📡 Method 5: Using Mock Socket Fixtures for Local Live Events

When developing components dependent on real-time price changes or round transitions:

- Mock payloads live in [`src/test/msw-socket-fixtures.ts`](file:///Users/apple/Documents/GitHub/Xelma-Frontend/src/test/msw-socket-fixtures.ts).
- Pre-defined fixtures exist for price streams (`mockSocketFixtures.price`), round state changes (`round:started`, `round:resolved`), live game statistics, and room chat.
- Import `mockSocketFixtures` into unit tests or local MSW handlers to test real-time UI reactions.

---

## 🚀 Finding Work & Contributing

Ready to tackle a frontend task or rebuild a UI surface? Explore the open GitHub issues:

- 📋 [Open Frontend Issues](https://github.com/TevaLabs/Xelma-Frontend/issues?q=is%3Aissue+is%3Aopen)
- ✨ [Open Enhancement Issues](https://github.com/TevaLabs/Xelma-Frontend/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)
- 🌊 [Stellar Wave Rebuild Issues](https://github.com/TevaLabs/Xelma-Frontend/issues?q=is%3Aissue+is%3Aopen+label%3A%22Stellar+Wave%22)

For guidelines on claiming stubbed components (`ContributorTaskPlaceholder`) and submitting PRs, see [`CONTRIBUTING.md`](file:///Users/apple/Documents/GitHub/Xelma-Frontend/CONTRIBUTING.md).
