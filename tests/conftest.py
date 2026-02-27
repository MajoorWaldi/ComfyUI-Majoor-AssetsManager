import sys

import pytest_asyncio

from .repo_root import REPO_ROOT

if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

@pytest_asyncio.fixture
async def services(tmp_path):
    from mjr_am_backend.deps import build_services

    db_path = str(tmp_path / "test_services.db")
    # build_services is now async
    svc_res = await build_services(db_path)
    assert svc_res.ok, svc_res.error
    svc = svc_res.data
    try:
        yield svc
    finally:
        try:
            watcher = svc.get("watcher")
            if watcher and hasattr(watcher, "stop"):
                await watcher.stop()
        except Exception:
            pass
        try:
            index = svc.get("index")
            if index and hasattr(index, "stop_enrichment"):
                await index.stop_enrichment(clear_queue=True)
        except Exception:
            pass
        try:
            sync_worker = svc.get("rating_tags_sync")
            if sync_worker and hasattr(sync_worker, "stop"):
                sync_worker.stop(timeout=1.0)
        except Exception:
            pass
        try:
            await svc.get("db").aclose()
        except Exception:
            pass
