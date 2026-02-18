from tests.repo_root import REPO_ROOT


def _read(path: str) -> str:
    p = REPO_ROOT / path
    return p.read_text(encoding="utf-8", errors="replace")


def test_custom_view_filepath_mode_is_allowlisted() -> None:
    s = _read("mjr_am_backend/routes/handlers/custom_roots.py")
    assert "_normalize_path(filepath)" in s
    assert "_is_path_allowed(candidate, must_exist=True)" in s
    assert "browser_mode" in s


def test_folder_info_filepath_mode_is_allowlisted() -> None:
    s = _read("mjr_am_backend/routes/handlers/custom_roots.py")
    assert "_is_path_allowed(normalized, must_exist=True)" in s
    assert "browser_mode" in s
    assert 'Result.Err("FORBIDDEN", "Path is not within allowed roots")' in s


def test_collections_mutations_have_csrf_and_write_access_guards() -> None:
    s = _read("mjr_am_backend/routes/handlers/collections.py")
    assert s.count("csrf = _csrf_error(request)") >= 4
    assert s.count("auth = _require_write_access(request)") >= 4


def test_settings_mutations_require_write_access() -> None:
    s = _read("mjr_am_backend/routes/handlers/health.py")
    assert "@routes.post(\"/mjr/am/settings/probe-backend\")" in s
    assert "@routes.post(\"/mjr/am/settings/metadata-fallback\")" in s
    assert s.count("auth = _require_write_access(request)") >= 4


def test_browser_folder_ops_require_csrf() -> None:
    s = _read("mjr_am_backend/routes/handlers/custom_roots.py")
    assert "@routes.post(\"/mjr/am/browser/folder-op\")" in s
    assert "csrf = _csrf_error(request)" in s
