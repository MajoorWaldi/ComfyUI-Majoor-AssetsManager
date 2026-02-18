from tests.repo_root import REPO_ROOT


def _read(path: str) -> str:
    p = REPO_ROOT / path
    return p.read_text(encoding="utf-8", errors="replace")


def test_custom_view_filepath_mode_is_allowlisted() -> None:
    s = _read("mjr_am_backend/routes/handlers/custom_roots.py")
    assert "_normalize_path(filepath)" in s
    assert "_is_path_allowed(candidate, must_exist=True)" in s
    assert "browser_mode" in s
    assert "_is_loopback_request(request)" in s
    assert "or browser_mode" not in s


def test_folder_info_filepath_mode_is_allowlisted() -> None:
    s = _read("mjr_am_backend/routes/handlers/custom_roots.py")
    assert "_is_path_allowed(normalized, must_exist=True)" in s
    assert "browser_mode" in s
    assert "_is_loopback_request(request)" in s
    assert "or browser_mode" not in s
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


def test_browse_folder_requires_csrf() -> None:
    s = _read("mjr_am_backend/routes/handlers/custom_roots.py")
    assert "@routes.post(\"/mjr/sys/browse-folder\")" in s
    assert "csrf = _csrf_error(request)" in s


def test_browser_folder_ops_are_root_confined() -> None:
    s = _read("mjr_am_backend/routes/handlers/custom_roots.py")
    assert "_is_path_allowed(source, must_exist=True)" in s
    assert "_is_path_allowed_custom(source)" in s
    assert "_is_path_allowed(dest_dir, must_exist=True)" in s
    assert "_is_path_allowed_custom(dest_dir)" in s


def test_browser_folder_delete_is_not_recursive_by_default() -> None:
    s = _read("mjr_am_backend/routes/handlers/custom_roots.py")
    assert 'recursive = bool(body.get("recursive", False))' in s


def test_rate_limit_avoids_shared_overflow_bucket() -> None:
    s = _read("mjr_am_backend/routes/core/security.py")
    assert "_RATE_LIMIT_OVERFLOW_CLIENT_ID" not in s
    assert "_rate_limit_state.popitem(last=False)" in s
