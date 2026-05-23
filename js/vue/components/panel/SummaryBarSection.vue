<script setup>
/**
 * SummaryBarSection.vue — Phase-2→3 transition component for the summary bar.
 *
 * This replaces the previous renderless wrapper with a real Vue template while
 * keeping the same `defineExpose()` contract expected by `App.vue` and the
 * panel runtime: `{ summaryBar, updateSummaryBar, folderBreadcrumb }`.
 *
 * The controller layer still calls `updateSummaryBar()` imperatively for now.
 * That function synchronizes transient counts into Pinia and updates the Vue
 * view without changing the existing controller wiring.
 */
import { onMounted, ref } from "vue";
import { createContextPillsView } from "../../../features/panel/views/contextPillsView.js";
import { usePanelStore } from "../../../stores/usePanelStore.js";
import { buildSummaryBarState } from "./summaryBarState.js";

const panelStore = usePanelStore();

const summaryBar = ref(null);
const folderBreadcrumb = ref(null);
const pillsHost = ref(null);
const summaryText = ref("");
const duplicateText = ref("");
const showDuplicateAlert = ref(false);
const breadcrumbVisible = ref(false);
const breadcrumbBack = ref(null);
const breadcrumbUp = ref(null);
const breadcrumbItems = ref([]);

const pillsView = createContextPillsView();

let duplicateAlertAction = null;

function handleDuplicateAlertClick() {
    try {
        duplicateAlertAction?.();
    } catch (e) {
        console.debug?.(e);
    }
}

function updateSummaryBar({ state, gridContainer, context = null, actions = null } = {}) {
    const nextState = buildSummaryBarState({ state, gridContainer, context });

    panelStore.lastGridCount = nextState.shown;
    panelStore.lastGridTotal = nextState.total;
    panelStore.viewScope = nextState.activeScope;

    summaryText.value = nextState.summaryText;
    duplicateText.value = nextState.duplicateText;
    showDuplicateAlert.value = nextState.showDuplicates;
    duplicateAlertAction = nextState.showDuplicates
        ? () => {
              try {
                  actions?.onDuplicateAlertClick?.(context?.duplicatesAlert || null);
              } catch (e) {
                  console.debug?.(e);
              }
          }
        : null;

    try {
        pillsView.update({
            state,
            gridContainer,
            rawQuery: nextState.rawQuery,
            actions,
        });
    } catch (e) {
        console.debug?.(e);
    }
}

function setFolderBreadcrumb({
    visible = false,
    back = null,
    up = null,
    items = [],
} = {}) {
    breadcrumbVisible.value = !!visible;
    breadcrumbBack.value = back && typeof back === "object" ? back : null;
    breadcrumbUp.value = up && typeof up === "object" ? up : null;
    breadcrumbItems.value = Array.isArray(items)
        ? items
              .map((item) => ({
                  label: String(item?.label || ""),
                  target: String(item?.target || ""),
                  current: !!item?.current,
                  onClick: typeof item?.onClick === "function" ? item.onClick : null,
              }))
              .filter((item) => item.label)
        : [];
}

function runBreadcrumbAction(action) {
    if (!action || action.disabled || typeof action.onClick !== "function") return;
    try {
        action.onClick();
    } catch (e) {
        console.debug?.(e);
    }
}

onMounted(() => {
    try {
        pillsHost.value?.appendChild?.(pillsView.wrap);
    } catch (e) {
        console.debug?.(e);
    }
});

defineExpose({ summaryBar, updateSummaryBar, folderBreadcrumb, setFolderBreadcrumb });
</script>

<template>
    <div
        ref="folderBreadcrumb"
        class="mjr-folder-breadcrumb"
        :class="{ 'is-visible': breadcrumbVisible }"
        aria-label="Folder breadcrumb"
    >
        <MButton
            v-if="breadcrumbBack"
            type="button"
            class="mjr-btn-link mjr-folder-breadcrumb-action"
            severity="secondary"
            text
            :disabled="breadcrumbBack.disabled"
            @click="runBreadcrumbAction(breadcrumbBack)"
        >
            {{ breadcrumbBack.label }}
        </MButton>
        <MButton
            v-if="breadcrumbUp"
            type="button"
            class="mjr-btn-link mjr-folder-breadcrumb-action"
            severity="secondary"
            text
            :disabled="breadcrumbUp.disabled"
            @click="runBreadcrumbAction(breadcrumbUp)"
        >
            {{ breadcrumbUp.label }}
        </MButton>
        <span v-if="breadcrumbBack || breadcrumbUp" class="mjr-folder-breadcrumb-separator">
            |
        </span>
        <template v-for="(item, index) in breadcrumbItems" :key="`${item.target}:${index}`">
            <span v-if="index > 0" class="mjr-folder-breadcrumb-separator">/</span>
            <MButton
                type="button"
                class="mjr-btn-link mjr-folder-breadcrumb-segment"
                :class="{ 'is-current': item.current }"
                severity="secondary"
                text
                :disabled="item.current"
                @click="runBreadcrumbAction(item)"
            >
                {{ item.label }}
            </MButton>
        </template>
    </div>
    <div ref="summaryBar" class="mjr-am-summary" aria-live="polite">
        <div class="mjr-am-summary-left">
            <div class="mjr-am-summary-text">{{ summaryText }}</div>
        </div>
        <div class="mjr-am-summary-right">
            <MButton
                v-if="showDuplicateAlert"
                type="button"
                class="mjr-am-dup-alert"
                severity="secondary"
                text
                :title="duplicateText"
                style="
                    padding: 2px 8px;
                    border: 1px solid var(--border-color, #555);
                    background: var(--comfy-menu-bg, #222);
                    color: var(--input-text, #eee);
                    border-radius: 999px;
                    cursor: pointer;
                "
                @click="handleDuplicateAlertClick"
            >
                {{ duplicateText }}
            </MButton>
            <div ref="pillsHost" />
        </div>
    </div>
</template>

<style scoped>
.mjr-folder-breadcrumb {
    display: none;
    align-items: center;
    gap: 4px;
    padding: 3px 6px;
    margin: 1px 0 3px;
    font-size: 11px;
    opacity: 0.78;
    overflow: auto;
    white-space: nowrap;
    border-radius: 8px;
    background: color-mix(
        in srgb,
        var(--mjr-surface-2, rgba(255, 255, 255, 0.05)) 42%,
        transparent
    );
}

.mjr-folder-breadcrumb.is-visible {
    display: flex;
}

.mjr-folder-breadcrumb-action {
    padding: 2px 8px;
    border: 1px solid rgba(122, 162, 255, 0.35);
    border-radius: 6px;
    background: rgba(122, 162, 255, 0.12);
    color: var(--mjr-accent, #7aa2ff);
    font: inherit;
}

.mjr-folder-breadcrumb-segment {
    max-width: 220px;
    min-width: 0;
    padding: 0;
    border: none;
    background: none;
    color: var(--mjr-accent, #7aa2ff);
    font: inherit;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mjr-folder-breadcrumb-segment.is-current,
.mjr-folder-breadcrumb-segment:disabled {
    color: var(--mjr-text, inherit);
    cursor: default;
}

.mjr-folder-breadcrumb-separator {
    opacity: 0.6;
}
</style>
