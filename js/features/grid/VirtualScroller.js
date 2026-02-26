/** Virtual scroller helpers extracted from GridView_impl.js (P3-B-02). */

export function isPotentialScrollContainer(el) {
    if (!el || el === window) return false;
    if (el === document.body || el === document.documentElement) return false;
    try {
        const style = window.getComputedStyle(el);
        const overflowY = String(style?.overflowY || "");
        if (!/(auto|scroll|overlay)/.test(overflowY)) return false;
        const clientH = Number(el.clientHeight) || 0;
        if (clientH <= 0) return false;
        return true;
    } catch {
        return false;
    }
}

export function detectScrollRoot(gridContainer) {
    try {
        const browse = gridContainer?.closest?.(".mjr-am-browse") || null;
        if (browse && isPotentialScrollContainer(browse)) return browse;
    } catch {}
    try {
        let cur = gridContainer?.parentElement;
        while (cur && cur !== document.body && cur !== document.documentElement) {
            if (isPotentialScrollContainer(cur)) return cur;
            cur = cur.parentElement;
        }
    } catch {}
    return gridContainer?.parentElement || null;
}

export function getScrollContainer(gridContainer, state) {
    try {
        const cur = state?.scrollRoot;
        if (cur && cur instanceof HTMLElement) return cur;
    } catch {}
    const detected = detectScrollRoot(gridContainer);
    if (detected && state) state.scrollRoot = detected;
    return detected;
}

export function ensureVirtualGrid(gridContainer, state, deps) {
    if (state.virtualGrid) {
        // Guard: a disposed instance has its DOM detached; discard it so a fresh one is created.
        if (state.virtualGrid._disposed) {
            state.virtualGrid = null;
        } else {
            return state.virtualGrid;
        }
    }
    const scrollRoot = getScrollContainer(gridContainer, state);
    try {
        deps.gridDebug("virtualGrid:scrollRoot", {
            scrollRoot: scrollRoot === document.body ? "document.body" : scrollRoot === document.documentElement ? "document.documentElement" : scrollRoot?.className || scrollRoot?.tagName || null,
        });
    } catch {}
    state.virtualGrid = new deps.VirtualGrid(gridContainer, scrollRoot, deps.optionsFactory());
    if (!state._cardKeydownHandler) {
        const handler = (event) => {
            try {
                if (!event?.key) return;
                if (event.key !== "Enter" && event.key !== " ") return;
                const card = event.target?.closest?.(".mjr-asset-card");
                if (!card) return;
                event.preventDefault();
                card.click();
            } catch {}
        };
        state._cardKeydownHandler = handler;
        gridContainer.addEventListener("keydown", handler, true);
    }
    return state.virtualGrid;
}

export function ensureSentinel(gridContainer, state, sentinelClass) {
    let sentinel = state.sentinel;
    if (sentinel && sentinel.isConnected && sentinel.parentNode === gridContainer && !sentinel.nextSibling) return sentinel;
    if (sentinel) {
        sentinel.remove();
    } else {
        sentinel = document.createElement("div");
        sentinel.className = sentinelClass;
        sentinel.style.cssText = "height: 1px; width: 100%; position: absolute; bottom: 0; left: 0; pointer-events: none; z-index: -10;";
        state.sentinel = sentinel;
    }
    gridContainer.appendChild(sentinel);
    if (state.observer) {
        try { state.observer.observe(sentinel); } catch {}
    }
    return sentinel;
}

export function stopObserver(state) {
    try {
        if (state.observer) state.observer.disconnect();
    } catch {}
    state.observer = null;
    try {
        if (state.sentinel && state.sentinel.isConnected) state.sentinel.remove();
    } catch {}
    state.sentinel = null;
    try {
        if (state.scrollTarget && state.scrollHandler) {
            state.scrollTarget.removeEventListener("scroll", state.scrollHandler);
        }
    } catch {}
    state.scrollRoot = null;
    state.scrollTarget = null;
    state.scrollHandler = null;
    state.ignoreNextScroll = false;
    state.userScrolled = false;
    state.allowUntilFilled = true;
}

