# Tasks

Branch from `development` as `feature/site-shell-from-scraped-html`. Sequenced after `lending-design-tokens-and-primitives` is merged so tokens and the `<Button>` primitive exist.

## 1. Visual reference inspection

- [ ] 1.1 [FE] Open `frontend/public/content-mirror/index.html` (and one or two interior pages — e.g. `/calendario`, `/socios`) in a browser. Note the header layout (logo position, link order, font, color, hover behavior) and footer layout (sections, social icons, copyright, language selector position).
- [ ] 1.2 [FE] Screenshot the desktop and mobile views of the scraped header and footer; commit under `tasks/lending-redesign/mockups/scraped-header-desktop.png`, `scraped-header-mobile.png`, `scraped-footer-desktop.png`, `scraped-footer-mobile.png` for side-by-side review during implementation.
- [ ] 1.3 [FE] Inspect `frontend/public/content-mirror/_assets/content.css` for any header/footer-specific class names whose computed CSS values we want to mirror (font-size, padding, gap, breakpoint at which the burger appears).
- [ ] 1.4 [FE] Identify the logo asset(s) the scraped header uses (look under `frontend/public/content-mirror/_assets/`). The new `<SiteHeader>` references those same assets directly — no new SVG export work.

## 2. SiteFooter

- [ ] 2.1 [FE] Create `frontend/src/components/SiteFooter/{SiteFooter.tsx, SiteFooter.module.css, SiteFooter.test.tsx, index.ts}`. Reproduce **every** content block from the scraped footer (copyright, social links, addresses, contact info, legal links, repo / club references — whatever is present) using design-system tokens. **Omit only** the language selector.
- [ ] 2.2 [FE] Test: `<SiteFooter>` renders the copyright line and social links and SHALL NOT contain any element matching the language-selector role/label.

## 3. SiteHeader desktop layout

- [ ] 3.1 [FE] Create `frontend/src/components/SiteHeader/{SiteHeader.tsx, SiteHeader.module.css, SiteHeader.test.tsx, index.ts}`.
- [ ] 3.2 [FE] Render the club logo (negative variant for the dark bar) on the left.
- [ ] 3.3 [FE] Render the top-level nav: Inicio (`/`), Calendario (`/calendario`), Eventos (`/eventos`), Juegos de Mesa (`/juegos-de-mesa`), Juegos de Rol (`/juegos-de-rol`), Socios (`/socios`), FAQ (`/faq`). Each is an `<a href="...">`.
- [ ] 3.4 [FE] Test: rendered `<a>` elements appear in order with the correct hrefs.

## 4. Préstamos submenu (desktop)

- [ ] 4.1 [FE] Add the Préstamos parent as the last top-level item, rendered with React Router `<Link to="/prestamos/">`.
- [ ] 4.2 [FE] Add the submenu list with three `<Link>` items: Catálogo (`/prestamos/`), Mis préstamos (`/prestamos/my-loans`), Administración (`/prestamos/admin/members`).
- [ ] 4.3 [FE] CSS-only: `position: relative` on parent `<li>`, child `<ul>` is `position: absolute; visibility: hidden; opacity: 0` and toggled visible on `:hover` and `:focus-within`. Animate with `opacity` only (so `prefers-reduced-motion` zero-out applies).
- [ ] 4.4 [FE] Test: hovering the Préstamos parent reveals the submenu (use `userEvent.hover`); tabbing into the parent reveals the submenu (use `userEvent.tab` until focus lands on the parent).

## 5. Role gating on Administración

- [ ] 5.1 [FE] Consume `useAuth()` from `frontend/src/context/AuthContext.tsx` inside `SiteHeader`. Conditionally render the `Administración` `<Link>` only when `member?.is_admin === true`.
- [ ] 5.2 [FE] Conditionally render the `Mis préstamos` link only when `member` is truthy (any authenticated member).
- [ ] 5.3 [FE] Tests for three cases: guest (only Catálogo), member (Catálogo + Mis préstamos), admin (all three). Use an `<AuthProvider>` wrapper that injects the appropriate state.

## 6. Active-route highlighting

- [ ] 6.1 [FE] In `SiteHeader`, use `useMatch("/prestamos/*")` to compute the active flag for the Préstamos parent. Apply an `active` CSS class.
- [ ] 6.2 [FE] Use `useMatch` with the exact path of each submenu item to compute their active flags.
- [ ] 6.3 [FE] For static-page items, compare against `window.location.pathname` for exact match. Apply the `active` class.
- [ ] 6.4 [FE] Test: with `MemoryRouter` initial entry `/prestamos/my-loans`, Préstamos parent and Mis préstamos submenu item are active; Catálogo and Administración are not.

