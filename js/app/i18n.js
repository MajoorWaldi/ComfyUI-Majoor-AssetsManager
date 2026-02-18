/**
 * Internationalization support for Majoor Assets Manager.
 * Detects ComfyUI language and provides translations for the entire UI.
 */
import { GENERATED_TRANSLATIONS } from "./i18n.generated.js";
import { getSettingValue } from "./comfyApiBridge.js";

const DEFAULT_LANG = "en-US";
let currentLang = DEFAULT_LANG;
let _langChangeListeners = [];
const LANG_STORAGE_KEYS = ["mjr_lang", "majoor.lang"];
const FOLLOW_COMFY_LANG_STORAGE_KEY = "mjr_lang_follow_comfy";
const _missingTranslationKeys = new Set();
let _comfyLangSyncTimer = null;

// -----------------------------------------------------------------------------
// DICTIONARY - Full UI translations
// -----------------------------------------------------------------------------
const DICTIONARY = {
    "en-US": {
        // --- Settings Categories ---
        "cat.grid": "Grid",
        "cat.cards": "Cards",
        "cat.badges": "Badges",
        "cat.viewer": "Viewer",
        "cat.scanning": "Scanning",
        "cat.advanced": "Advanced",
        "cat.security": "Security",
        "cat.remote": "Remote Access",

        // --- Settings: Grid ---
        "setting.grid.minsize.name": "Majoor: Thumbnail Size (px)",
        "setting.grid.minsize.desc": "Minimum size of thumbnails in the grid. May require reopening the panel.",
        "setting.grid.cardSize.group": "Card size",
        "setting.grid.cardSize.name": "Majoor: Card Size",
        "setting.grid.cardSize.desc": "Choose a card size preset: small, medium, or large.",
        "setting.grid.cardSize.small": "Small",
        "setting.grid.cardSize.medium": "Medium",
        "setting.grid.cardSize.large": "Large",
        "setting.grid.gap.name": "Majoor: Gap (px)",
        "setting.grid.gap.desc": "Space between thumbnails.",
        "setting.sidebar.pos.name": "Majoor: Sidebar Position",
        "setting.sidebar.pos.desc": "Show details sidebar on the left or the right. Reload required.",
        "setting.siblings.hide.name": "Majoor: Hide PNG Siblings",
        "setting.siblings.hide.desc": "If a video has a corresponding .png preview, hide the .png from the grid.",
        "setting.nav.infinite.name": "Majoor: Infinite Scroll",
        "setting.nav.infinite.desc": "Automatically load more files when scrolling.",
        "setting.grid.pagesize.name": "Majoor: Grid Page Size",
        "setting.grid.pagesize.desc": "Number of assets loaded per page/request in the grid.",

        // --- Settings: Viewer ---
        "setting.viewer.pan.name": "Majoor: Pan without Zoom",
        "setting.viewer.pan.desc": "Allow panning the image even at zoom level 1.",
        "setting.minimap.enabled.name": "Majoor: Enable Minimap",
        "setting.minimap.enabled.desc": "Global activation of the workflow minimap.",

        // --- Settings: Scanning ---
        "setting.scan.startup.name": "Majoor: Auto-scan on Startup",
        "setting.scan.startup.desc": "Start a background scan as soon as ComfyUI loads.",
        "setting.watcher.name": "Majoor: File Watcher",
        "setting.watcher.desc": "Watch output and custom folders for manually added files and auto-index them in real time.",
        "setting.watcher.debounce.name": "Majoor: Watcher debounce delay",
        "setting.watcher.debounce.desc": "Delay (ms) for batching watcher events before indexing.",
        "setting.watcher.debounce.error": "Failed to update watcher debounce delay.",
        "setting.watcher.dedupe.name": "Majoor: Watcher dedupe window",
        "setting.watcher.dedupe.desc": "Duration (ms) a file is treated as already processed after an event.",
        "setting.watcher.dedupe.error": "Failed to update watcher dedupe window.",
        "setting.sync.rating.name": "Majoor: Sync Rating/Tags to Files",
        "setting.sync.rating.desc": "Write ratings and tags into file metadata (ExifTool).",

        // --- Settings: Badge Colors ---
        "cat.badgeColors": "Badge colors",
        "setting.starColor": "Star color",
        "setting.starColor.tooltip": "Color of rating stars on thumbnails (hex, e.g. #FFD45A)",
        "setting.badgeImageColor": "Image badge color",
        "setting.badgeImageColor.tooltip": "Color for image badges: PNG, JPG, WEBP, GIF, BMP, TIF (hex)",
        "setting.badgeVideoColor": "Video badge color",
        "setting.badgeVideoColor.tooltip": "Color for video badges: MP4, WEBM, MOV, AVI, MKV (hex)",
        "setting.badgeAudioColor": "Audio badge color",
        "setting.badgeAudioColor.tooltip": "Color for audio badges: MP3, WAV, OGG, FLAC (hex)",
        "setting.badgeModel3dColor": "3D model badge color",
        "setting.badgeModel3dColor.tooltip": "Color for 3D model badges: OBJ, FBX, GLB, GLTF (hex)",

        // --- Settings: Advanced ---
        "setting.obs.enabled.name": "Majoor: Enable Detailed Logs",
        "setting.obs.enabled.desc": "Enable detailed backend logs for debugging.",
        "setting.probe.mode.name": "Majoor: Metadata Backend",
        "setting.probe.mode.desc": "Choose the tool used directly to extract metadata.",
        "setting.language.name": "Majoor: Language",
        "setting.language.desc": "Choose the language for the Assets Manager interface. Reload required to fully apply.",

        // --- Settings: Security ---
        "setting.sec.safe.name": "Majoor: Safe Mode",
        "setting.sec.safe.desc": "When enabled, rating/tags writes are blocked unless explicitly authorized.",
        "setting.sec.remote.name": "Majoor: Allow Remote Full Access",
        "setting.sec.remote.desc": "Allow non-local clients to perform write operations. Disabling blocks writes unless a token is configured.",
        "setting.sec.write.name": "Majoor: Allow Write",
        "setting.sec.write.desc": "Allow writing ratings and tags.",
        "setting.sec.del.name": "Majoor: Allow Delete",
        "setting.sec.del.desc": "Allow deleting files.",
        "setting.sec.ren.name": "Majoor: Allow Rename",
        "setting.sec.ren.desc": "Allow renaming files.",
        "setting.sec.open.name": "Majoor: Allow Open in Folder",
        "setting.sec.open.desc": "Allow opening file location in OS file manager.",
        "setting.sec.reset.name": "Majoor: Allow Index Reset",
        "setting.sec.reset.desc": "Allow resetting the index cache and triggering a full rescan.",
        "setting.sec.token.name": "Majoor: API Token",
        "setting.sec.token.desc": "Store the write authorization token. Majoor inserts it in the Authorization and X-MJR-Token headers.",
        "setting.sec.token.placeholder": "Leave blank to disable.",

        // --- Panel: Tabs ---
        "tab.output": "Output",
        "tab.input": "Input",
        "tab.all": "All",
        "tab.custom": "Custom",
        "manager.title": "Assets Manager",

        // --- Panel: Buttons ---
        "btn.add": "Add",
        "btn.remove": "Remove",
        "btn.adding": "Adding...",
        "btn.removing": "Removing...",
        "btn.retry": "Retry",
        "btn.clear": "Clear",
        "btn.refresh": "Refresh",
        "btn.scan": "Scan",
        "btn.scanning": "Scanning...",
        "btn.resetIndex": "Reset index",
        "btn.resetting": "Resetting...",
        "btn.deleteDb": "Delete DB",
        "btn.deletingDb": "Deleting DB...",
        "btn.retryServices": "Retry services",
        "btn.retrying": "Retrying...",
        "btn.loadWorkflow": "Load Workflow",
        "btn.copyPrompt": "Copy Prompt",
        "btn.close": "Close",

        // --- Panel: Labels ---
        "label.folder": "Folder",
        "label.type": "Type",
        "label.workflow": "Workflow",
        "label.rating": "Rating",
        "label.dateRange": "Date range",
        "label.agenda": "Agenda",
        "label.sort": "Sort",
        "label.scope": "Scope",
        "label.query": "Query",
        "label.only": "Only",
        "label.workflowType": "WF Type",
        "label.resolution": "Resolution",
        "label.day": "Day",
        "label.collections": "Collections",
        "label.filters": "Filters",
        "label.selectFolder": "Select folder?",
        "label.thisFolder": "this folder",
        "label.computer": "Computer",
        "search.placeholder": "Search assets...",
        "search.title": "Search by filename, tags, or attributes (e.g. rating:5, ext:png)",
        "action.copyToClipboard": "Copy to clipboard",
        "action.clickToCopy": "Click to copy",
        "tooltip.copyFieldValue": "Copy value",
        "log.clipboardCopyFailed": "Failed to copy to clipboard",
        "btn.back": "Back",
        "btn.up": "Up",
        "btn.saving": "Saving...",
        "btn.restoring": "Restoring...",

        // --- Panel: Filters ---
        "filter.all": "All",
        "filter.images": "Images",
        "filter.videos": "Videos",
        "filter.onlyWithWorkflow": "Only with workflow",
        "filter.anyRating": "Any rating",
        "filter.minStars": "{n}+ stars",
        "filter.anytime": "Anytime",
        "filter.today": "Today",
        "filter.yesterday": "Yesterday",
        "filter.thisWeek": "This week",
        "filter.thisMonth": "This month",
        "filter.last7days": "Last 7 days",
        "filter.last30days": "Last 30 days",

        // --- Panel: Sort ---
        "sort.newest": "Newest first",
        "sort.oldest": "Oldest first",
        "sort.nameAZ": "Name A-Z",
        "sort.nameZA": "Name Z-A",
        "sort.ratingHigh": "Rating (high)",
        "sort.ratingLow": "Rating (low)",
        "sort.sizeDesc": "Size (large)",
        "sort.sizeAsc": "Size (small)",

        // --- Panel: Status ---
        "status.checking": "Checking...",
        "status.ready": "Ready",
        "status.scanning": "Scanning...",
        "status.error": "Error",
        "status.capabilities": "Capabilities",
        "status.toolStatus": "Tool status",
        "status.selectCustomFolder": "Select a custom folder first",
        "status.errorGetConfig": "Error: Failed to get config",
        "status.discoveringTools": "Capabilities: discovering tools...",
        "status.indexStatus": "Index Status",
        "status.toolStatusChecking": "Tool status: checking...",
        "status.resetIndexHint": "Reset index cache (requires allowResetIndex in settings).",
        "status.scanningHint": "This may take a while",
        "status.toolAvailable": "{tool} available",
        "status.toolUnavailable": "{tool} unavailable",
        "status.unknown": "unknown",
        "status.available": "available",
        "status.missing": "missing",
        "status.path": "Path",
        "status.pathAuto": "auto / not configured",
        "status.noAssets": "No assets indexed yet ({scope})",
        "status.clickToScan": "Click the dot to start a scan",
        "status.assetsIndexed": "{count} assets indexed ({scope})",
        "status.imagesVideos": "Images: {images}  -  Videos: {videos}",
        "status.withWorkflows": "With workflows: {workflows}  -  Generation data: {gendata}",
        "status.dbSize": "Database size: {size}",
        "status.lastScan": "Last scan: {date}",
        "status.scanStats": "Added: {added}  -  Updated: {updated}  -  Skipped: {skipped}",
        "status.watcher.enabled": "Watcher: enabled",
        "status.watcher.enabledScoped": "Watcher: enabled ({scope})",
        "status.watcher.disabled": "Watcher: disabled",
        "status.watcher.disabledScoped": "Watcher: disabled ({scope})",
        "status.apiNotFound": "Majoor API endpoints not found (404)",
        "status.apiNotFoundHint": "Backend routes are not loaded. Restart ComfyUI and check the terminal for Majoor import errors.",
        "status.errorChecking": "Error checking status",
        "status.dbCorrupted": "Database is corrupted",
        "status.dbCorruptedHint": "Use the \"Delete DB\" button below to force-delete and rebuild the index.",
        "status.retryFailed": "Retry failed",
        "status.customBrowserScanDisabled": "Scan is disabled in Browser scope",
        "status.customBrowserScanDisabledHint": "Use Outputs, Inputs, or All to run indexing scans",
        "status.dbBackupNone": "No DB backup available",
        "status.dbHealthLocked": "DB health: locked",
        "status.enrichmentIdle": "idle",
        "status.enrichmentQueue": "Enrich queue: {count}",
        "status.maintenanceBusy": "Maintenance in progress",
        "status.scanInProgress": "Scan in progress",
        "status.scanInProgressHint": "Please wait for scan completion",

        // --- Scopes ---
        "scope.all": "Inputs + Outputs",
        "scope.allFull": "All (Inputs + Outputs)",
        "scope.input": "Inputs",
        "scope.output": "Outputs",
        "scope.custom": "Custom",

        // --- Tools ---
        "tool.exiftool": "ExifTool metadata",
        "tool.exiftool.hint": "PNG/WEBP workflow data (uses ExifTool)",
        "tool.ffprobe": "FFprobe video stats",
        "tool.ffprobe.hint": "Video duration, FPS, and resolution (uses FFprobe)",

        // --- Panel: Messages ---
        "msg.noCollections": "No collections yet.",
        "msg.addCustomFolder": "Add a custom folder to browse.",
        "msg.noResults": "No results found.",
        "msg.loading": "Loading...",
        "msg.errorLoading": "Error loading",
        "msg.errorLoadingFolders": "Error loading folders",
        "msg.noGenerationData": "No generation data found for this file.",
        "msg.rawMetadata": "Raw metadata",
        "msg.noPinnedFolders": "No pinned folders",
        "msg.newVersionTitle": "Majoor Assets Manager",
        "msg.newVersionDetail": "A new version is available",
        "msg.dbResetNotice": "Database reset required",

        // --- Viewer ---
        "viewer.genInfo": "Generation Info",
        "viewer.workflow": "Workflow",
        "viewer.metadata": "Metadata",
        "viewer.noWorkflow": "No workflow data",
        "viewer.noMetadata": "No metadata available",
        "viewer.copySuccess": "Copied to clipboard!",
        "viewer.copyFailed": "Failed to copy",

        // --- Sidebar ---
        "sidebar.details": "Details",
        "sidebar.preview": "Preview",
        "sidebar.rating": "Rating",
        "sidebar.tags": "Tags",
        "sidebar.addTag": "Add tag...",
        "sidebar.noTags": "No tags",
        "sidebar.filename": "Filename",
        "sidebar.dimensions": "Dimensions",
        "sidebar.date": "Date",
        "sidebar.size": "Size",
        "sidebar.genTime": "Generation time",

        // --- Context Menu ---
        "ctx.openViewer": "Open in viewer",
        "ctx.loadWorkflow": "Load workflow",
        "ctx.copyPath": "Copy path",
        "ctx.openInFolder": "Open in folder",
        "ctx.rename": "Rename",
        "ctx.delete": "Delete",
        "ctx.addToCollection": "Add to collection",
        "ctx.removeFromCollection": "Remove from collection",
        "ctx.newCollection": "New collection...",
        "ctx.rescanMetadata": "Rescan metadata",
        "ctx.createCollection": "Create collection...",
        "ctx.exitCollection": "Exit collection view",
        "ctx.createFolderHere": "Create folder here...",
        "ctx.renameFolder": "Rename folder...",
        "ctx.moveFolder": "Move folder...",
        "ctx.deleteFolder": "Delete folder...",
        "ctx.refreshMetadata": "Refresh metadata",
        "ctx.openInNewTab": "Open in New Tab",
        "ctx.downloadOriginal": "Download Original",
        "ctx.download": "Download",
        "ctx.editTags": "Edit tags",
        "ctx.setRating": "Set rating",
        "ctx.resetRating": "Reset rating",
        "ctx.showMetadataPanel": "Show metadata panel",
        "ctx.unpinFolder": "Unpin folder",

        // --- Dialogs ---
        "dialog.confirm": "Confirm",
        "dialog.cancel": "Cancel",
        "dialog.delete.title": "Delete file?",
        "dialog.delete.msg": "Are you sure you want to delete this file? This cannot be undone.",
        "dialog.rename.title": "Rename file",
        "dialog.rename.placeholder": "New filename",
        "dialog.newCollection.title": "New collection",
        "dialog.newCollection.placeholder": "Collection name",
        "dialog.resetIndex.title": "Reset index?",
        "dialog.resetIndex.msg": "This will delete the database and rescan all files. Continue?",
        "dialog.securityWarning": "This looks like a system or very broad directory.\n\nAdding it can expose sensitive files via the viewer/custom roots feature.\n\nContinue?",
        "dialog.securityWarningTitle": "Majoor: Security Warning",
        "dialog.enterFolderPath": "Enter a folder path to add as a Custom root:",
        "dialog.customFoldersTitle": "Majoor: Custom Folders",
        "dialog.removeFolder": "Remove the custom folder \"{name}\"?",
        "dialog.deleteCollection": "Delete collection \"{name}\"?",
        "dialog.createCollection": "Create collection",
        "dialog.collectionPlaceholder": "My collection",
        "dialog.browserRootLabelOptional": "Label for new browser root (optional)",
        "dialog.newFolderName": "New folder name",
        "dialog.renameFolder": "Rename folder",
        "dialog.destinationDirectoryPath": "Destination directory path",
        "dialog.deleteFolderRecursive": "Delete folder \"{name}\" and all contents?",
        "dialog.folderLabelOptional": "Folder label (optional)",
        "dialog.unpinFolder": "Unpin folder \"{name}\"?",
        "dialog.dbRestore.confirm": "Restore selected DB backup? This will replace current DB.",
        "dialog.mergeDuplicateTags": "Merge duplicate tags?",
        "dialog.deleteExactDuplicates": "Delete exact duplicates?",
        "dialog.startDuplicateAnalysis": "Start duplicate analysis?",

        // --- Toasts ---
        "toast.scanStarted": "Scan started",
        "toast.scanComplete": "Scan complete",
        "toast.scanFailed": "Scan failed",
        "toast.resetTriggered": "Reset triggered: Reindexing all files...",
        "toast.resetStarted": "Index reset started. Files will be reindexed in the background.",
        "toast.resetFailed": "Failed to reset index",
        "toast.resetFailedCorrupt": "Reset failed ? database is corrupted. Use the \"Delete DB\" button to force-delete and rebuild.",
        "toast.dbDeleteTriggered": "Deleting database and rebuilding...",
        "toast.dbDeleteSuccess": "Database deleted and rebuilt. Files are being reindexed.",
        "toast.dbDeleteFailed": "Failed to delete database",
        "dialog.dbDelete.confirm": "This will permanently delete the index database and rebuild it from scratch. All ratings, tags, and cached metadata will be lost.\n\nContinue?",
        "toast.deleted": "File deleted",
        "toast.renamed": "File renamed",
        "toast.addedToCollection": "Added to collection",
        "toast.removedFromCollection": "Removed from collection",
        "toast.collectionCreated": "Collection created",
        "toast.permissionDenied": "Permission denied",
        "toast.tagAdded": "Tag added",
        "toast.tagRemoved": "Tag removed",
        "toast.ratingSaved": "Rating saved",
        "toast.failedAddFolder": "Failed to add custom folder",
        "toast.failedRemoveFolder": "Failed to remove custom folder",
        "toast.folderLinked": "Folder linked successfully",
        "toast.folderRemoved": "Folder removed",
        "toast.errorAddingFolder": "An error occurred while adding the custom folder",
        "toast.errorRemovingFolder": "An error occurred while removing the custom folder",
        "toast.failedCreateCollection": "Failed to create collection",
        "toast.failedDeleteCollection": "Failed to delete collection",
        "toast.languageChanged": "Language changed. Reload the page for full effect.",
        "toast.ratingUpdateFailed": "Failed to update rating",
        "toast.ratingUpdateError": "Error updating rating",
        "toast.tagsUpdateFailed": "Failed to update tags",
        "toast.watcherToggleFailed": "Failed to toggle watcher",
        "toast.noValidAssetsSelected": "No valid assets selected.",
        "toast.failedCreateCollectionDot": "Failed to create collection.",
        "toast.failedAddAssetsToCollection": "Failed to add assets to collection.",
        "toast.removeFromCollectionFailed": "Failed to remove from collection.",
        "toast.copyClipboardFailed": "Failed to copy to clipboard",
        "toast.metadataRefreshFailed": "Failed to refresh metadata.",
        "toast.ratingCleared": "Rating cleared",
        "toast.ratingSetN": "Rating set to {n} stars",
        "toast.tagsUpdated": "Tags updated",
        "toast.createFolderFailed": "Failed to create folder",
        "toast.createFolderFailedDetail": "Failed to create folder: {error}",
        "toast.renameFolderFailed": "Failed to rename folder",
        "toast.renameFolderFailedDetail": "Failed to rename folder: {error}",
        "toast.moveFolderFailed": "Failed to move folder",
        "toast.moveFolderFailedDetail": "Failed to move folder: {error}",
        "toast.deleteFolderFailed": "Failed to delete folder",
        "toast.deleteFolderFailedDetail": "Failed to delete folder: {error}",
        "toast.folderCreated": "Folder created: {name}",
        "toast.folderRenamed": "Folder renamed",
        "toast.folderMoved": "Folder moved",
        "toast.folderDeleted": "Folder deleted",
        "toast.pinFolderFailed": "Failed to pin folder",
        "toast.unpinFolderFailed": "Failed to unpin folder",
        "toast.folderPinnedAsBrowserRoot": "Folder pinned as browser root",
        "toast.folderAdded": "Folder added",
        "toast.dbSaveSuccess": "DB backup saved",
        "toast.dbSaveFailed": "Failed to save DB backup",
        "toast.dbRestoreStarted": "DB restore started",
        "toast.dbRestoreFailed": "Failed to restore DB backup",
        "toast.dbRestoreSelect": "Select a DB backup first",
        "toast.nameCollisionInView": "Name collision in current view",
        "toast.fileRenamedSuccess": "File renamed successfully!",
        "toast.fileRenameFailed": "Failed to rename file.",
        "toast.fileDeletedSuccess": "File deleted successfully!",
        "toast.fileDeleteFailed": "Failed to delete file.",
        "toast.openedInFolder": "Opened in folder",
        "toast.openFolderFailed": "Failed to open folder.",
        "toast.pathCopied": "File path copied to clipboard",
        "toast.unableResolveFolderPath": "Unable to resolve folder path",
        "toast.pathCopyFailed": "Failed to copy path",
        "toast.noFilePath": "No file path available for this asset.",
        "toast.downloadingFile": "Downloading {filename}...",
        "toast.playbackRate": "Playback {rate}x",
        "toast.metadataRefreshed": "Metadata refreshed{suffix}",
        "toast.enrichmentComplete": "Metadata enrichment complete",
        "toast.errorRenaming": "Error renaming file: {error}",
        "toast.errorDeleting": "Error deleting file: {error}",
        "toast.tagMergeFailed": "Tag merge failed: {error}",
        "toast.deleteFailed": "Delete failed: {error}",
        "toast.analysisNotStarted": "Analysis not started: {error}",
        "toast.dupAnalysisStarted": "Duplicate analysis started",
        "toast.tagsMerged": "Tags merged",
        "toast.duplicatesDeleted": "Duplicates deleted",
        "toast.playbackVideoOnly": "Playback speed is available for video media only",
        "toast.filesDeletedSuccessN": "{n} files deleted successfully!",
        "toast.filesDeletedPartial": "{success} files deleted, {failed} failed.",
        "toast.filesDeletedShort": "{n} files deleted",
        "toast.filesDeletedShortPartial": "{success} deleted, {failed} failed",
        "toast.copiedToClipboardNamed": "{name} copied to clipboard!",
        "toast.rescanningFile": "Rescanning file",
        "summary.assets": "assets",
        "summary.folders": "folders",
        "summary.selected": "selected",
        "summary.hidden": "hidden",
        "summary.duplicates": "duplicates",
        "summary.similar": "similar",

        // --- Hotkeys ---
        // Missing keys filled from runtime usage
        "cat.search": "Search",
        "setting.badgeDuplicateAlertColor": "Duplicate alert badge color",
        "setting.badgeDuplicateAlertColor.tooltip": "Alert color used when duplicate extension badges are shown (e.g. PNG+).",
        "setting.grid.videoAutoplayMode.name": "Majoor: Video Autoplay",
        "setting.grid.videoAutoplayMode.desc": "Controls video thumbnail playback in the grid. Off: static frame. Hover: play on mouse hover. Always: loop while visible.",
        "setting.grid.videoAutoplayMode.off": "Off",
        "setting.grid.videoAutoplayMode.hover": "Hover",
        "setting.grid.videoAutoplayMode.always": "Always",
        "setting.watcher.enabled.label": "Watcher enabled",
        "setting.watcher.debounce.label": "Watcher debounce (ms)",
        "setting.watcher.dedupe.label": "Watcher dedupe window (ms)",
        "setting.search.maxResults.name": "Majoor: Search max results",
        "setting.search.maxResults.desc": "Maximum number of results returned by search endpoints.",
        "btn.dbSave": "Save DB",
        "btn.dbRestore": "Restore DB",
        "status.dbBackupSelectHint": "Select a DB backup to restore",
        "status.dbBackupLoading": "Loading DB backups...",
        "status.dbSaveHint": "Create a DB backup snapshot now.",
        "status.dbRestoreHint": "Restore selected DB backup and restart indexing.",
        "status.dbHealthOk": "DB health: ok",
        "runtime.unavailable": "Runtime: unavailable",
        "runtime.metricsTitle": "Runtime Metrics\nDB active connections: {active}\nEnrichment queue: {enrichQ}\nWatcher pending files: {pending}",
        "runtime.metricsLine": "DB active: {active} | Enrich Q: {enrichQ} | Watcher pending: {pending}",
        "status.dbHealthError": "DB health: error",
        "status.indexHealthOk": "Index health: ok",
        "status.indexHealthPartial": "Index health: partial",
        "status.indexHealthEmpty": "Index health: empty",
        "status.pending": "Pending",
        "status.dbRestoreInProgress": "DB restore in progress",
        "status.scanningScope": "Scanning scope: {scope}",
        "status.toast.info": "Index status: checking",
        "status.toast.success": "Index status: ready",
        "status.toast.warning": "Index status: attention needed",
        "status.toast.error": "Index status: error",
        "status.toast.browser": "Index status: browser scope",
        "status.browserMetricsHidden": "Browser mode: global DB/index metrics hidden",
        "toast.dbRestoreStopping": "Stopping running workers",
        "toast.dbRestoreResetting": "Unlocking and resetting database",
        "toast.dbRestoreReplacing": "Replacing database files",
        "toast.dbRestoreRescan": "Restarting scan",
        "toast.dbRestoreSuccess": "Database backup restored",
        "hotkey.scan": "Scan (S)",
        "hotkey.search": "Search (Ctrl+F)",
        "hotkey.details": "Toggle details (D)",
        "hotkey.delete": "Delete (Del)",
        "hotkey.viewer": "Open viewer (Enter)",
        "hotkey.escape": "Close (Esc)",
        "tooltip.tab.all": "Browse all assets (inputs + outputs)",
        "tooltip.tab.input": "Browse input folder assets",
        "tooltip.tab.output": "Browse generated outputs",
        "tooltip.tab.custom": "Browse browser folders",
        "tooltip.browserFolders": "Browser folders",
        "tooltip.pinnedFolders": "Pinned folders",
        "tooltip.clearFilter": "Clear {label}",
        "tooltip.duplicateSuggestions": "Duplicate/similarity suggestions",
        "tooltip.closeSidebar": "Close sidebar",
        "tooltip.closeSidebarEsc": "Close sidebar (Esc)",
        "tooltip.supportKofi": "Buy Me a White Monster Drink",
        "tooltip.sidebarTab": "Assets Manager - Browse and search your outputs",
        "ctx.pinAsBrowserRoot": "Pin as Browser Root",
    },

    "fr-FR": {
        "tab.output": "Sortie",
        "tab.input": "Entree",
        "tab.all": "Tout",
        "tab.custom": "Navigateur",
        "manager.title": "Gestionnaire d'assets",

        "scope.all": "Entrees + Sorties",
        "scope.allFull": "Tout (Entrees + Sorties)",
        "scope.input": "Entrees",
        "scope.output": "Sorties",
        "scope.custom": "Navigateur",
        "scope.customBrowser": "Navigateur",

        "search.placeholder": "Rechercher des assets...",
        "search.title": "Rechercher par nom de fichier, tags ou attributs (ex. rating:5, ext:png)",

        "runtime.unavailable": "Runtime indisponible",
        "runtime.metricsTitle": "Metriques runtime\nConnexions DB actives : {active}\nFile enrichissement : {enrichQ}\nFichiers watcher en attente : {pending}",
        "runtime.metricsLine": "DB active : {active} | File enrich. : {enrichQ} | Watcher en attente : {pending}",

        "btn.dbSave": "Sauvegarder BDD",
        "btn.dbRestore": "Restaurer BDD",
        "btn.back": "Retour",
        "btn.up": "Monter",
        "btn.saving": "Sauvegarde...",
        "btn.restoring": "Restauration...",

        "ctx.pinAsBrowserRoot": "Epingler comme racine Browser",
        "ctx.createFolderHere": "Creer dossier ici...",
        "ctx.renameFolder": "Renommer dossier...",
        "ctx.moveFolder": "Deplacer dossier...",
        "ctx.deleteFolder": "Supprimer dossier...",
        "ctx.refreshMetadata": "Rafraichir metadonnees",

        "dialog.browserRootLabelOptional": "Label pour nouvelle racine browser (optionnel)",
        "dialog.newFolderName": "Nom du nouveau dossier",
        "dialog.renameFolder": "Renommer dossier",
        "dialog.destinationDirectoryPath": "Chemin dossier destination",
        "dialog.deleteFolderRecursive": "Supprimer le dossier \"{name}\" et tout son contenu ?",

        "toast.createFolderFailed": "Echec creation dossier",
        "toast.renameFolderFailed": "Echec renommage dossier",
        "toast.moveFolderFailed": "Echec deplacement dossier",
        "toast.deleteFolderFailed": "Echec suppression dossier",
        "toast.folderCreated": "Dossier cree : {name}",
        "toast.folderRenamed": "Dossier renomme",
        "toast.folderMoved": "Dossier deplace",
        "toast.folderDeleted": "Dossier supprime",
        "toast.pinFolderFailed": "Echec epinglage dossier",
        "toast.folderPinnedAsBrowserRoot": "Dossier epingle comme racine browser",

        "label.computer": "Ordinateur",
        "msg.noPinnedFolders": "Aucun dossier epingle",
        "sidebar.placeholderSelectAsset": "Selectionnez un asset pour voir les details",
        "msg.noTagsYet": "Aucun tag pour le moment..."
    },
};

