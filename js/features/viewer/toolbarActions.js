import { safeAddListener, safeCall } from "./lifecycle.js";

/**
 * Bind all toolbar event handlers (channels, exposure, gamma, toggles, etc.).
 *
 * @param {object} opts
 * @returns {void}
 */
export function bindToolbarEvents({
    unsubs,
    state,
    VIEWER_MODES,
    onMode,
    onClose,
    onToolsChanged,
    onCompareModeChanged,
    onAudioVizModeChanged,
    onExportFrame,
    onCopyFrame,
    singleBtn,
    abBtn,
    sideBtn,
    closeBtn,
    channelsSelect,
    compareModeSelect,
    audioVizModeSelect,
    exposureCtl,
    gammaCtl,
    zebraToggle,
    scopesToggle,
    scopesSelect,
    gridToggle,
    gridModeSelect,
    maskToggle,
    formatSelect,
    maskOpacityCtl,
    probeToggle,
    loupeToggle,
    hudToggle,
    focusToggle,
    genInfoToggle,
    resetGradeBtn,
    exportBtn,
    copyBtn,
    resetExposure,
    resetGamma,
    resetViewerTools,
    expGroup,
    gamGroup,
}) {
    unsubs.push(safeAddListener(singleBtn, "click", () => onMode?.(VIEWER_MODES.SINGLE)));
    unsubs.push(safeAddListener(abBtn, "click", () => onMode?.(VIEWER_MODES.AB_COMPARE)));
    unsubs.push(safeAddListener(sideBtn, "click", () => onMode?.(VIEWER_MODES.SIDE_BY_SIDE)));
    unsubs.push(safeAddListener(closeBtn, "click", () => onClose?.()));

    unsubs.push(
        safeAddListener(channelsSelect, "change", () => {
            try {
                state.channel = String(channelsSelect.value || "rgb");
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onToolsChanged);
        }),
    );

    unsubs.push(
        safeAddListener(compareModeSelect, "change", () => {
            try {
                state.abCompareMode = String(compareModeSelect.value || "wipe");
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onCompareModeChanged);
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(audioVizModeSelect, "change", () => {
            try {
                state.audioVisualizerMode = String(audioVizModeSelect.value || "artistic");
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onAudioVizModeChanged);
            safeCall(onToolsChanged);
        }),
    );

    unsubs.push(
        safeAddListener(exposureCtl.input, "input", () => {
            const ev = Math.max(-10, Math.min(10, Number(exposureCtl.input.value) || 0));
            state.exposureEV = Math.round(ev * 10) / 10;
            try {
                exposureCtl.out.textContent = `${state.exposureEV.toFixed(1)}EV`;
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(safeAddListener(exposureCtl.input, "dblclick", resetExposure));
    unsubs.push(safeAddListener(exposureCtl.out, "click", resetExposure));
    unsubs.push(
        safeAddListener(
            expGroup.querySelector?.(".mjr-viewer-tools-group-label"),
            "click",
            resetExposure,
        ),
    );

    unsubs.push(
        safeAddListener(gammaCtl.input, "input", () => {
            const g = Math.max(0.1, Math.min(3, Number(gammaCtl.input.value) || 1));
            state.gamma = Math.round(g * 100) / 100;
            try {
                gammaCtl.out.textContent = state.gamma.toFixed(2);
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(safeAddListener(gammaCtl.input, "dblclick", resetGamma));
    unsubs.push(safeAddListener(gammaCtl.out, "click", resetGamma));
    unsubs.push(
        safeAddListener(
            gamGroup.querySelector?.(".mjr-viewer-tools-group-label"),
            "click",
            resetGamma,
        ),
    );

    unsubs.push(
        safeAddListener(zebraToggle.b, "click", () => {
            state.analysisMode = state.analysisMode === "zebra" ? "none" : "zebra";
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(scopesToggle.b, "click", () => {
            try {
                const current = String(state.scopesMode || "off");
                const next = current === "off" ? "both" : "off";
                state.scopesMode = next;
                try {
                    scopesSelect.value = String(next);
                } catch (e) {
                    console.debug?.(e);
                }
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(scopesSelect, "change", () => {
            try {
                const v = String(scopesSelect.value || "off");
                state.scopesMode = v;
            } catch {
                try {
                    state.scopesMode = "off";
                } catch (e) {
                    console.debug?.(e);
                }
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(gridToggle.b, "click", () => {
            state.gridMode = Number(state.gridMode) || 0 ? 0 : 1;
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(gridModeSelect, "change", () => {
            try {
                const next = Number(gridModeSelect.value);
                state.gridMode = Number.isFinite(next) ? next : 0;
            } catch {
                try {
                    state.gridMode = 0;
                } catch (e) {
                    console.debug?.(e);
                }
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(maskToggle.b, "click", () => {
            try {
                state.overlayMaskEnabled = !state.overlayMaskEnabled;
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(formatSelect, "change", () => {
            try {
                state.overlayFormat = String(formatSelect.value || "image");
            } catch {
                try {
                    state.overlayFormat = "image";
                } catch (e) {
                    console.debug?.(e);
                }
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(maskOpacityCtl.input, "input", () => {
            try {
                const v = Number(maskOpacityCtl.input.value);
                const clamped = Math.max(0, Math.min(0.9, Number.isFinite(v) ? v : 0.65));
                state.overlayMaskOpacity = Math.round(clamped * 100) / 100;
                maskOpacityCtl.out.textContent = state.overlayMaskOpacity.toFixed(2);
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(probeToggle.b, "click", () => {
            state.probeEnabled = !state.probeEnabled;
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(loupeToggle.b, "click", () => {
            state.loupeEnabled = !state.loupeEnabled;
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(hudToggle.b, "click", () => {
            state.hudEnabled = !state.hudEnabled;
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(focusToggle.b, "click", () => {
            state.distractionFree = !state.distractionFree;
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(genInfoToggle.b, "click", () => {
            try {
                state.genInfoOpen = !state.genInfoOpen;
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(resetGradeBtn, "click", () => {
            resetViewerTools();
        }),
    );
    unsubs.push(
        safeAddListener(exportBtn, "click", () => {
            try {
                void onExportFrame?.();
            } catch (e) {
                console.debug?.(e);
            }
        }),
    );
    unsubs.push(
        safeAddListener(copyBtn, "click", () => {
            try {
                void onCopyFrame?.();
            } catch (e) {
                console.debug?.(e);
            }
        }),
    );
}

/**
 * Synchronise all toolbar UI controls from viewer state.
 *
 * @param {object} opts – references to controls and state
 * @returns {void}
 */
export function syncToolsUIFromState({
    state,
    VIEWER_MODES,
    getCanAB,
    header,
    toolsRow,
    chGroup,
    expGroup,
    gamGroup,
    anaGroup,
    gradePanel,
    overlayPanel,
    inspectPanel,
    infoPanel,
    actionPanel,
    ovGuidesGroup,
    ovInspectGroup,
    model3dHint,
    helpWrap,
    channelsSelect,
    compareModeSelect,
    audioVizModeSelect,
    exposureCtl,
    gammaCtl,
    zebraToggle,
    scopesToggle,
    scopesSelect,
    gridToggle,
    gridModeSelect,
    maskToggle,
    formatSelect,
    maskOpacityCtl,
    probeToggle,
    loupeToggle,
    hudToggle,
    focusToggle,
    genInfoToggle,
    exportBtn,
    copyBtn,
    resetGradeBtn,
    cmpGroup,
    audGroup,
    ACCENT,
    setSelectHighlighted,
    setChannelSelectStyle,
    setValueHighlighted,
    setGroupHighlighted,
}) {
    const current = state?.assets?.[state?.currentIndex] || null;
    const isModel3D = String(current?.kind || "").toLowerCase() === "model3d";
    try {
        const hidden = isModel3D ? "none" : "";
        chGroup.style.display = hidden;
        expGroup.style.display = hidden;
        gamGroup.style.display = hidden;
        anaGroup.style.display = hidden;
        resetGradeBtn.style.display = hidden;
        model3dHint.style.display = isModel3D ? "inline-flex" : "none";
        gradePanel.panel.style.display = isModel3D ? "none" : "";
        overlayPanel.panel.style.display = isModel3D ? "none" : "";
        infoPanel.panel.style.display = "";
        actionPanel.panel.style.display = "";
        const ovInspectLabel = ovInspectGroup.querySelector?.(".mjr-viewer-tools-group-label");
        if (isModel3D) {
            ovGuidesGroup.style.display = "none";
            ovInspectGroup.style.display = "";
            if (ovInspectLabel) ovInspectLabel.style.display = "none";
            helpWrap.style.display = "none";
            header.style.padding = "10px 16px";
            header.style.gap = "6px";
            toolsRow.style.padding = "6px 8px 6px";
            for (const el of [
                gridToggle.b,
                gridModeSelect,
                maskToggle.b,
                formatSelect,
                maskOpacityCtl.wrap,
                probeToggle.b,
                loupeToggle.b,
                hudToggle.b,
            ]) {
                try {
                    el.style.display = "none";
                } catch (_) {}
            }
        } else {
            ovGuidesGroup.style.display = "";
            ovInspectGroup.style.display = "";
            if (ovInspectLabel) ovInspectLabel.style.display = "";
            helpWrap.style.display = "";
            gradePanel.panel.style.display = "";
            overlayPanel.panel.style.display = "";
            infoPanel.panel.style.display = "";
            actionPanel.panel.style.display = "";
            header.style.padding = "8px 16px";
            header.style.gap = "6px";
            toolsRow.style.padding = "8px 8px 6px";
            for (const el of [
                gridToggle.b,
                gridModeSelect,
                maskToggle.b,
                formatSelect,
                maskOpacityCtl.wrap,
                probeToggle.b,
                loupeToggle.b,
                hudToggle.b,
            ]) {
                try {
                    el.style.display = "";
                } catch (_) {}
            }
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        channelsSelect.value = String(state.channel || "rgb");
    } catch (e) {
        console.debug?.(e);
    }
    try {
        compareModeSelect.value = String(state.abCompareMode || "wipe");
        const abOk = typeof getCanAB === "function" ? !!getCanAB() : false;
        const isABCompare = state.mode === VIEWER_MODES.AB_COMPARE && abOk;
        const isSideCompare = state.mode === VIEWER_MODES.SIDE_BY_SIDE;
        const showCompare = isABCompare || isSideCompare;
        compareModeSelect.disabled = !isABCompare;
        try {
            cmpGroup.dataset.active = showCompare ? "1" : "0";
            cmpGroup.style.display = showCompare ? "" : "none";
            setGroupHighlighted(cmpGroup, { accentRgb: ACCENT.compare, active: showCompare });
            cmpGroup.title = showCompare ? "Compare tools (active)" : "Compare tools";
        } catch (e) {
            console.debug?.(e);
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const isAudio = String(current?.kind || "") === "audio";
        audGroup.style.display = isAudio ? "" : "none";
        audioVizModeSelect.disabled = !isAudio;
        audioVizModeSelect.value = String(state.audioVisualizerMode || "artistic");
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const ev = Math.round((Number(state.exposureEV) || 0) * 10) / 10;
        exposureCtl.input.value = String(ev);
        exposureCtl.out.textContent = `${ev.toFixed(1)}EV`;
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const g = Math.max(0.1, Math.min(3, Number(state.gamma) || 1));
        gammaCtl.input.value = String(g);
        gammaCtl.out.textContent = g.toFixed(2);
    } catch (e) {
        console.debug?.(e);
    }
    try {
        zebraToggle.setActive(state.analysisMode === "zebra");
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const m = String(state.scopesMode || "off");
        scopesToggle.setActive(m !== "off");
        scopesSelect.value = m;
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const currentKind = String(current?.kind || "");
        const show = currentKind === "video" || currentKind === "model3d";
        exportBtn.style.display = show ? "" : "none";
        copyBtn.style.display = show ? "" : "none";
        const canClip = !!(globalThis?.ClipboardItem && navigator?.clipboard?.write);
        copyBtn.style.display = show && canClip ? "" : "none";
    } catch (e) {
        console.debug?.(e);
    }
    try {
        gridToggle.setActive((Number(state.gridMode) || 0) !== 0);
    } catch (e) {
        console.debug?.(e);
    }
    try {
        gridModeSelect.value = String(Number(state.gridMode) || 0);
    } catch (e) {
        console.debug?.(e);
    }
    try {
        maskToggle.setActive(Boolean(state.overlayMaskEnabled));
        formatSelect.value = String(state.overlayFormat || "image");
        maskOpacityCtl.input.value = String(Number(state.overlayMaskOpacity ?? 0.65));
        maskOpacityCtl.out.textContent = Number(state.overlayMaskOpacity ?? 0.65).toFixed(2);
    } catch (e) {
        console.debug?.(e);
    }
    try {
        probeToggle.setActive(Boolean(state.probeEnabled));
        loupeToggle.setActive(Boolean(state.loupeEnabled));
    } catch (e) {
        console.debug?.(e);
    }
    try {
        hudToggle.setActive(Boolean(state.hudEnabled));
    } catch (e) {
        console.debug?.(e);
    }
    try {
        focusToggle.setActive(Boolean(state.distractionFree));
    } catch (e) {
        console.debug?.(e);
    }
    try {
        genInfoToggle.setActive(Boolean(state.genInfoOpen));
    } catch (e) {
        console.debug?.(e);
    }

    // Highlight menus + values when non-default.
    try {
        const channel = String(state.channel || "rgb");
        setChannelSelectStyle(channel);
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const ev = Math.round((Number(state.exposureEV) || 0) * 10) / 10;
        setValueHighlighted(exposureCtl.out, {
            accentRgb: ACCENT.exposure,
            active: Math.abs(ev) > 0.0001,
        });
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const g = Math.round((Number(state.gamma) || 1) * 100) / 100;
        setValueHighlighted(gammaCtl.out, {
            accentRgb: ACCENT.gamma,
            active: Math.abs(g - 1) > 0.0001,
        });
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const m = String(state.scopesMode || "off");
        setSelectHighlighted(scopesSelect, {
            accentRgb: ACCENT.analysis,
            active: m !== "off",
            title: m !== "off" ? "Scopes (active)" : "Scopes",
        });
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const gm = Number(state.gridMode) || 0;
        setSelectHighlighted(gridModeSelect, {
            accentRgb: ACCENT.overlay,
            active: gm !== 0,
            title: gm !== 0 ? "Grid Overlay (active)" : "Grid Overlay",
        });
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const fmt = String(state.overlayFormat || "image");
        setSelectHighlighted(formatSelect, {
            accentRgb: ACCENT.overlay,
            active: fmt !== "image",
            title: fmt !== "image" ? "Format (active)" : "Format",
        });
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const abOk = typeof getCanAB === "function" ? !!getCanAB() : false;
        const showCompare = state.mode === VIEWER_MODES.AB_COMPARE && abOk;
        const cm = String(state.abCompareMode || "wipe");
        setSelectHighlighted(compareModeSelect, {
            accentRgb: ACCENT.compare,
            active: showCompare && cm !== "wipe",
            title: showCompare && cm !== "wipe" ? "Compare Mode (modified)" : "A/B Compare Mode",
        });
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const isAudio = String(current?.kind || "") === "audio";
        const mode = String(state.audioVisualizerMode || "artistic");
        setSelectHighlighted(audioVizModeSelect, {
            accentRgb: ACCENT.audioviz,
            active: isAudio && mode !== "simple",
            title: "Audio visualizer mode",
        });
    } catch (e) {
        console.debug?.(e);
    }

    // Highlight GenInfo when open.
    try {
        const on = Boolean(state.genInfoOpen);
        const btn = genInfoToggle?.b;
        if (btn && on) {
            btn.style.borderColor = `rgba(${ACCENT.geninfo},0.55)`;
            btn.style.background = `rgba(${ACCENT.geninfo},0.14)`;
        }
    } catch (e) {
        console.debug?.(e);
    }
}

/**
 * Sync the Single / A|B / Side mode button states.
 */
export function syncModeButtons({
    state,
    VIEWER_MODES,
    singleBtn,
    abBtn,
    sideBtn,
    canAB,
    canSide,
}) {
    try {
        const abOk = !!canAB?.();
        const sideOk = !!canSide?.();
        abBtn.disabled = !abOk;
        sideBtn.disabled = !sideOk;
        abBtn.style.opacity = abBtn.disabled
            ? "0.35"
            : state.mode === VIEWER_MODES.AB_COMPARE
              ? "1"
              : "0.6";
        sideBtn.style.opacity = sideBtn.disabled
            ? "0.35"
            : state.mode === VIEWER_MODES.SIDE_BY_SIDE
              ? "1"
              : "0.6";
        singleBtn.style.opacity = state.mode === VIEWER_MODES.SINGLE ? "1" : "0.6";
        singleBtn.style.fontWeight = state.mode === VIEWER_MODES.SINGLE ? "600" : "400";
        try {
            singleBtn.setAttribute(
                "aria-pressed",
                state.mode === VIEWER_MODES.SINGLE ? "true" : "false",
            );
            abBtn.setAttribute(
                "aria-pressed",
                state.mode === VIEWER_MODES.AB_COMPARE ? "true" : "false",
            );
            sideBtn.setAttribute(
                "aria-pressed",
                state.mode === VIEWER_MODES.SIDE_BY_SIDE ? "true" : "false",
            );
        } catch (e) {
            console.debug?.(e);
        }
    } catch (e) {
        console.debug?.(e);
    }
}
