import { MFV_RESIZE_EDGE_HIT_PX } from "./floatingViewerConstants.js";

export function getFloatingViewerResizeCursor(dir: string): string {
    const map = {
        n: "ns-resize",
        s: "ns-resize",
        e: "ew-resize",
        w: "ew-resize",
        ne: "nesw-resize",
        nw: "nwse-resize",
        se: "nwse-resize",
        sw: "nesw-resize",
    };
    return (map as Record<string, any>)[dir] || "";
}

export function getFloatingViewerResizeDirectionFromPoint(clientX: number, clientY: number, rect: DOMRect): string {
    if (!rect) return "";
    const nearLeft = clientX <= rect.left + MFV_RESIZE_EDGE_HIT_PX;
    const nearRight = clientX >= rect.right - MFV_RESIZE_EDGE_HIT_PX;
    const nearTop = clientY <= rect.top + MFV_RESIZE_EDGE_HIT_PX;
    const nearBottom = clientY >= rect.bottom - MFV_RESIZE_EDGE_HIT_PX;
    if (nearTop && nearLeft) return "nw";
    if (nearTop && nearRight) return "ne";
    if (nearBottom && nearLeft) return "sw";
    if (nearBottom && nearRight) return "se";
    if (nearTop) return "n";
    if (nearBottom) return "s";
    if (nearLeft) return "w";
    if (nearRight) return "e";
    return "";
}

export function stopFloatingViewerEdgeResize(viewer: any): void {
    if (!viewer.element) return;
    try {
        viewer._resizeWindowCleanup?.();
    } catch (e: any) {
        console.debug?.(e);
    }
    viewer._resizeWindowCleanup = null;
    if (viewer._resizeState?.pointerId != null) {
        try {
            viewer.element.releasePointerCapture(viewer._resizeState.pointerId);
        } catch (e: any) {
            console.debug?.(e);
        }
    }
    viewer._resizeState = null;
    viewer.element.classList.remove("mjr-mfv--resizing");
    viewer.element.style.cursor = "";
}

export function bindFloatingViewerPanelInteractions(viewer: any): void {
    if (!viewer.element) return;
    viewer._stopEdgeResize();
    try {
        viewer._panelAC?.abort();
    } catch (e: any) {
        console.debug?.(e);
    }
    viewer._panelAC = new AbortController();
    viewer._initEdgeResize(viewer.element);
    viewer._initDrag(viewer.element.querySelector(".mjr-mfv-header"));
}

