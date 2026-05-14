"""Extract top-level nav items from a scraped BeautifulSoup document.

Pure transform — no I/O. Input is a BeautifulSoup document that has already
been stripped and href-rewritten by the orchestrator. Output is a tuple of
NavItem instances in source order, with skip rules applied.

DOM selector rationale: `header#atIdViewHeader nav#yuynLe ul li > a`
  — `yuynLe` is the primary desktop nav `<nav>` inside the Google Sites header;
  its direct-child `<ul>` contains exactly the top-level items without the
  mobile overflow "Más" catch-all, making it the most stable flat-list source.
"""

from __future__ import annotations

from dataclasses import dataclass

from bs4 import BeautifulSoup
from bs4.element import Tag


@dataclass(frozen=True)
class NavItem:
    label: str
    href: str


_NAV_SELECTOR = "nav#yuynLe ul li > a"

# Absolute-URL prefixes that the extractor must reject.
_ABSOLUTE_PREFIXES = ("http://", "https://", "//")


def _should_skip(href: str) -> bool:
    """Return True for items that the shell owns or that are not navigable."""
    if not href or href.startswith("#"):
        return True
    if any(href.startswith(p) for p in _ABSOLUTE_PREFIXES):
        return True
    # Exclude /prestamos exactly or /prestamos/<anything> but NOT /prestamos-*.
    return href == "/prestamos" or href.startswith("/prestamos/")


def extract_nav(doc: BeautifulSoup) -> tuple[NavItem, ...]:
    """Return the top-level nav items from *doc*, with skip rules applied.

    Deduplicates by (label, href) keeping first occurrence and preserving
    source order. Returns an empty tuple if the nav container is absent or
    yields no valid items — never raises.
    """
    try:
        anchors = doc.select(_NAV_SELECTOR)
    except Exception:
        return ()

    seen: set[tuple[str, str]] = set()
    items: list[NavItem] = []
    for anchor in anchors:
        if not isinstance(anchor, Tag):
            continue
        href_raw = anchor.get("href")
        if not isinstance(href_raw, str):
            continue
        href = href_raw.strip()
        if _should_skip(href):
            continue
        label = anchor.get_text(strip=True)
        key = (label, href)
        if key in seen:
            continue
        seen.add(key)
        items.append(NavItem(label=label, href=href))

    return tuple(items)
