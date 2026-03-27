from mjr_am_backend.features.index.search_hydration import hydrate_asset_payload


def test_hydrate_asset_payload_restores_generation_time_from_metadata_raw():
    asset = hydrate_asset_payload(
        {
            "id": 42,
            "filename": "sample.png",
            "metadata_raw": {"generation_time_ms": 8421},
        }
    )

    assert asset["generation_time_ms"] == 8421


def test_hydrate_asset_payload_preserves_selected_generation_time():
    asset = hydrate_asset_payload(
        {
            "id": 43,
            "filename": "sample.png",
            "generation_time_ms": 9100,
            "metadata_raw": {"generation_time_ms": 8421},
        }
    )

    assert asset["generation_time_ms"] == 9100
