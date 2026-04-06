/**
 * Status Dot Feature - Health indicator
 */

import {
    get,
    getToolsStatus,
    post,
    resetIndex,
    getWatcherStatus,
    forceDeleteDb,
    listDbBackups,
    saveDbBackup,
    restoreDbBackup,
    vectorBackfill,
} from "../../api/client.js";
import { ENDPOINTS } from "../../api/endpoints.js";
import { APP_CONFIG } from "../../app/config.js";
import { comfyConfirm } from "../../app/dialogs.js";
import { comfyToast, recordToastHistory } from "../../app/toast.js";
import { t } from "../../app/i18n.js";
import { getEnrichmentState, setEnrichmentState } from "../../app/runtimeState.js";
import { loadMajoorSettings } from "../../app/settings.js";
import { EVENTS } from "../../app/events.js";

const TOOL_CAPABILITIES = [
    {
        key: "exiftool",
        labelKey: "tool.exiftool",
        hintKey: "tool.exiftool.hint",
    },
    {
        key: "ffprobe",
        labelKey: "tool.ffprobe",
        hintKey: "tool.ffprobe.hint",
    },
];

let _maintenanceActive = false;
let _dbRestoreStatusHandler = null;
let _runtimeStatusHandler = null;
const STATUS_CACHE_KEY = "__MJR_STATUS_DOT_CACHE__";
const STATUS_POLL_STATE = {
    ACTIVE: "active",
    COOLDOWN: "cooldown",
    IDLE: "idle",
};
const STATUS_POLL_INTERVALS_MS = {
    [STATUS_POLL_STATE.ACTIVE]: 2_000,
    [STATUS_POLL_STATE.COOLDOWN]: 10_000,
    [STATUS_POLL_STATE.IDLE]: 60_000,
};

function setMaintenanceActive(active) {
    _maintenanceActive = !!active;
    try {
        globalThis._mjrMaintenanceActive = _maintenanceActive;
    } catch (e) {
        console.debug?.(e);
    }
}

function formatBytes(bytes) {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = n;
    let idx = 0;
    while (value >= 1024 && idx < units.length - 1) {
        value /= 1024;
        idx += 1;
    }
    const precision = value >= 100 ? 0 : value >= 10 ? 1 : 2;
    return `${value.toFixed(precision)} ${units[idx]}`;
}

function setStatusLines(statusText, lines, footerText = null) {
    if (!statusText) return;
    statusText.replaceChildren();

    const normalizedLines = Array.isArray(lines)
        ? lines.filter((l) => l != null && String(l).trim() !== "")
        : [];
    normalizedLines.forEach((line, index) => {
        if (index > 0) statusText.appendChild(document.createElement("br"));
        statusText.appendChild(document.createTextNode(String(line)));
    });

    if (footerText != null && String(footerText).trim() !== "") {
        statusText.appendChild(document.createElement("br"));
        const span = document.createElement("span");
        span.style.fontSize = "11px";
        span.style.opacity = "0.6";
        span.textContent = String(footerText);
        statusText.appendChild(span);
    }
}

function setStatusWithHint(statusText, mainText, hintText) {
    if (!statusText) return;
    statusText.replaceChildren();
    statusText.appendChild(document.createTextNode(String(mainText || "")));
    statusText.appendChild(document.createElement("br"));
    const span = document.createElement("span");
    span.style.fontSize = "11px";
    span.style.opacity = "0.7";
    span.textContent = String(hintText || "");
    statusText.appendChild(span);
}

function applyStatusHighlight(section, tone = "neutral", options = {}) {
    if (!section) return;
    const notifyToast = options?.toast !== false;
    const map = {
        neutral: {
            bg: "var(--bg-color, #1a1a1a)",
            border: "var(--border-color, #333)",
            glow: "transparent",
        },
        info: {
            bg: "linear-gradient(135deg, rgba(33,150,243,0.14) 0%, rgba(100,181,246,0.08) 100%)",
            border: "rgba(33,150,243,0.55)",
            glow: "rgba(33,150,243,0.15)",
        },
        success: {
            bg: "linear-gradient(135deg, rgba(76,175,80,0.16) 0%, rgba(139,195,74,0.08) 100%)",
            border: "rgba(76,175,80,0.55)",
            glow: "rgba(76,175,80,0.16)",
        },
        warning: {
            bg: "linear-gradient(135deg, rgba(255,167,38,0.18) 0%, rgba(255,193,7,0.08) 100%)",
            border: "rgba(255,167,38,0.58)",
            glow: "rgba(255,167,38,0.18)",
        },
        error: {
            bg: "linear-gradient(135deg, rgba(244,67,54,0.18) 0%, rgba(239,83,80,0.08) 100%)",
            border: "rgba(244,67,54,0.62)",
            glow: "rgba(244,67,54,0.2)",
        },
        browser: {
            bg: "linear-gradient(135deg, rgba(0,150,136,0.18) 0%, rgba(38,166,154,0.08) 100%)",
            border: "rgba(0,150,136,0.58)",
            glow: "rgba(0,150,136,0.18)",
        },
    };
    const style = map[tone] || map.neutral;
    const prevTone = String(section.dataset?.mjrStatusTone || "neutral");
    section.style.background = style.bg;
    section.style.borderColor = style.border;
    section.style.boxShadow = `0 0 0 1px ${style.glow} inset`;
    section.dataset.mjrStatusTone = tone;

    // Toast only when status tone changes, throttled to avoid polling spam.
    if (notifyToast && tone !== prevTone) {
        const now = Date.now();
        const lastAt = Number(section._mjrStatusToastAt || 0) || 0;
        if (now - lastAt >= 4000) {
            section._mjrStatusToastAt = now;
            const messages = {
                info: t("status.toast.info", "Index status: checking"),
                success: t("status.toast.success", "Index status: ready"),
                warning: t("status.toast.warning", "Index status: attention needed"),
                error: t("status.toast.error", "Index status: error"),
                browser: t("status.toast.browser", "Index status: browser scope"),
            };
            const level =
                tone === "error"
                    ? "error"
                    : tone === "warning"
                      ? "warning"
                      : tone === "success"
                        ? "success"
                        : "info";
            try {
                comfyToast(messages[tone] || messages.info, level, 1800, { noHistory: true });
            } catch (e) {
                console.debug?.(e);
            }
        }
    }
}

function formatWatcherScopeLabel(scope) {
    const s = String(scope || "").toLowerCase();
    if (s === "all") return t("scope.allFull", "All (Inputs + Outputs)");
    if (s === "input" || s === "inputs") return t("scope.input", "Inputs");
    if (s === "custom") return t("scope.custom", "Browser");
    return t("scope.output", "Outputs");
}

function formatWatcherLine(watcher, desiredScope = "") {
    if (!watcher || typeof watcher !== "object") {
        if (desiredScope) {
            return t("status.watcher.disabledScoped", "Watcher: disabled ({scope})", {
                scope: formatWatcherScopeLabel(desiredScope),
            });
        }
        return t("status.watcher.disabled", "Watcher: disabled");
    }
    const enabled = !!watcher.enabled;
    const scope = watcher.scope ? String(watcher.scope) : "";
    if (!enabled) {
        if (scope || desiredScope) {
            const effective =
                desiredScope && scope && scope !== desiredScope
                    ? desiredScope
                    : scope || desiredScope;
            return t("status.watcher.disabledScoped", "Watcher: disabled ({scope})", {
                scope: formatWatcherScopeLabel(effective),
            });
        }
        return t("status.watcher.disabled", "Watcher: disabled");
    }
    if (scope) {
        return t("status.watcher.enabledScoped", `Watcher: enabled (${scope})`, {
            scope: formatWatcherScopeLabel(scope),
        });
    }
    return t("status.watcher.enabled", "Watcher: enabled");
}

function emitGlobalGridReload(reason = "status-action") {
    try {
        window?.dispatchEvent?.(
            new CustomEvent("mjr:reload-grid", {
                detail: { reason: String(reason || "status-action") },
            }),
        );
    } catch (e) {
        console.debug?.(e);
    }
}

async function askKeepVectors(actionLabel = "") {
    return await comfyConfirm(
        t(
            "dialog.vectorsReset.keepQuestion",
            "Keep existing AI vectors?\n\nConfirm = keep vectors\nCancel = continue without vectors",
        ),
        actionLabel || t("dialog.vectorsReset.title", "AI vectors"),
    );
}

/**
 * Create status indicator section
 */
