import mjr_am_shared.version as version_mod


def test_get_version_info_marks_nightly_when_branch_env_is_nightly(monkeypatch):
    monkeypatch.setattr(version_mod, "_find_pyproject_version", lambda: "2.3.3")
    monkeypatch.setattr(version_mod, "_resolve_branch_from_env", lambda: "nightly")
    monkeypatch.setattr(version_mod, "_resolve_branch_from_git", lambda: "")
    monkeypatch.setattr(version_mod, "_run_git", lambda _args: "")

    info = version_mod.get_version_info()
    assert info["version"] == "nightly"
    assert info["branch"] == "nightly"


def test_get_version_info_marks_nightly_when_git_branch_is_nightly(monkeypatch):
    monkeypatch.setattr(version_mod, "_find_pyproject_version", lambda: "2.3.3")
    monkeypatch.setattr(version_mod, "_resolve_branch_from_env", lambda: "")
    monkeypatch.setattr(version_mod, "_resolve_branch_from_git", lambda: "nightly")
    monkeypatch.setattr(version_mod, "_run_git", lambda _args: "")

    info = version_mod.get_version_info()
    assert info["version"] == "nightly"
    assert info["branch"] == "nightly"


def test_get_version_info_keeps_stable_when_exact_tag_matches(monkeypatch):
    monkeypatch.setattr(version_mod, "_find_pyproject_version", lambda: "2.3.3")
    monkeypatch.setattr(version_mod, "_resolve_branch_from_env", lambda: "")
    monkeypatch.setattr(version_mod, "_resolve_branch_from_git", lambda: "main")
    monkeypatch.setattr(
        version_mod,
        "_run_git",
        lambda args: "v2.3.3" if args == ["describe", "--tags", "--exact-match"] else "",
    )

    info = version_mod.get_version_info()
    assert info["version"] == "2.3.3"
    assert info["branch"] == "main"
