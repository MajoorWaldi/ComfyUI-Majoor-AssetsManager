import { t } from "../../../app/i18n.js";
import {
    PANEL_MESSAGES_EVENT,
    ensurePanelMessagesReady,
    getPanelLastReadAt,
    getPanelUnreadCount,
    listPanelMessages,
    markPanelMessagesRead,
} from "./messageCenter.js";
import {
    TOAST_HISTORY_EVENT,
    clearToastHistory,
    getToastHistoryUnreadCount,
    listToastHistory,
    markToastHistoryRead,
} from "./toastHistory.js";
import { createShortcutGuidePanel } from "./shortcutGuide.js";

const ALLOWED_MESSAGE_LEVELS = new Set(["info", "success", "warning", "error"]);

function formatMessageDate(ts) {
    const stamp = Number(ts);
    if (!Number.isFinite(stamp) || stamp <= 0) return "";
    try {
        return new Date(stamp).toLocaleString([], {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "";
    }
}

function resolveMessageText(entry, keyField, fallbackField, fallbackText) {
    const key = String(entry?.[keyField] || "").trim();
    const fallback = String(entry?.[fallbackField] || fallbackText || "").trim() || String(fallbackText || "");
    return key ? t(key, fallback) : fallback;
}

function normalizeMessageLevel(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "warn") return "warning";
    if (raw === "danger") return "error";
    return ALLOWED_MESSAGE_LEVELS.has(raw) ? raw : "info";
}

function resolveSafeActionUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
        const baseHref = String(globalThis?.window?.location?.href || "http://127.0.0.1/");
        const url = new URL(raw, baseHref);
        const protocol = String(url.protocol || "").toLowerCase();
        return protocol === "http:" || protocol === "https:" ? url.href : "";
    } catch {
        return "";
    }
}

function resolveMessageEmoji(entry) {
    const explicit = String(entry?.emoji || "").trim();
    if (explicit) return explicit;

    const level = normalizeMessageLevel(entry?.level);
    if (level === "success") return "\u2705";
    if (level === "warning") return "\u26A0\uFE0F";
    if (level === "error") return "\u274C";
    return "\uD83D\uDCA1";
}

function getHistoryTypeIcon(type) {
    switch (String(type || "").toLowerCase()) {
        case "success": return "✅";
        case "warning": return "⚠️";
        case "error":   return "❌";
        default:        return "💡";
    }
}

function setTabState({
    activeTab = "messages",
    title = null,
    messagePopover = null,
    messageTabBtn = null,
    historyTabBtn = null,
    shortcutsTabBtn = null,
    messageList = null,
    historyPanel = null,
    shortcutsPanel = null,
    markReadBtn = null,
} = {}) {
    const isMessages = activeTab === "messages";
    const isHistory = activeTab === "history";
    const isShortcuts = activeTab === "shortcuts";

    const titleText = isMessages
        ? t("label.messages", "Messages")
        : isHistory
        ? t("label.toastHistory", "History")
        : t("msg.shortcuts.title", "Shortcut Guide");
    try {
        messageTabBtn?.classList.toggle("is-active", isMessages);
        messageTabBtn?.setAttribute("aria-selected", isMessages ? "true" : "false");
        historyTabBtn?.classList.toggle("is-active", isHistory);
        historyTabBtn?.setAttribute("aria-selected", isHistory ? "true" : "false");
        shortcutsTabBtn?.classList.toggle("is-active", isShortcuts);
        shortcutsTabBtn?.setAttribute("aria-selected", isShortcuts ? "true" : "false");
    } catch (e) { console.debug?.(e); }
    try {
        if (title) title.textContent = titleText;
        messagePopover?.setAttribute?.("aria-label", titleText);
        if (messageList) {
            messageList.hidden = !isMessages;
            messageList.style.display = isMessages ? "" : "none";
            messageList.setAttribute("aria-hidden", isMessages ? "false" : "true");
        }
        if (historyPanel) {
            historyPanel.hidden = !isHistory;
            historyPanel.style.display = isHistory ? "" : "none";
            historyPanel.setAttribute("aria-hidden", isHistory ? "false" : "true");
        }
        if (shortcutsPanel) {
            shortcutsPanel.hidden = !isShortcuts;
            shortcutsPanel.style.display = isShortcuts ? "" : "none";
            shortcutsPanel.setAttribute("aria-hidden", isShortcuts ? "false" : "true");
        }
        if (markReadBtn) markReadBtn.hidden = !isMessages;
    } catch (e) { console.debug?.(e); }
}

