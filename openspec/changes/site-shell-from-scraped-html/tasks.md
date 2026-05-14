# Tasks

Branch from `development` as `feature/import-menu`. Sequenced after `lending-design-tokens-and-primitives` is merged so tokens and the `<Button>` primitive exist.

## 1. Scraper nav extraction

- [ ] 1.1 [BE] Inspect `frontend/public/content-mirror/index.html` to identify the real DOM selector for the top-level nav inside `id="atIdViewHeader"`. Pick a selector and document a one-line rationale in `scraper/nav_extractor.py`.
- [ ] 1.2 [BE] Create `scraper/nav_extractor.py` exposing a pure transform `extract_nav(doc: BeautifulSoup) -> tuple[NavItem, ...]` where `NavItem = @dataclass(frozen=True)` with `label: str, href: str`. The function performs no I/O.
- [ ] 1.3 [BE] Implement skip rules: exclude items whose `href == "/prestamos"` or `href.startswith("/prestamos/")`; exclude fragment-only hrefs (`#…`); exclude absolute external URLs. Deduplicate by `(label, href)` preserving first-seen order. The extractor assumes its input has already been internal-href-rewritten by the orchestrator.
- [ ] 1.4 [BE] Add `nav_sha256: str | None` to the manifest dataclass in `scraper/manifest.py` so an unchanged nav is detectable across runs.
- [ ] 1.5 [BE] Add `write_nav(items: tuple[NavItem, ...], target_dir: Path) -> None` to `scraper/writer.py`. Serialise `{"version": 1, "generated_at": <ISO8601 UTC>, "items": [...]}` to `_nav.json`. Write to `_nav.json.tmp` first, then `os.replace`. If items is empty, do not write — emit a warning instead.
- [ ] 1.6 [BE] In `scraper/orchestrator.py`, after the canonical root page (`canonical == "/"`) is stripped and href-rewritten, call `extract_nav` and `write_nav`. Run only on the root page — the header is identical across pages.
- [ ] 1.7 [BE] In `Caddyfile`, add a path matcher for `/_nav.json` with `Cache-Control "public, max-age=300"` (mirrors `.html` cache headers).
- [ ] 1.8 [BE] Create `tests/scraper/__init__.py` (the directory does not exist yet).
- [ ] 1.9 [BE] `tests/scraper/test_nav_extractor.py` — fixtures cover: happy path with known nav (assert full expected tuple via `==`), empty header (empty tuple, no exception), missing header (empty tuple, no exception), fragment hrefs excluded, `/prestamos` exact match excluded, `/prestamos-info` boundary kept, absolute external URLs excluded, duplicate items deduplicated. All assertions are concrete equality against the full expected tuple/dict.
- [ ] 1.10 [BE] `tests/scraper/test_orchestrator.py` (extend existing or create) — full scrape against a fixture writes `_nav.json` with the expected schema; on extraction failure, `_nav.json` is left untouched (or absent if it never existed).
- [ ] 1.11 [BE] `tests/scraper/test_writer.py` — atomic-write behaviour: write succeeds and produces valid JSON; empty items does not write the file; a simulated mid-write crash leaves no partial `_nav.json` visible.

## 2. Visual reference inspection

- [ ] 2.1 [FE] Open `frontend/public/content-mirror/index.html` (and one or two interior pages — e.g. `/calendario`, `/socios`) in a browser. Note the header layout (logo position, link order, font, color, hover behavior) and footer layout (sections, social icons, copyright, language selector position).
- [ ] 2.2 [FE] Screenshot the desktop and mobile views of the scraped header and footer; commit under `tasks/lending-redesign/mockups/scraped-header-desktop.png`, `scraped-header-mobile.png`, `scraped-footer-desktop.png`, `scraped-footer-mobile.png` for side-by-side review during implementation.
- [ ] 2.3 [FE] Sample computed CSS via DevTools for the live header/footer (font-size, padding, gap, breakpoint at which the burger appears). There is **no** `content.css` file — styles live inline in `<style>` blocks. Record the sampled values that feed the new tokens.
- [ ] 2.4 [FE] Confirm the logo asset path: `frontend/public/content-mirror/_assets/200953ee27cc922e.png` (~40 px header height, left-aligned). The new `<SiteHeader>` references this asset directly — no new SVG export work.

## 3. Frontend nav-data plumbing