const LANGUAGE_NAMES = Object.freeze({
    "en-US": "English",
    "fr-FR": "Français",
    "zh-CN": "Chinese (Simplified)",
    "ja-JP": "Japanese",
    "ko-KR": "Korean",
    "hi-IN": "Hindi",
    "pt-PT": "Portuguese",
    "es-ES": "Spanish",
    "ru-RU": "Russian",
    "de-DE": "German",
    "it-IT": "Italian",
    "nl-NL": "Dutch",
    "pl-PL": "Polish",
    "tr-TR": "Turkish",
    "vi-VN": "Vietnamese",
    "cs-CZ": "Czech",
    "fa-IR": "Persian",
    "id-ID": "Indonesian",
    "uk-UA": "Ukrainian",
    "hu-HU": "Hungarian",
    "ar-SA": "Arabic",
    "sv-SE": "Swedish",
    "ro-RO": "Romanian",
    "el-GR": "Greek",
});

// Register additional locales with safe fallback to English until translated keys are added.
[
    "zh-CN",
    "ja-JP",
    "ko-KR",
    "hi-IN",
    "pt-PT",
    "es-ES",
    "ru-RU",
    "de-DE",
    "it-IT",
    "nl-NL",
    "pl-PL",
    "tr-TR",
    "vi-VN",
    "cs-CZ",
    "fa-IR",
    "id-ID",
    "uk-UA",
    "hu-HU",
    "ar-SA",
    "sv-SE",
    "ro-RO",
    "el-GR",
].forEach((code) => {
    if (!DICTIONARY[code]) DICTIONARY[code] = {};
});

