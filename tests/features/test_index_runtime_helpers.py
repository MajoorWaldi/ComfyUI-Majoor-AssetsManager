from pathlib import Path
from types import SimpleNamespace

from mjr_am_backend.features.index import index_runtime_helpers as irh
from mjr_am_backend.shared import Result


def test_record_refresh_outcome_updates_stats_and_enrich_list() -> None:
    called = {"n": 0}

    def _append_to_enrich(**kwargs):
        called["n"] += 1

    scanner = SimpleNamespace(_append_to_enrich=_append_to_enrich)
    stats = {"skipped": 0, "errors": 1}
    irh.record_refresh_outcome(
        scanner,
        stats=stats,
        fallback_mode=True,
        refreshed=True,
        entry={"filepath": "x"},
        to_enrich=[],
        respect_enrich_limit=True,
    )
    assert stats["skipped"] == 1
    assert stats["errors"] == 0
    assert called["n"] == 1


def test_record_index_entry_success_tracks_added_ids_when_not_fallback() -> None:
    scanner = SimpleNamespace(_append_to_enrich=lambda **kwargs: None)
    stats = {"added": 0}
    added_ids: list[int] = []
    irh.record_index_entry_success(
        scanner,
        stats=stats,
        fallback_mode=False,
        added_ids=added_ids,
        added_asset_id=12,
        entry={"filepath": "x"},
        action="added",
        to_enrich=[],
        respect_enrich_limit=True,
    )
    assert stats["added"] == 1
    assert added_ids == [12]


def test_entry_state_drifted_returns_false_when_no_file_path() -> None:
    assert not irh.entry_state_drifted(SimpleNamespace(), entry={}, stats={"skipped": 0})


def test_append_to_enrich_honors_flags_and_limits() -> None:
    scanner = SimpleNamespace(_max_to_enrich_items=1)
    target: list[str] = []
    irh.append_to_enrich(scanner, entry={"fast": True, "filepath": "a"}, to_enrich=target, respect_limit=True)
    irh.append_to_enrich(scanner, entry={"fast": True, "filepath": "b"}, to_enrich=target, respect_limit=True)
    assert target == ["a"]
    irh.append_to_enrich(scanner, entry={"fast": False, "filepath": "c"}, to_enrich=target, respect_limit=False)
    assert target == ["a"]


def test_maybe_store_entry_cache_noop_when_cache_disabled() -> None:
    # smoke branch: should return without touching MetadataHelpers
    scanner = SimpleNamespace(db=object())
    import asyncio

    asyncio.run(irh.maybe_store_entry_cache(scanner, entry={"cache_store": False}, metadata_result=Result.Ok({})))

