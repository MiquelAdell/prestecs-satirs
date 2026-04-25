## Why

The lending React app currently renders a bespoke `NavBar` and no footer. The wider club site (`refugiodelsatiro.es`, mirrored at `frontend/public/content-mirror/` and served by Caddy at `/`, `/calendario`, ...) has its own header and footer. Having two visual identities on the same domain is jarring and undercuts the Phase A token unification.

This change builds a single page shell — a `<PageLayout>` with the existing site's header and footer — and wraps the lending React routes in it. The header gets one new top-level item, **Préstamos**, with a submenu of `Catálogo`, `Mis préstamos`, `Administración`, replacing the lending app's bespoke nav.

Scope is **only the lending React routes**. The static content pages (`/`, `/calendario`, `/eventos`, ...) remain served by Caddy from the content mirror in this change; their port to React is a later concern owned by the existing-site replication track (`tasks/lending-redesign/plan-replicate-existing-site.md` Phase 1).

## What Changes

- **Add `<PageLayout>`** at `frontend/src/components/PageLayout/{PageLayout.tsx, PageLayout.module.css, PageLayout.test.tsx, index.ts}` composing `<SiteHeader />` + `<main>` + `<SiteFooter />`.
- **Add `<SiteHeader>`** that visually matches the scraped club site's header (logo + horizontal nav, dark-bar variant per style-guide §5.1) and renders a top-level nav with these items: `Inicio` (`/`), `Calendario` (`/calendario`), `Eventos` (`/eventos`), `Juegos de Mesa` (`/juegos-de-mesa`), `Juegos de Rol` (`/juegos-de-rol`), `Socios` (`/socios`), `FAQ` (`/faq`), and the new **`Préstamos`** with a submenu (`Catálogo` → `/prestamos/`, `Mis préstamos` → `/prestamos/my-loans`, `Administración` → `/prestamos/admin/members`, role-gated to admins). The `Préstamos` parent item links to `/prestamos/` on click; hovering or focusing it reveals the submenu (mobile: tap-to-expand).
- **Add `<SiteFooter>`** that visually matches the scraped club site's footer markup, **without the language selector** (we are Spanish-only for now). Other footer content (copyright, social links, addresses if present in the scraped footer) is preserved.
- **Wrap authenticated lending routes** in `frontend/src/App.tsx` with `<PageLayout>`: `/`, `/games/:id`, `/my-loans`, `/admin/members`, `/admin/content`. Login / forgot / set-password keep a minimal layout (decision S5).
- **Delete the lending app's bespoke `NavBar`** (`frontend/src/components/NavBar.tsx` and `NavBar.css`) once `<SiteHeader>` is wired in. Strip the `.btn`/`.btn-primary`/`.btn-secondary` classes that lived in `NavBar.css` (Phase A's group 7 already migrated every consumer to `<Button>`).
- **Active-route highlighting**: the `Préstamos` top-level item is rendered as active when the current path starts with `/prestamos/`. Submenu items are active when their exact path matches.
- **Mobile burger menu**: viewports < 768px collapse the nav into a hamburger control; the `Préstamos` submenu becomes a nested expandable inside the drawer.
- **Cross-link from static pages**: leave a TODO marker (in code or in `tasks/lending-redesign/plan-replicate-existing-site.md`) for the eventual update of the scraped/content-mirror pages so their nav also points at the lending app's routes once the static pages are themselves React. **Out of scope here**.

## Capabilities

### New Capabilities

- `site-shell`: The single page shell (header, top nav with role-aware submenus, footer) used by every page rendered by the React app. Owns the visual identity that mirrors the scraped club site, plus the routing-aware active-state behavior. Future static-content pages (replicate-existing-site Phase 1) will compose this same shell.

### Modified Capabilities

- `lending-design-system`: The `<PageLayout>` and "PageLayout shell" requirements that originally lived here are now satisfied by `site-shell`. This change MODIFIES the `<PageLayout>` requirement so that its scenarios point at `site-shell` as the implementing capability.

## Impact

- **Frontend**:
  - **Add**: `frontend/src/components/PageLayout/`, `frontend/src/components/SiteHeader/`, `frontend/src/components/SiteFooter/`. Each is a folder with `.tsx`, `.module.css`, `.test.tsx`, `index.ts`.
  - **Delete**: `frontend/src/components/NavBar.tsx`, `NavBar.css`, `NavBar.test.tsx` (if any).
  - **Modify**: `frontend/src/App.tsx` (route wrapping), every page that imported `<NavBar />` directly (none currently — `NavBar` was rendered globally inside `App.tsx`).
- **Dependencies**: none added or removed. The `Préstamos` submenu uses native CSS `:hover`/`:focus-within` for desktop and a small piece of state for mobile burger; no headless-menu library required for this scope.
- **Backend**: zero changes.
- **Tests**: snapshot + behavior tests for `SiteHeader` (active highlighting, submenu open/close, role-gated `Administración` visibility, mobile burger), `SiteFooter` (renders without language selector), `PageLayout` (composes header + main + footer).
- **Visual fidelity reference**: `frontend/public/content-mirror/index.html` and `frontend/public/content-mirror/_assets/content.css` are the *visual reference* — we do not embed their markup verbatim (the Google Sites HTML is obfuscated and the new `Préstamos` submenu can't be added cleanly to it). We rebuild a clean React header/footer that matches the visual design.
- **Out of scope**:
  - Porting the static content pages (`/`, `/calendario`, `/eventos`, ...) to React — they keep being served by Caddy from the content mirror.
  - Updating those static pages' own nav to include the lending app — TODO for replicate-existing-site Phase 1.
  - Reintroducing a language selector.
- **Rollback**: revert the merge commit on `development`. The lending app then reverts to the bespoke `NavBar`.
