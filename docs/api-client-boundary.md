# API client boundary notes

This document is the maintainer guide for the typed REST boundary in
`src/lib/api-client.ts`. It explains which endpoints the client owns, which
Zustand stores consume them, and how to extend the API without breaking
existing types.

> **Related files**
>
> | File | Role |
> | --- | --- |
> | [`src/lib/api.ts`](../src/lib/api.ts) | Transport layer — `apiFetch`, auth headers, error normalization |
> | [`src/lib/api-client.ts`](../src/lib/api-client.ts) | Typed domain modules (this boundary) |
> | [`src/lib/api-schemas.ts`](../src/lib/api-schemas.ts) | Zod runtime validators for critical responses |
> | [`src/lib/profileApi.ts`](../src/lib/profileApi.ts) | Profile REST calls (intentionally outside `api-client`) |
> | Backend OpenAPI spec | Canonical contract — [Xelma-Backend](https://github.com/TevaLabs/Xelma-Backend) |

---

## Layer model

```
Components / pages / hooks
        │
        ├──► Zustand stores (cache + orchestration)
        │         │
        │         └──► api-client modules
        │
        └──► api-client modules (direct calls)
                  │
                  └──► apiFetch (src/lib/api.ts)
                            │
                            └──► Backend REST (/api/…)
```

**Rule of thumb:** every new REST endpoint should go through `api-client.ts`
unless there is a documented exception (auth handshake, SSE streams, or legacy
modules awaiting migration). Stores should never call `apiFetch` or raw
`fetch('/api/…')` for endpoints that belong in the client boundary.

Realtime traffic (Socket.IO, SSE) lives outside `api-client` by design — see
[Endpoints outside `api-client`](#endpoints-outside-api-client).

---

## What `api-client` owns

Each exported `*Api` object maps to one backend resource group. Types are
co-located with the module; Zod validation is applied where response shape
drift would corrupt UI state.

| Module | Method | HTTP | Validated (Zod) | Primary consumers |
| --- | --- | --- | --- | --- |
| `educationApi` | `getGuides` | `GET /api/education/guides` | No | `Learn.tsx` |
| | `getTip` | `GET /api/education/tip` | No | `Learn.tsx`, `Dashboard.tsx` |
| `roundsApi` | `getActive` | `GET /api/rounds/active` | Yes (`RoundSchema`) | `useRoundStore` |
| `predictionsApi` | `getUserHistory` | `GET /api/predictions/user/:userId` | Yes (`UserPredictionSchema`) | `PredictionHistory`, `Dashboard` |
| | `submit` | `POST /api/predictions/submit` | No | `BetModal`, `Dashboard` |
| `notificationsApi` | `getUnreadCount` | `GET /api/notifications/unread-count` | No | `useNotificationsStore` |
| | `getNotifications` | `GET /api/notifications` | No | `useNotificationsStore` |
| | `markAsRead` | `POST /api/notifications/:id/read` | No | `useNotificationsStore` |
| | `markAllAsRead` | `POST /api/notifications/read-all` | No | `useNotificationsStore` |
| `priceApi` | `getPriceSeries` | `GET /api/price` | No (normalizer) | `PriceChart` |
| `leaderboardApi` | `getLeaderboard` | `GET /api/leaderboard?mode=` | Yes (`LeaderboardEntrySchema`) | `Leaderboard` |
| `statsApi` | `getNetworkStats` | `GET /api/stats/network` | No (normalizer) | `useNetworkStats`, `Dashboard` |
| | `getUserStats` | `GET /api/stats` | No (normalizer) | `Dashboard` |

### Normalizers vs validators

Some modules tolerate flexible backend key names and wrap payloads into strict
frontend types:

- **`normalizeNetworkStats` / `normalizeUserStats`** — accept alternate field
  names (`roundsResolved`, `practiceVolume`, …) and return `null` when no
  usable numeric field is present (callers fall back to mock/empty UI).
- **`normalizePriceResponse` / `normalizeArrayResponse`** — unwrap `{ data: [] }`
  wrappers or single-point payloads before sorting/filtering.
- **`validateApiResponse`** — hard-fail on schema mismatch; used for rounds,
  predictions, and leaderboard where bad data would break betting UX.

Export normalizers from `api-client.ts` when tests or hooks need the same
logic without hitting the network (see `src/lib/__tests__/network-stats.test.ts`).

---

## What stores own (vs `api-client`)

Stores hold client-side state and lifecycle; they delegate HTTP to
`api-client` (or documented exceptions).

| Store | REST via `api-client` | Store-owned transport |
| --- | --- | --- |
| `useRoundStore` | `roundsApi.getActive` | SSE `GET /api/rounds/events` (EventSource in store) |
| `useNotificationsStore` | All `notificationsApi.*` | Realtime merge via Socket.IO `notification` events |
| `useProfileStore` | — | `profileApi.ts` (`GET/PATCH /api/user/profile`) |
| `useWalletStore` | — | Auth handshake (`POST /api/auth/challenge`, `POST /api/auth/connect`) |
| `useAuthStore` | — | JWT persistence only (no HTTP) |

When adding a feature:

1. Put the typed REST call in `api-client.ts`.
2. If the feature needs cached/shared state, add a store method that calls the
   new `*Api` method — do not duplicate fetch logic in the store.
3. If the feature is push/streaming, keep the stream in the store or
   `socket.ts`, but keep REST reads/writes in `api-client`.

---

## Endpoints outside `api-client`

These are intentional exceptions. Migrate them into `api-client` when touching
the surrounding code, but do not block new work on a full migration.

| Location | Endpoint | Why outside |
| --- | --- | --- |
| `useWalletStore.ts` | `POST /api/auth/challenge`, `POST /api/auth/connect` | Wallet-signed challenge flow; uses raw `fetch` + Freighter |
| `profileApi.ts` | `GET/PATCH /api/user/profile` | Legacy module; typed but not yet folded into `api-client` |
| `useRoundStore.ts` | `GET /api/rounds/events` (SSE) | EventSource lifecycle tied to store reconnect logic |
| `ChatSidebar.tsx` | `GET /api/chat/history` | Direct fetch; chat also uses Socket.IO |
| `socket.ts` | Socket.IO namespace | Realtime events, not REST |

The backend OpenAPI spec remains the source of truth for path and payload
contracts across all of the above.

---

## Type safety boundaries

### Compile time (TypeScript)

- Request/response interfaces live next to their `*Api` module in
  `api-client.ts` (e.g. `Round`, `SubmitPredictionRequest`, `NetworkStats`).
- Shared domain types used by both client and UI may live under `src/types/`
  (e.g. `Guide`, `NotificationItem`).
- Prefer **narrow exported types** over `unknown` or overly wide index
  signatures when adding fields consumers rely on.

### Runtime (Zod)

Schemas in `api-schemas.ts` guard endpoints where invalid payloads would cause
silent corruption:

| Schema | Used by |
| --- | --- |
| `RoundSchema` | `roundsApi.getActive` |
| `UserPredictionSchema` | `predictionsApi.getUserHistory` |
| `LeaderboardEntrySchema` | `leaderboardApi.getLeaderboard` |

Schemas use `.passthrough()` so new backend fields do not break validation.
**Do not remove or tighten required fields** without coordinating a backend
migration — that breaks production clients.

### Error surface

- Transport errors: `ApiError` from `api.ts` (status, code, `retryAfterSeconds`).
- Validation errors: `ApiValidationError` from `api-schemas.ts` — caught inside
  `api-client` methods and rethrown as user-safe `Error` messages.

---

## Safely extending the API

### Adding a new REST endpoint

1. **Check the backend OpenAPI spec** (or backend route file) for the canonical
   path, method, and payload shape.
2. **Add or extend a type** in `api-client.ts` (or `src/types/` if shared).
3. **Add a method** on the appropriate `*Api` object using `apiFetch<T>`.
4. **Add Zod validation** if the response drives betting, balances, or lists
   that assume a stable shape. Skip Zod for simple CRUD or admin-only reads.
5. **Add a normalizer** if the backend wraps arrays (`{ data: [...] }`) or uses
   alternate key names — follow `normalizeArrayResponse` / `normalizeNetworkStats`.
6. **Wire consumers** via a store or component; mock `*Api` in Vitest, not
   `apiFetch` directly.
7. **Export the type** if components need it — import types from `api-client`,
   not duplicate interfaces in components.

### Changing an existing endpoint

- **Additive changes** (new optional fields): safe — passthrough schemas and
  optional TS properties absorb them.
- **Renamed fields**: update the normalizer first, keep accepting old keys for
  one release if the backend is rolling out gradually.
- **Breaking changes** (removed fields, type changes): coordinate with backend;
  update Zod schema, types, normalizers, and MSW handlers in the same PR.

### Testing checklist (minimal)

- Unit-test normalizers and Zod schemas (`api-schemas.test.ts`,
  `network-stats.test.ts`).
- Mock the `*Api` module in component/store tests (`vi.mock('../lib/api-client')`).
- Do not assert on raw `fetch` URLs in feature tests unless testing an
  documented exception (auth, SSE).

---

## OpenAPI & stub generation (future)

The frontend does not yet codegen clients from OpenAPI. When the backend
publishes a stable spec, use this workflow:

### Recommended toolchain (optional)

```bash
# Example — not wired into CI today; run manually when backend spec changes.
npx openapi-typescript https://<backend-host>/openapi.json -o src/lib/generated/api.d.ts
```

Or, for MSW fixtures from the same spec:

```bash
npx openapi-msw https://<backend-host>/openapi.json -o src/mocks/generated/handlers.ts
```

### Integration guidelines

1. **Generated types are read-only** — check `src/lib/generated/` into git only
   if the team agrees; otherwise regenerate in CI from a pinned spec URL.
2. **Do not replace `api-client` wholesale** — map generated paths to the
   existing `*Api` modules so stores and tests keep stable import paths.
3. **Keep Zod for runtime checks** — OpenAPI/TypeScript types are erased at
   runtime; retain validators on high-risk endpoints unless the backend
   guarantees schema versioning.
4. **Stub new endpoints before backend lands** — add the method + type +
   MSW handler; mark with `@experimental` in JSDoc until the route is live.

### Stub template

```typescript
// api-client.ts — pattern for a not-yet-live backend route
/** @experimental Backend route tracked in TevaLabs/Xelma-Backend#<issue> */
export const poolsApi = {
  list: () => apiFetch<PoolSummary[]>('/api/pools'),
};
```

Add a matching MSW handler in test setup so UI work can proceed in parallel.

---

## Quick reference: import paths

```typescript
// Preferred — typed domain API
import { roundsApi, type Round } from '../lib/api-client';

// Transport / errors (rare outside api-client and stores)
import { apiFetch, ApiError, normalizeApiError } from '../lib/api';

// Runtime validators (only when adding schemas)
import { RoundSchema, validateApiResponse } from '../lib/api-schemas';
```

---

## See also

- [README — Backend dependency matrix](../README.md#6-backend-dependency-matrix)
- [README — Education endpoints](../README.md#education--learn-page)
- Issue [#455 — Add typed OpenAPI boundary notes](https://github.com/TevaLabs/Xelma-Frontend/issues/455)
