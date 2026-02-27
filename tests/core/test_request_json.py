import pytest

from mjr_am_backend.routes.core import request_json as rq


class _DummyContent:
    def __init__(self, chunks, exc=None):
        self._chunks = chunks
        self._exc = exc

    async def iter_chunked(self, _size):
        if self._exc is not None:
            raise self._exc
        for chunk in self._chunks:
            yield chunk


class _DummyRequest:
    def __init__(self, headers=None, chunks=None, exc=None):
        self.headers = headers or {}
        self.content = _DummyContent(chunks or [], exc=exc)


def test_max_json_bytes_env(monkeypatch) -> None:
    monkeypatch.setenv("MJR_MAX_JSON_SIZE", "2048")
    assert rq._max_json_bytes() == 2048
    monkeypatch.setenv("MJR_MAX_JSON_SIZE", "bad")
    assert rq._max_json_bytes() == rq.DEFAULT_MAX_JSON_BYTES


def test_content_type_and_length_errors() -> None:
    bad_ct = _DummyRequest(headers={"Content-Type": "text/plain"})
    assert rq._content_type_error(bad_ct) is not None

    missing_ct = _DummyRequest(headers={})
    assert rq._content_type_error(missing_ct) is not None

    ok_ct = _DummyRequest(headers={"Content-Type": "application/ld+json"})
    assert rq._content_type_error(ok_ct) is None

    big = _DummyRequest(headers={"Content-Length": "999"})
    assert rq._content_length_error(big, 100) is not None


def test_decode_and_parse_json_dict() -> None:
    ok = rq._decode_and_parse_json_dict(b'{"a":1}')
    assert ok.ok and ok.data == {"a": 1}

    bad_utf = rq._decode_and_parse_json_dict(b"\xff")
    assert not bad_utf.ok

    bad_json = rq._decode_and_parse_json_dict(b"{")
    assert not bad_json.ok

    not_obj = rq._decode_and_parse_json_dict(b"[]")
    assert not not_obj.ok


@pytest.mark.asyncio
async def test_read_request_body_limited_behaviors() -> None:
    req = _DummyRequest(chunks=[b"{", b'"a":1', b"}"])
    res = await rq._read_request_body_limited(req, 100)
    assert res.ok
    assert res.data == b'{"a":1}'

    req2 = _DummyRequest(chunks=[b"x" * 101])
    res2 = await rq._read_request_body_limited(req2, 100)
    assert not res2.ok

    req3 = _DummyRequest(exc=RuntimeError("boom"))
    res3 = await rq._read_request_body_limited(req3, 100)
    assert not res3.ok


@pytest.mark.asyncio
async def test_read_json_end_to_end() -> None:
    req = _DummyRequest(
        headers={"Content-Type": "application/json", "Content-Length": "10"},
        chunks=[b'{"k":"v"}'],
    )
    out = await rq._read_json(req, max_bytes=100)
    assert out.ok
    assert out.data == {"k": "v"}

    bad_req = _DummyRequest(headers={"Content-Type": "text/plain"}, chunks=[b"{}"])
    out2 = await rq._read_json(bad_req, max_bytes=100)
    assert not out2.ok


@pytest.mark.asyncio
async def test_read_json_rejects_content_length_mismatch_over_limit() -> None:
    req = _DummyRequest(
        headers={"Content-Type": "application/json", "Content-Length": "2"},
        chunks=[b"{", b'"k":"', b"x" * 2048, b'"}'],
    )
    out = await rq._read_json(req, max_bytes=64)
    assert out.ok is False
    assert out.code == "INVALID_INPUT"
