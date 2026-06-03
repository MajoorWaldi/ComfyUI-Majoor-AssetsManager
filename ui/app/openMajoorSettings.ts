import { getRawHostApp } from "./hostAdapter.js";
import { openMajoorSettingsDialog } from "./settings/MajoorSettingsDialog.js";

export function openMajoorSettings(app: any = getRawHostApp()): any {
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
