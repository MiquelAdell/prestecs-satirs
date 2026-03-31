from __future__ import annotations

import re
import time
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from html import unescape

import httpx


@dataclass(frozen=True)
class BggGame:
    bgg_id: int
    name: str
    thumbnail_url: str
    year_published: int


_BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


class BggClient:
    XML_API_URL = "https://boardgamegeek.com/xmlapi2/collection"
    WEB_URL = "https://boardgamegeek.com/collection/user"
    MAX_RETRIES = 5
    INITIAL_BACKOFF = 5.0

    def __init__(self, username: str) -> None:
        self._username = username

    def fetch_owned_games(self) -> list[BggGame]:
        """Try XML API first, fall back to HTML scraping if blocked."""
        games = self._try_xml_api()
        if games is not None:
            return games
        return self._scrape_collection_page()

    def _try_xml_api(self) -> list[BggGame] | None:
        url = f"{self.XML_API_URL}?username={self._username}&own=1&stats=0"
        backoff = self.INITIAL_BACKOFF

        for attempt in range(self.MAX_RETRIES):
            try:
                response = httpx.get(url, timeout=30.0)
            except httpx.HTTPError:
                return None

            if response.status_code == 200:
                return self._parse_xml_collection(response.text)

            if response.status_code == 202:
                time.sleep(backoff)
                backoff *= 2
                continue

            # API is blocking us (401, 403, etc.) — fall back
            return None

        return None

    def _scrape_collection_page(self) -> list[BggGame]:
        """Scrape the BGG collection HTML page as a fallback."""
        games: list[BggGame] = []
        page = 1

        while True:
            url = (
                f"{self.WEB_URL}/{self._username}"
                f"?subtype=boardgame&own=1&ff=1&pageID={page}"
            )
            response = httpx.get(url, headers=_BROWSER_HEADERS, timeout=30.0, follow_redirects=True)
            response.raise_for_status()

            page_games = self._parse_html_collection(response.text)
            if not page_games:
                break

            games.extend(page_games)
            page += 1

            # Safety limit
            if page > 50:
                break

        return games

    def _parse_html_collection(self, html: str) -> list[BggGame]:
        """Parse games from the BGG collection HTML table."""
        games: list[BggGame] = []

        # Find all rows with game links: /boardgame/12345/game-name
        game_pattern = re.compile(
            r'href="/boardgame/(\d+)[^"]*"[^>]*>\s*([^<]+)</a>',
        )
        # Thumbnail pattern
        thumb_pattern = re.compile(
            r'<img[^>]+src="(https://cf\.geekdo-images\.com/[^"]+)"[^>]*/?>',
        )
        # Year pattern — typically in parentheses like (2017)
        year_pattern = re.compile(r'\((\d{4})\)')

        # Split by table rows to associate data
        rows = re.split(r'<tr\s', html)

        for row in rows:
            game_match = game_pattern.search(row)
            if not game_match:
                continue

            bgg_id = int(game_match.group(1))
            name = unescape(game_match.group(2).strip())

            thumb_match = thumb_pattern.search(row)
            thumbnail = thumb_match.group(1) if thumb_match else ""

            year_match = year_pattern.search(row)
            year = int(year_match.group(1)) if year_match else 0

            games.append(BggGame(
                bgg_id=bgg_id,
                name=name,
                thumbnail_url=thumbnail,
                year_published=year,
            ))

        return games

    def _parse_xml_collection(self, xml_text: str) -> list[BggGame]:
        root = ET.fromstring(xml_text)
        games: list[BggGame] = []

        for item in root.findall("item"):
            bgg_id = int(item.get("objectid", "0"))
            name_el = item.find("name")
            thumb_el = item.find("thumbnail")
            year_el = item.find("yearpublished")

            name = name_el.text if name_el is not None and name_el.text else "Unknown"
            thumbnail = thumb_el.text if thumb_el is not None and thumb_el.text else ""
            year = int(year_el.text) if year_el is not None and year_el.text else 0

            games.append(BggGame(
                bgg_id=bgg_id,
                name=name,
                thumbnail_url=thumbnail,
                year_published=year,
            ))

        return games
