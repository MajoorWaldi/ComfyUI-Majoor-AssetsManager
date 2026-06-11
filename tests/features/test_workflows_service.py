import json
import sqlite3

from mjr_am_backend.features.workflows import (
    delete_workflow,
    duplicate_workflow,
    list_workflow_thumbnail_candidates,
    list_workflows,
    mark_workflow_loaded,
    move_or_rename_workflow,
    read_workflow_content,
    save_workflow,
    set_workflow_favorite,
    set_workflow_tags,
    set_workflow_thumbnail,
)
from mjr_am_backend.features.workflows import service as workflows_service
from mjr_am_backend.shared import Result


def test_list_workflows_discovers_env_directory(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    workflow_path = workflow_dir / "qwen_i2v_demo.json"
    workflow_path.write_text(
        json.dumps(
            {
                "name": "Qwen I2V Demo",
                "nodes": [
                    {"id": 1, "type": "LoadImage"},
                    {"id": 2, "type": "QwenImageToVideo"},
                ],
                "links": [],
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))

    result = list_workflows(query="qwen_i2v_demo", limit=10)

    assert result.ok
    assets = result.data["assets"]
    assert len(assets) == 1
    assert assets[0]["kind"] == "workflow"
    assert assets[0]["task"] == "I2V"
    assert assets[0]["model_family"] == "Qwen"
    assert assets[0]["source"] == "workflow"


def test_read_workflow_content_rejects_paths_outside_workflow_roots(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    outside = tmp_path / "outside.json"
    outside.write_text(json.dumps({"nodes": []}), encoding="utf-8")
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))

    result = read_workflow_content(outside)

    assert not result.ok
    assert result.code == "FORBIDDEN"


def test_read_workflow_content_returns_allowed_json(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    workflow_path = workflow_dir / "demo.json"
    workflow_path.write_text(json.dumps({"nodes": [{"id": 1, "type": "KSampler"}]}), encoding="utf-8")
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))

    result = read_workflow_content(workflow_path)

    assert result.ok
    assert result.data["workflow"]["nodes"][0]["type"] == "KSampler"


def test_save_duplicate_move_delete_workflow(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))

    saved = save_workflow(
        workflow={"name": "Demo", "nodes": [{"id": 1, "type": "LoadImage"}]},
        name="demo",
        category="I2I/Qwen",
    )
    assert saved.ok
    saved_path = workflow_dir / "I2I" / "Qwen" / "demo.json"
    assert saved_path.exists()

    duplicated = duplicate_workflow(saved_path)
    assert duplicated.ok
    duplicate_path = duplicated.data["filepath"]
    assert duplicate_path.endswith(".json")

    moved = move_or_rename_workflow(saved_path, name="renamed", category="T2V")
    assert moved.ok
    moved_path = workflow_dir / "T2V" / "renamed.json"
    assert moved_path.exists()
    assert not saved_path.exists()

    deleted = delete_workflow(moved_path)
    assert deleted.ok
    assert not moved_path.exists()


def test_move_workflow_same_target_is_noop(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))

    saved = save_workflow(
        workflow={"name": "Noop", "nodes": [{"id": 1, "type": "LoadImage"}]},
        name="noop",
        category="I2I",
    )
    assert saved.ok
    workflow_path = workflow_dir / "I2I" / "noop.json"

    moved = move_or_rename_workflow(workflow_path, name="noop", category="I2I")

    assert moved.ok
    assert moved.data["moved"] is False
    assert moved.data["filepath"] == str(workflow_path)
    assert workflow_path.exists()
    assert not list((workflow_dir / "I2I").glob("noop-*.json"))


def test_delete_workflow_rejects_read_only_template_root(monkeypatch, tmp_path):
    managed_dir = tmp_path / "managed"
    template_dir = tmp_path / "example_workflows"
    template_dir.mkdir()
    template = template_dir / "template.json"
    template.write_text(json.dumps({"nodes": []}), encoding="utf-8")
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(managed_dir))

    result = delete_workflow(template)

    assert not result.ok
    assert result.code == "FORBIDDEN"
    assert template.exists()


