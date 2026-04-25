# site-shell Specification

## Purpose

Defines the single page shell — header, top navigation with the Préstamos submenu, footer, and the layout that composes them — used by every page rendered by the React app. The shell visually mirrors the scraped club site (`frontend/public/content-mirror/`) and routes both static-content destinations (`/calendario`, `/eventos`, ...) and lending-app destinations (`/prestamos/...`) from a single nav. The static content pages themselves are still served by Caddy from the content mirror; this capability owns only the React side of the shell.

## ADDED Requirements

### Requirement: PageLayout composes header, main, footer

The system SHALL provide a `<PageLayout>` component at `frontend/src/components/PageLayout/` that composes `<SiteHeader />`, a `<main>` element with the page-content container, and `<SiteFooter />`. Every authenticated lending route SHALL render inside `<PageLayout>`.

#### Scenario: PageLayout structure
- **WHEN** `<PageLayout>` renders
- **THEN** its DOM SHALL contain `<SiteHeader />`, `<main>`, and `<SiteFooter />` in that order
- **AND** children passed to `<PageLayout>` SHALL render inside `<main>`

#### Scenario: Authenticated routes wrap with PageLayout
- **WHEN** the catalog (`/`), my-loans (`/my-loans`), game-detail (`/games/:id`), admin members (`/admin/members`), or admin content (`/admin/content`) routes render
- **THEN** their top-level JSX SHALL be `<PageLayout>...</PageLayout>`

### Requirement: SiteHeader top-level navigation

The `<SiteHeader>` component SHALL render the club logo plus a horizontal top-level navigation containing these items in order: `Inicio` (`/`), `Calendario` (`/calendario`), `Eventos` (`/eventos`), `Juegos de Mesa` (`/juegos-de-mesa`), `Juegos de Rol` (`/juegos-de-rol`), `Socios` (`/socios`), `FAQ` (`/faq`), and `Préstamos` (parent — submenu defined below).

#### Scenario: Top-level items rendered
- **WHEN** `<SiteHeader>` renders on a viewport ≥ 768 px
- **THEN** it SHALL render exactly these top-level nav items in order: Inicio, Calendario, Eventos, Juegos de Mesa, Juegos de Rol, Socios, FAQ, Préstamos

#### Scenario: Static-page items are plain anchor tags
- **WHEN** any nav item except Préstamos and its submenu items renders
- **THEN** it SHALL be an `<a href="...">` element (not a React Router `<Link>`)
- **AND** clicking it SHALL cause a full-page navigation

#### Scenario: Préstamos and its submenu items are React Router links
- **WHEN** the Préstamos parent or any of its submenu items renders
- **THEN** it SHALL be a React Router `<Link to="...">` element
- **AND** clicking it SHALL be handled client-side without a full-page navigation

### Requirement: Préstamos submenu

The `Préstamos` parent nav item SHALL link to `/prestamos/` and SHALL reveal a submenu containing `Catálogo` (`/prestamos/`), `Mis préstamos` (`/prestamos/my-loans`), and `Administración` (`/prestamos/admin/members`) when the parent is hovered, focused, or (on mobile) tapped.

#### Scenario: Submenu opens on hover (desktop)
- **WHEN** a user with viewport ≥ 768 px hovers the Préstamos parent
- **THEN** the submenu SHALL be visible

#### Scenario: Submenu opens on focus (keyboard, desktop)
- **WHEN** a user tabs into the Préstamos parent or any of its submenu items
- **THEN** the submenu SHALL be visible (via `:focus-within` or equivalent)

#### Scenario: Submenu opens on tap (mobile)
- **WHEN** a user with viewport < 768 px taps the Préstamos parent inside the burger drawer
- **THEN** the submenu SHALL expand inline below the parent
- **AND** tapping the parent again SHALL collapse the submenu

#### Scenario: Submenu items in order
- **WHEN** the Préstamos submenu is open
- **THEN** it SHALL render `Catálogo`, `Mis préstamos`, and `Administración` in that order (subject to role-gating below)

### Requirement: Administración is admin-only

The `Administración` submenu item SHALL render only when the authenticated member has `is_admin === true`. For non-admin members the item SHALL NOT appear in the DOM. For unauthenticated visitors the item SHALL NOT appear, and `Mis préstamos` SHALL also NOT appear.

#### Scenario: Admin sees all three submenu items
- **WHEN** an authenticated member with `is_admin === true` opens the Préstamos submenu
- **THEN** the submenu SHALL render `Catálogo`, `Mis préstamos`, and `Administración`

