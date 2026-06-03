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

// Numeric/date inputs still expose DOM elements. Selects/checkboxes expose
// value facades because PrimeVue does not render native select nodes.
const minSizeInputRef = ref(null);
const maxSizeInputRef = ref(null);
const minWidthInputRef = ref(null);
const minHeightInputRef = ref(null);
const maxWidthInputRef = ref(null);
const maxHeightInputRef = ref(null);
const agendaContainerRef = ref(null);
const dateExactInputRef = ref(null);
const workflowIdInputRef = ref(null);

const resolveDomElement = (value) => value?.$el || value || null;
const getInputValue = (inputRef) => resolveDomElement(inputRef.value)?.value || "";
const setInputValue = (inputRef, value) => {
    const input = resolveDomElement(inputRef.value);
    if (input) input.value = String(value ?? "");
};

const groupOpen = ref({
    core: true,
    media: false,
    time: true,
});

const fileTypeOptions = computed(() => [
    { label: t("filter.all"), value: "" },
    { label: t("filter.images", "Images"), value: "image" },
    { label: t("filter.videos", "Videos"), value: "video" },
    { label: t("filter.audio", "Audio"), value: "audio" },
    { label: "3D", value: "model3d" },
]);

const workflowTypeOptions = computed(() => [
    { label: t("filter.any", "Any"), value: "" },
    { label: "T2I", value: "T2I" },
    { label: "I2I", value: "I2I" },
    { label: "T2V", value: "T2V" },
    { label: "I2V", value: "I2V" },
    { label: "V2V", value: "V2V" },
    { label: "FLF (First/Last Frame)", value: "FLF" },
    { label: "UPSCL", value: "UPSCL" },
    { label: "INPT", value: "INPT" },
    { label: "TTS (Text to Speech)", value: "TTS" },
    { label: "A2A (Audio to Audio)", value: "A2A" },
]);

const ratingOptions = computed(() => [
    { label: t("filter.anyRating"), value: "0" },
    { label: "★ 1+", value: "1" },
    { label: "★ 2+", value: "2" },
    { label: "★ 3+", value: "3" },
    { label: "★ 4+", value: "4" },
    { label: "★ 5", value: "5" },
]);

const resolutionPresetOptions = computed(() => [
    { label: t("filter.any", "Any"), value: "" },
    { label: "HD (1280×720)", value: "hd" },
    { label: "FHD (1920×1080)", value: "fhd" },
    { label: "QHD (2560×1440)", value: "qhd" },
    { label: "4K (3840×2160)", value: "uhd" },
]);

const dateRangeOptions = computed(() => [
    { label: t("filter.anytime"), value: "" },
    { label: t("filter.today"), value: "today" },
    { label: t("filter.thisWeek"), value: "this_week" },
    { label: t("filter.thisMonth"), value: "this_month" },
]);

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

const applyKindValue = (value, { emit = true } = {}) => {
    panelStore.kindFilter = String(value || "");
    if (emit) dispatchFiltersChanged();
};

const applyWorkflowOnlyValue = (value, { emit = true } = {}) => {
    panelStore.workflowOnly = Boolean(value);
    if (emit) dispatchFiltersChanged();
};

const applyWorkflowTypeValue = (value, { emit = true } = {}) => {
    panelStore.workflowType = String(value || "")
        .trim()
        .toUpperCase();
    if (emit) dispatchFiltersChanged();
};

const applyWorkflowIdValue = (value, { emit = true } = {}) => {
    panelStore.workflowId = String(value || "").trim();
    if (emit) dispatchFiltersChanged();
};

const applyRatingValue = (value, { emit = true } = {}) => {
    panelStore.minRating = Number(value || 0) || 0;
    if (emit) dispatchFiltersChanged();
};

