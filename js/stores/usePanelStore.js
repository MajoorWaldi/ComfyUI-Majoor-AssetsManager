/**
 * Pinia store — Panel UI state
 *
 * Replaces the Proxy-based panelState.js with a fully reactive Pinia store.
 * State is persisted to localStorage (same key as the old system for backwards
 * compatibility) with a 750 ms debounce.
 *
 * Vue components consume this store via `usePanelStore()`.
 * Legacy DOM controllers consume this store through `panelStateBridge.js`
 * during the incremental migration.
 */

import { defineStore } from "pinia";
import { ref, watch, onScopeDispose } from "vue";

const STORAGE_KEY = "mjr_panel_state";
const ALLOWED_SCOPES = new Set(["output", "input", "all", "custom"]);

// ─── helpers ──────────────────────────────────────────────────────────────────

function toBool(value, fallback = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const n = value.trim().toLowerCase();
        if (["1", "true", "yes", "on"].includes(n)) return true;
        if (["0", "false", "no", "off"].includes(n)) return false;
    }
    return !!fallback;
}

function toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function toStr(value, fallback = "") {
    if (value === null || value === undefined) return fallback;
    return String(value);
}

function clampInt(value, min = 0, max = Infinity) {
    return Math.max(min, Math.min(max, Math.floor(toNumber(value, min))));
}

function normalizeScope(raw) {
    const s = toStr(raw || "output").toLowerCase();
    const mapped = s === "outputs" ? "output" : s === "inputs" ? "input" : s;
    return ALLOWED_SCOPES.has(mapped) ? mapped : "output";
}

function sanitize(raw) {
    if (!raw || typeof raw !== "object") return {};
    return {
        scope: normalizeScope(raw.scope),
        customRootId: toStr(raw.customRootId),
        customRootLabel: toStr(raw.customRootLabel),
        currentFolderRelativePath: toStr(raw.currentFolderRelativePath || raw.subfolder),
        collectionId: toStr(raw.collectionId),
        collectionName: toStr(raw.collectionName),
        kindFilter: toStr(raw.kindFilter),
        dateRangeFilter: toStr(raw.dateRangeFilter),
        dateExactFilter: toStr(raw.dateExactFilter),
        workflowOnly: toBool(raw.workflowOnly, false),
        minRating: clampInt(raw.minRating, 0, 5),
        minSizeMB: Math.max(0, toNumber(raw.minSizeMB, 0)),
        maxSizeMB: Math.max(0, toNumber(raw.maxSizeMB, 0)),
        resolutionCompare: raw.resolutionCompare === "lte" ? "lte" : "gte",
        minWidth: clampInt(raw.minWidth),
        minHeight: clampInt(raw.minHeight),
        maxWidth: clampInt(raw.maxWidth),
        maxHeight: clampInt(raw.maxHeight),
        workflowType: toStr(raw.workflowType),
        sort: toStr(raw.sort || "mtime_desc"),
        searchQuery: toStr(raw.searchQuery),
        scrollTop: clampInt(raw.scrollTop),
        activeAssetId: toStr(raw.activeAssetId),
        selectedAssetIds: Array.isArray(raw.selectedAssetIds)
            ? raw.selectedAssetIds
                  .map((x) => toStr(x).trim())
                  .filter(Boolean)
                  .slice(0, 5000)
            : [],
        sidebarOpen: toBool(raw.sidebarOpen, false),
    };
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return sanitize(JSON.parse(raw));
    } catch {
        /* ignore */
    }
    return {};
}

function saveToStorage(state) {
    try {
        const toSave = { ...state };
        // Transient fields — never persisted
        delete toSave.lastGridCount;
        delete toSave.lastGridTotal;
        delete toSave.viewScope;
        delete toSave.similarResults;
        delete toSave.similarTitle;
        delete toSave.similarSourceAssetId;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
        /* ignore */
    }
}

// ─── store ────────────────────────────────────────────────────────────────────

