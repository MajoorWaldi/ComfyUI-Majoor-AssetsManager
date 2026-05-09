/**
 * WorkflowSidebar is the slide-in panel for the Floating Viewer.
 *
 * It now exposes a single unified "Nodes" view: each workflow node can be
 * expanded inline to reveal editable parameters.
 */

import { WorkflowNodesTab } from "./WorkflowNodesTab.js";
import { WorkflowGraphMapPanel } from "../workflowGraphMap/WorkflowGraphMapPanel.js";

const LIVE_SYNC_FALLBACK_MS = 16;
const LIVE_SYNC_INTERVAL_MS = 250;

export class WorkflowSidebar {
    constructor({ hostEl, onClose, onOpenGraphMap, onCloseGraphMap } = {}) {
        this._hostEl = hostEl;
        this._onClose = onClose ?? null;
        this._onOpenGraphMap = onOpenGraphMap ?? null;
        this._onCloseGraphMap = onCloseGraphMap ?? null;
        this._visible = false;
        this._liveSyncHandle = null;
        this._liveSyncMode = "";
        this._lastLiveSyncAt = 0;
        this._resizeCleanup = null;
        this._nodesTab = new WorkflowNodesTab();
        this._graphMapPanel = new WorkflowGraphMapPanel();
        this._activeMode = "nodes";
        this._asset = null;
        this._el = this._build();
    }

    get el() {
        return this._el;
    }
    get isVisible() {
        return this._visible;
    }

    show() {
        this._visible = true;
        this._el.classList.add("open");
        this.refresh();
        this._lastLiveSyncAt = _getFrameTimestamp(this._el);
        this._startLiveSync();
    }

    hide() {
        this._visible = false;
        this._el.classList.remove("open");
        this._stopLiveSync();
    }

    toggle() {
        if (this._visible) {
            const wasGraph = this._activeMode === "graph";
            this.hide();
            if (wasGraph) this._onCloseGraphMap?.();
            this._onClose?.();
        } else {
            this.show();
        }
    }

    refresh() {
        if (!this._visible) return;
        if (this._activeMode === "graph") this._graphMapPanel.refresh();
        else this._nodesTab.refresh();
    }

    syncFromGraph() {
        if (!this._visible) return;
        if (this._activeMode === "graph") this._graphMapPanel.refresh();
        else this._nodesTab.refresh();
    }

    setAsset(asset) {
        this._asset = asset || null;
        this._graphMapPanel?.setAsset?.(this._asset);
    }

    dispose() {
        this._stopLiveSync();
        this._disposeResize();
        this._nodesTab?.dispose?.();
        this._graphMapPanel?.dispose?.();
        this._nodesTab = null;
        this._graphMapPanel = null;
        this._el?.remove();
    }

    _build() {
        const panel = document.createElement("div");
        panel.className = "mjr-ws-sidebar";

        const header = document.createElement("div");
        header.className = "mjr-ws-sidebar-header";

        const title = document.createElement("span");
        title.className = "mjr-ws-sidebar-title";
        title.textContent = "Nodes";
        header.appendChild(title);

        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "mjr-icon-btn";
        closeBtn.title = "Close sidebar";
        closeBtn.innerHTML = '<i class="pi pi-times" aria-hidden="true"></i>';
        closeBtn.addEventListener("click", () => {
            const wasGraph = this._activeMode === "graph";
            this.hide();
            if (wasGraph) this._onCloseGraphMap?.();
            this._onClose?.();
        });
        header.appendChild(closeBtn);
        panel.appendChild(header);

        const tabBar = document.createElement("div");
        tabBar.className = "mjr-ws-tab-bar";
        this._nodesModeBtn = this._makeModeButton("Nodes", "pi pi-sliders-h", "nodes");
        this._graphModeBtn = this._makeModeButton("Graph Map", "pi pi-sitemap", "graph");
        tabBar.appendChild(this._nodesModeBtn);
        tabBar.appendChild(this._graphModeBtn);
        panel.appendChild(tabBar);

        const resizer = document.createElement("div");
        resizer.className = "mjr-ws-sidebar-resizer";
        resizer.setAttribute("role", "separator");
        resizer.setAttribute("aria-orientation", "vertical");
        resizer.setAttribute("aria-hidden", "true");
        panel.appendChild(resizer);
        this._bindResize(resizer);

        this._body = document.createElement("div");
        this._body.className = "mjr-ws-sidebar-body";
        panel.appendChild(this._body);
        this._renderActiveMode();

        return panel;
    }

