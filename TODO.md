# TODO

## From internal meeting 26/04/2026 
- [ ] perfomance: API calls. check if we are requesting all games when we ask for a detail
- [ ] move all the lending/return functionality to the game single page 
- [ ] non logged users should be able to see "borrowed" but not "borrowed by [username]" wherever this text appears
- [ ] review filters in the cataglog page
- [ ] check if there is any service, other than resend and racknerd, with miquel's personal account
- [ ] create a github account for refugio
- [ ] Move login anchor in the menu out of catalogo/prestamos
- [ ] fix the confusion between catalogo/prestamos
- [ ] Improve the presentation of the login page (maybe integrate with the header and footer?)
- [ ] /prestamos still has some "préstecs" in the header
- [ ] fix the chevron
- [ ] fix campañas
- [ ] The original request — /prestamos → /prestamos/ redirect — was not implemented. My first attempt broke Vite's internal request routing, and I reverted everything. A whitelist-only middleware approach (only matching exact paths /prestamos, /inicio, etc.) is the right direction; just needs to be retried once the blank-page issue above is understood. Worth adding to TODO if you want it tracked.
- [ ] Validate openspec/changes/site-shell-from-scraped-html/tasks.md against actual commits — that was the next step flagged in memory before merge.


## Post-deploy hardening
- [ ] Set up a simple backup strategy for the SQLite database (cron + copy to local)
- [ ] Share the URL with club members for soft launch
