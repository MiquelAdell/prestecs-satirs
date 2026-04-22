"""Configuration for the content-mirror scraper.

Isolates site-specific selectors and URL rules so when Google Sites renames a
class or we rearrange output, only this module needs to change.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

# Origin we scrape. No trailing slash.
SOURCE_ORIGIN = "https://www.refugiodelsatiro.es"

# Canonical list of paths we must always emit, in the canonical form used by
# our Caddy routing table. The enumerator treats this as both a seed and a
# post-crawl assertion — any missing page is fetched explicitly.
REQUIRED_PATHS: tuple[str, ...] = (
    "/",
    "/calendario",
    "/juegos-de-rol",
    "/juegos-de-rol/campanas",
    "/juegos-de-rol/oneshots",
    "/juegos-de-mesa",
    "/juegos-de-mesa/dias-de-juegos",
    "/eventos",
    "/eventos/diurnes-satir",
    "/eventos/festa-major",
    "/eventos/24h-mesa",
    "/faq",
    "/faq/normas-de-conducta",
    "/socios",
    "/socios/entidades-amigas",
)

# Paths we refuse to scrape. They either duplicate content (/inicio) or are
# slated for replacement by our own React routes and redirected in Caddy.
SKIP_PATHS: frozenset[str] = frozenset(
    {
        "/inicio",
        "/socios/ludoteca",
        "/validacion-membresia",
    }
)

# Content-shell selector. The new-Google-Sites markup wraps every page's
# content sections in a single `<div jsname="ZBtY8b">`. The site chrome
# (header nav, "Report abuse" trailer, Google Sites menu) lives outside it.
CONTENT_ROOT_SELECTOR = 'div[jsname="ZBtY8b"]'

# Safety-net selectors we remove from inside the extracted content tree. They
# should not appear under the content root on today's pages — if a future
# Sites template change starts rendering them there, these keep our output
# clean without waiting for a code change.
STRIP_SELECTORS_INSIDE_CONTENT: tuple[str, ...] = (
    'header[role="banner"]',
    "nav",
    '[aria-label="Report abuse"]',
    '[aria-label="Reporta un abús"]',
    'a[href*="sites.google.com/abuse"]',
    '[jsname="bN97Pc"]',  # cookie banner (JS-injected, but defensive)
    '[role="menuitem"][aria-label="Report abuse"]',
    "script",
    "noscript",
    'link[href*="fonts.gstatic.com"]',
    'link[href*="fonts.googleapis.com"]',
    'iframe[src*="accounts.google.com"]',
    'iframe[src*="gstatic.com/atari/embeds"]',
)

# Host patterns we rehost locally (images + background-image urls).
REHOSTED_IMAGE_HOST_SUBSTRINGS: tuple[str, ...] = (
    "googleusercontent.com",
    "ggpht.com",
    "gstatic.com/images",
)

# Redirect rules written into Caddy. Maps an old path to the canonical one.
REDIRECTS: tuple[tuple[str, str], ...] = (
    ("/inicio", "/"),
    ("/inicio/", "/"),
    ("/socios/ludoteca", "/ludoteca"),
    ("/socios/ludoteca/", "/ludoteca"),
    ("/Validacion-Membresia", "/validacion"),
    ("/Validacion-Membresia/", "/validacion"),
    ("/juegos-de-rol/campa%C3%B1as", "/juegos-de-rol/campanas"),
    ("/juegos-de-rol/campañas", "/juegos-de-rol/campanas"),
)


@dataclass(frozen=True)
class ScraperConfig:
    """Runtime knobs. Immutable; call replace() to override in tests."""

    origin: str = SOURCE_ORIGIN
    output_dir: Path = field(
        default_factory=lambda: Path("frontend/public/content-mirror")
    )
    assets_subdir: str = "_assets"
    manifest_file: str = "_manifest.json"
    user_agent: str = (
        "refugio-del-satiro-content-scraper/0.1 "
        "(+https://github.com/MiquelAdell/refugio-del-satiro)"
    )
    request_timeout_s: float = 30.0
    max_retries: int = 3
    concurrent_requests: int = 5
    max_crawl_depth: int = 4
    # If a run deletes more than this fraction of previously emitted pages,
    # the writer aborts the run. Guard against a Sites outage wiping the
    # mirror in a single sweep.
    max_page_deletion_ratio: float = 0.5


def default_config() -> ScraperConfig:
    return ScraperConfig()
