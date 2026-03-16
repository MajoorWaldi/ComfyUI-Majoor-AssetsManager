"""
Custom Node Metadata Extractor - Template

Template for creating custom metadata extractors for any ComfyUI custom node.

Copy this file and modify it to extract metadata from your custom node.

Installation:
    1. Copy this file to ~/.comfyui/majoor_plugins/extractors/
    2. Rename to <your_node>_extractor.py
    3. Modify the extraction logic for your node
    4. Restart ComfyUI or reload plugins via API

Documentation:
    See docs/PLUGIN_SYSTEM_DESIGN.md for complete API reference
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional
import json
import logging

# Import from plugin system
from mjr_am_backend.features.metadata.plugin_system.base import (
    MetadataExtractorPlugin,
    ExtractionResult,
    ExtractorMetadata,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# PLUGIN CLASS
# ─────────────────────────────────────────────────────────────────────────────

class CustomNodeExtractor(MetadataExtractorPlugin):
    """
    Template extractor for custom nodes.

    Replace this with your actual extractor implementation.

    Example use cases:
    - Extract WanVideo motion parameters
    - Extract rgthree comparison data
    - Extract ControlNet conditioning
    - Extract IPAdapter references
    - Extract AnimateDiff frames
    """

    # ─── Required Properties ───────────────────────────────────────────

    @property
    def name(self) -> str:
        """
        Unique plugin identifier.

        Must be lowercase, alphanumeric with underscores.
        Examples: "wanvideo_extractor", "rgthree_extractor", "controlnet_extractor"
        """
        return "custom_node_extractor"

    @property
    def supported_extensions(self) -> list[str]:
        """
        File extensions this extractor handles.

        Common values:
        - ['.png'] - PNG files only
        - ['.png', '.webp'] - PNG and WebP
        - ['.json'] - Workflow JSON files
        - ['.gif'] - Animated GIFs
        """
        return ['.png', '.webp']

    @property
    def priority(self) -> int:
        """
        Extraction priority (higher = runs first).

        Priority levels:
        - 100-999: Custom node-specific extractors (run first)
        - 50-99:   Format-specific extractors
        - 1-49:    Generic/fallback extractors

        Set high priority if your extractor is very specific.
        Set low priority if it's a general-purpose extractor.
        """
        return 50

    # ─── Optional Properties ───────────────────────────────────────────

    @property
    def metadata(self) -> ExtractorMetadata:
        """
        Plugin metadata (displayed in UI).

        Provide information about your plugin.
        """
        return ExtractorMetadata(
            name=self.name,
            version="1.0.0",
            author="Your Name",
            description="Extract metadata from custom node XYZ",
            homepage="https://github.com/yourusername/your-repo",
            license="MIT"
        )

    @property
    def min_compatibility_version(self) -> str:
        """
        Minimum Majoor version required.

        Use semantic versioning: "2.4.0", "2.5.0", etc.
        """
        return "2.4.0"

    # ─── Optional Methods ──────────────────────────────────────────────

    def can_extract(self, filepath: str) -> bool:
        """
        Check if this extractor can handle the file.

        Default implementation checks file extension.
        Override for more complex detection logic.

        Examples:
        - Check filename patterns
        - Check file magic bytes
        - Check file size constraints
        """
        # Default: check extension
        ext = Path(filepath).suffix.lower()
        if ext not in self.supported_extensions:
            return False

        # Optional: Add filename pattern matching
        # filename = Path(filepath).name.lower()
        # if 'mypattern' in filename:
        #     return True

        # Optional: Add file size check
        # try:
        #     size = Path(filepath).stat().st_size
        #     if size > 100 * 1024 * 1024:  # 100MB limit
        #         return False
        # except Exception:
        #     return False

        return True

    async def pre_extract(self, filepath: str) -> bool:
        """
        Pre-extraction hook.

        Called before extract(). Return False to skip extraction.
        Useful for quick validation checks.

        Common checks:
        - File exists
        - File is readable
        - File is not empty
        - File has valid format
        """
        try:
            path = Path(filepath)
            if not path.exists():
                logger.debug(f"Pre-extract: File not found: {filepath}")
                return False
            if not path.is_file():
                logger.debug(f"Pre-extract: Not a file: {filepath}")
                return False
            if path.stat().st_size == 0:
                logger.debug(f"Pre-extract: Empty file: {filepath}")
                return False
            return True
        except Exception as e:
            logger.debug(f"Pre-extract failed: {e}")
            return False

    # ─── Required Method ───────────────────────────────────────────────

    async def extract(self, filepath: str) -> ExtractionResult:
        """
        Extract metadata from file.

        This is the main extraction method. Implement your custom logic here.

        Args:
            filepath: Absolute path to file

        Returns:
            ExtractionResult with success status and data

        Standard metadata fields:
        - prompt: str - Main generation prompt
        - negative_prompt: str - Negative prompt
        - seed: int - Random seed
        - steps: int - Sampling steps
        - sampler: str - Sampler name
        - cfg: float - CFG scale
        - models: list - Model names/paths
        - loras: list - LoRA names/weights
        - custom_data: dict - Custom node-specific data

        Example implementation:
        """
        try:
            # Initialize result structure
            result_data = {
                # Standard ComfyUI metadata
                "prompt": None,
                "negative_prompt": None,
                "seed": None,
                "steps": None,
                "sampler": None,
                "cfg": None,
                "models": [],
                "loras": [],

                # Custom node-specific data
                "custom_data": {
                    # Add your custom fields here
                    "my_node_version": None,
                    "my_node_parameter": None,
                }
            }

            # ─── EXTRACTION LOGIC ──────────────────────────────────────

            # Example 1: Extract from PNG metadata
            if filepath.lower().endswith(('.png', '.webp')):
                result_data.update(
                    await self._extract_from_image(filepath)
                )

            # Example 2: Extract from workflow JSON
            elif filepath.lower().endswith('.json'):
                result_data.update(
                    await self._extract_from_json(filepath)
                )

            # Example 3: Extract from video file
            elif filepath.lower().endswith(('.mp4', '.webm', '.gif')):
                result_data.update(
                    await self._extract_from_video(filepath)
                )

            # ────────────────────────────────────────────────────────────

            # Calculate confidence (0.0-1.0)
            confidence = self._calculate_confidence(result_data)

            return self._create_success_result(result_data, confidence=confidence)

        except Exception as e:
            logger.exception(f"Extraction failed for {filepath}")
            return self._create_error_result(str(e))

    # ─── Optional Methods ──────────────────────────────────────────────

    async def post_extract(
        self,
        filepath: str,
        result: ExtractionResult
    ) -> ExtractionResult:
        """
        Post-extraction hook.

        Called after extract(). Can modify result.
        Useful for:
        - Adding file information
        - Enriching data
        - Cleanup
        """
        if result.success:
            try:
                # Add file information
                path = Path(filepath)
                result.data["file_info"] = {
                    "filename": path.name,
                    "size_bytes": path.stat().st_size,
                    "extension": path.suffix.lower(),
                }
            except Exception as e:
                logger.debug(f"Failed to add file info: {e}")

        return result

    async def cleanup(self) -> None:
        """
        Cleanup hook called on plugin unload.

        Override to release resources, close connections, etc.
        """
        logger.debug(f"{self.name} cleanup complete")

    # ─── Helper Methods (Examples) ─────────────────────────────────────

    async def _extract_from_image(self, filepath: str) -> Dict[str, Any]:
        """
        Extract metadata from image file.

        Example implementation using PIL/Pillow.
        """
        result = {}

        try:
            from PIL import Image

            img = None
            try:
                img = Image.open(filepath)

                # Extract from PNG text chunks
                if "parameters" in img.info:
                    result["prompt"] = img.info["parameters"]

                # Extract custom node metadata
                if "my_custom_node" in img.info:
                    custom_data = json.loads(img.info["my_custom_node"])
                    result["custom_data"] = custom_data

                # Extract workflow JSON
                if "workflow" in img.info:
                    workflow = json.loads(img.info["workflow"])
                    result["workflow"] = workflow

            finally:
                if img:
                    img.close()

        except ImportError:
            logger.warning("PIL not available, skipping image extraction")
        except Exception as e:
            logger.debug(f"Image extraction failed: {e}")

        return result

    async def _extract_from_json(self, filepath: str) -> Dict[str, Any]:
        """
        Extract metadata from workflow JSON.

        Example implementation for parsing ComfyUI workflow files.
        """
        result = {"custom_data": {}}

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                workflow = json.load(f)

            # Find nodes of your custom type
            nodes = workflow.get("nodes", [])
            custom_nodes = [
                n for n in nodes
                if n.get("type", "").startswith("YourCustomNodeType")
            ]

            if custom_nodes:
                result["custom_data"]["nodes"] = custom_nodes
                result["custom_data"]["node_count"] = len(custom_nodes)

        except Exception as e:
            logger.debug(f"JSON extraction failed: {e}")

        return result

    async def _extract_from_video(self, filepath: str) -> Dict[str, Any]:
        """
        Extract metadata from video file.

        Example implementation using ffprobe or similar.
        """
        result = {"custom_data": {}}

        try:
            # Use ffprobe if available
            import subprocess

            cmd = [
                "ffprobe",
                "-v", "quiet",
                "-print_format", "json",
                "-show_format",
                "-show_streams",
                filepath
            ]

            result_proc = subprocess.run(
                cmd, capture_output=True, text=True, timeout=30
            )

            if result_proc.returncode == 0:
                metadata = json.loads(result_proc.stdout)
                result["custom_data"]["video_info"] = metadata

        except Exception as e:
            logger.debug(f"Video extraction failed: {e}")

        return result

    def _calculate_confidence(self, data: Dict[str, Any]) -> float:
        """
        Calculate confidence score based on extracted data.

        Returns:
            Confidence between 0.0 and 1.0

        Higher confidence = more data extracted successfully.
        """
        confidence = 0.5  # Base confidence

        # Increase confidence for each field found
        if data.get("prompt"):
            confidence += 0.1
        if data.get("seed"):
            confidence += 0.1
        if data.get("steps"):
            confidence += 0.1
        if data.get("custom_data"):
            confidence += 0.1
        if data.get("workflow"):
            confidence += 0.1

        return min(confidence, 1.0)


# ─────────────────────────────────────────────────────────────────────────────
# ALTERNATIVE: Simple Extractor Example
# ─────────────────────────────────────────────────────────────────────────────

class SimpleExtractor(MetadataExtractorPlugin):
    """
    Simple extractor example for quick prototyping.

    Copy this class and modify for your needs.
    """

    @property
    def name(self) -> str:
        return "simple_extractor"

    @property
    def supported_extensions(self) -> list[str]:
        return ['.png']

    @property
    def priority(self) -> int:
        return 25

    async def extract(self, filepath: str) -> ExtractionResult:
        """Minimal extraction logic."""
        try:
            # Your extraction logic here
            data = {
                "custom_data": {
                    "extracted_from": filepath,
                }
            }
            return self._create_success_result(data)
        except Exception as e:
            return self._create_error_result(str(e))