export function captureScrollMetrics(state) {
    const root = state?.scrollRoot;
    if (!root) return null;
    const clientHeight = Number(root.clientHeight) || 0;
    const scrollHeight = Number(root.scrollHeight) || 0;
    const scrollTop = Number(root.scrollTop) || 0;
    const bottomGap = scrollHeight - (scrollTop + clientHeight);
    return { clientHeight, scrollHeight, scrollTop, bottomGap };
}

export function maybeKeepPinnedToBottom(_state, _before) {
    return;
}

export function startInfiniteScroll(gridContainer, state, deps) {
    if (!deps.config.INFINITE_SCROLL_ENABLED) return;
    stopObserver(state);
    const sentinel = ensureSentinel(gridContainer, state, deps.sentinelClass);
    let rootEl = null;
    try {
        rootEl = state?.virtualGrid?.scrollElement || null;
    } catch {
        rootEl = null;
    }
    if (!rootEl) rootEl = getScrollContainer(gridContainer, state);
    if (!rootEl || !(rootEl instanceof HTMLElement)) {
        deps.gridDebug("infiniteScroll:disabled", { reason: "no scroll container" });
        return;
    }
    state.scrollRoot = rootEl;
    state.userScrolled = false;
    const scrollTarget = rootEl;
    state.scrollTarget = scrollTarget;
    deps.gridDebug("infiniteScroll:setup", {
        rootEl: rootEl?.className || rootEl?.tagName || null,
        scrollTarget: scrollTarget?.className || scrollTarget?.tagName || null,
        rootMargin: deps.config.INFINITE_SCROLL_ROOT_MARGIN || "800px",
        threshold: deps.config.INFINITE_SCROLL_THRESHOLD ?? 0.01,
        offset: Number(state?.offset || 0) || 0,
        done: !!state?.done,
    });
    if (scrollTarget && !state.scrollHandler) {
        state.scrollHandler = () => {
            if (state.ignoreNextScroll) {
                state.ignoreNextScroll = false;
                return;
            }
            state.userScrolled = true;
            try {
                if (state.loading || state.done || state.allowUntilFilled) return;
                const m = captureScrollMetrics(state);
                const bottomGapPx = Math.max(0, Number(deps.config.BOTTOM_GAP_PX || 80));
                if (m && m.bottomGap <= bottomGapPx) {
                    Promise.resolve(deps.loadNextPage(gridContainer, state)).catch(() => null);
                }
            } catch {}
        };
        try {
            scrollTarget.addEventListener("scroll", state.scrollHandler, { passive: true });
        } catch {}
    }
    const observerRoot = rootEl;
    state.observer = new IntersectionObserver((entries) => {
        for (const entry of entries || []) {
            if (!entry.isIntersecting) continue;
            if (state.loading || state.done) return;
            const metrics = captureScrollMetrics(state);
            const fillsViewport = metrics ? metrics.scrollHeight > metrics.clientHeight + 40 : false;
            if (!state.userScrolled && fillsViewport && !state.allowUntilFilled) return;
            try {
                state.observer?.unobserve?.(sentinel);
            } catch {}
            state.userScrolled = false;
            if (fillsViewport) state.allowUntilFilled = false;
            Promise.resolve(deps.loadNextPage(gridContainer, state))
                .catch(() => null)
                .finally(() => {
                    if (state.done) return;
                    if (!sentinel.isConnected) return;
                    try {
                        state.observer?.observe?.(sentinel);
                    } catch {}
                });
        }
    }, {
        root: observerRoot,
        rootMargin: deps.config.INFINITE_SCROLL_ROOT_MARGIN || "800px",
        threshold: deps.config.INFINITE_SCROLL_THRESHOLD ?? 0.01,
    });
    state.observer.observe(sentinel);
}
