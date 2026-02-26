/**
 * Settings facade.
 * Public API remains stable while implementation is split across sub-modules.
 */

export { startRuntimeStatusDashboard } from "./settings/settingsRuntime.js";
export { loadMajoorSettings, saveMajoorSettings } from "./settings/settingsCore.js";
export { registerMajoorSettings } from "./settings/SettingsPanel.js";
