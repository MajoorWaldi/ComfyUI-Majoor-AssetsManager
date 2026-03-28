from mjr_am_backend.features.stacks.service import StacksService


class _DbStub:
    def __init__(self, *, query_results=None, execute_results=None):
        self.query_results = list(query_results or [])
        self.execute_results = list(execute_results or [])

    async def aquery(self, _sql, _params=()):
        if self.query_results:
            return self.query_results.pop(0)
        raise AssertionError("Unexpected aquery call")

    async def aexecute(self, _sql, _params=()):
        if self.execute_results:
            return self.execute_results.pop(0)
        raise AssertionError("Unexpected aexecute call")


def _ok(data):
    return type("Res", (), {"ok": True, "data": data, "error": None})()


def _err(message):
    return type("Res", (), {"ok": False, "data": None, "error": message})()


async def test_create_or_get_stack_returns_existing_row_after_insert_race():
    db = _DbStub(
        query_results=[
            _ok([]),
            _ok([{"id": 17}]),
        ],
        execute_results=[
            _err("UNIQUE constraint failed: asset_stacks.job_id"),
        ],
    )

    service = StacksService(db)

    result = await service.create_or_get_stack("job-123")

    assert result.ok is True
    assert result.data == 17


async def test_create_or_get_stack_still_errors_when_insert_and_requery_fail():
    db = _DbStub(
        query_results=[
            _ok([]),
            _ok([]),
        ],
        execute_results=[
            _err("database is locked"),
        ],
    )

    service = StacksService(db)

    result = await service.create_or_get_stack("job-123")

    assert result.ok is False
    assert result.code == "DB_ERROR"
