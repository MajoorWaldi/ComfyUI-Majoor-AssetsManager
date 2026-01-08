export function createPopoverManager(container) {
    const openPopovers = new Map();
    let resizeObserver = null;
    let repositionRaf = 0;
    let dismissWhitelist = [];
    let containerScrollHandlerBound = false;

    const attachPopoverToPortal = (popover) => {
        if (!popover || !(popover instanceof HTMLElement)) return;
        if (!popover._mjrPortal) {
            popover._mjrPortal = {
                parent: popover.parentNode,
                nextSibling: popover.nextSibling
            };
        }
        popover.classList.add("mjr-popover-portal");
        try {
            document.body.appendChild(popover);
        } catch {}
    };

    const restorePopoverFromPortal = (popover) => {
        const info = popover?._mjrPortal;
        if (!info) return;
        popover.classList.remove("mjr-popover-portal");
        try {
            const parent = info.parent;
            if (parent && parent instanceof HTMLElement) {
                if (info.nextSibling && info.nextSibling.parentNode === parent) {
                    parent.insertBefore(popover, info.nextSibling);
                } else {
                    parent.appendChild(popover);
                }
            }
        } catch {}
    };

    const positionPopover = (popover, anchor) => {
        if (!popover || !anchor) return;
        try {
            const anchorRect = anchor.getBoundingClientRect();
            const panelRect = container.getBoundingClientRect();
            const gap = 8;
            const pad = 8;

            attachPopoverToPortal(popover);

            popover.style.position = "fixed";
            popover.style.zIndex = "2147483647";
            popover.style.margin = "0";

            const maxWidth = Math.max(
                200,
                Math.min(360, panelRect.width - pad * 2, window.innerWidth - pad * 2)
            );
            popover.style.maxWidth = `${maxWidth}px`;

            const popW = popover.offsetWidth || Math.min(280, maxWidth);
            const popH = popover.offsetHeight || 1;

            // Align to the anchor's left edge (ComfyUI-like), then clamp inside the panel.
            let left = anchorRect.left;
            left = Math.max(panelRect.left + pad, Math.min(left, panelRect.right - popW - pad));

            let top = anchorRect.bottom + gap;
            const bottomLimit = Math.min(panelRect.bottom, window.innerHeight) - pad;
            const topLimit = Math.max(panelRect.top, 0) + pad;

            if (top + popH > bottomLimit && anchorRect.top - gap - popH >= topLimit) {
                top = anchorRect.top - gap - popH;
            }

            top = Math.max(topLimit, Math.min(top, bottomLimit - 80));
            const availableBelow = bottomLimit - top;
            popover.style.maxHeight = `${Math.max(140, availableBelow)}px`;
            popover.style.overflow = "auto";

            popover.style.left = `${Math.round(left)}px`;
            popover.style.top = `${Math.round(top)}px`;
        } catch {}
    };

    const scheduleReposition = () => {
        if (!openPopovers.size) return;
        if (repositionRaf) cancelAnimationFrame(repositionRaf);
        repositionRaf = requestAnimationFrame(() => {
            repositionRaf = 0;
            for (const item of openPopovers.values()) positionPopover(item.popover, item.anchor);
        });
    };

    const close = (popover) => {
        if (!popover) return;
        try {
            popover.style.display = "none";
        } catch {}
        try {
            restorePopoverFromPortal(popover);
        } catch {}
        openPopovers.delete(popover);
    };

    const open = (popover, anchor) => {
        if (!popover || !anchor) return;
        openPopovers.set(popover, { popover, anchor });
        positionPopover(popover, anchor);
        scheduleReposition();
    };

    const toggle = (popover, anchor) => {
        if (!popover || !anchor) return;
        const isOpen = openPopovers.has(popover) || popover.style.display === "block";
        const next = isOpen ? "none" : "block";
        popover.style.display = next;
        if (next !== "none") open(popover, anchor);
        else close(popover);
    };

    const closeAll = () => {
        for (const item of openPopovers.values()) {
            try {
                restorePopoverFromPortal(item.popover);
            } catch {}
        }
        for (const popover of Array.from(openPopovers.keys())) close(popover);
        openPopovers.clear();
    };

    const setDismissWhitelist = (elements) => {
        dismissWhitelist = Array.isArray(elements) ? elements.filter(Boolean) : [];
    };

    const onDocMouseDown = (event) => {
        const target = event.target;
        if (!target) return;
        // Clicking inside an open popover (or its anchor) should not dismiss it.
        for (const item of openPopovers.values()) {
            try {
                if (item?.popover && item.popover.contains(target)) return;
            } catch {}
            try {
                if (item?.anchor && item.anchor.contains(target)) return;
            } catch {}
        }
        for (const el of dismissWhitelist) {
            try {
                if (el && typeof el.contains === "function" && el.contains(target)) return;
            } catch {}
        }
        closeAll();
    };

    const init = () => {
        document.addEventListener("mousedown", onDocMouseDown);
        try {
            window.addEventListener("resize", scheduleReposition);
            window.addEventListener("scroll", scheduleReposition, true);
            resizeObserver = new ResizeObserver(scheduleReposition);
            resizeObserver.observe(container);
        } catch {}
        try {
            // Some scroll containers (nested panels) don't reliably trigger the window capture listener
            // across all browsers; bind to the panel root as a fallback.
            if (!containerScrollHandlerBound) {
                container.addEventListener("scroll", scheduleReposition, true);
                containerScrollHandlerBound = true;
            }
        } catch {}
    };

    const dispose = () => {
        try {
            document.removeEventListener("mousedown", onDocMouseDown);
        } catch {}
        try {
            if (resizeObserver) resizeObserver.disconnect();
        } catch {}
        resizeObserver = null;
        try {
            window.removeEventListener("resize", scheduleReposition);
        } catch {}
        try {
            window.removeEventListener("scroll", scheduleReposition, true);
        } catch {}
        try {
            if (containerScrollHandlerBound) {
                container.removeEventListener("scroll", scheduleReposition, true);
            }
        } catch {}
        containerScrollHandlerBound = false;
        try {
            closeAll();
        } catch {}
    };

    init();

    return {
        open,
        close,
        toggle,
        closeAll,
        scheduleReposition,
        setDismissWhitelist,
        dispose
    };
}

export function getPopoverManagerForElement(el) {
    try {
        const host = el?.closest?.(".mjr-am-container");
        return host?._mjrPopoverManager || null;
    } catch {}
    return null;
}
