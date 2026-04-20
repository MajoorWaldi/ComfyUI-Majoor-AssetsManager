const STORAGE_MESSAGES_KEY = "mjr_panel_messages_v1";
const STORAGE_LAST_READ_KEY = "mjr_panel_messages_last_read_v1";
const STORAGE_DISMISSED_BUILTIN_IDS_KEY = "mjr_panel_messages_dismissed_builtin_ids_v1";
const MAX_STORED_MESSAGES = 120;
const LOCAL_USER_GUIDE_URL = "/mjr/am/user-guide";
const ALLOWED_MESSAGE_LEVELS = new Set(["info", "success", "warning", "error"]);

import { createUniqueId } from "../../../utils/ids.js";

export const PANEL_MESSAGES_EVENT = "mjr:panel-messages-changed";

let _loaded = false;
let _messages = [];
const BUILTIN_PANEL_MESSAGES = Object.freeze([
    {
        id: "whats-new-2026-03-29-version-2-4-3",
        title: "New Version 2.4.3",
        titleKey: "msg.whatsNew.title.version243",
        category: "Release",
        categoryKey: "msg.category.release",
        level: "success",
        createdAt: Date.parse("2026-03-29T09:00:00Z"),
        body: "Version 2.4.3 released: Improved assets metadata parsing, Grid Compare capability in floating viewer up to 4 Assets, ping pong loop in main Viewer player, job id and stack id in DB for better assets management, stack assets generated from same workflow job with same job ID, generated feed feature, lite version of grid in bottom tab. Code refactor for maintainability and various bug fixes. See CHANGELOG for details.",
        bodyKey: "msg.whatsNew.body.version243",
    },
    {
        id: "whats-new-2026-03-09-version-2-4-1",
        title: "New Version 2.4.1",
        titleKey: "msg.whatsNew.title.version241",
        category: "Release",
        categoryKey: "msg.category.release",
        level: "success",
        createdAt: Date.parse("2026-03-09T09:00:00Z"),
        body: "Version 2.4.1 released: CLIP-based semantic search with AI toggle, rgthree/easy node support, shortcut guide tab, upscaler model extraction. Fixed MFV memory leaks, workflow filters, SQL placeholders. Enhanced geninfo extraction, tag handling, calendar. See CHANGELOG for details.",
        bodyKey: "msg.whatsNew.body.version241",
    },
    {
        id: "whats-new-2026-03-06-floating-viewer-shortcuts",
        title: "What's New",
        titleKey: "msg.whatsNew.title.floatingViewerShortcuts",
        category: "Information",
        categoryKey: "msg.category.information",
        level: "info",
        createdAt: Date.parse("2026-03-06T09:00:00Z"),
        body: "Floating Viewer keyboard shortcuts added: Open/close MFV with V or Ctrl/Cmd+V, compare with C, Live Stream with L, and KSampler Preview with K. See the Shortcut Guide tab for the full list.",
        bodyKey: "msg.whatsNew.body.floatingViewerShortcuts",
    },
    {
        id: "whats-new-2026-03-05-pin-reference",
        title: "What's New",
        titleKey: "msg.whatsNew.title.pinReference",
        category: "Information",
        categoryKey: "msg.category.information",
        level: "info",
        createdAt: Date.parse("2026-03-05T10:00:00Z"),
        body: "Floating Viewer: new Pin Reference feature. You can now pin A or B, then compare quickly with selected assets in the grid while keeping the fixed reference.",
        bodyKey: "msg.whatsNew.body.pinReference",
    },
    {
        id: "whats-new-2026-03-05-vector-reset-keep-vectors",
        title: "What's New",
        titleKey: "msg.whatsNew.title.vectorResetKeepVectors",
        category: "Information",
        categoryKey: "msg.category.information",
        level: "info",
        createdAt: Date.parse("2026-03-05T12:00:00Z"),
        body: "Reset index and Delete DB now first ask whether to keep AI vectors. If you already have older indexed assets, keeping the vectors is recommended: a full reset without them can trigger a long Vector Backfill for old assets and temporarily increase RAM usage.",
        bodyKey: "msg.whatsNew.body.vectorResetKeepVectors",
    },
    {
        id: "whats-new-2026-03-05-local-user-guide",
        title: "What's New",
        titleKey: "msg.whatsNew.title.localUserGuide",
        category: "Information",
        categoryKey: "msg.category.information",
        level: "info",
        createdAt: Date.parse("2026-03-05T13:00:00Z"),
        body: "Open the local User Guide directly from your Assets Manager custom_nodes folder.",
        bodyKey: "msg.whatsNew.body.localUserGuide",
        actionLabel: "User Guide",
        actionLabelKey: "label.userGuide",
        actionUrl: LOCAL_USER_GUIDE_URL,
    },
    {
        id: "tip-2026-04-07-output-folder-override",
        title: "Tip",
        titleKey: "msg.tip.title.outputFolderOverride",
        category: "Information",
        categoryKey: "msg.category.information",
        level: "info",
        createdAt: Date.parse("2026-04-07T10:00:00Z"),
        body: "You can override the Generation Output Directory used by Majoor for generated files via Settings → Majoor Assets Manager › Advanced. Leave it empty to keep the current backend default, or set MJR_AM_OUTPUT_DIRECTORY / MAJOOR_OUTPUT_DIRECTORY before launching ComfyUI.",
        bodyKey: "msg.tip.body.outputFolderOverride",
        actionLabel: "Installation Guide",
        actionUrl: "docs/INSTALLATION.md",
    },
    {
        id: "tip-2026-04-07-index-folder-override",
        title: "Tip",
        category: "Information",
        categoryKey: "msg.category.information",
        level: "info",
        createdAt: Date.parse("2026-04-07T10:05:00Z"),
        body: "You can override the Index Database Directory used by Majoor for its SQLite database via Settings → Majoor Assets Manager › Advanced. This is useful when your assets stay on a NAS or slow drive and you want the index on a local SSD. Restart ComfyUI after changing it, or set MJR_AM_INDEX_DIRECTORY / MAJOOR_INDEX_DIRECTORY before launch.",
        actionLabel: "DB Maintenance Guide",
        actionUrl: "docs/DB_MAINTENANCE.md",
    },
    {
        id: "development-2026-04-03-vue-refactoring",
        title: "Vue 3 Refactoring",
        titleKey: "msg.development.title.vueRefactoring",
        category: "Development",
        categoryKey: "msg.category.development",
        level: "info",
        createdAt: Date.parse("2026-04-03T10:00:00Z"),
        body: "Frontend modernization ongoing: Core UI components are being migrated to Vue 3 for better maintainability and compatibility with new ComfyUI frontend. This ensures long-term support and cleaner architecture.",
        bodyKey: "msg.development.body.vueRefactoring",
        actionLabel: "View Progress",
        actionLabelKey: "label.viewProgress",
        actionUrl: "docs/VUE_MIGRATION_PLAN.md",
    },
    {
        id: "whats-new-2026-04-10-mfv-multi-pin-sidebar",
        title: "What's New — Floating Viewer",
        titleKey: "msg.whatsNew.title.mfvMultiPinSidebar",
        category: "Information",
        categoryKey: "msg.category.information",
        level: "info",
        createdAt: Date.parse("2026-04-10T09:00:00Z"),
        body: "Floating Viewer upgraded: Multi-Pin references (A/B/C/D toggle buttons) let you pin up to 4 images and compare them side-by-side. A new Node Parameters sidebar shows the widgets of the workflow node that produced the current image — edit prompts, seeds, and samplers directly inside the viewer. Expandable text areas, Run button, and toolbar layout improvements.",
        bodyKey: "msg.whatsNew.body.mfvMultiPinSidebar",
        actionLabel: "Viewer Tutorial",
        actionLabelKey: "label.viewerTutorial",
        actionUrl: "docs/VIEWER_FEATURE_TUTORIAL.md",
    },
    {
        id: "whats-new-2026-04-10-mfv-sidebar-position-setting",
        title: "What's New — Sidebar Position Setting",
        titleKey: "msg.whatsNew.title.mfvSidebarPositionSetting",
        category: "Information",
        categoryKey: "msg.category.information",
        level: "info",
        createdAt: Date.parse("2026-04-10T09:05:00Z"),
        body: "New setting: Node Parameters sidebar position. Go to Settings → Majoor Assets Manager › Viewer and choose where to place the Node Parameters sidebar — right (default), left, or bottom. The change applies immediately without page reload.",
        bodyKey: "msg.whatsNew.body.mfvSidebarPositionSetting",
    },
    {
        id: "tip-2026-04-12-generation-time-persistence",
        title: "Tip — Generation Time After Reset",
        titleKey: "msg.tip.title.generationTimePersistence",
        emoji: "⏱️",
        category: "Information",
        categoryKey: "msg.category.information",
        level: "warning",
        createdAt: Date.parse("2026-04-12T10:00:00Z"),
        body: "Generation time (generation_time_ms) is computed at runtime and stored in the index database. After a Reset Index or Delete DB, this value is lost unless it was persisted inside the file itself. To keep generation time across resets, use the Majoor Save Image 💾 or Majoor Save Video 🎬 nodes instead of the built-in Save nodes — they embed generation_time_ms directly in PNG text chunks and MP4 container metadata, so it is re-extracted automatically on re-index.",
        bodyKey: "msg.tip.body.generationTimePersistence",
        actionLabel: "Custom Nodes Docs",
        actionLabelKey: "label.customNodesDocs",
        actionUrl: "docs/CUSTOM_NODES.md",
    },
    {
        id: "whats-new-2026-04-12-topbar-mfv-button",
        title: "What's New — Floating Viewer Topbar Button",
        titleKey: "msg.whatsNew.title.topbarMfvButton",
        emoji: "👁️",
        category: "Information",
        categoryKey: "msg.category.information",
        level: "info",
        createdAt: Date.parse("2026-04-12T10:05:00Z"),
        body: "A new Viewer button now appears in the ComfyUI top action bar. Click it to toggle the Majoor Floating Viewer on or off without opening the sidebar. The button highlights when the viewer is active and updates in real time.",
        bodyKey: "msg.whatsNew.body.topbarMfvButton",
    },
    {
        id: "whats-new-2026-04-20-version-2-4-6",
        title: "New Version 2.4.6",
        titleKey: "msg.whatsNew.title.version246",
        emoji: "🚀",
        category: "Release",
        categoryKey: "msg.category.release",
        level: "success",
        createdAt: Date.parse("2026-04-20T09:00:00Z"),
        body: "Version 2.4.6 released: Various bug fixes and performance & fluidity improvements. Improved concatenate support for default and custom nodes (by Forsion07). Added support helpers for Api Node and Ernie Image. Live Stream in Floating Viewer is now disabled by default. See CHANGELOG for details.",
        bodyKey: "msg.whatsNew.body.version246",
        actionLabel: "Changelog",
        actionLabelKey: "label.changelog",
        actionUrl: "CHANGELOG.md",
    },
    {
        id: "tip-2026-04-20-mfv-live-stream-preview-defaults",
        title: "Tip — Floating Viewer Auto-Open",
        titleKey: "msg.tip.title.mfvLivePreviewDefaults",
        emoji: "💡",
        category: "Information",
        categoryKey: "msg.category.information",
        level: "info",
        createdAt: Date.parse("2026-04-20T10:00:00Z"),
        body: "Live Stream (green button in the viewer) and KSampler Preview can be activated by default via Settings → Majoor Assets Manager › Viewer. When Live Stream is on, clicking a Load Image node or when a generation ends will automatically open the Floating Viewer and display the result. KSampler Preview streams the denoising steps live. Both toggles can be set as the default state so the viewer is always ready.",
        bodyKey: "msg.tip.body.mfvLivePreviewDefaults",
        actionLabel: "Settings Guide",
        actionLabelKey: "label.settingsGuide",
        actionUrl: "docs/SETTINGS_CONFIGURATION.md",
    },
]);
const BUILTIN_MESSAGE_IDS = new Set(
    BUILTIN_PANEL_MESSAGES.map((msg) => String(msg?.id || "").trim()).filter(Boolean),
);

