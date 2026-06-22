from __future__ import annotations


def build_video_ui(
    video_file: str,
    subfolder: str,
    output_type: str,
    preview_file: str | None = None,
) -> dict[str, object]:
    """Return ComfyUI's native animated preview payload for saved videos."""
    video_entry = {"filename": video_file, "subfolder": subfolder, "type": output_type}
    ui: dict[str, object] = {
        "images": [video_entry],
        "animated": (True,),
        "videos": [video_entry],
    }
    if preview_file:
        ui["preview_images"] = [
            {"filename": preview_file, "subfolder": subfolder, "type": output_type}
        ]
    return {"ui": ui}
