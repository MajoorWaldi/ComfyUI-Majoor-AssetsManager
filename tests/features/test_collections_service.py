from pathlib import Path

from mjr_am_backend.features.collections import service as c


def test_collections_crud_and_add_remove(monkeypatch, tmp_path: Path):
    monkeypatch.setattr(c, "_MAX_COLLECTION_ITEMS", 3)
    monkeypatch.setattr(
        c,
        "_collection_path",
        lambda cid: (tmp_path / f"{cid}.json") if c._safe_id(cid) else None,
    )
    svc = c.CollectionsService(base_dir=tmp_path)

    created = svc.create("My Collection")
    assert created.ok
    cid = created.data["id"]

    listed = svc.list()
    assert listed.ok and listed.data

    got = svc.get(cid)
    assert got.ok and got.data["id"] == cid

    add = svc.add_assets(
        cid,
        [
            {"filepath": str(tmp_path / "a.png"), "filename": "a.png"},
            {"filepath": str(tmp_path / "a.png"), "filename": "a.png"},
            {"filepath": str(tmp_path / "b.png"), "filename": "b.png"},
            {"filepath": str(tmp_path / "c.png"), "filename": "c.png"},
            {"filepath": str(tmp_path / "d.png"), "filename": "d.png"},
        ],
    )
    assert add.ok
    assert add.data["added"] >= 3
    assert add.data["skipped_existing"] >= 1 or add.data["skipped_duplicate"] >= 1

    rem = svc.remove_filepaths(cid, [str(tmp_path / "a.png")])
    assert rem.ok and rem.data["removed"] >= 1

    deleted = svc.delete(cid)
    assert deleted.ok
    missing = svc.get(cid)
    assert missing.code == "NOT_FOUND"


def test_collections_invalid_inputs(tmp_path: Path):
    svc = c.CollectionsService(base_dir=tmp_path)
    assert not svc.create("").ok
    assert svc.get("bad").code == "INVALID_INPUT"
    assert svc.delete("bad").code == "INVALID_INPUT"
    assert svc.add_assets("bad", []).code == "INVALID_INPUT"
    assert svc.remove_filepaths("bad", []).code == "INVALID_INPUT"


def test_collections_user_scoped_base_dirs(tmp_path: Path):
    svc1 = c.CollectionsService(base_dir=tmp_path, user_id="user-one")
    svc2 = c.CollectionsService(base_dir=tmp_path, user_id="user-two")

    created1 = svc1.create("One")
    created2 = svc2.create("Two")

    assert created1.ok and created2.ok
    assert len(svc1.list().data or []) == 1
    assert len(svc2.list().data or []) == 1

    user_one_dir = c.collections_base_dir_for_user("user-one", base_dir=tmp_path)
    user_two_dir = c.collections_base_dir_for_user("user-two", base_dir=tmp_path)

    assert user_one_dir != user_two_dir
    assert list(user_one_dir.glob("*.json"))
    assert list(user_two_dir.glob("*.json"))
