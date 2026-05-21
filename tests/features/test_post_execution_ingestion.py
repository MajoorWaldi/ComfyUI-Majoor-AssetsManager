from pathlib import Path

import pytest
from mjr_am_backend.adapters.comfy_core import PromptOutputFile
from mjr_am_backend.features.runtime import post_execution as mod
from mjr_am_backend.shared import Result


class _DB:
    def __init__(self):
        self.executed = []

    async def aexecute(self, sql, params=(), **_kwargs):
        self.executed.append((sql, params))
        return Result.Ok(1)


class _Index:
    def __init__(self):
        self.db = _DB()
        self.calls = []

    async def index_paths(self, paths, **kwargs):
        self.calls.append((paths, kwargs))
        return Result.Ok({"added": len(paths), "added_ids": [1]})


@pytest.mark.asyncio
async def test_ingest_prompt_outputs_indexes_existing_paths_and_assigns_job(monkeypatch, tmp_path: Path):
    output = tmp_path / "out"
    output.mkdir()
    file_path = output / "a.png"
    file_path.write_bytes(b"x")
    index = _Index()
    events = []

    monkeypatch.setattr(
        mod,
        "get_prompt_output_files",
        lambda _prompt_id: [
            PromptOutputFile(
                path=str(file_path),
                node_id="7",
                node_type="SaveImage",
                item_type="output",
            )
        ],
    )
    monkeypatch.setattr(mod, "fetch_by_job_id", lambda _prompt_id: _async_result([]))
    monkeypatch.setattr(mod, "get_runtime_output_root", lambda: str(output))

    def _send_event(event, data):
        events.append((event, data))
        return True

    monkeypatch.setattr(mod, "send_event", _send_event)

    result = await mod.ingest_prompt_outputs(index, "prompt-1")

    assert result.ok
    assert index.calls
    assert index.calls[0][0] == [file_path.resolve(strict=False)]
    assert index.calls[0][1]["base_dir"] == str(output.resolve(strict=False))
    assert index.calls[0][1]["incremental"] is True
    assert index.calls[0][1]["source"] == "output"
    assert index.db.executed
    assert index.db.executed[0][1][0] == "prompt-1"
    assert index.db.executed[0][1][1] == "7"
    assert index.db.executed[0][1][2] == "SaveImage"
    assert events[0][0] == "mjr-core-execution-assets-ready"
    assert events[0][1]["indexed"] == 1


@pytest.mark.asyncio
async def test_ingest_prompt_outputs_no_files_emits_empty_ready(monkeypatch):
    events = []

    monkeypatch.setattr(mod, "get_prompt_output_files", lambda _prompt_id: [])
    monkeypatch.setattr(mod, "fetch_by_job_id", lambda _prompt_id: _async_result([]))

    def _send_event(event, data):
        events.append((event, data))
        return True

    monkeypatch.setattr(mod, "send_event", _send_event)

    result = await mod.ingest_prompt_outputs(_Index(), "prompt-2")

    assert result.ok
    assert result.data["indexed"] == 0
    assert events == [("mjr-core-execution-assets-ready", {"prompt_id": "prompt-2", "indexed": 0, "paths": []})]


class _CoreRef:
    def __init__(self, file_path):
        self.file_path = file_path


async def _async_result(value):
    return value


@pytest.mark.asyncio
async def test_ingest_prompt_outputs_falls_back_to_core_assets(monkeypatch, tmp_path: Path):
    output = tmp_path / "out"
    output.mkdir()
    file_path = output / "core.png"
    file_path.write_bytes(b"x")
    index = _Index()
    events = []

    monkeypatch.setattr(mod, "get_prompt_output_files", lambda _prompt_id: [])
    monkeypatch.setattr(mod, "fetch_by_job_id", lambda _prompt_id: _async_result([_CoreRef(str(file_path))]))
    monkeypatch.setattr(mod, "get_runtime_output_root", lambda: str(output))

    def _send_event(event, data):
        events.append((event, data))
        return True

    monkeypatch.setattr(mod, "send_event", _send_event)

    result = await mod.ingest_prompt_outputs(index, "prompt-core")

    assert result.ok
    assert index.calls[0][0] == [file_path.resolve(strict=False)]
    assert index.db.executed[0][1][0] == "prompt-core"
    assert events[0][1]["indexed"] == 1
