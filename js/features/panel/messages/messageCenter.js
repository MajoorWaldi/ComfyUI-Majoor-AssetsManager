const STORAGE_MESSAGES_KEY = "mjr_panel_messages_v1";
const STORAGE_LAST_READ_KEY = "mjr_panel_messages_last_read_v1";
const STORAGE_DISMISSED_BUILTIN_IDS_KEY = "mjr_panel_messages_dismissed_builtin_ids_v1";
const MAX_STORED_MESSAGES = 120;
const LOCAL_USER_GUIDE_URL = "/mjr/am/user-guide";
const ALLOWED_MESSAGE_LEVELS = new Set(["info", "success", "warning", "error"]);

export const PANEL_MESSAGES_EVENT = "mjr:panel-messages-changed";

let _loaded = false;
let _messages = [];
const BUILTIN_PANEL_MESSAGES = Object.freeze([
    {
        id: "whats-new-2026-03-17-version-2-4-2",
        title: "New Version 2.4.2",
        titleKey: "msg.whatsNew.title.version242",
        category: "Release",
        categoryKey: "msg.category.release",
        level: "success",
        createdAt: Date.parse("2026-03-17T09:00:00Z"),
        body: "Version 2.4.2 released: 3D model viewing support with thumbnail rendering, toast history tab in message popover, enhanced floating viewer with Picture-in-Picture pop-out. Fixed timeout leaks, optimized drag interactions, improved plugin hot-reload safety. See CHANGELOG for details.",
        bodyKey: "msg.whatsNew.body.version242",
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
    return `msg-${_safeNow()}-${Math.random().toString(36).slice(2, 8)}`;
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
