# Add EmptyState Illustration Variant Tests

## Summary

This PR implements comprehensive unit tests for the `EmptyState` component at `src/components/EmptyState.tsx`, addressing the Stellar Wave contributor issue to test "Title/description/action slot roles".

## Changes

### New File
- **`src/components/EmptyState.test.tsx`** — 29 unit tests covering all props and slot combinations

## Test Coverage

### Default State (2 tests)
- Renders empty container when no props provided
- Applies default centering and padding classes (`flex`, `flex-col`, `items-center`, `justify-center`, `p-8`)

### Title Slot (3 tests)
- Renders title as `<h3>` with semantic heading role (level 3) and proper styling classes
- Does not render heading when title is empty string
- Does not render heading when title is undefined

### Description Slot (3 tests)
- Renders description as `<p>` with muted text styling (`text-sm`, `text-gray-500`, `mb-4`)
- Does not render paragraph when description is empty string
- Does not render paragraph when description is undefined

### Icon Slot (4 tests)
- Renders custom icon when provided (accepts any ReactNode: SVG, component, etc.)
- Renders icon in a wrapper div with `mb-4` margin
- Does not render icon wrapper when icon is not provided
- Accepts any ReactNode as icon (SVG, component, etc.)

### Action Slot (4 tests)
- Renders action button when provided (accessible via role="button")
- Renders action as the last child in the flex column
- Does not render anything when action is not provided
- Accepts any ReactNode as action (Link, Button, etc.)

### Combined Slots (4 tests)
- Renders title, description, and action in correct order (h3 → p → action)
- Renders icon, title, description, action in correct order (icon wrapper → h3 → p → action)
- Renders only title and action when description is omitted
- Renders only icon and title when description and action omitted

### className Prop (2 tests)
- Applies custom className to root container
- Combines custom className with default classes

### Accessibility (3 tests)
- Provides proper heading hierarchy with h3 for title
- Does not create empty heading elements
- Action button is accessible when provided (supports aria-label)

### Real-World Usage Patterns (4 tests)
- **ChatSidebar pattern**: icon + title + description + custom className
- **Pools.tsx error pattern**: title + description + action (retry button)
- **Pools.tsx empty pattern**: title + description only
- **Dashboard.tsx pattern**: title + description + icon + action (refresh button)

## Verification

```bash
# All checks pass
pnpm lint                    # ✅ ESLint flat config
pnpm build                   # ✅ TypeScript + Vite production build
pnpm test:unit               # ✅ 1,070 tests pass (29 new)
pnpm test                    # ✅ Full CI gate (lint + build + tests)
```

## Related

- Issue: Stellar Wave contributor issue #780 — "EmptyState reused widely. Title/description/action slot roles."
- File tested: `src/components/EmptyState.tsx`
- Test file: `src/components/EmptyState.test.tsx`

## Checklist

- [x] Implements described behavior (tests for all slot roles)
- [x] Tests added for all props: title, description, icon, action, className
- [x] Tests cover real-world usage patterns from ChatSidebar, Pools, Dashboard
- [x] Accessibility tests for heading hierarchy and button roles
- [x] `pnpm lint` passes for touched files
- [x] `pnpm test` passes (full CI gate)
- [x] Follows existing test patterns in the codebase (similar to StatusStates.test.tsx)
- [x] No breaking changes to production code