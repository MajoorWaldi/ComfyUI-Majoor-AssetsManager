import pytest


@pytest.mark.asyncio
async def test_stop_watcher_if_running_uses_property():
    from mjr_am_backend.routes.handlers.db_maintenance import _stop_watcher_if_running

    class _WatcherStub:
        def __init__(self):
            self.is_running = True
            self.stopped = False

        async def stop(self):
            self.stopped = True

    watcher = _WatcherStub()
    svc = {"watcher": watcher}

    stopped = await _stop_watcher_if_running(svc)
    assert stopped is True
    assert watcher.stopped is True
