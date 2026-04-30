/**
 * WorkflowSidebar is the slide-in panel for the Floating Viewer.
 *
 * It now exposes a single unified "Nodes" view: each workflow node can be
 * expanded inline to reveal editable parameters.
 */

import { WorkflowNodesTab } from "./WorkflowNodesTab.js";

const LIVE_SYNC_FALLBACK_MS = 16;

export class WorkflowSidebar {
    constructor({ hostEl, onClose } = {}) {
        this._hostEl = hostEl;
        this._onClose = onClose ?? null;
        this._visible = false;
        this._liveSyncHandle = null;
        this._liveSyncMode = "";
        this._resizeCleanup = null;
        this._nodesTab = new WorkflowNodesTab();
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
        this._nodesTab.refresh();
        this._startLiveSync();
    }

    hide() {
        this._visible = false;
        this._el.classList.remove("open");
        this._stopLiveSync();
    }

    toggle() {
        if (this._visible) {
            this.hide();
            this._onClose?.();
        } else {
            this.show();
        }
    }

    refresh() {
        if (!this._visible) return;
        this._nodesTab.refresh();
    }

    syncFromGraph() {
        if (!this._visible) return;
        this._nodesTab.refresh();
    }

    dispose() {
        this._stopLiveSync();
        this._disposeResize();
        this._nodesTab?.dispose?.();
        this._nodesTab = null;
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
            this.hide();
            this._onClose?.();
        });
        header.appendChild(closeBtn);
        panel.appendChild(header);

        const resizer = document.createElement("div");
        resizer.className = "mjr-ws-sidebar-resizer";
        resizer.setAttribute("role", "separator");
        resizer.setAttribute("aria-orientation", "vertical");
        resizer.setAttribute("aria-hidden", "true");
        panel.appendChild(resizer);
        this._bindResize(resizer);

        this._body = this._nodesTab.el;
        this._body.classList.add("mjr-ws-sidebar-body");
        panel.appendChild(this._body);

        return panel;
    }

    _startLiveSync() {
        if (this._liveSyncHandle != null) return;
        const frameHost = _getFrameHost(this._el);
        const tick = () => {
            this._liveSyncHandle = null;
            this._liveSyncMode = "";
            if (!this._visible) return;
            this.syncFromGraph();
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
