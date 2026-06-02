from mjr_am_backend.adapters.comfy_events import build_event_payload


def test_build_event_payload_wraps_legacy_scan_event():
    payload = build_event_payload(
        "mjr.scan.progress",
        {
            "status": "completed",
            "scope": "index-files",
            "origin": "generation",
            "prompt_id": "abc",
            "stats": {"added": 2},
        },
    )

    assert payload["event"] == "mjr.scan.progress"
    assert payload["category"] == "scan"
    assert payload["status"] == "completed"
    assert payload["scope"] == "index-files"
    assert payload["origin"] == "generation"
    assert payload["prompt_id"] == "abc"
    assert payload["stats"] == {"added": 2}
    assert payload["data"]["stats"] == {"added": 2}
    assert isinstance(payload["timestamp"], float)


def test_build_event_payload_wraps_asset_event():
    payload = build_event_payload(
        "mjr.asset.indexed",
        {"id": 42, "filename": "out.png"},
    )

    assert payload["category"] == "asset"
    assert payload["id"] == 42
    assert payload["filename"] == "out.png"
