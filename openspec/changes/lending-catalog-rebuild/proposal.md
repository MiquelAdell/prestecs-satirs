## Why

Phase B of the lending redesign roadmap (see archived `plan-lending-redesign`,
Phase A shipped in PR #37). This change makes the four "ADDED Requirements"
of the `lending-catalog-redesign` capability spec real — the catalog browsing
experience is rebuilt on top of the Phase A primitives and tokens. It also
satisfies the fifth requirement of that spec by exposing the catalog at the
public path `/ludoteca` in a guest-mode variant, replacing the
PythonAnywhere-rendered legacy `Ludoteca` page with the same React component
as `/prestamos`, just without member affordances.

This is a **visual + interaction rebuild** of three screens (catalog,
game-card, game-detail) plus a routing addition. The borrow-with-return-date
work and `MyLoansPage` rebuild are deliberately scoped to the next change
(`lending-borrow-with-return-date`) — Phase B keeps the existing
`POST /loans` and `PATCH /loans/{id}/return` semantics untouched.

## What Changes

- **Add `@radix-ui/react-slider`** as a dependency. Used to back a new
  accessible dual-handle player-range slider primitive.
- **New primitive** `frontend/src/ui/RangeSlider/` wrapping
  `@radix-ui/react-slider` with the project's tokens, project-style CSS
  modules, label rendering, and value-formatter prop. Tests cover keyboard
  control (arrow keys, Home/End) and ARIA attributes.
- **Rewrite `frontend/src/components/GameCard.tsx`** as a cover-first card:
  the cover image is the dominant visual element with an availability badge
  overlaid top-left and a BGG rating badge top-right; title, year, players,
  and play time render below. Built on the Phase A `Card`, `Badge`, and
  `Button` primitives. Adds a `mode: "member" | "public"` prop — `public`
  hides borrow/return CTAs.
- **Rewrite `frontend/src/pages/CatalogPage.tsx`** to a side-panel layout at
  `≥ 1024 px` (fixed left filter column + grid to its right) and a
  bottom-sheet drawer below `1024 px` (Phase A `Dialog` styled as a sheet).
  Adds an active-filter chip row above the grid using the Phase A `Chip`
  primitive — each non-default filter value renders as a removable chip.
  Replaces the dual `<input type="range">` pair with the new `RangeSlider`
  primitive. Sort uses the existing custom dropdown reskinned with the
  `Button` primitive. Adds a `mode: "member" | "public"` prop forwarded to
  every `GameCard`. Card grid: `auto-fit` `minmax(240px, 1fr)`, gap
  `var(--space-md)`.
- **Rewrite `frontend/src/pages/GameDetailPage.tsx`** with a two-column hero
  (cover left, info right on desktop; stacked on mobile), a prominent
  primary `Button` Borrow CTA above the fold for available games, a
  non-actionable "Prestado" status indicator for currently-lent games, and a
  "Iniciar sesión" link for guests. Built on the `Card` primitive. Loan
  history kept as-is (existing `LoanHistoryEntry` component) inside a
  styled section block.
- **Add the public read-only catalog at `/ludoteca`**:
  - **Frontend**: `App.tsx` detects the URL mount at startup (`/ludoteca`
    vs `/prestamos`), switches React Router `basename` accordingly, and
    renders only the catalog route in `mode="public"` for the public mount.
    The full member router (catalog, game detail, my-loans, login,
    forgot/set-password, admin) continues to render at `/prestamos`.
  - **Caddy**: add a `handle_path /ludoteca/*` rule that proxies to the
    backend container the same way `/prestamos/*` does, and exclude
    `/ludoteca/*` from the trailing-slash canonicalization rule so the SPA
    owns its sub-routes (mirrors the existing `/prestamos/*` exclusion).
  - **Vite dev server**: add a tiny dev-only middleware so navigating to
    `http://localhost:5173/ludoteca/` returns the SPA's `index.html` and
    asset URLs (which Vite emits with the existing `base: "/prestamos/"`)
    continue to resolve. Production-equivalent behavior under Caddy.
  - **Backend**: zero changes. The existing catch-all `serve_spa` already
    returns `index.html` for any unknown path the backend receives.

## Capabilities

### New Capabilities

(none — this change implements the existing `lending-catalog-redesign`
capability)

### Modified Capabilities

- `lending-catalog-redesign`: Replace placeholder Purpose with a real one;
  ADD requirements pinning Phase B implementation choices (Radix-backed
  slider, side-panel breakpoint, chip-row contract, dev-server
  routing). The pre-existing five requirements are not modified — they
  remain the contract this change satisfies in code.

## Impact

- **Frontend**: `frontend/src/components/GameCard.tsx` and `.css` rewritten;
  `frontend/src/pages/CatalogPage.tsx` and `.css` rewritten;
  `frontend/src/pages/GameDetailPage.tsx` and `.css` rewritten; new
  `frontend/src/ui/RangeSlider/` primitive; new
  `frontend/src/components/ActiveFilterChips.tsx` extracted helper;
  `App.tsx` updated for dual-mount routing; `vite.config.ts` gains a
  dev-only middleware to serve the SPA at `/ludoteca/*`. Public guest mode
  adds a `mode: "member" | "public"` prop threaded `App → CatalogPage →
  GameCard` and used by `GameDetailPage`.
- **Dependencies**: **Add** `@radix-ui/react-slider`. No removals.
- **Backend**: zero changes. No new routes, no new use cases, no migrations.
- **Caddy**: `Caddyfile` gains a `handle_path /ludoteca/*` block and the
  `@needs_trailing_slash` matcher gains a `not path /ludoteca/*` clause.
- **Tests**: Vitest unit tests added for `RangeSlider`, the rewritten
  `GameCard` (member + public variants), `ActiveFilterChips`, the rewritten
  `CatalogPage` (filter chip lifecycle, sort, slider integration, public
  mode hiding borrow buttons), and the rewritten `GameDetailPage` (CTA
  visibility by status × auth × mode). No backend tests change.
- **E2E**: skipped this round per the plan; browser smoke test via Chrome
  DevTools MCP covers the new layouts and routes manually.
- **Bundle size**: net `+~12 KB` for `@radix-ui/react-slider` (gzip).
  Acceptable.
- **Rollback**: revert the merge commit on `development`. No data state
  involved. The `/ludoteca` Caddy route can be removed independently if a
  partial revert is needed.
