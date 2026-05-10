import { drawWorkflowMinimap } from "../../../components/sidebar/utils/minimap.js";
import { buildFloatingViewerMediaElement } from "../floatingViewerMedia.js";
import {
    findWorkflowNode,
    ensureWorkflowObjectInfo,
    getNodeDisplayName,
    getNodeParamEntries,
    getNodeType,
    getNodeTypeLabel,
    getWorkflowNodes,
    resolveAssetWorkflow,
} from "./workflowGraphMapData.js";
import {
    copyNodeParamValue,
    copyNodeJson,
    importNodeToCurrentGraph,
    importWorkflowToCanvas,
    transferNodeParamsToSelectedCanvasNode,
} from "./workflowGraphMapActions.js";

export class WorkflowGraphMapPanel {
    constructor({ large = false } = {}) {
        this._asset = null;
        this._workflow = null;
        this._selectedNodeId = "";
        this._renderInfo = null;
        this._resizeObserver = null;
        this._large = Boolean(large);
        this._view = { zoom: 1, centerX: null, centerY: null };
        this._drag = null;
        this._previewMedia = null;
        this._previewKey = "";
        this._el = this._build();
    }

    get el() {
        return this._el;
    }

    setAsset(asset) {
        if (this._asset === asset) return;
        this._asset = asset || null;
        this._workflow = resolveAssetWorkflow(this._asset);
        this._selectedNodeId = "";
        this._view = { zoom: 1, centerX: null, centerY: null };
        this.refresh();
        ensureWorkflowObjectInfo(this._workflow).then(() => this.refresh()).catch(() => {});
    }

    refresh() {
        if (!this._el?.isConnected) return;
        this._renderCanvas();
        this._renderDetails();
    }

    dispose() {
        this._disposePreviewMedia();
        this._resizeObserver?.disconnect?.();
        this._resizeObserver = null;
        this._el?.remove?.();
    }

    _build() {
        const root = document.createElement("div");
        root.className = "mjr-wgm";
        if (this._large) root.className += " mjr-wgm--large";

        const mapWrap = document.createElement("div");
        mapWrap.className = "mjr-wgm-map-wrap";
        if (this._large) {
            this._canvas = document.createElement("canvas");
            this._canvas.className = "mjr-wgm-canvas";
            this._canvas.addEventListener?.("click", (event) => this._handleCanvasClick(event));
            this._canvas.addEventListener?.("wheel", (event) => this._handleWheel(event), {
                passive: false,
            });
            this._canvas.addEventListener?.("pointerdown", (event) => this._handlePointerDown(event));
            mapWrap.appendChild(this._canvas);
        } else {
            this._preview = document.createElement("div");
            this._preview.className = "mjr-wgm-preview";
            mapWrap.appendChild(this._preview);
        }
        root.appendChild(mapWrap);

        this._status = document.createElement("div");
        this._status.className = "mjr-wgm-status";
        root.appendChild(this._status);

        this._details = document.createElement("div");
        this._details.className = "mjr-wgm-details";
        root.appendChild(this._details);

        if (typeof ResizeObserver === "function") {
            this._resizeObserver = new ResizeObserver(() => this.refresh());
            this._resizeObserver.observe(mapWrap);
        }
        return root;
    }

