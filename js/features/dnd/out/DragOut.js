/**
 * Drag-out support (AssetsManager -> OS / Explorer).
 *
 * Implements "DownloadURL" + "text/uri-list" so users can drop an asset
 * outside ComfyUI (desktop, Explorer, other apps).
 *
 * Also supports multi-selection: creates a temporary ZIP on the backend and
 * drags that ZIP URL instead of individual files. S+drag requests a clean
 * metadata-stripped ZIP/file instead of the original payload.
 */

import { post } from "../../../api/client.js";
import {
    ENDPOINTS,
    buildBatchZipDownloadURL,
    buildCleanDownloadURL,
} from "../../../api/endpoints.js";
import { getDownloadMimeForFilename } from "../utils/video.js";
import { createSecureToken, pickRootId } from "../../../utils/ids.js";
import { consumeInternalDropOccurred } from "../runtimeState.js";

const _abs = (url) => {
    try {
        return new URL(String(url || ""), window.location.href).href;
    } catch {
        return String(url || "");
    }
};

const _makeToken = () => {
    return createSecureToken("mjr_", 24);
};

const _assetToZipItem = (asset) => {
    const a = asset && typeof asset === "object" ? asset : null;
    if (!a) return null;
    const filename = a.filename || a.name;
    if (!filename) return null;
    return {
        filename,
        subfolder: a.subfolder || "",
        type: String(a.type || "output").toLowerCase(),
        root_id: pickRootId(a) || undefined,
    };
};

const _getSelectedAssets = (containerEl, draggedCard) => {
    const out = [];
    if (!containerEl || !draggedCard) return out;

    const draggedId = draggedCard?.dataset?.mjrAssetId
        ? String(draggedCard.dataset.mjrAssetId)
        : "";

    // Prefer the grid's canonical selection API when available. It is more
    // reliable than reconstructing selection from currently rendered cards.
    try {
        const selectedAssets =
            typeof containerEl?._mjrGetSelectedAssets === "function"
                ? containerEl._mjrGetSelectedAssets()
                : [];
        if (Array.isArray(selectedAssets) && selectedAssets.length) {
            const selected = selectedAssets.filter((asset) => asset && typeof asset === "object");
            if (
                selected.length &&
                draggedId &&
                selected.some((asset) => String(asset?.id || "") === draggedId)
            ) {
                return selected;
            }
        }
    } catch (e) {
        console.debug?.(e);
    }

    let selectedIds = [];
    try {
        const raw = containerEl.dataset?.mjrSelectedAssetIds;
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) selectedIds = parsed.map(String).filter(Boolean);
        }
    } catch (e) {
        console.debug?.(e);
    }

    // If dataset is available, use full asset list (VirtualGrid-safe).
    if (selectedIds.length) {
        try {
            if (!draggedId || !selectedIds.includes(draggedId)) return out;
            const allAssets =
                typeof containerEl?._mjrGetAssets === "function" ? containerEl._mjrGetAssets() : [];
            for (const a of allAssets || []) {
                const id = String(a?.id || "");
                if (id && selectedIds.includes(id)) out.push(a);
            }
            if (out.length) return out;
        } catch (e) {
            console.debug?.(e);
        }
    }

    // Fallback: DOM selection state (visible cards only).
    let selectedCards;
    try {
        selectedCards =
            Array.from(containerEl.querySelectorAll(".mjr-asset-card.is-selected")) || [];
    } catch {
        selectedCards = [];
    }

    // Only treat it as "multi" if the dragged card is part of the selection.
    try {
        if (!selectedCards.includes(draggedCard)) {
            return out;
        }
    } catch {
        return out;
    }

    for (const el of selectedCards) {
        const asset = el?._mjrAsset;
        if (!asset || typeof asset !== "object") continue;
        out.push(asset);
    }
    return out;
};

const _resolveFilepath = (asset) => {
    if (!asset || typeof asset !== "object") return "";
    // Direct filepath from backend.
    const fp = asset.filepath || asset.path || asset?.file_info?.filepath || "";
    if (fp) return String(fp);
    return "";
};

export const applyDragOutToOS = ({ dt, asset, containerEl, card, viewUrl, stripMetadata = false }) => {
    if (!dt || !asset) return;

    const selected = _getSelectedAssets(containerEl, card);
    if (Array.isArray(selected) && selected.length > 1) {
        const items = selected.map(_assetToZipItem).filter(Boolean);
        if (items.length > 1) {
            let token = "";
            try {
                token = _makeToken();
            } catch (e) {
                console.warn("[DragOut] failed to create secure batch token", e);
            }

            if (token) {
                // Fire-and-forget zip build. Never block dragstart.
                try {
                    post(ENDPOINTS.BATCH_ZIP_CREATE, {
                        token,
                        items,
                        strip_metadata: !!stripMetadata,
                    }).catch(() => {});
                } catch (e) {
                    console.debug?.(e);
                }

                const url = _abs(buildBatchZipDownloadURL(token));
                const zipName = stripMetadata
                    ? `Majoor_Clean_Batch_${items.length}.zip`
                    : `Majoor_Batch_${items.length}.zip`;
                try {
                    dt.setData("text/uri-list", url);
                    dt.setData("DownloadURL", `application/zip:${zipName}:${url}`);
                    dt.effectAllowed = "copy";
                } catch (e) {
                    console.debug?.(e);
                }
                return;
            }
        }
    }

    // Single asset drag-out.
    const filename = asset.filename || asset.name;
    if (!filename) return;

    const cleanPath = stripMetadata ? _resolveFilepath(asset) : "";
    const cleanUrl = cleanPath ? buildCleanDownloadURL(cleanPath) : "";
    const url = _abs(cleanUrl || viewUrl);
    const mime = getDownloadMimeForFilename(filename);
    try {
        dt.setData("text/uri-list", url);
        dt.setData("DownloadURL", `${mime}:${filename}:${url}`);
        dt.effectAllowed = "copy";
    } catch (e) {
        console.debug?.(e);
    }
};

/**
 * Handle dragend: keep legacy cleanup behavior for internal-drop detection.
 * Normal drag-out never opens a metadata dialog. S+drag clean export is encoded
 * in the drag payload at dragstart, including batch ZIPs.
 *
 * @param {DragEvent} event
 * @param {object} asset - The dragged asset object
 * @param {HTMLElement} containerEl - The grid container
 * @param {HTMLElement} card - The dragged card element
 */
export const handleDragEnd = (event, { asset, containerEl, card }) => {
    if (!event || !asset) return;
    void containerEl;
    void card;
    try {
        // dropEffect "none" means the drop was cancelled (ESC or invalid target).
        // "copy"/"move"/"link" mean the drop was accepted somewhere.
        // We only care about drops accepted outside the browser window.
        const effect = event?.dataTransfer?.dropEffect;
        if (!effect || effect === "none") return;

        // If an internal drop handler fired (ComfyUI canvas), skip the popup.
        // The flag is set in onDrop (DragDrop.js) for internal drops.
        if (consumeInternalDropOccurred()) return;

        return;
    } catch (e) {
        console.debug?.(e);
    }
};
