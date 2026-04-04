<script setup>
/**
 * FilterPopover.vue — Reactive filter menu, content-only.
 *
 * Follows the same pattern as SortPopover.vue:
 *   - Root element has class "mjr-popover mjr-filter-popover" with style="display:none".
 *     Legacy popoverManager (popovers.toggle/close) controls visibility.
 *   - Vue owns the form content rendered from usePanelStore filter state.
 *   - defineExpose() provides real DOM refs so filtersController.bindFilters()
 *     can attach its change listeners for backward compatibility.
 *
 * Phase 2.5: replaces createFilterPopoverView() in HeaderSection.vue.
 */
import { computed, ref } from "vue";
import { usePanelStore } from "../../../stores/usePanelStore.js";
import { t } from "../../../app/i18n.js";

const panelStore = usePanelStore();

// Filter input element refs — exposed for filtersController.bindFilters()
const kindSelectRef = ref(null);
const wfCheckboxRef = ref(null);
const workflowTypeSelectRef = ref(null);
const ratingSelectRef = ref(null);
const minSizeInputRef = ref(null);
const maxSizeInputRef = ref(null);
const resolutionPresetSelectRef = ref(null);
const minWidthInputRef = ref(null);
const minHeightInputRef = ref(null);
const maxWidthInputRef = ref(null);
const maxHeightInputRef = ref(null);
const dateRangeSelectRef = ref(null);
const agendaContainerRef = ref(null);
const dateExactInputRef = ref(null);

const groupOpen = ref({
    core: false,
    media: false,
    time: false,
});

const resolutionPresetValue = computed(() => {
    const minW = Number(panelStore.minWidth || 0) || 0;
    const minH = Number(panelStore.minHeight || 0) || 0;
    if (minW >= 3840 && minH >= 2160) return "uhd";
    if (minW >= 2560 && minH >= 1440) return "qhd";
    if (minW >= 1920 && minH >= 1080) return "fhd";
    if (minW >= 1280 && minH >= 720) return "hd";
    return "";
});

const agendaInputClass = computed(() => {
    const hasDate = String(panelStore.dateExactFilter || "").trim().length > 0;
    return {
        "mjr-agenda-filled": hasDate,
        "mjr-agenda-empty": !hasDate,
    };
});

const parseLooseNumber = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw) return 0;
    const normalized = raw.replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
};

const dispatchFiltersChanged = () => {
    try {
        window.dispatchEvent(new CustomEvent("mjr:filters-changed"));
    } catch (e) {
        console.debug?.(e);
    }
};

const onKindChange = (event) => {
    panelStore.kindFilter = String(event?.target?.value || "");
    dispatchFiltersChanged();
};

const onWorkflowOnlyChange = (event) => {
    panelStore.workflowOnly = Boolean(event?.target?.checked);
    dispatchFiltersChanged();
};

const onWorkflowTypeChange = (event) => {
    panelStore.workflowType = String(event?.target?.value || "")
        .trim()
        .toUpperCase();
    dispatchFiltersChanged();
};

const onRatingChange = (event) => {
    panelStore.minRating = Number(event?.target?.value || 0) || 0;
    dispatchFiltersChanged();
};

const onSizeChange = () => {
    const nextMin = parseLooseNumber(minSizeInputRef.value?.value || 0);
    let nextMax = parseLooseNumber(maxSizeInputRef.value?.value || 0);
    if (nextMax > 0 && nextMin > 0 && nextMax < nextMin) {
        nextMax = nextMin;
        if (maxSizeInputRef.value) maxSizeInputRef.value.value = String(nextMax);
    }
    panelStore.minSizeMB = nextMin > 0 ? nextMin : 0;
    panelStore.maxSizeMB = nextMax > 0 ? nextMax : 0;
    dispatchFiltersChanged();
};

const onResolutionChange = () => {
    const nextMinW = Math.max(0, Math.round(parseLooseNumber(minWidthInputRef.value?.value || 0)));
    const nextMinH = Math.max(0, Math.round(parseLooseNumber(minHeightInputRef.value?.value || 0)));
    let nextMaxW = Math.max(0, Math.round(parseLooseNumber(maxWidthInputRef.value?.value || 0)));
    let nextMaxH = Math.max(0, Math.round(parseLooseNumber(maxHeightInputRef.value?.value || 0)));
    if (nextMaxW > 0 && nextMinW > 0 && nextMaxW < nextMinW) {
        nextMaxW = nextMinW;
        if (maxWidthInputRef.value) maxWidthInputRef.value.value = String(nextMaxW);
    }
    if (nextMaxH > 0 && nextMinH > 0 && nextMaxH < nextMinH) {
        nextMaxH = nextMinH;
        if (maxHeightInputRef.value) maxHeightInputRef.value.value = String(nextMaxH);
    }
    panelStore.minWidth = nextMinW;
    panelStore.minHeight = nextMinH;
    panelStore.maxWidth = nextMaxW;
    panelStore.maxHeight = nextMaxH;
    dispatchFiltersChanged();
};

