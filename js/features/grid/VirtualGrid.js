/**
 * VirtualGrid
 * @description
 * High-performance virtualized grid renderer.
 * Handles thousands of items by only rendering the visible viewport + buffer rows.
 * Supports absolute positioning efficient updates.
 */
export class VirtualGrid {
    static DETAILS_META_MIN_HEIGHT = 36;
    /**
     * @param {HTMLElement} container The container to render items into (wrapper)
     * @param {HTMLElement|Window} scrollElement The element that scrolls (usually parent or window)
     * @param {Object} options Configuration object
     * @param {function(object, number): HTMLElement} options.createItem Callback to create a DOM node for an item
     * @param {function(object, HTMLElement): void} [options.onItemRendered] Called after creating a new DOM node
     * @param {function(HTMLElement): void} [options.onItemRecycled] Called before removing a DOM node (cleanup)
     * @param {function(object, HTMLElement): void} [options.onItemUpdated] Called when reusing a DOM node with updated data
     * @param {number} [options.minItemWidth=120] Minimum width in pixels
     * @param {number} [options.gap=10] Gap between items in pixels
     * @param {number} [options.bufferRows=2] Rows to render above/below viewport
     */
    constructor(container, scrollElement, options = {}) {
        /** @type {HTMLElement} */
        this.container = container;

        /** @type {HTMLElement|Window} */
        this.scrollElement = scrollElement;

        /** @type {Required<typeof options>} */
        this.options = {
            minItemWidth: options.minItemWidth || 120,
            gap: options.gap || 10,
            bufferRows: options.bufferRows || 2,
            createItem: options.createItem || (() => document.createElement("div")),
            onItemRendered: options.onItemRendered || (() => {}),
            onItemRecycled: options.onItemRecycled || (() => {}),
            onItemUpdated: options.onItemUpdated || (() => {}),
        };

        /** @type {any[]} List of data items to render */
        this.items = [];

        this.visibleRange = { start: 0, end: 0 };

        /** @type {Map<number, HTMLElement>} Map of index -> rendered wrapper element */
        this.renderedItems = new Map();

        // Metrics
        this.columnCount = 1;
        this.itemWidth = this.options.minItemWidth;
        this.rowHeight = this.itemWidth;
        this.metaHeight = 0;  // Height of non-image part
        this.measured = false;

        /** @type {number[]} Samples for dynamic height calculation */
        this.measureSamples = [];

        this.renderPending = false;
        this.rafId = 0;
        this._disposed = false;
        this.lastWidth = 0;
        this._resizeDebounce = 0;
        this._lastLayoutWidth = 0;
        this._lastLayoutHeight = 0;
        this._layoutGuardThreshold = 1;
        this._itemsVersion = 0;
        this._lastLayoutItemsVersion = -1;
        this._pool = [];
        this._maxPoolSize = Math.max(32, Number(options.maxPoolSize) || 256);
        this._resizeDeltaThreshold = 2;

        // Observer for container width changes
        const scheduleResize = (width) => {
            if (this._resizeDebounce) {
                clearTimeout(this._resizeDebounce);
            }
            this._resizeDebounce = window.setTimeout(() => {
                this._resizeDebounce = 0;
                if (this._disposed) return;
                if (width > 0) {
                    this.lastWidth = width;
                    this.onResize();
                }
            }, 100);
        };

        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target !== this.container) continue;
                const borderBox = entry.borderBoxSize;
                let width = 0;
                if (Array.isArray(borderBox) && borderBox.length > 0) {
                    width = Number(borderBox[0]?.inlineSize || 0);
                } else if (borderBox && typeof borderBox === "object") {
                    width = Number(borderBox.inlineSize || 0);
                }
                if (!(width > 0)) {
                    width = Number(entry.contentRect?.width || 0);
                }
                width = Math.round(width);
                if (width > 0 && Math.abs(width - this.lastWidth) >= this._resizeDeltaThreshold) {
                    scheduleResize(width);
                }
                break; // Only care about container
            }
        });
        // Always observe container for correct width relative to parent padding/scrollbars
        this.resizeObserver.observe(this.container);

        this.onScrollBound = this.onScroll.bind(this);

        // Dedicated scroll-container mode: normally scrollElement is an HTMLElement.
        // Keep a safety fallback for legacy configurations.
        this.scrollTarget = this._resolveScrollTarget(this.scrollElement);

        if (this.scrollTarget) {
            this.scrollTarget.addEventListener("scroll", this.onScrollBound, { passive: true });
        }

        // Style the container for absolute positioning
        this.container.style.position = "relative";
        this.container.style.display = "block"; // Override 'grid'
        // Keep cell overflow visible; the parent wrapper handles scrolling/clipping.
        this.container.style.overflow = "visible";
        this.container.style.width = "100%";
    }

    _debugEnabled() {
        try {
            return !!globalThis?._mjrDebugGrid;
        } catch {
            return false;
        }
    }

    _warn(...args) {
        try {
            if (!this._debugEnabled()) return;
            console.warn("[Majoor][VirtualGrid]", ...args);
        } catch (e) { console.debug?.(e); }
    }

    /**
     * Update the list of items to display. Triggers a relayout.
     * @param {any[]} items New list of data items (assets)
     * @param {boolean} [force=false] Force re-creation of DOM elements (e.g. settings change)
     */
    setItems(items, force = false) {
        if (this._disposed) return;
        // Fix: Cancel pending scroll render to prevent race conditions
        if (this.renderPending && this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.renderPending = false;
            this.rafId = 0;
        }

        if (force) {
            // Recycle all currently rendered items
            for (const [, el] of this.renderedItems) {
                // Try to clean up
                const card = this._getCard(el);
                if (card) {
                    try { this.options.onItemRecycled(card); } catch (e) { console.debug?.(e); }
                }
                el.remove();
            }
            this.renderedItems.clear();
            // Reset measurement state in case layout settings changed (e.g. badges affecting height)
            this.measured = false;
            this.measureSamples = [];
            this._lastLayoutWidth = 0;
            this._lastLayoutHeight = 0;
        }

        this.items = items || [];
        this._itemsVersion += 1;
        if (this.items.length > 0) {
            this.updateMetrics();
            return;
        }
        this.updateLayout(force);
    }

    /**
     * Update configuration dynamicallly (e.g. settings change)
     * @param {Object} conf
     * @param {number} [conf.minItemWidth]
     * @param {number} [conf.gap]
     */
    updateConfig({ minItemWidth, gap }, { relayout = true } = {}) {
        if (this._disposed) return;
        let changed = false;
        if (minItemWidth != null && minItemWidth !== this.options.minItemWidth) {
            this.options.minItemWidth = Number(minItemWidth);
            changed = true;
        }
        if (gap != null && gap !== this.options.gap) {
            this.options.gap = Number(gap);
            changed = true;
        }
        if (changed && relayout) {
            // Force re-measure and layout
            this.onResize();
        }
    }

    /**
     * Clean up observers and listeners when grid is destroyed.
     */
    dispose() {
        this._disposed = true;
        this.resizeObserver.disconnect();
        if (this.scrollTarget) {
            this.scrollTarget.removeEventListener("scroll", this.onScrollBound);
        }
        if (this._resizeDebounce) {
            clearTimeout(this._resizeDebounce);
            this._resizeDebounce = 0;
        }
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
        this.renderPending = false;
        this.container.innerHTML = "";
        this.renderedItems.clear();
        this._pool.length = 0;
    }

    getRenderedCards() {
        const out = [];
        try {
            for (const [, el] of this.renderedItems) {
                const card = this._getCard(el);
                if (card) out.push(card);
            }
        } catch (e) { console.debug?.(e); }
        return out;
    }

    /**
     * Handle resize: re-calculate columns and render.
     * @private
     */
    onResize() {
        if (this._disposed) return;
        this.updateMetrics();
        this.render();
    }

    /**
     * Handle scroll: request render frame.
     * @private
     */
    onScroll() {
        if (this._disposed) return;
        if (!this.renderPending) {
            this.renderPending = true;
            this.rafId = requestAnimationFrame(() => {
                try {
                    if (!this._disposed) this.render();
                } finally {
                    this.renderPending = false;
                    this.rafId = 0;
                }
            });
        }
    }

    /**
     * Log debug metrics.
     */
    debug() {
        console.log("[VirtualGrid Debug]", {
            scrollTop: this.scrollElement?.scrollTop,
            scrollHeight: this.scrollElement?.scrollHeight,
            clientHeight: this.scrollElement?.clientHeight,
            containerHeight: this.container?.style?.height,
            items: this.items?.length,
            rendered: this.renderedItems?.size,
            scrollTarget: this.scrollTarget
        });
    }

    /**
     * Calculate column count and dimensions based on container width.
     * @private
     */
    updateMetrics() {
        if (this._disposed) return;
        // Use container's clientWidth as the source of truth.
        // This automatically accounts for parent padding and parent scrollbars.
        let containerWidth = this.container.clientWidth;

        // Fallback or sanity check
        if (!containerWidth) return;

        const gap = this.options.gap;
        const minW = this.options.minItemWidth;

        // Derive effective usable width from container/scroll-root geometry.
        // Do not subtract scrollbars twice: container/client widths already account for them.
        let padL = 0;
        let padR = 0;
        try {
            const cs = window.getComputedStyle(this.container);
            padL = Number.parseFloat(cs?.paddingLeft || "0") || 0;
            padR = Number.parseFloat(cs?.paddingRight || "0") || 0;
        } catch (e) { console.debug?.(e); }
        const safety = 2;
        let baseWidth = containerWidth;
        try {
            const se = this.scrollElement;
            if (se && se !== window && se instanceof HTMLElement) {
                const sw = Number(se.clientWidth || 0);
                if (sw > 0) baseWidth = Math.min(baseWidth, sw);
            }
        } catch (e) { console.debug?.(e); }
        let availWidth = Math.max(1, Math.floor(baseWidth - padL - padR - safety));

        this.columnCount = Math.max(1, Math.floor((availWidth + gap) / (minW + gap)));

        // Flex behavior: card width follows available row space.
        this.itemWidth = Math.max(1, Math.floor((availWidth - (this.columnCount - 1) * gap) / this.columnCount));

        const detailsEnabled = !!this.container?.classList?.contains?.("mjr-show-details");

        // Keep cards square by default; when details are shown, reserve a small metadata strip.
        // Once measured, use measured meta height but never below a readable minimum.
        if (this.measured && this.metaHeight > 0) {
            const minMeta = detailsEnabled ? VirtualGrid.DETAILS_META_MIN_HEIGHT : 0;
            this.rowHeight = this.itemWidth + Math.max(this.metaHeight, minMeta);
        } else {
            this.rowHeight = this.itemWidth + (detailsEnabled ? VirtualGrid.DETAILS_META_MIN_HEIGHT : 0);
        }

        this.updateLayout();
    }

    /**
     * Updates container height and triggers render.
     * @private
     */
    updateLayout(force = false) {
        if (this._disposed) return;
        if (!this.items.length) {
            this.container.style.height = "0px";
            return;
        }

        const gap = this.options.gap;
        const totalRows = Math.ceil(this.items.length / this.columnCount);
        const totalHeight = totalRows * this.rowHeight + (totalRows - 1) * gap;

        const containerWidth = this.container.clientWidth || this.container.offsetWidth || this.lastWidth || 0;
        const itemsChanged = this._lastLayoutItemsVersion !== this._itemsVersion;
        if (!force && !itemsChanged && containerWidth > 0) {
            const widthDelta = Math.abs(containerWidth - this._lastLayoutWidth);
            const heightDelta = Math.abs(totalHeight - this._lastLayoutHeight);
            const threshold = this._layoutGuardThreshold;
            if (widthDelta <= threshold && heightDelta <= threshold) {
                // Skip heavy recalculation when size didn't change significantly.
                return;
            }
        }

        this._lastLayoutWidth = containerWidth;
        this._lastLayoutHeight = totalHeight;
        this._lastLayoutItemsVersion = this._itemsVersion;
        this.container.style.height = `${totalHeight}px`;
        this.render();
    }

    _resolveScrollTarget(scrollElement) {
        if (
            scrollElement === window
            || scrollElement === document.body
            || scrollElement === document.documentElement
        ) {
            return window;
        }
        return scrollElement || null;
    }

    _getScrollElement() {
        if (this.scrollTarget === window) {
            return document.scrollingElement || document.documentElement || document.body;
        }
        return this.scrollTarget || this.scrollElement || null;
    }

    _recycleToPool(el) {
        if (!el) return;
        const card = this._getCard(el);
        if (card) {
            try {
                this.options.onItemRecycled(card);
            } catch (e) { console.debug?.(e); }
        }
        try {
            el.remove();
        } catch (e) { console.debug?.(e); }
        if (this._pool.length >= this._maxPoolSize) {
            return;
        }
        this._pool.push(el);
    }

    _takeFromPool() {
        if (!this._pool.length) return null;
        return this._pool.pop() || null;
    }

    /**
     * Detects dynamic height of items by sampling the first few rendered elements.
     * @param {HTMLElement} element The card element to measure
     * @private
     */
    measureItem(element) {
        if (this.measured) return;
        // Try to find the thumb and measure aspect ratio / meta height
        // This is a heuristic.
        try {
            const rect = element.getBoundingClientRect();
            if (rect.height > 0) {
                const fullHeight = rect.height;
                const meta = Math.max(0, fullHeight - this.itemWidth);

                this.measureSamples.push(meta);

                // Sample at least 3 items to avoid outliers
                if (this.measureSamples.length >= 3) {
                     // Calculate median meta height
                     const sorted = [...this.measureSamples].sort((a,b) => a-b);
                     const mid = Math.floor(sorted.length / 2);
                     this.metaHeight = Math.max(0, sorted[mid]);

                    this.rowHeight = this.itemWidth + this.metaHeight;
                    this.measured = true;
                    this.updateLayout(true);
                } else if (this.measureSamples.length === 1) {
                     // Initial update to ensure grid has some height
                     let tempMeta = Math.max(0, meta);
                     this.rowHeight = this.itemWidth + tempMeta;
                     this.updateLayout(true);
                }
            }
        } catch (e) { console.debug?.(e); }
    }

    /**
     * Best-effort re-measure after async content (badges/metadata) is applied.
     * This avoids layout drift when card height changes after initial render.
     */
    scheduleRemeasure() {
        if (this.measured) return;
        try {
            requestAnimationFrame(() => {
                try { this.updateMetrics(); } catch (e) { console.debug?.(e); }
            });
            setTimeout(() => {
                try { this.updateMetrics(); } catch (e) { console.debug?.(e); }
            }, 60);
        } catch (e) { console.debug?.(e); }
    }

    /**
     * Core render loop. Calculates visible range and creates/removes DOM elements.
     */
    render() {
        if (this._disposed) return;
        if (!this.items.length || this.columnCount < 1) return;

        // Cache layout rects to avoid repeated DOM reads
        let scrollTop = 0;
        let viewportHeight = 0;
        const safeRect = (el) => {
            try {
                return el?.getBoundingClientRect?.() || null;
            } catch {
                return null;
            }
        };
        const containerRect = safeRect(this.container);
        const scrollEl = this._getScrollElement();
        const rootRect = this.scrollTarget === window ? null : safeRect(scrollEl);

        if (this.scrollTarget === window) {
            viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            if (containerRect) {
                scrollTop = Math.max(0, -containerRect.top);
            } else {
                scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
            }
        } else {
            viewportHeight = scrollEl?.clientHeight || 0;
            if (containerRect && rootRect) {
                scrollTop = Math.max(0, -(containerRect.top - rootRect.top));
            } else {
                scrollTop = scrollEl?.scrollTop || 0;
            }
        }

        // Sanity check
        if (viewportHeight <= 0) viewportHeight = 600;

        const gap = this.options.gap;
        const rowTotal = this.rowHeight + gap;

        // Calculate visible row range
        const startRow = Math.floor(scrollTop / rowTotal);
        const visibleRows = Math.ceil(viewportHeight / rowTotal);

        const buffer = this.options.bufferRows;

        // Determine index range
        const firstRow = Math.max(0, startRow - buffer);
        const lastRow = startRow + visibleRows + buffer;

        const startIndex = firstRow * this.columnCount;
        const endIndex = Math.min(this.items.length, (lastRow + 1) * this.columnCount);

            const fragment = document.createDocumentFragment();
            let firstNewCard = null;
            let createdCount = 0;
            // Track used keys (indices) to cleanup later
            const desiredIndices = new Set();

            // Render loop
            for (let i = startIndex; i < endIndex; i++) {
                desiredIndices.add(i);

                let el = this.renderedItems.get(i);
                const item = this.items[i];

                // Check if element matches data (handle list mutations)
                // Fix: Use ID check to avoid re-creating DOM when object ref changes but item is same
                const isSameItem = el && (
                    el._virtualItem === item ||
                    (item.id != null && el._virtualItem?.id === item.id)
                );

                if (el && !isSameItem) {
                    this.renderedItems.delete(i);
                    this._recycleToPool(el);
                    el = undefined;
                } else if (el && isSameItem && el._virtualItem !== item) {
                    // Update reference but keep DOM
                    el._virtualItem = item;
                    this.options.onItemUpdated(item, this._getCard(el));
                }

                if (!el) {
                    let fromPool = false;
                    el = this._takeFromPool();
                    if (!el) {
                        // Create wrapper for positioning
                        el = document.createElement("div");
                        el.className = "mjr-virtual-cell";
                        el.style.position = "absolute";
                        fromPool = false;
                    } else {
                        fromPool = true;
                    }

                    // CRITICAL: Set width BEFORE appending/measuring so content flows correctly
                    el.style.width = `${this.itemWidth}px`;

                    let card = this._getCard(el);
                    if (!card || !fromPool) {
                        try {
                            card = this.options.createItem(item, i);
                        } catch (e) {
                            this._warn("createItem failed", e);
                            card = document.createElement("div");
                        }
                        el.textContent = "";
                        el.appendChild(card);
                    } else {
                        try {
                            this.options.onItemUpdated(item, card);
                        } catch (e) {
                            this._warn("onItemUpdated failed", e);
                        }
                    }

                    el._virtualItem = item;

                    fragment.appendChild(el);
                    createdCount += 1;
                    this.renderedItems.set(i, el);

                    // IMPORTANT: The card element inside is what we measure and update
                    // But VirtualGrid manages the 'el' wrapper position.

                    if (!this.measured && !firstNewCard) {
                        firstNewCard = card;
                    }

                    this.options.onItemRendered(item, card);
                }

                // Update position for everyone in range (in case resize happened)
                if (el) {
                    const row = Math.floor(i / this.columnCount);
                    const col = i % this.columnCount;
                    const x = col * (this.itemWidth + gap);
                    const y = row * (this.rowHeight + gap);

                    // CRITICAL FIX: Use left/top instead of transform to avoid being overwritten by
                    // selection state CSS which applies transform: scale().
                    el.style.transform = ""; // clear any legacy transform
                    el.style.left = `${x}px`;
                    el.style.top = `${y}px`;

                    el.style.width = `${this.itemWidth}px`;
                    el.style.height = `${this.rowHeight}px`;

                    // Force child card to fill wrapper?
                    // The wrapper is absolute. The card inside should probably be width 100%.
                    const card = el.firstElementChild;
                    if (card) {
                        card.style.width = "100%";
                        card.style.height = "100%";
                    }
                }
            }

            if (createdCount > 0) {
                this.container.appendChild(fragment);
                if (!this.measured && firstNewCard) {
                    this.measureItem(firstNewCard);
                }
            }

            // Cleanup
            for (const [i, el] of this.renderedItems) {
                if (!desiredIndices.has(i)) {
                    this._recycleToPool(el);
                    this.renderedItems.delete(i);
                }
            }
        }

        /**
         * Scroll the scroll container so that a given item index is visible.
         * Works even when the item is not yet rendered in the DOM (virtualized).
         * @param {number} index Index of the item in the items array
         */
        scrollToIndex(index) {
            if (index < 0 || index >= this.items.length) return;

            const gap = this.options.gap;
            const row = Math.floor(index / this.columnCount);
            const itemTop = row * (this.rowHeight + gap);
            const itemBottom = itemTop + this.rowHeight;

            if (this.scrollTarget === window) {
                const containerRect = this.container.getBoundingClientRect();
                const viewportH = window.innerHeight || document.documentElement.clientHeight;
                const absTop = containerRect.top + (window.scrollY || 0) + itemTop;
                const absBottom = absTop + this.rowHeight;
                const scrollY = window.scrollY || window.pageYOffset || 0;

                if (absBottom > scrollY + viewportH) {
                    window.scrollTo({ top: absBottom - viewportH, behavior: "auto" });
                } else if (absTop < scrollY) {
                    window.scrollTo({ top: absTop, behavior: "auto" });
                }
            } else {
                const el = this._getScrollElement();
                if (!el) return;
                const viewportH = el.clientHeight;

                if (itemBottom > el.scrollTop + viewportH) {
                    el.scrollTop = itemBottom - viewportH;
                } else if (itemTop < el.scrollTop) {
                    el.scrollTop = itemTop;
                }
            }
        }

        _getCard(el) {
            return el.firstElementChild || el;
        }
    }
