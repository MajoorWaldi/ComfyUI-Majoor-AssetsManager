from tests.repo_root import REPO_ROOT


def test_health_counters_include_enrichment_queue_length() -> None:
    p = REPO_ROOT / "mjr_am_backend" / "routes" / "handlers" / "health.py"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert '"enrichment_queue_length"' in s
    assert "get_runtime_status" in s


def test_status_dot_uses_enrichment_queue_length_and_line() -> None:
    p = REPO_ROOT / "js" / "features" / "status" / "StatusDot.js"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert "const enrichmentQueueLength = Math.max(0, Number(counters?.enrichment_queue_length || 0) || 0);" in s
    assert "const enrichmentLine = enrichmentActive" in s
    assert "Metadata enrichment queue: {count}" in s


def test_card_dot_pending_title_includes_queue_count() -> None:
    p = REPO_ROOT / "js" / "components" / "Badges.js"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert "Pending: database metadata enrichment in progress (" in s
    assert "queued)" in s
    assert "_mjrEnrichmentQueueLength" in s


def test_entry_tracks_enrichment_queue_length_from_events() -> None:
    p = REPO_ROOT / "js" / "entry.js"
    s = p.read_text(encoding="utf-8", errors="replace")
    assert "globalThis._mjrEnrichmentQueueLength = queueLen;" in s
    assert "const active = !!detail?.active || queueLen > 0;" in s
