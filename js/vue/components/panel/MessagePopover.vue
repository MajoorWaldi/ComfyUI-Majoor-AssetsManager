<script setup>
/**
 * MessagePopover.vue — Messages / history / shortcuts panel.
 *
 * The messagePopoverController drives all content and tab switching
 * imperatively via the exposed DOM refs. Vue only owns the structural
 * shell; controller logic is unchanged.
 *
 * Exposes the same contract as createMessagePopoverView():
 *   title, messageTabBtn, historyTabBtn, historyTabBadge, historyPanel,
 *   shortcutsTabBtn, messageList, shortcutsPanel, markReadBtn
 *
 * Visibility is controlled by the legacy popoverManager (popovers.toggle).
 */
import { ref } from "vue";
import { t } from "../../../app/i18n.js";

const GITHUB_REPO_URL = "https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager";

const titleRef            = ref(null);
const markReadBtnRef      = ref(null);
const messageTabBtnRef    = ref(null);
const messageTabBadgeRef  = ref(null);
const historyTabBtnRef    = ref(null);
const historyTabBadgeRef  = ref(null);
const historyTabCountRef  = ref(null);
const shortcutsTabBtnRef  = ref(null);
const messageListRef      = ref(null);
const historyPanelRef     = ref(null);
const shortcutsPanelRef   = ref(null);

const resolveDomElement = (value) => value?.$el || value || null;

defineExpose({
    get title()            { return titleRef.value; },
    get markReadBtn()      { return resolveDomElement(markReadBtnRef.value); },
    get messageTabBtn()    { return resolveDomElement(messageTabBtnRef.value); },
    get messageTabBadge()  { return messageTabBadgeRef.value; },
    get historyTabBtn()    { return resolveDomElement(historyTabBtnRef.value); },
    get historyTabBadge()  { return historyTabBadgeRef.value; },
    get historyTabCount()  { return historyTabCountRef.value; },
    get shortcutsTabBtn()  { return resolveDomElement(shortcutsTabBtnRef.value); },
    get messageList()      { return messageListRef.value; },
    get historyPanel()     { return historyPanelRef.value; },
    get shortcutsPanel()   { return shortcutsPanelRef.value; },
});
</script>

<template>
    <div
        class="mjr-popover mjr-messages-popover"
        id="mjr-messages-popover"
        role="dialog"
        :aria-label="t('label.messages', 'Messages')"
        aria-hidden="true"
        tabindex="-1"
        style="display: none;"
    >
        <MDialog
            :visible="true"
            :modal="false"
            :show-header="false"
            :closable="false"
            :close-on-escape="false"
            :draggable="false"
            :auto-z-index="false"
            append-to="self"
            class="mjr-inline-dialog mjr-messages-dialog"
            content-class="mjr-inline-dialog-content"
            :pt="{ mask: { class: 'mjr-inline-dialog-mask' }, root: { class: 'mjr-inline-dialog-root' } }"
        >
            <!-- Head -->
            <div class="mjr-messages-head">
                <div ref="titleRef" class="mjr-messages-title">
                    {{ t("label.messages", "Messages") }}
                </div>
                <div class="mjr-messages-actions">
                    <a
                        :href="GITHUB_REPO_URL"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="mjr-btn mjr-messages-star-link"
                        :title="t('tooltip.starGithub', 'Open GitHub and give a star')"
                    >
                        <span class="mjr-messages-star-icon" aria-hidden="true">★</span>
                        <span class="mjr-messages-star-label">{{ t("btn.giveStar", "Give a star") }}</span>
                    </a>
                    <MButton
                        ref="markReadBtnRef"
                        type="button"
                        class="mjr-btn mjr-messages-mark-read-btn"
                        severity="secondary"
                        :title="t('tooltip.markMessagesRead', 'Mark all messages as read')"
                    >
                        {{ t("btn.markAllRead", "Mark all read") }}
                    </MButton>
                </div>
            </div>

            <!-- Tabs -->
            <div class="mjr-messages-tabs" role="tablist">
                <MButton
                    ref="messageTabBtnRef"
                    type="button"
                    class="mjr-messages-tab is-active"
                    severity="secondary"
                    text
                    role="tab"
                    aria-selected="true"
                    aria-controls="mjr-messages-panel"
                    id="mjr-messages-tab"
                >
                    <span>{{ t("label.messages", "Messages") }}</span>
                    <span
                        ref="messageTabBadgeRef"
                        class="mjr-tab-count-badge"
                        aria-hidden="true"
                        style="display: none;"
                    />
                </MButton>

                <MButton
                    ref="historyTabBtnRef"
                    type="button"
                    class="mjr-messages-tab"
                    severity="secondary"
                    text
                    role="tab"
                    aria-selected="false"
                    aria-controls="mjr-history-panel"
                    id="mjr-history-tab"
                >
                    <span>{{ t("label.toastHistory", "History") }}</span>
                    <span
                        ref="historyTabCountRef"
                        class="mjr-tab-count-badge"
                        aria-hidden="true"
                        style="display: none;"
                    />
                    <span
                        ref="historyTabBadgeRef"
                        class="mjr-tab-unread-dot"
                        aria-hidden="true"
                        style="display: none;"
                    />
                </MButton>

                <MButton
                    ref="shortcutsTabBtnRef"
                    type="button"
                    class="mjr-messages-tab"
                    severity="secondary"
                    text
                    role="tab"
                    aria-selected="false"
                    aria-controls="mjr-shortcuts-panel"
                    id="mjr-shortcuts-tab"
                >
                    {{ t("msg.shortcuts.title", "Shortcut Guide") }}
                </MButton>
            </div>

            <!-- Panels -->
            <div class="mjr-messages-panels">
                <div
                    ref="messageListRef"
                    class="mjr-messages-list"
                    id="mjr-messages-panel"
                    role="tabpanel"
                    aria-labelledby="mjr-messages-tab"
                >
                    <div class="mjr-messages-empty">
                        {{ t("msg.noMessages", "No messages for now.") }}
                    </div>
                </div>

                <div
                    ref="historyPanelRef"
                    class="mjr-messages-history-panel"
                    id="mjr-history-panel"
                    role="tabpanel"
                    aria-labelledby="mjr-history-tab"
                    hidden
                />

                <div
                    ref="shortcutsPanelRef"
                    class="mjr-messages-shortcuts-panel"
                    id="mjr-shortcuts-panel"
                    role="tabpanel"
                    aria-labelledby="mjr-shortcuts-tab"
                    hidden
                />
            </div>
        </MDialog>
    </div>
</template>