export const usePanelStore = defineStore("mjr-panel", () => {
    const saved = loadFromStorage();

    // ── persistent state ──────────────────────────────────────────────────────
    const scope = ref(saved.scope || "output");
    const customRootId = ref(saved.customRootId || "");
    const customRootLabel = ref(saved.customRootLabel || "");
    const currentFolderRelativePath = ref(saved.currentFolderRelativePath || "");
    const collectionId = ref(saved.collectionId || "");
    const collectionName = ref(saved.collectionName || "");
    const kindFilter = ref(saved.kindFilter || "");
    const dateRangeFilter = ref(saved.dateRangeFilter || "");
    const dateExactFilter = ref(saved.dateExactFilter || "");
    const workflowOnly = ref(saved.workflowOnly || false);
    const minRating = ref(saved.minRating || 0);
    const minSizeMB = ref(saved.minSizeMB || 0);
    const maxSizeMB = ref(saved.maxSizeMB || 0);
    const resolutionCompare = ref(saved.resolutionCompare || "gte");
    const minWidth = ref(saved.minWidth || 0);
    const minHeight = ref(saved.minHeight || 0);
    const maxWidth = ref(saved.maxWidth || 0);
    const maxHeight = ref(saved.maxHeight || 0);
    const workflowType = ref(saved.workflowType || "");
    const sort = ref(saved.sort || "mtime_desc");
    const searchQuery = ref(saved.searchQuery || "");
    const scrollTop = ref(saved.scrollTop || 0);
    const activeAssetId = ref(saved.activeAssetId || "");
    const selectedAssetIds = ref(saved.selectedAssetIds || []);
    const sidebarOpen = ref(saved.sidebarOpen || false);

    // ── transient state (never persisted) ────────────────────────────────────
    const lastGridCount = ref(0);
    const lastGridTotal = ref(0);
    const viewScope = ref("");
    const similarResults = ref([]);
    const similarTitle = ref("");
    const similarSourceAssetId = ref("");

    // ── persistence watcher ──────────────────────────────────────────────────
    let _saveTimer = null;
    const scheduleSave = () => {
        if (_saveTimer) clearTimeout(_saveTimer);
        _saveTimer = setTimeout(() => {
            _saveTimer = null;
            saveToStorage({
                scope: scope.value,
                customRootId: customRootId.value,
                customRootLabel: customRootLabel.value,
                currentFolderRelativePath: currentFolderRelativePath.value,
                collectionId: collectionId.value,
                collectionName: collectionName.value,
                kindFilter: kindFilter.value,
                dateRangeFilter: dateRangeFilter.value,
                dateExactFilter: dateExactFilter.value,
                workflowOnly: workflowOnly.value,
                minRating: minRating.value,
                minSizeMB: minSizeMB.value,
                maxSizeMB: maxSizeMB.value,
                resolutionCompare: resolutionCompare.value,
                minWidth: minWidth.value,
                minHeight: minHeight.value,
                maxWidth: maxWidth.value,
                maxHeight: maxHeight.value,
                workflowType: workflowType.value,
                sort: sort.value,
                searchQuery: searchQuery.value,
                scrollTop: scrollTop.value,
                activeAssetId: activeAssetId.value,
                selectedAssetIds: selectedAssetIds.value,
                sidebarOpen: sidebarOpen.value,
            });
        }, 750);
    };

    watch(
        [
            scope,
            customRootId,
            customRootLabel,
            currentFolderRelativePath,
            collectionId,
            collectionName,
            kindFilter,
            dateRangeFilter,
            dateExactFilter,
            workflowOnly,
            minRating,
            minSizeMB,
            maxSizeMB,
            resolutionCompare,
            minWidth,
            minHeight,
            maxWidth,
            maxHeight,
            workflowType,
            sort,
            searchQuery,
            scrollTop,
            activeAssetId,
            selectedAssetIds,
            sidebarOpen,
        ],
        scheduleSave,
        { deep: true },
    );

    // ── cross-tab sync ───────────────────────────────────────────────────────
    const _onStorage = (event) => {
        if (event.key !== STORAGE_KEY || !event.newValue) return;
        try {
            const updated = sanitize(JSON.parse(event.newValue));
            if (updated.scope !== undefined) scope.value = updated.scope;
            if (updated.customRootLabel !== undefined) customRootLabel.value = updated.customRootLabel;
            if (updated.searchQuery !== undefined) searchQuery.value = updated.searchQuery;
            if (updated.sort !== undefined) sort.value = updated.sort;
            if (updated.sidebarOpen !== undefined) sidebarOpen.value = updated.sidebarOpen;
        } catch {
            /* ignore */
        }
    };
    try {
        window.addEventListener("storage", _onStorage);
    } catch {
        /* ignore */
    }
    onScopeDispose(() => {
        try { window.removeEventListener("storage", _onStorage); } catch { /* ignore */ }
    });

    // ── actions ───────────────────────────────────────────────────────────────
    function resetFilters() {
        kindFilter.value = "";
        dateRangeFilter.value = "";
        dateExactFilter.value = "";
        workflowOnly.value = false;
        minRating.value = 0;
        minSizeMB.value = 0;
        maxSizeMB.value = 0;
        resolutionCompare.value = "gte";
        minWidth.value = 0;
        minHeight.value = 0;
        maxWidth.value = 0;
        maxHeight.value = 0;
        workflowType.value = "";
        searchQuery.value = "";
    }

    function clearSelection() {
        selectedAssetIds.value = [];
        activeAssetId.value = "";
    }

    function setSelection(ids, activeId = "") {
        selectedAssetIds.value = Array.isArray(ids) ? ids.map(String).filter(Boolean) : [];
        activeAssetId.value = activeId || selectedAssetIds.value[0] || "";
    }

    function navigateToScope(newScope, opts = {}) {
        scope.value = newScope;
        currentFolderRelativePath.value = opts.folder || "";
        collectionId.value = opts.collectionId || "";
        collectionName.value = opts.collectionName || "";
        customRootId.value = opts.customRootId || "";
        customRootLabel.value = opts.customRootLabel || "";
        viewScope.value = "";
        similarResults.value = [];
        similarTitle.value = "";
        similarSourceAssetId.value = "";
        clearSelection();
    }

    return {
        // persistent
        scope,
        customRootId,
        customRootLabel,
        currentFolderRelativePath,
        collectionId,
        collectionName,
        kindFilter,
        dateRangeFilter,
        dateExactFilter,
        workflowOnly,
        minRating,
        minSizeMB,
        maxSizeMB,
        resolutionCompare,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
        workflowType,
        sort,
        searchQuery,
        scrollTop,
        activeAssetId,
        selectedAssetIds,
        sidebarOpen,
        // transient
        lastGridCount,
        lastGridTotal,
        viewScope,
        similarResults,
        similarTitle,
        similarSourceAssetId,
        // actions
        resetFilters,
        clearSelection,
        setSelection,
        navigateToScope,
    };
});
