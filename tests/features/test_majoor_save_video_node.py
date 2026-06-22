from mjr_am_backend.video_ui import build_video_ui


def test_build_video_ui_uses_comfyui_preview_video_contract():
    result = build_video_ui("clip_00001_.mp4", "runs", "output", "clip_00001.png")

    ui = result["ui"]
    assert ui["images"] == [{"filename": "clip_00001_.mp4", "subfolder": "runs", "type": "output"}]
    assert ui["animated"] == (True,)
    assert ui["videos"] == ui["images"]
    assert ui["preview_images"] == [{"filename": "clip_00001.png", "subfolder": "runs", "type": "output"}]
