/**
 * Runtime status dashboard widget for Majoor.
 * Renders a floating overlay inside the Assets Manager panel showing live
 * DB / enrichment-queue / watcher metrics fetched from the backend.
 */

import { getRuntimeStatus } from "../../api/client.js";
import { t } from "../i18n.js";

const RUNTIME_DASHBOARD_ID = "mjr-runtime-status-dashboard";

// ─── DOM helpers ──────────────────────────────────────────────────────────

function ensureRuntimeStatusDashboard() {
    try {
        const host = document.querySelector(".mjr-assets-manager.mjr-am-container");
        const existing = document.getElementById(RUNTIME_DASHBOARD_ID);
        if (!host) {
            try {
                existing?.remove?.();
            } catch {}
            return null;
        }

        // Anchor to the Assets Manager container (not the scrollable grid),
        // so the widget stays fixed while the grid scrolls and disappears when panel closes.
        try {
            const hostPos = String(getComputedStyle(host).position || "").toLowerCase();
            if (!hostPos || hostPos === "static") {
                host.style.position = "relative";
            }
        } catch {}

        let el = document.getElementById(RUNTIME_DASHBOARD_ID);
        if (!el) {
            el = document.createElement("div");
            el.id = RUNTIME_DASHBOARD_ID;
            el.style.position = "absolute";
            el.style.bottom = "10px";
            el.style.right = "10px";
            el.style.zIndex = "9999";
            el.style.padding = "6px 10px";
            el.style.borderRadius = "10px";
            el.style.border = "1px solid rgba(255,255,255,0.16)";
            el.style.background = "rgba(0,0,0,0.45)";
            el.style.backdropFilter = "blur(4px)";
            el.style.color = "var(--content-fg, #fff)";
            el.style.fontSize = "11px";
            el.style.pointerEvents = "none";
            host.appendChild(el);
        } else if (el.parentElement !== host) {
            host.appendChild(el);
        }
        return el;
    } catch {
        return null;
    }
}

async function refreshRuntimeStatusDashboard() {
    const el = ensureRuntimeStatusDashboard();
    if (!el) return false;
    try {
        const res = await getRuntimeStatus();
        if (!res?.ok || !res?.data) {
            el.textContent = t("runtime.unavailable", "Runtime: unavailable");
            el.title = t("runtime.unavailable", "Runtime: unavailable");
            return true;
        }
        const db = res.data.db || {};
        const idx = res.data.index || {};
        const w = res.data.watcher || {};
        const active = Number(db.active_connections || 0);
        const enrichQ = Number(idx.enrichment_queue_length || 0);
        const pending = Number(w.pending_files || 0);
        el.textContent = t("runtime.metricsLine", "DB active: {active} | Enrich Q: {enrichQ} | Watcher pending: {pending}", { active, enrichQ, pending });
        el.title = t(
            "runtime.metricsTitle",
            "Runtime Metrics\nDB active connections: {active}\nEnrichment queue: {enrichQ}\nWatcher pending files: {pending}",
            { active, enrichQ, pending }
        );
        return true;
    } catch {
        el.textContent = t("runtime.unavailable", "Runtime: unavailable");
        el.title = t("runtime.unavailable", "Runtime: unavailable");
        return true;
    }
}

export function startRuntimeStatusDashboard() {
    try {
        refreshRuntimeStatusDashboard().catch(() => {});
        if (window.__MJR_RUNTIME_STATUS_INFLIGHT__ == null) {
            window.__MJR_RUNTIME_STATUS_INFLIGHT__ = false;
        }
        if (window.__MJR_RUNTIME_STATUS_MISS_COUNT__ == null) {
            window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = 0;
        }
        if (!window.__MJR_RUNTIME_STATUS_INTERVAL__) {
            window.__MJR_RUNTIME_STATUS_INTERVAL__ = setInterval(() => {
                if (window.__MJR_RUNTIME_STATUS_INFLIGHT__) return;
                window.__MJR_RUNTIME_STATUS_INFLIGHT__ = true;
                refreshRuntimeStatusDashboard()
                    .then((visible) => {
                        if (visible) {
                            window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = 0;
                            return;
                        }
                        window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = Number(window.__MJR_RUNTIME_STATUS_MISS_COUNT__ || 0) + 1;
                        // Stop background polling if panel is absent for ~30s.
                        if (window.__MJR_RUNTIME_STATUS_MISS_COUNT__ >= 10 && window.__MJR_RUNTIME_STATUS_INTERVAL__) {
                            clearInterval(window.__MJR_RUNTIME_STATUS_INTERVAL__);
                            window.__MJR_RUNTIME_STATUS_INTERVAL__ = null;
                        }
                    })
                    .catch(() => {})
                    .finally(() => {
                        window.__MJR_RUNTIME_STATUS_INFLIGHT__ = false;
                    });
            }, 3000);
        }
    } catch {}
}
