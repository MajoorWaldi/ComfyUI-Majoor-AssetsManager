"""
Result pattern for error handling without exceptions.
All service methods return Result[T] to avoid HTTP 500 errors.
"""
from dataclasses import dataclass, field
from typing import Any, Dict, Generic, Optional, TypeVar

T = TypeVar("T")

@dataclass
class Result(Generic[T]):
    """
    Result pattern for safe error handling.

    Usage:
        def get_metadata(path: str) -> Result[dict]:
            if not os.path.exists(path):
                return Result.Err("NOT_FOUND", f"File not found: {path}")
            return Result.Ok({"filename": path})
    """
    ok: bool
    data: Optional[T] = None
    error: Optional[str] = None
    code: str = "OK"  # OK, DEGRADED, TOOL_MISSING, DB_ERROR, UNSUPPORTED, etc.
    meta: Dict[str, Any] = field(default_factory=dict)

    @staticmethod
    def Ok(data: T, **meta) -> "Result[T]":
        """Create a successful result with data and optional metadata."""
        return Result(ok=True, data=data, code="OK", meta=meta)

    @staticmethod
    def Err(code: str, error: str, **meta) -> "Result[T]":
        """Create an error result with code, message, and optional metadata."""
        return Result(ok=False, error=error, code=code, meta=meta)

    def map(self, fn):
        """Map the data if ok, otherwise return self."""
        if self.ok and self.data is not None:
            return Result.Ok(fn(self.data), **self.meta)
        return self

    def unwrap(self) -> T:
        """Get data or raise ValueError if error."""
        if self.ok:
            return self.data
        raise ValueError(f"[{self.code}] {self.error}")

    def unwrap_or(self, default: T) -> T:
        """Get data or return default if error."""
        return self.data if (self.ok and self.data is not None) else default
