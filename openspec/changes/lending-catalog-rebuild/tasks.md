# Tasks

Branch from `development` as `feature/lending-catalog-rebuild`. Single PR.
Land in the order below — the tree compiles after every group, which keeps
diffs reviewable. After every group, run
`cd frontend && npx tsc -b && npx vitest run` and only proceed if both
pass.

## 1. Dependency

- [x] 1.1 [FE] `cd frontend && npm install @radix-ui/react-slider`. Confirm
      `package.json` and `package-lock.json` are updated and the build still
      succeeds (`npm run build`). → ✓ added `^1.3.6`; build clean.

## 2. RangeSlider primitive

- [x] 2.1 [FE] Create
      `frontend/src/ui/RangeSlider/{RangeSlider.tsx,RangeSlider.module.css,index.ts}`.
      → Wraps `@radix-ui/react-slider`, exposes the documented API, and
      uses `useId()` to thread `aria-labelledby` to both thumbs.
- [x] 2.2 [FE] Create `frontend/src/ui/RangeSlider/RangeSlider.test.tsx`.
      → 6 tests cover label, formatValue display + aria-valuetext, ARIA
      min/max/now per thumb, ArrowRight tuple emission, Home/End extremes.
      Required adding ResizeObserver + pointer-capture noop polyfills to
      `tests/setup.ts` because jsdom doesn't ship them.

## 3. ActiveFilterChips helper

- [x] 3.1 [FE] Create
      `frontend/src/components/ActiveFilterChips.tsx` and `.module.css`.
      → 6 chip kinds (search, filter, location, players, time, rating)
      with `formatPlayerRange` rendering "12+" for the upper bound.
- [x] 3.2 [FE] Create
      `frontend/src/components/ActiveFilterChips.test.tsx`. → 7 tests:
      empty default, three-chip case, trimmed search, location labels,
      rating glyph, "12+" upper bound, click-to-clear callback wiring.

## 4. GameCard rewrite (cover-first)

- [x] 4.1 [FE] Rewrite `frontend/src/components/GameCard.tsx` on the
      Phase A `Card`, `Badge`, `Button` primitives. Cover-first layout,
      availability + rating overlay badges, `mode: "member" | "public"`
      prop hides actions in public mode.
- [x] 4.2 [FE] Replace `GameCard.css` with `GameCard.module.css`. Tokens
      only, `aspect-ratio: 4 / 3` for the cover.
- [x] 4.3 [FE] Create `frontend/src/components/GameCard.test.tsx`. → 13
      tests covering cover alt, metadata, badge variants by status,
      rating-badge visibility, action visibility by auth × status × mode,
      ConfirmDialog wiring.

## 5. CatalogPage rewrite

- [x] 5.1 [FE] Inline `useMatchMedia` hook in `CatalogPage.tsx` reading
      `(min-width: 1024px)` with `change` event listener.
- [x] 5.2 [FE] Rewrite `CatalogPage.tsx`: side-panel layout at desktop,
      mobile bottom sheet, sort dropdown reskinned on `Button`, chip row
      via `ActiveFilterChips`, `RangeSlider` for player range, `mode`
      prop forwarded to every `GameCard`, public-mode header swaps to
      `Iniciar sesión` link.
- [x] 5.3 [FE] Replace `CatalogPage.css` with `CatalogPage.module.css`.
      Tokens-only, side panel at `280px` (bumped from `240px` after the
      smoke test showed location/availability segmented buttons clipping).
- [x] 5.4 [FE] Bottom-sheet variant of `Dialog`: positioned via a CSS
      Module modifier class on `DialogContent` (`position: fixed; bottom:
      0; max-height: 85vh; border-radius: top-only;`). Focus trap and
      Escape inherit from Phase A's Radix-backed Dialog.
- [x] 5.5 [FE] Create `frontend/src/pages/CatalogPage.test.tsx`. → 7
      tests cover: card-per-game render, default chip-row absence, chip
      lifecycle (add via filter, clear via close), location filter,
      sort A-Z / Z-A, public-mode hides Borrow buttons + shows
      Iniciar sesión, slider initial display "1 – 12+".

## 6. GameDetailPage rewrite

- [x] 6.1 [FE] Rewrite `GameDetailPage.tsx`: hero `Card` with cover
      left, info right, prominent Borrow CTA. Lent → status indicator +
      optional `Devolver` for owner / admin. Guest (public mode OR
      unauthenticated member) → `Iniciar sesión para tomar prestado`
      link. Boy-Scout: extended `useGameHistory` with `refetch` so
      borrow / return refreshes inline.
- [x] 6.2 [FE] Replace `GameDetailPage.css` with `.module.css`.
- [x] 6.3 [FE] Create `frontend/src/pages/GameDetailPage.test.tsx`. → 11
      tests cover: hero metadata, BGG link, Borrow CTA visibility by
      status × auth × mode, Devolver visibility (owner / admin / other),
      Prestado indicator, guest link in public mode AND in member mode
      with no member, history list + empty state.

