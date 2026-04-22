"""Extract the content region from a Google Sites page and strip chrome."""

from __future__ import annotations

from dataclasses import dataclass

from bs4 import BeautifulSoup, Tag

from scraper.config import (
    CONTENT_ROOT_SELECTOR,
    STRIP_SELECTORS_INSIDE_CONTENT,
)


@dataclass(frozen=True)
class StripResult:
    title: str
    content_html: str
    image_urls: tuple[str, ...]


class ContentExtractionError(RuntimeError):
    """Raised when a page's content region cannot be located."""


def parse_title(soup: BeautifulSoup) -> str:
    title_tag = soup.find("title")
    if title_tag and title_tag.text:
        raw = title_tag.text.strip()
        # Google Sites titles look like "El Refugio del Sátiro - Calendario".
        # Keep only the right-hand segment as the page-local title.
        for separator in (" - ", " — ", " | "):
            if separator in raw:
                return raw.split(separator, 1)[1].strip()
        return raw
    return ""


def _collect_image_urls(content_root: Tag) -> tuple[str, ...]:
    urls: list[str] = []
    for img in content_root.find_all("img"):
        src = img.get("src")
        if isinstance(src, str) and src:
            urls.append(src)
        srcset = img.get("srcset")
        if isinstance(srcset, str):
            # srcset is "url1 1x, url2 2x, …"; keep each URL.
            for entry in srcset.split(","):
                url = entry.strip().split(" ", 1)[0]
                if url:
                    urls.append(url)
    for node in content_root.find_all(style=True):
        style = node.get("style", "")
        if isinstance(style, str) and "url(" in style:
            for chunk in style.split("url("):
                candidate = chunk.split(")", 1)[0].strip().strip("'\"")
                if candidate.startswith("http"):
                    urls.append(candidate)
    # Preserve order, remove duplicates.
    seen: set[str] = set()
    ordered: list[str] = []
    for url in urls:
        if url not in seen:
            seen.add(url)
            ordered.append(url)
    return tuple(ordered)


def strip(html: str) -> StripResult:
    """Parse a raw Sites HTML page and return the cleaned content region."""
    soup = BeautifulSoup(html, "lxml")
    title = parse_title(soup)

    content_root = soup.select_one(CONTENT_ROOT_SELECTOR)
    if content_root is None:
        raise ContentExtractionError(
            f"no content region matching {CONTENT_ROOT_SELECTOR!r}"
        )

    for selector in STRIP_SELECTORS_INSIDE_CONTENT:
        for node in content_root.select(selector):
            node.decompose()

    image_urls = _collect_image_urls(content_root)

    # inner_html — children without the wrapping div itself.
    inner = "".join(str(child) for child in content_root.children)
    return StripResult(title=title, content_html=inner, image_urls=image_urls)
