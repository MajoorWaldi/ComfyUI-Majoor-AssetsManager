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
    const fallback =
        String(entry?.[fallbackField] || fallbackText || "").trim() || String(fallbackText || "");
    return key ? t(key, fallback) : fallback;
}

function normalizeMessageLevel(value) {
    const raw = String(value || "")
        .trim()
        .toLowerCase();
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
        case "success":
            return "✅";
        case "warning":
            return "⚠️";
        case "error":
            return "❌";
        default:
            return "💡";
    }
}

function formatHistoryDuration(entry) {
    if (entry?.persistent) return "persistent";
    const durationMs = Number(entry?.durationMs);
    if (!Number.isFinite(durationMs) || durationMs <= 0) return "";
    if (durationMs < 10000) return `${(durationMs / 1000).toFixed(1)}s`;
    return `${Math.round(durationMs / 1000)}s`;
}

function formatHistoryStatus(status) {
    const raw = String(status || "").trim().toLowerCase();
    if (!raw) return "";
    return raw.replace(/[_-]+/g, " ");
}

function formatHistoryProgressSummary(entry) {
    const progress = entry?.progress;
    if (!progress || typeof progress !== "object") return "";
    const label = String(progress.label || "").trim();
    const current = Number(progress.current);
    const total = Number(progress.total);
    const indexed = Number(progress.indexed);
    const skipped = Number(progress.skipped);
    const errors = Number(progress.errors);
    const parts = [];
    if (label) parts.push(label);
    if (Number.isFinite(current) && Number.isFinite(total) && total > 0) {
        parts.push(`${current}/${total}`);
    }
    if (Number.isFinite(indexed)) parts.push(`indexed ${indexed}`);
    if (Number.isFinite(skipped)) parts.push(`skipped ${skipped}`);
    if (Number.isFinite(errors) && errors > 0) parts.push(`errors ${errors}`);
    return parts.join(" | ");
}

function getHistoryProgressPercent(entry) {
    const progress = entry?.progress;
    if (!progress || typeof progress !== "object") return null;
    const percent = Number(progress.percent);
    if (Number.isFinite(percent)) return Math.max(0, Math.min(100, Math.round(percent)));
    const current = Number(progress.current);
    const total = Number(progress.total);
    if (Number.isFinite(current) && Number.isFinite(total) && total > 0) {
        return Math.max(0, Math.min(100, Math.round((current / total) * 100)));
    }
    return null;
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
        messageTabBtn?.setAttribute("tabindex", isMessages ? "0" : "-1");
        historyTabBtn?.classList.toggle("is-active", isHistory);
        historyTabBtn?.setAttribute("aria-selected", isHistory ? "true" : "false");
        historyTabBtn?.setAttribute("tabindex", isHistory ? "0" : "-1");
        shortcutsTabBtn?.classList.toggle("is-active", isShortcuts);
        shortcutsTabBtn?.setAttribute("aria-selected", isShortcuts ? "true" : "false");
        shortcutsTabBtn?.setAttribute("tabindex", isShortcuts ? "0" : "-1");
    } catch (e) {
        console.debug?.(e);
    }
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
    } catch (e) {
        console.debug?.(e);
    }
}

