from pathlib import Path

import pytest

from mjr_am_backend.features.health.service import HealthService
from mjr_am_backend.shared import Result


class _Tool:
    def __init__(self, ok: bool):
        self._ok = ok

    def is_available(self):
        return self._ok


class _DB:
    def __init__(self):
        self.has_meta = True
        self.fail_query = False

    async def ahas_table(self, _name):
        return self.has_meta

    async def aexecute(self, _sql, _params=(), fetch=False):
        _ = fetch
        if self.fail_query:
            return Result.Err("DB_ERROR", "failed")
        if "FROM metadata WHERE key" in _sql:
            return Result.Ok([{"value": "2026-01-01"}])
        if "GROUP BY a.kind" in _sql:
            return Result.Ok([{"kind": "image", "count": 2}, {"kind": "video", "count": 1}])
        return Result.Ok([{"count": 3}])

    async def aget_schema_version(self):
        return 2


@pytest.mark.asyncio
async def test_health_status_and_database_paths():
    db = _DB()
    svc = HealthService(db, _Tool(True), _Tool(True))
    st = await svc.status()
    assert st.ok and st.data["overall"] == "healthy"

    db.has_meta = False
    st2 = await svc.status()
    assert st2.ok and st2.data["overall"] == "unhealthy"

    db.has_meta = True
    svc2 = HealthService(db, _Tool(False), _Tool(False))
    st3 = await svc2.status()
    assert st3.ok and st3.data["overall"] == "degraded"


@pytest.mark.asyncio
async def test_health_get_counters_and_helpers(tmp_path: Path):
    db = _DB()
    svc = HealthService(db, _Tool(True), _Tool(False))
    dbp = tmp_path / "x.db"
    dbp.write_bytes(b"x")
    setattr(db, "db_path", dbp)
    out = await svc.get_counters(roots=[str(tmp_path)])
    assert out.ok and out.data["total_assets"] == 3 and out.data["images"] == 2
    assert out.data["tool_availability"]["ffprobe"] is False

    db.fail_query = True
    out2 = await svc.get_counters()
    assert out2.ok and out2.data["total_assets"] == 0
