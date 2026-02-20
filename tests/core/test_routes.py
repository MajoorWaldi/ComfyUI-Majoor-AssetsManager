"""
Test routes registration without starting full ComfyUI.
"""
import sys

import pytest

# Fix Windows console encoding
if sys.platform == "win32":
    import os
    os.system("")
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding='utf-8')

from aiohttp import web
from mjr_am_shared import get_logger, log_success

logger = get_logger(__name__)

@pytest.mark.asyncio
async def test_routes():
    """Test route registration."""
    logger.info("Testing route registration...")

    # Create test app
    app = web.Application()

    # Register routes
    from mjr_am_backend.routes import register_routes
    register_routes(app)

    # List registered routes
    logger.info("Registered routes:")
    for route in app.router.routes():
        logger.info(f"  {route.method:6s} {route.resource.canonical}")

    log_success(logger, "Routes registered successfully!")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_routes())