const onSizeChange = () => {
    const nextMin = parseLooseNumber(getInputValue(minSizeInputRef) || 0);
    let nextMax = parseLooseNumber(getInputValue(maxSizeInputRef) || 0);
    if (nextMax > 0 && nextMin > 0 && nextMax < nextMin) {
        nextMax = nextMin;
        setInputValue(maxSizeInputRef, nextMax);
    }
    panelStore.minSizeMB = nextMin > 0 ? nextMin : 0;
    panelStore.maxSizeMB = nextMax > 0 ? nextMax : 0;
    dispatchFiltersChanged();
};

const onResolutionChange = () => {
    const nextMinW = Math.max(0, Math.round(parseLooseNumber(getInputValue(minWidthInputRef) || 0)));
    const nextMinH = Math.max(0, Math.round(parseLooseNumber(getInputValue(minHeightInputRef) || 0)));
    let nextMaxW = Math.max(0, Math.round(parseLooseNumber(getInputValue(maxWidthInputRef) || 0)));
    let nextMaxH = Math.max(0, Math.round(parseLooseNumber(getInputValue(maxHeightInputRef) || 0)));
    if (nextMaxW > 0 && nextMinW > 0 && nextMaxW < nextMinW) {
        nextMaxW = nextMinW;
        setInputValue(maxWidthInputRef, nextMaxW);
    }
    if (nextMaxH > 0 && nextMinH > 0 && nextMaxH < nextMinH) {
        nextMaxH = nextMinH;
        setInputValue(maxHeightInputRef, nextMaxH);
    }
    panelStore.minWidth = nextMinW;
    panelStore.minHeight = nextMinH;
    panelStore.maxWidth = nextMaxW;
    panelStore.maxHeight = nextMaxH;
    dispatchFiltersChanged();
};

const applyResolutionPresetValue = (value, { emit = true } = {}) => {
    const preset = String(value || "").trim();
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
    setInputValue(minWidthInputRef, panelStore.minWidth || "");
    setInputValue(minHeightInputRef, panelStore.minHeight || "");
    setInputValue(maxWidthInputRef, "");
    setInputValue(maxHeightInputRef, "");
    if (emit) dispatchFiltersChanged();
};

const applyDateRangeValue = (value, { emit = true } = {}) => {
    panelStore.dateRangeFilter = String(value || "");
    if (panelStore.dateRangeFilter && panelStore.dateExactFilter) {
        panelStore.dateExactFilter = "";
        setInputValue(dateExactInputRef, "");
    }
    if (emit) dispatchFiltersChanged();
};

const onDateExactChange = (event) => {
    panelStore.dateExactFilter = String(event?.target?.value || "").trim();
    if (panelStore.dateExactFilter && panelStore.dateRangeFilter) {
        panelStore.dateRangeFilter = "";
    }
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

const createValueFacade = ({ getValue, setValue }) => ({
    get value() {
        return getValue();
    },
    set value(nextValue) {
        setValue(nextValue, { emit: false });
    },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
        return true;
    },
});

const createCheckedFacade = ({ getChecked, setChecked }) => ({
    get checked() {
        return getChecked();
    },
    set checked(nextChecked) {
        setChecked(nextChecked, { emit: false });
    },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
        return true;
    },
});

const kindSelectControl = createValueFacade({
    getValue: () => String(panelStore.kindFilter || ""),
    setValue: applyKindValue,
});
const workflowOnlyControl = createCheckedFacade({
    getChecked: () => Boolean(panelStore.workflowOnly),
    setChecked: applyWorkflowOnlyValue,
});
const workflowTypeControl = createValueFacade({
    getValue: () =>
        String(panelStore.workflowType || "")
            .trim()
            .toUpperCase(),
    setValue: applyWorkflowTypeValue,
});
const workflowIdControl = createValueFacade({
    getValue: () => String(panelStore.workflowId || "").trim(),
    setValue: applyWorkflowIdValue,
});
const ratingSelectControl = createValueFacade({
    getValue: () => String(Number(panelStore.minRating || 0) || 0),
    setValue: applyRatingValue,
});
const resolutionPresetControl = createValueFacade({
    getValue: () => resolutionPresetValue.value,
    setValue: applyResolutionPresetValue,
});
const dateRangeControl = createValueFacade({
    getValue: () => String(panelStore.dateRangeFilter || ""),
    setValue: applyDateRangeValue,
});

