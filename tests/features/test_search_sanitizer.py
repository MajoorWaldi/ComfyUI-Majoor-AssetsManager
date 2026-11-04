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


def test_sanitize_fts_query_only_reserved_searches_the_words():
    # Lower-cased, these are plain barewords (FTS5 operators are upper-case
    # only); dropping them all used to produce an empty MATCH and an error.
    s = _mk_searcher()
    out = s._sanitize_fts_query("AND OR NOT NEAR")
    assert out == "and* or* not* near*"


def test_sanitize_fts_query_normalizes_diacritics():
    s = _mk_searcher()
    out = s._sanitize_fts_query("caf\u00e9 fleurs")
    assert out == "cafe* fleurs*"


def test_sanitize_fts_query_keeps_quoted_phrase_clause():
    s = _mk_searcher()
    out = s._sanitize_fts_query('"delicate asymmetrical petals" rose')
    assert out == '"delicate asymmetrical petals" OR rose*'


def test_sanitize_fts_query_long_text_uses_or_clause():
    s = _mk_searcher()
    out = s._sanitize_fts_query(
        "a single organic flower is blooming at the center of the frame with delicate asymmetrical petals"
    )
    assert " OR " in out
    assert "single*" in out
    assert "petals*" in out


def test_sanitize_fts_query_removes_english_stopwords():
    s = _mk_searcher()
    out = s._sanitize_fts_query("the flower in the garden with light")
    assert out == "flower* garden* light*"


def test_sanitize_fts_query_removes_french_stopwords():
    s = _mk_searcher()
    out = s._sanitize_fts_query("une fleur dans le jardin avec lumiere")
    assert out == "fleur* jardin* lumiere*"


def test_sanitize_fts_query_never_empty_for_word_input():
    s = _mk_searcher()
    # Search-as-you-type prefixes and punctuation-wrapped terms.
    assert s._sanitize_fts_query("at-7") == "at* 7*"
    assert s._sanitize_fts_query("(2)") == "2*"
    assert s._sanitize_fts_query("NOT x") == "not* x*"
    assert s._sanitize_fts_query("x") == "x*"


def test_sanitize_fts_query_keeps_non_latin_scripts():
    s = _mk_searcher()
    assert s._sanitize_fts_query("портрет") == "портрет*"
    # Only Latin accents are folded, like FTS5 unicode61 remove_diacritics.
    assert s._sanitize_fts_query("йод") == "йод*"
    assert s._sanitize_fts_query("猫の写真") == "猫の写真*"


def test_punctuation_only_query_is_browse():
    from mjr_am_backend.features.index.searcher import _is_browse_query

    assert _is_browse_query('"') is True
    assert _is_browse_query("*") is True
    assert _is_browse_query("--") is True
    assert _is_browse_query("a") is False