export function initFloatingViewerEdgeResize(viewer: any, el: HTMLElement): void {
    if (!el) return;
    const resolveDir = (e: any) => {
        if (!viewer.element || viewer._isPopped) return "";
        const rect = viewer.element.getBoundingClientRect();
        return viewer._getResizeDirectionFromPoint(e.clientX, e.clientY, rect);
    };
    const signal = viewer._panelAC?.signal;
    let resizeAC: any = null;

    const cleanupResizeWindowListeners = () => {
        try {
            resizeAC?.abort();
        } catch (err: any) {
            console.debug?.(err);
        }
        resizeAC = null;
        viewer._resizeWindowCleanup = null;
    };

    const onPointerDown = (e: any) => {
        if (e.button !== 0 || !viewer.element || viewer._isPopped) return;
        const dir = resolveDir(e);
        if (!dir) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = viewer.element.getBoundingClientRect();
        const style = window.getComputedStyle(viewer.element);
        const minWidth = Math.max(120, Number.parseFloat(style.minWidth) || 0);
        const minHeight = Math.max(100, Number.parseFloat(style.minHeight) || 0);
        viewer._resizeState = {
            pointerId: e.pointerId,
            dir,
            startX: e.clientX,
            startY: e.clientY,
            startLeft: rect.left,
            startTop: rect.top,
            startWidth: rect.width,
            startHeight: rect.height,
            minWidth,
            minHeight,
        };
        viewer.element.style.left = `${Math.round(rect.left)}px`;
        viewer.element.style.top = `${Math.round(rect.top)}px`;
        viewer.element.style.right = "auto";
        viewer.element.style.bottom = "auto";
        viewer.element.classList.add("mjr-mfv--resizing");
        viewer.element.style.cursor = viewer._resizeCursorForDirection(dir);
        try {
            viewer.element.setPointerCapture(e.pointerId);
        } catch (err: any) {
            console.debug?.(err);
        }
        try {
            cleanupResizeWindowListeners();
            resizeAC = new AbortController();
            viewer._resizeWindowCleanup = cleanupResizeWindowListeners;
            const win = viewer.element?.ownerDocument?.defaultView || window;
            win.addEventListener("pointermove", onPointerMove, { signal: resizeAC.signal });
            win.addEventListener("pointerup", onPointerEnd, { signal: resizeAC.signal });
            win.addEventListener("pointercancel", onPointerEnd, { signal: resizeAC.signal });
        } catch (err: any) {
            console.debug?.(err);
        }
    };

    const onPointerMove = (e: any) => {
        if (!viewer.element || viewer._isPopped) return;
        const state = viewer._resizeState;
        if (!state) {
            const dir = resolveDir(e);
            viewer.element.style.cursor = dir ? viewer._resizeCursorForDirection(dir) : "";
            return;
        }
        if (state.pointerId !== e.pointerId) return;

        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;
        let width = state.startWidth;
        let height = state.startHeight;
        let left = state.startLeft;
        let top = state.startTop;

        if (state.dir.includes("e")) width = state.startWidth + dx;
        if (state.dir.includes("s")) height = state.startHeight + dy;
        if (state.dir.includes("w")) {
            width = state.startWidth - dx;
            left = state.startLeft + dx;
        }
        if (state.dir.includes("n")) {
            height = state.startHeight - dy;
            top = state.startTop + dy;
        }

        if (width < state.minWidth) {
            if (state.dir.includes("w")) left -= state.minWidth - width;
            width = state.minWidth;
        }
        if (height < state.minHeight) {
            if (state.dir.includes("n")) top -= state.minHeight - height;
            height = state.minHeight;
        }

        width = Math.min(width, Math.max(state.minWidth, window.innerWidth));
        height = Math.min(height, Math.max(state.minHeight, window.innerHeight));
        left = Math.min(Math.max(0, left), Math.max(0, window.innerWidth - width));
        top = Math.min(Math.max(0, top), Math.max(0, window.innerHeight - height));

        viewer.element.style.width = `${Math.round(width)}px`;
        viewer.element.style.height = `${Math.round(height)}px`;
        viewer.element.style.left = `${Math.round(left)}px`;
        viewer.element.style.top = `${Math.round(top)}px`;
        viewer.element.style.right = "auto";
        viewer.element.style.bottom = "auto";
    };

    const onPointerEnd = (e: any) => {
        if (!viewer.element || !viewer._resizeState) return;
        if (viewer._resizeState.pointerId !== e.pointerId) return;
        const dir = resolveDir(e);
        cleanupResizeWindowListeners();
        viewer._stopEdgeResize();
        if (dir) viewer.element.style.cursor = viewer._resizeCursorForDirection(dir);
    };

    el.addEventListener("pointerdown", onPointerDown, { capture: true, signal });
    el.addEventListener("pointermove", onPointerMove, { signal });
    el.addEventListener("pointerup", onPointerEnd, { signal });
    el.addEventListener("pointercancel", onPointerEnd, { signal });
    el.addEventListener(
        "pointerleave",
        () => {
            if (!viewer._resizeState && viewer.element) viewer.element.style.cursor = "";
        },
        { signal },
    );
}

export function initFloatingViewerDrag(viewer: any, handle: HTMLElement): void {
    if (!handle) return;
    const signal = viewer._panelAC?.signal;
    let dragAC: any = null;
    handle.addEventListener(
        "pointerdown",
        (e) => {
            if (e.button !== 0) return;
            if ((e.target as Element).closest("button")) return;
            if ((e.target as Element).closest("select")) return;
            if (viewer._isPopped || !viewer.element) return;
            const edgeDir = viewer._getResizeDirectionFromPoint(
                e.clientX,
                e.clientY,
                viewer.element.getBoundingClientRect(),
            );
            if (edgeDir) return;
            e.preventDefault();
            handle.setPointerCapture(e.pointerId);
            try {
                dragAC?.abort();
            } catch {}
            dragAC = new AbortController();
            const dragSig = dragAC.signal;

            const el = viewer.element;
            const rect = el.getBoundingClientRect();
            const offX = e.clientX - rect.left;
            const offY = e.clientY - rect.top;

            const onMove = (me: any) => {
                const x = Math.min(
                    window.innerWidth - el.offsetWidth,
                    Math.max(0, me.clientX - offX),
                );
                const y = Math.min(
                    window.innerHeight - el.offsetHeight,
                    Math.max(0, me.clientY - offY),
                );
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;
                el.style.right = "auto";
                el.style.bottom = "auto";
            };
            const onUp = () => {
                try {
                    handle.releasePointerCapture?.(e.pointerId);
                } catch (err: any) {
                    console.debug?.(err);
                }
                try {
                    dragAC?.abort();
                } catch {}
            };
            const win = handle.ownerDocument?.defaultView || window;
            win.addEventListener("pointermove", onMove, { signal: dragSig });
            win.addEventListener("pointerup", onUp, { signal: dragSig });
            win.addEventListener("pointercancel", onUp, { signal: dragSig });
        },
        signal ? { signal } : undefined,
    );
}