const activeFiltersCount = computed(() => {
    let count = 0;
    if (String(panelStore.kindFilter || "").trim()) count += 1;
    if (Boolean(panelStore.workflowOnly)) count += 1;
    if (String(panelStore.workflowType || "").trim()) count += 1;
    if (String(panelStore.workflowId || "").trim()) count += 1;
    if ((Number(panelStore.minRating || 0) || 0) > 0) count += 1;
    if ((Number(panelStore.minSizeMB || 0) || 0) > 0 || (Number(panelStore.maxSizeMB || 0) || 0) > 0) {
        count += 1;
    }
    if (
        (Number(panelStore.minWidth || 0) || 0) > 0 ||
        (Number(panelStore.minHeight || 0) || 0) > 0 ||
        (Number(panelStore.maxWidth || 0) || 0) > 0 ||
        (Number(panelStore.maxHeight || 0) || 0) > 0
    ) {
        count += 1;
    }
    if (String(panelStore.dateRangeFilter || "").trim()) count += 1;
    if (String(panelStore.dateExactFilter || "").trim()) count += 1;
    return count;
});

const clearAllFilters = () => {
    panelStore.kindFilter = "";
    panelStore.workflowOnly = false;
    panelStore.workflowType = "";
    panelStore.workflowId = "";
    panelStore.minRating = 0;
    panelStore.minSizeMB = 0;
    panelStore.maxSizeMB = 0;
    panelStore.minWidth = 0;
    panelStore.minHeight = 0;
    panelStore.maxWidth = 0;
    panelStore.maxHeight = 0;
    panelStore.dateRangeFilter = "";
    panelStore.dateExactFilter = "";

    setInputValue(minSizeInputRef, "");
    setInputValue(maxSizeInputRef, "");
    setInputValue(minWidthInputRef, "");
    setInputValue(minHeightInputRef, "");
    setInputValue(maxWidthInputRef, "");
    setInputValue(maxHeightInputRef, "");
    setInputValue(dateExactInputRef, "");
    setInputValue(workflowIdInputRef, "");

    dispatchFiltersChanged();
};

