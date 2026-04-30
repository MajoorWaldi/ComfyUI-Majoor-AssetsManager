import { createAgendaCalendar } from "../filters/calendar/AgendaCalendar.js";
import { bindFilters } from "./controllers/filtersController.js";

/**
 * Initialises the filter panel: restores persisted filter values into DOM
 * inputs, creates the agenda calendar, and wires filter-change bindings.
 *
 * Two code paths exist:
 *  - Vue header (`hasVueHeaderSection = true`): filters are Vue-managed;
 *    listen for the `mjr:filters-changed` window event and debounce a reload.
 *  - Legacy header: use `bindFilters` (imperative DOM listeners).
 *
 * @returns {{ agendaCalendar, disposeFilters }}
 */
export function setupFiltersInit({
    state,
    hasVueHeaderSection,
    kindSelect,
    wfCheckbox,
    workflowTypeSelect,
    ratingSelect,
    minSizeInput,
    maxSizeInput,
    resolutionPresetSelect,
    minWidthInput,
    minHeightInput,
    maxWidthInput,
    maxHeightInput,
    dateRangeSelect,
    dateExactInput,
    agendaContainer,
    gridController,
    reconcileVisibleSelection,
    exitSimilarViewIfActive,
    notifyContextChanged,
    panelLifecycleAC,
}) {
    // ── Restore persisted filter values into DOM inputs ────────────────────

    let agendaCalendar = null;
    try {
        try {
            kindSelect.value = state.kindFilter || "";
            wfCheckbox.checked = !!state.workflowOnly;
            workflowTypeSelect.value = String(state.workflowType || "")
                .trim()
                .toUpperCase();
            ratingSelect.value = String(Number(state.minRating || 0) || 0);
            minSizeInput.value = Number(state.minSizeMB || 0) > 0 ? String(state.minSizeMB) : "";
            maxSizeInput.value = Number(state.maxSizeMB || 0) > 0 ? String(state.maxSizeMB) : "";
            minWidthInput.value = Number(state.minWidth || 0) > 0 ? String(state.minWidth) : "";
            minHeightInput.value = Number(state.minHeight || 0) > 0 ? String(state.minHeight) : "";
            maxWidthInput.value = Number(state.maxWidth || 0) > 0 ? String(state.maxWidth) : "";
            maxHeightInput.value = Number(state.maxHeight || 0) > 0 ? String(state.maxHeight) : "";
            const minW = Number(state.minWidth || 0) || 0;
            const minH = Number(state.minHeight || 0) || 0;
            if (minW >= 3840 && minH >= 2160) resolutionPresetSelect.value = "uhd";
            else if (minW >= 2560 && minH >= 1440) resolutionPresetSelect.value = "qhd";
            else if (minW >= 1920 && minH >= 1080) resolutionPresetSelect.value = "fhd";
            else if (minW >= 1280 && minH >= 720) resolutionPresetSelect.value = "hd";
            else resolutionPresetSelect.value = "";
            dateRangeSelect.value = state.dateRangeFilter || "";
            dateExactInput.value = state.dateExactFilter || "";
        } catch (e) {
            console.debug?.(e);
        }

        agendaCalendar = createAgendaCalendar({
            container: agendaContainer,
            hiddenInput: dateExactInput,
            state,
            onRequestReloadGrid: () => gridController.reloadGrid(),
        });
    } catch (e) {
        console.debug?.(e);
    }

    // ── Wire filter-change bindings ────────────────────────────────────────

    let disposeFilters = () => {};

    if (hasVueHeaderSection) {
        let vueFilterReloadTimer = null;
        const onVueFiltersChanged = () => {
            try {
                if (panelLifecycleAC?.signal?.aborted) return;
            } catch (e) {
                console.debug?.(e);
            }
            void exitSimilarViewIfActive({ reload: false });
            try {
                agendaCalendar?.refresh?.();
            } catch (e) {
                console.debug?.(e);
            }
            notifyContextChanged();
            if (vueFilterReloadTimer) clearTimeout(vueFilterReloadTimer);
            vueFilterReloadTimer = setTimeout(() => {
                vueFilterReloadTimer = null;
                try {
                    reconcileVisibleSelection();
                } catch (e) {
                    console.debug?.(e);
                }
                gridController.reloadGrid().catch(() => {});
            }, 250);
        };
        try {
            window.addEventListener("mjr:filters-changed", onVueFiltersChanged, {
                signal: panelLifecycleAC?.signal,
            });
        } catch (e) {
            console.debug?.(e);
        }
        disposeFilters = () => {
            if (vueFilterReloadTimer) {
                clearTimeout(vueFilterReloadTimer);
                vueFilterReloadTimer = null;
            }
        };
    } else {
        disposeFilters = bindFilters({
            state,
            kindSelect,
            wfCheckbox,
            workflowTypeSelect,
            ratingSelect,
            minSizeInput,
            maxSizeInput,
            resolutionPresetSelect,
            minWidthInput,
            minHeightInput,
            maxWidthInput,
            maxHeightInput,
            dateRangeSelect,
            dateExactInput,
            reloadGrid: gridController.reloadGrid,
            reconcileSelection: reconcileVisibleSelection,
            lifecycleSignal: panelLifecycleAC?.signal || null,
            onFiltersChanged: () => {
                void exitSimilarViewIfActive({ reload: false });
                try {
                    agendaCalendar?.refresh?.();
                } catch (e) {
                    console.debug?.(e);
                }
                notifyContextChanged();
            },
        });
    }

    return { agendaCalendar, disposeFilters };
}
