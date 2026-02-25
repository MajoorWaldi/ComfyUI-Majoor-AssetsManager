import { createDefaultViewerState } from "./state.js";
import { SettingsStore } from "../../app/settings/SettingsStore.js";

const VIEWER_PREFS_KEY = "mjr_viewer_prefs_v1";

export { createDefaultViewerState };

export function loadViewerPrefs() {
    try {
        const raw = SettingsStore.get(VIEWER_PREFS_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export function saveViewerPrefs(state) {
    try {
        if (!state) return;
        const prefs = {
            analysisMode: String(state.analysisMode || "none"),
            loupeEnabled: !!state.loupeEnabled,
            probeEnabled: !!state.probeEnabled,
            hudEnabled: !!state.hudEnabled,
            genInfoOpen: !!state.genInfoOpen,
            audioVisualizerMode: String(state.audioVisualizerMode || "artistic"),
        };
        SettingsStore.set(VIEWER_PREFS_KEY, JSON.stringify(prefs));
    } catch {}
}