export function createStatusIndicator(options = {}) {
    const getScanContext =
        typeof options?.getScanContext === "function" ? options.getScanContext : null;
    // Reset any stale local maintenance lock when panel is recreated.
    // Runtime state is re-detected from backend diagnostics during polling.
    setMaintenanceActive(false);
    const section = document.createElement("div");
    section.style.cssText =
        "margin-bottom: 20px; padding: 12px; background: var(--bg-color, #1a1a1a); border-radius: 6px; border: 1px solid var(--border-color, #333); cursor: pointer; transition: all 0.2s;";
    applyStatusHighlight(section, "info", { toast: false });

    // Header container
    const header = document.createElement("div");
    header.style.cssText = "display: flex; align-items: center; gap: 10px; margin-bottom: 8px;";

    // Status dot
    const statusDot = document.createElement("span");
    statusDot.id = "mjr-status-dot";
    statusDot.style.cssText =
        "width: 12px; height: 12px; border-radius: 50%; background: var(--mjr-status-info, #64B5F6); display: inline-block; cursor: pointer;";

    // Title container
    const titleSpan = document.createElement("span");
    titleSpan.id = "mjr-status-title";
    titleSpan.style.cssText = "font-weight: 500; font-size: 13px; cursor: pointer;";

    const indicator = document.createElement("span");
    indicator.id = "mjr-status-title-indicator";
    indicator.style.marginRight = "6px";
    indicator.textContent = "▾";

    titleSpan.appendChild(indicator);
    titleSpan.appendChild(document.createTextNode(t("status.indexStatus", "Index Status")));

    header.appendChild(statusDot);
    header.appendChild(titleSpan);

    // Body container
    const body = document.createElement("div");
    body.id = "mjr-status-body";
    body.style.marginLeft = "22px";

    // Status text
    const statusText = document.createElement("div");
    statusText.id = "mjr-status-text";
    statusText.style.cssText = "font-size: 12px; opacity: 0.8;";
    statusText.textContent = t("status.checking");

    // Capabilities section
    const capabilities = document.createElement("div");
    capabilities.id = "mjr-status-capabilities";
    capabilities.style.cssText =
        "font-size: 11px; opacity: 0.75; margin-top: 10px; display: flex; gap: 6px; flex-wrap: wrap;";
    capabilities.textContent = t("status.discoveringTools");

    body.appendChild(statusText);
    body.appendChild(capabilities);

    const toolsStatus = document.createElement("div");
    toolsStatus.id = "mjr-tools-status";
    toolsStatus.style.cssText = "font-size: 11px; opacity: 0.7; margin-top: 10px;";
    toolsStatus.textContent = t("status.toolStatusChecking", "Tool status: checking...");
    body.appendChild(toolsStatus);

    const backupRow = document.createElement("div");
    backupRow.style.cssText =
        "margin-top: 10px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;";

    const backupSelect = document.createElement("select");
    backupSelect.style.cssText = `
        min-width: 240px;
        padding: 4px 8px;
        font-size: 11px;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.2);
        background: rgba(255,255,255,0.04);
        color: inherit;
    `;
    backupSelect.title = t("status.dbBackupSelectHint", "Select a DB backup to restore");
    let _hasBackupChoices = false;
    let restoreDbBtn = null;
    const setSingleOption = (text) => {
        backupSelect.replaceChildren();
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = String(text || "");
        opt.disabled = true;
        opt.selected = true;
        backupSelect.appendChild(opt);
        _hasBackupChoices = false;
        backupSelect.disabled = true;
        if (restoreDbBtn) restoreDbBtn.disabled = true;
    };
    setSingleOption(t("status.dbBackupLoading", "Loading DB backups..."));

    const refreshBackups = async (preferredName = "") => {
        try {
            const res = await listDbBackups();
            if (!res?.ok) {
                setSingleOption(t("status.dbBackupNone", "No DB backup found"));
                return;
            }
            const items = Array.isArray(res?.data?.items) ? res.data.items : [];
            if (!items.length) {
                setSingleOption(t("status.dbBackupNone", "No DB backup found"));
                return;
            }
            backupSelect.replaceChildren();
            let matched = false;
            for (const item of items) {
                const name = String(item?.name || "");
                if (!name) continue;
                const mtime = Number(item?.mtime || 0);
                const size = Number(item?.size_bytes || 0);
                const stamp = mtime > 0 ? new Date(mtime * 1000).toLocaleString() : "";
                const label = `${name}${stamp ? ` (${stamp}` : ""}${size > 0 ? `, ${formatBytes(size)}` : ""}${stamp ? ")" : ""}`;
                const opt = document.createElement("option");
                opt.value = name;
                opt.textContent = label;
                if (preferredName && preferredName === name) {
                    opt.selected = true;
                    matched = true;
                }
                backupSelect.appendChild(opt);
            }
            _hasBackupChoices = backupSelect.childNodes.length > 0;
            backupSelect.disabled = !_hasBackupChoices;
            if (_hasBackupChoices && !matched && backupSelect.childNodes[0]) {
                backupSelect.value = String(backupSelect.childNodes[0].value || "");
            }
            if (restoreDbBtn) restoreDbBtn.disabled = !_hasBackupChoices;
        } catch {
            setSingleOption(t("status.dbBackupNone", "No DB backup found"));
        }
    };
    void refreshBackups();
    backupRow.appendChild(backupSelect);

    const saveDbBtn = document.createElement("button");
    saveDbBtn.type = "button";
    saveDbBtn.textContent = t("btn.dbSave", "Save DB");
    saveDbBtn.title = t("status.dbSaveHint", "Save a DB snapshot into archive folder");
    saveDbBtn.style.cssText = `
        padding: 5px 10px;
        font-size: 11px;
        border-radius: 6px;
        border: 1px solid rgba(120,200,255,0.35);
        background: transparent;
        color: inherit;
        cursor: pointer;
    `;
    saveDbBtn.onclick = async (event) => {
        event.stopPropagation();
        setMaintenanceActive(true);
        const original = saveDbBtn.textContent;
        const originalRestoreDisabled = !!restoreDbBtn?.disabled;
        saveDbBtn.disabled = true;
        if (restoreDbBtn) restoreDbBtn.disabled = true;
        saveDbBtn.textContent = t("btn.saving", "Saving...");
        statusDot.style.background = "var(--mjr-status-info, #64B5F6)";
        applyStatusHighlight(section, "info");
        try {
            const res = await saveDbBackup();
            if (res?.ok) {
                const savedName = String(res?.data?.name || "").trim();
                const sizeBytes = Number(res?.data?.size_bytes || 0);
                comfyToast(t("toast.dbSaveSuccess", "Database backup saved"), "success", 2200, {
                    history: {
                        title: t("btn.dbSave", "Save DB"),
                        detail: savedName
                            ? `${savedName}${sizeBytes > 0 ? ` | ${formatBytes(sizeBytes)}` : ""}`
                            : t("toast.dbSaveSuccess", "Database backup saved"),
                        operation: "save_db",
                        source: savedName || "archive",
                        forceStore: true,
                    },
                });
                await refreshBackups(savedName);
            } else {
                comfyToast(
                    res?.error || t("toast.dbSaveFailed", "Failed to save DB backup"),
                    "error",
                );
            }
        } catch (error) {
            comfyToast(
                error?.message || t("toast.dbSaveFailed", "Failed to save DB backup"),
                "error",
            );
        } finally {
            setMaintenanceActive(false);
            saveDbBtn.disabled = false;
            if (restoreDbBtn) restoreDbBtn.disabled = originalRestoreDisabled || !_hasBackupChoices;
            saveDbBtn.textContent = original;
            try {
                const target = getScanContext ? getScanContext() : null;
                await updateStatus(statusDot, statusText, capabilities, target, null, {
                    force: true,
                });
            } catch (e) {
                console.debug?.(e);
            }
        }
    };
    backupRow.appendChild(saveDbBtn);

    restoreDbBtn = document.createElement("button");
    restoreDbBtn.type = "button";
    restoreDbBtn.textContent = t("btn.dbRestore", "Restore");
    restoreDbBtn.title = t("status.dbRestoreHint", "Restore selected DB backup");
    restoreDbBtn.style.cssText = `
        padding: 5px 10px;
        font-size: 11px;
        border-radius: 6px;
        border: 1px solid rgba(255,180,80,0.35);
        background: transparent;
        color: inherit;
        cursor: pointer;
    `;
    restoreDbBtn.onclick = async (event) => {
        event.stopPropagation();
        const selected = String(backupSelect.value || "");
        if (!selected) {
            comfyToast(t("toast.dbRestoreSelect", "Select a DB backup first"), "warning", 2000);
            return;
        }
        const confirmed = await comfyConfirm(
            `${t(
                "dialog.dbRestore.confirm",
                "Restore selected DB backup? Current DB will be replaced.",
            )}\n\n${selected}`,
            t("btn.dbRestore", "Restore DB"),
        );
        if (!confirmed) return;
        comfyToast(t("toast.dbRestoreStarted", "DB restore started"), "info", 1800, {
            history: {
                trackId: "maintenance:restore_db",
                title: t("btn.dbRestore", "Restore DB"),
                detail: selected,
                operation: "restore_db",
                source: selected,
                status: "started",
                forceStore: true,
            },
        });
        setMaintenanceActive(true);
        const original = restoreDbBtn.textContent;
        const originalSaveDisabled = !!saveDbBtn.disabled;
        restoreDbBtn.disabled = true;
        saveDbBtn.disabled = true;
        backupSelect.disabled = true;
        restoreDbBtn.textContent = t("btn.restoring", "Restoring...");
        statusDot.style.background = "var(--mjr-status-warning, #FFA726)";
        applyStatusHighlight(section, "warning");
        try {
            const res = await restoreDbBackup({ name: selected, useLatest: false });
            if (res?.ok) {
                await refreshBackups(String(res?.data?.name || selected || ""));
            } else {
                comfyToast(
                    res?.error || t("toast.dbRestoreFailed", "Failed to restore DB backup"),
                    "error",
                );
            }
        } catch (error) {
            comfyToast(
                error?.message || t("toast.dbRestoreFailed", "Failed to restore DB backup"),
                "error",
            );
        } finally {
            setMaintenanceActive(false);
            restoreDbBtn.disabled = !_hasBackupChoices;
            saveDbBtn.disabled = originalSaveDisabled;
            backupSelect.disabled = !_hasBackupChoices;
            restoreDbBtn.textContent = original;
            emitGlobalGridReload("db-restore");
            try {
                const target = getScanContext ? getScanContext() : null;
                await updateStatus(statusDot, statusText, capabilities, target, null, {
                    force: true,
                });
            } catch (e) {
                console.debug?.(e);
            }
        }
    };
    backupRow.appendChild(restoreDbBtn);

    body.appendChild(backupRow);

    const actionsRow = document.createElement("div");
    actionsRow.style.cssText =
        "margin-top: 10px; display: flex; justify-content: flex-end; gap: 8px;";

    const actionLog = document.createElement("div");
    actionLog.style.cssText =
        "margin-top: 8px; font-size: 11px; opacity: 0.9; line-height: 1.35; white-space: pre-wrap;";
    actionLog.textContent = "";

    const setActionLog = (message, tone = "neutral") => {
        const text = String(message || "").trim();
        actionLog.textContent = text;
        if (!text) {
            actionLog.style.color = "inherit";
            actionLog.style.opacity = "0.9";
            return;
        }
        if (tone === "error") {
            actionLog.style.color = "var(--error-text-color, #ff8a80)";
            actionLog.style.opacity = "1";
            return;
        }
        if (tone === "success") {
            actionLog.style.color = "var(--success-text-color, #a5d6a7)";
            actionLog.style.opacity = "1";
            return;
        }
        if (tone === "info") {
            actionLog.style.color = "var(--input-text, #cfd8dc)";
            actionLog.style.opacity = "0.95";
            return;
        }
        actionLog.style.color = "inherit";
        actionLog.style.opacity = "0.9";
    };

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.textContent = t("btn.resetIndex");
    resetBtn.title = t(
        "status.resetIndexHint",
        "Reset index cache (requires allowResetIndex in settings).",
    );
    resetBtn.style.cssText = `
        padding: 5px 12px;
        font-size: 11px;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.25);
        background: transparent;
        color: inherit;
        cursor: pointer;
        transition: border 0.2s, background 0.2s;
    `;
    resetBtn.onmouseenter = () => {
        resetBtn.style.borderColor = "rgba(255,255,255,0.6)";
        resetBtn.style.background = "rgba(255,255,255,0.08)";
    };
    resetBtn.onmouseleave = () => {
        resetBtn.style.borderColor = "rgba(255,255,255,0.25)";
        resetBtn.style.background = "transparent";
    };
    resetBtn.onclick = async (event) => {
        event.stopPropagation();
        const preserveVectors = await askKeepVectors(t("btn.resetIndex", "Reset index"));
        const confirmed = await comfyConfirm(
            preserveVectors
                ? t(
                      "dialog.resetIndex.confirmKeepVectors",
                      "This will reset index data and rescan files while keeping existing AI vectors.\n\nContinue?",
                  )
                : t(
                      "dialog.resetIndex.msg",
                      "This will delete the database and rescan all files. Continue?",
                  ),
            t("dialog.resetIndex.title", "Reset index?"),
        );
        if (!confirmed) return;
        setMaintenanceActive(true);

        const originalText = resetBtn.textContent;
        resetBtn.disabled = true;
        resetBtn.textContent = t("btn.resetting");

        // Status indicator feedback
        statusDot.style.background = "var(--mjr-status-info, #64B5F6)";
        applyStatusHighlight(section, "info");

        try {
            const ctx = getScanContext ? getScanContext() : {};
            const scope = String(ctx?.scope || "output").toLowerCase();
            const customRootId = ctx?.customRootId || ctx?.custom_root_id || ctx?.root_id || null;
            const isCustomBrowserMode = scope === "custom" && !customRootId;
            const isAll = scope === "all";
            const effectiveScope = isCustomBrowserMode ? "all" : scope;

            const res = await resetIndex({
                scope: effectiveScope,
                customRootId: isCustomBrowserMode ? null : customRootId,
                reindex: true,
                maintenance_force: true,
                hard_reset_db: isAll && !preserveVectors,
                clear_scan_journal: true,
                clear_metadata_cache: true,
                clear_asset_metadata: true,
                clear_assets: !preserveVectors,
                preserve_vectors: preserveVectors,
                rebuild_fts: true,
            });
            if (res?.ok) {
                statusDot.style.background = "var(--mjr-status-success, #4CAF50)";
                applyStatusHighlight(section, "success");
            } else {
                statusDot.style.background = "var(--mjr-status-error, #f44336)";
                applyStatusHighlight(section, "error");
            }
        } catch {
            statusDot.style.background = "var(--mjr-status-error, #f44336)";
            applyStatusHighlight(section, "error");
        } finally {
            setMaintenanceActive(false);
            resetBtn.disabled = false;
            resetBtn.textContent = originalText;
            emitGlobalGridReload("index-reset");
            try {
                const target = getScanContext ? getScanContext() : null;
                await updateStatus(statusDot, statusText, capabilities, target, null, {
                    force: true,
                });
            } catch (e) {
                console.debug?.(e);
            }
        }
    };

    const backfillBtn = document.createElement("button");
    backfillBtn.type = "button";
    backfillBtn.textContent = "Backfill vectors";
    backfillBtn.title = "Compute missing AI vector embeddings for existing assets.";
    backfillBtn.style.cssText = `
        padding: 5px 12px;
        font-size: 11px;
        border-radius: 6px;
        border: 1px solid rgba(0, 188, 212, 0.45);
        background: transparent;
        color: inherit;
        cursor: pointer;
        transition: border 0.2s, background 0.2s;
    `;
    backfillBtn.onmouseenter = () => {
        backfillBtn.style.borderColor = "rgba(0, 188, 212, 0.8)";
        backfillBtn.style.background = "rgba(0, 188, 212, 0.12)";
    };
    backfillBtn.onmouseleave = () => {
        backfillBtn.style.borderColor = "rgba(0, 188, 212, 0.45)";
        backfillBtn.style.background = "transparent";
    };
    backfillBtn.onclick = async (event) => {
        event.stopPropagation();
        const ctx = getScanContext ? getScanContext() : {};
        const desiredScope = String(ctx?.scope || "output").toLowerCase();
        const desiredCustomRootId = String(
            ctx?.customRootId || ctx?.custom_root_id || ctx?.root_id || "",
        ).trim();
        const isCustomBrowserMode = desiredScope === "custom" && !desiredCustomRootId;
        if (isCustomBrowserMode) {
            comfyToast(
                t(
                    "status.customBrowserScanDisabledHint",
                    "Use Outputs, Inputs, or All to run indexing scans",
                ),
                "warning",
                2600,
            );
            setActionLog(
                "Backfill skipped - Browser scope has no selected custom root.",
                "warning",
            );
            return;
        }
        const backfillScope = desiredScope || "output";
        const backfillScopeLabel = formatWatcherScopeLabel(backfillScope);
        const historyBase = {
            history: {
                trackId: `vector-backfill:status:${backfillScope}:${desiredCustomRootId || "default"}`,
                title: "Vector Backfill",
                source: backfillScopeLabel,
                operation: "vector_backfill",
                forceStore: true,
            },
        };
        setMaintenanceActive(true);

        const originalBackfillText = backfillBtn.textContent;
        const originalResetText = resetBtn.textContent;
        backfillBtn.disabled = true;
        resetBtn.disabled = true;
        backfillBtn.textContent = "Backfilling...";
        setActionLog(`Backfill started (${backfillScopeLabel})...`, "info");
        recordToastHistory(
            { summary: "Vector Backfill", detail: `Started (${backfillScopeLabel})` },
            "info",
            0,
            { history: { ...historyBase.history, status: "started", detail: `Started (${backfillScopeLabel})` } },
        );

        statusDot.style.background = "var(--mjr-status-info, #64B5F6)";
        applyStatusHighlight(section, "info");
        try {
            const backfillOptions = {
                scope: backfillScope,
                onProgress: (payload) => {
                    const status = String(payload?.status || "").toLowerCase();
                    const progress = payload?.progress || payload?.result || {};
                    const candidates = Number(progress?.candidates || progress?.processed || 0);
                    const candidateTotal = Number(progress?.candidate_total || candidates || 0);
                    const totalAssets = Number(progress?.eligible_total || progress?.total_assets || 0);
                    const indexed = Number(progress?.indexed || 0);
                    const skipped = Number(progress?.skipped || 0);
                    const errors = Number(progress?.errors || 0);
                    if (status === "queued") {
                        setActionLog("Backfill queued…", "info");
                        recordToastHistory(
                            { summary: "Vector Backfill", detail: `Queued (${backfillScopeLabel})` },
                            "info",
                            0,
                            {
                                history: {
                                    ...historyBase.history,
                                    status: "queued",
                                    detail: `Queued (${backfillScopeLabel})`,
                                    progress: { current: 0, total: 1, percent: 0, label: "queued" },
                                },
                            },
                        );
                        return;
                    }
                    if (
                        status === "running" ||
                        candidates > 0 ||
                        candidateTotal > 0 ||
                        totalAssets > 0 ||
                        indexed > 0 ||
                        skipped > 0 ||
                        errors > 0
                    ) {
                        const detailText =
                            totalAssets > 0
                                ? `Indexed ${indexed}/${totalAssets} assets, candidates ${candidateTotal}, skipped ${skipped}, errors ${errors}`
                                : `Candidates ${candidates}, indexed ${indexed}, skipped ${skipped}, errors ${errors}`;
                        setActionLog(
                            totalAssets > 0
                                ? `Backfill running — indexed ${indexed}/${totalAssets} assets, candidates ${candidateTotal}, skipped ${skipped}, errors ${errors}`
                                : `Backfill running — candidates ${candidates}, indexed ${indexed}, skipped ${skipped}, errors ${errors}`,
                            "info",
                        );
                        recordToastHistory(
                            { summary: "Vector Backfill", detail: detailText },
                            "info",
                            0,
                            {
                                history: {
                                    ...historyBase.history,
                                    status: "running",
                                    detail: detailText,
                                    progress: {
                                        current: totalAssets > 0 ? indexed : indexed + skipped + errors,
                                        total:
                                            totalAssets > 0
                                                ? totalAssets
                                                : Math.max(candidates, indexed + skipped + errors),
                                        percent:
                                            totalAssets > 0
                                                ? Math.round((indexed / totalAssets) * 100)
                                                : Math.max(candidates, indexed + skipped + errors) > 0
                                                  ? Math.round(
                                                        ((indexed + skipped + errors) /
                                                            Math.max(candidates, indexed + skipped + errors)) * 100,
                                                    )
                                                  : null,
                                        eligible_total: totalAssets > 0 ? totalAssets : undefined,
                                        candidate_total: candidateTotal > 0 ? candidateTotal : undefined,
                                        indexed,
                                        skipped,
                                        errors,
                                        label: "running",
                                    },
                                },
                            },
                        );
                    }
                },
            };
            if (backfillScope === "custom" && desiredCustomRootId) {
                backfillOptions.customRootId = desiredCustomRootId;
            }
            const res = await vectorBackfill(64, backfillOptions);
            if (res?.ok) {
                const state = String(res?.data?.status || "").toLowerCase();
                const pending =
                    !!res?.data?.pending || ["queued", "running", "pending"].includes(state);
                const progress = res?.data?.progress || {};
                const processed = Number(res?.data?.processed ?? progress?.candidates ?? 0);
                const indexed = Number(res?.data?.indexed ?? progress?.indexed ?? 0);
                const skipped = Number(res?.data?.skipped ?? progress?.skipped ?? 0);
                const errors = Number(res?.data?.errors ?? progress?.errors ?? 0);
                if (pending) {
                    const backfillId = String(res?.data?.backfill_id || "").trim();
                    const msg = t(
                        "toast.vectorBackfillRunning",
                        "Vector backfill still running in background{job}.",
                        { job: backfillId ? ` (${backfillId.slice(0, 8)})` : "" },
                    );
                    comfyToast(msg, "info", 4200, {
                        history: {
                            ...historyBase.history,
                            status: "running",
                            detail: `Running in background${backfillId ? ` (${backfillId.slice(0, 8)})` : ""}.`,
                            progress: {
                                current: indexed + skipped + errors,
                                total: Math.max(processed, indexed + skipped + errors),
                                percent:
                                    Math.max(processed, indexed + skipped + errors) > 0
                                        ? Math.round(
                                              ((indexed + skipped + errors) /
                                                  Math.max(processed, indexed + skipped + errors)) * 100,
                                          )
                                        : null,
                                indexed,
                                skipped,
                                errors,
                                label: "running",
                            },
                        },
                    });
                    setActionLog(
                        `Backfill running in background — candidates ${processed}, indexed ${indexed}, skipped ${skipped}, errors ${errors}`,
                        "info",
                    );
                    statusDot.style.background = "var(--mjr-status-info, #64B5F6)";
                    applyStatusHighlight(section, "info");
                } else {
                    comfyToast(
                        t(
                            "toast.vectorBackfillComplete",
                            "Vector backfill complete! Processed: {processed}, Indexed: {indexed}, Skipped: {skipped}",
                            { processed, indexed, skipped },
                        ),
                        "success",
                        3000,
                        {
                            history: {
                                ...historyBase.history,
                                status: "succeeded",
                                detail: `Processed ${processed}, indexed ${indexed}, skipped ${skipped}`,
                                progress: {
                                    current: processed,
                                    total: processed,
                                    percent: processed > 0 ? 100 : null,
                                    indexed,
                                    skipped,
                                    errors,
                                    label: "done",
                                },
                            },
                        },
                    );
                    setActionLog(
                        `Backfill OK — processed ${processed}, indexed ${indexed}, skipped ${skipped}`,
                        "success",
                    );
                    statusDot.style.background = "var(--mjr-status-success, #4CAF50)";
                    applyStatusHighlight(section, "success");
                }
            } else {
                const err = String(
                    res?.error || t("toast.vectorBackfillFailedGeneric", "Backfill failed"),
                );
                const code = String(res?.code || "").trim();
                const status = Number(res?.status || 0) || 0;
                const detail = [code ? `code=${code}` : "", status ? `status=${status}` : "", err]
                    .filter(Boolean)
                    .join(" | ");
                comfyToast(detail, "error", 4500, {
                    history: {
                        ...historyBase.history,
                        status: "failed",
                        detail,
                        progress: { label: "failed", errors: 1 },
                    },
                });
                setActionLog(`Backfill ERROR — ${detail}\nSee console for full payload.`, "error");
                console.error("[Majoor] Vector backfill failed response", res);
                statusDot.style.background = "var(--mjr-status-error, #f44336)";
                applyStatusHighlight(section, "error");
            }
        } catch (error) {
            const errText = String(error?.message || error || "Backfill failed");
            comfyToast(errText, "error", 4500, {
                history: {
                    ...historyBase.history,
                    status: "failed",
                    detail: errText,
                    progress: { label: "failed", errors: 1 },
                },
            });
            setActionLog(`Backfill EXCEPTION — ${errText}\nSee console for stack trace.`, "error");
            console.error("[Majoor] Vector backfill exception", error);
            statusDot.style.background = "var(--mjr-status-error, #f44336)";
            applyStatusHighlight(section, "error");
        } finally {
            setMaintenanceActive(false);
            backfillBtn.disabled = false;
            resetBtn.disabled = false;
            backfillBtn.textContent = originalBackfillText;
            resetBtn.textContent = originalResetText;
            emitGlobalGridReload("vector-backfill");
            try {
                const target = getScanContext ? getScanContext() : null;
                await updateStatus(statusDot, statusText, capabilities, target, null, {
                    force: true,
                });
            } catch (e) {
                console.debug?.(e);
            }
        }
    };

    actionsRow.appendChild(backfillBtn);
    actionsRow.appendChild(resetBtn);
    body.appendChild(actionLog);

    const deleteDbBtn = document.createElement("button");
    deleteDbBtn.type = "button";
    deleteDbBtn.textContent = t("btn.deleteDb");
    deleteDbBtn.title = t("tooltip.deleteDb", "Force-delete database and rebuild from scratch");
    deleteDbBtn.style.cssText = `
        padding: 5px 12px;
        font-size: 11px;
        border-radius: 6px;
        border: 1px solid rgba(255,80,80,0.4);
        background: transparent;
        color: inherit;
        cursor: pointer;
        transition: border 0.2s, background 0.2s;
    `;
    deleteDbBtn.onmouseenter = () => {
        deleteDbBtn.style.borderColor = "rgba(255,80,80,0.8)";
        deleteDbBtn.style.background = "rgba(255,80,80,0.12)";
    };
    deleteDbBtn.onmouseleave = () => {
        deleteDbBtn.style.borderColor = "rgba(255,80,80,0.4)";
        deleteDbBtn.style.background = "transparent";
    };
    deleteDbBtn.onclick = async (event) => {
        event.stopPropagation();
        const preserveVectors = await askKeepVectors(t("btn.deleteDb", "Delete DB"));
        const confirmed = await comfyConfirm(
            preserveVectors
                ? t(
                      "dialog.dbDelete.keepVectorsConfirm",
                      "This will reset index data and keep existing AI vectors. Database files will not be force-deleted.\n\nContinue?",
                  )
                : t(
                      "dialog.dbDelete.confirm",
                      "This will permanently delete the index database and rebuild it from scratch. All ratings, tags, and cached metadata will be lost.\n\nContinue?",
                  ),
            t("btn.deleteDb", "Delete DB"),
        );
        if (!confirmed) return;
        setMaintenanceActive(true);

        const originalText = deleteDbBtn.textContent;
        deleteDbBtn.disabled = true;
        deleteDbBtn.textContent = preserveVectors
            ? t("btn.resetting", "Resetting...")
            : t("btn.deletingDb");
        resetBtn.disabled = true;

        statusDot.style.background = "var(--mjr-status-info, #64B5F6)";
        applyStatusHighlight(section, "info");

        try {
            const res = preserveVectors
                ? await resetIndex({
                      scope: "all",
                      reindex: true,
                      maintenance_force: true,
                      hard_reset_db: false,
                      clear_scan_journal: true,
                      clear_metadata_cache: true,
                      clear_asset_metadata: true,
                      clear_assets: false,
                      preserve_vectors: true,
                      rebuild_fts: true,
                  })
                : await forceDeleteDb();
            if (res?.ok) {
                globalThis._mjrCorruptToastShown = false;
                statusDot.style.background = "var(--mjr-status-success, #4CAF50)";
                applyStatusHighlight(section, "success");
            } else {
                statusDot.style.background = "var(--mjr-status-error, #f44336)";
                applyStatusHighlight(section, "error");
            }
        } catch {
            statusDot.style.background = "var(--mjr-status-error, #f44336)";
            applyStatusHighlight(section, "error");
        } finally {
            setMaintenanceActive(false);
            deleteDbBtn.disabled = false;
            deleteDbBtn.textContent = originalText;
            resetBtn.disabled = false;
            emitGlobalGridReload(
                preserveVectors ? "index-reset-preserve-vectors" : "db-force-delete",
            );
            try {
                const target = getScanContext ? getScanContext() : null;
                await updateStatus(statusDot, statusText, capabilities, target, null, {
                    force: true,
                });
            } catch (e) {
                console.debug?.(e);
            }
        }
    };

    actionsRow.appendChild(deleteDbBtn);
    body.appendChild(actionsRow);

    section.appendChild(header);
    section.appendChild(body);

    const title = section.querySelector("#mjr-status-title");
    if (title) {
        title.addEventListener("click", (event) => {
            event.stopPropagation();
            const body = section.querySelector("#mjr-status-body");
            if (!body) return;
            const collapsed = body.style.display === "none";
            setBodyCollapsed(section, !collapsed);
        });
    }

    setBodyCollapsed(section, true);
    // Add hover effect
    section.onmouseenter = () => {
        section.style.transform = "translateY(-1px)";
    };
    section.onmouseleave = () => {
        section.style.transform = "";
        applyStatusHighlight(section, section.dataset?.mjrStatusTone || "neutral", {
            toast: false,
        });
    };

    const onDbRestoreStatus = async (event) => {
        try {
            const detail = event?.detail || {};
            const step = String(detail?.step || "");
            if (!step) return;

            const isMaintenanceStep =
                step === "started" ||
                step === "stopping_workers" ||
                step === "resetting_db" ||
                step === "delete_db" ||
                step === "recreate_db" ||
                step === "replacing_files" ||
                step === "restarting_scan";

            // Keep global maintenance lock in sync even if the old panel was closed.
            if (isMaintenanceStep) {
                setMaintenanceActive(true);
            } else if (step === "failed" || step === "done") {
                setMaintenanceActive(false);
            }

            if (!section?.isConnected || !statusDot?.isConnected || !statusText?.isConnected)
                return;

            if (isMaintenanceStep) {
                statusDot.style.background = "var(--mjr-status-info, #64B5F6)";
                applyStatusHighlight(section, "info", { toast: false });
                setStatusWithHint(
                    statusText,
                    t("status.pending", "Pending..."),
                    t("status.dbRestoreInProgress", "Database restore in progress"),
                );
                return;
            }

            if (step === "failed") {
                statusDot.style.background = "var(--mjr-status-error, #f44336)";
                applyStatusHighlight(section, "error", { toast: false });
                setStatusLines(statusText, [
                    t("status.error", "Error"),
                    String(
                        detail?.message ||
                            t("toast.dbRestoreFailed", "Failed to restore DB backup"),
                    ),
                ]);
                return;
            }

            if (step === "done") {
                statusDot.style.background = "var(--mjr-status-success, #4CAF50)";
                applyStatusHighlight(section, "success", { toast: false });
                const op = String(detail?.operation || "");
                const doneHint =
                    op === "delete_db"
                        ? t(
                              "toast.dbDeleteSuccess",
                              "Database deleted and rebuilt. Files are being reindexed.",
                          )
                        : op === "reset_index"
                          ? t(
                                "toast.resetStarted",
                                "Index reset started. Files will be reindexed in the background.",
                            )
                          : t("toast.dbRestoreSuccess", "Database backup restored");
                setStatusWithHint(statusText, t("status.ready", "Ready"), doneHint);
                try {
                    const target = getScanContext ? getScanContext() : null;
                    setTimeout(() => {
                        void updateStatus(statusDot, statusText, capabilities, target, null, {
                            force: true,
                        });
                    }, 600);
                } catch (e) {
                    console.debug?.(e);
                }
            }
        } catch (e) {
            console.debug?.(e);
        }
    };
    try {
        const old = _dbRestoreStatusHandler;
        if (typeof old === "function") {
            window.removeEventListener("mjr-db-restore-status", old);
        }
        _dbRestoreStatusHandler = onDbRestoreStatus;
        section._mjrDbRestoreStatusHandler = onDbRestoreStatus;
        window.addEventListener("mjr-db-restore-status", onDbRestoreStatus);
    } catch (e) {
        console.debug?.(e);
    }

    const onRuntimeStatus = (event) => {
        try {
            const detail = event?.detail || {};
            const queueRemaining = Number(detail?.queue_remaining);
            const progressValue = Number(detail?.progress_value);
            const progressMax = Number(detail?.progress_max);
            const cachedNodes = Array.isArray(detail?.cached_nodes)
                ? detail.cached_nodes.length
                : 0;
            const activePromptId = String(detail?.active_prompt_id || "").trim();
            const progressLine =
                Number.isFinite(progressValue) && Number.isFinite(progressMax) && progressMax > 0
                    ? t("status.runtimeProgress", "Runtime progress: {value}/{max}", {
                          value: progressValue,
                          max: progressMax,
                      })
                    : "";
            const queueLine = Number.isFinite(queueRemaining)
                ? t("status.queueRemaining", "Queue remaining: {count}", {
                      count: Math.max(0, queueRemaining),
                  })
                : "";
            const cachedLine =
                cachedNodes > 0
                    ? t("status.executionCached", "Cached nodes reused: {count}", {
                          count: cachedNodes,
                      })
                    : "";
            const promptLine = activePromptId
                ? t("status.activePrompt", "Active prompt: {id}", { id: activePromptId })
                : "";
            const liveLines = [progressLine, queueLine, cachedLine, promptLine].filter(Boolean);
            if (!liveLines.length) return;
            const footer = statusText?.querySelector?.("span");
            if (footer) {
                footer.textContent = liveLines.join("  |  ");
            } else {
                setStatusWithHint(statusText, t("status.ready", "Ready"), liveLines.join("  |  "));
            }
        } catch (e) {
            console.debug?.(e);
        }
    };
    try {
        const old = _runtimeStatusHandler;
        if (typeof old === "function") {
            window.removeEventListener(EVENTS.RUNTIME_STATUS, old);
        }
        _runtimeStatusHandler = onRuntimeStatus;
        window.addEventListener(EVENTS.RUNTIME_STATUS, onRuntimeStatus);
    } catch (e) {
        console.debug?.(e);
    }

    return section;
}

/**
 * Trigger a scan
 */
export async function triggerScan(
    statusDot,
    statusText,
    capabilitiesSection = null,
    scanTarget = null,
) {
    if (_maintenanceActive) {
        comfyToast(
            t("status.maintenanceBusy", "Database maintenance in progress. Please wait."),
            "warning",
            2200,
        );
        return;
    }
    const section =
        statusText?.closest?.("#mjr-status-body")?.parentElement || statusText?.closest?.("div");
    const desiredScope = String(scanTarget?.scope || "output").toLowerCase();
    const desiredCustomRootId =
        scanTarget?.customRootId || scanTarget?.custom_root_id || scanTarget?.root_id || null;
    const isCustomBrowserMode = desiredScope === "custom" && !desiredCustomRootId;
    if (isCustomBrowserMode) {
        statusDot.style.background = "var(--mjr-status-info, #64B5F6)";
        applyStatusHighlight(section, "info");
        setStatusWithHint(
            statusText,
            t("status.customBrowserScanDisabled", "Custom browser mode: scan is disabled"),
            t(
                "status.customBrowserScanDisabledHint",
                "Use Outputs, Inputs, or All to run indexing scans",
            ),
        );
        return;
    }

    // Prevent overlapping scans (manual or polling-triggered).
    try {
        const now = Date.now();
        const inflight = globalThis?._mjrScanInFlight;
        if (inflight && typeof inflight === "object") {
            const ageMs = now - Number(inflight.at || 0);
            if (ageMs >= 0 && ageMs < 10 * 60_000) {
                setStatusWithHint(
                    statusText,
                    t("status.scanInProgress", "Scan already running..."),
                    t("status.scanInProgressHint", "Please wait for the current scan to finish"),
                );
                return;
            }
        }
        globalThis._mjrScanInFlight = {
            at: now,
            scope: desiredScope,
            root_id: desiredCustomRootId || null,
        };
    } catch (e) {
        console.debug?.(e);
    }

    const clearScanInFlight = () => {
        try {
            if (globalThis?._mjrScanInFlight) {
                globalThis._mjrScanInFlight = null;
            }
        } catch (e) {
            console.debug?.(e);
        }
    };

    // Incremental is always favored.
    // Shift+Click logic is handled by caller (if applicable), but here we default to true.
    const shouldIncremental = true;

    // Fetch roots so we can show meaningful paths
    let roots = null;
    try {
        const rootsResult = await get(ENDPOINTS.ROOTS);
        if (rootsResult.ok) roots = rootsResult.data;
    } catch (e) {
        console.debug?.(e);
    }

    // Fallback to config for output directory if roots endpoint is unavailable
    if (!roots) {
        const configResult = await get(ENDPOINTS.CONFIG);
        if (!configResult.ok) {
            statusDot.style.background = "var(--mjr-status-error, #f44336)";
            applyStatusHighlight(section, "error");
            statusText.textContent = t("status.errorGetConfig");
            clearScanInFlight();
            return;
        }
        roots = { output_directory: configResult.data.output_directory };
    }

    const scopeLabel =
        desiredScope === "all"
            ? t("scope.all", "Inputs + Outputs")
            : desiredScope === "input"
              ? t("scope.input", "Inputs")
              : desiredScope === "custom"
                ? t("scope.custom", "Custom")
                : t("scope.output", "Outputs");

    let detail = "";
    if (desiredScope === "input")
        detail = roots?.input_directory ? ` (${roots.input_directory})` : "";
    else if (desiredScope === "custom") {
        const list = Array.isArray(roots?.custom_roots) ? roots.custom_roots : [];
        const picked = desiredCustomRootId ? list.find((r) => r?.id === desiredCustomRootId) : null;
        detail = picked?.path ? ` (${picked.path})` : "";
    } else if (desiredScope === "output")
        detail = roots?.output_directory ? ` (${roots.output_directory})` : "";

    // Show scanning status
    statusDot.style.background = "var(--mjr-status-info, #64B5F6)";
    applyStatusHighlight(section, "info");
    setStatusWithHint(
        statusText,
        t("status.scanningScope", `Scanning ${scopeLabel}${detail}...`, {
            scope: scopeLabel,
            detail,
        }),
        t("status.scanningHint", "This may take a while"),
    );

    const settings = loadMajoorSettings();
    const fastModeEnabled = !!(settings?.scan?.fastMode ?? true);

    const payload = {
        scope: desiredScope,
        recursive: true,
        incremental: shouldIncremental,
        fast: fastModeEnabled,
        background_metadata: true,
    };
    if (desiredScope === "custom") {
        if (!desiredCustomRootId) {
            statusDot.style.background = "var(--mjr-status-error, #f44336)";
            applyStatusHighlight(section, "error");
            statusText.textContent = t("status.selectCustomFolder");
            clearScanInFlight();
            return;
        }
        payload.custom_root_id = desiredCustomRootId;
    }

    let scanResult;
    try {
        // Trigger scan
        scanResult = await post(ENDPOINTS.SCAN, payload);
    } finally {
        clearScanInFlight();
    }

    if (scanResult?.ok) {
        const stats = scanResult.data;
        statusDot.style.background = "var(--mjr-status-success, #4CAF50)"; // Green
        applyStatusHighlight(section, "success");
        setStatusWithHint(
            statusText,
            t("toast.scanComplete"),
            t(
                "status.scanStats",
                `Added: ${stats.added || 0}  -  Updated: ${stats.updated || 0}  -  Skipped: ${stats.skipped || 0}`,
                {
                    added: stats.added || 0,
                    updated: stats.updated || 0,
                    skipped: stats.skipped || 0,
                },
            ),
        );
        emitGlobalGridReload("scan-complete");

        // Refresh status after 2 seconds
        setTimeout(() => {
            updateStatus(statusDot, statusText, capabilitiesSection);
        }, 2000);
    } else {
        statusDot.style.background = "var(--mjr-status-error, #f44336)"; // Red
        applyStatusHighlight(section, "error");
        setStatusLines(statusText, [
            t("toast.scanFailed") + `: ${scanResult?.error || "Unknown error"}`,
        ]);

        // Restore status after 3 seconds
        setTimeout(() => {
            updateStatus(statusDot, statusText, capabilitiesSection);
        }, 3000);
    }
}

function createCapabilityBadge(label, available, hint) {
    const badge = document.createElement("span");
    badge.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    badge.textContent = `${available ? "✅" : "❌"} ${label}`;
    badge.title = available
        ? t("status.toolAvailable", `${label} available`, { tool: label })
        : hint || t("status.toolUnavailable", `${label} unavailable`, { tool: label });
    badge.style.opacity = available ? "1" : "0.75";
    return badge;
}

function renderCapabilities(section, toolAvailability = {}, toolPaths = {}) {
    if (!section) return;
    section.replaceChildren();
    if (!toolAvailability || Object.keys(toolAvailability).length === 0) {
        section.textContent = t("status.discoveringTools");
        return;
    }

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexWrap = "wrap";
    wrapper.style.gap = "10px";
    wrapper.style.alignItems = "flex-start";

    TOOL_CAPABILITIES.forEach(({ key, labelKey, hintKey }) => {
        const available = Boolean(toolAvailability[key]);
        const path = toolPaths[key];
        const label = t(labelKey, key);
        const hint = t(hintKey, "");
        wrapper.appendChild(createCapabilityNode({ label, hint }, available, path));
    });

    section.appendChild(wrapper);
}

function renderToolsStatusLine(section, toolStatus = null, fallbackAvailability = {}) {
    if (!section) return;
    const parent = section.parentElement;
    if (!parent) return;
    const container = parent.querySelector("#mjr-tools-status");
    if (!container) return;

    const hasFallback = fallbackAvailability && Object.keys(fallbackAvailability).length > 0;
    if (!toolStatus && !hasFallback) {
        container.textContent = t("status.toolStatusChecking", "Tool status: checking...");
        return;
    }

    const segments = TOOL_CAPABILITIES.map(({ key, labelKey }) => {
        const label = t(labelKey, key);
        const availability = toolStatus && key in toolStatus ? toolStatus[key] : undefined;
        const fallback = key in fallbackAvailability ? fallbackAvailability[key] : undefined;
        const available = availability !== undefined ? availability : fallback;
        const statusText =
            available === null || available === undefined
                ? t("status.unknown", "unknown")
                : available
                  ? t("status.available", "available")
                  : t("status.missing", "missing");
        const version = toolStatus?.versions?.[key];
        return version ? `${label}: ${statusText} - ${version}` : `${label}: ${statusText}`;
    });
    container.textContent = segments.join("  |  ");
}

function createCapabilityNode({ label, hint }, available, path) {
    const container = document.createElement("div");
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 3px;
        padding: 6px 8px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        min-width: 170px;
    `;

    const badge = createCapabilityBadge(label, available, hint);
    badge.style.fontWeight = "500";
    container.appendChild(badge);

    const pathLine = document.createElement("span");
    pathLine.style.fontSize = "10px";
    pathLine.style.opacity = "0.7";
    pathLine.style.wordBreak = "break-all";
    pathLine.textContent =
        t("status.path", "Path") +
        `: ${path ? path : t("status.pathAuto", "auto / not configured")}`;
    container.appendChild(pathLine);

    return container;
}

function setBodyCollapsed(section, collapsed) {
    const body = section.querySelector("#mjr-status-body");
    const indicator = section.querySelector("#mjr-status-title-indicator");
    if (!body || !indicator) return;
    if (collapsed) {
        body.style.display = "none";
        indicator.textContent = "▸";
    } else {
        body.style.display = "";
        indicator.textContent = "▾";
    }
}
function buildDbHealthLine(healthData, dbDiagData) {
    const dbAvailable = Boolean(healthData?.database?.available);
    const diagnostics = dbDiagData?.diagnostics || {};
    const malformed = Boolean(diagnostics?.malformed);
    const locked = Boolean(diagnostics?.locked);

    if (!dbAvailable || malformed) {
        return t("status.dbHealthError", "DB health: error");
    }
    if (locked) {
        return t("status.dbHealthLocked", "DB health: locked");
    }
    return t("status.dbHealthOk", "DB health: ok");
}

function buildIndexHealthLine(counters, desiredScope) {
    const totalAssets = Number(counters?.total_assets || 0);
    const lastIndexEnd = counters?.last_index_end;
    const lastScanEnd = counters?.last_scan_end;
    const scopeLabel =
        desiredScope === "all"
            ? t("scope.all", "Inputs + Outputs")
            : desiredScope === "input"
              ? t("scope.input", "Inputs")
              : desiredScope === "custom"
                ? t("scope.custom", "Custom")
                : t("scope.output", "Outputs");

    if (!Number.isFinite(totalAssets) || totalAssets <= 0) {
        return `${t("status.indexHealthEmpty", "Index health: empty")} (${scopeLabel})`;
    }
    if (!lastIndexEnd && !lastScanEnd) {
        return `${t("status.indexHealthPartial", "Index health: partial")} (${scopeLabel})`;
    }
    return `${t("status.indexHealthOk", "Index health: ok")} (${scopeLabel})`;
}

export async function updateStatus(
    statusDot,
    statusText,
    capabilitiesSection = null,
    scanTarget = null,
    meta = null,
    options = {},
) {
    const section =
        statusText?.closest?.("#mjr-status-body")?.parentElement || statusText?.closest?.("div");
    const signal = options?.signal || null;
    const force = !!options?.force;
    try {
        if (signal?.aborted) return null;
    } catch (e) {
        console.debug?.(e);
    }
    try {
        if (!statusDot?.isConnected || !statusText?.isConnected) return null;
    } catch (e) {
        console.debug?.(e);
    }
    try {
        if (!force && _maintenanceActive) return null;
    } catch (e) {
        console.debug?.(e);
    }
    // Optional: caller-provided object to read the last HTTP error details from.
    // (Used by the polling loop to avoid relying on string matching.)
    if (meta && typeof meta === "object") {
        meta.lastCode = null;
        meta.lastStatus = null;
    }

    const desiredScope = String(scanTarget?.scope || "output").toLowerCase();
    const desiredCustomRootId =
        scanTarget?.customRootId || scanTarget?.custom_root_id || scanTarget?.root_id || null;
    const isCustomBrowserMode = desiredScope === "custom" && !desiredCustomRootId;
    const url = isCustomBrowserMode
        ? `${ENDPOINTS.HEALTH_COUNTERS}?scope=all`
        : desiredScope === "custom"
          ? `${ENDPOINTS.HEALTH_COUNTERS}?scope=custom&custom_root_id=${encodeURIComponent(String(desiredCustomRootId || ""))}`
          : `${ENDPOINTS.HEALTH_COUNTERS}?scope=${encodeURIComponent(desiredScope || "output")}`;
    const lightweight = !!options?.lightweight;
    const shouldFetchAux =
        force || !lightweight || !(meta && typeof meta === "object" && meta._auxCached);

    let result;
    let healthResult;
    let dbDiagResult;
    let toolStatusData = null;

    if (shouldFetchAux) {
        const [countersRes, healthRes, dbRes] = await Promise.all([
            get(url, signal ? { signal } : undefined),
            get(ENDPOINTS.HEALTH, signal ? { signal } : undefined),
            get(ENDPOINTS.HEALTH_DB, signal ? { signal } : undefined),
        ]);
        result = countersRes;
        healthResult = healthRes;
        dbDiagResult = dbRes;
        try {
            const toolsResult = await getToolsStatus(signal ? { signal } : undefined);
            if (toolsResult?.ok) toolStatusData = toolsResult.data;
        } catch (e) {
            console.debug?.(e);
        }
        if (meta && typeof meta === "object") {
            meta._auxCached = true;
            meta._healthCache = healthResult;
            meta._dbDiagCache = dbDiagResult;
            meta._toolsCache = toolStatusData;
        }
    } else {
        result = await get(url, signal ? { signal } : undefined);
        healthResult = meta?._healthCache || null;
        dbDiagResult = meta?._dbDiagCache || null;
        toolStatusData = meta?._toolsCache || null;
    }
    try {
        if (signal?.aborted) return null;
    } catch (e) {
        console.debug?.(e);
    }
    try {
        if (!statusDot?.isConnected || !statusText?.isConnected) return null;
    } catch (e) {
        console.debug?.(e);
    }

    if (meta && typeof meta === "object") {
        meta.lastCode = result?.code || null;
        meta.lastStatus = typeof result?.status === "number" ? result.status : null;
    }

    if (result.ok) {
        const counters = result.data;
        const totalAssets = counters.total_assets || 0;
        const withWorkflows = counters.with_workflows ?? 0;
        const withGenerationData = counters.with_generation_data ?? 0;
        const lastScanRaw = counters.last_scan_end;
        const lastScanText = lastScanRaw ? new Date(lastScanRaw).toLocaleString() : "N/A";
        const toolAvailability = counters.tool_availability || {};
        const toolPaths = counters.tool_paths || {};
        const dbSizeLine = t("status.dbSize", "Database size: {size}", {
            size: formatBytes(counters.db_size_bytes || 0),
        });
        const vectorDiag =
            healthResult?.ok && healthResult?.data ? healthResult.data.vector || {} : {};
        const vectorEnabled = vectorDiag?.enabled !== false;
        const vectorLoaded = !!vectorDiag?.loaded;
        const vectorDegraded = !!vectorDiag?.degraded;
        const vectorLastError = String(vectorDiag?.last_error || "").trim();
        const vectorLine = !vectorEnabled
            ? "AI vector: disabled"
            : vectorDegraded
              ? `AI vector: degraded${vectorLastError ? ` (${vectorLastError})` : ""}`
              : vectorLoaded
                ? "AI vector: loaded"
                : "AI vector: initializing";
        const dbHealthLine = buildDbHealthLine(
            healthResult?.data || null,
            dbDiagResult?.data || null,
        );
        const indexHealthLine = buildIndexHealthLine(
            counters,
            isCustomBrowserMode ? "all" : desiredScope,
        );
        const dbAvailable = Boolean(healthResult?.ok && healthResult?.data?.database?.available);
        const dbDiagnostics = dbDiagResult?.ok ? dbDiagResult?.data?.diagnostics || {} : {};
        const dbMalformed = Boolean(dbDiagnostics?.malformed);
        const dbLocked = Boolean(dbDiagnostics?.locked);
        const dbMaintenance = Boolean(dbDiagnostics?.maintenance_active);
        setMaintenanceActive(dbMaintenance);
        const enrichmentQueueLength = Math.max(
            0,
            Number(counters?.enrichment_queue_length || 0) || 0,
        );
        const runtimeEnrichment = getEnrichmentState();
        const enrichmentActive = runtimeEnrichment.active || enrichmentQueueLength > 0;
        setEnrichmentState(enrichmentActive, enrichmentQueueLength);
        const hasIndexedAssets = Number(totalAssets) > 0;
        const hasIndexTimestamp = Boolean(counters?.last_index_end || counters?.last_scan_end);
        const indexHealthy = hasIndexedAssets && hasIndexTimestamp;

        let healthTone = "success";
        if (dbMaintenance || enrichmentActive) {
            healthTone = "info";
        } else if (!dbAvailable || dbMalformed) {
            healthTone = "error";
        } else if (dbLocked || !indexHealthy) {
            healthTone = "warning";
        } else if (vectorDegraded) {
            healthTone = "warning";
        }
        const displayTone = isCustomBrowserMode && healthTone !== "error" ? "browser" : healthTone;
        let watcherInfo = counters.watcher;
        try {
            if (!watcherInfo || typeof watcherInfo.enabled !== "boolean") {
                const wres = await getWatcherStatus(signal ? { signal } : undefined);
                if (wres?.ok && wres.data) {
                    watcherInfo = {
                        enabled: !!wres.data.enabled,
                        scope: counters?.watcher?.scope || desiredScope,
                        custom_root_id: desiredCustomRootId || null,
                    };
                }
            }
        } catch (e) {
            console.debug?.(e);
        }
        const watcherLine = isCustomBrowserMode
            ? t("status.watcher.disabledScoped", "Watcher: disabled ({scope})", {
                  scope: t("scope.customBrowser", "Browser"),
              })
            : formatWatcherLine(watcherInfo, desiredScope);
        const enrichmentLine = enrichmentActive
            ? t("status.enrichmentQueue", "Metadata enrichment queue: {count}", {
                  count: enrichmentQueueLength,
              })
            : t("status.enrichmentIdle", "Metadata enrichment: idle");

        renderCapabilities(capabilitiesSection, toolAvailability, toolPaths);
        renderToolsStatusLine(capabilitiesSection, toolStatusData, toolAvailability);

        const scopeLabel =
            desiredScope === "all"
                ? t("scope.allFull", "All (Inputs + Outputs)")
                : desiredScope === "input"
                  ? t("scope.input", "Inputs")
                  : desiredScope === "custom"
                    ? t("scope.customBrowser", "Browser")
                    : t("scope.output", "Outputs");

        if (healthTone === "error") {
            statusDot.style.background = "var(--mjr-status-error, #f44336)";
            applyStatusHighlight(section, "error");
            setStatusWithHint(
                statusText,
                t("status.dbCorrupted", "Database appears corrupted or unavailable."),
                [dbHealthLine, indexHealthLine, dbSizeLine, watcherLine]
                    .filter(Boolean)
                    .join("  |  "),
            );
            return counters;
        }

        if (isCustomBrowserMode) {
            statusDot.style.background = "var(--mjr-status-browser, #26A69A)";
            applyStatusHighlight(section, "browser");
            setStatusWithHint(
                statusText,
                t("status.ready", "Ready"),
                [
                    t(
                        "status.browserMetricsHidden",
                        "Browser mode: global DB/index metrics hidden",
                    ),
                    watcherLine,
                ]
                    .filter(Boolean)
                    .join("  |  "),
            );
            return counters;
        }

        if (totalAssets === 0) {
            statusDot.style.background =
                displayTone === "browser"
                    ? "var(--mjr-status-browser, #26A69A)"
                    : healthTone === "info"
                      ? "var(--mjr-status-info, #64B5F6)"
                      : healthTone === "warning"
                        ? "var(--mjr-status-warning, #FFA726)"
                        : "var(--mjr-status-success, #4CAF50)";
            applyStatusHighlight(section, displayTone);
            setStatusWithHint(
                statusText,
                t("status.noAssets", `No assets indexed yet (${scopeLabel})`, {
                    scope: scopeLabel,
                }),
                [
                    t("status.clickToScan", "Click the dot to start a scan"),
                    vectorLine,
                    dbHealthLine,
                    indexHealthLine,
                    dbSizeLine,
                    watcherLine,
                ]
                    .filter(Boolean)
                    .join("  |  "),
            );
        } else {
            statusDot.style.background =
                displayTone === "browser"
                    ? "var(--mjr-status-browser, #26A69A)"
                    : healthTone === "info"
                      ? "var(--mjr-status-info, #64B5F6)"
                      : healthTone === "warning"
                        ? "var(--mjr-status-warning, #FFA726)"
                        : "var(--mjr-status-success, #4CAF50)";
            applyStatusHighlight(section, displayTone);
            setStatusLines(
                statusText,
                [
                    t(
                        "status.assetsIndexed",
                        `${totalAssets.toLocaleString()} assets indexed (${scopeLabel})`,
                        { count: totalAssets.toLocaleString(), scope: scopeLabel },
                    ),
                    _buildKindCountsLine(counters),
                    t(
                        "status.withWorkflows",
                        `With workflows: ${withWorkflows}  -  Generation data: ${withGenerationData}`,
                        { workflows: withWorkflows, gendata: withGenerationData },
                    ),
                    enrichmentLine,
                    vectorLine,
                    dbHealthLine,
                    indexHealthLine,
                    dbSizeLine,
                    watcherLine,
                ],
                t("status.lastScan", `Last scan: ${lastScanText}`, { date: lastScanText }),
            );
        }
        return counters;
    } else {
        // Error - red
        renderCapabilities(capabilitiesSection, {}, {});
        renderToolsStatusLine(capabilitiesSection, toolStatusData);
        statusDot.style.background = "var(--mjr-status-error, #f44336)";
        applyStatusHighlight(section, "error");
        if (result?.code === "INVALID_RESPONSE" && result?.status === 404) {
            setStatusWithHint(
                statusText,
                t("status.apiNotFound", "Majoor API endpoints not found (404)"),
                t(
                    "status.apiNotFoundHint",
                    "Backend routes are not loaded. Restart ComfyUI and check the terminal for Majoor import errors.",
                ),
            );
        } else {
            const errMsg = String(result?.error || "").toLowerCase();
            const isCorrupt =
                errMsg.includes("malform") ||
                errMsg.includes("corrupt") ||
                errMsg.includes("disk image");
            if (isCorrupt) {
                setStatusWithHint(statusText, t("status.dbCorrupted"), t("status.dbCorruptedHint"));
                if (!globalThis._mjrCorruptToastShown) {
                    globalThis._mjrCorruptToastShown = true;
                    comfyToast(t("toast.resetFailedCorrupt"), "error", 8000);
                }
            } else {
                setStatusLines(statusText, [
                    result.error || t("status.errorChecking", "Error checking status"),
                ]);
            }
        }
        if (result.code === "SERVICE_UNAVAILABLE") {
            const retryBtn = createRetryButton(
                statusDot,
                statusText,
                capabilitiesSection,
                scanTarget,
            );
            statusText.appendChild(document.createElement("br"));
            statusText.appendChild(retryBtn);
        }
    }
    return null;
}

function createRetryButton(statusDot, statusText, capabilitiesSection = null, scanTarget = null) {
    const button = document.createElement("button");
    button.textContent = t("btn.retryServices");
    button.style.cssText = `
        padding: 4px 10px;
        margin-top: 6px;
        font-size: 11px;
        border-radius: 4px;
        border: 1px solid rgba(255,255,255,0.3);
        background: transparent;
        color: white;
        cursor: pointer;
    `;

    button.onclick = async () => {
        button.disabled = true;
        button.textContent = t("btn.retrying");
        const retryResult = await post(ENDPOINTS.RETRY_SERVICES, {});
        button.disabled = false;
        button.textContent = t("btn.retryServices");
        if (retryResult.ok) {
            updateStatus(statusDot, statusText, capabilitiesSection, scanTarget);
        } else {
            setStatusLines(statusText, [
                retryResult.error || t("status.retryFailed", "Retry failed"),
            ]);
            statusText.appendChild(document.createElement("br"));
            statusText.appendChild(button);
        }
    };

    return button;
}

function _readCachedStatusCounters() {
    try {
        const raw = localStorage?.getItem?.(STATUS_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
        console.debug?.(e);
        return null;
    }
}

function _writeCachedStatusCounters(counters) {
    try {
        if (!counters || typeof counters !== "object") return;
        localStorage?.setItem?.(STATUS_CACHE_KEY, JSON.stringify(counters));
    } catch (e) {
        console.debug?.(e);
    }
}

function _collectProgressValues(status) {
    const values = [];
    const visit = (node, depth = 0) => {
        if (!node || depth > 2) return;
        if (typeof node === "number" && Number.isFinite(node)) {
            values.push(node);
            return;
        }
        if (Array.isArray(node)) {
            for (const item of node) visit(item, depth + 1);
            return;
        }
        if (typeof node !== "object") return;
        for (const [key, value] of Object.entries(node)) {
            const normalizedKey = String(key || "").toLowerCase();
            if (
                normalizedKey.includes("queue") ||
                normalizedKey.includes("progress") ||
                normalizedKey.includes("pending") ||
                normalizedKey.includes("running") ||
                normalizedKey.includes("active") ||
                normalizedKey.includes("scan") ||
                normalizedKey.includes("index")
            ) {
                visit(value, depth + 1);
            }
        }
    };
    visit(status, 0);
    return values;
}

function _statusHasActiveWork(counters) {
    if (!counters || typeof counters !== "object") return false;
    if (_maintenanceActive) return true;
    try {
        if (getEnrichmentState()?.active) return true;
    } catch (e) {
        console.debug?.(e);
    }
    const values = _collectProgressValues(counters);
    return values.some((value) => Number(value) > 0);
}

function _buildKindCountsLine(counters) {
    const parts = [];
    if (counters.images) parts.push(`Images: ${counters.images}`);
    if (counters.videos) parts.push(`Videos: ${counters.videos}`);
    if (counters.audio) parts.push(`Audio: ${counters.audio}`);
    const model3d = counters.model3d || counters.by_kind?.model3d || 0;
    if (model3d) parts.push(`3D: ${model3d}`);
    return parts.length ? parts.join("  -  ") : `Images: 0  -  Videos: 0`;
}

function _buildStatusSignature(counters) {
    if (!counters || typeof counters !== "object") return "";
    const pick = (value) => {
        if (value == null) return null;
        if (typeof value === "number") return Number.isFinite(value) ? value : null;
        if (typeof value === "boolean") return value;
        if (typeof value === "string") return value;
        return null;
    };
    return JSON.stringify({
        total_assets: pick(counters.total_assets),
        last_scan_end: pick(counters.last_scan_end),
        last_index_end: pick(counters.last_index_end),
        enrichment_queue_length: pick(counters.enrichment_queue_length),
        images: pick(counters.images),
        videos: pick(counters.videos),
        audio: pick(counters.audio),
        model3d: pick(counters.model3d ?? counters.by_kind?.model3d),
        watcher: {
            enabled: pick(counters?.watcher?.enabled),
            scope: pick(counters?.watcher?.scope),
        },
    });
}

function _hydrateStatusFromCache(statusDot, statusText, capabilitiesSection) {
    const cached = _readCachedStatusCounters();
    if (!cached) return false;
    try {
        renderCapabilities(capabilitiesSection, cached.tool_availability || {}, cached.tool_paths || {});
    } catch (e) {
        console.debug?.(e);
    }
    try {
        statusDot.style.background = "var(--mjr-status-info, #64B5F6)";
        setStatusWithHint(
            statusText,
            t("status.cached", "Last known status"),
            t("status.checking", "Checking status..."),
        );
        return true;
    } catch (e) {
        console.debug?.(e);
        return false;
    }
}

function _advancePollState(currentState, counters, pollStateMeta) {
    const signature = _buildStatusSignature(counters);
    const hasChange =
        signature && signature !== String(pollStateMeta?.lastSignature || "");
    const hasActiveWork = _statusHasActiveWork(counters);

    let nextState = currentState || STATUS_POLL_STATE.ACTIVE;
    let cooldownStablePolls = Number(pollStateMeta?.cooldownStablePolls || 0) || 0;

    if (hasActiveWork) {
        nextState = STATUS_POLL_STATE.ACTIVE;
        cooldownStablePolls = 0;
    } else if (hasChange) {
        nextState = STATUS_POLL_STATE.ACTIVE;
        cooldownStablePolls = 0;
    } else if (nextState === STATUS_POLL_STATE.ACTIVE) {
        nextState = STATUS_POLL_STATE.COOLDOWN;
        cooldownStablePolls = 0;
    } else if (nextState === STATUS_POLL_STATE.COOLDOWN) {
        cooldownStablePolls += 1;
        if (cooldownStablePolls >= 3) {
            nextState = STATUS_POLL_STATE.IDLE;
            cooldownStablePolls = 0;
        }
    } else {
        nextState = hasChange ? STATUS_POLL_STATE.ACTIVE : STATUS_POLL_STATE.IDLE;
        cooldownStablePolls = 0;
    }

    return {
        nextState,
        signature,
        hasChange,
        hasActiveWork,
        cooldownStablePolls,
    };
}

/**
 * Setup status polling
 */
export function setupStatusPolling(
    statusDot,
    statusText,
    section,
    capabilitiesSection = null,
    onCountersUpdate = null,
    getScanTarget = null,
) {
    const GLOBAL_POLL_KEY = "__MJR_STATUS_POLL_DISPOSE__";
    const pollMeta = { lastCode: null, lastStatus: null, _pollTick: 0, _auxCached: false };
    const pollStateMeta = {
        mode: STATUS_POLL_STATE.ACTIVE,
        cooldownStablePolls: 0,
        lastSignature: "",
    };

    const pollingAC = typeof AbortController !== "undefined" ? new AbortController() : null;
    const handleUpdate = async () => {
        try {
            if (pollingAC?.signal?.aborted) return null;
        } catch (e) {
            console.debug?.(e);
        }
        pollMeta._pollTick = Number(pollMeta._pollTick || 0) + 1;
        const lightweight = pollMeta._pollTick > 1 && pollMeta._pollTick % 4 !== 0;
        const target = typeof getScanTarget === "function" ? getScanTarget() : null;
        const counters = await updateStatus(
            statusDot,
            statusText,
            capabilitiesSection,
            target,
            pollMeta,
            {
                signal: pollingAC?.signal || null,
                lightweight,
                // Keep status updates alive while maintenance is active (or stale).
                force: !!_maintenanceActive || pollMeta._pollTick <= 1,
            },
        );
        if (counters && typeof counters === "object") {
            _writeCachedStatusCounters(counters);
            const transition = _advancePollState(pollStateMeta.mode, counters, pollStateMeta);
            pollStateMeta.mode = transition.nextState;
            pollStateMeta.lastSignature = transition.signature;
            pollStateMeta.cooldownStablePolls = transition.cooldownStablePolls;
        }
        if (counters && typeof onCountersUpdate === "function") {
            try {
                await onCountersUpdate(counters);
            } catch (e) {
                console.debug?.(e);
            }
        }
        return counters;
    };

    // Show last known state immediately, then refresh in background.
    _hydrateStatusFromCache(statusDot, statusText, capabilitiesSection);
    handleUpdate();

    try {
        section._mjrStatusPollDispose?.();
    } catch (e) {
        console.debug?.(e);
    }

    // Ensure only one polling loop exists globally (panel rerenders can otherwise duplicate timers).
    try {
        const oldGlobalDispose = window?.[GLOBAL_POLL_KEY];
        if (typeof oldGlobalDispose === "function") oldGlobalDispose();
    } catch (e) {
        console.debug?.(e);
    }

    // Poll using a dynamic interval so settings changes apply without reload.
    let pollTimerId = null;
    let consecutiveFailures = 0;
    let lastWasMissingEndpoint = false;
    const getIdleMultiplier = () => {
        try {
            const hidden = typeof document !== "undefined" && !!document.hidden;
            const unfocused =
                typeof document !== "undefined" &&
                typeof document.hasFocus === "function" &&
                !document.hasFocus();
            if (hidden || unfocused) return 4;
        } catch (e) {
            console.debug?.(e);
        }
        return 1;
    };

    const scheduleNext = () => {
        const baseMs =
            STATUS_POLL_INTERVALS_MS[pollStateMeta.mode] ||
            Math.max(250, Number(APP_CONFIG.STATUS_POLL_INTERVAL) || 2000);
        const rawWaitMs = lastWasMissingEndpoint
            ? Math.max(30_000, baseMs)
            : consecutiveFailures > 0
              ? Math.min(60_000, Math.round(baseMs * Math.min(8, 1 + consecutiveFailures)))
              : baseMs;
        const waitMs = Math.min(120_000, Math.round(rawWaitMs * getIdleMultiplier()));

        pollTimerId = setTimeout(async () => {
            try {
                if (pollingAC?.signal?.aborted) return;
            } catch (e) {
                console.debug?.(e);
            }
            const counters = await handleUpdate();

            // If the backend routes aren't loaded, ComfyUI returns an HTML 404 page (non-JSON).
            // Back off to avoid spamming the console/network.
            lastWasMissingEndpoint =
                pollMeta.lastCode === "INVALID_RESPONSE" && pollMeta.lastStatus === 404;
            if (counters) {
                consecutiveFailures = 0;
            } else if (lastWasMissingEndpoint) {
                consecutiveFailures = Math.min(999, consecutiveFailures + 1);
            } else {
                consecutiveFailures = Math.min(999, consecutiveFailures + 1);
                pollStateMeta.mode = STATUS_POLL_STATE.ACTIVE;
                pollStateMeta.cooldownStablePolls = 0;
            }

            // After a few consecutive 404s, stop polling entirely until reload.
            if (lastWasMissingEndpoint && consecutiveFailures >= 3) {
                try {
                    section._mjrStatusPollDispose?.();
                } catch (e) {
                    console.debug?.(e);
                }
                return;
            }
            scheduleNext();
        }, waitMs);
    };
    section._mjrStatusPollDispose = () => {
        try {
            pollingAC?.abort?.();
        } catch (e) {
            console.debug?.(e);
        }
        if (pollTimerId) clearTimeout(pollTimerId);
        pollTimerId = null;
    };
    try {
        window[GLOBAL_POLL_KEY] = section._mjrStatusPollDispose;
    } catch (e) {
        console.debug?.(e);
    }
    scheduleNext();

    const statusDotEl = section.querySelector("#mjr-status-dot");
    if (statusDotEl) {
        statusDotEl.onclick = (event) => {
            event.stopPropagation();
            const target = typeof getScanTarget === "function" ? getScanTarget() : null;
            triggerScan(statusDot, statusText, capabilitiesSection, target);
        };
        statusDotEl.title = t("status.clickToScan", "Click to scan");
    }
}
