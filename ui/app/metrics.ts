/**
 * Performance Metrics Utility - Majoor Assets Manager
 *
 * Provides performance monitoring, timing, and metrics collection.
 * Compatible with browser Performance API and console timing.
 */

const METRICS_ENABLED = true;
const DEBUG_TIMING = false; // Set to true for verbose console output

// Internal metrics storage
const _metrics: {
    gridRenderCount: number;
    gridRenderTotalMs: number;
    searchQueryCount: number;
    searchQueryTotalMs: number;
    apiCallCount: number;
    apiCallTotalMs: number;
    apiErrorCount: number;
    thumbnailLoadCount: number;
    thumbnailLoadFailures: number;
    errorCounts: Record<string, number>;
} = {
    gridRenderCount: 0,
    gridRenderTotalMs: 0,
    searchQueryCount: 0,
    searchQueryTotalMs: 0,
    apiCallCount: 0,
    apiCallTotalMs: 0,
    apiErrorCount: 0,
    thumbnailLoadCount: 0,
    thumbnailLoadFailures: 0,
    errorCounts: {},
};

// Active timers
const _timers = new Map<string, number>();

/**
 * Start a performance timer.
 * @param {string} name - Timer name
 * @returns {void}
 */
export function startTimer(name: string): void {
    if (!METRICS_ENABLED) return;
    const startTime = performance.now();
    _timers.set(name, startTime);
    try {
        performance.mark(`${name}-start`);
    } catch {
        /* ignore */
    }
    if (DEBUG_TIMING) console.log(`[Majoor Metrics] Started: ${name}`);
}

/**
 * End a performance timer and record the duration.
 * @param {string} name - Timer name
 * @param {string} [category] - Optional category for metrics
 * @returns {number} Duration in milliseconds
 */
export function endTimer(name: string, category?: string): number | null {
    if (!METRICS_ENABLED) return 0;
    const startTime = _timers.get(name);
    if (!startTime) {
        console.warn(`[Majoor Metrics] Timer not found: ${name}`);
        return 0;
    }

    const duration = performance.now() - startTime;
    _timers.delete(name);

    // Update metrics
    if (category) {
        const countKey = `${category}Count`;
        const totalKey = `${category}TotalMs`;
        const m = _metrics as Record<string, any>;
        if (typeof m[countKey] === "number") {
            m[countKey]++;
            m[totalKey] += duration;
        }
    }

    // Log slow operations
    if (DEBUG_TIMING || duration > 100) {
        console.log(`[Majoor Metrics] ${name}: ${duration.toFixed(2)}ms`);
    }

    // Performance mark for browser dev tools
    try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
    } catch {
        /* ignore if marks don't exist */
    }

    return duration;
}

/**
 * Check whether a timer is currently active.
 * @param {string} name - Timer name
 * @returns {boolean}
 */
export function hasTimer(name: string): boolean {
    if (!METRICS_ENABLED) return false;
    return _timers.has(name);
}

/**
 * Mark a point in time for later measurement.
 * @param {string} name - Mark name
 * @returns {void}
 */
export function mark(name: string): void {
    if (!METRICS_ENABLED) return;
    try {
        performance.mark(`${name}-start`);
    } catch {
        /* ignore */
    }
    if (DEBUG_TIMING) console.log(`[Majoor Metrics] Mark: ${name}`);
}

/**
 * Measure between two marks.
 * @param {string} name - Measure name
 * @returns {number|null} Duration in milliseconds or null
 */
export function measure(name: string): number | null {
    if (!METRICS_ENABLED) return null;
    try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        const entries = performance.getEntriesByName(name);
        const duration = entries[0]?.duration || 0;
        if (DEBUG_TIMING || duration > 100) {
            console.log(`[Majoor Metrics] Measure ${name}: ${duration.toFixed(2)}ms`);
        }
        return duration;
    } catch {
        return null;
    }
}

/**
 * Track an API call duration.
 * @param {number} durationMs - Duration in milliseconds
 * @param {boolean} isError - Whether the call failed
 * @returns {void}
 */
export function trackApiCall(durationMs: number, isError = false): void {
    if (!METRICS_ENABLED) return;
    _metrics.apiCallCount++;
    _metrics.apiCallTotalMs += durationMs;
    if (isError) {
        _metrics.apiErrorCount++;
    }
}

/**
 * Track a grid render operation.
 * @param {number} durationMs - Duration in milliseconds
 * @returns {void}
 */
export function trackGridRender(durationMs: number): void {
    if (!METRICS_ENABLED) return;
    _metrics.gridRenderCount++;
    _metrics.gridRenderTotalMs += durationMs;
}

