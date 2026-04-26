## Context

Phase A (PR #37) shipped the design tokens, self-hosted Oswald + Open Sans,
and seven UI primitives under `frontend/src/ui/` (`Button`, `Input`,
`Select`, `Chip`, `Badge`, `Card`, `Dialog`). The lending app at
`/prestamos` still renders the *old* `CatalogPage`, `GameCard`, and
`GameDetailPage`, which were styled with the previous Tailwind-blue palette
and are now visually inconsistent with the brand-aligned primitives. The
`Card` and `Badge` primitives in particular are unused outside their own
unit tests because nothing else has been migrated yet.

Phase B is the first **feature-level** rebuild on top of the Phase A
foundation. It targets the catalog browsing surface — where members spend
the bulk of their time — and brings it visually and interactively in line
with the TFM design (Ariadna Ortega Rams, UOC 2024) tuned to the club's
existing typography and color (`#BE0000`, Oswald, Open Sans).

Working files referenced:

- `tasks/lending-redesign/style-guide.md` — sections 5.5 "Search + filter
  region", 5.6 "Game card grid cell", 5.8 "Game detail page", 5.13
  "Category pills", 5.14 "Date picker".
- `tasks/lending-redesign/mockups/` — `01-catalog-home-052.png`,
  `02-game-cards-states-049.png`, `03-game-detail-states-048.png`,
  `08-game-detail-history-and-popular-filters-064.png` (these are PDF page
  excerpts; the live Figma proto is the higher-fidelity reference).
- `tasks/lending-redesign/decisions.md` — running decision log.
- Figma proto: `https://www.figma.com/proto/75YAWEkSnwNWAbB0jJARnZ/TFM---Servei-de-pr%C3%A9stec-digital?page-id=810%3A21946&node-id=810-21986&starting-point-node-id=810%3A21986&show-proto-sidebar=1`.

## Goals / Non-Goals

**Goals:**

- Make the cover image the dominant visual element on every catalog card,
  with availability and rating presented as overlay badges (per the TFM and
  the spec's "Cover-first GameCard" requirement).
- Move the filter UI into a side panel on desktop and a bottom-sheet drawer
  on mobile, with active filters surfaced as removable chips in a row above
  the grid (per "Catalog filters as side panel + chip row").
- Replace the home-rolled dual `<input type="range">` slider with an
  accessible primitive backed by `@radix-ui/react-slider`, fulfilling the
  "Accessible player-range slider" requirement (keyboard control, valid
  ARIA value attributes).
- Promote the Borrow action on `GameDetailPage` to a prominent primary
  button above the fold, with state-driven variants for available, lent,
  and guest cases.
- Expose the catalog at the public path `/ludoteca` in a guest variant
  (no Borrow CTAs, login link instead), satisfying the "Public read-only
  catalog" requirement and replacing the legacy PythonAnywhere/Google Sites
  page.
- Stay strictly on Phase A primitives + tokens; do not introduce a CSS
  framework, a UI component framework, or a styling layer.

**Non-Goals:**

- The borrow-with-return-date dialog and the schema migration adding
  `loans.expected_return_date`. Scoped to `lending-borrow-with-return-date`
  (the next change). The catalog's Borrow CTA in this change still uses the
  existing Phase A `ConfirmDialog`.
- `MyLoansPage` rebuild as countdown cards. Same next-change scope.
- The site-wide shell (header, footer, top nav with the new "Préstamos"
  submenu). Owned by `site-shell-from-scraped-html`. The bespoke `NavBar`
  remains visible in this change.
- A full a11y / WCAG audit pass, axe-core integration, or Lighthouse
  scoring step. Scoped to the v1.5 polish change. This change ships the
  *primitives* needed for AA on the slider and the dialog (Phase A) but
  does not gate the merge on a Lighthouse score.
- Tabs (Info / History / Similar) on `GameDetailPage`. v1 ships a single
  scrollable layout; "Similar" was a TFM stretch goal and is out of scope.
- Filter state in URL query params. v1 keeps `useState`. URL persistence is
  nice-to-have polish.
- Skeletons / illustrated empty states. v1 uses the same simple text
  strings already in place.
- Playwright e2e for the new layouts. Browser smoke via Chrome DevTools MCP
  is the v1 verification.

## Decisions

### D1. Use `@radix-ui/react-slider`, not a hand-rolled accessible slider

**Decision:** Add `@radix-ui/react-slider` as a dependency and wrap it as
`frontend/src/ui/RangeSlider/`. The wrapper exposes `min`, `max`, `step`,
`value: [number, number]`, `onValueChange`, `label`, and an optional
`formatValue: (n: number) => string` for axis-label rendering (e.g. `"12+"`
when at the upper bound).

**Why over the alternatives:**

- The existing dual-slider in `CatalogPage.tsx` is two stacked
  `<input type="range">` elements with z-index hacks. It works visually but
  is not screen-reader friendly (each handle is independently announced as
  a single slider, not a range), and `Home`/`End` move both handles
  together because the underlying inputs aren't coordinated.
- Radix's `Slider` primitive ships full keyboard support
  (`ArrowLeft`/`ArrowRight`, `Home`, `End`, `PageUp`/`PageDown`), correct
  ARIA (`aria-valuemin`/`aria-valuemax`/`aria-valuenow`/`aria-valuetext`),
  and dual-handle range support out of the box. Bundle cost is `~12 KB`
  gzip — acceptable for the accessibility wins.
- Hand-rolling correct ARIA + keyboard behavior is a known footgun (handle
  collision, `valuetext` semantics, mobile touch coalescing). Radix
  handles all of this.

**Trade-off:** one more headless dependency. Aligned with the carve-out
already established in Phase A (`@radix-ui/react-dialog` is allowed because
it ships behavior, not styling).

### D2. Side panel on desktop (`≥ 1024 px`), bottom sheet on mobile (`< 1024 px`)

**Decision:** A single `useMatchMedia("(min-width: 1024px)")` hook decides
the layout. On desktop, the filter panel renders as a fixed-width left
column inside the page grid (`grid-template-columns: 240px 1fr`). On
mobile, the filter panel is replaced by a "Filtros" `Button` that opens a
`Dialog` styled as a bottom sheet (slide up from bottom, full-width, max
height `85vh`).

The bottom sheet reuses the Phase A `Dialog` primitive — Radix Dialog's
`Content` accepts arbitrary positioning via CSS, so styling it as a sheet
is just a CSS Module variant. No new primitive needed.

**Why `1024 px`:** matches the project's stated mobile-first breakpoint
(D8 in the archived plan) and is the standard tablet-landscape boundary.
Below `1024 px` the filter panel would compete with the grid for
horizontal space.

### D3. Active filter chips above the grid, one chip per non-default value

**Decision:** Extract a small `ActiveFilterChips` helper component that
inspects current filter state and emits one `Chip` per non-default value
with an `onRemove` handler that resets that filter. Examples:

| Filter            | Chip label                      | onRemove resets to |
| ----------------- | ------------------------------- | ------------------ |
| `filter`          | `Disponibles` / `Prestados`     | `"all"`            |
| `location`        | `Armario` / `Sótano`            | `"all"`            |
| `playerRange`     | `2–4 jugadores`                 | `[min, max]` extremes |
| `timePreset`      | `30–60 min`                     | `"all"`            |
| `minRating`       | `≥ 7.5 ★`                       | `0`                |
| `search`          | `Buscar: "Catan"`               | `""`               |

The chip row is hidden when no filter is active (zero chips). It renders
both in desktop side-panel mode and in mobile sheet mode (sheet contains
the controls, the chip row sits above the grid in the page body in both
modes).

**Why a helper, not inline:** the same logic needs to render in two
different layouts (desktop grid, mobile body) and is the cleanest unit to
test in isolation.

### D4. `mode: "member" | "public"` prop, threaded App → CatalogPage → GameCard

**Decision:** `App.tsx` decides the mode at startup based on
`window.location.pathname`:

- `/ludoteca` or `/ludoteca/*` → `mode = "public"`, basename `/ludoteca`,
  React Router renders only the catalog route.
- otherwise (`/prestamos`, `/prestamos/*`) → `mode = "member"`, basename
  `/prestamos`, full router (catalog, game detail, my-loans, login,
  forgot/set-password, admin).

The mode is a literal prop, not a context. `CatalogPage` accepts
`mode: "member" | "public"` and forwards it to every `GameCard`.
`GameDetailPage` reads it from the same plumbing (in the public mount the
detail route isn't registered, so `GameDetailPage` only renders in
`mode="member"` — but the component still accepts the prop for clarity and
testability).

**Why a prop, not a context:** the mode is decided once at mount and never
changes during a session (the user can't toggle from public to member
without a full page navigation). Prop threading is two levels deep and
trivially testable; context would be over-engineered.

**Why detect from `window.location.pathname`, not from the route itself:**
React Router's `basename` configuration must be set *before* the router
mounts. We can't read the location from inside React Router and then
choose the basename. `window.location.pathname` is the only synchronous
source of truth at component-mount time.

### D5. `/ludoteca` routing — Caddy proxies, Vite dev middleware mirrors

**Decision (production):** add a Caddy `handle_path /ludoteca/*` block that
proxies to `app:8000` (mirroring the existing `/prestamos/*` block). Add a
`not path /ludoteca/*` clause to the `@needs_trailing_slash` matcher so
the SPA owns its sub-routes. Asset URLs in the built `index.html` are
absolute (`/prestamos/assets/...`) because Vite's `base` is
`"/prestamos/"`; those URLs continue to resolve regardless of which
mount serves the HTML, because Caddy still proxies `/prestamos/*` to the
backend which serves the `assets` static mount.

**Decision (dev):** add a tiny Vite plugin in `vite.config.ts` that
intercepts requests with `req.url` starting with `/ludoteca` (excluding
asset requests, which Vite handles natively under `/prestamos/`) and
writes the SPA's `index.html` to the response. This is `~15 lines` of
Connect middleware. No build-time impact.

**Why not change `base` to `""` or `"/"`:** changing the Vite base to
relative or root would also change the production asset URLs, which would
ripple through the Caddy and backend assumptions. Keeping `base:
"/prestamos/"` and serving the same `index.html` from a second mount is
the smaller, more contained change.

**Why not use a HashRouter:** breaks deep-linking, URL sharing, and back
button semantics. Neither member nor guest visitors should see hash URLs.

### D6. Game-detail layout — single page, sectioned blocks, no tabs

**Decision:** `GameDetailPage` renders a single scrollable layout:

1. Back link (`← Volver al catálogo`) top-left.
2. Two-column hero on desktop: cover image left (max `260 px` wide), info
   block right (title, year, status badge, BGG link, prominent Borrow
   CTA). Stacked on mobile.
3. (Optional) description block below — *only if* the API returns a
   `description` field. As of this change the `Game` type does **not**
   include `description`; the block is omitted for v1.
4. "Historial de préstamos" section heading + the existing
   `LoanHistoryEntry` list, restyled via the `Card` primitive.

**Why no tabs:** the v1 detail data is small (cover, ~6 metadata fields,
loan history). Tabs would add navigation overhead for content that fits in
a single screen on desktop. The TFM showed tabs only on the post-user-test
iteration where a "Comentarios" block was added — Phase B doesn't ship
comments.

**Why no description block in v1:** the SQLite `games` table does not
store BGG descriptions and the BGG sync use case does not request them.
Adding the field would touch backend, schema, sync logic, and the API
response — out of scope for a UI-only change. Easy to add later.

### D7. Card grid sizing

**Decision:** `display: grid; grid-template-columns: repeat(auto-fit,
minmax(240px, 1fr)); gap: var(--space-md);`. This yields:

- 1 column below `~280 px` width
- 2 columns at `~480–767 px`
- 3 columns at `~768–1023 px`
- 4 columns at `~1024–1279 px` (with side panel reducing the available
  width)
- 5 columns at `~1280 px+`

Card aspect ratio for the cover area: `aspect-ratio: 4 / 3` to balance
square-ish covers (the most common BGG thumbnail format) and wider
landscape covers. Cover uses `object-fit: cover` so it crops gracefully
on irregular thumbnails.

**Why `auto-fit` instead of named breakpoints:** the side-panel layout
already changes the available width at `1024 px`; layering more
named-breakpoint card-count rules on top of that would be brittle.
`auto-fit + minmax` reflows naturally as space changes.

### D8. Sort UI stays — reskin only

**Decision:** the existing custom sort dropdown (button + popover with
radio-style options) keeps its structure. Only the styling moves to use
the `Button` primitive for the trigger and CSS Module classes for the
popover. No Radix `DropdownMenu` introduced here — it would mean another
~10 KB of dependency for a single, low-traffic affordance.

**Why not a `Select` primitive:** the existing UI shows the sort label
inside the trigger and uses radio-style "selected" indicators in the
popover, which the native `<select>` underlying our Phase A `Select` does
not support without JS hacks. Reskinning the existing custom dropdown is
the cheapest path that preserves the current UX.

## Risks / Trade-offs

- **Routing detection from `window.location.pathname` is a runtime check.**
  Server-side rendering is not in scope (the SPA is purely client-side, no
  SSR), so this is fine — but if SSR is ever introduced, the check needs
  to move to a build-time or request-time decision.
- **Asset URLs hard-coded to `/prestamos/`.** Even when the SPA loads from
  `/ludoteca/`, asset URLs point at `/prestamos/assets/*`. This is fine
  under our Caddy + backend setup (Caddy still proxies `/prestamos/*` to
  the backend), but a reverse proxy reconfiguration that breaks
  `/prestamos/*` would simultaneously break `/ludoteca/`. Documented in
  `Caddyfile` comments.
- **The bottom-sheet `Dialog` styling overlap with the Phase A centered
  modal.** Mitigation: the bottom-sheet variant is a *modifier class* on
  the `Dialog` primitive, not a fork — same focus trap, escape, and
  return-focus semantics. Visual styling diverges; behavior does not.
- **`@radix-ui/react-slider` adds `~12 KB` gzip.** Within the bundle
  budget; the accessibility win justifies it.
- **Smoke testing authenticated borrow/return flows in dev requires a
  member with a known password.** Past sessions hit a sandbox block on
  `bcrypt` password modification. If reproducible this round, log it in the
  PR description and verify those paths with a manual run after merge.

## Migration Plan

This is a UI-layer rewrite with no schema or API changes. Migration is
purely deploy:

1. Merge to `development`.
2. CI runs typecheck + Vitest. Lint already has 4 pre-existing failures
   unrelated to this change (`react-hooks/set-state-in-effect` in
   `AuthContext.tsx`, `useGames.ts`, `useGameHistory.ts`, `useMyLoans.ts`)
   and CI does not run lint, so they don't block.
3. Promote to `main` and the standard deploy workflow rebuilds the
   frontend, the backend container, and Caddy. The new `/ludoteca` route
   is live as soon as Caddy reloads.
4. The legacy PythonAnywhere `/ludoteca` page can be retired once
   `refugiodelsatiro.es` DNS is fully on Caddy. No coordination needed in
   this change — Caddy already serves `/ludoteca` since this PR adds the
   route, and the proxied SPA wins over any static fallback.

No data backfill, no feature flag, no rollout phasing.

## Open Questions

None — every decision in §Decisions was either resolved in the parent
`plan-lending-redesign` change (D8 mobile-first, D9 WCAG AA, D10
illustrations) or set by defaults explicitly handed down for this session.

## Apply-Time Findings

(filled in during `/opsx:apply` — left empty here so future readers can see
what was learned vs what was planned)
