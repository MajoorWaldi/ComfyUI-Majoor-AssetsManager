from tests.repo_root import REPO_ROOT


def test_force_delete_emits_failed_status_on_delete_failed() -> None:
    p = REPO_ROOT / "mjr_am_backend" / "routes" / "handlers" / "db_maintenance.py"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert '"DELETE_FAILED"' in s
    assert '_emit_restore_status(' in s
    assert 'operation="delete_db"' in s


def test_force_delete_triggers_output_and_input_rescan() -> None:
    p = REPO_ROOT / "mjr_am_backend" / "routes" / "handlers" / "db_maintenance.py"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert 'scan_directory(base_path, recursive=True, incremental=False, source="output")' in s
    assert 'scan_directory(input_path, recursive=True, incremental=False, source="input")' in s


def test_status_dot_done_hint_respects_operation_type() -> None:
    p = REPO_ROOT / "js" / "features" / "status" / "StatusDot.js"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert 'const op = String(detail?.operation || "");' in s
    assert 'op === "delete_db"' in s
    assert 'op === "reset_index"' in s
