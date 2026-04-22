"""Write scraper output to disk with diff guards."""

from __future__ import annotations

import hashlib
from pathlib import Path

from scraper.config import ScraperConfig
from scraper.manifest import Manifest, PageRecord, dump, load


class DeletionGuardError(RuntimeError):
    """Raised when a run would delete more pages than the safety ratio allows."""


def content_sha(content_html: str) -> str:
    return hashlib.sha256(content_html.encode("utf-8")).hexdigest()


def write_page(
    *,
    output_dir: Path,
    output_file: str,
    document_html: str,
) -> Path:
    target = output_dir / output_file
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(document_html, encoding="utf-8")
    return target


def purge_stale_files(
    *,
    output_dir: Path,
    new_pages: tuple[PageRecord, ...],
    previous_manifest: Manifest | None,
    config: ScraperConfig,
) -> tuple[list[str], list[str]]:
    """Delete pages that used to exist but are not in the new run.

    Returns `(deleted_files, skipped_protected_files)`. Raises
    `DeletionGuardError` if the deletion ratio would exceed the configured
    safety threshold.
    """
    if previous_manifest is None or not previous_manifest.pages:
        return [], []

    previous_files = {page.output_file for page in previous_manifest.pages}
    current_files = {page.output_file for page in new_pages}
    to_delete = previous_files - current_files

    if previous_files:
        ratio = len(to_delete) / len(previous_files)
        if ratio > config.max_page_deletion_ratio:
            raise DeletionGuardError(
                f"refusing to delete {len(to_delete)}/{len(previous_files)} pages "
                f"({ratio:.0%} > {config.max_page_deletion_ratio:.0%}); "
                f"re-run with --force-delete to override"
            )

    deleted: list[str] = []
    for rel in to_delete:
        target = output_dir / rel
        if target.is_file():
            target.unlink()
            deleted.append(rel)
            # Clean up now-empty parent directories, bottom-up.
            parent = target.parent
            while (
                parent != output_dir and parent.is_dir() and not any(parent.iterdir())
            ):
                parent.rmdir()
                parent = parent.parent
    return deleted, []


def write_manifest(output_dir: Path, manifest: Manifest, filename: str) -> Path:
    target = output_dir / filename
    dump(manifest, target)
    return target


def read_previous_manifest(output_dir: Path, filename: str) -> Manifest | None:
    return load(output_dir / filename)


def purge_orphan_assets(
    *, output_dir: Path, assets_subdir: str, manifest: Manifest
) -> list[str]:
    """Delete asset files not referenced by any page in the current manifest.

    The on-disk stylesheet is never purged. Returns the list of deleted
    filenames (without the asset-dir prefix).
    """
    assets_dir = output_dir / assets_subdir
    if not assets_dir.is_dir():
        return []
    referenced = {name for page in manifest.pages for name in page.asset_filenames}
    deleted: list[str] = []
    for entry in assets_dir.iterdir():
        if entry.is_file() and entry.name not in referenced:
            entry.unlink()
            deleted.append(entry.name)
    return deleted
