# TODO

## From internal meeting 26/04/2026

Tracked as GitHub issues under parent #45 (site-wide shell).

In PR #46 (`feature/import-menu`):
- [ ] #47 — replace Catalan "Préstecs" remnants with "Préstamos"
- [ ] #48 — rotate chevron when Préstamos / drawer parent is open
- [ ] #49 — remove duplicate Catálogo entry under Préstamos
- [ ] #50 — move "Iniciar sesión" out of Préstamos submenu into header action
- [ ] #51 — redirect accented URLs (campañas → campanas) in dev mirror + Caddy
- [ ] #52 — validate site-shell-from-scraped-html tasks.md against commits

Follow-up (after PR #46 merges):
- [ ] #53 — integrate login page with site header / footer shell
- [ ] #54 — /prestamos → /prestamos/ redirect via Caddy exact-path whitelist

Not yet scoped:
- [ ] review filters in the catalog page

## Post-deploy hardening
- [ ] Set up a simple backup strategy for the SQLite database (cron + copy to local)
- [ ] Share the URL with club members for soft launch
