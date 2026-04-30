from __future__ import annotations

from pathlib import Path

from aiohttp.test_utils import make_mocked_request
from mjr_am_backend.features.assets.download_service import (
    is_preview_download_request,
    resolve_download_path,
    strip_tags_for_ext,
)
from mjr_am_backend.features.assets.rating_tags_service import (
    normalize_tags_payload,
    parse_rating_value,
    sanitize_tags,
)


def test_download_service_preview_and_strip_helpers(tmp_path: Path) -> None:
    request = make_mocked_request("GET", "/mjr/am/download?preview=true")
    assert is_preview_download_request(request) is True

    file_path = tmp_path / "asset.avif"
    file_path.write_bytes(b"x")
    resolved = resolve_download_path(
        str(file_path),
        normalize_path=lambda value: Path(value) if value else None,
        is_resolved_path_allowed=lambda _path: True,
        logger=type("_Logger", (), {"debug": staticmethod(lambda *_args, **_kwargs: None)})(),
    )
    assert isinstance(resolved, Path)
    assert strip_tags_for_ext(".avif")


def test_rating_tag_service_sanitizers() -> None:
    assert normalize_tags_payload('["A", "B"]') == ["A", "B"]
    assert parse_rating_value("7").data == 5
    sanitized = sanitize_tags(["Tag", "tag", "Clean\x00"], max_tag_length=32, max_tags_per_asset=5)
    assert sanitized.ok is True
    assert sanitized.data == ["Tag", "Clean"]
