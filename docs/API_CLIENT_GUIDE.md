# API client maintainer guide

This project intentionally keeps the HTTP stack layered so a new endpoint does not accidentally leak transport details into UI state or component logic.

## Layering: `api.ts` → `api-client.ts` → stores

The dependency direction is:

1. `src/lib/api.ts`
   - owns the raw `fetch` helper
   - adds the JWT from auth state
   - normalizes server errors and timeout handling
   - handles session expiry / 401 / 403 behavior
   - is the only place that touches REST transport details

2. `src/lib/api-client.ts`
   - owns endpoint names and request/response contracts
   - normalizes backend payload variants into stable frontend types
   - validates payloads before returning them to stores
   - exposes typed helpers such as `roundsApi`, `predictionsApi`, `notificationsApi`, `priceApi`, `leaderboardApi`, and `statsApi`

3. `src/store/*.ts`
   - orchestrates stateful UI flows
   - calls the typed endpoint clients
   - caches or derives store state from returned data
   - is the layer that components consume through selectors

4. Components / pages
   - render UI and trigger store actions
   - should not call `fetch` directly
   - should not know the raw backend payload shape unless a specific UI contract requires it

## Endpoint ownership

| Domain | Endpoint owner | Typical path pattern | Where it is used |
| --- | --- | --- | --- |
| Education | `educationApi` | `/api/education/*` | Learn page / guide UI |
| Rounds | `roundsApi` | `/api/rounds/*` | Active round state and round lifecycle |
| Predictions | `predictionsApi` | `/api/predictions/*` | user history, submit prediction |
| Notifications | `notificationsApi` | `/api/notifications/*` | notification bell + panel |
| Price feed | `priceApi` | `/api/price` | charting / price widgets |
| Leaderboard | `leaderboardApi` | `/api/leaderboard*` | ranking cards and leaderboard pages |
| Stats | `statsApi` | `/api/stats*` | landing page / summary cards |
| Auth | `api.ts` + auth store | all authenticated REST requests | authentication, JWT refresh / logout flow |
| SSE | `useRoundStore.ts` | `/api/rounds/events` | live round updates via `EventSource` |
| Socket.IO | `src/lib/socket.ts` | long-lived socket stream | chat, notifications, realtime UI events |

## Exceptions to the normal rule

### Auth is a transport concern, not an endpoint concern

Authentication is a cross-cutting concern and lives in `src/lib/api.ts` instead of the individual endpoint modules.

That is intentional because every request may need the JWT, and every 401/403 should trigger the same user-facing session expiry behavior.

Keep auth logic centralized there. `api-client.ts` should be focused on endpoint contracts, not on session management.

### SSE is not REST

Round updates are streamed with `EventSource` in `src/store/useRoundStore.ts`, not via the fetch-based API client. This is because SSE is a long-lived stream, not a one-shot HTTP request.

Do not add SSE logic to `api-client.ts` or call `apiFetch` for it. The store owns the subscription lifecycle and reconnection behavior.

### Socket.IO is a separate realtime layer

The socket service in `src/lib/socket.ts` owns the long-lived Socket.IO connection and event payload mapping. It is not part of the typed REST client layer.

The rule is simple: REST is `api.ts` + `api-client.ts`; push-based realtime is `socket.ts` or `EventSource`-based stores.

## How to add an endpoint without breaking type safety

1. Start in `src/lib/api-client.ts`
   - add the new domain object, such as `ordersApi`, `walletApi`, or `profileApi`
   - name the endpoint method clearly, e.g. `getCurrent`, `submit`, `list`, `refresh`

2. Keep the request shape explicit
   - use a request type for POST/PUT bodies
   - avoid anonymous inline payloads when they are reused

3. Normalize the backend response before returning it
   - tolerate backend variants like `{ data: [...] }`, `{ items: [...] }`, or `{ result: {...} }`
   - convert all values into the stable frontend type the UI expects
   - keep the normalization close to the endpoint owner so the store does not have to interpret raw server fields

4. Validate when the payload is not fully trustworthy
   - use the existing schema validation pattern for endpoints with dynamic or untrusted payloads
   - fail loudly with a clear user-facing error instead of letting invalid data flow into the store

5. Expose only the typed result to stores
   - stores should call the API helper and receive a frontend contract, not `unknown` or raw JSON
   - components should consume store state, not raw API response data

6. Add a store method if state needs to persist or derive UI data
   - the store should decide whether a response becomes `activeRound`, `notifications`, `leaderboard`, etc.
   - avoid putting data-mapping logic in components

7. Keep transport concerns in `api.ts`
   - authorization headers, retry logic, timeout handling, aborts, and session expiry belong there
   - endpoint modules should not duplicate client-side fetch plumbing

## Review checklist

When reviewing a new API addition, check the following:

- Is the endpoint grouped under the correct domain object in `src/lib/api-client.ts`?
- Does the raw `fetch` logic remain in `src/lib/api.ts` and not leak into the store?
- Is the backend response normalized into a stable typed shape?
- Is the store the only place that tracks UI state transitions?
- Are SSE / Socket.IO endpoints excluded from the REST client contract?

## Rule of thumb

If an endpoint is a normal HTTP call, it belongs in `api-client.ts`.
If it is auth/session-cross-cutting, it belongs in `api.ts`.
If it is a stream or a long-lived realtime channel, it belongs in the SSE/socket layer, not the REST client.