const onResolutionPresetChange = (event) => {
    const preset = String(event?.target?.value || "").trim();
    const map = {
        hd: [1280, 720],
        fhd: [1920, 1080],
        qhd: [2560, 1440],
        uhd: [3840, 2160],
    };
    const [w, h] = map[preset] || [0, 0];
    panelStore.minWidth = Number(w || 0);
    panelStore.minHeight = Number(h || 0);
    panelStore.maxWidth = 0;
    panelStore.maxHeight = 0;
    if (minWidthInputRef.value) minWidthInputRef.value.value = panelStore.minWidth || "";
    if (minHeightInputRef.value) minHeightInputRef.value.value = panelStore.minHeight || "";
    if (maxWidthInputRef.value) maxWidthInputRef.value.value = "";
    if (maxHeightInputRef.value) maxHeightInputRef.value.value = "";
    dispatchFiltersChanged();
};

const onDateRangeChange = (event) => {
    panelStore.dateRangeFilter = String(event?.target?.value || "");
    if (panelStore.dateRangeFilter && panelStore.dateExactFilter) {
        panelStore.dateExactFilter = "";
        if (dateExactInputRef.value) dateExactInputRef.value.value = "";
    }
    dispatchFiltersChanged();
};

const onDateExactChange = (event) => {
    panelStore.dateExactFilter = String(event?.target?.value || "").trim();
    dispatchFiltersChanged();
};

const toggleGroup = (groupName) => {
    const key = String(groupName || "").trim().toLowerCase();
    if (!key || !(key in groupOpen.value)) return;
    groupOpen.value = {
        ...groupOpen.value,
        [key]: !groupOpen.value[key],
    };
};

const isGroupOpen = (groupName) => Boolean(groupOpen.value[String(groupName || "").trim().toLowerCase()]);

defineExpose({
    get kindSelect()              { return kindSelectRef.value; },
    get wfCheckbox()              { return wfCheckboxRef.value; },
    get workflowTypeSelect()      { return workflowTypeSelectRef.value; },
    get ratingSelect()            { return ratingSelectRef.value; },
    get minSizeInput()            { return minSizeInputRef.value; },
    get maxSizeInput()            { return maxSizeInputRef.value; },
    get resolutionPresetSelect()  { return resolutionPresetSelectRef.value; },
    get minWidthInput()           { return minWidthInputRef.value; },
    get minHeightInput()          { return minHeightInputRef.value; },
    get maxWidthInput()           { return maxWidthInputRef.value; },
    get maxHeightInput()          { return maxHeightInputRef.value; },
    get dateRangeSelect()         { return dateRangeSelectRef.value; },
    get dateExactInput()          { return dateExactInputRef.value; },
    get agendaContainer()         { return agendaContainerRef.value; },
});
</script>

