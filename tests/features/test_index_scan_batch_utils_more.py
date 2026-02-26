from pathlib import Path

from mjr_am_backend.features.index import scan_batch_utils as s


def test_normalize_and_stream_batch_target(monkeypatch):
    monkeypatch.setattr(s, "IS_WINDOWS", True)
    out = s.normalize_filepath_str(r"C:\A\..\B\file.png")
    assert "file.png" in out.lower()
    assert s.stream_batch_target(0) >= 1
    assert s.stream_batch_target("bad") >= 1


def test_chunk_file_batches_and_hash_and_journal_helpers():
    files = [Path(f"a{i}.png") for i in range(25)]
    batches = list(s.chunk_file_batches(files))
    assert batches and sum(len(b) for b in batches) == 25
    assert list(s.chunk_file_batches([])) == []

    h1 = s.compute_state_hash("a.png", 1, 2)
    h2 = s.compute_state_hash("a.png", 1, 2)
    assert h1 == h2

    assert s.journal_state_hash({"journal_state_hash": "x"}) == "x"
    assert s.journal_state_hash(None) is None
    rows = [{"filepath": "a", "state_hash": "h"}, {"filepath": None, "state_hash": "z"}, "x"]
    assert s.journal_rows_to_map(rows) == {"a": "h"}
    assert s.clean_journal_lookup_paths(["a", "", None]) == ["a"]


def test_skip_incremental_drift_and_stats(tmp_path: Path):
    assert s.should_skip_by_journal(
        incremental=True,
        journal_state_hash="x",
        state_hash="x",
        fast=False,
        existing_id=2,
        has_rich_meta_set={2},
    )
    assert s.is_incremental_unchanged(
        {"existing_id": 1, "existing_mtime": 10, "mtime": 10},
        incremental=True,
    )

    fp = tmp_path / "a.txt"
    fp.write_text("x", encoding="utf-8")
    st = fp.stat()
    assert s.file_state_drifted(fp, st.st_mtime_ns, st.st_size) is False
    assert s.file_state_drifted(tmp_path / "missing", 1, 1) is True

    scan_stats = s.new_scan_stats()
    idx_stats = s.empty_index_stats()
    idx_stats2 = s.new_index_stats(9)
    assert scan_stats["scanned"] == 0
    assert idx_stats["start_time"]
    assert idx_stats2["scanned"] == 9


def test_prepared_filepath_helpers():
    prepared = [{"filepath": "a.png"}, {"file_path": "b.png"}, {}]
    assert s.prepared_filepath(prepared[0]) == "a.png"
    assert s.first_prepared_filepath(prepared) == "a.png"
    dup = [{"filepath": "A.png"}, {"filepath": "a.png"}]
    assert s.first_duplicate_filepath_in_batch(dup, is_windows=True).lower() == "a.png"


def test_stream_batch_target_covers_med_large_xl_ranges():
    """Lines 66-70 — covers MED, LARGE, and XL threshold branches."""
    from mjr_am_backend.config import (
        SCAN_BATCH_LARGE_THRESHOLD,
        SCAN_BATCH_MED_THRESHOLD,
        SCAN_BATCH_SMALL_THRESHOLD,
    )

    med_result = s.stream_batch_target(SCAN_BATCH_SMALL_THRESHOLD + 1)
    assert med_result >= 1

    large_result = s.stream_batch_target(SCAN_BATCH_MED_THRESHOLD + 1)
    assert large_result >= 1

    xl_result = s.stream_batch_target(SCAN_BATCH_LARGE_THRESHOLD + 1)
    assert xl_result >= 1


def test_chunk_file_batches_covers_med_large_xl_sizes():
    """Lines 82-87 — covers MED, LARGE, and XL batch_size branches."""
    from mjr_am_backend.config import (
        SCAN_BATCH_LARGE_THRESHOLD,
        SCAN_BATCH_MED_THRESHOLD,
        SCAN_BATCH_SMALL_THRESHOLD,
    )

    # MED branch
    med_files = [Path(f"m{i}.png") for i in range(SCAN_BATCH_SMALL_THRESHOLD + 1)]
    med_batches = list(s.chunk_file_batches(med_files))
    assert sum(len(b) for b in med_batches) == len(med_files)

    # LARGE branch
    large_files = [Path(f"l{i}.png") for i in range(SCAN_BATCH_MED_THRESHOLD + 1)]
    large_batches = list(s.chunk_file_batches(large_files))
    assert sum(len(b) for b in large_batches) == len(large_files)

    # XL branch
    xl_files = [Path(f"x{i}.png") for i in range(SCAN_BATCH_LARGE_THRESHOLD + 1)]
    xl_batches = list(s.chunk_file_batches(xl_files))
    assert sum(len(b) for b in xl_batches) == len(xl_files)


def test_clean_journal_lookup_paths_truncates_long_list():
    """Line 126 — list longer than MAX_SCAN_JOURNAL_LOOKUP is truncated."""
    long_list = [str(i) for i in range(s.MAX_SCAN_JOURNAL_LOOKUP + 100)]
    result = s.clean_journal_lookup_paths(long_list)
    assert len(result) == s.MAX_SCAN_JOURNAL_LOOKUP


def test_first_prepared_filepath_returns_none_when_all_empty():
    """Line 233 — all entries have empty filepath → returns None."""
    result = s.first_prepared_filepath([{}, {"filepath": ""}, {"file_path": ""}])
    assert result is None


def test_first_duplicate_filepath_skips_empty_and_returns_none_for_unique():
    """Lines 244, 249 — empty filepath skipped; unique paths → returns None."""
    # Line 244: continue for empty filepath
    # Line 249: return None when no duplicate found
    result = s.first_duplicate_filepath_in_batch(
        [{"filepath": ""}, {"filepath": "a.png"}, {"filepath": "b.png"}],
        is_windows=False,
    )
    assert result is None