def test_list_workflows_exposes_metadata_fields(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    workflow_path = workflow_dir / "with_meta.json"
    workflow_path.write_text(
        json.dumps(
            {
                "name": "With Meta",
                "nodes": [{"id": 1, "type": "KSampler"}],
                "favorite": True,
                "usage_count": 7,
                "last_loaded_at": 1710001234,
                "missing_nodes": ["NodeA"],
                "missing_models": ["ModelA"],
                "tags": ["cinematic", "seedance"],
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))

    result = list_workflows(query="with meta", limit=10)

    assert result.ok
    asset = result.data["assets"][0]
    assert asset["favorite"] is True
    assert asset["usage_count"] == 7
    assert asset["last_loaded_at"] == 1710001234
    assert asset["missing_nodes_count"] == 1
    assert asset["missing_models_count"] == 1
    assert set(asset["tags"]) == {"cinematic", "seedance"}


def test_list_workflows_supports_usage_and_last_loaded_sort(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    (workflow_dir / "a.json").write_text(
        json.dumps(
            {
                "name": "A",
                "nodes": [{"id": 1, "type": "KSampler"}],
                "usage_count": 2,
                "last_loaded_at": 10,
            }
        ),
        encoding="utf-8",
    )
    (workflow_dir / "b.json").write_text(
        json.dumps(
            {
                "name": "B",
                "nodes": [{"id": 1, "type": "KSampler"}],
                "usage_count": 9,
                "last_loaded_at": 30,
            }
        ),
        encoding="utf-8",
    )
    (workflow_dir / "c.json").write_text(
        json.dumps(
            {
                "name": "C",
                "nodes": [{"id": 1, "type": "KSampler"}],
                "usage_count": 1,
                "last_loaded_at": 20,
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))
    monkeypatch.setattr(workflows_service, "workflow_roots", lambda: [workflow_dir])

    by_usage = list_workflows(sort="usage_count", limit=10)
    assert by_usage.ok
    assert [row["display_name"] for row in by_usage.data["assets"]][:3] == ["B", "A", "C"]

    by_last_loaded = list_workflows(sort="last_loaded_at", limit=10)
    assert by_last_loaded.ok
    assert [row["display_name"] for row in by_last_loaded.data["assets"]][:3] == ["B", "C", "A"]


def test_list_workflows_workflow_default_prioritizes_favorite(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    (workflow_dir / "fav.json").write_text(
        json.dumps(
            {
                "name": "Fav",
                "nodes": [{"id": 1, "type": "KSampler"}],
                "favorite": True,
                "usage_count": 1,
                "last_loaded_at": 1,
            }
        ),
        encoding="utf-8",
    )
    (workflow_dir / "regular.json").write_text(
        json.dumps(
            {
                "name": "Regular",
                "nodes": [{"id": 1, "type": "KSampler"}],
                "favorite": False,
                "usage_count": 99,
                "last_loaded_at": 99,
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))
    monkeypatch.setattr(workflows_service, "workflow_roots", lambda: [workflow_dir])

    result = list_workflows(sort="workflow_default", limit=10)

    assert result.ok
    assert [row["display_name"] for row in result.data["assets"]][:2] == ["Fav", "Regular"]


def test_mark_workflow_loaded_increments_usage_and_timestamp(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    index_db = tmp_path / "index.sqlite"
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))
    monkeypatch.setattr(workflows_service, "get_runtime_index_db_path", lambda: index_db)

    saved = save_workflow(
        workflow={"name": "Load Me", "nodes": [{"id": 1, "type": "KSampler"}]},
        name="load-me",
    )
    assert saved.ok
    workflow_path = workflow_dir / "load-me.json"
    original = workflow_path.read_text(encoding="utf-8")

    first = mark_workflow_loaded(workflow_path)
    assert first.ok
    assert first.data["usage_count"] == 1
    assert first.data["last_loaded_at"] > 0
    assert workflow_path.read_text(encoding="utf-8") == original

    second = mark_workflow_loaded(workflow_path)
    assert second.ok
    assert second.data["usage_count"] == 2
    assert second.data["last_loaded_at"] >= first.data["last_loaded_at"]
    assert workflow_path.read_text(encoding="utf-8") == original


def test_mark_workflow_loaded_rejects_non_managed_path(monkeypatch, tmp_path):
    managed_dir = tmp_path / "workflows"
    outside = tmp_path / "outside.json"
    outside.write_text(json.dumps({"nodes": []}), encoding="utf-8")
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(managed_dir))

    result = mark_workflow_loaded(outside)

    assert not result.ok
    assert result.code == "FORBIDDEN"


def test_set_workflow_favorite_persists_flag(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    index_db = tmp_path / "index.sqlite"
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))
    monkeypatch.setattr(workflows_service, "get_runtime_index_db_path", lambda: index_db)

    saved = save_workflow(
        workflow={"name": "Fav Me", "nodes": [{"id": 1, "type": "KSampler"}]},
        name="fav-me",
    )
    assert saved.ok
    workflow_path = workflow_dir / "fav-me.json"
    original = workflow_path.read_text(encoding="utf-8")

    fav_on = set_workflow_favorite(workflow_path, favorite=True)
    assert fav_on.ok
    assert fav_on.data["favorite"] is True
    assert workflow_path.read_text(encoding="utf-8") == original

    listed = list_workflows(query="fav me", limit=10)
    assert listed.ok
    assert listed.data["assets"][0]["favorite"] is True

    fav_off = set_workflow_favorite(workflow_path, favorite=False)
    assert fav_off.ok
    assert fav_off.data["favorite"] is False
    assert workflow_path.read_text(encoding="utf-8") == original


def test_set_workflow_favorite_rejects_non_managed_path(monkeypatch, tmp_path):
    managed_dir = tmp_path / "workflows"
    outside = tmp_path / "outside.json"
    outside.write_text(json.dumps({"nodes": []}), encoding="utf-8")
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(managed_dir))

    result = set_workflow_favorite(outside, favorite=True)

    assert not result.ok
    assert result.code == "FORBIDDEN"


def test_set_workflow_tags_persists_list(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    index_db = tmp_path / "index.sqlite"
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))
    monkeypatch.setattr(workflows_service, "get_runtime_index_db_path", lambda: index_db)

    saved = save_workflow(
        workflow={"name": "Tag Me", "nodes": [{"id": 1, "type": "KSampler"}]},
        name="tag-me",
    )
    assert saved.ok
    workflow_path = workflow_dir / "tag-me.json"
    original = workflow_path.read_text(encoding="utf-8")

    tagged = set_workflow_tags(workflow_path, tags=["cinematic", "flux"])
    assert tagged.ok
    assert tagged.data["tags"] == ["cinematic", "flux"]
    assert workflow_path.read_text(encoding="utf-8") == original

    listed = list_workflows(query="tag me", limit=10)
    assert listed.ok
    assert listed.data["assets"][0]["tags"] == ["cinematic", "flux"]


def test_list_workflow_thumbnail_candidates_returns_linked_outputs(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    workflow_path = workflow_dir / "candidate-workflow.json"
    workflow_path.write_text(
        json.dumps({"id": "wf-candidate-1", "name": "Candidate", "nodes": [{"id": 1, "type": "KSampler"}]}),
        encoding="utf-8",
    )

    output_dir = tmp_path / "output"
    output_dir.mkdir()
    linked_image = output_dir / "candidate.png"
    linked_image.write_bytes(b"PNG")

    index_dir = tmp_path / "index"
    index_dir.mkdir()
    index_db = index_dir / "assets.sqlite"
    with sqlite3.connect(index_db) as conn:
        conn.execute("CREATE TABLE assets (id INTEGER PRIMARY KEY, filepath TEXT, filename TEXT, subfolder TEXT, mtime INTEGER, size INTEGER, kind TEXT, workflow_id TEXT)")
        conn.execute("CREATE TABLE asset_metadata (asset_id INTEGER PRIMARY KEY, workflow_hash TEXT)")
        conn.execute(
            "INSERT INTO assets(id, filepath, filename, subfolder, mtime, size, kind, workflow_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (1, str(linked_image), "candidate.png", "", 999, 3, "image", "wf-candidate-1"),
        )
        conn.execute("INSERT INTO asset_metadata(asset_id, workflow_hash) VALUES (?, ?)", (1, ""))
        conn.commit()

    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))
    monkeypatch.setattr("mjr_am_backend.features.workflows.service.get_runtime_index_db_path", lambda: index_db)

    result = list_workflow_thumbnail_candidates(workflow_path, limit=10)

    assert result.ok
    assert len(result.data) == 1
    assert result.data[0]["filepath"] == str(linked_image)
    assert result.data[0]["thumbnail_url"].startswith("/mjr/am/download?filepath=")


