import os
import pytest

from mjr_am_backend.routes.handlers.search import _dedupe_assets_by_filepath


@pytest.mark.skipif(os.name != "nt", reason="Case-insensitive filepath dedupe applies on Windows")
def test_dedupe_assets_by_filepath_windows_style_case_variants():
    assets = [
        {"filepath": r"F:\Output\Image.PNG", "filename": "Image.PNG"},
        {"filepath": r"f:\output\image.png", "filename": "image.png"},
        {"filepath": r"F:\Output\Other.png", "filename": "Other.png"},
    ]

    deduped = _dedupe_assets_by_filepath(assets)
    assert len(deduped) == 2
