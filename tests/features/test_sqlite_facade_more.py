import pytest

from mjr_am_backend.adapters.db import sqlite_facade as s


def test_validate_in_base_query_more_cases():
    ok, msg = s._validate_in_base_query("")
    assert not ok and "empty" in msg.lower()

    ok2, msg2 = s._validate_in_base_query("SELECT * FROM t")
    assert not ok2 and "{in_clause}" in msg2.lower()

    ok3, msg3 = s._validate_in_base_query("SELECT * FROM t WHERE {IN_CLAUSE}; DROP TABLE x")
    assert not ok3 and "forbidden" in msg3.lower()

    ok4, msg4 = s._validate_in_base_query("WITH q AS (SELECT 1) SELECT * FROM q WHERE {IN_CLAUSE}")
    assert ok4 and not msg4


def test_build_in_query_invalid_count_and_column():
    b1, q1, p1 = s._build_in_query("DELETE FROM t WHERE {IN_CLAUSE}", "id", 0)
    assert b1 and q1 == "" and p1 == ()

    b2, q2, p2 = s._build_in_query("SELECT * FROM t WHERE {IN_CLAUSE}", "id", 0)
    assert b2 and q2 == "" and p2 == ()


def test_async_loop_thread_run_closes_coro_on_deadlock():
    t = s._AsyncLoopThread(run_timeout_s=2.0)
    _ = t.start()
    t._thread_ident = __import__("threading").get_ident()
    c = __import__("asyncio").sleep(0)
    with pytest.raises(RuntimeError):
        t.run(c)
    try:
        c.close()
    except Exception:
        pass
    t.stop()