def test_set_workflow_thumbnail_copies_linked_asset(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    workflow_path = workflow_dir / "thumb-workflow.json"
    workflow_path.write_text(json.dumps({"name": "Thumb Workflow", "nodes": [{"id": 1, "type": "KSampler"}]}), encoding="utf-8")

    source = tmp_path / "source.png"
    source.write_bytes(b"PNGDATA")
    stale = workflow_path.with_suffix(".jpg")
    stale.write_bytes(b"OLD")

    index_db = tmp_path / "index.sqlite"
    with sqlite3.connect(index_db) as conn:
        conn.execute("CREATE TABLE assets (id INTEGER PRIMARY KEY, filepath TEXT, filename TEXT, subfolder TEXT, mtime INTEGER, size INTEGER, kind TEXT, workflow_id TEXT)")
        conn.execute("CREATE TABLE asset_metadata (asset_id INTEGER PRIMARY KEY, workflow_hash TEXT)")
        conn.execute(
            "INSERT INTO assets(id, filepath, filename, subfolder, mtime, size, kind, workflow_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (1, str(source), "source.png", "", 999, 7, "image", ""),
        )
        conn.execute("INSERT INTO asset_metadata(asset_id, workflow_hash) VALUES (?, ?)", (1, workflows_service._workflow_hash(workflow_path)))
        conn.commit()

    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))
    monkeypatch.setattr(workflows_service, "get_runtime_index_db_path", lambda: index_db)

    result = set_workflow_thumbnail(workflow_path, source_filepath=str(source))

    assert result.ok
    target = workflow_path.with_suffix(".png")
    assert target.exists()
    assert target.read_bytes() == b"PNGDATA"
    assert not stale.exists()


