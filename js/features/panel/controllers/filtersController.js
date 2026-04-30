import { createPanelStateBridge } from "../../../stores/panelStateBridge.js";

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
    minWidthInput,
    minHeightInput,
    maxWidthInput,
    maxHeightInput,
    dateRangeSelect,
    dateExactInput,
    reloadGrid,
    reconcileSelection = null,
    onFiltersChanged = null,
    lifecycleSignal = null,
}) {
    const { write } = createPanelStateBridge(state, [
        "kindFilter",
        "workflowOnly",
        "minRating",
        "workflowType",
        "minSizeMB",
        "maxSizeMB",
        "minWidth",
        "minHeight",
        "maxWidth",
        "maxHeight",
        "dateRangeFilter",
        "dateExactFilter",
    ]);
    // Shared debounce: batch rapid filter changes into a single grid reload.
    // The gridController already coalesces concurrent reloads, but this prevents
    // the "one extra reload" that happens when a previous reload completes between
    // two filter changes that are slightly spaced apart (e.g., keyboard navigation).
    let _filterReloadTimer = null;
    const scheduleReload = () => {
        if (_filterReloadTimer) clearTimeout(_filterReloadTimer);
        _filterReloadTimer = setTimeout(() => {
            _filterReloadTimer = null;
            try {
                reconcileSelection?.();
            } catch (e) {
                console.debug?.(e);
            }
            reloadGrid().catch(() => {});
        }, 250);
    };

    const disposers = [];
    disposers.push(() => {
        if (_filterReloadTimer) {
            clearTimeout(_filterReloadTimer);
            _filterReloadTimer = null;
        }
    });

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
                } catch (e) {
                    console.debug?.(e);
                }
            }
        });
    };

    addManagedListener(
        kindSelect,
        "change",
        () => {
            write("kindFilter", kindSelect.value || "");
            try {
                onFiltersChanged?.();
            } catch (e) {
                console.debug?.(e);
            }
            scheduleReload();
        },
        lifecycleSignal ? { signal: lifecycleSignal } : undefined,
    );
    addManagedListener(
        wfCheckbox,
        "change",
        () => {
            write("workflowOnly", Boolean(wfCheckbox.checked));
            try {
                onFiltersChanged?.();
            } catch (e) {
                console.debug?.(e);
            }
            scheduleReload();
        },
        lifecycleSignal ? { signal: lifecycleSignal } : undefined,
    );
    addManagedListener(
        ratingSelect,
        "change",
        () => {
            write("minRating", Number(ratingSelect.value || 0) || 0);
            try {
                onFiltersChanged?.();
            } catch (e) {
                console.debug?.(e);
            }
            scheduleReload();
        },
        lifecycleSignal ? { signal: lifecycleSignal } : undefined,
    );
    if (workflowTypeSelect) {
        addManagedListener(
            workflowTypeSelect,
            "change",
            () => {
                write(
                    "workflowType",
                    String(workflowTypeSelect.value || "")
                        .trim()
                        .toUpperCase(),
                );
                try {
                    onFiltersChanged?.();
                } catch (e) {
                    console.debug?.(e);
                }
                scheduleReload();
            },
            lifecycleSignal ? { signal: lifecycleSignal } : undefined,
        );
    }

    const applySizeFilter = () => {
        const minVal = parseLooseNumber(minSizeInput?.value || 0);
        const maxVal = parseLooseNumber(maxSizeInput?.value || 0);
        const nextMin = Number.isFinite(minVal) && minVal > 0 ? minVal : 0;
        let nextMax = Number.isFinite(maxVal) && maxVal > 0 ? maxVal : 0;
        if (nextMax > 0 && nextMin > 0 && nextMax < nextMin) {
            nextMax = nextMin;
            if (maxSizeInput) maxSizeInput.value = String(nextMax);
        }
        write("minSizeMB", nextMin);
        write("maxSizeMB", nextMax);
        try {
            onFiltersChanged?.();
        } catch (e) {
            console.debug?.(e);
        }
        scheduleReload();
    };
    addManagedListener(
        minSizeInput,
        "change",
        applySizeFilter,
        lifecycleSignal ? { signal: lifecycleSignal } : undefined,
    );
    addManagedListener(
        maxSizeInput,
        "change",
        applySizeFilter,
        lifecycleSignal ? { signal: lifecycleSignal } : undefined,
    );

    const applyResolutionFilter = () => {
        const rawMinW = parseLooseNumber(minWidthInput?.value || 0);
        const rawMinH = parseLooseNumber(minHeightInput?.value || 0);
        const rawMaxW = parseLooseNumber(maxWidthInput?.value || 0);
        const rawMaxH = parseLooseNumber(maxHeightInput?.value || 0);
        const minW = Number.isFinite(rawMinW) && rawMinW > 0 ? Math.round(rawMinW) : 0;
        const minH = Number.isFinite(rawMinH) && rawMinH > 0 ? Math.round(rawMinH) : 0;
        let maxW = Number.isFinite(rawMaxW) && rawMaxW > 0 ? Math.round(rawMaxW) : 0;
        let maxH = Number.isFinite(rawMaxH) && rawMaxH > 0 ? Math.round(rawMaxH) : 0;
        // Clamp max to min when both are set
        if (maxW > 0 && minW > 0 && maxW < minW) {
            maxW = minW;
            if (maxWidthInput) maxWidthInput.value = String(maxW);
        }
        if (maxH > 0 && minH > 0 && maxH < minH) {
            maxH = minH;
            if (maxHeightInput) maxHeightInput.value = String(maxH);
        }
        write("minWidth", minW);
        write("minHeight", minH);
        write("maxWidth", maxW);
        write("maxHeight", maxH);
        try {
            if (resolutionPresetSelect) {
                const map = {
                    "1280x720": "hd",
                    "1920x1080": "fhd",
                    "2560x1440": "qhd",
                    "3840x2160": "uhd",
                };
                resolutionPresetSelect.value = map[`${minW}x${minH}`] || "";
            }
        } catch (e) {
            console.debug?.(e);
        }
        try {
            onFiltersChanged?.();
        } catch (e) {
            console.debug?.(e);
        }
        scheduleReload();
    };
    addManagedListener(
        minWidthInput,
        "change",
        applyResolutionFilter,
        lifecycleSignal ? { signal: lifecycleSignal } : undefined,
    );
    addManagedListener(
        minHeightInput,
        "change",
        applyResolutionFilter,
        lifecycleSignal ? { signal: lifecycleSignal } : undefined,
    );
    addManagedListener(
        maxWidthInput,
        "change",
        applyResolutionFilter,
        lifecycleSignal ? { signal: lifecycleSignal } : undefined,
    );
    addManagedListener(
        maxHeightInput,
        "change",
        applyResolutionFilter,
        lifecycleSignal ? { signal: lifecycleSignal } : undefined,
    );

    if (resolutionPresetSelect) {
        addManagedListener(
            resolutionPresetSelect,
            "change",
            () => {
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
                // Presets represent minimum resolution only, so stale max bounds
                // must be cleared to avoid silently constraining the result set.
                write("minWidth", w);
                write("minHeight", h);
                write("maxWidth", 0);
                write("maxHeight", 0);
                if (minWidthInput) minWidthInput.value = w > 0 ? String(w) : "";
                if (minHeightInput) minHeightInput.value = h > 0 ? String(h) : "";
                if (maxWidthInput) maxWidthInput.value = "";
                if (maxHeightInput) maxHeightInput.value = "";
                try {
                    onFiltersChanged?.();
                } catch (e) {
                    console.debug?.(e);
                }
                scheduleReload();
            },
            lifecycleSignal ? { signal: lifecycleSignal } : undefined,
        );
    }
    if (dateRangeSelect) {
        addManagedListener(
            dateRangeSelect,
            "change",
            () => {
                write("dateRangeFilter", dateRangeSelect.value || "");
                if (state.dateRangeFilter && state.dateExactFilter) {
                    write("dateExactFilter", "");
                    if (dateExactInput) {
                        dateExactInput.value = "";
                    }
                }
                try {
                    onFiltersChanged?.();
                } catch (e) {
                    console.debug?.(e);
                }
                scheduleReload();
            },
            lifecycleSignal ? { signal: lifecycleSignal } : undefined,
        );
    }
    if (dateExactInput) {
        const applyAgendaStyle = (status) => {
            dateExactInput.classList.toggle("mjr-agenda-filled", status === "filled");
            dateExactInput.classList.toggle("mjr-agenda-empty", status === "empty");
        };
        addManagedListener(
            dateExactInput,
            "change",
            () => {
                write("dateExactFilter", dateExactInput.value ? String(dateExactInput.value) : "");
                if (state.dateExactFilter && state.dateRangeFilter) {
                    write("dateRangeFilter", "");
                    if (dateRangeSelect) {
                        dateRangeSelect.value = "";
                    }
                }
                if (!state.dateExactFilter) {
                    applyAgendaStyle("");
                }
                try {
                    onFiltersChanged?.();
                } catch (e) {
                    console.debug?.(e);
                }
                scheduleReload();
            },
            lifecycleSignal ? { signal: lifecycleSignal } : undefined,
        );
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
            const opts = lifecycleSignal
                ? { passive: true, signal: lifecycleSignal }
                : { passive: true };
            const win = typeof window !== "undefined" ? window : null;
            win?.addEventListener?.("MJR:AgendaStatus", handleAgendaStatus, opts);
            disposers.push(() => {
                try {
                    win?.removeEventListener?.("MJR:AgendaStatus", handleAgendaStatus, opts);
                } catch (e) {
                    console.debug?.(e);
                }
            });
        } catch (e) {
            console.debug?.(e);
        }
    }

    return () => {
        for (const dispose of disposers.splice(0)) {
            try {
                dispose();
            } catch (e) {
                console.debug?.(e);
            }
        }
    };
}