const CORE_TRANSLATIONS = {
    "en-US": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "fr-FR": { "tab.custom": "Navigateur", "scope.custom": "Navigateur", "scope.customBrowser": "Navigateur" },
    "zh-CN": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "ja-JP": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "ko-KR": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "hi-IN": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "pt-PT": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "es-ES": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "ru-RU": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "de-DE": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "it-IT": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "nl-NL": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "pl-PL": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "tr-TR": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "vi-VN": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "cs-CZ": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "fa-IR": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "id-ID": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "uk-UA": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "hu-HU": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "ar-SA": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "sv-SE": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "ro-RO": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
    "el-GR": { "tab.custom": "Browser", "scope.custom": "Browser", "scope.customBrowser": "Browser" },
};

Object.entries(CORE_TRANSLATIONS).forEach(([code, entries]) => {
    DICTIONARY[code] = { ...(DICTIONARY[code] || {}), ...entries };
});

Object.entries(GENERATED_TRANSLATIONS || {}).forEach(([code, entries]) => {
    DICTIONARY[code] = { ...(DICTIONARY[code] || {}), ...(entries || {}) };
});

// Ensure complete key coverage for all registered locales:
// any missing key falls back to the English string inside each locale pack.
const EN_US_DICT = DICTIONARY["en-US"] || {};
Object.keys(DICTIONARY).forEach((code) => {
    if (code === "en-US") return;
    DICTIONARY[code] = { ...EN_US_DICT, ...(DICTIONARY[code] || {}) };
});

