/**
 * Settings facade.
 * Public API remains stable while implementation lives in settings/SettingsPanel.js.
 */

export {
  startRuntimeStatusDashboard,
  loadMajoorSettings,
  saveMajoorSettings,
  registerMajoorSettings,
} from "./settings/SettingsPanel.js";