defineExpose({
    get kindSelect()              { return kindSelectControl; },
    get wfCheckbox()              { return workflowOnlyControl; },
    get workflowTypeSelect()      { return workflowTypeControl; },
    get workflowIdInput()         { return workflowIdControl; },
    get ratingSelect()            { return ratingSelectControl; },
    get minSizeInput()            { return resolveDomElement(minSizeInputRef.value); },
    get maxSizeInput()            { return resolveDomElement(maxSizeInputRef.value); },
    get resolutionPresetSelect()  { return resolutionPresetControl; },
    get minWidthInput()           { return resolveDomElement(minWidthInputRef.value); },
    get minHeightInput()          { return resolveDomElement(minHeightInputRef.value); },
    get maxWidthInput()           { return resolveDomElement(maxWidthInputRef.value); },
    get maxHeightInput()          { return resolveDomElement(maxHeightInputRef.value); },
    get dateRangeSelect()         { return dateRangeControl; },
    get dateExactInput()          { return resolveDomElement(dateExactInputRef.value); },
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

        <div class="mjr-filter-head">
            <div class="mjr-filter-head-left">
                <div class="mjr-filter-kicker">{{ t("label.filters", "Filters") }}</div>
                <div class="mjr-filter-subtitle">{{ t("label.refineResults", "Refine your results") }}</div>
            </div>
            <div class="mjr-filter-head-actions">
                <span class="mjr-filter-active-count">{{ activeFiltersCount }}</span>
                <MButton
                    type="button"
                    class="mjr-filter-clear-all"
                    severity="secondary"
                    text
                    :disabled="activeFiltersCount === 0"
                    @click="clearAllFilters"
                >
                    {{ t("action.clearAll", "Clear all") }}
                </MButton>
            </div>
        </div>

        <!-- ── Core group ─────────────────────────────────────────────────── -->
        <div class="mjr-filter-group mjr-filter-group--core" :class="{ 'is-open': isGroupOpen('core') }">
            <MButton
                type="button"
                class="mjr-filter-group-toggle"
                severity="secondary"
                text
                :aria-expanded="String(isGroupOpen('core'))"
                @click="toggleGroup('core')"
            >
                <span class="mjr-filter-group-title">{{ t("group.core", "Core") }}</span>
                <span class="mjr-filter-group-chevron" aria-hidden="true">{{ isGroupOpen("core") ? "▾" : "▸" }}</span>
            </MButton>

            <div v-show="isGroupOpen('core')" class="mjr-filter-group-body">
            <div class="mjr-filter-card">

            <!-- File type -->
            <div class="mjr-popover-row">
                <div class="mjr-popover-label">{{ t("label.type") }}</div>
                <MSelect
                    class="mjr-select mjr-filter-select"
                    panel-class="mjr-filter-select-panel"
                    :title="t('tooltip.filterByFileType', 'Filter by file type')"
                    :model-value="String(panelStore.kindFilter || '')"
                    :options="fileTypeOptions"
                    option-label="label"
                    option-value="value"
                    @update:model-value="applyKindValue"
                />
            </div>

            <!-- Workflow only -->
            <div class="mjr-popover-row">
                <div class="mjr-popover-label">{{ t("label.workflow") }}</div>
                <label
                    class="mjr-popover-toggle"
                    :title="t('tooltip.filterWorkflowOnly', 'Show only assets with embedded workflow data')"
                >
                    <MCheckbox
                        class="mjr-checkbox"
                        :model-value="Boolean(panelStore.workflowOnly)"
                        binary
                        @update:model-value="applyWorkflowOnlyValue"
                    />
                    <span>{{ t("filter.onlyWithWorkflow") }}</span>
                </label>
            </div>
                </div>

            <div class="mjr-filter-card">

            <!-- Workflow type -->
            <div class="mjr-popover-row">
                <div class="mjr-popover-label">{{ t("label.workflowType", "Workflow type") }}</div>
                <MSelect
                    class="mjr-select mjr-filter-select"
                    panel-class="mjr-filter-select-panel"
                    :model-value="String(panelStore.workflowType || '').trim().toUpperCase()"
                    :options="workflowTypeOptions"
                    option-label="label"
                    option-value="value"
                    @update:model-value="applyWorkflowTypeValue"
                />
            </div>

            <!-- Workflow ID -->
            <div class="mjr-popover-row">
                <div class="mjr-popover-label">{{ t("label.sameWorkflow", "Generated with Same Workflow") }}</div>
                <MInputText
                    ref="workflowIdInputRef"
                    class="mjr-input"
                    :title="t('tooltip.filterWorkflowId', 'Filter assets generated from the same embedded workflow id')"
                    :placeholder="t('placeholder.workflowId', 'Workflow ID')"
                    :model-value="String(panelStore.workflowId || '')"
                    @update:model-value="applyWorkflowIdValue"
                    @change="applyWorkflowIdValue($event?.target?.value)"
                />
            </div>

            <!-- Rating -->
            <div class="mjr-popover-row">
                <div class="mjr-popover-label">{{ t("label.rating") }}</div>
                <MSelect
                    class="mjr-select mjr-filter-select"
                    panel-class="mjr-filter-select-panel"
                    :title="t('tooltip.filterMinRating', 'Filter by minimum rating')"
                    :model-value="String(Number(panelStore.minRating || 0) || 0)"
                    :options="ratingOptions"
                    option-label="label"
                    option-value="value"
                    @update:model-value="applyRatingValue"
                />
            </div>
            </div>
            </div>
        </div>

        <!-- ── Media group ─────────────────────────────────────────────────── -->
        <div class="mjr-filter-group mjr-filter-group--media" :class="{ 'is-open': isGroupOpen('media') }">
            <MButton
                type="button"
                class="mjr-filter-group-toggle"
                severity="secondary"
                text
                :aria-expanded="String(isGroupOpen('media'))"
                @click="toggleGroup('media')"
            >
                <span class="mjr-filter-group-title">{{ t("group.media", "Media") }}</span>
                <span class="mjr-filter-group-chevron" aria-hidden="true">{{ isGroupOpen("media") ? "▾" : "▸" }}</span>
            </MButton>

            <div v-show="isGroupOpen('media')" class="mjr-filter-group-body">
            <div class="mjr-filter-card">

            <!-- File size -->
            <div class="mjr-popover-row mjr-popover-row--3col">
                <div class="mjr-popover-label">{{ t("label.fileSizeMB", "File size (MB)") }}</div>
                <MInputText
                    ref="minSizeInputRef"
                    type="number"
                    min="0"
                    step="0.1"
                    class="mjr-input"
                    :placeholder="t('label.min', 'Min')"
                    :value="panelStore.minSizeMB || ''"
                    @change="onSizeChange"
                />
                <MInputText
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
                <MSelect
                    class="mjr-select mjr-filter-select"
                    panel-class="mjr-filter-select-panel"
                    :model-value="resolutionPresetValue"
                    :options="resolutionPresetOptions"
                    option-label="label"
                    option-value="value"
                    @update:model-value="applyResolutionPresetValue"
                />
            </div>

            <!-- Min resolution -->
            <div class="mjr-popover-row mjr-popover-row--3col">
                <div class="mjr-popover-label">{{ t("label.resolutionMinWxH", "Min WxH (px)") }}</div>
                <MInputText
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
                <MInputText
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
                <MInputText
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
                <MInputText
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
        </div>

        <!-- ── Time group ──────────────────────────────────────────────────── -->
        <div class="mjr-filter-group mjr-filter-group--time" :class="{ 'is-open': isGroupOpen('time') }">
            <MButton
                type="button"
                class="mjr-filter-group-toggle"
                severity="secondary"
                text
                :aria-expanded="String(isGroupOpen('time'))"
                @click="toggleGroup('time')"
            >
                <span class="mjr-filter-group-title">{{ t("group.time", "Time") }}</span>
                <span class="mjr-filter-group-chevron" aria-hidden="true">{{ isGroupOpen("time") ? "▾" : "▸" }}</span>
            </MButton>

            <div v-show="isGroupOpen('time')" class="mjr-filter-group-body">
            <div class="mjr-filter-card mjr-filter-card--agenda">

            <!-- Date range -->
            <div class="mjr-popover-row">
                <div class="mjr-popover-label">{{ t("label.dateRange") }}</div>
                <MSelect
                    class="mjr-select mjr-filter-select"
                    panel-class="mjr-filter-select-panel"
                    :title="t('tooltip.filterByDateRange', 'Filter by date range')"
                    :model-value="String(panelStore.dateRangeFilter || '')"
                    :options="dateRangeOptions"
                    option-label="label"
                    option-value="value"
                    @update:model-value="applyDateRangeValue"
                />
            </div>

            <!-- Agenda date picker (hidden input + container for AgendaCalendar) -->
            <div class="mjr-popover-row">
                <div class="mjr-popover-label">{{ t("label.agenda") }}</div>
                <div ref="agendaContainerRef" class="mjr-agenda-container">
                    <MInputText
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

    </div>
</template>

<style scoped>
.mjr-filter-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    margin: 0 0 10px;
    padding: 4px 2px 10px;
    border-bottom: 1px solid color-mix(in srgb, var(--mjr-border) 85%, transparent);
}

.mjr-filter-head-left {
    min-width: 0;
}

.mjr-filter-kicker {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--mjr-accent, #5fb3ff) 65%, var(--content-fg, #ddd));
}

.mjr-filter-subtitle {
    margin-top: 2px;
    font-size: 11px;
    color: color-mix(in srgb, var(--content-fg, #ddd) 62%, var(--mjr-muted, rgba(255, 255, 255, 0.65)));
}

.mjr-filter-head-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
}

.mjr-filter-active-count {
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--mjr-accent, #5fb3ff) 55%, var(--mjr-border));
    background: color-mix(in srgb, var(--mjr-accent, #5fb3ff) 18%, var(--mjr-surface-2));
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    color: var(--content-fg, #fff);
}

.mjr-filter-clear-all {
    height: 24px;
    padding: 0 8px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--mjr-border) 75%, transparent);
    font-size: 11px;
    font-weight: 700;
}

.mjr-popover-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    align-items: start;
    margin-bottom: 10px;
}

.mjr-popover-row--3col {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 8px;
}

.mjr-popover-row--3col .mjr-popover-label {
    grid-column: 1 / -1;
}

.mjr-popover-label {
    font-size: 12px;
    font-weight: 600;
    color: color-mix(in srgb, var(--content-fg, #ddd) 70%, var(--mjr-muted, rgba(255, 255, 255, 0.65)));
    white-space: normal;
}

.mjr-popover-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 12px;
    color: var(--fg-color, #e6edf7);
    padding: 6px 8px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--mjr-border) 80%, transparent);
    background: color-mix(in srgb, var(--mjr-surface-2) 66%, transparent);
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
    border-radius: 8px;
    padding: 2px 4px;
}

.mjr-filter-group {
    --mjr-filter-group-accent: var(--mjr-accent, #7aa2ff);
}

.mjr-filter-group--core {
    --mjr-filter-group-accent: #56a8ff;
}

.mjr-filter-group--media {
    --mjr-filter-group-accent: #35d08b;
}

.mjr-filter-group--time {
    --mjr-filter-group-accent: #f0b84f;
}

.mjr-filter-group-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: color-mix(in srgb, var(--mjr-filter-group-accent) 62%, var(--content-fg, #ddd));
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.mjr-filter-group-title::before {
    content: "";
    width: 6px;
    height: 6px;
    flex: 0 0 6px;
    border-radius: 999px;
    background: var(--mjr-filter-group-accent);
}

.mjr-filter-group-chevron {
    font-size: 12px;
    line-height: 1;
    color: color-mix(in srgb, var(--mjr-filter-group-accent) 78%, var(--mjr-muted, rgba(255, 255, 255, 0.65)));
}

.mjr-filter-group-body {
    padding-top: 4px;
}

.mjr-filter-card {
    border: 1px solid color-mix(in srgb, var(--mjr-border) 88%, transparent);
    border-radius: 10px;
    padding: 10px;
    background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--mjr-surface-2) 86%, transparent),
        color-mix(in srgb, var(--mjr-surface-1) 88%, transparent)
    );
    margin-bottom: 8px;
}

.mjr-filter-card:last-child {
    margin-bottom: 0;
}

.mjr-filter-card--agenda {
    background: linear-gradient(
        180deg,
        color-mix(in srgb, #f0b84f 9%, var(--mjr-surface-2)),
        color-mix(in srgb, var(--mjr-surface-1) 92%, transparent)
    );
}

.mjr-filter-group:not(.is-open) {
    padding-bottom: 8px;
}

.mjr-filter-group:not(.is-open) .mjr-filter-group-toggle {
    margin-bottom: 0;
}

@media (max-width: 440px) {
    .mjr-filter-head {
        flex-direction: column;
        align-items: stretch;
    }

    .mjr-filter-head-actions {
        justify-content: space-between;
    }
}
</style>