// -----------------------------------------------------------------------------
// API
// -----------------------------------------------------------------------------

/**
 * Map various locale codes to our supported languages.
 */
function mapLocale(locale) {
    if (!locale) return DEFAULT_LANG;
    const raw = String(locale || "").trim();
    const lower = raw.toLowerCase();
    
    // French variants
    if (lower.startsWith("fr")) return "fr-FR";
    
    // English variants
    if (lower.startsWith("en")) return "en-US";

    // Chinese variants
    if (lower.startsWith("zh")) return "zh-CN";

    // Japanese variants
    if (lower.startsWith("ja")) return "ja-JP";

    // Korean variants
    if (lower.startsWith("ko")) return "ko-KR";

    // Hindi variants
    if (lower.startsWith("hi")) return "hi-IN";

    // Portuguese variants
    if (lower.startsWith("pt")) return "pt-PT";

    // Spanish variants
    if (lower.startsWith("es")) return "es-ES";

    // Russian variants
    if (lower.startsWith("ru")) return "ru-RU";
    // German variants
    if (lower.startsWith("de")) return "de-DE";
    // Italian variants
    if (lower.startsWith("it")) return "it-IT";
    // Dutch variants
    if (lower.startsWith("nl")) return "nl-NL";
    // Polish variants
    if (lower.startsWith("pl")) return "pl-PL";
    // Turkish variants
    if (lower.startsWith("tr")) return "tr-TR";
    // Vietnamese variants
    if (lower.startsWith("vi")) return "vi-VN";
    // Czech variants
    if (lower.startsWith("cs")) return "cs-CZ";
    // Persian variants
    if (lower.startsWith("fa")) return "fa-IR";
    // Indonesian variants
    if (lower.startsWith("id")) return "id-ID";
    // Ukrainian variants
    if (lower.startsWith("uk")) return "uk-UA";
    // Hungarian variants
    if (lower.startsWith("hu")) return "hu-HU";
    // Arabic variants
    if (lower.startsWith("ar")) return "ar-SA";
    // Swedish variants
    if (lower.startsWith("sv")) return "sv-SE";
    // Romanian variants
    if (lower.startsWith("ro")) return "ro-RO";
    // Greek variants
    if (lower.startsWith("el")) return "el-GR";
    
    // Direct match
    if (DICTIONARY[raw]) return raw;
    
    return DEFAULT_LANG;
}