#### Scenario: Non-admin member sees two submenu items
- **WHEN** an authenticated member with `is_admin === false` opens the Préstamos submenu
- **THEN** the submenu SHALL render `Catálogo` and `Mis préstamos`
- **AND** `Administración` SHALL NOT appear in the DOM

#### Scenario: Guest sees only Catálogo
- **WHEN** an unauthenticated visitor opens the Préstamos submenu
- **THEN** the submenu SHALL render only `Catálogo`
- **AND** `Mis préstamos` and `Administración` SHALL NOT appear in the DOM

### Requirement: Active-route highlighting

The `<SiteHeader>` SHALL apply an `active` styling class to the nav item whose route matches the current location: the `Préstamos` parent when the path starts with `/prestamos/`, exact-path matching for submenu items, and exact-path matching for static-page items.

#### Scenario: Préstamos parent active under any /prestamos/ path
- **WHEN** the current path is `/prestamos/`, `/prestamos/my-loans`, `/prestamos/admin/members`, `/prestamos/games/42`, or any path starting with `/prestamos/`
- **THEN** the Préstamos parent nav item SHALL have the `active` class

#### Scenario: Submenu item active on exact match
- **WHEN** the current path is `/prestamos/my-loans`
- **THEN** the Mis préstamos submenu item SHALL have the `active` class
- **AND** Catálogo and Administración SHALL NOT have the `active` class

#### Scenario: Static-page item active on exact match
- **WHEN** the current path is `/calendario`
- **THEN** the Calendario top-level item SHALL have the `active` class
- **AND** no other top-level item SHALL have the `active` class

### Requirement: Mobile burger drawer below 768 px

The `<SiteHeader>` SHALL collapse the top-level navigation into a hamburger control on viewports < 768 px. Tapping the control SHALL open a drawer containing the same nav items, with `Préstamos` rendered as an expandable parent whose submenu nests inline.

#### Scenario: Burger control visible below breakpoint
- **WHEN** the viewport width is < 768 px
- **THEN** the horizontal nav SHALL be hidden
- **AND** a hamburger control SHALL be visible in the header

#### Scenario: Drawer opens on tap
- **WHEN** the user taps the hamburger control
- **THEN** the drawer SHALL open
- **AND** it SHALL contain the same nav items in the same order

#### Scenario: Préstamos submenu nested in drawer
- **WHEN** the drawer is open and the user taps `Préstamos`
- **THEN** the submenu SHALL expand inline beneath the parent
- **AND** tapping `Préstamos` again SHALL collapse the submenu

### Requirement: SiteFooter mirrors scraped footer minus language selector

The `<SiteFooter>` component SHALL visually match the scraped club site's footer (`frontend/public/content-mirror/index.html` footer markup is the visual reference) and SHALL preserve all of its content **except the language selector**, which SHALL NOT appear in the new footer.

#### Scenario: Language selector absent
- **WHEN** `<SiteFooter>` renders
- **THEN** the DOM SHALL NOT contain a language selector control or its associated UI
- **AND** no `LanguageSelector` component SHALL be imported

#### Scenario: Other scraped-footer content preserved
- **WHEN** `<SiteFooter>` renders
- **THEN** it SHALL contain the copyright line, social links, and any other content present in the scraped footer (modulo the language selector)

### Requirement: MinimalPageLayout for auth funnel pages

The system SHALL provide a `<MinimalPageLayout>` component (logo only, no nav, no footer) used for `LoginPage`, `ForgotPasswordPage`, and `SetPasswordPage`.

#### Scenario: MinimalPageLayout structure
- **WHEN** `<MinimalPageLayout>` renders
- **THEN** the DOM SHALL contain the club logo and the children only
- **AND** there SHALL be no `<SiteHeader>` or `<SiteFooter>` in the rendered tree

#### Scenario: Auth pages use the minimal layout
- **WHEN** the routes `/login`, `/forgot-password`, or `/set-password` render
- **THEN** the top-level JSX SHALL be `<MinimalPageLayout>...</MinimalPageLayout>`

### Requirement: Bespoke NavBar removed

The lending app's previous bespoke navigation component SHALL be removed once the new shell is in place.

#### Scenario: NavBar files deleted
- **WHEN** the directory `frontend/src/components/` is listed
- **THEN** there SHALL be no `NavBar.tsx`, `NavBar.css`, or `NavBar.test.tsx` file
- **AND** no source file under `frontend/src/` SHALL import a component named `NavBar`
