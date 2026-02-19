"""
Health service - system status and tool availability.
"""
import os
from pathlib import Path
from typing import Optional, Sequence, Tuple, List

from ...shared import Result, get_logger
from ...adapters.db.sqlite import Sqlite
from ...adapters.tools import ExifTool, FFProbe
from ...config import get_tool_paths

logger = get_logger(__name__)

_DB_RESETTING_MSG = "database is resetting - connection rejected"


def _is_db_resetting_error(exc: Exception) -> bool:
    try:
        return _DB_RESETTING_MSG in str(exc).lower()
    except Exception:
        return False


class HealthService:
    """
    Health check service.

    Monitors tool availability and database status.
    """

    def __init__(self, db: Sqlite, exiftool: ExifTool, ffprobe: FFProbe):
        """
        Initialize health service.

        Args:
            db: SQLite database instance
            exiftool: ExifTool adapter
            ffprobe: FFProbe adapter
        """
        self.db = db
        self.exiftool = exiftool
        self.ffprobe = ffprobe

    async def status(self) -> Result[dict]:
        """
        Get system health status.

        Returns:
            Result with status dict containing:
                - tools: Tool availability
                - database: Database status
                - overall: Overall health (healthy, degraded, unhealthy)
        """
        try:
            # Check tool availability
            tools = {
                "exiftool": {
                    "available": self.exiftool.is_available(),
                    "required": False,  # Optional but recommended
                },
                "ffprobe": {
                    "available": self.ffprobe.is_available(),
                    "required": False,  # Optional but recommended
                }
            }

            # Check database
            db_status = await self._check_database()

            # Determine overall health
            overall = self._determine_health(tools, db_status)

            status = {
                "tools": tools,
                "database": db_status,
                "overall": overall
            }

            return Result.Ok(status)

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return Result.Err("HEALTH_CHECK_ERROR", str(e))

    async def _check_database(self) -> dict:
        """Check database status."""
        try:
            if not await self.db.ahas_table("metadata"):
                return {
                    "available": False,
                    "schema_version": 0,
                    "error": "Schema metadata table missing"
                }

            # Try a simple query
            result = await self.db.aexecute("SELECT COUNT(*) as count FROM metadata", fetch=True)

            if result.ok:
                return {
                    "available": True,
                    "schema_version": await self.db.aget_schema_version(),
                    "error": None
                }
            else:
                return {
                    "available": False,
                    "schema_version": 0,
                    "error": result.error
                }

        except Exception as e:
            if _is_db_resetting_error(e):
                logger.info("Database check deferred during DB maintenance/reset: %s", e)
            else:
                logger.error(f"Database check failed: {e}")
            return {
                "available": False,
                "schema_version": 0,
                "error": str(e)
            }

    def _determine_health(self, tools: dict, db_status: dict) -> str:
        """
        Determine overall health status.

        Args:
            tools: Tool availability dict
            db_status: Database status dict

        Returns:
            Health status: healthy, degraded, unhealthy
        """
        # Database must be available
        if not db_status.get("available"):
            return "unhealthy"

        # Count available tools
        tools_available = sum(1 for t in tools.values() if t["available"])
        tools_total = len(tools)

        if tools_available == tools_total:
            return "healthy"
        elif tools_available > 0:
            return "degraded"  # Some tools missing but functional
        else:
            return "degraded"  # No external tools but DB works

    def _roots_where(self, roots: Sequence[str]) -> Tuple[str, List[str]]:
        def _escape_like_pattern(pattern: str) -> str:
            return pattern.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")

        clauses = []
        params: List[str] = []
        for root in roots:
            if not root:
                continue
            try:
                base = str(Path(str(root)).resolve(strict=False))
            except OSError:
                continue
            base_sep = base if base.endswith(os.sep) else base + os.sep
            clauses.append("(a.filepath = ? OR a.filepath LIKE ? ESCAPE '\\')")
            params.extend([base, _escape_like_pattern(base_sep) + "%"])
        if not clauses:
            return "1=1", []
        return "(" + " OR ".join(clauses) + ")", params

    def _get_db_file_size_bytes(self) -> int:
        """
        Return total on-disk SQLite footprint (main DB + sidecar files).
        """
        try:
            base = Path(str(getattr(self.db, "db_path", ""))).resolve(strict=False)
            if not str(base):
                return 0
            total = 0
            for suffix in ("", "-wal", "-shm", "-journal"):
                p = Path(str(base) + suffix)
                try:
                    if p.exists():
                        total += int(p.stat().st_size or 0)
                except Exception:
                    # Best effort: skip inaccessible sidecar files.
                    continue
            return max(0, int(total))
        except Exception:
            return 0

    async def get_counters(self, roots: Optional[Sequence[str]] = None) -> Result[dict]:
        """
        Get database counters.

        Returns:
            Result with counters dict containing asset counts
        """
        try:
            where_sql, where_params = self._roots_where(roots) if roots else ("1=1", [])
            params = tuple(where_params)
            counts = await self._counter_query_results(where_sql, params)
            last_scan_end = await self._metadata_value("last_scan_end")
            last_index_end = await self._metadata_value("last_index_end")

            by_kind = self._kind_counts(counts["kind"])
            total_count = self._result_count(counts["total"])
            rated_count = self._result_count(counts["rated"])
            workflow_count = self._result_count(counts["workflow"])
            generation_count = self._result_count(counts["generation"])

            counters = {
                "total_assets": total_count,
                "images": by_kind.get("image", 0),
                "videos": by_kind.get("video", 0),
                "audio": by_kind.get("audio", 0),
                "by_kind": by_kind,  # Keep for backward compatibility
                "rated": rated_count,
                "with_workflow": workflow_count,
                "with_workflows": workflow_count,
                "with_generation_data": generation_count,
                "last_scan_end": last_scan_end,
                "last_index_end": last_index_end,
                "tool_availability": self._get_tool_capabilities(),
                "tool_paths": get_tool_paths(),
                "db_size_bytes": self._get_db_file_size_bytes(),
            }

            return Result.Ok(counters)

        except Exception as e:
            if _is_db_resetting_error(e):
                logger.info("Counters unavailable during DB maintenance/reset: %s", e)
            else:
                logger.error(f"Failed to get counters: {e}")
            return Result.Err("DB_ERROR", str(e))

    async def _counter_query_results(self, where_sql: str, params: tuple[str, ...]) -> dict:
        return {
            "total": await self.db.aexecute(
                f"SELECT COUNT(*) as count FROM assets a WHERE {where_sql}",
                params,
                fetch=True,
            ),
            "kind": await self.db.aexecute(
                f"SELECT a.kind, COUNT(*) as count FROM assets a WHERE {where_sql} GROUP BY a.kind",
                params,
                fetch=True,
            ),
            "rated": await self.db.aexecute(
                f"""
                SELECT COUNT(*) as count
                FROM asset_metadata m
                JOIN assets a ON a.id = m.asset_id
                WHERE m.rating > 0 AND {where_sql}
                """,
                params,
                fetch=True,
            ),
            "workflow": await self.db.aexecute(
                f"""
                SELECT COUNT(*) as count
                FROM asset_metadata m
                JOIN assets a ON a.id = m.asset_id
                WHERE m.has_workflow = 1 AND {where_sql}
                """,
                params,
                fetch=True,
            ),
            "generation": await self.db.aexecute(
                f"""
                SELECT COUNT(*) as count
                FROM asset_metadata m
                JOIN assets a ON a.id = m.asset_id
                WHERE m.has_generation_data = 1 AND {where_sql}
                """,
                params,
                fetch=True,
            ),
        }

    async def _metadata_value(self, key: str) -> Optional[str]:
        result = await self.db.aexecute(
            "SELECT value FROM metadata WHERE key = ?",
            (key,),
            fetch=True,
        )
        if result.ok and result.data:
            return result.data[0].get("value")
        return None

    @staticmethod
    def _result_count(result: object) -> int:
        try:
            data = getattr(result, "data", None)
            if getattr(result, "ok", False) and isinstance(data, list) and data:
                first = data[0]
                if isinstance(first, dict):
                    return int(first.get("count") or 0)
        except Exception:
            return 0
        return 0

    @staticmethod
    def _kind_counts(kind_result: object) -> dict:
        try:
            data = getattr(kind_result, "data", None)
            if getattr(kind_result, "ok", False) and isinstance(data, list):
                return {
                    row["kind"]: row["count"]
                    for row in data
                    if isinstance(row, dict) and "kind" in row and "count" in row
                }
        except Exception:
            return {}
        return {}

    def _get_tool_capabilities(self) -> dict:
        """Report availability of required tooling (ExifTool/FFprobe)."""
        return {
            "exiftool": self.exiftool.is_available(),
            "ffprobe": self.ffprobe.is_available()
        }
