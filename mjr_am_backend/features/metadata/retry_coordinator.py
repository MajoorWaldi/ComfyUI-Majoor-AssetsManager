"""Retry/transient and lightweight extraction helpers extracted from service.py."""
import os
import time
from typing import Any

from ...shared import ErrorCode, Result, log_structured
from .extractors import extract_rating_tags_from_exif


def is_transient_metadata_read_error(result: Result[dict[str, Any]], file_path: str, hints: tuple[str, ...]) -> bool:
    try:
        if not os.path.exists(file_path):
            return False
    except Exception:
        return False
    code = str(result.code or "").strip().upper()
    err_text = str(result.error or "").strip().lower()
    if code == ErrorCode.NOT_FOUND.value:
        return True
    transient_codes = {
        ErrorCode.TIMEOUT.value,
        ErrorCode.EXIFTOOL_ERROR.value,
        ErrorCode.FFPROBE_ERROR.value,
        ErrorCode.PARSE_ERROR.value,
        ErrorCode.METADATA_FAILED.value,
    }
    if code in transient_codes:
        return True
    return any(hint in err_text for hint in hints)


def fill_other_batch_results(results: dict[str, Result[dict[str, Any]]], paths: list[str], file_info_getter) -> None:
    for path in paths:
        if path in results:
            continue
        results[path] = Result.Ok({"file_info": file_info_getter(path), "quality": "none"}, quality="none")


def log_metadata_issue(logger, level: int, message: str, file_path: str, scan_id: str | None = None, tool: str | None = None, error: str | None = None, duration_seconds: float | None = None) -> None:
    context: dict[str, Any] = {"file_path": file_path}
    if scan_id:
        context["scan_id"] = scan_id
    if tool:
        context["tool"] = tool
    if error:
        context["error"] = error
    if duration_seconds is not None:
        try:
            context["duration_seconds"] = round(float(duration_seconds), 3)
        except Exception:
            context["duration_seconds"] = duration_seconds
    log_structured(logger, level, message, **context)


def extract_rating_tags_only(exiftool: Any, file_path: str, logger: Any, scan_id: str | None = None) -> Result[dict[str, Any]]:
    if not os.path.exists(file_path):
        return Result.Err(ErrorCode.NOT_FOUND, f"File not found: {file_path}", quality="none")

    exif_start = time.perf_counter()
    tags = [
        "XMP-xmp:Rating",
        "XMP-microsoft:RatingPercent",
        "Microsoft:SharedUserRating",
        "Rating",
        "RatingPercent",
        "XMP-dc:Subject",
        "XMP:Subject",
        "IPTC:Keywords",
        "Keywords",
        "XPKeywords",
        "Microsoft:Category",
        "Subject",
    ]
    exif_result = exiftool.read(file_path, tags=tags)
    exif_duration = time.perf_counter() - exif_start
    exif_data = exif_result.data if exif_result.ok else None

    if not exif_result.ok:
        log_metadata_issue(
            logger,
            10,
            "ExifTool failed while reading rating/tags",
            file_path,
            scan_id=scan_id,
            tool="exiftool",
            error=exif_result.error,
            duration_seconds=exif_duration,
        )
        return Result.Ok({"rating": None, "tags": []}, quality="none")

    rating, tags_list = extract_rating_tags_from_exif(exif_data)
    return Result.Ok({"rating": rating, "tags": tags_list}, quality="partial")
