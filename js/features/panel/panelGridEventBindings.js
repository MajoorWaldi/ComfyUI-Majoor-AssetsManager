import { comfyToast } from "../../app/toast.js";
import { t } from "../../app/i18n.js";

/**
 * Registers all grid-level and window-level event listeners that drive the
 * panel's reactive reload and UI-update flows.
 *
 * Covered events:
 *   gridContainer  – mjr:reload-grid, mjr:badge-duplicates-focus
 *   window         – mjr:reload-grid (global), mjr:sort-changed,
 *                    mjr:collections-changed
 *
 * All listeners registered on `window` are removed automatically when
 * `panelLifecycleAC` is aborted.  Grid-container listeners are also registered
 * through the AbortController signal AND tracked in `registerSummaryDispose`
 * so they are torn down during full panel dispose.
 */
export function bindGridEvents({
    gridContainer,
    panelLifecycleAC,
    requestQueuedReload,
    notifyContextChanged,
    markUserInteraction,
    writePanelValue,
    popovers,
    collectionsPopover,
    gridController,
    registerSummaryDispose,
}) {
    // ── gridContainer: mjr:reload-grid ─────────────────────────────────────
    let _reloadGridHandler = null;
    try {
        _reloadGridHandler = () => requestQueuedReload();
        gridContainer.addEventListener("mjr:reload-grid", _reloadGridHandler, {
            signal: panelLifecycleAC?.signal,
        });
        registerSummaryDispose(() => {
            try {
                if (_reloadGridHandler)
                    gridContainer.removeEventListener("mjr:reload-grid", _reloadGridHandler);
            } catch (e) {
                console.debug?.(e);
            }
            _reloadGridHandler = null;
        });
    } catch (e) {
        console.debug?.(e);
    }

    // ── gridContainer: mjr:badge-duplicates-focus ──────────────────────────
    try {
        const onDuplicateBadgeFocus = (e) => {
            try {
                const detail = e?.detail || {};
                const filenameKey = String(detail?.filenameKey || "")
                    .trim()
                    .toLowerCase();
                if (!filenameKey || !gridContainer) return;
                const cards = Array.from(gridContainer.querySelectorAll(".mjr-asset-card")).filter(
                    (card) =>
                        String(card?.dataset?.mjrFilenameKey || "")
                            .trim()
                            .toLowerCase() === filenameKey,
                );
                if (!cards.length) return;
                const ids = cards
                    .map((card) => String(card?.dataset?.mjrAssetId || "").trim())
                    .filter(Boolean);
                const activeId = String(cards[0]?.dataset?.mjrAssetId || ids[0] || "").trim();
                if (ids.length && typeof gridContainer?._mjrSetSelection === "function") {
                    gridContainer._mjrSetSelection(ids, activeId);
                }
                cards[0]?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
                markUserInteraction();
                notifyContextChanged();
                const n = Number(detail?.count || ids.length || cards.length || 0);
                try {
                    comfyToast(
                        t(
                            "toast.nameCollisionInView",
                            "Name collision in view: {n} item(s) selected",
                            { n },
                        ),
                        "info",
                        1800,
                    );
                } catch (e) {
                    console.debug?.(e);
                }
            } catch (e) {
                console.debug?.(e);
            }
        };
        gridContainer.addEventListener("mjr:badge-duplicates-focus", onDuplicateBadgeFocus, {
            signal: panelLifecycleAC?.signal,
        });
        registerSummaryDispose(() => {
            try {
                gridContainer.removeEventListener(
                    "mjr:badge-duplicates-focus",
                    onDuplicateBadgeFocus,
                );
            } catch (e) {
                console.debug?.(e);
            }
        });
    } catch (e) {
        console.debug?.(e);
    }

    // ── window: mjr:reload-grid (global) ───────────────────────────────────
    try {
        window.addEventListener(
            "mjr:reload-grid",
            (event) => {
                try {
                    if (panelLifecycleAC?.signal?.aborted) return;
                } catch (e) {
                    console.debug?.(e);
                }
                try {
                    if (globalThis?._mjrMaintenanceActive) return;
                } catch (e) {
                    console.debug?.(e);
                }
                // Only process explicit, reasoned global reload requests.
                // This avoids accidental reloads from anonymous CustomEvents emitted elsewhere.
                const reason = String(event?.detail?.reason || "").trim();
                if (!reason) return;
                requestQueuedReload();
            },
            { signal: panelLifecycleAC?.signal },
        );
    } catch (e) {
        console.debug?.(e);
    }

    // ── window: mjr:sort-changed ───────────────────────────────────────────
    // Handles sort changes dispatched by the Vue SortPopover component.
    // gridController.reloadGrid() deduplicates concurrent requests.
    try {
        window.addEventListener(
            "mjr:sort-changed",
            () => {
                try {
                    if (panelLifecycleAC?.signal?.aborted) return;
                } catch (e) {
                    console.debug?.(e);
                }
                try {
                    notifyContextChanged();
                } catch (e) {
                    console.debug?.(e);
                }
                gridController.reloadGrid().catch(() => {});
            },
            { signal: panelLifecycleAC?.signal },
        );
    } catch (e) {
        console.debug?.(e);
    }

    // ── window: mjr:collections-changed ───────────────────────────────────
    try {
        window.addEventListener(
            "mjr:collections-changed",
            (event) => {
                try {
                    if (panelLifecycleAC?.signal?.aborted) return;
                } catch (e) {
                    console.debug?.(e);
                }
                const detail =
                    event?.detail && typeof event.detail === "object" ? event.detail : {};
                const nextCollectionId = String(detail.collectionId || "").trim();
                const nextCollectionName = String(detail.collectionName || "").trim();
                try {
                    writePanelValue("collectionId", nextCollectionId);
                    writePanelValue("collectionName", nextCollectionName);
                } catch (e) {
                    console.debug?.(e);
                }
                try {
                    notifyContextChanged();
                } catch (e) {
                    console.debug?.(e);
                }
                try {
                    if (detail.close !== false) popovers.close(collectionsPopover);
                } catch (e) {
                    console.debug?.(e);
                }
                if (detail.reload === false) return;
                gridController.reloadGrid().catch(() => {});
            },
            { signal: panelLifecycleAC?.signal },
        );
    } catch (e) {
        console.debug?.(e);
    }
}
