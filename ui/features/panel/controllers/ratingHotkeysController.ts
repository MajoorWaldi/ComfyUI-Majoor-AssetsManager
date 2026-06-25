import { updateAssetRating } from "../../../api/client.js";
import { ASSET_RATING_CHANGED_EVENT } from "../../../app/events.js";
import { comfyToast } from "../../../app/toast.js";
import { t } from "../../../app/i18n.js";
import { getHotkeysState, isHotkeysSuspended, setRatingHotkeysActive } from "./hotkeysState.js";
import { getSelectedIdSet } from "../../grid/GridSelectionManager.js";

const EVENT_NAME = ASSET_RATING_CHANGED_EVENT;

function _safeCssEscapeAttr(value: any) {
    const str = String(value ?? "");
    try {
        if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
            return CSS.escape(str);
        }
    } catch (e) {
        console.debug?.(e);
    }
    return str.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}

function getSelectedAssetIds(gridContainer: any, fallbackEventTarget: any = null): string[] {
    if (!gridContainer) return [];
    // Read from the selection dataset rather than querying `.is-selected` DOM cards -
    // the grid is virtualized, so the active asset's card may not be rendered at all
    // (e.g. scrolled out of view while the floating viewer is open) even though it's selected.
    try {
        const ids = Array.from(getSelectedIdSet(gridContainer));
        if (ids.length) return ids;
    } catch (e) {
        console.debug?.(e);
    }

    try {
        const card = fallbackEventTarget?.closest?.(".mjr-asset-card");
        const id = card?._mjrAsset?.id ?? card?.dataset?.mjrAssetId;
        if (card && gridContainer.contains(card) && id != null) return [String(id)];
    } catch (e) {
        console.debug?.(e);
    }

    return [];
}

function findRenderedCard(gridContainer: any, assetId: any) {
    try {
        return gridContainer?.querySelector?.(
            `.mjr-asset-card[data-mjr-asset-id="${_safeCssEscapeAttr(assetId)}"]`,
        );
    } catch (e) {
        console.debug?.(e);
        return null;
    }
}

function updateCardRatingBadge(card: any, createRatingBadge: any, rating: any) {
    if (!card) return;
    const asset = card._mjrAsset;
    if (asset) asset.rating = rating;

    try {
        const thumb = card.querySelector(".mjr-thumb");
        if (!thumb) return;
        const oldRatingBadge = card.querySelector(".mjr-rating-badge");
        const newBadge = createRatingBadge ? createRatingBadge(rating || 0) : null;

        if (oldRatingBadge && newBadge) {
            oldRatingBadge.replaceWith(newBadge);
        } else if (oldRatingBadge && !newBadge) {
            oldRatingBadge.remove();
        } else if (!oldRatingBadge && newBadge) {
            thumb.appendChild(newBadge);
        }
    } catch (e) {
        console.debug?.(e);
    }
}

async function runWithConcurrencyLimit(items: any, worker: any, limit = 5) {
    const max = Math.max(1, Number(limit) || 1);
    let index = 0;
    const runners: any[] = [];
    const runOne = async () => {
        while (index < items.length) {
            const cur = index;
            index += 1;
            try {
                await worker(items[cur], cur);
            } catch (e) {
                console.debug?.(e);
            }
        }
    };
    for (let i = 0; i < Math.min(max, items.length); i += 1) {
        runners.push(runOne());
    }
    await Promise.all(runners);
}

export function createRatingHotkeysController({ gridContainer, createRatingBadge }: { gridContainer?: any; createRatingBadge?: unknown } = {}): Record<string, any> {
    let bound = false;
    let onKeyDown: any = null;
    let onRatingEvent: any = null;

    const applyRatingToAsset = async (assetId: any, rating: any) => {
        if (assetId == null) return;

        try {
            const result = await updateAssetRating(assetId, rating);
            if (!result?.ok) {
                comfyToast(result?.error || t("toast.ratingUpdateFailed"), "error");
                return;
            }
            comfyToast(t("toast.ratingSetN", { n: rating }), "success", 1500);
        } catch {
            comfyToast(t("toast.ratingUpdateError"), "error");
            return;
        }

        // Broadcasting here also drives the badge refresh via the onRatingEvent listener
        // below, which finds the card (if currently rendered) and updates it.
        try {
            window.dispatchEvent(
                new CustomEvent(EVENT_NAME, { detail: { assetId: String(assetId), rating } }),
            );
        } catch (e) {
            console.debug?.(e);
        }
    };

    const bind = () => {
        if (bound || !gridContainer) return;
        bound = true;
        setRatingHotkeysActive(true);

        onKeyDown = async (e: any) => {
            // Check if hotkeys are suspended (e.g. when dialogs/popovers are open)
            if (isHotkeysSuspended()) return;

            // Check if viewer has hotkey priority
            if (getHotkeysState().scope === "viewer") return;

            if (e.defaultPrevented) return;
            const k = String(e.key || "");

            if (k !== "0" && k !== "1" && k !== "2" && k !== "3" && k !== "4" && k !== "5") return;

            // Check if viewer is open - let it handle rating keys
            const viewerOverlay = document.querySelector(".mjr-viewer-overlay");
            if (viewerOverlay && (viewerOverlay as HTMLElement).style.display !== "none") return;

            // Check if the event target is within our grid container or if the grid container itself has focus/hover
            // This ensures rating hotkeys only work when interacting with the assets manager.
            // The floating viewer lives outside the grid DOM (it's a separate overlay), so also
            // allow targets inside it - e.g. focus lands on its mute/speed controls after use.
            const isTargetInGrid = gridContainer.contains(e.target) || gridContainer === e.target;
            const isTargetInFloatingViewer = !!e.target?.closest?.(".mjr-mfv");
            if (!isTargetInGrid && !isTargetInFloatingViewer) return; // Only handle rating keys when interacting with our grid

            const rating = k === "0" ? 0 : Number(k);
            if (!Number.isFinite(rating)) return;

            const assetIds = getSelectedAssetIds(gridContainer, e.target);
            if (!assetIds.length) return;

            // Only prevent default and stop propagation if we're actually handling the key
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation?.();

            await runWithConcurrencyLimit(assetIds, (id: any) => applyRatingToAsset(id, rating), 5);
        };

        onRatingEvent = (ev: any) => {
            const detail = ev?.detail || {};
            const assetId = detail.assetId ?? detail.id ?? null;
            const rating = Number(detail.rating);
            if (!assetId || !Number.isFinite(rating)) return;
            const card = findRenderedCard(gridContainer, assetId);
            if (card) updateCardRatingBadge(card, createRatingBadge, rating);
        };

        try {
            // Use window-level listener with capture phase to ensure it works regardless of focus
            window.addEventListener("keydown", onKeyDown, { capture: true });
        } catch (e) {
            console.debug?.(e);
        }
        try {
            window.addEventListener(EVENT_NAME, onRatingEvent);
        } catch (e) {
            console.debug?.(e);
        }
    };

    const dispose = () => {
        if (!bound) return;
        bound = false;
        setRatingHotkeysActive(false);
        try {
            // Remove window-level listener
            window.removeEventListener("keydown", onKeyDown, { capture: true });
        } catch (e) {
            console.debug?.(e);
        }
        try {
            window.removeEventListener(EVENT_NAME, onRatingEvent);
        } catch (e) {
            console.debug?.(e);
        }
        onKeyDown = null;
        onRatingEvent = null;
    };

    return { bind, dispose };
}
