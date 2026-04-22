"""Wrap extracted content in a minimal HTML shell."""

from __future__ import annotations

PAGE_TEMPLATE = """<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title_full}</title>
  <link rel="canonical" href="https://www.refugiodelsatiro.es{canonical_path}">
  <link rel="stylesheet" href="/_assets/content.css">
  <meta name="generator" content="refugio-del-satiro content scraper">
</head>
<body>
  <main class="content-page" data-content-path="{canonical_path}">
    {content_html}
  </main>
</body>
</html>
"""


def render_page(*, title: str, canonical_path: str, content_html: str) -> str:
    site_name = "Refugio del Sátiro"
    title_full = f"{title} — {site_name}" if title else site_name
    return PAGE_TEMPLATE.format(
        title_full=title_full,
        canonical_path=canonical_path,
        content_html=content_html,
    )