function _readStoredLang() {
    try {
        if (typeof localStorage === "undefined") return "";
        for (const key of LANG_STORAGE_KEYS) {
            const value = String(localStorage.getItem(key) || "").trim();
            if (value) return value;
        }
    } catch {}
    return "";
}

function _persistLang(lang) {
    try {
        if (typeof localStorage === "undefined") return;
        // Keep legacy and new key in sync for smooth upgrades.
        localStorage.setItem(LANG_STORAGE_KEYS[0], lang);
        localStorage.setItem(LANG_STORAGE_KEYS[1], lang);
    } catch {}
}

function _readFollowComfyLang() {
    try {
        if (typeof localStorage === "undefined") return true;
        const raw = String(localStorage.getItem(FOLLOW_COMFY_LANG_STORAGE_KEY) || "").trim().toLowerCase();
        if (!raw) return true;
        return !["0", "false", "no", "off"].includes(raw);
    } catch {}
    return true;
}

function _persistFollowComfyLang(enabled) {
    try {
        if (typeof localStorage === "undefined") return;
        localStorage.setItem(FOLLOW_COMFY_LANG_STORAGE_KEY, enabled ?"1" : "0");
    } catch {}
}

function _readComfyLocaleCandidates(app) {
    const out = [];
    const pushCandidate = (value) => {
        if (typeof value !== "string") return;
        const v = value.trim();
        if (v) out.push(v);
    };
    const settingKeys = [
        "AGL.Locale",
        "Comfy.Locale",
        "Comfy.LocaleCode",
        "ComfyUI.Locale",
        "ComfyUI.Frontend.Locale",
    ];
    for (const key of settingKeys) {
        pushCandidate(getSettingValue(app, key));
    }

    // Additional frontend locale surfaces (if present).
    pushCandidate(app?.ui?.locale);
    pushCandidate(app?.locale);
    pushCandidate(app?.ui?.i18n?.locale);

    return out;
}

