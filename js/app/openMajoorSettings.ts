import { getComfyApp } from "./comfyApiBridge.js";
import { openMajoorSettingsDialog } from "./settings/MajoorSettingsDialog.js";

export function openMajoorSettings(app: any = getComfyApp()): any {
    return openMajoorSettingsDialog(app);
}

try {
    if (typeof window !== "undefined") {
        (window as any).MajoorAssetsManager = (window as any).MajoorAssetsManager || {};
        (window as any).MajoorAssetsManager.openSettings = openMajoorSettings;
    }
} catch (e) {
    console.debug?.(e);
}