export function bindMessagePopoverController({
    messageBtn = null,
    messagePopover = null,
    title = null,
    messageList = null,
    historyTabBtn = null,
    historyTabBadge = null,
    historyTabCount = null,
    historyPanel = null,
    shortcutsPanel = null,
    messageTabBtn = null,
    messageTabBadge = null,
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
        } catch (e) {
            console.debug?.(e);
        }
        try {
            messagePopover?.setAttribute("aria-hidden", isOpen ? "false" : "true");
        } catch (e) {
            console.debug?.(e);
        }
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
            titleEl.textContent = resolveMessageText(
                entry,
                "titleKey",
                "title",
                t("label.info", "Info"),
            );

            const category = document.createElement("span");
            category.className = "mjr-message-item-category";
            category.textContent = resolveMessageText(
                entry,
                "categoryKey",
                "category",
                t("label.info", "Info"),
            );

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
            const actionLabel = resolveMessageText(
                entry,
                "actionLabelKey",
                "actionLabel",
                t("label.readMe", "Read Me"),
            );
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
            clearBtn.addEventListener(
                "click",
                (e) => {
                    e.stopPropagation();
                    clearToastHistory();
                    renderHistoryPanel();
                },
                signal ? { signal } : undefined,
            );

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

            const titleText = String(entry.title || "").trim();
            const detailText = String(entry.detail || "").trim();
            const fallbackMessage = String(entry.message || "").trim();
            const primaryText = titleText || fallbackMessage;
            const secondaryText = titleText && detailText ? detailText : titleText ? "" : detailText;

            const msg = document.createElement("div");
            msg.className = titleText ? "mjr-history-item-title" : "mjr-history-item-msg";
            msg.textContent = primaryText;

            const detail = document.createElement("div");
            detail.className = "mjr-history-item-detail";
            detail.textContent = secondaryText;

            const meta = document.createElement("div");
            meta.className = "mjr-history-item-meta";

            const time = document.createElement("span");
            time.className = "mjr-history-item-time";
            time.textContent = formatMessageDate(entry.createdAt);

            const duration = document.createElement("span");
            duration.className = "mjr-history-item-chip";
            duration.textContent = formatHistoryDuration(entry);

            const source = document.createElement("span");
            source.className = "mjr-history-item-chip";
            source.textContent = String(entry.source || "").trim();

            const status = document.createElement("span");
            status.className = "mjr-history-item-chip";
            status.textContent = formatHistoryStatus(entry.status);

            content.appendChild(msg);
            if (detail.textContent) content.appendChild(detail);
            if (time.textContent) meta.appendChild(time);
            if (duration.textContent) meta.appendChild(duration);
            if (status.textContent) meta.appendChild(status);
            if (source.textContent) meta.appendChild(source);
            if (meta.childNodes.length) content.appendChild(meta);

            const progressSummaryText = formatHistoryProgressSummary(entry);
            const progressPercent = getHistoryProgressPercent(entry);
            if (progressSummaryText || progressPercent !== null) {
                const progressWrap = document.createElement("div");
                progressWrap.className = "mjr-history-item-progress";

                if (progressSummaryText) {
                    const progressSummary = document.createElement("div");
                    progressSummary.className = "mjr-history-item-progress-summary";
                    progressSummary.textContent = progressSummaryText;
                    progressWrap.appendChild(progressSummary);
                }

                if (progressPercent !== null) {
                    const progressBar = document.createElement("div");
                    progressBar.className = "mjr-history-item-progress-bar";

                    const progressFill = document.createElement("div");
                    progressFill.className = "mjr-history-item-progress-fill";
                    progressFill.style.width = `${progressPercent}%`;

                    progressBar.appendChild(progressFill);
                    progressWrap.appendChild(progressBar);
                }

                content.appendChild(progressWrap);
            }

            const actionUrl = resolveSafeActionUrl(entry?.actionUrl);
            const actionLabel = String(entry?.actionLabel || "").trim();
            if (actionUrl && actionLabel) {
                const action = document.createElement("a");
                action.className = "mjr-history-item-action";
                action.href = actionUrl;
                action.target = "_blank";
                action.rel = "noopener noreferrer";
                action.textContent = actionLabel;
                content.appendChild(action);
            }

            item.appendChild(icon);
            item.appendChild(content);
            historyList.appendChild(item);
        }
    };

    const setCountBadge = (node, count) => {
        if (!node) return;
        const unread = Math.max(0, Number(count || 0) || 0);
        if (unread <= 0) {
            node.style.display = "none";
            node.textContent = "";
            return;
        }
        node.style.display = "inline-flex";
        node.textContent = unread > 99 ? "99+" : String(unread);
    };

    const updateHistoryTabBadge = () => {
        const unread = getToastHistoryUnreadCount();
        if (historyTabBadge) {
            historyTabBadge.style.display = unread > 0 ? "inline-block" : "none";
        }
        setCountBadge(historyTabCount, unread);
    };

    const renderShortcutsPanel = () => {
        if (!shortcutsPanel) return;
        if (shortcutsPanel.childNodes.length > 0) return;
        shortcutsPanel.replaceChildren(createShortcutGuidePanel());
    };

    const updateMarkReadButtonState = () => {
        if (!markReadBtn) return;
        const unreadCount = Math.max(0, Number(getPanelUnreadCount() || 0) || 0);
        markReadBtn.disabled = unreadCount <= 0;
        if (unreadCount > 0) {
            markReadBtn.title = t("tooltip.markMessagesRead", "Mark all messages as read");
            return;
        }
        markReadBtn.title = t("tooltip.noUnreadMessages", "No unread messages");
    };

    const updateMessageButtonState = () => {
        const unreadCount = Math.max(0, Number(getPanelUnreadCount() || 0) || 0);
        if (messageBtn) {
            const badge = messageBtn.querySelector(".mjr-message-badge");
            const titleText =
                unreadCount > 0
                    ? t("tooltip.openMessagesUnread", "Messages ({count} unread)", {
                          count: unreadCount,
                      })
                    : t("tooltip.openMessages", "Messages and updates");
            messageBtn.classList.toggle("mjr-message-has-unread", unreadCount > 0);
            messageBtn.title = titleText;
            messageBtn.setAttribute("aria-label", titleText);
            if (badge) {
                if (unreadCount <= 0) {
                    badge.style.display = "none";
                    badge.textContent = "";
                } else {
                    badge.style.display = "inline-flex";
                    badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
                }
            }
        }
        setCountBadge(messageTabBadge, unreadCount);
        updateMarkReadButtonState();
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
    } catch (e) {
        console.debug?.(e);
    }
    try {
        window.addEventListener(
            TOAST_HISTORY_EVENT,
            () => {
                updateHistoryTabBadge();
                if (messagePopover?.style?.display === "block" && activeTab === "history") {
                    renderHistoryPanel();
                }
            },
            listenerOptions,
        );
    } catch (e) {
        console.debug?.(e);
    }
    try {
        if (messageBtn && messagePopover) {
            if (!messagePopover.id) messagePopover.id = "mjr-messages-popover";
            messageBtn.setAttribute("aria-haspopup", "dialog");
            messageBtn.setAttribute("aria-controls", messagePopover.id);
        }
    } catch (e) {
        console.debug?.(e);
    }

    let expandedObserver = null;
    try {
        if (typeof MutationObserver !== "undefined" && messagePopover) {
            expandedObserver = new MutationObserver(syncExpandedState);
            expandedObserver.observe(messagePopover, {
                attributes: true,
                attributeFilter: ["style"],
            });
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        signal?.addEventListener?.("abort", () => expandedObserver?.disconnect?.(), { once: true });
    } catch (e) {
        console.debug?.(e);
    }

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

    const showTabByName = (tabName) => {
        if (tabName === "messages") {
            showMessagesTab();
            return;
        }
        if (tabName === "history") {
            showHistoryTab();
            return;
        }
        showShortcutsTab();
    };

    const tabOrder = ["messages", "history", "shortcuts"];
    const onTabKeydown = (event, tabName) => {
        const key = String(event?.key || "").toLowerCase();
        const index = tabOrder.indexOf(String(tabName || "").toLowerCase());
        if (index < 0) return;

        if (key === "arrowright") {
            event.preventDefault();
            const next = tabOrder[(index + 1) % tabOrder.length];
            showTabByName(next);
            if (next === "messages") messageTabBtn?.focus?.();
            if (next === "history") historyTabBtn?.focus?.();
            if (next === "shortcuts") shortcutsTabBtn?.focus?.();
            return;
        }

        if (key === "arrowleft") {
            event.preventDefault();
            const next = tabOrder[(index + tabOrder.length - 1) % tabOrder.length];
            showTabByName(next);
            if (next === "messages") messageTabBtn?.focus?.();
            if (next === "history") historyTabBtn?.focus?.();
            if (next === "shortcuts") shortcutsTabBtn?.focus?.();
            return;
        }

        if (key === "home") {
            event.preventDefault();
            showMessagesTab();
            messageTabBtn?.focus?.();
            return;
        }

        if (key === "end") {
            event.preventDefault();
            showShortcutsTab();
            shortcutsTabBtn?.focus?.();
            return;
        }

        if (key === " " || key === "enter") {
            event.preventDefault();
            showTabByName(tabName);
        }
    };

    messageBtn?.addEventListener(
        "click",
        (e) => {
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
            } catch (err) {
                console.debug?.(err);
            }
            popovers.toggle(messagePopover, messageBtn);
            if (messagePopover?.style?.display === "block") {
                markPanelMessagesRead();
            }
            syncExpandedState();
            updateMessageButtonState();
        },
        listenerOptions,
    );

    messageTabBtn?.addEventListener(
        "click",
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            showMessagesTab();
        },
        listenerOptions,
    );
    messageTabBtn?.addEventListener(
        "keydown",
        (e) => onTabKeydown(e, "messages"),
        listenerOptions,
    );

    historyTabBtn?.addEventListener(
        "click",
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            showHistoryTab();
        },
        listenerOptions,
    );
    historyTabBtn?.addEventListener(
        "keydown",
        (e) => onTabKeydown(e, "history"),
        listenerOptions,
    );

    shortcutsTabBtn?.addEventListener(
        "click",
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            showShortcutsTab();
        },
        listenerOptions,
    );
    shortcutsTabBtn?.addEventListener(
        "keydown",
        (e) => onTabKeydown(e, "shortcuts"),
        listenerOptions,
    );

    markReadBtn?.addEventListener(
        "click",
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            markPanelMessagesRead();
            renderMessagesPopover();
            updateMessageButtonState();
        },
        listenerOptions,
    );

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
