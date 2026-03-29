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

    def atransaction(self, mode="deferred"):
        return _TxStub()


class _TxStub:
    ok = True
    error = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False


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


async def test_assign_asset_refreshes_old_stack_on_reassignment():
    """When an asset moves from stack 10 to stack 20, both stacks get refreshed."""
    calls = []

    class _TrackingDb(_DbStub):
        async def aquery(self, sql, params=()):
            calls.append(("query", sql, params))
            return await super().aquery(sql, params)

        async def aexecute(self, sql, params=()):
            calls.append(("exec", sql, params))
            return await super().aexecute(sql, params)

    db = _TrackingDb(
        query_results=[
            # 1. SELECT stack_id FROM assets WHERE id = ? (old stack lookup)
            _ok([{"stack_id": 10}]),
            # 2. _refresh_stack_count for new stack 20: SELECT COUNT(*)
            _ok([{"cnt": 3}]),
            # 3. _refresh_stack_count for old stack 10: SELECT COUNT(*)
            _ok([{"cnt": 1}]),
        ],
        execute_results=[
            # 1. UPDATE assets SET stack_id = 20 WHERE id = 5
            _ok(None),
            # 2. UPDATE asset_stacks SET asset_count = ... (new stack 20)
            _ok(None),
            # 3. UPDATE asset_stacks SET asset_count = ... (old stack 10)
            _ok(None),
        ],
    )
    service = StacksService(db)

    result = await service.assign_asset(asset_id=5, stack_id=20)

    assert result.ok is True
    exec_calls = [c for c in calls if c[0] == "exec"]
    assert len(exec_calls) == 3
    assert exec_calls[0][2] == (20, 5)


async def test_assign_asset_skips_old_refresh_when_same_stack():
    """When asset is re-assigned to its current stack, only one refresh happens."""
    db = _DbStub(
        query_results=[
            _ok([{"stack_id": 20}]),
            _ok([{"cnt": 3}]),
        ],
        execute_results=[
            _ok(None),
            _ok(None),
        ],
    )
    service = StacksService(db)

    result = await service.assign_asset(asset_id=5, stack_id=20)

    assert result.ok is True


async def test_finalize_job_stack_skips_single_asset_job_and_drops_existing_stack():
    db = _DbStub(
        query_results=[
            _ok([{"total": 1}]),
            _ok([{"id": 23}]),
        ],
        execute_results=[
            _ok(None),
            _ok(None),
        ],
    )
    service = StacksService(db)

    result = await service._finalize_job_stack("job-single")

    assert result is None


async def test_finalize_job_stack_creates_stack_for_multi_asset_job():
    db = _DbStub(
        query_results=[
            _ok([{"total": 2}]),
            _ok([]),
            _ok([{"id": 31}]),
            _ok([{"total": 2}]),
            _ok([{"id": 99}]),
            _ok([{"id": 99}]),
        ],
        execute_results=[
            _ok(None),
            _ok(None),
            _ok(None),
            _ok(None),
            _ok(None),
        ],
    )
    service = StacksService(db)

    result = await service._finalize_job_stack("job-multi")

    assert result == {
        "job_id": "job-multi",
        "stack_id": 31,
        "asset_count": 2,
    }


async def test_set_cover_rejects_asset_outside_stack():
    db = _DbStub(
        query_results=[
            _ok([]),
        ],
    )
    service = StacksService(db)

    result = await service.set_cover(stack_id=31, cover_asset_id=99)

    assert result.ok is False
    assert result.code == "INVALID_INPUT"


async def test_auto_select_cover_propagates_set_cover_failure():
    db = _DbStub(
        query_results=[
            _ok([{"id": 99}]),
            _ok([]),
        ],
    )
    service = StacksService(db)

    result = await service.auto_select_cover(stack_id=31)

    assert result.ok is False
    assert result.code == "INVALID_INPUT"
