from pathlib import Path

import pytest

from mjr_am_backend.routes.core import paths as p
from mjr_am_backend.routes.core import services as svc
from mjr_am_backend.shared import Result


def test_paths_allowlist_and_normalize(tmp_path: Path, monkeypatch) -> None:
    out = tmp_path / "out"
    inp = tmp_path / "in"
    out.mkdir()
    inp.mkdir()

    monkeypatch.setattr(p, "get_runtime_output_root", lambda: str(out))
    monkeypatch.setattr(p.folder_paths, "get_input_directory", lambda: str(inp))
    p._ALLOWED_DIRECTORIES = None

    allowed = p._get_allowed_directories()
    assert out.resolve() in allowed
    assert inp.resolve() in allowed

    f = out / "a.png"
    f.write_bytes(b"x")
    assert p._is_path_allowed(f, must_exist=True)
    assert not p._is_path_allowed(tmp_path / "other.txt", must_exist=False)


def test_path_helpers_and_media_type(tmp_path: Path, monkeypatch) -> None:
    root = tmp_path / "root"
    root.mkdir()
    media = root / "x.webp"
    media.write_bytes(b"x")

    assert p._path_relative_to(media.resolve(), root.resolve())
    assert not p._path_relative_to(tmp_path.resolve(), root.resolve())

    assert p._guess_content_type_for_file(media) == "image/webp"
    assert p._is_allowed_view_media_file(media)
    assert not p._is_allowed_view_media_file(root / "x.txt")

    monkeypatch.setattr(
        p,
        "list_custom_roots",
        lambda: Result.Ok([{"path": str(root)}]),
    )
    assert p._is_path_allowed_custom(media)


def test_safe_rel_and_within_root() -> None:
    rel = p._safe_rel_path("a/b")
    assert rel is not None

    assert p._normalize_path("") is None


@pytest.mark.asyncio
async def test_services_build_require_and_dispose(monkeypatch) -> None:
    class _Db:
        def __init__(self):
            self.closed = False

        async def aclose(self):
            self.closed = True

    db = _Db()

    async def _build_ok():
        return Result.Ok({"db": db, "x": 1})

    monkeypatch.setattr(svc, "build_services", _build_ok)
    svc._services = None
    svc._services_error = None

    built = await svc._build_services(force=False)
    assert isinstance(built, dict)
    assert built.get("x") == 1

    required, err = await svc._require_services()
    assert err is None
    assert required is not None

    await svc._dispose_services()
    assert db.closed


@pytest.mark.asyncio
async def test_services_build_failure_sets_error(monkeypatch) -> None:
    async def _build_fail():
        return Result.Err("SERVICE_UNAVAILABLE", "nope")

    monkeypatch.setattr(svc, "build_services", _build_fail)
    svc._services = None
    svc._services_error = None

    built = await svc._build_services(force=True)
    assert built is None
    assert svc.get_services_error()

    required, err = await svc._require_services()
    assert required is None
    assert err is not None
    assert err.code == "SERVICE_UNAVAILABLE"
