from tests.repo_root import REPO_ROOT


def test_filters_controller_normalizes_media_inputs() -> None:
    p = REPO_ROOT / "js" / "features" / "panel" / "controllers" / "filtersController.js"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert "const parseLooseNumber = (value) => {" in s
    assert "raw.replace(\",\", \".\")" in s
    assert "if (state.maxSizeMB > 0 && state.minSizeMB > 0 && state.maxSizeMB < state.minSizeMB)" in s
    assert "resolutionPresetSelect.value = map[key] || \"\";" in s
