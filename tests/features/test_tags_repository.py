"""Tests for the normalized TagsRepository (Phase 3.2)."""

from __future__ import annotations

import itertools

import pytest
from mjr_am_backend.adapters.db.migrations import MigrationRunner
from mjr_am_backend.adapters.db.migrations.registry import MIGRATIONS
from mjr_am_backend.data.repositories import TagsRepository

pytestmark = pytest.mark.asyncio

_seed_counter = itertools.count(1)


async def _setup(services):
    db = services["db"]
    result = await MigrationRunner(MIGRATIONS).run(db)
    assert result.ok, result.error
    return db, TagsRepository(db)


async def _seed_asset(db) -> int:
    """Insert a minimal row into ``assets`` and return its id."""
    # Discover required columns: just attempt insert with id; fall back to
    # rowid via auto-inc if needed. The schema's ``assets`` table has many
    # NOT NULL columns, so use INSERT with default-friendly query if any.
    cols = await db.aquery("PRAGMA table_info(assets)")
    assert cols.ok
    notnull_cols = [
        c["name"] for c in (cols.data or [])
        if c["notnull"] and c["dflt_value"] is None and c["name"] != "id"
    ]
    placeholders = ", ".join(["?"] * len(notnull_cols))
    col_list = ", ".join(notnull_cols)
    seq = next(_seed_counter)
    values = tuple(
        f"unique_{c}_{seq}" for c in notnull_cols
    )
    if notnull_cols:
        ins = await db.aexecute(
            f"INSERT INTO assets ({col_list}) VALUES ({placeholders})", values
        )
    else:
        ins = await db.aexecute("INSERT INTO assets DEFAULT VALUES")
    assert ins.ok, ins.error
    row = await db.aquery("SELECT last_insert_rowid() AS id")
    return int((row.data or [{"id": 1}])[0]["id"])


# ── ensure / get_by_name ──────────────────────────────────────────── #


async def test_ensure_creates_tag_idempotent(services) -> None:
    _db, repo = await _setup(services)
    first = await repo.ensure("Landscape")
    assert first.ok, first.error
    second = await repo.ensure("Landscape")
    assert second.ok and second.data.id == first.data.id

    count = await repo.count()
    assert count.data == 1


async def test_ensure_rejects_empty_name(services) -> None:
    _db, repo = await _setup(services)
    result = await repo.ensure("   ")
    assert not result.ok and result.code == "INVALID_INPUT"


async def test_get_by_name_case_insensitive(services) -> None:
    _db, repo = await _setup(services)
    await repo.ensure("Portrait")
    found = await repo.get_by_name("PORTRAIT")
    assert found.ok and found.data is not None
    assert found.data.name == "Portrait"


# ── attach / detach / list_for_asset ──────────────────────────────── #


async def test_attach_and_list_for_asset(services) -> None:
    db, repo = await _setup(services)
    asset_id = await _seed_asset(db)
    for tag in ("alpha", "beta", "gamma"):
        r = await repo.attach(asset_id, tag)
        assert r.ok, r.error
    # idempotent
    assert (await repo.attach(asset_id, "alpha")).ok

    listing = await repo.list_for_asset(asset_id)
    assert listing.ok
    assert [t.name for t in (listing.data or [])] == ["alpha", "beta", "gamma"]


async def test_detach_removes_link_only(services) -> None:
    db, repo = await _setup(services)
    asset_id = await _seed_asset(db)
    await repo.attach(asset_id, "removeme")
    await repo.attach(asset_id, "keepme")

    rm = await repo.detach(asset_id, "removeme")
    assert rm.ok

    remaining = await repo.list_for_asset(asset_id)
    assert [t.name for t in remaining.data] == ["keepme"]

    # Tag itself still exists in the canonical tags table
    still = await repo.get_by_name("removeme")
    assert still.ok and still.data is not None


async def test_list_assets_with_tag(services) -> None:
    db, repo = await _setup(services)
    a = await _seed_asset(db)
    b = await _seed_asset(db)
    await repo.attach(a, "shared")
    await repo.attach(b, "shared")
    await repo.attach(a, "only-a")

    shared = await repo.list_assets_with_tag("SHARED")
    assert shared.ok and sorted(shared.data) == sorted([a, b])

    only_a = await repo.list_assets_with_tag("only-a")
    assert only_a.ok and only_a.data == [a]


async def test_cascade_delete_on_asset_removes_links(services) -> None:
    db, repo = await _setup(services)
    asset_id = await _seed_asset(db)
    await repo.attach(asset_id, "ephemeral")

    deleted = await db.aexecute("DELETE FROM assets WHERE id = ?", (asset_id,))
    assert deleted.ok

    listing = await repo.list_for_asset(asset_id)
    assert listing.ok and listing.data == []
    # tag row itself is preserved
    tag = await repo.get_by_name("ephemeral")
    assert tag.ok and tag.data is not None
