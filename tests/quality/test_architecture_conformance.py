"""
Architecture conformance tests — enforce ADR 0007 (bounded contexts).

These tests scan JavaScript source files to verify that access layer
boundaries are respected.  Violations cause immediate test failures so
regressions are caught during normal ``pytest`` runs.

Rules enforced
--------------
1. Vue layer purity: no file in ``js/vue/`` may contain a production
   ``import`` of ``comfyApiBridge.js``.
   Only ``hostAdapter.js`` and ``entry.js`` are allowed to import it.
   Status: currently clean — zero violations.

2. Feature-layer ratchet: the set of ``js/features/`` files that
   directly import ``comfyApiBridge.js`` must not grow.
   The known tech-debt violations are listed in KNOWN_FEATURE_VIOLATIONS.
   The test fails if a *new* violation appears; it passes (and prints a
   hint) if the set *shrinks* (i.e. someone fixed a violation).

3. Pinia stores isolation: ``js/vue/stores/`` must not import from
   ``panelRuntime.js``.  Stores are pure reactive state; the imperative
   panel runtime must not leak into the store layer.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
JS_ROOT = REPO_ROOT / "js"

# ---------------------------------------------------------------------------
# All known feature-layer files that violate ADR 0007 by importing
# comfyApiBridge.js directly.  These are catalogued tech-debt items.
#
# HOW TO RESOLVE: replace the direct import with the equivalent call on
# hostAdapter.js (e.g. getRawHostApp(), ready(), isReady()).  Once fixed, remove
# the entry from this set — the test will reward the cleanup automatically.
# ---------------------------------------------------------------------------
KNOWN_FEATURE_VIOLATIONS: frozenset[str] = frozenset({
    # getComfyApp — should use hostAdapter.getRawHostApp() or isReady()
    "js/features/viewer/floatingViewerManager.js",
    "js/features/dnd/DragDrop.js",
    "js/features/viewer/workflowSidebar/NodeWidgetRenderer.js",
    "js/features/viewer/workflowSidebar/sidebarRunButton.js",
    "js/features/viewer/workflowSidebar/widgetAdapters.js",
    # waitForComfyApi — should use hostAdapter.ready()
    "js/features/viewer/LiveStreamTracker.js",
})

# Files that are legitimately allowed to import comfyApiBridge directly.
# This set is intentionally narrow — do not add new entries without an ADR.
ALLOWED_DIRECT_IMPORTERS: frozenset[str] = frozenset({
    "js/app/comfyApiBridge.js",        # the module itself
    "js/app/hostAdapter.js",           # single authorised adapter layer
    "js/entry.js",                     # extension entry point
    "js/app/dialogs.js",               # app-layer dialog helper
    "js/app/toast.js",                 # app-layer toast helper
    "js/app/i18n.js",                  # app-layer i18n integration
    "js/features/runtime/entryUiRegistration.js",  # entry-adjacent registration
})

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_IMPORT_RE = re.compile(r'^(?:import|export)\b.*["\'].*comfyApiBridge', re.MULTILINE)
_PANEL_RUNTIME_IMPORT_RE = re.compile(r'^import\b.*["\'].*panelRuntime', re.MULTILINE)


def _posix_rel(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def _find_js_files(base: Path, *, extensions: tuple[str, ...] = (".js", ".vue", ".mjs")) -> list[Path]:
    if not base.is_dir():
        return []
    return [f for f in base.rglob("*") if f.suffix in extensions]


def _files_importing_bridge(files: list[Path]) -> list[str]:
    """Return posix-relative paths of files that import comfyApiBridge."""
    return [
        _posix_rel(f)
        for f in files
        if _IMPORT_RE.search(f.read_text(encoding="utf-8", errors="replace"))
    ]


# ---------------------------------------------------------------------------
# 1. Vue layer purity
# ---------------------------------------------------------------------------

def test_vue_layer_does_not_import_comfy_api_bridge():
    """
    No file in js/vue/ may directly import comfyApiBridge.js.

    Vue components, composables, and stores must access host capabilities
    exclusively through js/app/hostAdapter.js (ADR 0007 §1).
    """
    vue_dir = JS_ROOT / "vue"
    if not vue_dir.is_dir():
        pytest.skip("js/vue/ not found")

    violations = _files_importing_bridge(_find_js_files(vue_dir))
    assert not violations, (
        "ADR 0007 violation — Vue layer files must not import comfyApiBridge.js directly.\n"
        "Use js/app/hostAdapter.js instead:\n"
        + "\n".join(f"  {v}" for v in sorted(violations))
    )


# ---------------------------------------------------------------------------
# 2. Feature-layer ratchet
# ---------------------------------------------------------------------------

def test_feature_layer_comfy_bridge_violations_do_not_grow():
    """
    The set of feature-layer files directly importing comfyApiBridge.js
    must not exceed KNOWN_FEATURE_VIOLATIONS (ratchet pattern).

    If this test fails there is a new violation — add a tech-debt entry to
    KNOWN_FEATURE_VIOLATIONS and file a backlog ticket to migrate it.
    """
    features_dir = JS_ROOT / "features"
    if not features_dir.is_dir():
        pytest.skip("js/features/ not found")

    current_violations = set(_files_importing_bridge(_find_js_files(features_dir)))
    # Subtract the allowed entry-adjacent importer (legitimate exception)
    current_violations -= ALLOWED_DIRECT_IMPORTERS

    new_violations = current_violations - KNOWN_FEATURE_VIOLATIONS
    assert not new_violations, (
        "ADR 0007 violation — new file(s) in js/features/ import comfyApiBridge.js directly.\n"
        "Route these through js/app/hostAdapter.js or add to KNOWN_FEATURE_VIOLATIONS with a backlog ticket:\n"
        + "\n".join(f"  {v}" for v in sorted(new_violations))
    )

    # Reward any cleanup — print a hint when violations have been resolved.
    resolved = KNOWN_FEATURE_VIOLATIONS - current_violations
    if resolved:
        print(
            "\n[ADR 0007] Tech debt resolved! The following violations have been fixed:\n"
            + "\n".join(f"  {v}" for v in sorted(resolved))
            + "\nPlease remove them from KNOWN_FEATURE_VIOLATIONS in test_architecture_conformance.py."
        )


# ---------------------------------------------------------------------------
# 3. Pinia stores isolation from panelRuntime
# ---------------------------------------------------------------------------

def test_pinia_stores_do_not_import_panel_runtime():
    """
    Pinia stores (js/vue/stores/) must be pure reactive state.
    They must not import from panelRuntime.js (imperative lifecycle layer).

    Allowed: components can import panelRuntime (App.vue is the designated
    Vue-to-runtime bridge), but stores must remain decoupled.
    """
    stores_dir = JS_ROOT / "stores"
    if not stores_dir.is_dir():
        pytest.skip("js/vue/stores/ not found")

    violations = [
        _posix_rel(f)
        for f in _find_js_files(stores_dir)
        if _PANEL_RUNTIME_IMPORT_RE.search(f.read_text(encoding="utf-8", errors="replace"))
    ]
    assert not violations, (
        "ADR 0007 violation — Pinia stores must not import panelRuntime.js.\n"
        "Move runtime coupling to App.vue or a Vue composable:\n"
        + "\n".join(f"  {v}" for v in sorted(violations))
    )


# ---------------------------------------------------------------------------
# 4. No app-layer module imports from vue/ (no circular dependency upward)
# ---------------------------------------------------------------------------

def test_app_layer_does_not_import_from_vue():
    """
    js/app/ modules must not import from js/vue/ — that would create a
    circular dependency (vue/App.vue → app/… → vue/…).
    """
    app_dir = JS_ROOT / "app"
    if not app_dir.is_dir():
        pytest.skip("js/app/ not found")

    vue_import_re = re.compile(r'^(?:import|export)\b.*["\'].*[./]vue/', re.MULTILINE)
    violations = [
        _posix_rel(f)
        for f in _find_js_files(app_dir)
        if vue_import_re.search(f.read_text(encoding="utf-8", errors="replace"))
    ]
    assert not violations, (
        "Circular dependency — js/app/ must not import from js/vue/:\n"
        + "\n".join(f"  {v}" for v in sorted(violations))
    )