function _toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function _safeNow() {
    return Date.now();
}

function _makeId() {
    return createUniqueId(`msg-${_safeNow()}-`, 6);
}

function _normalizeMessageLevel(value) {
    const raw = String(value || "")
        .trim()
        .toLowerCase();
    if (raw === "warn") return "warning";
    if (raw === "danger") return "error";
    return ALLOWED_MESSAGE_LEVELS.has(raw) ? raw : "info";
}

function _isBuiltinMessageId(id) {
    return BUILTIN_MESSAGE_IDS.has(String(id || "").trim());
}

function _normalizeMessage(input = {}) {
    const id = String(input?.id || "").trim() || _makeId();
    const title = String(input?.title || "").trim() || "Info";
    const titleKey = String(input?.titleKey || "").trim();
    const emoji = String(input?.emoji || "").trim();
    const body = String(input?.body || "").trim();
    const bodyKey = String(input?.bodyKey || "").trim();
    const category = String(input?.category || "").trim() || "Info";
    const categoryKey = String(input?.categoryKey || "").trim();
    const createdAt = _toNumber(input?.createdAt, _safeNow());
    const level = _normalizeMessageLevel(input?.level);
    const actionLabel = String(input?.actionLabel || "").trim();
    const actionLabelKey = String(input?.actionLabelKey || "").trim();
    const actionUrl = String(input?.actionUrl || "").trim();
    return {
        id,
        title,
        titleKey,
        emoji,
        body,
        bodyKey,
        category,
        categoryKey,
        createdAt,
        level,
        actionLabel,
        actionLabelKey,
        actionUrl,
    };
}