function _readPlatformLocaleCandidates() {
    const out = [];
    const pushCandidate = (value) => {
        if (typeof value !== "string") return;
        const v = value.trim();
        if (v) out.push(v);
    };
    try {
        if (typeof document !== "undefined") {
            pushCandidate(document?.documentElement?.lang);
        }
    } catch {}
    try {
        if (typeof navigator !== "undefined") {
            pushCandidate(navigator?.language);
            const langs = Array.isArray(navigator?.languages) ?navigator.languages : [];
            for (const lang of langs) pushCandidate(lang);
        }
    } catch {}
    return out;
}

/**
 * Detect and set language from ComfyUI settings.
 * Tries multiple sources compatible with legacy and modern ComfyUI frontends.
 */
export const initI18n = (app) => {
    try {
        const followComfy = _readFollowComfyLang();
        const stored = _readStoredLang();
        const storedMapped = mapLocale(stored);
        const applyFromComfy = () => {
            const comfyCandidates = _readComfyLocaleCandidates(app);
            for (const candidate of comfyCandidates) {
                const mapped = mapLocale(candidate);
                if (DICTIONARY[mapped]) {
                    setLang(mapped);
                    return true;
                }
            }
            return false;
        };

        // Auto mode: strictly follow ComfyUI and never fallback to browser locale
        // (browser locale can be en-US and cause random flip to English).
        if (followComfy) {
            if (applyFromComfy()) return;
            if (stored && DICTIONARY[storedMapped]) {
                setLang(storedMapped);
                return;
            }
            if (DICTIONARY[currentLang]) return;
            setLang(DEFAULT_LANG);
            return;
        }

        // Manual mode: explicit user choice first.
        if (stored && DICTIONARY[storedMapped]) {
            setLang(storedMapped);
            return;
        }

        // Then try ComfyUI settings/runtime locale surfaces.
        if (applyFromComfy()) return;

        // Finally browser/document locale fallback.
        const platformCandidates = _readPlatformLocaleCandidates();
        for (const candidate of platformCandidates) {
            const mapped = mapLocale(candidate);
            if (DICTIONARY[mapped]) {
                setLang(mapped);
                return;
            }
        }

        // Guaranteed fallback.
        setLang(DEFAULT_LANG);
    } catch (err) {
        console.warn("[Majoor i18n] Failed to detect language:", err);
        setLang(DEFAULT_LANG);
    }
};

