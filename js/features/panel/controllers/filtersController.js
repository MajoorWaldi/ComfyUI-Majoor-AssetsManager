const parseLooseNumber = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw) return 0;
    const normalized = raw.replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
};

export function bindFilters({
    state,
    kindSelect,
    wfCheckbox,
    workflowTypeSelect,
    ratingSelect,
    minSizeInput,
    maxSizeInput,
    resolutionPresetSelect,
    resolutionCompareSelect,
    minWidthInput,
    minHeightInput,
    dateRangeSelect,
    dateExactInput,
    reloadGrid,
    onFiltersChanged = null,
    lifecycleSignal = null
}) {
    const disposers = [];
    const addManagedListener = (target, event, handler, options) => {
        if (!target?.addEventListener || typeof handler !== "function") return;
        try {
            target.addEventListener(event, handler, options);
        } catch {
            try {
                target.addEventListener(event, handler);
            } catch {
                return;
            }
        }
        disposers.push(() => {
            try {
                target.removeEventListener(event, handler, options);
            } catch {
                try {
                    target.removeEventListener(event, handler);
                } catch {}
            }
        });
    };

    addManagedListener(kindSelect, "change", async () => {
        state.kindFilter = kindSelect.value || "";
        try { onFiltersChanged?.(); } catch {}
        await reloadGrid();
    }, lifecycleSignal ? { signal: lifecycleSignal } : undefined);
    addManagedListener(wfCheckbox, "change", async () => {
        state.workflowOnly = Boolean(wfCheckbox.checked);
        try { onFiltersChanged?.(); } catch {}
        await reloadGrid();
    }, lifecycleSignal ? { signal: lifecycleSignal } : undefined);
    addManagedListener(ratingSelect, "change", async () => {
        state.minRating = Number(ratingSelect.value || 0) || 0;
        try { onFiltersChanged?.(); } catch {}
        await reloadGrid();
    }, lifecycleSignal ? { signal: lifecycleSignal } : undefined);
    if (workflowTypeSelect) {
        addManagedListener(workflowTypeSelect, "change", async () => {
            state.workflowType = String(workflowTypeSelect.value || "").trim().toUpperCase();
            try { onFiltersChanged?.(); } catch {}
            await reloadGrid();
        }, lifecycleSignal ? { signal: lifecycleSignal } : undefined);
    }

    const applySizeFilter = async () => {
        const minVal = parseLooseNumber(minSizeInput?.value || 0);
        const maxVal = parseLooseNumber(maxSizeInput?.value || 0);
        state.minSizeMB = Number.isFinite(minVal) && minVal > 0 ? minVal : 0;
        state.maxSizeMB = Number.isFinite(maxVal) && maxVal > 0 ? maxVal : 0;
        if (state.maxSizeMB > 0 && state.minSizeMB > 0 && state.maxSizeMB < state.minSizeMB) {
            state.maxSizeMB = state.minSizeMB;
            if (maxSizeInput) maxSizeInput.value = String(state.maxSizeMB);
        }
        try { onFiltersChanged?.(); } catch {}
        await reloadGrid();
    };
    addManagedListener(minSizeInput, "change", applySizeFilter, lifecycleSignal ? { signal: lifecycleSignal } : undefined);
    addManagedListener(maxSizeInput, "change", applySizeFilter, lifecycleSignal ? { signal: lifecycleSignal } : undefined);

    const applyResolutionFilter = async () => {
        const rawW = parseLooseNumber(minWidthInput?.value || 0);
        const rawH = parseLooseNumber(minHeightInput?.value || 0);
        const w = Number.isFinite(rawW) && rawW > 0 ? Math.round(rawW) : 0;
        const h = Number.isFinite(rawH) && rawH > 0 ? Math.round(rawH) : 0;
        const mode = String(resolutionCompareSelect?.value || state.resolutionCompare || "gte") === "lte" ? "lte" : "gte";
        state.resolutionCompare = mode;
        if (mode === "lte") {
            state.minWidth = 0;
            state.minHeight = 0;
            state.maxWidth = w;
            state.maxHeight = h;
        } else {
            state.minWidth = w;
            state.minHeight = h;
            state.maxWidth = 0;
            state.maxHeight = 0;
        }
        try {
            if (resolutionPresetSelect) {
                const map = {
                    "1280x720": "hd",
                    "1920x1080": "fhd",
                    "2560x1440": "qhd",
                    "3840x2160": "uhd",
                };
                const key = `${w || 0}x${h || 0}`;
                resolutionPresetSelect.value = map[key] || "";
            }
        } catch {}
        try { onFiltersChanged?.(); } catch {}
        await reloadGrid();
    };
    addManagedListener(minWidthInput, "change", applyResolutionFilter, lifecycleSignal ? { signal: lifecycleSignal } : undefined);
    addManagedListener(minHeightInput, "change", applyResolutionFilter, lifecycleSignal ? { signal: lifecycleSignal } : undefined);

    if (resolutionPresetSelect) {
        addManagedListener(resolutionPresetSelect, "change", async () => {
            const preset = String(resolutionPresetSelect.value || "");
            const map = {
                hd: [1280, 720],
                fhd: [1920, 1080],
                qhd: [2560, 1440],
                uhd: [3840, 2160],
            };
            const pair = map[preset] || [0, 0];
            const w = Number(pair[0] || 0);
            const h = Number(pair[1] || 0);
            if (String(state.resolutionCompare || "gte") === "lte") {
                state.minWidth = 0;
                state.minHeight = 0;
                state.maxWidth = w;
                state.maxHeight = h;
            } else {
                state.minWidth = w;
                state.minHeight = h;
                state.maxWidth = 0;
                state.maxHeight = 0;
            }
            if (minWidthInput) minWidthInput.value = w > 0 ? String(w) : "";
            if (minHeightInput) minHeightInput.value = h > 0 ? String(h) : "";
            try { onFiltersChanged?.(); } catch {}
            await reloadGrid();
        }, lifecycleSignal ? { signal: lifecycleSignal } : undefined);
    }
    if (resolutionCompareSelect) {
        addManagedListener(resolutionCompareSelect, "change", applyResolutionFilter, lifecycleSignal ? { signal: lifecycleSignal } : undefined);
    }
    if (dateRangeSelect) {
        addManagedListener(dateRangeSelect, "change", async () => {
            state.dateRangeFilter = dateRangeSelect.value || "";
            if (state.dateRangeFilter && state.dateExactFilter) {
                state.dateExactFilter = "";
                if (dateExactInput) {
                    dateExactInput.value = "";
                }
            }
            try { onFiltersChanged?.(); } catch {}
            await reloadGrid();
        }, lifecycleSignal ? { signal: lifecycleSignal } : undefined);
    }
    if (dateExactInput) {
        const applyAgendaStyle = (status) => {
            dateExactInput.classList.toggle("mjr-agenda-filled", status === "filled");
            dateExactInput.classList.toggle("mjr-agenda-empty", status === "empty");
        };
        addManagedListener(dateExactInput, "change", async () => {
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
        }, lifecycleSignal ? { signal: lifecycleSignal } : undefined);
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
            const opts = lifecycleSignal ? { passive: true, signal: lifecycleSignal } : { passive: true };
            window?.addEventListener?.("MJR:AgendaStatus", handleAgendaStatus, opts);
            disposers.push(() => {
                try {
                    window.removeEventListener("MJR:AgendaStatus", handleAgendaStatus);
                } catch {}
            });
        } catch {}
    }

    return () => {
        for (const dispose of disposers.splice(0)) {
            try {
                dispose();
            } catch {}
        }
    };
}

