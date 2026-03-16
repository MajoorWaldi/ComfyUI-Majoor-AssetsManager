"""
WanVideo Metadata Extractor Plugin

Extracts WanVideo-specific metadata from generated images.
WanVideo stores custom parameters in PNG text chunks.

Installation:
    Copy this file to ~/.comfyui/majoor_plugins/extractors/

Usage:
    Automatically used for PNG/WebP files with WanVideo metadata
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict
import json
import logging

# Import from plugin system
from mjr_am_backend.features.metadata.plugin_system.base import (
    MetadataExtractorPlugin,
    ExtractionResult,
    ExtractorMetadata,
)

logger = logging.getLogger(__name__)


class WanVideoExtractor(MetadataExtractorPlugin):
    """
    Extractor for WanVideo custom node metadata.

    WanVideo stores custom parameters in PNG text chunks:
    - wanv2: WanVideo v2 format
    - wanvideo: Legacy format

    This extractor reads these chunks and extracts:
    - Motion bucket ID
    - FPS setting
    - Augmentation level
    - Source type
    """

    @property
    def name(self) -> str:
        return "wanvideo_extractor"

    @property
    def supported_extensions(self) -> list[str]:
        return ['.png', '.webp']

    @property
    def priority(self) -> int:
        return 100  # High priority - runs before generic extractors

    @property
    def metadata(self) -> ExtractorMetadata:
        return ExtractorMetadata(
            name=self.name,
            version="1.0.0",
            author="Majoor Team",
            description="Extract WanVideo metadata from PNG/WebP files",
            homepage="https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager",
            license="MIT"
        )

    def can_extract(self, filepath: str) -> bool:
        """
        Check if file might contain WanVideo metadata.

        Quick check before full extraction attempt.
        """
        ext = Path(filepath).suffix.lower()
        if ext not in self.supported_extensions:
            return False

        # Optional: Add filename pattern matching
        # WanVideo files often have specific naming patterns
        filename = Path(filepath).name.lower()
        if 'wan' in filename or 'wanvideo' in filename:
            return True

        return True  # Always try for PNG/WebP

    async def pre_extract(self, filepath: str) -> bool:
        """
        Quick pre-check before full extraction.

        Verifies file exists and is readable.
        """
        try:
            path = Path(filepath)
            if not path.exists():
                logger.debug(f"WanVideo pre_extract: File not found: {filepath}")
                return False
            if not path.is_file():
                logger.debug(f"WanVideo pre_extract: Not a file: {filepath}")
                return False
            if path.stat().st_size == 0:
                logger.debug(f"WanVideo pre_extract: Empty file: {filepath}")
                return False
            return True
        except Exception as e:
            logger.debug(f"WanVideo pre_extract failed: {e}")
            return False

    async def extract(self, filepath: str) -> ExtractionResult:
        """
        Extract WanVideo metadata from file.

        Args:
            filepath: Absolute path to PNG/WebP file

        Returns:
            ExtractionResult with WanVideo metadata
        """
        try:
            from PIL import Image

            result_data = {
                # Standard ComfyUI metadata (will be populated)
                "prompt": None,
                "negative_prompt": None,
                "seed": None,
                "steps": None,
                "sampler": None,
                "cfg": None,
                "models": [],
                "loras": [],

                # WanVideo-specific metadata
                "custom_data": {
                    "wan_version": None,
                    "motion_bucket_id": None,
                    "fps": None,
                    "aug_level": None,
                    "source_type": None,
                    "is_wanvideo": True,
                }
            }

            img = None
            try:
                img = Image.open(filepath)

                # Check for WanVideo-specific PNG chunks
                wan_data = None

                # Try v2 format first
                if "wanv2" in img.info:
                    try:
                        wan_data = json.loads(img.info["wanv2"])
                        logger.debug(
                            f"Found WanVideo v2 metadata in {filepath}"
                        )
                    except json.JSONDecodeError as e:
                        logger.warning(
                            f"Failed to parse wanv2 metadata: {e}"
                        )

                # Try legacy format
                elif "wanvideo" in img.info:
                    try:
                        wan_data = json.loads(img.info["wanvideo"])
                        logger.debug(
                            f"Found WanVideo legacy metadata in {filepath}"
                        )
                    except json.JSONDecodeError as e:
                        logger.warning(
                            f"Failed to parse wanvideo metadata: {e}"
                        )

                # Extract WanVideo fields
                if wan_data:
                    result_data["custom_data"].update({
                        "wan_version": wan_data.get("version"),
                        "motion_bucket_id": wan_data.get("motion_bucket_id"),
                        "fps": wan_data.get("fps"),
                        "aug_level": wan_data.get("aug_level"),
                        "source_type": wan_data.get("source_type"),
                    })

                    # Log extracted data for debugging
                    logger.debug(
                        f"WanVideo metadata extracted: "
                        f"version={wan_data.get('version')}, "
                        f"motion_bucket={wan_data.get('motion_bucket_id')}, "
                        f"fps={wan_data.get('fps')}"
                    )

                # Also extract standard ComfyUI metadata
                if "parameters" in img.info:
                    param_string = img.info["parameters"]
                    parsed = self._parse_parameters(param_string)
                    result_data.update(parsed)
                    logger.debug(
                        f"Standard metadata extracted from {filepath}"
                    )

                # Check for workflow JSON in metadata
                if "workflow" in img.info:
                    try:
                        workflow = json.loads(img.info["workflow"])
                        result_data["workflow"] = workflow
                        logger.debug(
                            f"Workflow JSON extracted from {filepath}"
                        )
                    except json.JSONDecodeError:
                        pass

                img.close()

            except Exception as e:
                if img:
                    img.close()
                raise

            # Determine confidence based on what was found
            confidence = self._calculate_confidence(result_data)

            return self._create_success_result(result_data, confidence=confidence)

        except FileNotFoundError:
            logger.warning(f"WanVideo extraction failed: File not found: {filepath}")
            return self._create_error_result(f"File not found: {filepath}")
        except PermissionError:
            logger.warning(f"WanVideo extraction failed: Permission denied: {filepath}")
            return self._create_error_result(f"Permission denied: {filepath}")
        except Exception as e:
            logger.exception(f"WanVideo extraction failed for {filepath}")
            return self._create_error_result(str(e))

    def _parse_parameters(self, param_string: str) -> Dict[str, Any]:
        """
        Parse ComfyUI parameter string.

        Extracts standard fields like seed, steps, sampler, etc.
        """
        result = {
            "prompt": None,
            "negative_prompt": None,
            "seed": None,
            "steps": None,
            "sampler": None,
            "cfg": None,
        }

        try:
            lines = param_string.split('\n')
            for line in lines:
                if ':' not in line:
                    continue

                key, value = line.split(':', 1)
                key = key.strip().lower()
                value = value.strip()

                if key == 'seed':
                    try:
                        result['seed'] = int(value)
                    except ValueError:
                        pass
                elif key == 'steps':
                    try:
                        result['steps'] = int(value)
                    except ValueError:
                        pass
                elif key == 'cfg':
                    try:
                        result['cfg'] = float(value)
                    except ValueError:
                        pass
                elif key == 'sampler':
                    result['sampler'] = value
                elif key == 'prompt':
                    result['prompt'] = value
                elif key == 'negative_prompt':
                    result['negative_prompt'] = value

        except Exception as e:
            logger.debug(f"Failed to parse parameters: {e}")

        return result

    def _calculate_confidence(self, data: Dict[str, Any]) -> float:
        """
        Calculate confidence score based on extracted data.

        Returns:
            Confidence between 0.0 and 1.0
        """
        confidence = 0.5  # Base confidence

        custom_data = data.get("custom_data", {})

        # Higher confidence if WanVideo-specific fields found
        if custom_data.get("wan_version"):
            confidence += 0.2
        if custom_data.get("motion_bucket_id"):
            confidence += 0.1
        if custom_data.get("fps"):
            confidence += 0.1
        if custom_data.get("aug_level"):
            confidence += 0.1

        # Higher confidence if standard metadata also found
        if data.get("seed"):
            confidence += 0.05
        if data.get("steps"):
            confidence += 0.05

        return min(confidence, 1.0)

    async def post_extract(
        self,
        filepath: str,
        result: ExtractionResult
    ) -> ExtractionResult:
        """
        Post-extraction enrichment.

        Adds file information to result.
        """
        if result.success:
            try:
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
        """Cleanup called on plugin unload."""
        logger.debug(f"WanVideoExtractor cleanup complete")