function _readStorageJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

function _writeStorageJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // ignore storage quota/privacy errors
    }
}

function _readLastReadAt() {
    try {
        return _toNumber(localStorage.getItem(STORAGE_LAST_READ_KEY), 0);
    } catch {
        return 0;
    }
}

function _writeLastReadAt(ts) {
    try {
        localStorage.setItem(STORAGE_LAST_READ_KEY, String(_toNumber(ts, _safeNow())));
    } catch {
        // ignore storage quota/privacy errors
    }
}

function _readDismissedBuiltinIds() {
    const raw = _readStorageJson(STORAGE_DISMISSED_BUILTIN_IDS_KEY, []);
    const ids = Array.isArray(raw) ? raw : [];
    return new Set(
        ids.map((id) => String(id || "").trim()).filter((id) => _isBuiltinMessageId(id)),
    );
}

function _writeDismissedBuiltinIds(ids) {
    const safeIds = Array.from(ids || [])
        .map((id) => String(id || "").trim())
        .filter((id) => _isBuiltinMessageId(id));
    _writeStorageJson(STORAGE_DISMISSED_BUILTIN_IDS_KEY, safeIds);
}

function _dismissBuiltinMessage(id) {
    const key = String(id || "").trim();
    if (!_isBuiltinMessageId(key)) return false;
    const dismissedIds = _readDismissedBuiltinIds();
    if (dismissedIds.has(key)) return false;
    dismissedIds.add(key);
    _writeDismissedBuiltinIds(dismissedIds);
    return true;
}