/**
 * Track a search query.
 * @param {number} durationMs - Duration in milliseconds
 * @returns {void}
 */
export function trackSearchQuery(durationMs: number): void {
    if (!METRICS_ENABLED) return;
    _metrics.searchQueryCount++;
    _metrics.searchQueryTotalMs += durationMs;
}

/**
 * Track a thumbnail load.
 * @param {boolean} success - Whether the load succeeded
 * @returns {void}
 */
export function trackThumbnailLoad(success: boolean): void {
    if (!METRICS_ENABLED) return;
    _metrics.thumbnailLoadCount++;
    if (!success) {
        _metrics.thumbnailLoadFailures++;
    }
}

/**
 * Track an error by category.
 * @param {string} category - Error category
 * @param {Error|string} error - Error object or message
 * @returns {void}
 */
export function trackError(category: string, error?: any): void {
    if (!METRICS_ENABLED) return;
    _metrics.errorCounts[category] = (_metrics.errorCounts[category] || 0) + 1;
    if (DEBUG_TIMING) {
        console.warn(`[Majoor Metrics] Error in ${category}:`, error);
    }
}

/**
 * Get current metrics report.
 * @returns {object} Metrics report object
 */
export function getMetricsReport() {
    return {
        ..._metrics,
        averages: {
            gridRenderMs:
                _metrics.gridRenderCount > 0
                    ? _metrics.gridRenderTotalMs / _metrics.gridRenderCount
                    : 0,
            searchQueryMs:
                _metrics.searchQueryCount > 0
                    ? _metrics.searchQueryTotalMs / _metrics.searchQueryCount
                    : 0,
            apiCallMs:
                _metrics.apiCallCount > 0 ? _metrics.apiCallTotalMs / _metrics.apiCallCount : 0,
        },
        rates: {
            apiErrorRate:
                _metrics.apiCallCount > 0
                    ? ((_metrics.apiErrorCount / _metrics.apiCallCount) * 100).toFixed(2) + "%"
                    : "0%",
            thumbnailFailureRate:
                _metrics.thumbnailLoadCount > 0
                    ? (
                          (_metrics.thumbnailLoadFailures / _metrics.thumbnailLoadCount) *
                          100
                      ).toFixed(2) + "%"
                    : "0%",
        },
    };
}

/**
 * Get average duration for a category.
 * @param {string} category - Category name
 * @returns {number} Average duration in milliseconds
 */
export function getAverageDuration(category: string): number {
    const countKey = `${category}Count`;
    const totalKey = `${category}TotalMs`;
    const m = _metrics as Record<string, any>;
    const count = m[countKey];
    const total = m[totalKey];
    return count > 0 ? total / count : 0;
}

/**
 * Reset all metrics.
 * @returns {void}
 */
export function resetMetrics() {
    const m = _metrics as Record<string, any>;
    Object.keys(m).forEach((key) => {
        if (typeof m[key] === "number") {
            m[key] = 0;
        } else if (typeof m[key] === "object") {
            m[key] = {};
        }
    });
    _timers.clear();
    console.log("[Majoor Metrics] Metrics reset");
}

/**
 * Export metrics to console for debugging.
 * @returns {void}
 */
export function exportMetrics() {
    const report = getMetricsReport();
    console.group("[Majoor Assets Manager] Performance Metrics");
    console.table({
        "Grid Renders": report.gridRenderCount,
        "Avg Grid Render": `${report.averages.gridRenderMs.toFixed(2)}ms`,
        "Search Queries": report.searchQueryCount,
        "Avg Search": `${report.averages.searchQueryMs.toFixed(2)}ms`,
        "API Calls": report.apiCallCount,
        "Avg API Call": `${report.averages.apiCallMs.toFixed(2)}ms`,
        "API Errors": report.apiErrorCount,
        "API Error Rate": report.rates.apiErrorRate,
        "Thumbnail Loads": report.thumbnailLoadCount,
        "Thumbnail Failures": report.thumbnailLoadFailures,
        "Failure Rate": report.rates.thumbnailFailureRate,
    });
    if (Object.keys(_metrics.errorCounts).length > 0) {
        console.log("Error Counts:", _metrics.errorCounts);
    }
    console.groupEnd();
}

// Auto-export to window for debugging
if (typeof window !== "undefined") {
    window.MajoorMetrics = {
        startTimer,
        endTimer,
        hasTimer,
        mark,
        measure,
        trackApiCall,
        trackGridRender,
        trackSearchQuery,
        trackThumbnailLoad,
        trackError,
        getMetricsReport,
        getAverageDuration,
        resetMetrics,
        exportMetrics,
    };
}
