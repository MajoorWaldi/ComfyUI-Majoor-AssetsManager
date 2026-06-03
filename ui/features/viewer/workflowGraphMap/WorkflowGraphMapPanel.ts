import { drawWorkflowMinimap } from "../../../components/sidebar/utils/minimap.js";
import { buildFloatingViewerMediaElement } from "../floatingViewerMedia.js";
import {
    findWorkflowNode,
    ensureWorkflowObjectInfo,
    getNodeDisplayName,
    getNodeParamEntries,
    getNodeType,
    getNodeTypeLabel,
    getNodeWidgetValueEntries,
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
    [key: string]: any;
    constructor({ large = false } = {}) {
        this._asset = null;
        this._workflow = null;
        this._selectedNodeId = "";
        this._renderInfo = null;
        this._resizeObserver = null;
        this._resizeObservedTarget = null;
        this._resizeObserverWindow = null;
        this._large = Boolean(large);
        this._view = { zoom: 1, centerX: null, centerY: null };
        this._drag = null;
        this._previewMedia = null;
        this._previewKey = "";
        this._subgraphDisplayMode = "expand";
        this._modeButtons = new Map();
        this._el = this._build();
    }

    get el() {
        return this._el;
    }

    setAsset(asset: any) {
        if (this._asset === asset) return;
        this._asset = asset || null;
        this._workflow = resolveAssetWorkflow(this._asset);
        this._selectedNodeId = "";
        this._view = { zoom: 1, centerX: null, centerY: null };
        this.refresh();
        ensureWorkflowObjectInfo(this._workflow).then(() => this.refresh()).catch(() => {});
    }

    refresh() {
        this._ensureResizeObserver();
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
        this._mapWrap = mapWrap;
        if (this._large) {
            this._canvas = document.createElement("canvas");
            this._canvas.className = "mjr-wgm-canvas";
            this._canvas.addEventListener?.("click", (event: any) => this._handleCanvasClick(event));
            this._canvas.addEventListener?.("wheel", (event: any) => this._handleWheel(event), {
                passive: false,
            });
            this._canvas.addEventListener?.("dblclick", (event: any) => this._handleCanvasDblClick(event));
            this._canvas.addEventListener?.("pointerdown", (event: any) => this._handlePointerDown(event));
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

        if (this._large) {
            this._toolbar = document.createElement("div");
            this._toolbar.className = "mjr-wgm-toolbar";
            this._toolbar.appendChild(this._makeModeButton("Expand subgraphs", "expand"));
            this._toolbar.appendChild(this._makeModeButton("Host nodes only", "host"));
            root.appendChild(this._toolbar);
            this._syncModeButtons();
        }

        this._details = document.createElement("div");
        this._details.className = "mjr-wgm-details";
        root.appendChild(this._details);

        this._ensureResizeObserver();
        return root;
    }

    _ensureResizeObserver() {
        const target = this._mapWrap;
        if (!target) return;
        const win = _getElementWindow(target);
        const ResizeObserverCtor = win?.ResizeObserver || globalThis.ResizeObserver;
        if (typeof ResizeObserverCtor !== "function") return;
        if (
            this._resizeObserver &&
            this._resizeObservedTarget === target &&
            this._resizeObserverWindow === win
        ) {
            return;
        }
        try {
            this._resizeObserver?.disconnect?.();
        } catch (e: any) {
            console.debug?.(e);
        }
        try {
            this._resizeObserver = new ResizeObserverCtor(() => this.refresh());
            this._resizeObserver.observe(target);
            this._resizeObservedTarget = target;
            this._resizeObserverWindow = win;
        } catch (e: any) {
            console.debug?.(e);
            this._resizeObserver = null;
            this._resizeObservedTarget = null;
            this._resizeObserverWindow = null;
        }
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
        const win = _getElementWindow(canvas);
        const dpr = Math.max(1, Math.min(2, Number(win?.devicePixelRatio) || 1));
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
            expandSubgraphs: this._subgraphDisplayMode !== "host",
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
        const includeSubgraphs = this._subgraphDisplayMode !== "host";
        const nodeCount = getWorkflowNodes(this._workflow, { includeSubgraphs }).length;
        if (!this._workflow) {
            this._status.textContent = this._large
                ? "No workflow graph in selected image"
                : "Selected asset - no workflow graph";
            _replaceChildren(this._details);
            return;
        }
        this._status.textContent = this._large
            ? this._selectedNodeId
                ? `${nodeCount} nodes (${this._subgraphDisplayMode}) - selected #${this._selectedNodeId}`
                : `${nodeCount} nodes (${this._subgraphDisplayMode}) - select a node`
            : `${nodeCount} nodes - graph opened in viewer`;

        const node = findWorkflowNode(this._workflow, this._selectedNodeId, { includeSubgraphs });
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

        const visual = this._buildNodeVisual(node);

        _replaceChildren(this._details, title, meta, visual, actions);
    }

    _makeModeButton(label: any, mode: "expand" | "host") {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "mjr-wgm-mode";
        button.textContent = String(label);
        button.addEventListener?.("click", () => this._setSubgraphDisplayMode(mode));
        this._modeButtons.set(mode, button);
        return button;
    }

    _setSubgraphDisplayMode(mode: "expand" | "host") {
        if (mode !== "expand" && mode !== "host") return;
        if (this._subgraphDisplayMode === mode) return;
        this._subgraphDisplayMode = mode;
        if (mode === "host" && String(this._selectedNodeId || "").includes("::")) {
            this._selectedNodeId = "";
        }
        this._syncModeButtons();
        this.refresh();
    }

    _syncModeButtons() {
        for (const [mode, button] of this._modeButtons.entries()) {
            button.classList?.toggle?.("is-active", mode === this._subgraphDisplayMode);
        }
    }

    _buildNodeVisual(node: any) {
        const card = document.createElement("section");
        card.className = "mjr-wgm-node-visual";
        card.classList.add(`is-${_getNodeVisualCategory(node)}`);

        const header = document.createElement("div");
        header.className = "mjr-wgm-node-visual-header";
        const nodeType = document.createElement("span");
        nodeType.className = "mjr-wgm-node-visual-type";
        nodeType.textContent = getNodeTypeLabel(node) || getNodeType(node) || "Node";
        const nodeId = document.createElement("span");
        nodeId.className = "mjr-wgm-node-visual-id";
        nodeId.textContent = `#${String(node?.id ?? this._selectedNodeId ?? "")}`;
        header.append(nodeType, nodeId);

        const portsWrap = document.createElement("div");
        portsWrap.className = "mjr-wgm-node-ports";
        const inputsCol = this._buildPortColumn("Inputs", node?.inputs, "in");
        const outputsCol = this._buildPortColumn("Outputs", node?.outputs, "out");
        portsWrap.append(inputsCol, outputsCol);

        const widgets = document.createElement("div");
        widgets.className = "mjr-wgm-node-widgets";
        const widgetsTitle = document.createElement("div");
        widgetsTitle.className = "mjr-wgm-node-widgets-title";
        widgetsTitle.textContent = "Widgets";
        widgets.appendChild(widgetsTitle);
        const widgetEntries = _normalizeWidgetEntries(node);
        if (!widgetEntries.length) {
            const empty = document.createElement("div");
            empty.className = "mjr-wgm-node-widget-empty";
            empty.textContent = "No widget values";
            widgets.appendChild(empty);
        } else {
            for (const entry of widgetEntries.slice(0, 12)) {
                const row = document.createElement("div");
                row.className = "mjr-wgm-node-widget";
                row.tabIndex = 0;
                row.role = "button";
                const widgetLabel = String(entry?.label || entry?.key || "value");
                row.title = `Copy ${widgetLabel}`;
                const key = document.createElement("span");
                key.className = "mjr-wgm-node-widget-key";
                key.textContent = widgetLabel;
                const value = document.createElement("span");
                value.className = "mjr-wgm-node-widget-value";
                const displayValue = _formatWidgetValue(entry?.value);
                value.textContent = displayValue;
                if (_isMultilineWidgetValue(entry?.value, displayValue)) {
                    row.classList.add("is-multiline");
                }
                if (_isExpandedTextWidgetLabel(widgetLabel)) {
                    row.classList.add("is-text-field");
                }
                row.append(key, value);
                row.addEventListener("click", () => this._copyParam(row, entry?.value));
                row.addEventListener("keydown", (event: any) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault?.();
                    this._copyParam(row, entry?.value);
                });
                widgets.appendChild(row);
            }
            if (widgetEntries.length > 12) {
                const more = document.createElement("div");
                more.className = "mjr-wgm-node-widget-more";
                more.textContent = `+${widgetEntries.length - 12} more values`;
                widgets.appendChild(more);
            }
        }

        card.append(header, portsWrap, widgets);
        return card;
    }

    _buildPortColumn(title: any, ports: any, direction: "in" | "out") {
        const col = document.createElement("div");
        col.className = "mjr-wgm-node-ports-col";
        const titleEl = document.createElement("div");
        titleEl.className = "mjr-wgm-node-ports-title";
        titleEl.textContent = String(title);
        col.appendChild(titleEl);

        const list = document.createElement("div");
        list.className = "mjr-wgm-node-ports-list";
        const items = _normalizePorts(ports).slice(0, 8);
        if (!items.length) {
            const empty = document.createElement("div");
            empty.className = "mjr-wgm-node-port-empty";
            empty.textContent = "-";
            list.appendChild(empty);
        } else {
            for (const item of items) {
                const row = document.createElement("div");
                row.className = "mjr-wgm-node-port";
                const dot = document.createElement("span");
                dot.className = `mjr-wgm-node-port-dot is-${direction}`;
                const name = document.createElement("span");
                name.className = "mjr-wgm-node-port-name";
                const info = _formatPortInfo(item);
                name.textContent = info.label;
                row.append(dot, name);
                if (info.type) {
                    const type = document.createElement("span");
                    type.className = "mjr-wgm-node-port-type";
                    type.textContent = info.type;
                    row.appendChild(type);
                }
                list.appendChild(row);
            }
        }
        col.appendChild(list);
        return col;
    }

    _makeAction(label: any, iconClass: any, action: any) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mjr-wgm-action";
        btn.title = label;
        btn.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i><span>${label}</span>`;
        btn.addEventListener("click", async () => {
            try {
                const ok = await action();
                btn.classList.toggle("is-ok", !!ok);
                _getElementWindow(btn).setTimeout(() => btn.classList.remove("is-ok"), 700);
            } catch (e: any) {
                console.debug?.("[MFV Graph Map] action failed", e);
            }
        });
        return btn;
    }

    async _copyParam(row: any, value: any) {
        try {
            const ok = await copyNodeParamValue(value);
            row.classList.toggle("is-ok", !!ok);
            row.classList.toggle("is-error", !ok);
            _getElementWindow(row).setTimeout(() => {
                row.classList.remove("is-ok");
                row.classList.remove("is-error");
            }, 750);
        } catch (e: any) {
            row.classList.add("is-error");
            _getElementWindow(row).setTimeout(() => row.classList.remove("is-error"), 750);
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
        } catch (e: any) {
            console.debug?.("[MFV Graph Map] preview cleanup failed", e);
        }
        try {
            const playable = media.querySelectorAll?.("video, audio") || [];
            for (const el of playable) el.pause?.();
        } catch (e: any) {
            console.debug?.("[MFV Graph Map] preview pause failed", e);
        }
        media.remove?.();
    }

    _handleCanvasClick(event: any) {
        if (this._drag?.moved) return;
        const rect = this._canvas.getBoundingClientRect();
        const hit = this._renderInfo?.hitTestNode?.(event.clientX - rect.left, event.clientY - rect.top);
        if (!hit?.id) return;
        this._selectedNodeId = String(hit.id);
        this.refresh();
    }

    _handleWheel(event: any) {
        if (!this._workflow) return;
        event.preventDefault?.();
        const direction = Number(event.deltaY) > 0 ? -1 : 1;
        const factor = direction > 0 ? 1.18 : 1 / 1.18;
        const oldZoom = Number(this._view.zoom || 1);
        const newZoom = Math.max(1, Math.min(8, oldZoom * factor));
        if (newZoom === oldZoom) return;
        const view = this._renderInfo?.resolvedView;
        if (view?.renderScale && view?.viewMinX != null && view?.viewMinY != null) {
            const rect = this._canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const { renderScale, viewMinX, viewMinY, visibleW, visibleH, pad } = view;
            // World point under cursor before zoom change
            const worldX = viewMinX + (mouseX - pad) / renderScale;
            const worldY = viewMinY + (mouseY - pad) / renderScale;
            // renderScale scales linearly with zoom; adjust center to keep world point under cursor
            const newRenderScale = renderScale * (newZoom / oldZoom);
            const newVisibleW = visibleW * (oldZoom / newZoom);
            const newVisibleH = visibleH * (oldZoom / newZoom);
            const newViewMinX = worldX - (mouseX - pad) / newRenderScale;
            const newViewMinY = worldY - (mouseY - pad) / newRenderScale;
            this._view.zoom = newZoom;
            this._view.centerX = newViewMinX + newVisibleW / 2;
            this._view.centerY = newViewMinY + newVisibleH / 2;
        } else {
            this._view.zoom = newZoom;
        }
        this.refresh();
    }

    _handleCanvasDblClick(event: any) {
        if (!this._workflow) return;
        const rect = this._canvas.getBoundingClientRect();
        const hit = this._renderInfo?.hitTestNode?.(event.clientX - rect.left, event.clientY - rect.top);
        if (hit?.x != null && hit?.w != null) {
            // Zoom to fit the clicked node (or subgraph container) with context margin
            this._zoomToWorldRect(hit.x, hit.y, hit.w, hit.h);
        } else {
            // Double-click on background: reset to fit-all
            this._view = { zoom: 1, centerX: null, centerY: null };
            this.refresh();
        }
    }

    _zoomToWorldRect(x: any, y: any, w: any, h: any) {
        const info = this._renderInfo;
        if (!info?.bounds) return;
        const { bounds } = info;
        const boundsW = Math.max(1, bounds.maxX - bounds.minX);
        const boundsH = Math.max(1, bounds.maxY - bounds.minY);
        // Show the target rect at ~half the canvas (margin 2.0 = target fills 50%)
        const margin = 2.0;
        const zoomW = boundsW / Math.max(1, w * margin);
        const zoomH = boundsH / Math.max(1, h * margin);
        this._view.zoom = Math.max(1, Math.min(8, Math.min(zoomW, zoomH)));
        this._view.centerX = x + w / 2;
        this._view.centerY = y + h / 2;
        this.refresh();
    }

    _handlePointerDown(event: any) {
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
        const onMove = (moveEvent: any) => {
            if (!this._drag || moveEvent.pointerId !== this._drag.pointerId) return;
            const dx = moveEvent.clientX - this._drag.startX;
            const dy = moveEvent.clientY - this._drag.startY;
            if (Math.abs(dx) + Math.abs(dy) > 3) this._drag.moved = true;
            this._view.centerX = this._drag.centerX - dx / this._drag.scale;
            this._view.centerY = this._drag.centerY - dy / this._drag.scale;
            this._renderCanvas();
            this._renderDetails();
        };
        const onUp = (upEvent: any) => {
            if (!this._drag || upEvent.pointerId !== this._drag.pointerId) return;
            this._canvas.releasePointerCapture?.(upEvent.pointerId);
            const win = _getElementWindow(this._canvas);
            win.removeEventListener("pointermove", onMove);
            win.removeEventListener("pointerup", onUp);
            win.removeEventListener("pointercancel", onUp);
            win.setTimeout(() => {
                this._drag = null;
            }, 0);
        };
        const win = _getElementWindow(this._canvas);
        win.addEventListener("pointermove", onMove);
        win.addEventListener("pointerup", onUp);
        win.addEventListener("pointercancel", onUp);
    }
}

function _getElementWindow(el: any) {
    return el?.ownerDocument?.defaultView || window;
}

function _replaceChildren(parent: any, ...children: any[]) {
    if (!parent) return;
    while (parent.firstChild) parent.removeChild(parent.firstChild);
    for (const child of children) parent.appendChild(child);
}

function _formatValue(value: any) {
    if (value == null) return "";
    if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

function _formatWidgetValue(value: any) {
    if (value == null) return "";
    if (typeof value === "string") return value.replace(/\r\n?/g, "\n").trim();
    return _formatValue(value);
}

function _isMultilineWidgetValue(rawValue: any, displayValue: any) {
    if (typeof rawValue !== "string") return false;
    const text = String(displayValue || "");
    return text.includes("\n") || text.length > 120;
}

function _isExpandedTextWidgetLabel(label: any) {
    const normalized = String(label || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    if (!normalized) return false;
    return (
        normalized === "text" ||
        normalized === "prompt" ||
        normalized === "positive" ||
        normalized === "negative" ||
        normalized === "string" ||
        normalized === "caption"
    );
}

function _normalizePorts(ports: any) {
    if (!Array.isArray(ports)) return [];
    return ports.filter(Boolean).map((port: any) => ({
        name: String(port?.name || port?.label || "").trim(),
        type: String(port?.type || port?.slot_type || port?.data_type || "").trim(),
    }));
}

function _formatPortInfo(item: any) {
    const label = String(item?.name || item?.label || item?.type || "port").trim() || "port";
    const type = String(item?.type || "").trim();
    const normalizedLabel = _normalizePortToken(label);
    const normalizedType = _normalizePortToken(type);
    const hasDistinctType = Boolean(normalizedType) && normalizedType !== normalizedLabel;
    return {
        label,
        type: hasDistinctType ? type : "",
    };
}

function _normalizePortToken(value: any) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function _normalizeWidgetEntries(node: any): Array<{ label: any; key?: any; value: any }> {
    const fromWidgets = getNodeWidgetValueEntries(node);
    if (Array.isArray(fromWidgets) && fromWidgets.length) {
        return fromWidgets.map((entry: any) => ({
            label: entry?.label,
            key: entry?.key,
            value: entry?.value,
        }));
    }
    const fromParams = getNodeParamEntries(node);
    const entries = Array.isArray(fromParams)
        ? fromParams.map(([label, value]: any) => ({ label, value }))
        : [];
    return entries.slice(0, 160);
}

function _getNodeVisualCategory(node: any) {
    const type = String(getNodeType(node) || "").toLowerCase();
    const label = String(getNodeTypeLabel(node) || "").toLowerCase();
    const text = `${type} ${label}`;
    if (!text.trim()) return "generic";
    if (/ksampler|sampler|scheduler|cfg|steps|noise|seed/.test(text)) return "sampler";
    if (/checkpoint|clip|vae|unet|lora|model|loader/.test(text)) return "model";
    if (/text|prompt|token|encode|decoder|caption|florence/.test(text)) return "text";
    if (/latent|image|mask|video|audio|preview|save|load|upscale/.test(text)) return "media";
    if (/controlnet|conditioning|guidance|adapter|ipadapter/.test(text)) return "control";
    if (/math|logic|switch|merge|concat|combine|route|branch|reroute/.test(text)) return "logic";
    return "generic";
}

function _normalizePreviewAsset(asset: any) {
    if (!asset || typeof asset !== "object") return asset;
    const candidates = Array.isArray(asset.previewCandidates) ? asset.previewCandidates : [];
    const url = candidates.find((value: any) => String(value || "").trim()) || asset.url || "";
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

function _getPreviewKey(asset: any) {
    if (!asset || typeof asset !== "object") return "";
    return JSON.stringify({
        url: String(asset.url || ""),
        filename: String(asset.filename || asset.name || ""),
        kind: String(asset.kind || asset.asset_type || asset.type || ""),
        subfolder: String(asset.subfolder || ""),
        id: asset.id ?? "",
    });
}
