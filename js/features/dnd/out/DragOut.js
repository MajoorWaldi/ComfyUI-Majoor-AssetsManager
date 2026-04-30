/**
 * Drag-out support (AssetsManager -> OS / Explorer).
 *
 * Implements "DownloadURL" + "text/uri-list" so users can drop an asset
 * outside ComfyUI (desktop, Explorer, other apps).
 *
 * Also supports multi-selection: creates a temporary ZIP on the backend and
 * drags that ZIP URL instead of individual files.
 */

import { post } from "../../../api/client.js";
import {
    ENDPOINTS,
    buildBatchZipDownloadURL,
    buildCleanDownloadURL,
} from "../../../api/endpoints.js";
import { getDownloadMimeForFilename } from "../utils/video.js";
import { createSecureToken, pickRootId } from "../../../utils/ids.js";
import { comfyConfirm } from "../../../app/dialogs.js";
import { t } from "../../../app/i18n.js";
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
            const draggedId = draggedCard?.dataset?.mjrAssetId
                ? String(draggedCard.dataset.mjrAssetId)
                : "";
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

/** Extensions that can contain ComfyUI workflow/prompt metadata. */
const _STRIPPABLE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".mp4", ".mov"]);

/** Check if an asset likely has embedded ComfyUI metadata worth stripping. */
const _hasComfyMetadata = (asset) => {
    if (!asset || typeof asset !== "object") return false;
    if (asset.has_workflow || asset.has_generation_data) return true;
    const ext = String(asset.ext || asset.filename || "").toLowerCase();
    const dotExt = ext.includes(".") ? ext.slice(ext.lastIndexOf(".")) : `.${ext}`;
    return _STRIPPABLE_EXTS.has(dotExt);
};

/**
 * Trigger a clean (metadata-stripped) download for one or more assets.
 * Uses a hidden <a> click to start the browser download.
 */
const _resolveFilepath = (asset) => {
    if (!asset || typeof asset !== "object") return "";
    // Direct filepath from backend.
    const fp = asset.filepath || asset.path || asset?.file_info?.filepath || "";
    if (fp) return String(fp);
    return "";
};

const _downloadClean = (assets) => {
    for (const asset of assets) {
        const filepath = _resolveFilepath(asset);
        if (!filepath) {
            console.debug?.("[DragOut] No filepath for asset:", asset?.filename);
            continue;
        }
        const url = buildCleanDownloadURL(filepath);
        if (!url) continue;
        const a = document.createElement("a");
        try {
            a.href = _abs(url);
            a.download = asset.filename || asset.name || "download";
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                try {
                    a.remove();
                } catch {}
            }, 1000);
        } catch (e) {
            try {
                a.remove();
            } catch {}
            console.debug?.(e);
        }
    }
};

export const applyDragOutToOS = ({ dt, asset, containerEl, card, viewUrl }) => {
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
                    post(ENDPOINTS.BATCH_ZIP_CREATE, { token, items }).catch(() => {});
                } catch (e) {
                    console.debug?.(e);
                }

                const url = _abs(buildBatchZipDownloadURL(token));
                const zipName = `Majoor_Batch_${items.length}.zip`;
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

    const url = _abs(viewUrl);
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
 * Handle dragend: if the drop happened outside the browser (OS/Explorer),
 * offer to re-download with ComfyUI metadata stripped.
 *
 * @param {DragEvent} event
 * @param {object} asset - The dragged asset object
 * @param {HTMLElement} containerEl - The grid container
 * @param {HTMLElement} card - The dragged card element
 */
export const handleDragEnd = (event, { asset, containerEl, card }) => {
    if (!event || !asset) return;
    try {
        // dropEffect "none" means the drop was cancelled (ESC or invalid target).
        // "copy"/"move"/"link" mean the drop was accepted somewhere.
        // We only care about drops accepted outside the browser window.
        const effect = event?.dataTransfer?.dropEffect;
        if (!effect || effect === "none") return;

        // If an internal drop handler fired (ComfyUI canvas), skip the popup.
        // The flag is set in onDrop (DragDrop.js) for internal drops.
        if (consumeInternalDropOccurred()) return;

        // Determine assets involved (single or multi-selection).
        const selected = _getSelectedAssets(containerEl, card);
        const assets = selected.length > 1 ? selected : [asset];

        // Only prompt if at least one asset has ComfyUI metadata.
        const hasMetadata = assets.some(_hasComfyMetadata);
        if (!hasMetadata) return;

        // Async popup — don't block dragend.
        const count = assets.length;
        const name = asset.filename || asset.name || "file";
        const body = t(
            "dialog.stripMetadataBody",
            "Would you like to download a clean copy with ComfyUI workflow and generation metadata removed?",
        );
        const msg =
            count > 1
                ? `${t("dialog.stripMetadataBatchHeader", `You dragged ${count} files outside ComfyUI.`)}\n\n${body}`
                : `${t("dialog.stripMetadataHeader", `You dragged "${name}" outside ComfyUI.`)}\n\n${body}`;

        comfyConfirm(msg, t("dialog.stripMetadataTitle", "Strip ComfyUI Metadata?"))
            .then((confirmed) => {
                if (!confirmed) return;
                _downloadClean(assets);
            })
            .catch(() => {});
    } catch (e) {
        console.debug?.(e);
    }
};
