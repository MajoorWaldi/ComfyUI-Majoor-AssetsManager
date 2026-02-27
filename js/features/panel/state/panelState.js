import { SettingsStore } from "../../../app/settings/SettingsStore.js";

const STORAGE_KEY = "mjr_panel_state";
let _lastSavedSerialized = "";
const ALLOWED_SCOPES = new Set(["output", "input", "all", "custom"]);

function _toBool(value, fallback = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["1", "true", "yes", "on"].includes(normalized)) return true;
        if (["0", "false", "no", "off"].includes(normalized)) return false;
    }
    return !!fallback;
}

function _toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function _toString(value, fallback = "") {
    if (value === null || value === undefined) return fallback;
    return String(value);
}

function sanitizePanelState(raw) {
    if (!raw || typeof raw !== "object") return {};
    const out = {};
    const rawScope = _toString(raw.scope || "output").toLowerCase();
    const normalizedScope = rawScope === "outputs" ? "output" : rawScope === "inputs" ? "input" : rawScope;
    out.scope = ALLOWED_SCOPES.has(normalizedScope) ? normalizedScope : "output";
    out.customRootId = _toString(raw.customRootId || "");
    out.currentFolderRelativePath = _toString(raw.currentFolderRelativePath || raw.subfolder || "");
    out.collectionId = _toString(raw.collectionId || "");
    out.collectionName = _toString(raw.collectionName || "");
    out.kindFilter = _toString(raw.kindFilter || "");
    out.dateRangeFilter = _toString(raw.dateRangeFilter || "");
    out.dateExactFilter = _toString(raw.dateExactFilter || "");
    out.workflowOnly = _toBool(raw.workflowOnly, false);
    out.minRating = Math.max(0, Math.min(5, Math.floor(_toNumber(raw.minRating, 0))));
    out.minSizeMB = Math.max(0, _toNumber(raw.minSizeMB, 0));
    out.maxSizeMB = Math.max(0, _toNumber(raw.maxSizeMB, 0));
    out.resolutionCompare = raw.resolutionCompare === "lte" ? "lte" : "gte";
    out.minWidth = Math.max(0, Math.floor(_toNumber(raw.minWidth, 0)));
    out.minHeight = Math.max(0, Math.floor(_toNumber(raw.minHeight, 0)));
    out.maxWidth = Math.max(0, Math.floor(_toNumber(raw.maxWidth, 0)));
    out.maxHeight = Math.max(0, Math.floor(_toNumber(raw.maxHeight, 0)));
    out.workflowType = _toString(raw.workflowType || "");
    out.sort = _toString(raw.sort || "mtime_desc");
    out.searchQuery = _toString(raw.searchQuery || "");
    out.scrollTop = Math.max(0, Math.floor(_toNumber(raw.scrollTop, 0)));
    out.activeAssetId = _toString(raw.activeAssetId || "");
    out.selectedAssetIds = Array.isArray(raw.selectedAssetIds)
        ? raw.selectedAssetIds.map((x) => _toString(x || "").trim()).filter(Boolean).slice(0, 5000)
        : [];
    out.sidebarOpen = _toBool(raw.sidebarOpen, false);
    return out;
}

function loadPanelState() {
    try {
        const raw = SettingsStore.get(STORAGE_KEY);
        if (raw) return sanitizePanelState(JSON.parse(raw));
    } catch (e) { console.debug?.(e); }
    return null;
}

function savePanelState(state) {
    try {
        const toSave = { ...state };
        // Don't persist transient stats
        delete toSave.lastGridCount;
        delete toSave.lastGridTotal;
        const serialized = JSON.stringify(toSave);
        if (serialized === _lastSavedSerialized) return;
        _lastSavedSerialized = serialized;
        SettingsStore.set(STORAGE_KEY, serialized);
    } catch (e) { console.debug?.(e); }
}

export function createPanelState() {
    const saved = loadPanelState() || {};
    const state = {
        scope: saved.scope || "output",
        customRootId: saved.customRootId || "",
        // Backward-compatible migration from old saved `subfolder` key.
        currentFolderRelativePath: saved.currentFolderRelativePath || saved.subfolder || "",
        collectionId: saved.collectionId || "",
        collectionName: saved.collectionName || "",
        kindFilter: saved.kindFilter || "",
        dateRangeFilter: saved.dateRangeFilter || "",
        dateExactFilter: saved.dateExactFilter || "",
        workflowOnly: saved.workflowOnly || false,
        minRating: saved.minRating || 0,
        minSizeMB: Number(saved.minSizeMB || 0) || 0,
        maxSizeMB: Number(saved.maxSizeMB || 0) || 0,
        resolutionCompare: saved.resolutionCompare === "lte" ? "lte" : "gte",
        minWidth: Number(saved.minWidth || 0) || 0,
        minHeight: Number(saved.minHeight || 0) || 0,
        maxWidth: Number(saved.maxWidth || 0) || 0,
        maxHeight: Number(saved.maxHeight || 0) || 0,
        workflowType: saved.workflowType || "",
        sort: saved.sort || "mtime_desc",
        // Search query and scroll position persistence
        searchQuery: saved.searchQuery || "",
        scrollTop: saved.scrollTop || 0,
        
        // Last grid load stats (best-effort; used by UI summary bar).
        lastGridCount: 0,
        lastGridTotal: 0,
        // Selection state (source of truth) for durable selection across grid re-renders.
        // Stored as strings because DOM dataset values are strings.
        activeAssetId: saved.activeAssetId || "",
        selectedAssetIds: saved.selectedAssetIds || [],
        
        // Sidebar open state for restoring across panel close/reopen.
        sidebarOpen: saved.sidebarOpen || false
    };
    let proxy = null;
    
    let debounceTimer = null;
    const debouncedSave = (targetState) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            savePanelState(targetState);
            debounceTimer = null;
        }, 750);
    };

    const storageHandler = (event) => {
        if (!event) return;
        if (event.key !== STORAGE_KEY) return;
        if (!event.newValue) return;
        try {
            const updated = sanitizePanelState(JSON.parse(event.newValue));
            const target = proxy || state;
            for (const [k, v] of Object.entries(updated || {})) {
                target[k] = v;
            }
        } catch (e) { console.debug?.(e); }
    };
    try {
        window.addEventListener("storage", storageHandler);
    } catch (e) { console.debug?.(e); }

    const dispose = () => {
        try {
            if (debounceTimer) clearTimeout(debounceTimer);
        } catch (e) { console.debug?.(e); }
        debounceTimer = null;
        try {
            window.removeEventListener("storage", storageHandler);
        } catch (e) { console.debug?.(e); }
    };

    proxy = new Proxy(state, {
        set(target, prop, value) {
            target[prop] = value;
            debouncedSave(target);
            return true;
        }
    });
    
    // Attach dispose to the proxy for cleanup
    proxy._mjrDispose = dispose;
    
    return proxy;
}
