import { getComfyApp } from "./comfyApiBridge.js";
import { openMajoorSettingsDialog } from "./settings/MajoorSettingsDialog.js";

export function openMajoorSettings(app = getComfyApp()) {
    return openMajoorSettingsDialog(app);
}

try {
    if (typeof window !== "undefined") {
        window.MajoorAssetsManager = window.MajoorAssetsManager || {};
        window.MajoorAssetsManager.openSettings = openMajoorSettings;
    }
} catch (e) {
    console.debug?.(e);
}
