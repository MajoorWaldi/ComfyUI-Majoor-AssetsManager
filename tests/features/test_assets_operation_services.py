from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

import pytest

from mjr_am_backend.features.assets.delete_service import delete_asset_and_cleanup
from mjr_am_backend.features.assets.models import AssetDeleteTarget, AssetRenameTarget
from mjr_am_backend.features.assets.rename_service import rename_asset_and_sync
from mjr_am_backend.shared import Result


class _DB:
    def __init__(self) -> None:
        self.executed: list[tuple[str, tuple]] = []
        self.query_result = Result.Ok([])

    @asynccontextmanager
    async def atransaction(self, mode="immediate"):
        self.executed.append(("TRANSACTION", (mode,)))
        yield

    async def aexecute(self, sql, params=()):
        self.executed.append((sql, tuple(params)))
        return Result.Ok(1)

    async def aquery(self, sql, params=()):
        self.executed.append((sql, tuple(params)))
        return self.query_result


class _Index:
    def __init__(self) -> None:
        self.calls: list[tuple] = []

    async def index_paths(self, *args):
        self.calls.append(args)
        return Result.Ok({})


@pytest.mark.asyncio
async def test_delete_asset_and_cleanup_removes_file_and_db_rows(tmp_path: Path):
    file_path = tmp_path / "asset.png"
    file_path.write_bytes(b"x")
    db = _DB()
    target = AssetDeleteTarget(
        services={"db": db},
        matched_asset_id=7,
        resolved_path=file_path,
        filepath_where="filepath IN (?) OR filepath = ? COLLATE NOCASE",
        filepath_params=(str(file_path), str(file_path)),
    )

    result = await delete_asset_and_cleanup(
        services={"db": db},
        target=target,
        delete_file_safe=lambda path: Result.Ok(path.unlink() is None),
        safe_error_message=lambda exc, default: f"{default}: {exc}",
    )

    assert result.ok is True
    assert file_path.exists() is False
    assert any("DELETE FROM assets WHERE id = ?" in sql for sql, _ in db.executed)


@pytest.mark.asyncio
async def test_rename_asset_and_sync_updates_file_db_and_reindex(tmp_path: Path):
    old_path = tmp_path / "old.png"
    old_path.write_bytes(b"x")
    db = _DB()
    db.query_result = Result.Ok([{"id": 1, "filename": "new.png"}])
    index = _Index()
    target = AssetRenameTarget(
        services={"db": db, "index": index},
        matched_asset_id=1,
        current_resolved=old_path,
        current_filename="old.png",
        current_source="output",
        current_root_id="",
        filepath_where="filepath IN (?) OR filepath = ? COLLATE NOCASE",
        filepath_params=(str(old_path), str(old_path)),
        new_name="new.png",
    )

    result = await rename_asset_and_sync(
        services={"db": db, "index": index},
        target=target,
        infer_source_and_root_id_from_path=lambda *args, **kwargs: _raise_not_used(),
        is_within_root=lambda _p, _r: True,
        get_runtime_output_root=lambda: str(tmp_path),
        get_input_directory=lambda: str(tmp_path / "in"),
        list_custom_roots=lambda: [],
        to_thread_timeout_s=5,
        safe_error_message=lambda exc, default: f"{default}: {exc}",
    )

    assert result.ok is True
    assert (tmp_path / "new.png").exists() is True
    assert old_path.exists() is False
    assert any("UPDATE assets SET filename = ?, filepath = ?, mtime = ? WHERE id = ?" in sql for sql, _ in db.executed)
    assert len(index.calls) == 1


def _raise_not_used():
    raise AssertionError("should not be called")