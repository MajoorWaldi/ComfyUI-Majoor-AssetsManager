export function isManagedPopoverTarget(target: any, openPopovers: Map<unknown, unknown>): boolean {
    if (!target || !openPopovers?.size) return false;
    for (const item of openPopovers.values()) {
        const popover = (item as any)?.popover || null;
        if (!popover) continue;
        if (target === popover) return true;
        try {
            if (typeof popover.contains === "function" && popover.contains(target)) return true;
        } catch (e) {
            console.debug?.(e);
        }
    }
    return false;
}

export function createPopoverManager(container: any): Record<string, any> {
    const openPopovers = new Map();
    let resizeObserver: any = null;
    let repositionRaf = 0;
    let dismissWhitelist: any[] = [];
    let containerScrollHandlerBound = false;
    let windowScrollHandlerBound = false;
    let windowResizeHandlerBound = false;
    let repositionController: AbortController | null = new AbortController();
    let documentListenerController: AbortController | null = new AbortController();
    let disposed = false;

    const POPOVER_GAP_PX = 8;
    const POPOVER_PAD_PX = 8;
    const POPOVER_MIN_WIDTH_PX = 200;
    const POPOVER_MAX_WIDTH_PX = 360;
    const POPOVER_DEFAULT_WIDTH_PX = 280;
    const POPOVER_BOTTOM_SAFETY_PX = 80;
    const POPOVER_MIN_HEIGHT_PX = 140;

    const canScrollAxis = (el: any, axis = "y") => {
        if (!el) return false;
        const style = globalThis.getComputedStyle?.(el);
        const overflow =
            axis === "x"
                ? String(style?.overflowX || style?.overflow || "")
                : String(style?.overflowY || style?.overflow || "");
        if (!/(auto|scroll|overlay)/i.test(overflow)) return false;
        if (axis === "x") {
            return Number(el.scrollWidth || 0) > Number(el.clientWidth || 0) + 1;
        }
        return Number(el.scrollHeight || 0) > Number(el.clientHeight || 0) + 1;
    };

    const resolveScrollTarget = (start: any, root: any) => {
        let el = start instanceof HTMLElement ? start : root;
        while (el && el !== root) {
            if (canScrollAxis(el, "y") || canScrollAxis(el, "x")) return el;
            el = el.parentElement;
        }
        return canScrollAxis(root, "y") || canScrollAxis(root, "x") ? root : null;
    };

    const bindPopoverInteractionGuards = (popover: any) => {
        if (!popover || popover._mjrInteractionGuardsBound) return;
        const stopPropagation = (event: any) => {
            try {
                event.stopPropagation();
            } catch (e) {
                console.debug?.(e);
            }
        };
        const handleWheel = (event: any) => {
            const scrollTarget = resolveScrollTarget(event?.target, popover);
            const deltaX = Number(event?.deltaX || 0);
            const deltaY = Number(event?.deltaY || 0);
            if (scrollTarget) {
                try {
                    if (deltaY)
                        scrollTarget.scrollTop = Number(scrollTarget.scrollTop || 0) + deltaY;
                    if (deltaX)
                        scrollTarget.scrollLeft = Number(scrollTarget.scrollLeft || 0) + deltaX;
                } catch (e) {
                    console.debug?.(e);
                }
            }
            try {
                event.preventDefault();
            } catch (e) {
                console.debug?.(e);
            }
            stopPropagation(event);
        };
        try {
            popover.addEventListener("wheel", handleWheel, { passive: false, capture: true });
            popover.addEventListener("mousedown", stopPropagation);
            popover.addEventListener("touchmove", stopPropagation, { passive: true });
            popover._mjrInteractionGuardsBound = true;
        } catch (e) {
            console.debug?.(e);
        }
    };

    const attachPopoverToPortal = (popover: any) => {
        if (!popover || !(popover instanceof HTMLElement)) return;
        bindPopoverInteractionGuards(popover);
        if (!(popover as any)._mjrPortal) {
            (popover as any)._mjrPortal = {
                parent: popover.parentNode,
                nextSibling: popover.nextSibling,
            };
        }
        popover.classList.add("mjr-popover-portal");
        try {
            if (popover.parentNode !== document.body) {
                document.body.appendChild(popover);
            }
        } catch (e) {
            console.debug?.(e);
        }
    };

    const restorePopoverFromPortal = (popover: any) => {
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
        } catch (e) {
            console.debug?.(e);
        }
    };

    const positionPopover = (popover: any, anchor: any) => {
        if (!popover || !anchor) return;
        try {
            const anchorRect = anchor.getBoundingClientRect();
            const panelRect = container.getBoundingClientRect();

            attachPopoverToPortal(popover);

            popover.style.position = "fixed";
            popover.style.margin = "0";

            const maxWidth = Math.max(
                POPOVER_MIN_WIDTH_PX,
                Math.min(
                    POPOVER_MAX_WIDTH_PX,
                    panelRect.width - POPOVER_PAD_PX * 2,
                    window.innerWidth - POPOVER_PAD_PX * 2,
                ),
            );
            popover.style.maxWidth = `${maxWidth}px`;

            const popW = popover.offsetWidth || Math.min(POPOVER_DEFAULT_WIDTH_PX, maxWidth);
            const popH = popover.offsetHeight || 1;

            // Align to the anchor's left edge (ComfyUI-like), then clamp inside the panel.
            let left = anchorRect.left;
            left = Math.max(
                panelRect.left + POPOVER_PAD_PX,
                Math.min(left, panelRect.right - popW - POPOVER_PAD_PX),
            );

            let top = anchorRect.bottom + POPOVER_GAP_PX;
            const bottomLimit = Math.min(panelRect.bottom, window.innerHeight) - POPOVER_PAD_PX;
            const topLimit = Math.max(panelRect.top, 0) + POPOVER_PAD_PX;

            if (top + popH > bottomLimit && anchorRect.top - POPOVER_GAP_PX - popH >= topLimit) {
                top = anchorRect.top - POPOVER_GAP_PX - popH;
            }

            top = Math.max(topLimit, Math.min(top, bottomLimit - POPOVER_BOTTOM_SAFETY_PX));
            const availableBelow = bottomLimit - top;
            popover.style.maxHeight = `${Math.max(POPOVER_MIN_HEIGHT_PX, availableBelow)}px`;
            popover.style.overflowX = "hidden";
            popover.style.overflowY = "auto";
            popover.style.overscrollBehavior = "contain";

            popover.style.zIndex = "10020";
            popover.style.left = `${Math.round(left)}px`;
            popover.style.top = `${Math.round(top)}px`;
        } catch (e) {
            console.debug?.(e);
        }
    };

    const scheduleReposition = () => {
        if (!openPopovers.size) return;
        if (repositionRaf) cancelAnimationFrame(repositionRaf);
        repositionRaf = requestAnimationFrame(() => {
            repositionRaf = 0;
            for (const item of openPopovers.values()) positionPopover(item.popover, item.anchor);
        });
    };

    const handleObservedScroll = (event: any) => {
        if (isManagedPopoverTarget(event?.target, openPopovers)) return;
        scheduleReposition();
    };

    const ensureRepositionListeners = () => {
        if (!openPopovers.size) return;
        try {
            if (!windowResizeHandlerBound) {
                window.addEventListener("resize", scheduleReposition, {
                    passive: true,
                    signal: repositionController!.signal,
                });
                windowResizeHandlerBound = true;
            }
        } catch (e) {
            console.debug?.(e);
        }
        try {
            if (!windowScrollHandlerBound) {
                // Scroll doesn't bubble; use capture to catch nested scroll containers.
                window.addEventListener("scroll", handleObservedScroll, {
                    passive: true,
                    capture: true,
                    signal: repositionController!.signal,
                });
                windowScrollHandlerBound = true;
            }
        } catch (e) {
            console.debug?.(e);
        }
        try {
            if (!resizeObserver) {
                resizeObserver = new ResizeObserver(scheduleReposition);
                resizeObserver.observe(container);
            }
        } catch (e) {
            console.debug?.(e);
        }
        try {
            if (!containerScrollHandlerBound) {
                // Bind to panel root as a fallback when window capture doesn't fire reliably.
                container.addEventListener("scroll", handleObservedScroll, { passive: true });
                containerScrollHandlerBound = true;
            }
        } catch (e) {
            console.debug?.(e);
        }
    };

    const maybeRemoveRepositionListeners = () => {
        if (openPopovers.size) return;
        try {
            if (windowResizeHandlerBound) window.removeEventListener("resize", scheduleReposition);
        } catch (e) {
            console.debug?.(e);
        }
        windowResizeHandlerBound = false;
        try {
            if (windowScrollHandlerBound)
                window.removeEventListener("scroll", handleObservedScroll, { capture: true });
        } catch (e) {
            console.debug?.(e);
        }
        // Safari/Chromium ignore the options object mismatch sometimes; best-effort extra removal.
        try {
            if (windowScrollHandlerBound)
                window.removeEventListener("scroll", handleObservedScroll, true);
        } catch (e) {
            console.debug?.(e);
        }
        windowScrollHandlerBound = false;
        try {
            if (containerScrollHandlerBound)
                container.removeEventListener("scroll", handleObservedScroll);
        } catch (e) {
            console.debug?.(e);
        }
        containerScrollHandlerBound = false;
        try {
            if (resizeObserver) resizeObserver.disconnect();
        } catch (e) {
            console.debug?.(e);
        }
        resizeObserver = null;
        try {
            repositionController!.abort();
        } catch (e) {
            console.debug?.(e);
        }
        if (!disposed) repositionController = new AbortController();
    };

    const close = (popover: any) => {
        if (!popover) return;
        try {
            popover.style.display = "none";
        } catch (e) {
            console.debug?.(e);
        }
        try {
            restorePopoverFromPortal(popover);
        } catch (e) {
            console.debug?.(e);
        }
        openPopovers.delete(popover);
        maybeRemoveRepositionListeners();
    };

    const open = (popover: any, anchor: any) => {
        if (!popover || !anchor) return;
        openPopovers.set(popover, { popover, anchor });
        ensureRepositionListeners();
        positionPopover(popover, anchor);
        scheduleReposition();
    };

    const toggle = (popover: any, anchor: any) => {
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
            } catch (e) {
                console.debug?.(e);
            }
        }
        for (const popover of Array.from(openPopovers.keys())) close(popover);
        openPopovers.clear();
        maybeRemoveRepositionListeners();
    };

    const setDismissWhitelist = (elements: any) => {
        dismissWhitelist = Array.isArray(elements) ? elements.filter(Boolean) : [];
    };

    const onDocMouseDown = (event: any) => {
        const target = event.target;
        if (!target) return;
        // Clicking inside an open popover (or its anchor) should not dismiss it.
        for (const item of openPopovers.values()) {
            try {
                if (item?.popover && item.popover.contains(target)) return;
            } catch (e) {
                console.debug?.(e);
            }
            try {
                if (item?.anchor && item.anchor.contains(target)) return;
            } catch (e) {
                console.debug?.(e);
            }
        }
        for (const el of dismissWhitelist) {
            try {
                if (el && typeof el.contains === "function" && el.contains(target)) return;
            } catch (e) {
                console.debug?.(e);
            }
        }
        // PrimeVue portals: overlays (Select, Listbox, DatePicker...) are appended
        // directly to <body> and thus fall outside the managed popover element.
        // Guard: if the click target is inside a PrimeVue overlay portal that
        // belongs to an open popover, do not dismiss.
        try {
            if (openPopovers.size) {
                const pvRoot = target.closest?.("[data-pc-name]");
                if (pvRoot && pvRoot.parentElement === document.body) {
                    // It is a PrimeVue portal element. Check if any open popover
                    // contains the trigger component whose id matches the portal.
                    for (const item of openPopovers.values()) {
                        try {
                            if (!item?.popover) continue;
                            // If the popover hosts a PrimeVue component whose overlay
                            // has just been triggered, let the click go through.
                            const triggerId = pvRoot.id?.replace(/_list$|_overlay$|_panel$/, "");
                            if (triggerId && item.popover.querySelector(`#${CSS.escape(triggerId)}`)) return;
                            // Fallback: any active PrimeVue component inside the popover
                            // may have opened this portal.
                            if (item.popover.querySelector("[data-pc-name][aria-expanded='true']")) return;
                        } catch (e) {
                            console.debug?.(e);
                        }
                    }
                }
                // Secondary guard: PrimeVue v4 unstyled overlays may render their
                // portal root without a [data-pc-name] attribute (e.g. Select list panel).
                // Walk up from the target to the direct body child; if any open popover
                // has an expanded PrimeVue component ([aria-expanded='true']), the click
                // is inside that component's overlay  -  do not dismiss.
                try {
                    let bodyChild = target;
                    while (
                        bodyChild &&
                        bodyChild !== document.body &&
                        bodyChild.parentNode &&
                        bodyChild.parentNode !== document.body
                    ) {
                        bodyChild = bodyChild.parentNode;
                    }
                    if (bodyChild && bodyChild !== document.body && bodyChild.parentNode === document.body) {
                        for (const item of openPopovers.values()) {
                            try {
                                if (!item?.popover) continue;
                                if (item.popover.querySelector("[data-pc-name][aria-expanded='true']")) return;
                                if (item.popover.querySelector("[aria-expanded='true'][role='combobox']")) return;
                            } catch (e) {
                                console.debug?.(e);
                            }
                        }
                    }
                } catch (e) {
                    console.debug?.(e);
                }
            }
        } catch (e) {
            console.debug?.(e);
        }
        closeAll();
    };

    const init = () => {
        try {
            documentListenerController?.abort?.();
        } catch (e) {
            console.debug?.(e);
        }
        documentListenerController = new AbortController();
        document.addEventListener("mousedown", onDocMouseDown, {
            signal: documentListenerController.signal,
        });
    };

    const dispose = () => {
        disposed = true;
        try {
            documentListenerController?.abort?.();
        } catch (e) {
            console.debug?.(e);
        }
        documentListenerController = null;
        try {
            maybeRemoveRepositionListeners();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            repositionController!.abort();
        } catch (e) {
            console.debug?.(e);
        }
        repositionController = null;
        try {
            closeAll();
        } catch (e) {
            console.debug?.(e);
        }
    };

    init();

    return {
        open,
        close,
        toggle,
        closeAll,
        scheduleReposition,
        setDismissWhitelist,
        dispose,
    };
}