/**
 * Set the current language.
 */
export const setLang = (lang) => {
    if (!DICTIONARY[lang]) {
        console.warn(`[Majoor i18n] Unknown language: ${lang}, falling back to ${DEFAULT_LANG}`);
        lang = DEFAULT_LANG;
    }
    
    if (currentLang === lang) return;
    
    currentLang = lang;
    
    // Persist preference
    _persistLang(lang);
    
    // Notify listeners
    _langChangeListeners.forEach(cb => {
        try { cb(lang); } catch {}
    });
};

export const setFollowComfyLanguage = (enabled) => {
    _persistFollowComfyLang(!!enabled);
};

export const getFollowComfyLanguage = () => _readFollowComfyLang();

export const startComfyLanguageSync = (app) => {
    try {
        if (typeof window !== "undefined" && window.__MJR_COMFY_LANG_SYNC_TIMER__) {
            clearInterval(window.__MJR_COMFY_LANG_SYNC_TIMER__);
            window.__MJR_COMFY_LANG_SYNC_TIMER__ = null;
        }
    } catch {}
    try {
        if (_comfyLangSyncTimer) {
            clearInterval(_comfyLangSyncTimer);
            _comfyLangSyncTimer = null;
        }
    } catch {}
    _comfyLangSyncTimer = setInterval(() => {
        try {
            if (!_readFollowComfyLang()) return;
            const comfyCandidates = _readComfyLocaleCandidates(app);
            for (const candidate of comfyCandidates) {
                const mapped = mapLocale(candidate);
                if (DICTIONARY[mapped] && mapped !== currentLang) {
                    setLang(mapped);
                    return;
                }
            }
        } catch {}
    }, 2000);
    try {
        if (typeof window !== "undefined") {
            window.__MJR_COMFY_LANG_SYNC_TIMER__ = _comfyLangSyncTimer;
        }
    } catch {}
};