export function bindMessagePopoverController({
    messageBtn = null,
    messagePopover = null,
    title = null,
    messageList = null,
    historyTabBtn = null,
    historyTabBadge = null,
    historyPanel = null,
    shortcutsPanel = null,
    messageTabBtn = null,
    shortcutsTabBtn = null,
    markReadBtn = null,
    popovers = null,
    onBeforeToggle = null,
    signal = null,
} = {}) {
    ensurePanelMessagesReady();
    let activeTab = "messages";

    const syncExpandedState = () => {
        const isOpen = messagePopover?.style?.display === "block";
        try {
            messageBtn?.setAttribute("aria-expanded", isOpen ? "true" : "false");
        } catch (e) { console.debug?.(e); }
        try {
            messagePopover?.setAttribute("aria-hidden", isOpen ? "false" : "true");
        } catch (e) { console.debug?.(e); }
    };

    const renderMessagesPopover = () => {
        if (!messageList) return;
        const entries = listPanelMessages();
        const lastReadAt = getPanelLastReadAt();
        messageList.replaceChildren();
        if (!entries.length) {
            const empty = document.createElement("div");
            empty.className = "mjr-messages-empty";
            empty.textContent = t("msg.noMessages", "No messages for now.");
            messageList.appendChild(empty);
            return;
        }

        for (const entry of entries) {
            const item = document.createElement("article");
            item.className = "mjr-message-item";
            const level = normalizeMessageLevel(entry?.level);
            item.classList.add(`mjr-message-item--${level}`);
            const createdAt = Number(entry?.createdAt || 0);
            const unread = createdAt > Number(lastReadAt || 0);
            if (unread) item.classList.add("mjr-message-item--unread");

            const head = document.createElement("div");
            head.className = "mjr-message-item-head";

            const titleWrap = document.createElement("div");
            titleWrap.className = "mjr-message-item-title-wrap";

            const emoji = document.createElement("span");
            emoji.className = "mjr-message-item-emoji";
            emoji.textContent = resolveMessageEmoji(entry);
            emoji.setAttribute("aria-hidden", "true");

            const titleEl = document.createElement("div");
            titleEl.className = "mjr-message-item-title";
            titleEl.textContent = resolveMessageText(entry, "titleKey", "title", t("label.info", "Info"));

            const category = document.createElement("span");
            category.className = "mjr-message-item-category";
            category.textContent = resolveMessageText(entry, "categoryKey", "category", t("label.info", "Info"));

            titleWrap.appendChild(emoji);
            titleWrap.appendChild(titleEl);
            head.appendChild(titleWrap);
            head.appendChild(category);

            const meta = document.createElement("div");
            meta.className = "mjr-message-item-meta";
            meta.textContent = formatMessageDate(createdAt);

            const body = document.createElement("div");
            body.className = "mjr-message-item-body";
            body.textContent = resolveMessageText(entry, "bodyKey", "body", "");

            item.appendChild(head);
            if (meta.textContent) item.appendChild(meta);
            if (body.textContent) item.appendChild(body);

            const actionUrl = resolveSafeActionUrl(entry?.actionUrl);
            const actionLabel = resolveMessageText(entry, "actionLabelKey", "actionLabel", t("label.readMe", "Read Me"));
            if (actionUrl && actionLabel) {
                const action = document.createElement("a");
                action.className = "mjr-message-item-action";
                action.href = actionUrl;
                action.target = "_blank";
                action.rel = "noopener noreferrer";
                action.textContent = actionLabel;
                item.appendChild(action);
            }
            messageList.appendChild(item);
        }
    };

    const renderHistoryPanel = () => {
        if (!historyPanel) return;
        const entries = listToastHistory();

        // Build header with clear button (only once)
        let historyList = historyPanel.querySelector(".mjr-history-list");
        if (!historyList) {
            const historyHead = document.createElement("div");
            historyHead.className = "mjr-history-head";

            const historyHeadLabel = document.createElement("span");
            historyHeadLabel.className = "mjr-history-head-label";
            historyHeadLabel.textContent = t("label.recentActivity", "Recent activity");

            const clearBtn = document.createElement("button");
            clearBtn.type = "button";
            clearBtn.className = "mjr-btn mjr-history-clear-btn";
            clearBtn.textContent = t("btn.clearHistory", "Clear");
            clearBtn.title = t("tooltip.clearToastHistory", "Clear toast history");
            clearBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                clearToastHistory();
                renderHistoryPanel();
            }, signal ? { signal } : undefined);

            historyHead.appendChild(historyHeadLabel);
            historyHead.appendChild(clearBtn);

            historyList = document.createElement("div");
            historyList.className = "mjr-history-list";

            historyPanel.replaceChildren(historyHead, historyList);
        }

        historyList.replaceChildren();

        if (!entries.length) {
            const empty = document.createElement("div");
            empty.className = "mjr-messages-empty";
            empty.textContent = t("msg.noHistory", "No recent activity.");
            historyList.appendChild(empty);
            return;
        }

        for (const entry of entries) {
            const item = document.createElement("div");
            item.className = `mjr-history-item mjr-history-item--${String(entry.type || "info")}`;

            const icon = document.createElement("span");
            icon.className = "mjr-history-item-icon";
            icon.textContent = getHistoryTypeIcon(entry.type);
            icon.setAttribute("aria-hidden", "true");

            const content = document.createElement("div");
            content.className = "mjr-history-item-content";

            const msg = document.createElement("div");
            msg.className = "mjr-history-item-msg";
            msg.textContent = String(entry.message || "");

            const time = document.createElement("div");
            time.className = "mjr-history-item-time";
            time.textContent = formatMessageDate(entry.createdAt);

            content.appendChild(msg);
            if (time.textContent) content.appendChild(time);
            item.appendChild(icon);
            item.appendChild(content);
            historyList.appendChild(item);
        }
    };

    const updateHistoryTabBadge = () => {
        if (!historyTabBadge) return;
        const unread = getToastHistoryUnreadCount();
        historyTabBadge.style.display = unread > 0 ? "inline-block" : "none";
    };

    const renderShortcutsPanel = () => {
        if (!shortcutsPanel) return;
        if (shortcutsPanel.childNodes.length > 0) return;
        shortcutsPanel.replaceChildren(createShortcutGuidePanel());
    };

    const updateMessageButtonState = () => {
        if (!messageBtn) return;
        const unreadCount = Number(getPanelUnreadCount() || 0);
        const badge = messageBtn.querySelector(".mjr-message-badge");
        const titleText = unreadCount > 0
            ? t("tooltip.openMessagesUnread", "Messages ({count} unread)", { count: unreadCount })
            : t("tooltip.openMessages", "Messages and updates");
        messageBtn.classList.toggle("mjr-message-has-unread", unreadCount > 0);
        messageBtn.title = titleText;
        messageBtn.setAttribute("aria-label", titleText);
        if (!badge) return;
        if (unreadCount <= 0) {
            badge.style.display = "none";
            badge.textContent = "";
            return;
        }
        badge.style.display = "inline-flex";
        badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
    };

    const refreshMessagesUI = () => {
        updateMessageButtonState();
        updateHistoryTabBadge();
        if (messagePopover?.style?.display === "block") {
            if (activeTab === "messages") renderMessagesPopover();
            if (activeTab === "history") renderHistoryPanel();
        }
    };

    const listenerOptions = signal ? { signal } : undefined;

    try {
        window.addEventListener(PANEL_MESSAGES_EVENT, refreshMessagesUI, listenerOptions);
    } catch (e) { console.debug?.(e); }
    try {
        window.addEventListener(TOAST_HISTORY_EVENT, () => {
            updateHistoryTabBadge();
            if (messagePopover?.style?.display === "block" && activeTab === "history") {
                renderHistoryPanel();
            }
        }, listenerOptions);
    } catch (e) { console.debug?.(e); }
    try {
        if (messageBtn && messagePopover) {
            if (!messagePopover.id) messagePopover.id = "mjr-messages-popover";
            messageBtn.setAttribute("aria-haspopup", "dialog");
            messageBtn.setAttribute("aria-controls", messagePopover.id);
        }
    } catch (e) { console.debug?.(e); }

    let expandedObserver = null;
    try {
        if (typeof MutationObserver !== "undefined" && messagePopover) {
            expandedObserver = new MutationObserver(syncExpandedState);
            expandedObserver.observe(messagePopover, {
                attributes: true,
                attributeFilter: ["style"],
            });
        }
    } catch (e) { console.debug?.(e); }
    try {
        signal?.addEventListener?.("abort", () => expandedObserver?.disconnect?.(), { once: true });
    } catch (e) { console.debug?.(e); }

    updateMessageButtonState();
    updateHistoryTabBadge();
    syncExpandedState();
    setTabState({
        activeTab,
        title,
        messagePopover,
        messageTabBtn,
        historyTabBtn,
        shortcutsTabBtn,
        messageList,
        historyPanel,
        shortcutsPanel,
        markReadBtn,
    });

    const showMessagesTab = () => {
        activeTab = "messages";
        setTabState({
            activeTab,
            title,
            messagePopover,
            messageTabBtn,
            historyTabBtn,
            shortcutsTabBtn,
            messageList,
            historyPanel,
            shortcutsPanel,
            markReadBtn,
        });
        renderMessagesPopover();
        markPanelMessagesRead();
        updateMessageButtonState();
    };

    const showHistoryTab = () => {
        activeTab = "history";
        setTabState({
            activeTab,
            title,
            messagePopover,
            messageTabBtn,
            historyTabBtn,
            shortcutsTabBtn,
            messageList,
            historyPanel,
            shortcutsPanel,
            markReadBtn,
        });
        renderHistoryPanel();
        markToastHistoryRead();
        updateHistoryTabBadge();
    };

    const showShortcutsTab = () => {
        activeTab = "shortcuts";
        setTabState({
            activeTab,
            title,
            messagePopover,
            messageTabBtn,
            historyTabBtn,
            shortcutsTabBtn,
            messageList,
            historyPanel,
            shortcutsPanel,
            markReadBtn,
        });
        renderShortcutsPanel();
    };

    messageBtn?.addEventListener("click", (e) => {
        if (!messagePopover || !popovers || !messageBtn) return;
        e.stopPropagation();
        activeTab = "messages";
        renderMessagesPopover();
        renderShortcutsPanel();
        setTabState({
            activeTab,
            title,
            messagePopover,
            messageTabBtn,
            historyTabBtn,
            shortcutsTabBtn,
            messageList,
            historyPanel,
            shortcutsPanel,
            markReadBtn,
        });
        try {
            if (typeof onBeforeToggle === "function") onBeforeToggle();
        } catch (err) { console.debug?.(err); }
        popovers.toggle(messagePopover, messageBtn);
        if (messagePopover?.style?.display === "block") {
            markPanelMessagesRead();
        }
        syncExpandedState();
        updateMessageButtonState();
    }, listenerOptions);

    messageTabBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showMessagesTab();
    }, listenerOptions);

    historyTabBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showHistoryTab();
    }, listenerOptions);

    shortcutsTabBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showShortcutsTab();
    }, listenerOptions);

    markReadBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        markPanelMessagesRead();
        renderMessagesPopover();
        updateMessageButtonState();
    }, listenerOptions);

    return {
        refresh: refreshMessagesUI,
        render: renderMessagesPopover,
        updateButtonState: updateMessageButtonState,
        showMessagesTab,
        showHistoryTab,
        showShortcutsTab,
        close: () => {
            if (!messagePopover || !popovers) return;
            popovers.close(messagePopover);
            syncExpandedState();
        },
    };
}
