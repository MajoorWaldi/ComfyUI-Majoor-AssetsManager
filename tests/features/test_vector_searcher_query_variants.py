from mjr_am_backend.features.index.vector_searcher import VectorSearcher


def test_semantic_query_variants_fr_animal_expands_to_english() -> None:
    variants = VectorSearcher._semantic_query_variants("animal")
    assert variants
    assert variants[0] == "animal"
    assert any("dog" in v for v in variants)


def test_semantic_query_variants_keeps_original_only_when_no_mapping() -> None:
    variants = VectorSearcher._semantic_query_variants("landscape")
    assert variants == ["landscape"]


def test_semantic_query_variants_color_query_adds_visual_expansions() -> None:
    variants = VectorSearcher._semantic_query_variants("green")
    assert variants
    assert variants[0] == "green"
    assert any("dominant green color" in v.lower() for v in variants)


def test_semantic_query_variants_fr_color_maps_to_english_expansion() -> None:
    variants = VectorSearcher._semantic_query_variants("vert")
    assert variants
    assert variants[0] == "vert"
    assert any(v.lower() == "green" for v in variants)
    assert any("dominant green color" in v.lower() for v in variants)
