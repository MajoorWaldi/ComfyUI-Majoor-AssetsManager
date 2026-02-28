export const ASSET_RATING_CHANGED_EVENT = "mjr:asset-rating-changed";
export const ASSET_TAGS_CHANGED_EVENT = "mjr:asset-tags-changed";
export const VIEWER_INFO_REFRESHED_EVENT = "mjr:viewer-info-refreshed";

export const EVENTS = Object.freeze({
    ASSET_RATING_CHANGED: ASSET_RATING_CHANGED_EVENT,
    ASSET_TAGS_CHANGED: ASSET_TAGS_CHANGED_EVENT,
    VIEWER_INFO_REFRESHED: VIEWER_INFO_REFRESHED_EVENT,
    SCAN_COMPLETE: "mjr-scan-complete",
    ENRICHMENT_STATUS: "mjr-enrichment-status",
    DB_RESTORE_STATUS: "mjr-db-restore-status",
    ASSETS_DELETED: "mjr:assets-deleted",
    SETTINGS_CHANGED: "mjr-settings-changed",
    SELECTION_CHANGED: "mjr:selection-changed",
    RELOAD_GRID: "mjr:reload-grid",
    AGENDA_STATUS: "MJR:AgendaStatus",
    VERSION_UPDATE_AVAILABLE: "mjr:version-update-available",
    // Floating Viewer (MFV)
    MFV_OPEN: "mjr:mfv-open",
    MFV_CLOSE: "mjr:mfv-close",
    MFV_TOGGLE: "mjr:mfv-toggle",
    MFV_LIVE_TOGGLE: "mjr:mfv-live-toggle",
    MFV_VISIBILITY_CHANGED: "mjr:mfv-visibility-changed", // detail: { visible: bool }
    NEW_GENERATION_OUTPUT: "mjr:new-generation-output",
});

