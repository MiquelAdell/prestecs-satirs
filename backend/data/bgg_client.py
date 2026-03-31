from __future__ import annotations

import time
import xml.etree.ElementTree as ET
from dataclasses import dataclass

import httpx


@dataclass(frozen=True)
class BggGame:
    bgg_id: int
    name: str
    thumbnail_url: str
    year_published: int


class BggClient:
    BASE_URL = "https://boardgamegeek.com/xmlapi2/collection"
    MAX_RETRIES = 5
    INITIAL_BACKOFF = 5.0

    def __init__(self, username: str) -> None:
        self._username = username

    def fetch_owned_games(self) -> list[BggGame]:
        url = f"{self.BASE_URL}?username={self._username}&own=1&stats=0"
        backoff = self.INITIAL_BACKOFF

        for attempt in range(self.MAX_RETRIES):
            response = httpx.get(url, timeout=30.0)

            if response.status_code == 200:
                return self._parse_collection(response.text)

            if response.status_code == 202:
                time.sleep(backoff)
                backoff *= 2
                continue

            response.raise_for_status()

        raise TimeoutError(
            f"BGG API did not return collection after {self.MAX_RETRIES} retries"
        )

    def _parse_collection(self, xml_text: str) -> list[BggGame]:
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
