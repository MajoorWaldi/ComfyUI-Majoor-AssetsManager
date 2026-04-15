<script setup>
/**
 * HeaderSection.vue — Hybrid Vue header/search shell for the assets manager.
 *
 * Phase 2.4: SortPopover is now a Vue component.
 *            FilterPopover will replace createFilterPopoverView() in Phase 2.5.
 *            Scope tabs are bound to usePanelStore.scope reactively.
 *
 * The legacy popover factories (filter, collections, pinned, message, custom)
 * remain as DOM elements appended into Vue anchor elements and are wired by
 * the legacy controller layer.  Each is replaced one by one in subsequent
 * steps.
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { usePanelStore } from "../../../stores/usePanelStore.js";
import { get } from "../../../api/client.js";
import { ENDPOINTS } from "../../../api/endpoints.js";
import { t } from "../../../app/i18n.js";
import { VERSION_UPDATE_EVENT, getStoredVersionUpdateState } from "../../../app/versionCheck.js";
import { EVENTS } from "../../../app/events.js";
import { setTooltipHint } from "../../../utils/tooltipShortcuts.js";
import SearchBar from "./SearchBar.vue";
import SortPopover from "./SortPopover.vue";
import FilterPopover from "./FilterPopover.vue";
import CollectionsPopover from "./CollectionsPopover.vue";
import PinnedFoldersPopover from "./PinnedFoldersPopover.vue";
import CustomRootsPopover from "./CustomRootsPopover.vue";
import MessagePopover from "./MessagePopover.vue";

// ── version badge helpers ──────────────────────────────────────────────────────

let extensionMetadataPromise = null;

const VERSION_BADGE_LABEL_CLASS = "mjr-am-version-badge-label";
const MFV_TOOLTIP_HINT = "V, Ctrl/Cmd+V";

function getExtensionMetadata() {
    if (!extensionMetadataPromise) {
        extensionMetadataPromise = Promise.resolve({}).catch((err) => {
            extensionMetadataPromise = null;
            throw err;
        });
    }
    return extensionMetadataPromise;
}

function isNightlyVersion(version, branch = "") {
    const v = String(version || "").trim().toLowerCase();
    const b = String(branch || "").trim().toLowerCase();
    const nightlyKw = ["nightly", "dev", "alpha", "experimental"];
    return nightlyKw.some((kw) => v.includes(kw) || b.includes(kw)) ||
        v.includes("+") ||
        (v.length > 10 && /^[a-f0-9]+$/i.test(v));
}

function resolveRuntimeBranch() {
    try {
        if (typeof window !== "undefined" && window?.MajoorAssetsManagerBranch) {
            return String(window.MajoorAssetsManagerBranch);
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        if (typeof process !== "undefined" && process?.env?.MAJOR_ASSETS_MANAGER_BRANCH) {
            return String(process.env.MAJOR_ASSETS_MANAGER_BRANCH);
        }
    } catch (e) {
        console.debug?.(e);
    }
    return "";
}

// ── sort icon map ──────────────────────────────────────────────────────────────

const SORT_ICONS = {
    name_asc:   "pi pi-sort-alpha-down",
    name_desc:  "pi pi-sort-alpha-up",
    mtime_asc:  "pi pi-sort-amount-up-alt",
    rating_desc:"pi pi-star-fill",
    size_desc:  "pi pi-sort-numeric-down-alt",
    size_asc:   "pi pi-sort-numeric-up-alt",
};

// ── refs ───────────────────────────────────────────────────────────────────────

const panelStore = usePanelStore();

const branch = resolveRuntimeBranch();
const initialNightly = branch === "nightly";

const headerRef = ref(null);
const headerActionsRef = ref(null);
const customMenuBtnRef = ref(null);
const filterBtnRef = ref(null);
const sortBtnRef = ref(null);
const collectionsBtnRef = ref(null);
const pinnedFoldersBtnRef = ref(null);
const mfvBtnRef = ref(null);
const messageBtnRef = ref(null);
const searchBarRef = ref(null);
const sortPopoverRef         = ref(null);  // <SortPopover>
const filterPopoverRef       = ref(null);  // <FilterPopover>
const collectionsPopoverRef  = ref(null);  // <CollectionsPopover>
const pinnedFoldersPopoverRef= ref(null);  // <PinnedFoldersPopover>
const customPopoverRef       = ref(null);  // <CustomRootsPopover>
const messagePopoverRef      = ref(null);  // <MessagePopover>

const tabAllRef = ref(null);
const tabInputsRef = ref(null);
const tabOutputsRef = ref(null);
const tabCustomRef = ref(null);
const tabSimilarRef = ref(null);

// ── version badge state ────────────────────────────────────────────────────────

const versionBadgeText = ref(initialNightly ? "nightly" : "v?");
const versionBadgeChannel = ref(initialNightly ? "nightly" : "stable");
const versionDotVisible = ref(false);
const versionBadgeHover = ref(false);
const mfvVisible = ref(false);

// ── reactive sort icon class from Pinia ───────────────────────────────────────

const sortIconClass = computed(
    () => SORT_ICONS[panelStore.sort] ?? "pi pi-sort-amount-down",
);

// ── reactive scope: active tab class ──────────────────────────────────────────

const activeScope = computed(() =>
    String(panelStore.viewScope || panelStore.scope || "output").toLowerCase(),
);

const hasSimilarScope = computed(() =>
    activeScope.value === "similar" ||
    (Array.isArray(panelStore.similarResults) && panelStore.similarResults.length > 0) ||
    Boolean(panelStore.similarTitle),
);

// FilterPopover is now a Vue component — filterPopoverRef exposes input DOM refs
// for filtersController.bindFilters() backward compatibility (Phase 2.5)
// CollectionsPopover, PinnedFoldersPopover, CustomRootsPopover, MessagePopover
// are all Vue components now — all legacy createXxxPopoverView() calls removed.

// ── tabButtons proxy (for scopeController DOM interop) ────────────────────────

const tabButtons = {
    get tabAll()    { return tabAllRef.value; },
    get tabInputs() { return tabInputsRef.value; },
    get tabOutputs(){ return tabOutputsRef.value; },
    get tabCustom() { return tabCustomRef.value; },
    get tabSimilar(){ return tabSimilarRef.value; },
};

// ── version badge computed ─────────────────────────────────────────────────────

const versionBadgeStyle = computed(() => ({
    position: "relative",
    fontSize: "10px",
    opacity: versionBadgeHover.value ? "1" : "0.6",
    marginLeft: "6px",
    padding: "2px 5px",
    borderRadius: "4px",
    background: versionBadgeHover.value
        ? "rgba(255,255,255,0.15)"
        : "rgba(255,255,255,0.08)",
    color: "inherit",
    textDecoration: "none",
    cursor: "pointer",
    transition: "opacity 0.2s, background 0.2s",
    verticalAlign: "middle",
}));

const mfvTitle = computed(() =>
    mfvVisible.value
        ? t("tooltip.closeMFV", "Close Floating Viewer")
        : t("tooltip.openMFV", "Open Floating Viewer"),
);

const mfvIconClass = computed(() =>
    mfvVisible.value ? "pi pi-eye-slash" : "pi pi-eye",
);

// ── version badge helpers ──────────────────────────────────────────────────────

function setVersionBadgeText(text, { channel = "" } = {}) {
    versionBadgeText.value = String(text || "");
    if (channel) versionBadgeChannel.value = channel;
}

function applyExtensionMetadata(isNightly) {
    getExtensionMetadata()
        .then((info) => {
            const alreadyNightly =
                versionBadgeChannel.value.toLowerCase() === "nightly" ||
                versionBadgeText.value.toLowerCase() === "nightly";
            if (!isNightly && !alreadyNightly) {
                const v = (typeof info?.version === "string" ? info.version.trim() : "") || "";
                if (v) setVersionBadgeText(`v${v}`, { channel: "stable" });
            }
        })
        .catch(() => { extensionMetadataPromise = null; });
}

async function hydrateBackendVersionBadge(isNightly) {
    try {
        const result = await get(ENDPOINTS.VERSION, { cache: "no-cache" });
        if (!result?.ok) return;
        const version = String(result.data?.version || "").trim();
        const apiBranch = String(result.data?.branch || "").trim().toLowerCase();
        if (isNightlyVersion(version, apiBranch) || isNightly) {
            setVersionBadgeText("nightly", { channel: "nightly" });
            return;
        }
        if (version) {
            setVersionBadgeText(
                version.startsWith("v") ? version : `v${version}`,
                { channel: "stable" },
            );
        }
    } catch {
        // ignore
    }
}

function applyDotState(state) {
    const ch = String(state?.channel || "").trim().toLowerCase();
    const cur = String(state?.current || "").trim().toLowerCase();
    const lat = String(state?.latest || "").trim().toLowerCase();
    if (ch === "nightly" || cur === "nightly" || lat === "nightly") {
        setVersionBadgeText("nightly", { channel: "nightly" });
    }
    versionDotVisible.value = Boolean(state?.available);
}

function syncMfvTooltip() {
    try {
        setTooltipHint(mfvBtnRef.value, mfvTitle.value, MFV_TOOLTIP_HINT);
    } catch (e) {
        console.debug?.(e);
    }
}

function syncMfvStateFromDom() {
    try {
        if (typeof document === "undefined") return;
        mfvVisible.value = !!document.querySelector(".mjr-mfv.is-visible");
    } catch (e) {
        console.debug?.(e);
    }
}

function handleMfvVisibility(event) {
    mfvVisible.value = Boolean(event?.detail?.visible);
}

function handleVersionUpdate(event) {
    try { applyDotState(event?.detail); } catch (e) { console.debug?.(e); }
}

function handleMfvToggle() {
    window.dispatchEvent(new CustomEvent(EVENTS.MFV_TOGGLE));
}

function dispose() {
    try {
        if (typeof window !== "undefined") {
            window.removeEventListener(VERSION_UPDATE_EVENT, handleVersionUpdate);
            window.removeEventListener(EVENTS.MFV_VISIBILITY_CHANGED, handleMfvVisibility);
        }
    } catch (e) {
        console.debug?.(e);
    }
}

// ── lifecycle ──────────────────────────────────────────────────────────────────

watch(mfvVisible, () => {
    syncMfvTooltip();
});

onMounted(async () => {
    await nextTick();

    try { applyDotState(getStoredVersionUpdateState()); } catch (e) { console.debug?.(e); }

    syncMfvStateFromDom();
    syncMfvTooltip();
    applyExtensionMetadata(initialNightly);
    void hydrateBackendVersionBadge(initialNightly);

    try {
        if (typeof window !== "undefined") {
            window.addEventListener(VERSION_UPDATE_EVENT, handleVersionUpdate);
            window.addEventListener(EVENTS.MFV_VISIBILITY_CHANGED, handleMfvVisibility);
        }
    } catch (e) {
        console.debug?.(e);
    }

    try {
        headerRef.value._mjrVersionUpdateCleanup = dispose;
    } catch (e) {
        console.debug?.(e);
    }
});

onUnmounted(() => {
    dispose();
});

// ── expose (same contract as before, sortMenu is now a stub) ──────────────────

// Stub for sortMenu: sortController calls sortMenu.replaceChildren() + appendChild
// on a detached div — it does nothing visible since SortPopover owns its own DOM.
const _sortMenuStub = document.createElement("div");

defineExpose({
    isVueHeader: true,
    // Header root
    get header()       { return headerRef.value; },
    get headerActions(){ return headerActionsRef.value; },
    get tabButtons()   { return tabButtons; },
    // Tool buttons
    get customMenuBtn()     { return customMenuBtnRef.value; },
    get filterBtn()         { return filterBtnRef.value; },
    get sortBtn()           { return sortBtnRef.value; },
    get collectionsBtn()    { return collectionsBtnRef.value; },
    get pinnedFoldersBtn()  { return pinnedFoldersBtnRef.value; },
    get messageBtn()        { return messageBtnRef.value; },
    // CustomRootsPopover (Vue)
    get customPopover()   { return customPopoverRef.value?.$el ?? null; },
    get customSelect()    { return customPopoverRef.value?.customSelect ?? null; },
    get customAddBtn()    { return customPopoverRef.value?.customAddBtn ?? null; },
    get customRemoveBtn() { return customPopoverRef.value?.customRemoveBtn ?? null; },
    // FilterPopover: expose real DOM element ($el) so legacy popovers.toggle() works
    get filterPopover()          { return filterPopoverRef.value?.$el ?? null; },
    get kindSelect()             { return filterPopoverRef.value?.kindSelect ?? null; },
    get wfCheckbox()             { return filterPopoverRef.value?.wfCheckbox ?? null; },
    get workflowTypeSelect()     { return filterPopoverRef.value?.workflowTypeSelect ?? null; },
    get ratingSelect()           { return filterPopoverRef.value?.ratingSelect ?? null; },
    get minSizeInput()           { return filterPopoverRef.value?.minSizeInput ?? null; },
    get maxSizeInput()           { return filterPopoverRef.value?.maxSizeInput ?? null; },
    get resolutionPresetSelect() { return filterPopoverRef.value?.resolutionPresetSelect ?? null; },
    get minWidthInput()          { return filterPopoverRef.value?.minWidthInput ?? null; },
    get minHeightInput()         { return filterPopoverRef.value?.minHeightInput ?? null; },
    get maxWidthInput()          { return filterPopoverRef.value?.maxWidthInput ?? null; },
    get maxHeightInput()         { return filterPopoverRef.value?.maxHeightInput ?? null; },
    get dateRangeSelect()        { return filterPopoverRef.value?.dateRangeSelect ?? null; },
    get dateExactInput()         { return filterPopoverRef.value?.dateExactInput ?? null; },
    get agendaContainer()        { return filterPopoverRef.value?.agendaContainer ?? null; },
    // SortPopover: expose real DOM element ($el) so legacy popovers.toggle() works
    get sortPopover() { return sortPopoverRef.value?.$el ?? null; },
    sortMenu: _sortMenuStub,
    // CollectionsPopover (Vue)
    get collectionsPopover() { return collectionsPopoverRef.value?.$el ?? null; },
    get refreshCollectionsPopover() { return collectionsPopoverRef.value?.refresh ?? null; },
    // PinnedFoldersPopover (Vue)
    get pinnedFoldersPopover() { return pinnedFoldersPopoverRef.value?.$el ?? null; },
    get pinnedFoldersMenu()    { return pinnedFoldersPopoverRef.value?.pinnedFoldersMenu ?? null; },
    // MessagePopover (Vue)
    get messagePopover()      { return messagePopoverRef.value?.$el ?? null; },
    get messagePopoverTitle() { return messagePopoverRef.value?.title ?? null; },
    get messageTabBtn()       { return messagePopoverRef.value?.messageTabBtn ?? null; },
    get messageTabBadge()     { return messagePopoverRef.value?.messageTabBadge ?? null; },
    get historyTabBtn()       { return messagePopoverRef.value?.historyTabBtn ?? null; },
    get historyTabBadge()     { return messagePopoverRef.value?.historyTabBadge ?? null; },
    get historyTabCount()     { return messagePopoverRef.value?.historyTabCount ?? null; },
    get historyPanel()        { return messagePopoverRef.value?.historyPanel ?? null; },
    get shortcutsTabBtn()     { return messagePopoverRef.value?.shortcutsTabBtn ?? null; },
    get messageList()         { return messagePopoverRef.value?.messageList ?? null; },
    get shortcutsPanel()      { return messagePopoverRef.value?.shortcutsPanel ?? null; },
    get markReadBtn()         { return messagePopoverRef.value?.markReadBtn ?? null; },
    // Search bar refs
    get searchSection() { return searchBarRef.value?.searchSection ?? null; },
    get searchInputEl() { return searchBarRef.value?.searchInputEl ?? null; },
    get similarBtn()    { return searchBarRef.value?.similarBtn ?? null; },
    setSemanticEnabled(enabled) { searchBarRef.value?.setSemanticEnabled?.(enabled); },
    _headerDispose: dispose,
});
</script>

<template>
    <div ref="headerRef" class="mjr-am-header">
        <div class="mjr-am-header-row">
            <div class="mjr-am-header-left">
                <i class="mjr-am-header-icon pi pi-folder" aria-hidden="true" />
                <div class="mjr-am-header-title">{{ t("manager.title") }}</div>
                <a
                    href="https://ko-fi.com/majoorwaldi"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mjr-am-version-badge"
                    :data-mjr-version-channel="versionBadgeChannel"
                    :title="t('tooltip.supportKofi')"
                    :style="versionBadgeStyle"
                    @mouseenter="versionBadgeHover = true"
                    @mouseleave="versionBadgeHover = false"
                >
                    <span :class="VERSION_BADGE_LABEL_CLASS">{{ versionBadgeText }}</span>
                    <span
                        aria-hidden="true"
                        :style="{
                            position: 'absolute',
                            top: '2px',
                            right: '-3px',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#f44336',
                            boxShadow: '0 0 0 1px rgba(255,255,255,0.6)',
                            display: versionDotVisible ? 'block' : 'none',
                            pointerEvents: 'none',
                        }"
                    />
                </a>
            </div>

            <div ref="headerActionsRef" class="mjr-am-header-actions">
                <!-- Scope tabs — class is-active is driven by usePanelStore.scope -->
                <div class="mjr-tabs">
                    <button
                        ref="tabAllRef"
                        type="button"
                        class="mjr-tab"
                        data-scope="all"
                        :class="{ 'is-active': activeScope === 'all' }"
                        :title="t('tooltip.tab.all')"
                    >{{ t("tab.all") }}</button>

                    <button
                        ref="tabInputsRef"
                        type="button"
                        class="mjr-tab"
                        data-scope="input"
                        :class="{ 'is-active': activeScope === 'input' }"
                        :title="t('tooltip.tab.input')"
                    >{{ t("tab.input") }}</button>

                    <button
                        ref="tabOutputsRef"
                        type="button"
                        class="mjr-tab"
                        data-scope="output"
                        :class="{ 'is-active': activeScope === 'output' }"
                        :title="t('tooltip.tab.output')"
                    >{{ t("tab.output") }}</button>

                    <button
                        ref="tabCustomRef"
                        type="button"
                        class="mjr-tab"
                        data-scope="custom"
                        :class="{ 'is-active': activeScope === 'custom' }"
                        :title="t('tooltip.tab.custom')"
                    >{{ t("tab.custom") }}</button>

                    <button
                        ref="tabSimilarRef"
                        type="button"
                        class="mjr-tab"
                        data-scope="similar"
                        :class="{ 'is-active': activeScope === 'similar' }"
                        :style="{ display: hasSimilarScope ? '' : 'none' }"
                        :title="t('tooltip.tab.similar', 'Browse current similar findings')"
                    >{{ t("tab.similar", "Similar") }}</button>
                </div>

                <div class="mjr-am-header-tools">
                    <div class="mjr-popover-anchor" style="display: none;">
                        <button
                            ref="customMenuBtnRef"
                            type="button"
                            class="mjr-icon-btn"
                            :title="t('tooltip.browserFolders')"
                            :aria-label="t('tooltip.browserFolders')"
                        >
                            <i class="pi pi-folder-open" aria-hidden="true" />
                        </button>
                        <CustomRootsPopover ref="customPopoverRef" />
                    </div>

                    <button
                        ref="mfvBtnRef"
                        type="button"
                        class="mjr-icon-btn"
                        :class="{ 'mjr-mfv-btn-active': mfvVisible }"
                        :title="mfvTitle"
                        :aria-label="mfvTitle"
                        @click="handleMfvToggle"
                    >
                        <i :class="mfvIconClass" aria-hidden="true" />
                    </button>

                    <div class="mjr-popover-anchor">
                        <button
                            ref="messageBtnRef"
                            type="button"
                            class="mjr-icon-btn mjr-message-btn"
                            :title="t('tooltip.openMessages', 'Messages and updates')"
                            :aria-label="t('tooltip.openMessages', 'Messages and updates')"
                        >
                            <i class="pi pi-info-circle" aria-hidden="true" />
                            <span class="mjr-message-badge" style="display: none" aria-hidden="true" />
                        </button>
                        <MessagePopover ref="messagePopoverRef" />
                    </div>
                </div>
            </div>
        </div>
    </div>

    <SearchBar ref="searchBarRef">
        <template #filter-anchor>
            <div class="mjr-popover-anchor">
                <button
                    ref="filterBtnRef"
                    type="button"
                    class="mjr-icon-btn"
                    :title="t('label.filters')"
                    :aria-label="t('label.filters')"
                >
                    <i class="pi pi-filter" aria-hidden="true" />
                </button>
                <!-- Vue FilterPopover: content is reactive, visibility controlled by legacy popovers.toggle() -->
                <FilterPopover ref="filterPopoverRef" />
            </div>
        </template>

        <template #sort-anchor>
            <div class="mjr-popover-anchor">
                <button
                    ref="sortBtnRef"
                    type="button"
                    class="mjr-icon-btn"
                    :title="t('label.sort')"
                    :aria-label="t('label.sort')"
                >
                    <!-- Icon updates reactively when sort changes in Pinia -->
                    <i :class="sortIconClass" aria-hidden="true" />
                </button>
                <!-- Vue SortPopover: content is reactive, visibility controlled by legacy popovers.toggle() -->
                <SortPopover ref="sortPopoverRef" />
            </div>
        </template>

        <template #collections-anchor>
            <div class="mjr-popover-anchor">
                <button
                    ref="collectionsBtnRef"
                    type="button"
                    class="mjr-icon-btn"
                    :title="t('label.collections')"
                    :aria-label="t('label.collections')"
                >
                    <i class="pi pi-bookmark" aria-hidden="true" />
                </button>
                <CollectionsPopover ref="collectionsPopoverRef" />
            </div>
        </template>

        <template #pinned-folders-anchor>
            <div class="mjr-popover-anchor">
                <button
                    ref="pinnedFoldersBtnRef"
                    type="button"
                    class="mjr-icon-btn"
                    :title="t('tooltip.pinnedFolders')"
                    :aria-label="t('tooltip.pinnedFolders')"
                >
                    <i class="pi pi-folder" aria-hidden="true" />
                </button>
                <PinnedFoldersPopover ref="pinnedFoldersPopoverRef" />
            </div>
        </template>
    </SearchBar>
</template>
