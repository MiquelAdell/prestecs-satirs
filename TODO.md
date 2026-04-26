# TODO

## From internal meeting 26/04/2026 
- [ ] perfomance: API calls. check if we are requesting all games when we ask for a detail
- [ ] move all the lending/return functionality to the game single page 
- [ ] change https://test.refugiodelsatiro.es/prestecs/set-password/ to https://test.refugiodelsatiro.es/prestamos/set-password/
- [ ] review that the database doesn't get erased on a docker cycle
- [ ] non logged users should be able to see "borrowed" but not "borrowed by [username]" wherever this text appears
- [ ] review filters in the cataglog page
- [ ] change resend from miquel's account to a new refugio account
- [ ] invite refugio del sátiro to racknerd
- [ ] check if there is any service, other than resend and racknerd, with miquel's personal account
- [ ] create a github account for refugio

## Original deployment checklist (done — keep for reference)
- [x] Buy RackNerd VPS
- [x] Server initial setup (SSH keys, UFW, Docker)
- [x] `Dockerfile`, `docker-compose.yml`, `Caddyfile`
- [x] Deploy + automatic HTTPS via Caddy
- [x] Initial data import
- [x] GitHub Actions auto-deploy on push to `development`
- [x] Build the `/` home page (currently a WIP placeholder served by Caddy
      from `deploy/wip/`).

## Post-deploy hardening
- [ ] Set up a simple backup strategy for the SQLite database (cron + copy to local)
- [ ] Share the URL with club members for soft launch
