# TODO

## Rename follow-ups
- [ ] Investigate what `render.yaml` is for (we're not using Render today). Either
      remove it or bring it up to date. References still use the old names on
      purpose — don't edit piecemeal.
- [ ] Build the `/` home page (currently a WIP placeholder served by Caddy
      from `deploy/wip/`).

## Original deployment checklist (done — keep for reference)
- [x] Buy RackNerd VPS
- [x] Server initial setup (SSH keys, UFW, Docker)
- [x] `Dockerfile`, `docker-compose.yml`, `Caddyfile`
- [x] Deploy + automatic HTTPS via Caddy
- [x] Initial data import
- [x] GitHub Actions auto-deploy on push to `development`

## Post-deploy hardening
- [ ] Set up a simple backup strategy for the SQLite database (cron + copy to local)
- [ ] Share the URL with club members for soft launch