def test_set_workflow_thumbnail_rejects_unlinked_local_file(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    workflow_path = workflow_dir / "thumb-workflow.json"
    workflow_path.write_text(json.dumps({"name": "Thumb Workflow", "nodes": [{"id": 1, "type": "KSampler"}]}), encoding="utf-8")
    source = tmp_path / "secret.png"
    source.write_bytes(b"PNGDATA")
    index_db = tmp_path / "index.sqlite"

    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))
    monkeypatch.setattr(workflows_service, "get_runtime_index_db_path", lambda: index_db)

    result = set_workflow_thumbnail(workflow_path, source_filepath=str(source))

    assert not result.ok
    assert result.code == "FORBIDDEN"
    assert not workflow_path.with_suffix(".png").exists()


def test_set_workflow_thumbnail_accepts_output_image_asset(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    workflow_path = workflow_dir / "output-thumb.json"
    workflow_path.write_text(json.dumps({"name": "Output Thumb", "nodes": [{"id": 1, "type": "KSampler"}]}), encoding="utf-8")
    output_dir = tmp_path / "output"
    output_dir.mkdir()
    source = output_dir / "selected.png"
    source.write_bytes(b"OUTPUTPNG")

    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))
    monkeypatch.setattr(workflows_service, "get_runtime_index_db_path", lambda: tmp_path / "index.sqlite")
    monkeypatch.setattr(workflows_service, "get_output_directory", lambda: str(output_dir))

    result = set_workflow_thumbnail(workflow_path, source_filepath=str(source))

    assert result.ok
    assert workflow_path.with_suffix(".png").read_bytes() == b"OUTPUTPNG"
    assert result.data["converted"] is False


def test_set_workflow_thumbnail_converts_output_video_to_webp(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    workflow_path = workflow_dir / "video-thumb.json"
    workflow_path.write_text(json.dumps({"name": "Video Thumb", "nodes": [{"id": 1, "type": "KSampler"}]}), encoding="utf-8")
    output_dir = tmp_path / "output"
    output_dir.mkdir()
    source = output_dir / "selected.mp4"
    source.write_bytes(b"VIDEO")

    def fake_convert(_source, target):
        target.write_bytes(b"WEBP")
        return Result.Ok({"target": str(target)})

    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))
    monkeypatch.setattr(workflows_service, "get_runtime_index_db_path", lambda: tmp_path / "index.sqlite")
    monkeypatch.setattr(workflows_service, "get_output_directory", lambda: str(output_dir))
    monkeypatch.setattr(workflows_service, "_convert_video_to_workflow_thumbnail", fake_convert)

    result = set_workflow_thumbnail(workflow_path, source_filepath=str(source))

    assert result.ok
    assert workflow_path.with_suffix(".webp").read_bytes() == b"WEBP"
    assert result.data["converted"] is True
    assert result.data["max_video_seconds"] == 5


