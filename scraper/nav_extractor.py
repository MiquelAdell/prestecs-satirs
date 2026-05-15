"""Extract top-level nav items from a scraped BeautifulSoup document.

Pure transform — no I/O. Input is a BeautifulSoup document that has already
been stripped and href-rewritten by the orchestrator. Output is a tuple of
NavItem instances in source order, with skip rules applied.

DOM rationale: the live Google Sites header renders the primary desktop nav
as `<nav id="yuynLe"> > <ul> > <li> > <div> > <a>`. Each top-level `<li>` is
a direct child of the first `<ul>` inside the nav and contains the
top-level anchor as its first descendant `<a>` (later anchors inside the
same `<li>` are L2 submenu items, which we deliberately drop — the new
shell is flat at the top level). The mobile overflow `<nav id="WDxLfe">`
catch-all is ignored.
"""

from __future__ import annotations

from dataclasses import dataclass

from bs4 import BeautifulSoup
from bs4.element import Tag


@dataclass(frozen=True)
class NavItem:
    label: str
    href: str


_PRIMARY_NAV_ID = "yuynLe"

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


def _top_level_anchor(li: Tag) -> tuple[str, str] | None:
    """First descendant anchor of *li* as a (label, href) pair, or None."""
    anchor = li.find("a")
    if not isinstance(anchor, Tag):
        return None
    href_raw = anchor.get("href")
    if not isinstance(href_raw, str):
        return None
    return (anchor.get_text(strip=True), href_raw.strip())


def _top_level_items(doc: BeautifulSoup) -> tuple[tuple[str, str], ...]:
    """Return (label, href) pairs for top-level `<li>`s in the primary nav."""
    nav = doc.find("nav", id=_PRIMARY_NAV_ID)
    if not isinstance(nav, Tag):
        return ()
    top_ul = nav.find("ul", recursive=False)
    if not isinstance(top_ul, Tag):
        return ()
    candidates = (
        _top_level_anchor(li)
        for li in top_ul.find_all("li", recursive=False)
        if isinstance(li, Tag)
    )
    return tuple(pair for pair in candidates if pair is not None)


def _dedupe(pairs: tuple[tuple[str, str], ...]) -> tuple[tuple[str, str], ...]:
    """Deduplicate (label, href) pairs preserving first-seen order."""
    seen: set[tuple[str, str]] = set()
    return tuple(
        pair for pair in pairs if not (pair in seen or seen.add(pair))  # type: ignore[func-returns-value]
    )


def extract_nav(doc: BeautifulSoup) -> tuple[NavItem, ...]:
    """Return the top-level nav items from *doc*, with skip rules applied.

    Deduplicates by (label, href) keeping first occurrence and preserving
    source order. Returns an empty tuple if the nav container is absent or
    yields no valid items — never raises.
    """
    try:
        pairs = _top_level_items(doc)
    except Exception:
        return ()
    kept = tuple(pair for pair in pairs if not _should_skip(pair[1]))
    return tuple(NavItem(label=label, href=href) for label, href in _dedupe(kept))
