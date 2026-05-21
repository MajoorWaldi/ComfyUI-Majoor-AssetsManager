"""rgthree custom-node metadata extractor (Blueprint example).

This is a minimal scaffold provided to illustrate how a YAML-manifest
blueprint plugin is shaped. It returns an empty success result and is
intended as a copy-and-modify starting point — extend the ``extract``
method with the actual rgthree parsing logic before relying on it.
"""

from __future__ import annotations

import logging

from mjr_am_backend.features.metadata.plugin_system.base import (
    ExtractionResult,
    ExtractorMetadata,
    MetadataExtractorPlugin,
)

logger = logging.getLogger(__name__)


class RgthreeExtractor(MetadataExtractorPlugin):
    """Skeleton extractor for rgthree-flavored ComfyUI workflows."""

    @property
    def name(self) -> str:
        return "rgthree_extractor"

    @property
    def supported_extensions(self) -> list[str]:
        return [".png", ".webp"]

    @property
    def priority(self) -> int:
        return 50

    @property
    def metadata(self) -> ExtractorMetadata:
        return ExtractorMetadata(
            name=self.name,
            version="0.1.0",
            author="Majoor Assets Manager",
            description="Skeleton extractor for rgthree custom nodes.",
        )

    async def extract(self, filepath: str) -> ExtractionResult:
        # Replace this stub with the real rgthree parsing logic.
        return ExtractionResult(
            success=True,
            data={},
            extractor_name=self.name,
            confidence=0.0,
        )