function _restoreBuiltinMessage(id) {
    const key = String(id || "").trim();
    if (!_isBuiltinMessageId(key)) return false;
    const dismissedIds = _readDismissedBuiltinIds();
    if (!dismissedIds.delete(key)) return false;
    _writeDismissedBuiltinIds(dismissedIds);
    return true;
}

function _sortMessages() {
    _messages.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    if (_messages.length > MAX_STORED_MESSAGES) {
        _messages = _messages.slice(0, MAX_STORED_MESSAGES);
    }
}

function _persistMessages() {
    _writeStorageJson(STORAGE_MESSAGES_KEY, _messages);
}

function _seedBuiltinMessages() {
    const dismissedBuiltinIds = _readDismissedBuiltinIds();
    let changed = false;
    for (const raw of BUILTIN_PANEL_MESSAGES) {
        const normalized = _normalizeMessage(raw);
        if (dismissedBuiltinIds.has(normalized.id)) {
            continue;
        }
        const idx = _messages.findIndex((m) => m.id === normalized.id);
        if (idx < 0) {
            _messages.push(normalized);
            changed = true;
            continue;
        }
        const prev = _messages[idx];
        const merged = {
            ...prev,
            ...normalized,
            // Keep the original publish timestamp if already present.
            createdAt: _toNumber(prev?.createdAt, normalized.createdAt),
        };
        if (JSON.stringify(prev) !== JSON.stringify(merged)) {
            _messages[idx] = merged;
            changed = true;
        }
    }
    if (!changed) return false;
    _sortMessages();
    _persistMessages();
    return true;
}

