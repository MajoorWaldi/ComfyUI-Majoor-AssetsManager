"""MVP tests focused on Result pattern, adapters and SQLite behavior."""
import json
import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from mjr_am_shared import Result, get_logger, log_success, ErrorCode
from mjr_am_backend.adapters.tools import ExifTool, FFProbe
from mjr_am_backend.adapters.db.sqlite import Sqlite
from mjr_am_backend.adapters.db.schema import init_schema

logger = get_logger(__name__)

async def _run_sqlite_test(db_path: Path):
    """Shared SQLite test logic for pytest + optional manual runner."""
    if db_path.exists():
        try:
            db_path.unlink()
        except Exception:
            pass

    db = Sqlite(str(db_path))

    # Initialize schema
    result = await init_schema(db)
    if not result.ok:
        logger.error(f"Schema init failed: {result.error}")
        return

    # Test insert
    insert_result = await db.aexecute(
        """
        INSERT INTO assets (filename, subfolder, filepath, kind, ext, size, mtime, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        ("test.png", "output", "/path/to/test.png", "image", ".png", 1024, 1234567890.0, 1234567890.0, 1234567890.0)
    )

    if not insert_result.ok:
        logger.error(f"Insert failed: {insert_result.error}")
        return

    # Test query
    query_result = await db.aexecute("SELECT * FROM assets WHERE filename = ?", ("test.png",), fetch=True)

    if query_result.ok:
        logger.info(f"Found {len(query_result.data)} rows")
        logger.info(f"Row: {query_result.data[0]}")
        log_success(logger, "SQLite works!")
    else:
        logger.error(f"Query failed: {query_result.error}")

    # Cleanup
    await db.aclose()
    if db_path.exists():
        try:
            db_path.unlink()
        except Exception:
            pass

@pytest.mark.asyncio
async def test_result_pattern():
    """Test Result pattern."""
    logger.info("Testing Result pattern...")

    # Success case
    result_ok = Result.Ok({"test": "data"}, extra="metadata")
    assert result_ok.ok
    assert result_ok.data["test"] == "data"
    assert result_ok.meta["extra"] == "metadata"

    # Error case
    result_err = Result.Err(ErrorCode.NOT_FOUND, "File not found")
    assert not result_err.ok
    assert result_err.code == ErrorCode.NOT_FOUND
    assert result_err.error == "File not found"

    log_success(logger, "Result pattern works!")

@pytest.mark.asyncio
async def test_exiftool_with_mocks(tmp_path, monkeypatch):
    """ExifTool adapter test with mocked OS/process responses."""
    logger.info("Testing ExifTool adapter with mocks...")

    test_file = tmp_path / "sample.png"
    test_file.write_bytes(b"\x89PNG\r\n\x1a\n")

    monkeypatch.setattr("mjr_am_backend.adapters.tools.exiftool.shutil.which", lambda _: "/usr/bin/exiftool")

    fake_payload = [{"SourceFile": str(test_file), "XMP-xmp:Rating": 5, "XMP-dc:Subject": ["tag1"]}]
    fake_proc = MagicMock(
        returncode=0,
        stdout=json.dumps(fake_payload),
        stderr="",
    )
    monkeypatch.setattr("mjr_am_backend.adapters.tools.exiftool.subprocess.run", lambda *args, **kwargs: fake_proc)

    exiftool = ExifTool()
    assert exiftool.is_available()

    result = exiftool.read(str(test_file))
    assert result.ok
    assert result.data["XMP-xmp:Rating"] == 5
    assert "XMP-dc:Subject" in result.data

@pytest.mark.asyncio
async def test_ffprobe_with_mocks(tmp_path, monkeypatch):
    """FFProbe adapter test with mocked OS/process responses."""
    logger.info("Testing FFProbe adapter with mocks...")

    test_file = tmp_path / "sample.mp4"
    test_file.write_bytes(b"\x00\x00\x00\x18ftypmp42")

    monkeypatch.setattr("mjr_am_backend.adapters.tools.ffprobe.shutil.which", lambda _: "/usr/bin/ffprobe")

    ffprobe_json = {
        "format": {"format_name": "mov,mp4,m4a,3gp,3g2,mj2", "duration": "2.5"},
        "streams": [{"codec_type": "video", "codec_name": "h264", "width": 1280, "height": 720}],
    }
    fake_proc = MagicMock(returncode=0, stdout=json.dumps(ffprobe_json), stderr="")
    monkeypatch.setattr("mjr_am_backend.adapters.tools.ffprobe.subprocess.run", lambda *args, **kwargs: fake_proc)

    ffprobe = FFProbe()
    assert ffprobe.is_available()

    result = ffprobe.read(str(test_file))
    assert result.ok
    assert result.data["video_stream"]["codec_name"] == "h264"
    assert result.data["format"]["duration"] == "2.5"

@pytest.mark.asyncio
async def test_sqlite(tmp_path):
    """Test SQLite adapter."""
    logger.info("Testing SQLite adapter...")

    db_path = tmp_path / "test_assets.db"
    await _run_sqlite_test(db_path)

async def main():
    """Run MVP tests."""
    logger.info("=" * 60)
    logger.info("ðŸš€ Majoor Assets Manager - MVP Test")
    logger.info("=" * 60)

    try:
        await test_result_pattern()
        print()
        # For manual runs, keep artifacts out of the repo root.
        import tempfile
        tmp_dir = Path(tempfile.gettempdir()) / "majoor_tests"
        tmp_dir.mkdir(parents=True, exist_ok=True)
        await _run_sqlite_test(tmp_dir / "test_assets.db")
        print()
        log_success(logger, "All MVP tests completed!")

    except Exception as e:
        logger.error(f"Test failed with exception: {e}", exc_info=True)
        return 1

    return 0

if __name__ == "__main__":
    import asyncio
    sys.exit(asyncio.run(main()))

