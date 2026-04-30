/**
 * Bootstrap - Auto-scan and initialization
 */

import { get, post } from "../api/client.js";
import { ENDPOINTS } from "../api/endpoints.js";
import { APP_CONFIG } from "./config.js";
import { mjrDbg } from "../utils/logging.js";

// Auto-scan state (once per session)
let startupScanDone = false;
let startupScanTimer = null;
let startupWarmupDone = false;
let startupWarmupPromise = null;

function isExecutionIdle() {
    try {
        const runtime = window?.__MJR_EXECUTION_RUNTIME__;
        return !String(runtime?.active_prompt_id || "").trim();
    } catch (error) {
        console.debug?.(error);
        return true;
    }
}

/**
 * Trigger background scan as soon as the ComfyUI frontend loads (if enabled).
 * This helps warming the DB before the Assets Manager panel is opened.
 */
export async function triggerStartupScan(options = {}) {
    if (!APP_CONFIG || typeof APP_CONFIG !== "object") return;
    if (!APP_CONFIG.AUTO_SCAN_ON_STARTUP) return;
    if (startupScanDone) return;
    const delayMs = Math.max(0, Number(options?.delayMs) || 0);
    const idleOnly = options?.idleOnly !== false;
    if (delayMs > 0) {
        if (startupScanTimer) clearTimeout(startupScanTimer);
        startupScanTimer = setTimeout(() => {
            startupScanTimer = null;
            void triggerStartupScan({ ...options, delayMs: 0 });
        }, delayMs);
        return;
    }
    if (idleOnly && !isExecutionIdle()) {
        if (startupScanTimer) clearTimeout(startupScanTimer);
        startupScanTimer = setTimeout(() => {
            startupScanTimer = null;
            void triggerStartupScan({ ...options, delayMs: 0 });
        }, 5000);
        return;
    }
    startupScanDone = true;

    try {
        mjrDbg("[Majoor] Starting startup scan of output directory...");

        const result = await post(ENDPOINTS.SCAN, {
            recursive: true,
            incremental: true,
            fast: true,
            background_metadata: true,
        });

        if (result.ok) {
            const stats = result.data;
            mjrDbg(
                `[Majoor] Startup scan complete — added: ${stats.added}, updated: ${stats.updated}, skipped: ${stats.skipped}`,
            );
        } else {
            console.warn("📂 Majoor [⚠️]: Startup scan failed:", result.error);
        }
    } catch (error) {
        console.error("📂 Majoor [❌]: Startup scan error:", error);
    }
}

async function warmDbAndStatus() {
    try {
        await Promise.allSettled([
            get(ENDPOINTS.HEALTH),
            get(`${ENDPOINTS.HEALTH_COUNTERS}?scope=output`),
            get(ENDPOINTS.HEALTH_DB),
        ]);
    } catch (error) {
        console.debug?.(error);
    }
}

/**
 * Run a single explicit startup warmup sequence:
 * 1. warm API/DB/status endpoints
 * 2. schedule a background incremental scan if enabled and runtime is idle
 *
 * The warmup is yielded to the next idle/RAF tick so it does NOT contend with
 * the early /list fetch on the single-threaded aiohttp backend during cold
 * start. Three GETs (health, counters, db) running in parallel ahead of /list
 * was adding 200-600ms of perceived latency before the first card paint.
 */
export async function runStartupWarmup(options = {}) {
    if (startupWarmupDone) return startupWarmupPromise || Promise.resolve();
    startupWarmupDone = true;
    startupWarmupPromise = (async () => {
        await _yieldUntilIdleOrFirstPaint();
        await warmDbAndStatus();
        await triggerStartupScan(options);
    })();
    return startupWarmupPromise;
}

function _yieldUntilIdleOrFirstPaint() {
    return new Promise((resolve) => {
        try {
            if (typeof window === "undefined") {
                resolve();
                return;
            }
            // Prefer requestIdleCallback so we yield until the browser is idle
            // (after the first /list response has been parsed and the panel
            // has had a chance to render its first cards). Fall back to a
            // double-rAF + small timeout for environments without rIC.
            const ric = window.requestIdleCallback;
            if (typeof ric === "function") {
                ric(() => resolve(), { timeout: 1500 });
                return;
            }
            const raf = window.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
            raf(() => raf(() => setTimeout(resolve, 250)));
        } catch {
            resolve();
        }
    });
}

/**
 * Test API connection
 */
export async function testAPI() {
    try {
        mjrDbg("[Majoor] Testing API connection...");
        const data = await get(ENDPOINTS.HEALTH);

        if (data?.ok) {
            mjrDbg("[Majoor] API connection successful, health:", data.data.overall);
        } else {
            console.error("📂 Majoor [❌]: API health check failed:", data?.error);
        }
    } catch (error) {
        console.error("📂 Majoor [❌]: Failed to connect to API:", error);
    }
}
