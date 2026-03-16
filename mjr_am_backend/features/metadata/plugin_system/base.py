"""
Plugin System - Base Interface

Defines the abstract base class for metadata extractor plugins.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class ExtractorMetadata:
    """Metadata about an extractor plugin."""
    name: str
    version: str = "1.0.0"
    author: str = "Unknown"
    description: str = ""
    homepage: str = ""
    license: str = "MIT"


@dataclass
class ExtractionResult:
    """Result from metadata extraction."""
    success: bool
    data: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    extractor_name: str = ""
    confidence: float = 1.0  # 0.0-1.0, for fuzzy matching


class MetadataExtractorPlugin(ABC):
    """
    Abstract base class for metadata extractor plugins.

    All plugins must inherit from this class and implement
    the required methods.

    Example:
        class MyExtractor(MetadataExtractorPlugin):
            @property
            def name(self): return "my_extractor"

            @property
            def supported_extensions(self): return ['.png', '.webp']

            async def extract(self, filepath): ...
    """

    # ─── Required Properties ───────────────────────────────────────

    @property
    @abstractmethod
    def name(self) -> str:
        """
        Unique plugin identifier.

        Must be lowercase, alphanumeric with underscores.
        Example: "wanvideo_extractor", "rgthree_extractor"
        """
        pass

    @property
    @abstractmethod
    def supported_extensions(self) -> List[str]:
        """
        File extensions this extractor handles.

        Returns:
            List of extensions including dot, e.g., ['.png', '.webp']
        """
        pass

    @property
    @abstractmethod
    def priority(self) -> int:
        """
        Extraction priority (higher = runs first).

        Priority levels:
        - 100-999: Custom node-specific extractors
        - 50-99:   Format-specific extractors
        - 1-49:    Generic/fallback extractors
        """
        pass

    # ─── Optional Properties ───────────────────────────────────────

    @property
    def metadata(self) -> ExtractorMetadata:
        """Plugin metadata (optional, provides defaults)."""
        return ExtractorMetadata(name=self.name)

    @property
    def min_compatibility_version(self) -> str:
        """Minimum Majoor version required (default: "2.4.0")."""
        return "2.4.0"

    # ─── Required Methods ──────────────────────────────────────────

    @abstractmethod
    async def extract(self, filepath: str) -> ExtractionResult:
        """
        Extract metadata from file.

        Args:
            filepath: Absolute path to file

        Returns:
            ExtractionResult with success status and data

        Raises:
            Any exceptions should be caught and returned as
            ExtractionResult(success=False, error=str(exc))
        """
        pass

    # ─── Optional Methods ──────────────────────────────────────────

    def can_extract(self, filepath: str) -> bool:
        """
        Check if this extractor can handle the file.

        Default implementation checks file extension.
        Override for more complex detection logic.
        """
        ext = Path(filepath).suffix.lower()
        return ext in self.supported_extensions

    async def pre_extract(self, filepath: str) -> bool:
        """
        Pre-extraction hook (optional).

        Called before extract(). Return False to skip extraction.
        Useful for quick validation checks.
        """
        return True

    async def post_extract(
        self,
        filepath: str,
        result: ExtractionResult
    ) -> ExtractionResult:
        """
        Post-extraction hook (optional).

        Called after extract(). Can modify result.
        Useful for cleanup or data enrichment.
        """
        return result

    async def cleanup(self) -> None:
        """
        Cleanup hook called on plugin unload.

        Override to release resources, close connections, etc.
        """
        pass

    # ─── Helper Methods ────────────────────────────────────────────

    def _create_success_result(
        self,
        data: Dict[str, Any],
        confidence: float = 1.0
    ) -> ExtractionResult:
        """Helper to create success result."""
        return ExtractionResult(
            success=True,
            data=data,
            extractor_name=self.name,
            confidence=confidence
        )

    def _create_error_result(
        self,
        error: str
    ) -> ExtractionResult:
        """Helper to create error result."""
        return ExtractionResult(
            success=False,
            error=error,
            extractor_name=self.name
        )
