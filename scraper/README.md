# `scraper/` — Google Sites content mirror

A small Python tool that pulls every public page of
`www.refugiodelsatiro.es` (Google Sites), strips the Sites chrome, rewrites
internal links, rehosts images locally, and writes a static mirror to
`frontend/public/content-mirror/`. Caddy serves that directory at `/` so the
VPS looks and behaves like the Sites-hosted original, minus the Google
branding.

This is Decision 1 Option 1 from
`tasks/lending-redesign/decisions.md`. Editors keep editing Sites; we mirror
on a nightly cron plus an on-demand admin button.

## Run it

```bash
# Full scrape to frontend/public/content-mirror/
python -m scraper

# Dry run: walk + strip + show what would change, no writes, no downloads
python -m scraper run --dry-run

# Enumerate URLs only (what would be scraped)
python -m scraper list-urls

# Via the main CLI (equivalent)
refugio content run
refugio content list-urls
```

Exit code 2 indicates at least one page failed. Exit code 0 covers both the
"new content" and "nothing changed" cases (check `_manifest.json` for the
diff).

## What it emits

```
frontend/public/content-mirror/
├── _assets/
│   ├── content.css                 # Baseline stylesheet, bundled from scraper/template/
│   └── <content-sha1>.<ext>        # Re-hosted images (content-addressed, stable)
├── _manifest.json                  # Per-page hash + asset references
├── index.html                      # /
├── calendario/index.html           # /calendario
├── eventos/index.html              # /eventos
├── eventos/24h-mesa/index.html     # /eventos/24h-mesa
└── …                               # one folder per canonical path
```

Every page is wrapped in a minimal shell (`scraper/template.py`) that loads
`/_assets/content.css` and renders the extracted content inside
`<main class="content-page">`. The shell is deliberately bare — the real
nav/footer get layered in later by the React app / site-wide templates.

## How it works

`orchestrator.run()` ties the pipeline together:

1. **Enumerate** (`enumerator.py`). BFS from `/`, depth ≤ 4, following only
   same-host links. Skip `/inicio`, `/socios/ludoteca`,
   `/Validacion-Membresia` (handled by Caddy 301s). Assert every path in
   `config.REQUIRED_PATHS` was reached; force-add any that weren't. Source
   paths (with accents) are preserved separately from canonical paths
   (deaccented, lowercased).
2. **Fetch** (`fetcher.py`). `httpx.AsyncClient` with exponential-backoff
   retries on 5xx / network errors. No HTTP/2 (h2 not in deps; Sites serves
   fast enough over HTTP/1.1 for 19 pages).
3. **Strip** (`stripper.py`). Locate `div[jsname="ZBtY8b"]` — the Sites
   content shell — and keep only its subtree. Remove chrome leftovers
   (scripts, gstatic font links, Report-abuse widgets) defensively from
   inside that subtree. Return the inner HTML plus the set of referenced
   image URLs.
4. **Rehost assets** (`asset_fetcher.py`). For each image URL pointing at
   `googleusercontent.com` / `ggpht.com`, download once, save as
   `<content-sha1>.<ext>` under `_assets/`. Content-addressed so Sites'
   per-request URL rotation doesn't cause filename churn.
5. **Rewrite** (`orchestrator._process_content_html` + `linker.py`).
   `<a href>` pointing at our hosts → canonical relative path. External
   links → add `target="_blank" rel="noopener noreferrer"`. `<img src>` and
   `srcset` and inline `background-image: url(…)` → rehosted path.
6. **Write** (`writer.py`). Wrap in the template, write to the canonical
   output path. Update `_manifest.json`. Purge stale pages (guarded by a
   deletion-ratio safety net) and orphan assets.

## Extending

Add a new page → nothing to do; the BFS will find it. If the page is
mandatory (you want the scrape to fail loudly if Sites ever stops serving
it), add it to `REQUIRED_PATHS` in `scraper/config.py`.

Sites class names shifted and the stripper can't find content anymore →
update `CONTENT_ROOT_SELECTOR` in `scraper/config.py`. The inspection ritual:

```bash
# Fetch one page and look at its structure
curl -s -H "User-Agent: Mozilla/5.0" https://www.refugiodelsatiro.es/ > /tmp/home.html

# Look for the first div that wraps ALL page sections (header + footer stripped)
python -c "
import re
html = open('/tmp/home.html').read()
# Find candidate content wrappers
for pat in [r'jsname=\"([A-Za-z0-9_-]+)\"', r'role=\"main\"']:
    print(pat, set(m.group(0) for m in re.finditer(pat, html)))
"
```

Then set `CONTENT_ROOT_SELECTOR = 'div[jsname="<new-value>"]'`.

Add a host we want to rehost → add the substring to
`REHOSTED_IMAGE_HOST_SUBSTRINGS` in `scraper/config.py`.

## Triggers

- **CLI**: `python -m scraper` locally.
- **Admin button**: `POST /api/admin/content/resync` (admin-only) in the
  React app. Streams progress via SSE at
  `GET /api/admin/content/events`. The button writes to the VPS
  `content-cache` volume that Caddy serves — it does **not** touch the git
  checkout. Only the nightly cron commits.
- **GitHub Actions cron**: `.github/workflows/content-sync.yml` runs at
  03:17 UTC daily, commits any diff to `development`, which triggers
  `deploy.yml` and re-seeds the VPS cache from the newly-committed copy.
  Also available as `workflow_dispatch` from the GitHub Actions tab.

Until the nightly cron is in place on GitHub (requires the
`CONTENT_SYNC_PAT` repo secret), run `python -m scraper` locally and
commit manually.

## Known gotchas

- **Per-request image URLs.** Google Sites rotates `googleusercontent.com`
  URLs per fetch. We content-address assets so the files-on-disk set is
  stable across runs.
- **Calendar iframe.** `/calendario` embeds Google Calendar; the iframe is
  preserved. That means loading the page sets Google cookies. A cookie
  banner is a separate task (listed in `TODO.md`).
- **Nonces.** Sites embeds `nonce="…"` in dozens of `<script>` tags on
  every response. They change per request and would produce a no-op commit
  every run — but we strip `<script>` before hashing, so page content
  hashes are stable and idempotent re-runs write nothing.
- **Deletion guard.** If more than 50 % of previously mirrored pages would
  disappear in a single run, the writer aborts. Pass
  `python -m scraper run --force-delete` to override — e.g. if Sites
  legitimately removed many pages at once.
- **Accented URLs.** `/juegos-de-rol/campañas` is mirrored at
  `/juegos-de-rol/campanas`. Caddy 301s the accented form.
- **Asset cache not pruned across runs.** Orphan assets (referenced by no
  page in the new manifest) are deleted on every run, so `_assets/` stays
  tidy.
- **Every run re-downloads every image**, because we need to hash the
  content to know the filename. Cheap for ~170 images; would need tuning
  if the site grows an order of magnitude.
