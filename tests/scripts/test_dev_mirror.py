"""Tests for the dev content-mirror wrapper.

Two layers:
  - drift test: the REDIRECTS map in scripts/dev_mirror.py covers every
    `redir <left> <right>` line in Caddyfile (excluding root-level redirects
    Caddy still serves but dev doesn't expose).
  - runtime test: spin up the MirrorHandler in-process and assert the
    accented (`campañas`) and percent-encoded (`campa%C3%B1as`) paths both
    return 301 → `/juegos-de-rol/campanas/`.
"""

from __future__ import annotations

import re
import threading
from http.client import HTTPConnection
from http.server import HTTPServer
from pathlib import Path
from urllib.parse import unquote

import pytest

from scripts.dev_mirror import REDIRECTS, MirrorHandler

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CADDYFILE = REPO_ROOT / "Caddyfile"


def _caddyfile_redirects() -> dict[str, str]:
    """Extract `redir <left> <right> [permanent]` pairs from the Caddyfile.

    Keys are the decoded source path so they match the dev wrapper's
    decoded-path lookup.
    """
    pattern = re.compile(r"^\s*redir\s+(\S+)\s+(\S+)(?:\s+\S+)?\s*$")
    pairs: dict[str, str] = {}
    for line in CADDYFILE.read_text().splitlines():
        match = pattern.match(line)
        if match is None:
            continue
        source, target = match.group(1), match.group(2)
        # Skip named-matcher redirects (e.g. `redir @needs_trailing_slash …`)
        # which are not literal path-to-path mappings.
        if source.startswith("@"):
            continue
        pairs[unquote(source)] = target
    return pairs


def test_dev_redirects_match_caddyfile_redirects() -> None:
    caddy = _caddyfile_redirects()
    assert REDIRECTS == caddy, (
        "scripts/dev_mirror.py REDIRECTS has drifted from Caddyfile. "
        f"Missing from dev: {set(caddy) - set(REDIRECTS)}; "
        f"extra in dev: {set(REDIRECTS) - set(caddy)}"
    )


@pytest.fixture
def mirror_server(tmp_path: Path):
    handler_cls = lambda *args, **kw: MirrorHandler(  # noqa: E731
        *args, directory=str(tmp_path), **kw
    )
    server = HTTPServer(("127.0.0.1", 0), handler_cls)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield server.server_address
    finally:
        server.shutdown()
        server.server_close()


@pytest.mark.parametrize(
    "request_path,expected_location",
    [
        ("/juegos-de-rol/campa%C3%B1as/", "/juegos-de-rol/campanas/"),
        ("/juegos-de-rol/campa%C3%B1as", "/juegos-de-rol/campanas"),
        ("/inicio", "/"),
        ("/inicio/", "/"),
        ("/socios/ludoteca", "/ludoteca"),
        ("/Validacion-Membresia", "/validacion"),
    ],
)
def test_mirror_handler_redirects(
    mirror_server: tuple[str, int], request_path: str, expected_location: str
) -> None:
    host, port = mirror_server
    conn = HTTPConnection(host, port)
    conn.request("GET", request_path)
    response = conn.getresponse()
    response.read()
    conn.close()
    assert response.status == 301
    assert response.getheader("Location") == expected_location
