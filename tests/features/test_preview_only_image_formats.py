from fractions import Fraction
from pathlib import Path

import pytest
from aiohttp.test_utils import make_mocked_request
from PIL import Image

from mjr_am_backend.features.metadata import thumbnail_cache as thumbs
from mjr_am_backend.routes.handlers import viewer
from mjr_am_shared.types import classify_file


@pytest.fixture()
def thumb_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(thumbs, "thumbnail_cache_dir", lambda: tmp_path / "thumbs")
    (tmp_path / "thumbs").mkdir()
    return tmp_path / "thumbs"


def _write_exr(path: Path, rgb: tuple[float, float, float]) -> None:
    av = pytest.importorskip("av")
    np = pytest.importorskip("numpy")
    pixels = np.empty((8, 16, 3), dtype=np.float32)
    pixels[...] = rgb
    try:
        codec = av.CodecContext.create("exr", "w")
    except Exception:
        pytest.skip("PyAV build has no EXR encoder")
    codec.width, codec.height, codec.pix_fmt = 16, 8, "gbrpf32le"
    codec.time_base = Fraction(1, 1)
    frame = av.VideoFrame.from_ndarray(pixels, format="rgbf32le").reformat(format="gbrpf32le")
    frame.pts, frame.time_base = 0, codec.time_base
    path.write_bytes(b"".join(bytes(p) for p in list(codec.encode(frame)) + list(codec.encode(None))))


def test_new_image_and_video_extensions_are_classified():
    for name in ("a.exr", "a.svg", "a.tif", "a.tiff", "a.bmp"):
        assert classify_file(name) == "image", name
    for name in ("a.avi", "a.m4v"):
        assert classify_file(name) == "video", name


def test_exr_thumbnail_is_tonemapped_to_srgb_with_correct_channel_order(tmp_path, thumb_dir):
    source = tmp_path / "linear.exr"
    _write_exr(source, (0.5, 0.2, 0.05))

    result = thumbs.get_or_create_thumbnail(str(source), size=64)

    assert result.ok
    with Image.open(result.data["path"]) as jpeg:
        r, g, b = jpeg.convert("RGB").getpixel((4, 4))
    # Scene-linear 0.5/0.2/0.05 encode to roughly sRGB 188/124/63.
    assert r > g > b
    assert abs(r - 188) < 10 and abs(g - 124) < 10 and abs(b - 63) < 12


def test_tiff_preview_is_a_jpeg(tmp_path, thumb_dir):
    source = tmp_path / "scan.tif"
    Image.new("RGB", (40, 30), (200, 10, 10)).save(source)

    result = thumbs.get_or_create_preview(str(source))

    assert result.ok
    with Image.open(result.data["path"]) as jpeg:
        assert jpeg.format == "JPEG"
        assert jpeg.size == (40, 30)


@pytest.mark.asyncio
async def test_viewer_serves_jpeg_preview_for_tiff_and_original_on_request(tmp_path, thumb_dir):
    source = tmp_path / "scan.tif"
    Image.new("RGB", (40, 30), (200, 10, 10)).save(source)

    preview = await viewer._viewer_file_response(make_mocked_request("GET", "/v"), source, "no-store")
    original = await viewer._viewer_file_response(make_mocked_request("GET", "/v?original=1"), source, "no-store")

    assert preview.headers["Content-Type"] == "image/jpeg"
    assert Path(str(preview._path)).suffix == ".jpg"
    assert Path(str(original._path)) == source


@pytest.mark.asyncio
async def test_svg_is_served_sandboxed(tmp_path):
    source = tmp_path / "icon.svg"
    source.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"/>', encoding="utf-8")

    resp = await viewer._viewer_file_response(make_mocked_request("GET", "/v"), source, "no-store")

    assert resp.headers["Content-Type"] == "image/svg+xml"
    assert resp.headers["Content-Security-Policy"] == "sandbox"