- [ ] 3.1 [FE] Add a Vite proxy in `frontend/vite.config.ts`: `server.proxy["/_nav.json"] = { target: "http://localhost:8080" }`. This makes the dev server reach Caddy for the nav file so the fetch path is identical in dev and prod.
- [ ] 3.2 [FE] Create `frontend/src/hooks/useNavItems.ts`. Fetches `/_nav.json` with `cache: "no-store"`, validates the response shape (typed schema check), returns `{ items: readonly NavItem[]; status: "loading" | "ready" | "error" }`. On HTTP error, JSON parse error, or schema mismatch returns `status: "error"` with `items: []`.
- [ ] 3.3 [FE] Create `frontend/src/context/SiteNavProvider.tsx`. Wraps the app, performs the fetch exactly once, exposes the same `{ items, status }` via context. Re-mounts of `<SiteHeader>` consume the cached value and do not re-fetch.
- [ ] 3.4 [FE] Tests: `useNavItems.test.ts` — mock `fetch`; assert happy path returns concrete typed items, 404 returns `error` status with empty items, malformed JSON returns `error`, schema mismatch returns `error`. Assertions are concrete equality.

## 4. SiteFooter

- [ ] 4.1 [FE] Create `frontend/src/components/SiteFooter/{SiteFooter.tsx, SiteFooter.module.css, SiteFooter.test.tsx, index.ts}`. Reproduce every content block from the scraped footer (copyright, social links, addresses, contact info, legal links, repo / club references — whatever is present) using design-system tokens. Omit only the language selector.
- [ ] 4.2 [FE] Test: `<SiteFooter>` renders the copyright line and social links and SHALL NOT contain any element matching the language-selector role/label.

## 5. SiteHeader desktop layout

- [ ] 5.1 [FE] Create `frontend/src/components/SiteHeader/{SiteHeader.tsx, SiteHeader.module.css, SiteHeader.test.tsx, index.ts}`.
- [ ] 5.2 [FE] Add tokens to `frontend/src/tokens.css`: `--color-header-bg`, `--color-header-fg`, `--color-header-fg-hover`, `--color-header-fg-active`, `--color-header-divider`, `--header-height`, `--header-z`. Values sampled from the live scraped header.
- [ ] 5.3 [FE] Render the club logo (negative variant for the dark bar) on the left.
- [ ] 5.4 [FE] Render the top-level nav by mapping over `useNavItems().items`: each item is an `<a href="...">` with the fetched `label`. If `status === "error"` or items is empty, render no static items (Préstamos still appears). All rendering uses functional `map`, not imperative loops.
- [ ] 5.5 [FE] Test: with mock-injected items, rendered `<a>` elements appear in order with the correct hrefs; with an empty/`error` provider, only the Préstamos parent renders. Assertions are concrete equality against the full expected list.

## 6. Préstamos submenu (desktop) with auth gating

- [ ] 6.1 [FE] Add the Préstamos parent as the last top-level item, rendered with React Router `<Link to="/prestamos/">`.
- [ ] 6.2 [FE] Render the submenu via a single declarative item list derived from auth state (`useAuth()` from `frontend/src/context/AuthContext.tsx`). No imperative branching; the list is computed with `filter`/`map` from a base array of typed entries.
  - Guest items: `Catálogo` (`/prestamos/`), `Iniciar sesión` (`/prestamos/login`).
  - Member items: `Catálogo`, `Mis préstamos` (`/prestamos/my-loans`), `Cerrar sesión` (action → `logout()`).
  - Admin items: `Catálogo`, `Mis préstamos`, `Administración` (nested parent), `Cerrar sesión`.
- [ ] 6.3 [FE] Nested `Administración` submenu — items: `Miembros` (`/prestamos/admin/members`), `Contenido` (`/prestamos/admin/content`).
- [ ] 6.4 [FE] Desktop CSS-only behaviour: `position: relative` on parent `<li>`, child `<ul>` is `position: absolute; visibility: hidden; opacity: 0` and toggled visible on `:hover` and `:focus-within`. Animate with `opacity` only (so `prefers-reduced-motion` zero-out applies). Same pattern for the nested Administración submenu.
- [ ] 6.5 [FE] Tests in `SiteHeader.test.tsx` — `describe` groups for guest / member / admin. Each asserts the exact rendered submenu item list (`toEqual` against the expected labels + hrefs). Hover and tab open the submenu. Cerrar sesión triggers the mocked `logout()`.

## 7. Active-route highlighting

- [ ] 7.1 [FE] In `SiteHeader`, use `useMatch("/prestamos/*")` to compute the active flag for the Préstamos parent. Apply an `active` CSS class.
- [ ] 7.2 [FE] Use `useMatch` with the exact path of each Préstamos submenu item to compute their active flags.
- [ ] 7.3 [FE] For fetched static-page items, compare each item's `href` against `window.location.pathname` for exact match. Apply the `active` class.
- [ ] 7.4 [FE] Test: with `MemoryRouter` initial entry `/prestamos/my-loans`, the Préstamos parent and `Mis préstamos` submenu item are active; `Catálogo` and the nested `Administración` parent are not. With a mock `window.location.pathname` of a fetched item's href, that item is active.

## 8. Mobile burger drawer