## 7. Mobile burger drawer

- [ ] 7.1 [FE] Add a hamburger button to `SiteHeader` that is `display: none` on viewports ≥ 768 px and visible below.
- [ ] 7.2 [FE] Add `useState` for the drawer-open boolean. Tapping the hamburger toggles it.
- [ ] 7.3 [FE] Drawer renders the same nav items in the same order, vertically stacked. Préstamos becomes a tappable expandable parent with its own `useState`-driven open flag.
- [ ] 7.4 [FE] Tapping Préstamos in the drawer expands the submenu inline beneath it. Tapping again collapses.
- [ ] 7.5 [FE] Tests: < 768 px viewport (use `vitest`'s `matchMedia` mock or jsdom's window resize), burger control is visible; tapping it opens the drawer; tapping Préstamos expands the submenu.

## 8. PageLayout

- [ ] 8.1 [FE] Create `frontend/src/components/PageLayout/{PageLayout.tsx, PageLayout.module.css, PageLayout.test.tsx, index.ts}` composing `<SiteHeader />` + `<main>{children}</main>` + `<SiteFooter />`. Sticky header.
- [ ] 8.2 [FE] Test: rendered DOM contains header, main, footer in order; children render inside main.

## 9. MinimalPageLayout

- [ ] 9.1 [FE] Create `frontend/src/components/MinimalPageLayout/{MinimalPageLayout.tsx, MinimalPageLayout.module.css, MinimalPageLayout.test.tsx, index.ts}`. Renders the club logo (positive variant, centered) + children. No header, no footer.
- [ ] 9.2 [FE] Test: rendered DOM contains the logo and the children only.

## 10. Wire up App.tsx

- [ ] 10.1 [FE] In `frontend/src/App.tsx`, wrap authenticated routes (`/`, `/games/:id`, `/my-loans`, `/admin/members`, `/admin/content`) in `<PageLayout>`.
- [ ] 10.2 [FE] Wrap `/login`, `/forgot-password`, `/set-password` in `<MinimalPageLayout>`.
- [ ] 10.3 [FE] Remove the global `<NavBar />` mount that previously sat at the top of `App.tsx`.

## 11. Delete the bespoke NavBar

- [ ] 11.1 [FE] Delete `frontend/src/components/NavBar.tsx`, `NavBar.css`, and any `NavBar.test.tsx`.
- [ ] 11.2 [FE] `grep -r "from.*NavBar" frontend/src` SHALL return zero matches.
- [ ] 11.3 [FE] `grep -r "className=\"btn" frontend/src` SHALL return zero matches (Phase A migrated all consumers; this is a final sweep).

## 12. Cross-link TODO

- [ ] 12.1 [CR] Add a TODO note to `tasks/lending-redesign/plan-replicate-existing-site.md` Phase 1 section: "When the static content pages are ported to React, update their nav (and the scraper template if Sites stays the source) so they list a `Préstamos` top-level item too. Until then, members reach the lending app via direct URL or bookmark."

## 13. Verify

- [ ] 13.1 [FE] `cd frontend && npm run typecheck` passes.
- [ ] 13.2 [FE] `cd frontend && npm run lint` passes.
- [ ] 13.3 [FE] `cd frontend && npm test` passes.
- [ ] 13.4 [FE] `cd frontend && npm run build` produces a clean build.
- [ ] 13.5 [FE] `cd e2e && npx playwright test` passes.
- [ ] 13.6 [FE] Manual side-by-side: in two browser windows open `frontend/public/content-mirror/index.html` and the dev server's `/prestamos/`. Confirm visual parity for header (logo, font, color, spacing, hover behavior) and footer (layout, social links, copyright). Test desktop hover, keyboard tab into Préstamos, mobile burger, mobile Préstamos expand, role gating with a guest / member / admin login.

## 14. Documentation

- [ ] 14.1 [CR] Update `README.md` "Planned work" section: mark `lending-design-tokens-and-primitives` and `site-shell-from-scraped-html` complete (or active, depending on order); list the remaining lending-redesign phases (B catalog, C my-loans, D admin restyle).

## 15. Open the PR

- [ ] 15.1 [CR] Open PR titled `feat(shell): site-wide PageLayout with Préstamos submenu, drop bespoke NavBar` against `development`. Body links to this change directory and the archived `plan-lending-redesign`.
- [ ] 15.2 [CR] Confirm CI passes.
