"""
Result pattern for error handling without exceptions.
All service methods return Result[T] to avoid HTTP 500 errors.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Generic, Optional, TypeVar, cast

from .types import ErrorCode

T = TypeVar("T")
U = TypeVar("U")

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
    meta: dict[str, Any] = field(default_factory=dict)

    @staticmethod
    def Ok(data: T, **meta: Any) -> "Result[T]":
        """Create a successful result with data and optional metadata."""
        return Result(ok=True, data=data, code="OK", meta=meta)

    @staticmethod
    def Err(code: ErrorCode | str | Enum, error: str, **meta: Any) -> "Result[T]":
        """Create an error result with code, message, and optional metadata."""
        try:
            code_value = code.value if isinstance(code, Enum) else code
        except Exception:
            code_value = code
        return Result(ok=False, error=error, code=str(code_value), meta=meta)

    def map(self, fn: Callable[[T], U]) -> "Result[U]":
        """Map the data if ok, otherwise return self."""
        if self.ok and self.data is not None:
            return Result.Ok(fn(self.data), **self.meta)
        return cast(Result[U], self)

    def unwrap(self) -> T:
        """Get data or raise ValueError if error."""
        if self.ok and self.data is not None:
            return self.data
        raise ValueError(f"[{self.code}] {self.error}")

    def unwrap_or(self, default: T) -> T:
        """Get data or return default if error."""
        return self.data if (self.ok and self.data is not None) else default
