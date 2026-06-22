from mjr_am_backend.features.viewer.info import build_viewer_media_info


def test_viewer_info_prefers_ffprobe_fps_over_legacy_metadata() -> None:
    asset = {
        "id": 7,
        "kind": "video",
        "duration": 10,
        "metadata_raw": {
            "fps": 12,
            "frame_rate": 16,
            "raw_ffprobe": {
                "video_stream": {
                    "avg_frame_rate": "30000/1001",
                },
            },
        },
    }

    info = build_viewer_media_info(asset)

    assert info["fps_raw"] == "30000/1001"
    assert info["fps"] == 30000 / 1001
    assert info["frame_count"] == 300