def test_list_workflows_uses_linked_output_thumbnail_from_workflow_id(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    workflow_path = workflow_dir / "linked-thumb.json"
    workflow_path.write_text(
        json.dumps({"id": "wf-thumb-1", "name": "Linked Thumb", "nodes": [{"id": 1, "type": "KSampler"}]}),
        encoding="utf-8",
    )

    output_dir = tmp_path / "output"
    output_dir.mkdir()
    linked_image = output_dir / "linked.png"
    linked_image.write_bytes(b"PNG")

    index_dir = tmp_path / "index"
    index_dir.mkdir()
    index_db = index_dir / "assets.sqlite"
    with sqlite3.connect(index_db) as conn:
        conn.execute("CREATE TABLE assets (id INTEGER PRIMARY KEY, filepath TEXT, workflow_id TEXT, mtime INTEGER)")
        conn.execute("CREATE TABLE asset_metadata (asset_id INTEGER PRIMARY KEY, workflow_hash TEXT)")
        conn.execute(
            "INSERT INTO assets(id, filepath, workflow_id, mtime) VALUES (?, ?, ?, ?)",
            (1, str(linked_image), "wf-thumb-1", 999),
        )
        conn.execute("INSERT INTO asset_metadata(asset_id, workflow_hash) VALUES (?, ?)", (1, ""))
        conn.commit()

    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))
    monkeypatch.setattr(workflows_service, "get_runtime_index_db_path", lambda: index_db)

    result = list_workflows(query="linked thumb", limit=10)

    assert result.ok
    asset = result.data["assets"][0]
    assert asset["thumbnail_path"] == str(linked_image)
    assert asset["thumbnail_url"].startswith("/mjr/am/download?filepath=")
    assert "preview=1" in asset["thumbnail_url"]


def test_list_workflows_uses_linked_output_thumbnail_from_workflow_hash(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    workflow_path = workflow_dir / "hash-linked.json"
    workflow_path.write_text(
        json.dumps({"name": "Hash Linked", "nodes": [{"id": 1, "type": "KSampler"}]}),
        encoding="utf-8",
    )

    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))

    first = list_workflows(query="hash linked", limit=10)
    assert first.ok
    workflow_hash = first.data["assets"][0]["workflow_hash"]

    output_dir = tmp_path / "output"
    output_dir.mkdir()
    linked_image = output_dir / "hash-linked.jpg"
    linked_image.write_bytes(b"JPG")

    index_dir = tmp_path / "index"
    index_dir.mkdir()
    index_db = index_dir / "assets.sqlite"
    with sqlite3.connect(index_db) as conn:
        conn.execute("CREATE TABLE assets (id INTEGER PRIMARY KEY, filepath TEXT, workflow_id TEXT, mtime INTEGER)")
        conn.execute("CREATE TABLE asset_metadata (asset_id INTEGER PRIMARY KEY, workflow_hash TEXT)")
        conn.execute(
            "INSERT INTO assets(id, filepath, workflow_id, mtime) VALUES (?, ?, ?, ?)",
            (2, str(linked_image), "", 1001),
        )
        conn.execute("INSERT INTO asset_metadata(asset_id, workflow_hash) VALUES (?, ?)", (2, workflow_hash))
        conn.commit()

    monkeypatch.setattr(workflows_service, "get_runtime_index_db_path", lambda: index_db)

    second = list_workflows(query="hash linked", limit=10)

    assert second.ok
    asset = second.data["assets"][0]
    assert asset["thumbnail_path"] == str(linked_image)
    assert asset["thumbnail_url"].startswith("/mjr/am/download?filepath=")


def test_list_workflows_exposes_graph_map_thumbnail_fallback(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    workflow_path = workflow_dir / "graph-map.json"
    workflow_path.write_text(json.dumps({"name": "Graph Map", "nodes": [{"id": 1, "type": "KSampler"}]}), encoding="utf-8")

    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))

    result = list_workflows(query="graph map", limit=10)

    assert result.ok
    asset = result.data["assets"][0]
    assert asset["thumbnail_path"] == ""
    assert asset["animated_thumbnail_path"] == ""
    assert asset["graph_map_thumbnail_url"].startswith("/mjr/am/workflows/graph-map-thumbnail?filepath=")


def test_list_workflow_model_families_returns_indexed_families(monkeypatch, tmp_path):
    workflow_dir = tmp_path / "workflows"
    workflow_dir.mkdir()
    (workflow_dir / "flux.json").write_text(
        json.dumps({"name": "Flux Demo", "model_family": "Flux", "nodes": [{"id": 1, "type": "KSampler"}]}),
        encoding="utf-8",
    )
    (workflow_dir / "wan.json").write_text(
        json.dumps({"name": "Wan Demo", "model_family": "Wan", "nodes": [{"id": 1, "type": "KSampler"}]}),
        encoding="utf-8",
    )
    monkeypatch.setenv("MJR_AM_WORKFLOW_DIRECTORY", str(workflow_dir))
    monkeypatch.setattr(workflows_service, "workflow_roots", lambda: [workflow_dir])

    result = workflows_service.list_workflow_model_families()

    assert result.ok
    values = [row["value"] for row in result.data["model_families"]]
    assert values == ["Flux", "Wan"]
