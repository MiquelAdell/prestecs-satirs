# lending-catalog-redesign Specification

## Purpose

Defines the catalog browsing surface of the lending UI: the cover-first
`GameCard`, the side-panel + chip-row filter layout (with mobile bottom
sheet), the accessible Radix-backed player-range slider, the redesigned
`GameDetailPage` with a prominent Borrow CTA, and the public read-only
catalog mounted at `/ludoteca`. Built on top of the `lending-design-system`
primitives (Phase A) without introducing a CSS or component framework.

The borrow-with-return-date flow and the `MyLoansPage` rebuild are owned by
the `lending-borrow-return-flow` capability — not this one.

## ADDED Requirements

### Requirement: Player-range slider backed by `@radix-ui/react-slider`

The system SHALL implement the player-range slider as a `RangeSlider`
primitive under `frontend/src/ui/RangeSlider/` that wraps
`@radix-ui/react-slider` and exposes label, formatted value display,
and a tuple `value` / `onValueChange` API.

#### Scenario: RangeSlider primitive exists
- **WHEN** the source tree is inspected
- **THEN** `frontend/src/ui/RangeSlider/RangeSlider.tsx` SHALL exist
- **AND** it SHALL import `Root`, `Track`, `Range`, `Thumb` from
  `@radix-ui/react-slider`
- **AND** the component SHALL accept props
  `min`, `max`, `step?`, `value`, `onValueChange`, `label`, `formatValue?`

#### Scenario: Slider exposes labelled handles
- **WHEN** `RangeSlider` renders with `label="Jugadores"`
- **THEN** the visible label `Jugadores` SHALL appear above the track
- **AND** each `Thumb` SHALL be reachable by `Tab` and emit a focus ring

### Requirement: Filter layout breakpoint at `1024 px`

The system SHALL render the catalog filter panel as a fixed left column
when the viewport is at least `1024 px` wide and as a bottom-sheet
`Dialog` opened by a `Filtros` button when the viewport is narrower.

#### Scenario: Desktop layout
- **WHEN** the viewport width is `≥ 1024 px`
- **THEN** the page SHALL render with `grid-template-columns: 240px 1fr`
- **AND** the filter panel SHALL be visible without user action
- **AND** the catalog grid SHALL render to the right of the panel

#### Scenario: Mobile layout
- **WHEN** the viewport width is `< 1024 px`
- **THEN** the filter panel SHALL be hidden behind a `Filtros` button
- **AND** clicking the button SHALL open a `Dialog` styled as a bottom
  sheet (anchored to the bottom edge, full viewport width, max-height
  `85vh`)
- **AND** the bottom sheet SHALL trap focus, dismiss on `Escape`, and
  return focus to the `Filtros` button when closed

### Requirement: Active filters render as removable chips

The system SHALL render one `Chip` per non-default filter value above the
catalog grid, with a close affordance on each chip that resets the
matching filter to its default.

#### Scenario: Chip per non-default filter
- **WHEN** the catalog state has `filter = "available"`, `playerRange =
  [2, 4]`, `timePreset = "30to60"`, and all other filters at defaults
- **THEN** the chip row SHALL render exactly three chips with labels
  `Disponibles`, `2–4 jugadores`, `30–60 min`
- **AND** chips for filters at defaults SHALL NOT render

#### Scenario: Removing a filter via its chip resets the filter
- **WHEN** the user clicks the close affordance on the `Disponibles` chip
- **THEN** the catalog state SHALL transition `filter` to `"all"`
- **AND** the chip SHALL disappear from the chip row
- **AND** the catalog grid SHALL re-render with previously-filtered cards
  visible again

#### Scenario: Empty state hides the chip row
- **WHEN** every filter is at its default value
- **THEN** the chip row SHALL render zero chips
- **AND** the chip row container SHALL not occupy vertical space (or it
  SHALL render `null`)

### Requirement: Game-card mode prop controls action visibility

The system SHALL accept a `mode: "member" | "public"` prop on `GameCard`,
where `"public"` suppresses every action button regardless of game state
or auth state.

#### Scenario: Public mode hides action buttons
- **WHEN** `GameCard` renders with `mode="public"` for any game
- **THEN** no `Tomar prestado` button SHALL be present
- **AND** no `Devolver` button SHALL be present
- **AND** the cover, badges, title, and metadata SHALL still render

#### Scenario: Member mode renders action buttons by state
- **WHEN** `GameCard` renders with `mode="member"`, an authenticated
  member, and an available game
- **THEN** a `Tomar prestado` `Button` with `variant="primary"` SHALL
  render in the card footer

### Requirement: Public catalog detected by URL mount

The system SHALL detect the public mount synchronously at app startup by
reading `window.location.pathname` before mounting the React Router, and
SHALL configure the router with `basename="/ludoteca"` and a single
catalog route in `mode="public"` for that mount.

#### Scenario: Public mount detection
- **WHEN** the document loads at a URL whose pathname starts with
  `/ludoteca`
- **THEN** the React Router `basename` SHALL be `"/ludoteca"`
- **AND** the only registered route SHALL render `<CatalogPage
  mode="public" />`
- **AND** none of `GameDetailPage`, `MyLoansPage`, `LoginPage`,
  `ForgotPasswordPage`, `SetPasswordPage`, `AdminMembersPage`,
  `AdminContentPage` SHALL be registered for that mount

#### Scenario: Member mount detection
- **WHEN** the document loads at a URL whose pathname does not start with
  `/ludoteca`
- **THEN** the React Router `basename` SHALL be `"/prestamos"`
- **AND** the full member route table SHALL be registered with the
  catalog route mounted as `<CatalogPage mode="member" />`

#### Scenario: Login link uses absolute path across basenames
- **WHEN** the public catalog renders and the user clicks the
  `Iniciar sesión` link
- **THEN** the navigation SHALL target `/prestamos/login` as an absolute
  path (HTML anchor, not React Router `Link`)

### Requirement: Vite dev server serves the SPA at `/ludoteca`

The Vite dev server SHALL serve the SPA's `index.html` for any request
under `/ludoteca` so the public mount can be exercised in development
without Caddy.

#### Scenario: Dev middleware returns the SPA
- **WHEN** the dev server receives a `GET /ludoteca/` request
- **THEN** it SHALL respond with the contents of `frontend/index.html`
- **AND** the response `content-type` SHALL be `text/html`

#### Scenario: Dev middleware does not interfere with assets or API
- **WHEN** the dev server receives a request whose path starts with
  `/prestamos/api/` or `/_assets/` or otherwise does not start with
  `/ludoteca`
- **THEN** the request SHALL pass through to Vite's default handling
