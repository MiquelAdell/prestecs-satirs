"""Tests for scraper/nav_extractor.py."""

from __future__ import annotations

from bs4 import BeautifulSoup

from scraper.nav_extractor import NavItem, extract_nav

# ---------------------------------------------------------------------------
# HTML fixtures
# ---------------------------------------------------------------------------

_HEADER_TEMPLATE = """\
<html><body>
<header id="atIdViewHeader">
  <nav id="yuynLe" class="JzO0Vc">
    <ul class="jYxBte Fpy8Db">
      {items}
    </ul>
  </nav>
</header>
</body></html>
"""

_ITEM = "<li><a href='{href}'>{label}</a></li>"


def _html(*items: tuple[str, str]) -> str:
    """Build a minimal header HTML with the given (label, href) pairs."""
    rendered = "\n      ".join(
        _ITEM.format(href=href, label=label) for label, href in items
    )
    return _HEADER_TEMPLATE.format(items=rendered)


def _parse(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "html.parser")


# Common fixture data
_INICIO = NavItem(label="Inicio", href="/")
_CALENDARIO = NavItem(label="Calendario", href="/calendario")
_EVENTOS = NavItem(label="Eventos", href="/eventos")
_PRESTAMOS = NavItem(label="Préstamos", href="/prestamos")
_PRESTAMOS_INFO = NavItem(label="Préstamos Info", href="/prestamos-info")

_HAPPY_HTML = _html(
    ("Inicio", "/"),
    ("Calendario", "/calendario"),
    ("Eventos", "/eventos"),
    ("Préstamos", "/prestamos"),
)
_HAPPY_EXPECTED = (_INICIO, _CALENDARIO, _EVENTOS)


class TestNavExtractor:
    # ------------------------------------------------------------------
    # Happy path
    # ------------------------------------------------------------------

    def test_happy_path_returns_non_prestamos_items_in_order(self) -> None:
        doc = _parse(_HAPPY_HTML)
        assert extract_nav(doc) == _HAPPY_EXPECTED

    # ------------------------------------------------------------------
    # Empty / missing header
    # ------------------------------------------------------------------

    def test_empty_nav_ul_returns_empty_tuple(self) -> None:
        doc = _parse(_HEADER_TEMPLATE.format(items=""))
        assert extract_nav(doc) == ()

    def test_missing_header_returns_empty_tuple(self) -> None:
        doc = _parse("<html><body><p>no header here</p></body></html>")
        assert extract_nav(doc) == ()

    def test_wrong_nav_id_returns_empty_tuple(self) -> None:
        html = """\
<html><body>
<header id="atIdViewHeader">
  <nav id="otherNav">
    <ul><li><a href="/inicio">Inicio</a></li></ul>
  </nav>
</header>
</body></html>"""
        doc = _parse(html)
        assert extract_nav(doc) == ()

    # ------------------------------------------------------------------
    # Skip rules
    # ------------------------------------------------------------------

    def test_fragment_only_href_excluded(self) -> None:
        doc = _parse(
            _html(
                ("Inicio", "/"),
                ("Jump", "#section-1"),
                ("Calendario", "/calendario"),
            )
        )
        assert extract_nav(doc) == (_INICIO, _CALENDARIO)

    def test_absolute_external_url_excluded(self) -> None:
        doc = _parse(
            _html(
                ("Inicio", "/"),
                ("External", "https://example.com/page"),
                ("Calendario", "/calendario"),
            )
        )
        assert extract_nav(doc) == (_INICIO, _CALENDARIO)

    def test_http_absolute_url_excluded(self) -> None:
        doc = _parse(
            _html(
                ("Inicio", "/"),
                ("External HTTP", "http://example.com/x"),
            )
        )
        assert extract_nav(doc) == (_INICIO,)

    def test_prestamos_exact_excluded(self) -> None:
        doc = _parse(_html(("Inicio", "/"), ("Préstamos", "/prestamos")))
        assert extract_nav(doc) == (_INICIO,)

    def test_prestamos_subpath_excluded(self) -> None:
        doc = _parse(
            _html(
                ("Inicio", "/"),
                ("Catálogo", "/prestamos/"),
                ("Mis préstamos", "/prestamos/my-loans"),
            )
        )
        assert extract_nav(doc) == (_INICIO,)

    def test_prestamos_info_boundary_kept(self) -> None:
        """'/prestamos-info' must NOT be excluded — exclusion is prefix-anchored."""
        doc = _parse(
            _html(
                ("Inicio", "/"),
                ("Préstamos Info", "/prestamos-info"),
                ("Préstamos", "/prestamos"),
            )
        )
        assert extract_nav(doc) == (_INICIO, _PRESTAMOS_INFO)

    # ------------------------------------------------------------------
    # Deduplication
    # ------------------------------------------------------------------

    def test_duplicate_items_deduplicated_first_wins(self) -> None:
        doc = _parse(
            _html(
                ("Inicio", "/"),
                ("Calendario", "/calendario"),
                ("Inicio", "/"),
            )
        )
        assert extract_nav(doc) == (_INICIO, _CALENDARIO)

    def test_same_href_different_labels_not_deduplicated(self) -> None:
        """Dedup key is (label, href). Same href + different label → two items."""
        item_a = NavItem(label="Home", href="/")
        item_b = NavItem(label="Inicio", href="/")
        doc = _parse(_html(("Home", "/"), ("Inicio", "/")))
        assert extract_nav(doc) == (item_a, item_b)
