from mjr_am_backend.features.index.searcher import IndexSearcher


def _mk_searcher():
    return IndexSearcher.__new__(IndexSearcher)


def test_sanitize_fts_query_uppercase_terms_are_lowercased():
    s = _mk_searcher()
    out = s._sanitize_fts_query("HELLO WORLD")
    assert out == "hello* world*"


def test_sanitize_fts_query_reserved_tokens_are_removed():
    s = _mk_searcher()
    out = s._sanitize_fts_query("DOG AND CAT OR NOT")
    assert out == "dog* cat*"


def test_sanitize_fts_query_only_reserved_falls_back_to_browse():
    s = _mk_searcher()
    out = s._sanitize_fts_query("AND OR NOT NEAR")
    assert out == ""