    _makeModeButton(label, iconClass, mode) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mjr-ws-tab";
        btn.dataset.mode = mode;
        btn.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i><span>${label}</span>`;
        btn.addEventListener("click", () => this._setMode(mode));
        return btn;
    }

    _setMode(mode) {
        const next = mode === "graph" ? "graph" : "nodes";
        if (this._activeMode === next && this._body?.firstElementChild) return;
        this._activeMode = next;
        this._renderActiveMode();
        if (next === "graph") this._onOpenGraphMap?.();
        else this._onCloseGraphMap?.();
        this.refresh();
    }

    _renderActiveMode() {
        if (!this._body) return;
        this._nodesModeBtn?.classList?.toggle("is-active", this._activeMode === "nodes");
        this._graphModeBtn?.classList?.toggle("is-active", this._activeMode === "graph");
        this._nodesModeBtn?.setAttribute("aria-pressed", String(this._activeMode === "nodes"));
        this._graphModeBtn?.setAttribute("aria-pressed", String(this._activeMode === "graph"));
        const child = this._activeMode === "graph" ? this._graphMapPanel?.el : this._nodesTab?.el;
        if (child && this._body.firstElementChild !== child) {
            while (this._body.firstChild) this._body.removeChild(this._body.firstChild);
            this._body.appendChild(child);
        }
    }

    _startLiveSync() {
        if (this._liveSyncHandle != null) return;
        const frameHost = _getFrameHost(this._el);
        const tick = (timestamp) => {
            this._liveSyncHandle = null;
            this._liveSyncMode = "";
            if (!this._visible) return;

            const now = Number.isFinite(Number(timestamp))
                ? Number(timestamp)
                : _getFrameTimestamp(this._el);
            if (now - this._lastLiveSyncAt >= LIVE_SYNC_INTERVAL_MS) {
                this._lastLiveSyncAt = now;
                this.syncFromGraph();
            }
            this._startLiveSync();
        };

        if (typeof frameHost.requestAnimationFrame === "function") {
            this._liveSyncMode = "raf";
            this._liveSyncHandle = frameHost.requestAnimationFrame(tick);
            return;
        }

        this._liveSyncMode = "timeout";
        this._liveSyncHandle = frameHost.setTimeout(tick, LIVE_SYNC_FALLBACK_MS);
    }

    _stopLiveSync() {
        if (this._liveSyncHandle == null) return;
        const frameHost = _getFrameHost(this._el);
        try {
            if (
                this._liveSyncMode === "raf" &&
                typeof frameHost.cancelAnimationFrame === "function"
            ) {
                frameHost.cancelAnimationFrame(this._liveSyncHandle);
            } else if (typeof frameHost.clearTimeout === "function") {
                frameHost.clearTimeout(this._liveSyncHandle);
            }
        } catch (e) {
            console.debug?.(e);
        }
        this._liveSyncHandle = null;
        this._liveSyncMode = "";
    }

    _bindResize(handle) {
        if (!handle) return;
        const doc = handle.ownerDocument || document;
        const win = doc.defaultView || window;
        const MIN_WIDTH = 180;

        const onPointerDown = (event) => {
            if (event.button !== 0 || !this._el?.classList.contains("open")) return;
            const wrapper = this._el.parentElement;
            if (!wrapper) return;
            const sidebarRect = this._el.getBoundingClientRect();
            const wrapperRect = wrapper.getBoundingClientRect();
            const sidebarPos = wrapper.getAttribute("data-sidebar-pos") || "right";
            const maxWidth = Math.max(
                MIN_WIDTH,
                Math.floor(wrapperRect.width * (sidebarPos === "bottom" ? 1 : 0.65)),
            );
            if (sidebarPos === "bottom") return;

            event.preventDefault();
            event.stopPropagation();
            handle.classList.add("is-dragging");
            this._el.classList.add("is-resizing");

            const startX = event.clientX;
            const startWidth = sidebarRect.width;

            const onPointerMove = (moveEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const nextWidth = sidebarPos === "left" ? startWidth - deltaX : startWidth + deltaX;
                const clampedWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, nextWidth));
                this._el.style.width = `${Math.round(clampedWidth)}px`;
            };

            const stopResize = () => {
                handle.classList.remove("is-dragging");
                this._el.classList.remove("is-resizing");
                win.removeEventListener("pointermove", onPointerMove);
                win.removeEventListener("pointerup", stopResize);
                win.removeEventListener("pointercancel", stopResize);
            };

            win.addEventListener("pointermove", onPointerMove);
            win.addEventListener("pointerup", stopResize);
            win.addEventListener("pointercancel", stopResize);
        };

        handle.addEventListener("pointerdown", onPointerDown);
        this._resizeCleanup = () => handle.removeEventListener("pointerdown", onPointerDown);
    }

    _disposeResize() {
        try {
            this._resizeCleanup?.();
        } catch (e) {
            console.debug?.(e);
        }
        this._resizeCleanup = null;
    }
}

function _getFrameHost(el) {
    const view = el?.ownerDocument?.defaultView || null;
    if (view) return view;
    if (typeof window !== "undefined") return window;
    return globalThis;
}

function _getFrameTimestamp(el) {
    const host = _getFrameHost(el);
    const perfNow = host?.performance?.now;
    if (typeof perfNow === "function") {
        try {
            return Number(perfNow.call(host.performance)) || Date.now();
        } catch {
            return Date.now();
        }
    }
    return Date.now();
}
