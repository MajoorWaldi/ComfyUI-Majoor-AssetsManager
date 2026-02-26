from mjr_am_backend.features.metadata.graph_traversal import iter_nested_dicts
from mjr_am_backend.features.metadata.metadata_cache import MetadataCache


def test_metadata_cache_put_get_invalidate_and_prune(monkeypatch):
    t = [100.0]
    monkeypatch.setattr("mjr_am_backend.features.metadata.metadata_cache.time.time", lambda: t[0])

    c = MetadataCache(ttl_seconds=2)
    c.put("a", {"x": 1})
    assert c.get("a") == {"x": 1}
    t[0] = 103.0
    assert c.get("a") is None

    c.put("b", {"y": 2})
    c.put("c", {"z": 3})
    c.invalidate("b")
    c.invalidate_batch(["c"])
    assert c.get("b") is None and c.get("c") is None

    c.put("d", {"k": 1})
    t[0] = 106.0
    assert c.prune_expired() >= 1


def test_iter_nested_dicts_handles_nested_iterables_and_cycles():
    d = {"a": {"b": 1}, "l": [{"c": 2}, {"d": {"e": 3}}]}
    d["self"] = d
    out = list(iter_nested_dicts(d))
    assert any(item.get("b") == 1 for item in out)
    assert any(item.get("e") == 3 for item in out)
    assert list(iter_nested_dicts("text")) == []
