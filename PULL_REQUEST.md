# Build Core Prediction Controls & Legend Mode Toggle in Dashboard

## Summary

Implements the central prediction area of the dashboard with UP/DOWN prediction buttons, stake input with Fill, and the "I am a legend" toggle that reveals an exact-price input with validation. All controls respect connection and round state (disabled when not connected or round inactive) and support an optional connecting/loading state. No backend or real data—UI and local state only; ready for future API/Socket.io integration.

**Labels:** `frontend` `ui` `interaction` `core-feature`

---

## Why

The prediction area is where users interact most. Adding UP/DOWN buttons, stake input, and the "I am a legend" toggle makes the layout a functional predictor and integrates with the existing sidebar chat.

---

## Changes

### New component

- **`src/components/PredictionControls.tsx`**  
  Core prediction UI: title "Guess price prediction", UP (blue) and DOWN (gray) buttons, stake number input + Fill button, "I am a legend" toggle. When the toggle is ON, an exact price input is shown with:
  - `step="0.0001"`, range **0.0001–10.0000**, max **4 decimal places**
  - Inline validation and error message (invalid number, out of range, too many decimals)
  - Placeholder `0.2297`; stake placeholder `Enter amount`
  - Optional `isConnecting` prop with "Connecting..." feedback
  - Buttons disabled when user is not connected, round is inactive, or connecting

### Refactor

- **`src/components/PredictionCard.tsx`**  
  Becomes a thin wrapper that renders the card layout and `<PredictionControls />`. Public API unchanged; adds optional `isConnecting` pass-through.

### Styles

- **`src/components/PredictionCard.css`**  
  UP button blue (`#2c4bfd`), DOWN button gray. Error state for exact price input and error message. Connecting state text. Existing slide-down animation kept for the exact-price section.

---

## Acceptance criteria

- [x] Title: "Guess price prediction" (or similar, matching design)
- [x] Big UP button (blue) / DOWN button (gray)
- [x] Stake input field (number) + "Fill" button
- [x] Toggle switch: "I am a legend"
- [x] When toggle is ON: exact price input (number, 4 decimal places, validation 0.0001–10)
- [x] Buttons disabled when user is not connected or round is inactive
- [x] Basic loading/feedback (e.g. "Connecting..." / disabled styling)
- [x] Layout fits within dashboard grid (left sidebar, center prediction, right placeholder)
- [x] New component: `src/components/PredictionControls.tsx`
- [x] React state for toggle + input values; validate exact price; error message when invalid
- [x] Reuse existing button/input styles from the project
- [x] No backend calls—UI + local state only
- [x] **Bonus:** Subtle animation on toggle (slide-down for exact price section)
- [x] **Bonus:** Placeholder text ("Enter amount", "0.2297")

---

## How to test

1. **Toggle & exact price**  
   Turn "I am a legend" ON → exact price section appears with animation. Turn OFF → it hides.

2. **Inputs**  
   Type in stake and (when legend is on) exact price. Fill button sets stake to a placeholder value.

3. **Validation**  
   In exact price: try empty, non-numeric, &lt; 0.0001, &gt; 10, or &gt; 4 decimals → error message and red border.

4. **Disabled states**  
   Use `PredictionCard` with `isWalletConnected={false}` or `isRoundActive={false}` → all controls disabled and message shown. With `isConnecting={true}` → "Connecting..." and disabled styling.

5. **Submit**  
   With valid stake (and valid exact price when legend is on), UP/DOWN submit and form resets after a short delay.

---

## Commits

| Commit    | Message |
|----------|---------|
| `7f78129` | feat: add PredictionControls with legend toggle and exact price validation |
| `b925686` | refactor: make PredictionCard a thin wrapper around PredictionControls |
| `3c741d1` | style: prediction controls — UP blue, DOWN gray, validation and connecting states |

---

## Screenshots / GIF (optional)

_Add a short GIF or screenshots showing:_

- _Toggle on/off → exact price input appears/disappears_
- _Typing in stake and exact price inputs_
- _Button disabled vs enabled states_
- _Validation error (e.g. invalid decimal or out-of-range)_

---

## Checklist

- [x] Code follows project patterns and reuses existing styles
- [x] No new backend or API calls; UI + local state only
- [x] Acceptance criteria met (including optional placeholders and animation)
- [ ] Screenshot or GIF added (recommended for review)