- [ ] 8.1 [FE] Add a hamburger `<button>` to `SiteHeader` that is `display: none` on viewports ≥ 768 px and visible below. Wire `aria-label`, `aria-expanded`, `aria-controls`.
- [ ] 8.2 [FE] Add `useState` for the drawer-open boolean. Tapping the hamburger toggles it. Escape closes it and returns focus to the hamburger button. Lock body scroll while open.
- [ ] 8.3 [FE] Drawer renders the same nav items in the same order (fetched + Préstamos parent), vertically stacked. Préstamos becomes a tappable expandable parent with its own `useState`-driven open flag. The nested Administración submenu uses the same expandable pattern.
- [ ] 8.4 [FE] Tapping Préstamos in the drawer expands the submenu inline beneath it. Tapping again collapses. Same for Administración inside it.
- [ ] 8.5 [FE] Tests: < 768 px viewport (use `vitest`'s `matchMedia` mock or jsdom's window resize), burger control is visible; tapping it opens the drawer; tapping Préstamos expands the submenu; pressing Escape closes the drawer.

## 9. PageLayout

- [ ] 9.1 [FE] Create `frontend/src/components/PageLayout/{PageLayout.tsx, PageLayout.module.css, PageLayout.test.tsx, index.ts}` composing `<SiteHeader />` + `<main>{children}</main>` + `<SiteFooter />`. Sticky header.
- [ ] 9.2 [FE] Test: rendered DOM contains header, main, footer in order; children render inside main.

## 10. MinimalPageLayout

- [ ] 10.1 [FE] Create `frontend/src/components/MinimalPageLayout/{MinimalPageLayout.tsx, MinimalPageLayout.module.css, MinimalPageLayout.test.tsx, index.ts}`. Renders the club logo (positive variant, centered) + children. No header, no footer.
- [ ] 10.2 [FE] Test: rendered DOM contains the logo and the children only.

## 11. Wire up App.tsx

- [ ] 11.1 [FE] In `frontend/src/App.tsx`, mount `<SiteNavProvider>` around the route tree so the fetch happens once at App boot.
- [ ] 11.2 [FE] Wrap authenticated routes (`/`, `/games/:id`, `/my-loans`, `/admin/members`, `/admin/content`) in `<PageLayout>`.
- [ ] 11.3 [FE] Wrap `/login`, `/forgot-password`, `/set-password` in `<MinimalPageLayout>`.
- [ ] 11.4 [FE] Remove the global `<NavBar />` mount that previously sat at the top of `App.tsx`.

## 12. Delete the bespoke NavBar

- [ ] 12.1 [FE] Delete `frontend/src/components/NavBar.tsx`, `NavBar.css`, and any `NavBar.test.tsx`.
- [ ] 12.2 [FE] `grep -r "from.*NavBar" frontend/src` SHALL return zero matches.
- [ ] 12.3 [FE] `grep -r "className=\"btn" frontend/src` SHALL return zero matches (Phase A migrated all consumers; this is a final sweep).

## 13. Cross-link TODO

- [ ] 13.1 [CR] Add a TODO note to `tasks/lending-redesign/plan-replicate-existing-site.md` Phase 1 section: "When the static content pages are ported to React, the scraper-driven `_nav.json` mechanism becomes redundant — replace it with a React-resident nav config and remove `nav_extractor` / `_nav.json`. Until then, members reach the lending app via direct URL or bookmark."

## 14. Verify

- [ ] 14.1 [FE] `cd frontend && npm run typecheck` passes.
- [ ] 14.2 [FE] `cd frontend && npm run lint` passes.
- [ ] 14.3 [FE] `cd frontend && npm test` passes.
- [ ] 14.4 [FE] `cd frontend && npm run build` produces a clean build.
- [ ] 14.5 [BE] `pytest tests/scraper/` passes.
- [ ] 14.6 [FE] `cd e2e && npx playwright test` passes.
- [ ] 14.7 [FE] Manual smoke via Chrome DevTools MCP: trigger a scrape (admin "Contenido" → re-sync), verify `_nav.json` exists with expected schema and `/prestamos` excluded; navigate to `/prestamos/` and confirm fetched items + Préstamos render; cross-navigate to a fetched item; test guest / member / admin submenu shapes; mobile-emulate 375 px and exercise the drawer + nested expand + Escape; console clean. Assert visual parity for the header at 1280 / 768 / 375.

## 15. Documentation

- [ ] 15.1 [CR] Update `README.md` "Planned work" section: mark `lending-design-tokens-and-primitives` and `site-shell-from-scraped-html` complete (or active, depending on order); list the remaining lending-redesign phases (B catalog, C my-loans, D admin restyle).

## 16. Open the PR

- [ ] 16.1 [CR] Open PR titled `feat(shell): site-wide PageLayout with data-driven nav, drop bespoke NavBar` against `development`. Body links to this change directory and the archived `plan-lending-redesign`, and references the related GitHub issue per `.claude/CLAUDE.md`.
- [ ] 16.2 [CR] Confirm CI passes.