    _renderCanvas() {
        if (!this._large) {
            this._renderPreview();
            return;
        }
        const canvas = this._canvas;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width || canvas.clientWidth || 1));
        const height = Math.max(1, Math.floor(rect.height || canvas.clientHeight || 1));
        const dpr = Math.max(1, Math.min(2, Number(window.devicePixelRatio) || 1));
        const nextW = Math.floor(width * dpr);
        const nextH = Math.floor(height * dpr);
        if (canvas.width !== nextW || canvas.height !== nextH) {
            canvas.width = nextW;
            canvas.height = nextH;
        }
        const ctx = canvas.getContext?.("2d");
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (!this._workflow) {
            ctx?.clearRect?.(0, 0, width, height);
            this._renderInfo = null;
            return;
        }

        this._renderInfo = drawWorkflowMinimap(canvas, this._workflow, {
            showNodeLabels: true,
            showViewport: false,
            view: {
                hoveredNodeId: this._selectedNodeId || null,
                zoom: this._view.zoom,
                centerX: this._view.centerX,
                centerY: this._view.centerY,
            },
        });
        if (this._renderInfo?.resolvedView) {
            this._view.centerX = this._renderInfo.resolvedView.centerX;
            this._view.centerY = this._renderInfo.resolvedView.centerY;
            this._view.zoom = this._renderInfo.resolvedView.zoom;
        }
    }

    _renderDetails() {
        const nodeCount = getWorkflowNodes(this._workflow).length;
        if (!this._workflow) {
            this._status.textContent = this._large
                ? "No workflow graph in selected image"
                : "Selected asset - no workflow graph";
            _replaceChildren(this._details);
            return;
        }
        this._status.textContent = this._large
            ? this._selectedNodeId
                ? `${nodeCount} nodes - selected #${this._selectedNodeId}`
                : `${nodeCount} nodes - select a node`
            : `${nodeCount} nodes - graph opened in viewer`;

        const node = findWorkflowNode(this._workflow, this._selectedNodeId);
        if (!node) {
            const empty = document.createElement("div");
            empty.className = "mjr-ws-sidebar-empty";
            empty.textContent = this._large
                ? "Click a node in the graph map"
                : "Use the large Graph Map in the viewer to select nodes";
            _replaceChildren(this._details, empty);
            return;
        }

        const title = document.createElement("div");
        title.className = "mjr-wgm-node-title";
        title.textContent = getNodeDisplayName(node);

        const meta = document.createElement("div");
        meta.className = "mjr-wgm-node-meta";
        meta.textContent = `#${this._selectedNodeId} ${getNodeTypeLabel(node) || getNodeType(node) || "Node"}`;

        const actions = document.createElement("div");
        actions.className = "mjr-wgm-actions";
        actions.appendChild(this._makeAction("Copy node", "pi pi-copy", () => copyNodeJson(node)));
        actions.appendChild(
            this._makeAction("Import node", "pi pi-plus-circle", () => importNodeToCurrentGraph(node)),
        );
        actions.appendChild(
            this._makeAction("Import workflow", "pi pi-download", () =>
                importWorkflowToCanvas(this._workflow),
            ),
        );
        actions.appendChild(
            this._makeAction("Transfer params to selected canvas node", "pi pi-arrow-right-arrow-left", () => {
                const result = transferNodeParamsToSelectedCanvasNode(node);
                return result?.ok;
            }),
        );

        const params = document.createElement("div");
        params.className = "mjr-wgm-params";
        for (const [key, value] of getNodeParamEntries(node)) {
            const row = document.createElement("div");
            row.className = "mjr-wgm-param";
            row.tabIndex = 0;
            row.role = "button";
            row.title = `Copy ${String(key)}`;
            const k = document.createElement("span");
            k.className = "mjr-wgm-param-key";
            k.textContent = String(key);
            const v = document.createElement("span");
            v.className = "mjr-wgm-param-value";
            v.textContent = _formatValue(value);
            row.appendChild(k);
            row.appendChild(v);
            row.addEventListener("click", () => this._copyParam(row, value));
            row.addEventListener("keydown", (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault?.();
                this._copyParam(row, value);
            });
            params.appendChild(row);
        }

        if (!params.childElementCount) {
            const empty = document.createElement("div");
            empty.className = "mjr-ws-node-empty";
            empty.textContent = "No simple parameters found";
            params.appendChild(empty);
        }

        _replaceChildren(this._details, title, meta, actions, params);
    }

    _makeAction(label, iconClass, action) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mjr-wgm-action";
        btn.title = label;
        btn.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i><span>${label}</span>`;
        btn.addEventListener("click", async () => {
            try {
                const ok = await action();
                btn.classList.toggle("is-ok", !!ok);
                window.setTimeout(() => btn.classList.remove("is-ok"), 700);
            } catch (e) {
                console.debug?.("[MFV Graph Map] action failed", e);
            }
        });
        return btn;
    }

    async _copyParam(row, value) {
        try {
            const ok = await copyNodeParamValue(value);
            row.classList.toggle("is-ok", !!ok);
            row.classList.toggle("is-error", !ok);
            window.setTimeout(() => {
                row.classList.remove("is-ok");
                row.classList.remove("is-error");
            }, 750);
        } catch (e) {
            row.classList.add("is-error");
            window.setTimeout(() => row.classList.remove("is-error"), 750);
            console.debug?.("[MFV Graph Map] param copy failed", e);
        }
    }

    _renderPreview() {
        if (!this._preview) return;
        const asset = _normalizePreviewAsset(this._asset);
        const previewKey = _getPreviewKey(asset);
        if (this._previewMedia && previewKey && previewKey === this._previewKey) {
            if (this._preview.firstChild !== this._previewMedia || this._preview.childNodes.length !== 1) {
                _replaceChildren(this._preview, this._previewMedia);
            }
            return;
        }

        this._disposePreviewMedia();

        const media = buildFloatingViewerMediaElement(asset, { fill: true });
        if (media) {
            media.classList?.add?.("mjr-wgm-preview-media");
            this._previewMedia = media;
            this._previewKey = previewKey;
            this._preview.appendChild(media);
            return;
        }
        const empty = document.createElement("div");
        empty.className = "mjr-wgm-preview-empty";
        empty.textContent = "No preview";
        _replaceChildren(this._preview, empty);
    }

    _disposePreviewMedia() {
        const media = this._previewMedia;
        this._previewMedia = null;
        this._previewKey = "";
        if (!media) return;
        try {
            media._mjrMediaControlsHandle?.destroy?.();
        } catch (e) {
            console.debug?.("[MFV Graph Map] preview cleanup failed", e);
        }
        try {
            const playable = media.querySelectorAll?.("video, audio") || [];
            for (const el of playable) el.pause?.();
        } catch (e) {
            console.debug?.("[MFV Graph Map] preview pause failed", e);
        }
        media.remove?.();
    }

    _handleCanvasClick(event) {
        if (this._drag?.moved) return;
        const rect = this._canvas.getBoundingClientRect();
        const hit = this._renderInfo?.hitTestNode?.(event.clientX - rect.left, event.clientY - rect.top);
        if (!hit?.id) return;
        this._selectedNodeId = String(hit.id);
        this.refresh();
    }

    _handleWheel(event) {
        if (!this._workflow) return;
        event.preventDefault?.();
        const direction = Number(event.deltaY) > 0 ? -1 : 1;
        const factor = direction > 0 ? 1.18 : 1 / 1.18;
        this._view.zoom = Math.max(1, Math.min(8, Number(this._view.zoom || 1) * factor));
        this.refresh();
    }

    _handlePointerDown(event) {
        if (!this._workflow || event.button !== 0) return;
        const view = this._renderInfo?.resolvedView;
        if (!view?.renderScale) return;
        event.preventDefault?.();
        this._canvas.setPointerCapture?.(event.pointerId);
        this._drag = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            centerX: Number(this._view.centerX ?? view.centerX),
            centerY: Number(this._view.centerY ?? view.centerY),
            scale: Number(view.renderScale) || 1,
            moved: false,
        };
        const onMove = (moveEvent) => {
            if (!this._drag || moveEvent.pointerId !== this._drag.pointerId) return;
            const dx = moveEvent.clientX - this._drag.startX;
            const dy = moveEvent.clientY - this._drag.startY;
            if (Math.abs(dx) + Math.abs(dy) > 3) this._drag.moved = true;
            this._view.centerX = this._drag.centerX - dx / this._drag.scale;
            this._view.centerY = this._drag.centerY - dy / this._drag.scale;
            this._renderCanvas();
            this._renderDetails();
        };
        const onUp = (upEvent) => {
            if (!this._drag || upEvent.pointerId !== this._drag.pointerId) return;
            this._canvas.releasePointerCapture?.(upEvent.pointerId);
            this._canvas.removeEventListener("pointermove", onMove);
            this._canvas.removeEventListener("pointerup", onUp);
            this._canvas.removeEventListener("pointercancel", onUp);
            window.setTimeout(() => {
                this._drag = null;
            }, 0);
        };
        this._canvas.addEventListener("pointermove", onMove);
        this._canvas.addEventListener("pointerup", onUp);
        this._canvas.addEventListener("pointercancel", onUp);
    }
}

function _replaceChildren(parent, ...children) {
    if (!parent) return;
    while (parent.firstChild) parent.removeChild(parent.firstChild);
    for (const child of children) parent.appendChild(child);
}

function _formatValue(value) {
    if (value == null) return "";
    if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

function _normalizePreviewAsset(asset) {
    if (!asset || typeof asset !== "object") return asset;
    const candidates = Array.isArray(asset.previewCandidates) ? asset.previewCandidates : [];
    const url = candidates.find((value) => String(value || "").trim()) || asset.url || "";
    const type = String(asset.type || "").toLowerCase();
    const kind = String(asset.kind || "").toLowerCase();
    const filename = String(asset.filename || asset.name || "");
    const inferredKind =
        kind ||
        (asset.isVideo || type === "video" || /\.(mp4|mov|webm|mkv|avi)$/i.test(filename)
            ? "video"
            : asset.isAudio || type === "audio" || /\.(mp3|wav|flac|ogg|m4a|aac|opus|wma)$/i.test(filename)
              ? "audio"
              : asset.isModel3d || type === "model3d"
                ? "model3d"
                : "");
    return {
        ...asset,
        ...(url ? { url } : null),
        ...(inferredKind ? { kind: inferredKind, asset_type: inferredKind } : null),
    };
}

function _getPreviewKey(asset) {
    if (!asset || typeof asset !== "object") return "";
    return JSON.stringify({
        url: String(asset.url || ""),
        filename: String(asset.filename || asset.name || ""),
        kind: String(asset.kind || asset.asset_type || asset.type || ""),
        subfolder: String(asset.subfolder || ""),
        id: asset.id ?? "",
    });
}