function _emitChanged() {
    try {
        window.dispatchEvent(
            new CustomEvent(PANEL_MESSAGES_EVENT, {
                detail: {
                    total: _messages.length,
                    unread: getPanelUnreadCount(),
                },
            }),
        );
    } catch (e) {
        console.debug?.(e);
    }
}

function _ensureLoaded() {
    if (_loaded) return;
    _loaded = true;
    const parsed = _readStorageJson(STORAGE_MESSAGES_KEY, []);
    const safeArray = Array.isArray(parsed) ? parsed : [];
    _messages = safeArray.map(_normalizeMessage);
    _sortMessages();
}

export function ensurePanelMessagesReady() {
    _ensureLoaded();
    if (_seedBuiltinMessages()) _emitChanged();
}

export function listPanelMessages() {
    _ensureLoaded();
    return _messages.map((message) => ({ ...message }));
}

export function getPanelUnreadCount() {
    _ensureLoaded();
    const lastReadAt = _readLastReadAt();
    return _messages.reduce((count, msg) => {
        return count + (Number(msg.createdAt || 0) > lastReadAt ? 1 : 0);
    }, 0);
}

export function getPanelLastReadAt() {
    _ensureLoaded();
    return _readLastReadAt();
}

export function markPanelMessagesRead({ upTo = _safeNow() } = {}) {
    _ensureLoaded();
    _writeLastReadAt(_toNumber(upTo, _safeNow()));
    _emitChanged();
}

export function upsertPanelMessage(message) {
    _ensureLoaded();
    const normalized = _normalizeMessage(message);
    _restoreBuiltinMessage(normalized.id);
    const idx = _messages.findIndex((m) => m.id === normalized.id);
    let stored;
    if (idx >= 0) {
        const prev = _messages[idx];
        stored = {
            ...prev,
            ...normalized,
            // Keep original publish timestamp unless explicitly provided.
            createdAt: _toNumber(
                message?.createdAt,
                _toNumber(prev?.createdAt, normalized.createdAt),
            ),
        };
        _messages[idx] = stored;
    } else {
        stored = { ...normalized };
        _messages.push(stored);
    }
    _sortMessages();
    _persistMessages();
    _emitChanged();
    return { ...stored };
}

export function addPanelMessage(message) {
    return upsertPanelMessage(message);
}

export function removePanelMessage(id) {
    _ensureLoaded();
    const key = String(id || "").trim();
    if (!key) return false;
    const next = _messages.filter((m) => m.id !== key);
    if (next.length === _messages.length) return false;
    _messages = next;
    _dismissBuiltinMessage(key);
    _persistMessages();
    _emitChanged();
    return true;
}

export function clearPanelMessages() {
    _ensureLoaded();
    const dismissedBuiltinIds = _readDismissedBuiltinIds();
    for (const builtinId of BUILTIN_MESSAGE_IDS) {
        dismissedBuiltinIds.add(builtinId);
    }
    _writeDismissedBuiltinIds(dismissedBuiltinIds);
    _messages = [];
    _persistMessages();
    _writeLastReadAt(_safeNow());
    _emitChanged();
}
