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
