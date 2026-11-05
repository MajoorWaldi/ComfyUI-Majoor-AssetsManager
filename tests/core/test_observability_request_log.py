from mjr_am_backend import observability_runtime as obs


class _Recorder:
    def __init__(self):
        self.records = []

    def __getattr__(self, level):
        return lambda msg, **_kwargs: self.records.append((level, msg))


def _emit(monkeypatch, status, path, query=None):
    rec = _Recorder()
    monkeypatch.setattr(obs, "logger", rec)
    obs._emit_request_log_by_status(
        status, {"method": "GET", "path": path, "duration_ms": 2.0, "query": query or {}}
    )
    return rec.records


def test_download_404_is_info_and_names_the_file(monkeypatch):
    records = _emit(monkeypatch, 404, "/mjr/am/download", {"filepath": "D:/out/gone.png"})
    assert [level for level, _ in records] == ["info"]
    assert "D:/out/gone.png" in records[0][1]


def test_other_404_stays_a_warning(monkeypatch):
    records = _emit(monkeypatch, 404, "/mjr/am/assets/delete")
    assert [level for level, _ in records] == ["warning"]


def test_download_server_error_stays_an_error(monkeypatch):
    records = _emit(monkeypatch, 500, "/mjr/am/download")
    assert [level for level, _ in records] == ["error"]