/**
 * Get the current language code.
 */
export const getCurrentLang = () => currentLang;

/**
 * Get list of supported languages.
 */
export const getSupportedLanguages = () => Object.keys(DICTIONARY).map(code => ({
    code,
    name: LANGUAGE_NAMES[code] || code
}));

/**
 * Translate a key.
 * @param {string} key - Translation key
 * @param {string|object} defaultOrParams - Default text or params object
 * @param {object} params - Parameters for interpolation (e.g., {n: 5})
 */
export const t = (key, defaultOrParams, params) => {
    const dict = DICTIONARY[currentLang] || DICTIONARY[DEFAULT_LANG];
    const fallbackDict = DICTIONARY[DEFAULT_LANG];
    
    let text = dict[key] || fallbackDict[key];
    
    if (!text) {
        const missingId = `${currentLang}:${String(key || "")}`;
        if (!_missingTranslationKeys.has(missingId)) {
            _missingTranslationKeys.add(missingId);
            try {
                console.warn(`[Majoor i18n] Missing translation key "${key}" for locale "${currentLang}"`);
            } catch {}
            try {
                if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
                    window.dispatchEvent(new CustomEvent("mjr-i18n-missing-key", {
                        detail: { key: String(key || ""), locale: currentLang }
                    }));
                }
            } catch {}
        }
        // Return default or key
        if (typeof defaultOrParams === "string") return defaultOrParams;
        return key;
    }
    
    // Handle params
    const actualParams = typeof defaultOrParams === "object" ?defaultOrParams : params;
    if (actualParams && typeof actualParams === "object") {
        // Replace {key} with values
        Object.entries(actualParams).forEach(([k, v]) => {
            text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        });
    }
    
    return text;
};

/**
 * Subscribe to language changes.
 */
export const onLangChange = (callback) => {
    if (typeof callback === "function") {
        _langChangeListeners.push(callback);
    }
    return () => {
        _langChangeListeners = _langChangeListeners.filter(cb => cb !== callback);
    };
};

/**
 * Check if a language is supported.
 */
export const isLangSupported = (lang) => !!DICTIONARY[lang];