<template>
    <!--
        Root element has class "mjr-popover mjr-filter-popover" but NO v-show.
        The legacy popoverManager controls style.display on this element.
        Vue only manages the filter form content reactively.
    -->
    <div class="mjr-popover mjr-filter-popover" style="display: none;">

        <!-- ── Core group ─────────────────────────────────────────────────── -->
        <div class="mjr-filter-group" :class="{ 'is-open': isGroupOpen('core') }">
            <button
                type="button"
                class="mjr-filter-group-toggle"
                :aria-expanded="String(isGroupOpen('core'))"
                @click="toggleGroup('core')"
            >
                <span class="mjr-filter-group-title">{{ t("group.core", "Core") }}</span>
                <span class="mjr-filter-group-chevron" aria-hidden="true">{{ isGroupOpen("core") ? "▾" : "▸" }}</span>
            </button>

            <div v-show="isGroupOpen('core')" class="mjr-filter-group-body">

            <!-- File type -->
            <div class="mjr-popover-row">
                <div class="mjr-popover-label">{{ t("label.type") }}</div>
                <select
                    ref="kindSelectRef"
                    class="mjr-select"
                    :title="t('tooltip.filterByFileType', 'Filter by file type')"
                    :value="panelStore.kindFilter"
                    @change="onKindChange"
                >
                    <option value="">{{ t("filter.all") }}</option>
                    <option value="image">{{ t("filter.images", "Images") }}</option>
                    <option value="video">{{ t("filter.videos", "Videos") }}</option>
                    <option value="audio">{{ t("filter.audio", "Audio") }}</option>
                    <option value="model3d">3D</option>
                </select>
            </div>

            <!-- Workflow only -->
            <div class="mjr-popover-row">
                <div class="mjr-popover-label">{{ t("label.workflow") }}</div>
                <label
                    class="mjr-popover-toggle"
                    :title="t('tooltip.filterWorkflowOnly', 'Show only assets with embedded workflow data')"
                >
                    <input
                        ref="wfCheckboxRef"
                        type="checkbox"
                        :checked="panelStore.workflowOnly"
                        @change="onWorkflowOnlyChange"
                    />
                    <span>{{ t("filter.onlyWithWorkflow") }}</span>
                </label>
            </div>

            <!-- Workflow type -->
            <div class="mjr-popover-row">
                <div class="mjr-popover-label">{{ t("label.workflowType", "Workflow type") }}</div>
                <select
                    ref="workflowTypeSelectRef"
                    class="mjr-select"
                    :value="panelStore.workflowType"
                    @change="onWorkflowTypeChange"
                >
                    <option value="">{{ t("filter.any", "Any") }}</option>
                    <option value="T2I">T2I</option>
                    <option value="I2I">I2I</option>
                    <option value="T2V">T2V</option>
                    <option value="I2V">I2V</option>
                    <option value="V2V">V2V</option>
                    <option value="FLF">FLF (First/Last Frame)</option>
                    <option value="UPSCL">UPSCL</option>
                    <option value="INPT">INPT</option>
                    <option value="TTS">TTS (Text to Speech)</option>
                    <option value="A2A">A2A (Audio to Audio)</option>
                </select>
            </div>

            <!-- Rating -->
            <div class="mjr-popover-row">
                <div class="mjr-popover-label">{{ t("label.rating") }}</div>
                <select
                    ref="ratingSelectRef"
                    class="mjr-select"
                    :title="t('tooltip.filterMinRating', 'Filter by minimum rating')"
                    :value="String(panelStore.minRating || 0)"
                    @change="onRatingChange"
                >
                    <option value="0">{{ t("filter.anyRating") }}</option>
                    <option value="1">★ 1+</option>
                    <option value="2">★ 2+</option>
                    <option value="3">★ 3+</option>
                    <option value="4">★ 4+</option>
                    <option value="5">★ 5</option>
                </select>
            </div>
            </div>
        </div>

        <!-- ── Media group ─────────────────────────────────────────────────── -->
        <div class="mjr-filter-group" :class="{ 'is-open': isGroupOpen('media') }">
            <button
                type="button"
                class="mjr-filter-group-toggle"
                :aria-expanded="String(isGroupOpen('media'))"
                @click="toggleGroup('media')"
            >
                <span class="mjr-filter-group-title">{{ t("group.media", "Media") }}</span>
                <span class="mjr-filter-group-chevron" aria-hidden="true">{{ isGroupOpen("media") ? "▾" : "▸" }}</span>
            </button>

            <div v-show="isGroupOpen('media')" class="mjr-filter-group-body">

            <!-- File size -->
            <div class="mjr-popover-row mjr-popover-row--3col">
                <div class="mjr-popover-label">{{ t("label.fileSizeMB", "File size (MB)") }}</div>
                <input
                    ref="minSizeInputRef"
                    type="number"
                    min="0"
                    step="0.1"
                    class="mjr-input"
                    :placeholder="t('label.min', 'Min')"
                    :value="panelStore.minSizeMB || ''"
                    @change="onSizeChange"
                />
                <input
                    ref="maxSizeInputRef"
                    type="number"
                    min="0"
                    step="0.1"
                    class="mjr-input"
                    :placeholder="t('label.max', 'Max')"
                    :value="panelStore.maxSizeMB || ''"
                    @change="onSizeChange"
                />
            </div>

            <!-- Resolution preset -->
            <div class="mjr-popover-row">
                <div class="mjr-popover-label">{{ t("label.resolutionPx", "Resolution (px)") }}</div>
                <select
                    ref="resolutionPresetSelectRef"
                    class="mjr-select"
                    :value="resolutionPresetValue"
                    @change="onResolutionPresetChange"
                >
                    <option value="">{{ t("filter.any", "Any") }}</option>
                    <option value="hd">HD (1280×720)</option>
                    <option value="fhd">FHD (1920×1080)</option>
                    <option value="qhd">QHD (2560×1440)</option>
                    <option value="uhd">4K (3840×2160)</option>
                </select>
            </div>

            <!-- Min resolution -->
            <div class="mjr-popover-row mjr-popover-row--3col">
                <div class="mjr-popover-label">{{ t("label.resolutionMinWxH", "Min WxH (px)") }}</div>
                <input
                    ref="minWidthInputRef"
                    type="number"
                    min="0"
                    step="1"
                    class="mjr-input"
                    :placeholder="t('label.widthPx', 'W (px)')"
                    :title="t('tooltip.widthPx', 'Minimum width in pixels')"
                    :value="panelStore.minWidth || ''"
                    @change="onResolutionChange"
                />
                <input
                    ref="minHeightInputRef"
                    type="number"
                    min="0"
                    step="1"
                    class="mjr-input"
                    :placeholder="t('label.heightPx', 'H (px)')"
                    :title="t('tooltip.heightPx', 'Minimum height in pixels')"
                    :value="panelStore.minHeight || ''"
                    @change="onResolutionChange"
                />
            </div>

            <!-- Max resolution -->
            <div class="mjr-popover-row mjr-popover-row--3col">
                <div class="mjr-popover-label">{{ t("label.resolutionMaxWxH", "Max WxH (px)") }}</div>
                <input
                    ref="maxWidthInputRef"
                    type="number"
                    min="0"
                    step="1"
                    class="mjr-input"
                    :placeholder="t('label.widthPx', 'W (px)')"
                    :title="t('tooltip.widthPx', 'Maximum width in pixels')"
                    :value="panelStore.maxWidth || ''"
                    @change="onResolutionChange"
                />
                <input
                    ref="maxHeightInputRef"
                    type="number"
                    min="0"
                    step="1"
                    class="mjr-input"
                    :placeholder="t('label.heightPx', 'H (px)')"
                    :title="t('tooltip.heightPx', 'Maximum height in pixels')"
                    :value="panelStore.maxHeight || ''"
                    @change="onResolutionChange"
                />
            </div>
            </div>
        </div>

        <!-- ── Time group ──────────────────────────────────────────────────── -->
        <div class="mjr-filter-group" :class="{ 'is-open': isGroupOpen('time') }">
            <button
                type="button"
                class="mjr-filter-group-toggle"
                :aria-expanded="String(isGroupOpen('time'))"
                @click="toggleGroup('time')"
            >
                <span class="mjr-filter-group-title">{{ t("group.time", "Time") }}</span>
                <span class="mjr-filter-group-chevron" aria-hidden="true">{{ isGroupOpen("time") ? "▾" : "▸" }}</span>
            </button>

            <div v-show="isGroupOpen('time')" class="mjr-filter-group-body">

            <!-- Date range -->
            <div class="mjr-popover-row">
                <div class="mjr-popover-label">{{ t("label.dateRange") }}</div>
                <select
                    ref="dateRangeSelectRef"
                    class="mjr-select"
                    :title="t('tooltip.filterByDateRange', 'Filter by date range')"
                    :value="panelStore.dateRangeFilter"
                    @change="onDateRangeChange"
                >
                    <option value="">{{ t("filter.anytime") }}</option>
                    <option value="today">{{ t("filter.today") }}</option>
                    <option value="this_week">{{ t("filter.thisWeek") }}</option>
                    <option value="this_month">{{ t("filter.thisMonth") }}</option>
                </select>
            </div>

            <!-- Agenda date picker (hidden input + container for AgendaCalendar) -->
            <div class="mjr-popover-row">
                <div class="mjr-popover-label">{{ t("label.agenda") }}</div>
                <div ref="agendaContainerRef" class="mjr-agenda-container">
                    <input
                        ref="dateExactInputRef"
                        type="date"
                        class="mjr-input mjr-agenda-input"
                        :class="agendaInputClass"
                        style="display: none;"
                        :value="panelStore.dateExactFilter"
                        @change="onDateExactChange"
                    />
                </div>
            </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
.mjr-popover-row {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
}

.mjr-popover-row--3col {
    grid-template-columns: 110px 1fr 1fr;
}

.mjr-popover-label {
    font-size: 12px;
    color: var(--mjr-muted, var(--descrip-text, rgba(255, 255, 255, 0.65)));
    white-space: nowrap;
}

.mjr-popover-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 12px;
    color: var(--fg-color, #e6edf7);
}

.mjr-filter-group-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0;
    margin: 0 0 10px;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    text-align: left;
}

.mjr-filter-group-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.mjr-filter-group-chevron {
    font-size: 12px;
    line-height: 1;
    color: var(--mjr-muted, var(--descrip-text, rgba(255, 255, 255, 0.65)));
}

.mjr-filter-group-body {
    padding-top: 2px;
}

.mjr-filter-group:not(.is-open) {
    padding-bottom: 8px;
}

.mjr-filter-group:not(.is-open) .mjr-filter-group-toggle {
    margin-bottom: 0;
}
</style>
