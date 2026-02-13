let _lastAgendaHandler = null;

export function bindFilters({
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
    dateRangeSelect,
    dateExactInput,
    reloadGrid,
    onFiltersChanged = null
}) {
    // Cleanup previous window listener to prevent accumulation
    if (_lastAgendaHandler) {
        try {
            window.removeEventListener("MJR:AgendaStatus", _lastAgendaHandler);
        } catch {}
        _lastAgendaHandler = null;
    }

    kindSelect.addEventListener("change", async () => {
        state.kindFilter = kindSelect.value || "";
        try { onFiltersChanged?.(); } catch {}
        await reloadGrid();
    });
    wfCheckbox.addEventListener("change", async () => {
        state.workflowOnly = Boolean(wfCheckbox.checked);
        try { onFiltersChanged?.(); } catch {}
        await reloadGrid();
    });
    ratingSelect.addEventListener("change", async () => {
        state.minRating = Number(ratingSelect.value || 0) || 0;
        try { onFiltersChanged?.(); } catch {}
        await reloadGrid();
    });
    if (workflowTypeSelect) {
        workflowTypeSelect.addEventListener("change", async () => {
            state.workflowType = String(workflowTypeSelect.value || "").trim().toUpperCase();
            try { onFiltersChanged?.(); } catch {}
            await reloadGrid();
        });
    }

    const applySizeFilter = async () => {
        const minVal = Number(minSizeInput?.value || 0);
        const maxVal = Number(maxSizeInput?.value || 0);
        state.minSizeMB = Number.isFinite(minVal) && minVal > 0 ? minVal : 0;
        state.maxSizeMB = Number.isFinite(maxVal) && maxVal > 0 ? maxVal : 0;
        if (state.maxSizeMB > 0 && state.minSizeMB > 0 && state.maxSizeMB < state.minSizeMB) {
            state.maxSizeMB = state.minSizeMB;
            if (maxSizeInput) maxSizeInput.value = String(state.maxSizeMB);
        }
        try { onFiltersChanged?.(); } catch {}
        await reloadGrid();
    };
    minSizeInput?.addEventListener("change", applySizeFilter);
    maxSizeInput?.addEventListener("change", applySizeFilter);

    const applyResolutionFilter = async () => {
        const minW = Number(minWidthInput?.value || 0);
        const minH = Number(minHeightInput?.value || 0);
        state.minWidth = Number.isFinite(minW) && minW > 0 ? Math.round(minW) : 0;
        state.minHeight = Number.isFinite(minH) && minH > 0 ? Math.round(minH) : 0;
        try {
            if (resolutionPresetSelect) resolutionPresetSelect.value = "";
        } catch {}
        try { onFiltersChanged?.(); } catch {}
        await reloadGrid();
    };
    minWidthInput?.addEventListener("change", applyResolutionFilter);
    minHeightInput?.addEventListener("change", applyResolutionFilter);

    if (resolutionPresetSelect) {
        resolutionPresetSelect.addEventListener("change", async () => {
            const preset = String(resolutionPresetSelect.value || "");
            const map = {
                hd: [1280, 720],
                fhd: [1920, 1080],
                qhd: [2560, 1440],
                uhd: [3840, 2160],
            };
            const pair = map[preset] || [0, 0];
            state.minWidth = Number(pair[0] || 0);
            state.minHeight = Number(pair[1] || 0);
            if (minWidthInput) minWidthInput.value = state.minWidth > 0 ? String(state.minWidth) : "";
            if (minHeightInput) minHeightInput.value = state.minHeight > 0 ? String(state.minHeight) : "";
            try { onFiltersChanged?.(); } catch {}
            await reloadGrid();
        });
    }
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener("change", async () => {
            state.dateRangeFilter = dateRangeSelect.value || "";
            if (state.dateRangeFilter && state.dateExactFilter) {
                state.dateExactFilter = "";
                if (dateExactInput) {
                    dateExactInput.value = "";
                }
            }
            try { onFiltersChanged?.(); } catch {}
            await reloadGrid();
        });
    }
    if (dateExactInput) {
        const applyAgendaStyle = (status) => {
            dateExactInput.classList.toggle("mjr-agenda-filled", status === "filled");
            dateExactInput.classList.toggle("mjr-agenda-empty", status === "empty");
        };
        dateExactInput.addEventListener("change", async () => {
            state.dateExactFilter = dateExactInput.value ? String(dateExactInput.value) : "";
            if (state.dateExactFilter && state.dateRangeFilter) {
                state.dateRangeFilter = "";
                if (dateRangeSelect) {
                    dateRangeSelect.value = "";
                }
            }
            if (!state.dateExactFilter) {
                applyAgendaStyle("");
            }
            try { onFiltersChanged?.(); } catch {}
            await reloadGrid();
        });
        const handleAgendaStatus = (event) => {
            if (!event?.detail) return;
            const { date, hasResults } = event.detail;
            if (!dateExactInput.value) {
                applyAgendaStyle("");
                return;
            }
            if (date !== dateExactInput.value) return;
            applyAgendaStyle(hasResults ? "filled" : "empty");
        };
        try {
            window?.addEventListener?.("MJR:AgendaStatus", handleAgendaStatus, { passive: true });
            _lastAgendaHandler = handleAgendaStatus;
        } catch {}
    }
}