## 7. /ludoteca route

- [x] 7.1 [FE] Update `App.tsx`: detect mount via
      `window.location.pathname.startsWith("/ludoteca")` before mounting
      the router. Public mount registers only `<CatalogPage
      mode="public" />` under `basename="/ludoteca"` and omits the
      bespoke `NavBar`. Member mount keeps the existing route table
      with `<CatalogPage mode="member" />` and `<GameDetailPage
      mode="member" />`.
- [x] 7.2 [FE] Add the `serve-ludoteca-spa` Vite plugin in
      `vite.config.ts`. Connect middleware that, in dev, returns the
      transformed `index.html` for any GET under `/ludoteca` (excluding
      paths containing `.` and `/ludoteca/api/`).
- [x] 7.3 [INFRA] Update `Caddyfile`: added a `handle_path /ludoteca/*`
      block proxying to `app:8000`, and extended the
      `@needs_trailing_slash` matcher with `not path /ludoteca/*` so the
      SPA owns its sub-routes. Comments updated.

## 8. Spec maintenance

- [ ] 8.1 [CR] Replace the placeholder `Purpose` in
      `openspec/specs/lending-catalog-redesign/spec.md` after this change
      archives. → Pending archive (will land via the standard
      `openspec archive` flow once the PR merges).
- [x] 8.2 [CR] Verified every requirement in
      `openspec/changes/lending-catalog-rebuild/specs/lending-catalog-redesign/spec.md`
      has at least one `#### Scenario:` block. `openspec validate
      lending-catalog-rebuild` passes.

## 9. Manual verification (browser smoke test)

- [x] 9.1 [FE] Backend on `:8765` started; `vite.config.ts` proxy
      temporarily pointed at `:8765` for the smoke test. Reverted before
      commit.
- [x] 9.2 [FE] Smoke test outcomes:
      - **`/prestamos/` desktop (1280×900):** catalog renders with new
        cover-first cards, side panel visible, sort dropdown reskinned,
        slider keyboard-controllable (ArrowRight on the min thumb
        advanced the value display from `1 – 12+` to `2 – 12+`).
      - **Filter chip lifecycle:** clicking `Disponible` segment added a
        `Disponibles ×` chip and dropped the lent games (226 → 223
        cards). Clicking the chip's close button cleared the filter and
        restored 226 cards; chip row collapsed to nothing.
      - **`/prestamos/` mobile (390×800):** sidebar replaced by a
        `Filtros` button. Tapping it opened the bottom sheet from the
        bottom edge with all controls visible, "Aplicar" CTA in the
        bottom-right.
      - **`/prestamos/games/2`:** new layout, prominent red `Tomar
        prestado` CTA when authenticated; clicking opened the
        `ConfirmDialog`. Lent game (`/prestamos/games/1`) showed the
        `PRESTADO` indicator and lender name instead of the button.
      - **Guest detail (`/prestamos/games/2` unauthenticated):** showed
        `Iniciar sesión para tomar prestado` link. Same on `/ludoteca`.
      - **`/ludoteca/`:** public mount served by the Vite middleware,
        H1 `LUDOTECA DEL REFUGIO`, login link top-right, no NavBar,
        zero `Tomar prestado` / `Devolver` buttons across 226 cards.
      - **Console:** zero errors / warnings across all pages visited.
      - **Network:** zero requests to `fonts.googleapis.com` or
        `fonts.gstatic.com`; both fonts served from
        `/prestamos/fonts/*-variable.woff2`.
- [x] 9.3 [FE] Authenticated borrow + return verified end-to-end this
      session. Test member `test1@test.com` had its bcrypt hash
      overwritten via a one-line Python script (`bcrypt.hashpw → UPDATE
      members`), then login → POST `/loans` → state refresh → PATCH
      `/loans/{id}/return` → state refresh, all confirmed in the
      browser. Local dev DB only; production members untouched.
- [x] 9.4 [FE] Reverted the `vite.config.ts` proxy port back to `8000`,
      stopped both background servers, ran
      `cd frontend && npx tsc -b && npx vitest run && npm run build` —
      typecheck clean, **66 tests passed**, build successful (313 KB JS
      / 99 KB gzip).

## 10. Validation

- [x] 10.1 [CR] `openspec validate lending-catalog-rebuild` →
      `Change 'lending-catalog-rebuild' is valid`.
- [x] 10.2 [CR] `openspec status --change lending-catalog-rebuild` →
      `4/4 artifacts complete`.
- [x] 10.3 [CR] Spec delta covers Decisions D1–D5 (Radix slider
      requirement, side-panel breakpoint, chip row behaviour, mount
      detection, Vite dev middleware).

## 11. Open the PR

- [ ] 11.1 [FE] Push `feature/lending-catalog-rebuild` and open PR
      against `development` titled
      `feat(lending-redesign): Phase B — catalog rebuild, accessible
      filters, public /ludoteca`. Include the smoke-test summary, the
      list of spec scenarios verified, and a `Do not merge yet` note.
