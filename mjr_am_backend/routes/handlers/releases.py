"""
Expose repository refs (tags/branches) and a ZIP template for programmatic installs.

Endpoint: GET /mjr/am/releases
Query params:
  - owner (default: MajoorWaldi)
  - repo (default: ComfyUI-Majoor-AssetsManager)
  - per_page (default: 100)

Returns a `Result` with `data` containing `tags`, `branches`, and `zip_url_template`.
If GitHub is unreachable, returns a `Result.Err` with code `DEGRADED`.
"""
from __future__ import annotations

import asyncio
import os
import re
from typing import Any

from aiohttp import ClientSession, ClientTimeout, web
from mjr_am_backend.shared import Result, get_logger, sanitize_error_message

from ..core import _json_response

logger = get_logger(__name__)
_SAFE_GITHUB_SEGMENT_RE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,98}[A-Za-z0-9])?$")


def _parse_per_page(raw_value: str | None) -> int:
    try:
        value = int(raw_value or "100")
    except Exception:
        return 100
    return max(1, min(200, value))


def _is_safe_github_segment(value: str) -> bool:
    try:
        normalized = str(value or "").strip()
    except Exception:
        return False
    if not normalized:
        return False
    if ".." in normalized:
        return False
    if normalized.startswith(".") or normalized.endswith("."):
        return False
    return bool(_SAFE_GITHUB_SEGMENT_RE.match(normalized))


def _github_headers() -> dict[str, str]:
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("MAJOOR_GITHUB_TOKEN")
    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"token {token}"
    return headers


def _github_refs_urls(owner: str, repo: str, per_page: int) -> tuple[str, str]:
    base = f"https://api.github.com/repos/{owner}/{repo}"
    return (
        f"{base}/tags?per_page={per_page}",
        f"{base}/branches?per_page={per_page}",
    )


def _extract_ref_names(payload: Any) -> list[str]:
    out: list[str] = []
    for item in payload or []:
        if isinstance(item, dict):
            name = item.get("name")
            if name:
                out.append(str(name))
    return out


async def _fetch_github_json(session: ClientSession, url: str, headers: dict[str, str]) -> Any:
    async with session.get(url, headers=headers, timeout=ClientTimeout(total=30)) as resp:
        if resp.status != 200:
            raise RuntimeError(f"GitHub API returned {resp.status}")
        return await resp.json()


def register_releases_routes(routes: web.RouteTableDef) -> None:
    @routes.get("/mjr/am/releases")
    async def get_releases(request: web.Request) -> web.Response:
        owner = (request.query.get("owner") or "MajoorWaldi").strip()
        repo = (request.query.get("repo") or "ComfyUI-Majoor-AssetsManager").strip()
        if not _is_safe_github_segment(owner) or not _is_safe_github_segment(repo):
            return _json_response(Result.Err("INVALID_INPUT", "Invalid owner/repo format"))
        per_page = _parse_per_page(request.query.get("per_page"))
        headers = _github_headers()
        tags_url, branches_url = _github_refs_urls(owner, repo, per_page)

        try:
            async with ClientSession() as session:
                tags_json, branches_json = await asyncio.gather(
                    _fetch_github_json(session, tags_url, headers),
                    _fetch_github_json(session, branches_url, headers),
                )

            tags = _extract_ref_names(tags_json)
            branches = _extract_ref_names(branches_json)

            zip_url_template = f"https://github.com/{owner}/{repo}/archive/refs/{{ref}}.zip"

            data = {
                "owner": owner,
                "repo": repo,
                "tags": tags,
                "branches": branches,
                "zip_url_template": zip_url_template,
            }
            return _json_response(Result.Ok(data))
        except asyncio.TimeoutError:
            logger.debug("Timeout fetching GitHub refs for %s/%s", owner, repo)
            return _json_response(Result.Err("DEGRADED", "Timeout while contacting GitHub"))
        except Exception as exc:
            logger.debug("Failed to fetch GitHub refs for %s/%s: %s", owner, repo, exc)
            return _json_response(
                Result.Err(
                    "DEGRADED",
                    "Failed to fetch repository refs",
                    meta={
                        "details": sanitize_error_message(
                            exc, "Failed to fetch repository refs"
                        )
                    },
                )
            )
