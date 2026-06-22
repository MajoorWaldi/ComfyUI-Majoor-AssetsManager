/**
 * Internationalization support for Majoor Assets Manager.
 * Detects ComfyUI language and provides translations for the entire UI.
 *
 * Features:
 * - Multi-language support with 22 registered locales
 * - Auto-generation via i18n.generated.js for translated content
 * - ComfyUI locale sync with automatic detection
 * - Fallback chain: Current ? English ? Default string
 * - Missing key tracking with console warnings
 * - RTL language support for Arabic/Persian
 */
import type { MajoorComfyApp } from "../types/comfyui-frontend.js";
import { getSettingForApp } from "./hostAdapter.js";
import { SettingsStore } from "./settings/SettingsStore.js";

const DEFAULT_LANG = "en-US";
let currentLang = DEFAULT_LANG;
const _langChangeListeners = new Set<(lang: string) => void>();
const LANG_STORAGE_KEYS = ["mjr_lang", "majoor.lang"];
const FOLLOW_COMFY_LANG_STORAGE_KEY = "mjr_lang_follow_comfy";

// Missing key tracking with bounded size to prevent memory leaks
const MAX_MISSING_KEYS = 500;
const _missingTranslationKeys = new Set();
let _comfyLangSyncTimer: ReturnType<typeof setTimeout> | null = null;

// RTL languages that require right-to-left text direction
const RTL_LANGUAGES = new Set(["ar-SA", "fa-IR", "he-IL"]);

// Locale mapping lookup table for O(1) access
const LOCALE_MAP: Record<string, string> = {
    // French
    fr: "fr-FR",
    "fr-fr": "fr-FR",
    fr_FR: "fr-FR",
    frfr: "fr-FR",
    // English
    en: "en-US",
    "en-us": "en-US",
    en_US: "en-US",
    enus: "en-US",
    "en-gb": "en-US",
    en_gb: "en-US",
    engb: "en-US",
    // Chinese
    zh: "zh-CN",
    "zh-cn": "zh-CN",
    zh_CN: "zh-CN",
    zhcn: "zh-CN",
    "zh-tw": "zh-CN",
    zh_tw: "zh-CN",
    zhtw: "zh-CN",
    // Japanese
    ja: "ja-JP",
    "ja-jp": "ja-JP",
    ja_jp: "ja-JP",
    jajp: "ja-JP",
    // Korean
    ko: "ko-KR",
    "ko-kr": "ko-KR",
    ko_kr: "ko-KR",
    kokr: "ko-KR",
    // Hindi
    hi: "hi-IN",
    "hi-in": "hi-IN",
    hi_in: "hi-IN",
    hiin: "hi-IN",
    // Portuguese
    pt: "pt-PT",
    "pt-pt": "pt-PT",
    pt_pt: "pt-PT",
    ptpt: "pt-PT",
    "pt-br": "pt-PT",
    pt_br: "pt-PT",
    ptbr: "pt-PT",
    // Spanish
    es: "es-ES",
    "es-es": "es-ES",
    es_es: "es-ES",
    eses: "es-ES",
    // Russian
    ru: "ru-RU",
    "ru-ru": "ru-RU",
    ru_ru: "ru-RU",
    ruru: "ru-RU",
    // German
    de: "de-DE",
    "de-de": "de-DE",
    de_de: "de-DE",
    dede: "de-DE",
    // Italian
    it: "it-IT",
    "it-it": "it-IT",
    it_it: "it-IT",
    itit: "it-IT",
    // Dutch
    nl: "nl-NL",
    "nl-nl": "nl-NL",
    nl_nl: "nl-NL",
    nlnl: "nl-NL",
    // Polish
    pl: "pl-PL",
    "pl-pl": "pl-PL",
    pl_pl: "pl-PL",
    plpl: "pl-PL",
    // Turkish
    tr: "tr-TR",
    "tr-tr": "tr-TR",
    tr_tr: "tr-TR",
    trtr: "tr-TR",
    // Vietnamese
    vi: "vi-VN",
    "vi-vn": "vi-VN",
    vi_vn: "vi-VN",
    vivn: "vi-VN",
    // Czech
    cs: "cs-CZ",
    "cs-cz": "cs-CZ",
    cs_cz: "cs-CZ",
    cscz: "cs-CZ",
    // Persian
    fa: "fa-IR",
    "fa-ir": "fa-IR",
    fa_ir: "fa-IR",
    fair: "fa-IR",
    // Indonesian
    id: "id-ID",
    "id-id": "id-ID",
    id_id: "id-ID",
    idid: "id-ID",
    // Ukrainian
    uk: "uk-UA",
    "uk-ua": "uk-UA",
    uk_ua: "uk-UA",
    ukua: "uk-UA",
    // Hungarian
    hu: "hu-HU",
    "hu-hu": "hu-HU",
    hu_hu: "hu-HU",
    huhu: "hu-HU",
    // Arabic
    ar: "ar-SA",
    "ar-sa": "ar-SA",
    ar_sa: "ar-SA",
    arsa: "ar-SA",
    // Swedish
    sv: "sv-SE",
    "sv-se": "sv-SE",
    sv_se: "sv-SE",
    svse: "sv-SE",
    // Romanian
    ro: "ro-RO",
    "ro-ro": "ro-RO",
    ro_ro: "ro-RO",
    roro: "ro-RO",
    // Greek
    el: "el-GR",
    "el-gr": "el-GR",
    el_gr: "el-GR",
    elgr: "el-GR",
};

// -----------------------------------------------------------------------------
// DICTIONARY - Full UI translations
// -----------------------------------------------------------------------------
const DICTIONARY: Record<string, Record<string, string>> = {
    "en-US": {
        // --- Settings Categories ---
        "cat.grid": "Grid",
        "cat.cards": "Cards",
        "cat.badges": "Badges",
        "cat.viewer": "Viewer",
        "cat.floatingViewer": "Floating Viewer",
        "cat.scanning": "Scanning",
        "cat.advanced": "Advanced",
        "cat.security": "Security",
        "cat.remote": "Remote Access",
        "cat.search": "Search",
        "cat.feed": "Generated Feed",

        // --- Settings: Grid ---
        "setting.grid.minsize.name": "Majoor: Thumbnail Size (px)",
        "setting.grid.minsize.desc":
            "Minimum size of thumbnails in the grid. May require reopening the panel.",
        "setting.grid.cardSize.group": "Card size",
        "setting.grid.cardSize.name": "Majoor: Card Size",
        "setting.grid.cardSize.desc": "Choose a card size preset: small, medium, or large.",
        "setting.grid.cardSize.small": "Small",
        "setting.grid.cardSize.medium": "Medium",
        "setting.grid.cardSize.large": "Large",
        "setting.grid.gap.name": "Majoor: Gap (px)",
        "setting.grid.gap.desc": "Space between thumbnails.",
        "setting.sidebar.pos.name": "Majoor: Sidebar Position",
        "setting.sidebar.pos.desc":
            "Show details sidebar on the left or the right. Reload required.",
        "setting.siblings.hide.name": "Majoor: Hide PNG Siblings",
        "setting.siblings.hide.desc":
            "If a video has a corresponding .png preview, hide the .png from the grid.",
        "setting.nav.infinite.name": "Majoor: Infinite Scroll",
        "setting.nav.infinite.desc": "Automatically load more files when scrolling.",
        "setting.grid.pagesize.name": "Majoor: Grid Page Size",
        "setting.grid.pagesize.desc": "Number of assets loaded per page/request in the grid.",
        "setting.grid.videoAutoplayMode.name": "Majoor: Video Autoplay",
        "setting.grid.videoAutoplayMode.desc":
            "Controls video thumbnail playback in the grid. Off: static frame. Hover: play on mouse hover. Always: loop while visible.",
        "setting.grid.videoAutoplayMode.off": "Off",
        "setting.grid.videoAutoplayMode.hover": "Hover",
        "setting.grid.videoAutoplayMode.always": "Always",

        // --- Settings: Viewer ---
        "setting.viewer.pan.name": "Majoor: Pan without Zoom",
        "setting.viewer.pan.desc": "Allow panning the image even at zoom level 1.",
        "setting.viewer.pauseExecution.name": "Majoor: Pause Main Viewer During Execution",
        "setting.viewer.pauseExecution.desc":
            "Pause the main viewer render processors while ComfyUI is generating to reduce competition for CPU/GPU.",
        "setting.viewer.floatingPauseExecution.name":
            "Majoor: Pause Floating Viewer During Execution",
        "setting.viewer.floatingPauseExecution.desc":
            "Pause the Floating Viewer during generation. Disable this if you want to keep live generation steps visible.",
        "setting.viewer.mfvLiveDefault.name": "Majoor: MFV Live Stream Enabled by Default",
        "setting.viewer.mfvLiveDefault.desc":
            "Controls whether Live Stream starts enabled when the Floating Viewer initializes or resets.",
        "setting.viewer.mfvPreviewDefault.name": "Majoor: MFV KSampler Preview Enabled by Default",
        "setting.viewer.mfvPreviewDefault.desc":
            "Controls whether KSampler preview starts enabled when the Floating Viewer initializes or resets.",
        "setting.viewer.mfvPreviewMethod.name": "Majoor: MFV Preview Method",
        "setting.viewer.mfvPreviewMethod.desc":
            "Preview mode forced by the Floating Viewer Run button. 'taesd' gives the best chance of getting previews, with latent2rgb fallback when available.",
        "setting.minimap.enabled.name": "Majoor: Enable Minimap",
        "setting.minimap.enabled.desc": "Global activation of the workflow minimap.",

        // --- Settings: Scanning ---
        "setting.scan.startup.name": "Majoor: Auto-scan on Startup",
        "setting.scan.startup.desc": "Start a background scan as soon as ComfyUI loads.",
        "setting.watcher.name": "Majoor: File Watcher",
        "setting.watcher.desc":
            "Watch output and custom folders for manually added files and auto-index them in real time.",
        "setting.watcher.enabled.label": "Watcher enabled",
        "setting.watcher.debounce.name": "Majoor: Watcher debounce delay",
        "setting.watcher.debounce.desc": "Delay (ms) for batching watcher events before indexing.",
        "setting.watcher.debounce.label": "Watcher debounce (ms)",
        "setting.watcher.debounce.error": "Failed to update watcher debounce delay.",
        "setting.watcher.dedupe.name": "Majoor: Watcher dedupe window",
        "setting.watcher.dedupe.desc":
            "Duration (ms) a file is treated as already processed after an event.",
        "setting.watcher.dedupe.label": "Watcher dedupe window (ms)",
        "setting.watcher.dedupe.error": "Failed to update watcher dedupe window.",
        "setting.sync.rating.name": "Majoor: Sync Rating/Tags to Files",
        "setting.sync.rating.desc": "Write ratings and tags into file metadata (ExifTool).",

        // --- Settings: Badge Colors ---
        "cat.badgeColors": "Badge colors",
        "setting.starColor": "Star color",
        "setting.starColor.tooltip": "Color of rating stars on thumbnails (hex, e.g. #FFD45A)",
        "setting.badgeImageColor": "Image badge color",
        "setting.badgeImageColor.tooltip":
            "Color for image badges: PNG, JPG, WEBP, GIF, BMP, TIF (hex)",
        "setting.badgeVideoColor": "Video badge color",
        "setting.badgeVideoColor.tooltip": "Color for video badges: MP4, WEBM, MOV, AVI, MKV (hex)",
        "setting.badgeAudioColor": "Audio badge color",
        "setting.badgeAudioColor.tooltip": "Color for audio badges: MP3, WAV, OGG, FLAC (hex)",
        "setting.badgeModel3dColor": "3D model badge color",
        "setting.badgeModel3dColor.tooltip": "Color for 3D model badges: OBJ, FBX, GLB, GLTF (hex)",
        "setting.badgeDuplicateAlertColor": "Duplicate alert badge color",
        "setting.badgeDuplicateAlertColor.tooltip":
            "Alert color used when duplicate extension badges are shown (e.g. PNG+).",

        // --- Settings: Advanced ---
        "setting.obs.enabled.name": "Majoor: Enable Detailed Logs",
        "setting.obs.enabled.desc": "Enable detailed backend logs for debugging.",
        "setting.probe.mode.name": "Majoor: Metadata Backend",
        "setting.probe.mode.desc": "Choose the tool used directly to extract metadata.",
        "setting.language.name": "Majoor: Language",
        "setting.language.desc":
            "Choose the language for the Assets Manager interface. Reload required to fully apply.",
        "setting.search.maxResults.name": "Majoor: Search max results",
        "setting.search.maxResults.desc": "Maximum number of results returned by search endpoints.",
        "setting.ai.vector.enabled.name": "Enable AI semantic search",
        "setting.ai.vector.enabled.desc":
            "Enable CLIP-based semantic search. Disable to use keyword-only search.",
        "setting.ai.vector.captionOnIndex.name": "Generate AI captions during indexing",
        "setting.ai.vector.captionOnIndex.desc":
            "Allow automatic vector indexing and backfill to run Florence-2 captions for image assets. This is slower and can use significant VRAM/CPU; leave it off for faster grid startup.",

        // --- Settings: Security ---
        "setting.sec.safe.name": "Majoor: Safe Mode",
        "setting.sec.safe.desc":
            "When enabled, rating/tags writes are blocked unless explicitly authorized.",
        "setting.sec.requireAuth.name": "Majoor: Require Token For All Writes",
        "setting.sec.requireAuth.desc":
            "Require the Majoor API token even for local loopback writes. Recommended when you want one consistent auth path everywhere.",
        "setting.sec.remoteLanPreset.name": "Majoor: Recommended Remote LAN Setup",
        "setting.sec.remoteLanPreset.desc":
            "One click helper for trusted home/LAN access. Majoor generates a strong token if needed, requires it for writes, and enables HTTP token transport automatically on plain-HTTP LAN sessions.",
        "setting.sec.remote.name": "Majoor: Allow Remote Full Access",
        "setting.sec.remote.desc":
            "Allow non-local clients to perform write operations. Disabling blocks writes unless a token is configured.",
        "setting.sec.insecureTransport.name": "Majoor: Allow HTTP Token Transport",
        "setting.sec.insecureTransport.desc":
            "Allow the Majoor API token over plain HTTP for trusted LAN setups. Unsafe on untrusted networks; HTTPS is preferred.",
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
        "setting.sec.token.desc":
            "Store the write authorization token. Majoor inserts it in the Authorization and X-MJR-Token headers.",
        "setting.sec.token.placeholder": "Auto-generated for this browser session.",
        "setting.sec.token.placeholderConfigured":
            "Token configured on server ({tokenHint}). Leave blank to keep the current server token.",
        "setting.sec.token.placeholderConfiguredGeneric":
            "Token configured on server. Leave blank to keep the current server token.",

        // --- Panel: Tabs ---
        "tab.output": "Output",
        "tab.input": "Input",
        "tab.all": "All",
        "tab.custom": "Custom",
        "tab.workflow": "Workflow",
        "tab.similar": "Similar",
        "manager.title": "Assets Manager",
        "manager.sidebarLabel": "Assets\nManager",
        "command.scanAssets": "Scan assets",
        "command.toggleFloatingViewer": "Toggle floating viewer",
        "command.refreshAssetsGrid": "Refresh assets grid",
        "bottomFeed.title": "Generated Feed",
        "label.floatingViewer": "Viewer",
        "bottomFeed.subtitle": "Lite output grid with recent and past generated assets",
        "bottomFeed.openManager": "Open Manager",
        "bottomFeed.refresh": "Refresh",
        "bottomFeed.loading": "Loading recent assets...",
        "bottomFeed.empty": "No generated assets yet.",
        "bottomFeed.loadFailed": "Failed to load generated assets.",
        "bottomFeed.groupTitle": "Generation group",
        "bottomFeed.groupOpen": "Show other assets from this generation",

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
        "btn.memoryPurge": "Memory purge",
        "btn.memoryPurging": "Purging...",
        "btn.retryServices": "Retry services",
        "btn.retrying": "Retrying...",
        "btn.loadWorkflow": "Load Workflow",
        "btn.play": "Play",
        "btn.copyPrompt": "Copy Prompt",
        "btn.close": "Close",
        "btn.dbSave": "Save DB",
        "btn.dbRestore": "Restore DB",
        "btn.back": "Back",
        "btn.up": "Up",
        "btn.saving": "Saving...",
        "btn.restoring": "Restoring...",
        "btn.markAllRead": "Mark all read",

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
        "label.toastHistory": "History",
        "label.workflowType": "WF Type",
        "label.sameWorkflow": "Generated with Same Workflow",
        "label.resolution": "Resolution",
        "label.fileSizeMB": "File size (MB)",
        "label.min": "Min",
        "label.max": "Max",
        "label.resolutionPx": "Resolution (px)",
        "label.compare": "Compare",
        "label.resolutionWxHpx": "Resolution WxH (px)",
        "label.resolutionMinWxH": "Min WxH (px)",
        "label.resolutionMaxWxH": "Max WxH (px)",
        "label.widthPx": "Width (px)",
        "label.heightPx": "Height (px)",
        "label.day": "Day",
        "label.collections": "Collections",
        "label.collection": "collection",
        "rating.title": "Rating: {n}",
        "rating.label": "Rating",
        "rating.setN": "Set rating to {n}",
        "tags.title": "Tags: {tags}",
        "tags.label": "Tags",
        "tags.addLabel": "Add tag",
        "tags.remove": "Remove tag",
        "tags.suggestions": "Tag suggestions",
        "label.messages": "Messages",
        "label.readMe": "Read Me",
        "label.userGuide": "User Guide",
        "label.info": "Info",
        "btn.giveStar": "Give a star",
        "label.filters": "Filters",
        "label.selectFolder": "Select folder?",
        "label.thisFolder": "this folder",
        "label.thisFile": "this file",
        "label.computer": "Computer",
        "search.placeholder": "Search assets...",
        "search.title": "Search by filename, tags, or attributes (e.g. rating:5, ext:png)",
        "search.semanticToggle": "Toggle AI semantic search (CLIP-based)",
        "search.aiSearch": "AI Search",
        "search.findSimilar": "Find Similar",
        "search.findingSimilar": "Finding similar assets...",
        "search.selectAssetForSimilar": "Select an asset first to find similar images/videos.",
        "search.findSimilarFailed": "Failed to find similar assets",
        "search.similarResults": "Similar to asset #{id} ({n} results)",
        "search.similarReference": "Reference #{id}",
        "search.similarDisabled": "AI features are disabled in settings",
        "action.copyToClipboard": "Copy to clipboard",
        "action.clickToCopy": "Click to copy",
        "tooltip.copyFieldValue": "Copy value",
        "tooltip.filterByFileType": "Filter by file type",
        "tooltip.filterWorkflowOnly": "Show only assets with embedded workflow data",
        "tooltip.filterWorkflowId": "Filter assets generated from the same embedded workflow id",
        "tooltip.filterMinRating": "Filter by minimum rating",
        "tooltip.filterByDateRange": "Filter by date range",
        "tooltip.widthPx": "Width in pixels",
        "tooltip.heightPx": "Height in pixels",
        "log.clipboardCopyFailed": "Failed to copy to clipboard",
        "tooltip.tab.all": "Browse all assets (inputs + outputs)",
        "tooltip.tab.input": "Browse input folder assets",
        "tooltip.tab.output": "Browse generated outputs",
        "tooltip.tab.custom": "Browse browser folders",
        "tooltip.tab.workflow": "Browse saved workflows",
        "tooltip.saveCurrentWorkflow": "Save current workflow",
        "tooltip.tab.similar": "Browse current similar findings",
        "tooltip.browserFolders": "Browser folders",
        "tooltip.pinnedFolders": "Pinned folders",
        "tooltip.clearFilter": "Clear {label}",
        "tooltip.duplicateSuggestions": "Duplicate/similarity suggestions",
        "tooltip.closeSidebar": "Close sidebar",
        "tooltip.closeSidebarEsc": "Close sidebar (Esc)",
        "tooltip.supportKofi": "Buy Me a White Monster Drink",
        "tooltip.starGithub": "Open GitHub and give a star",
        "tooltip.sidebarTab": "Assets Manager - Browse and search your outputs",
        "tooltip.openMFV": "Open Majoor Floating Viewer",
        "tooltip.closeMFV": "Close Majoor Floating Viewer",
        "tooltip.openMessages": "Messages and updates",
        "tooltip.openMessagesUnread": "Messages ({count} unread)",
        "tooltip.markMessagesRead": "Mark all messages as read",
        "tooltip.noUnreadMessages": "No unread messages",
        "tooltip.deleteDb": "Force-delete database and rebuild from scratch",
        "tooltip.memoryPurge":
            "Unload Majoor AI models, ask ComfyUI to unload loaded models, and clear torch cache when idle.",
        "tooltip.workflowMultiOutput": "Multiple outputs with different prompts",
        "tooltip.generationInputs": "Input files used in generation",
        "tooltip.videoFile": "Video file",
        "tooltip.minimapSettings": "Minimap settings",
        "tooltip.closeViewer": "Close viewer",
        "tooltip.popInViewer": "Return to floating panel",
        "tooltip.popOutViewer": "Pop out viewer to separate window",
        "tooltip.liveStreamOff": "Live Stream: OFF - click to follow final generation outputs",
        "tooltip.liveStreamOn":
            "Live Stream: ON - follows final generation outputs after execution",
        "tooltip.previewStreamOff":
            "KSampler Preview: OFF - click to stream sampler denoising frames",
        "tooltip.previewStreamOn":
            "KSampler Preview: ON - streams sampler denoising frames during execution",
        "tooltip.nodeStreamOff":
            "Node Stream: OFF - click to follow selected node previews, including ImageOps live canvases",
        "tooltip.nodeStreamOn":
            "Node Stream: ON - follows the selected node preview when frontend media exists",
        "tooltip.nodeParams": "Node Parameters",
        "tooltip.queuePrompt": "Queue Prompt (Run)",
        "tooltip.queueStop": "Stop Generation",
        "tooltip.captureView": "Save view as image",
        "tooltip.pendingRefresh": "Pending: metadata refresh in progress",
        "tooltip.noAssetsDay": "No assets on this day",
        "tooltip.assetsDaySingular": "{count} asset",
        "tooltip.assetsDayPlural": "{count} assets",
        "tooltip.deleteCollection": "Delete collection",
        "tooltip.viewerShortcuts": "Viewer keyboard shortcuts",
        "tooltip.singleViewMode": "Single view mode (one image)",
        "tooltip.compareOverlayMode": "A/B compare mode (overlay)",
        "tooltip.compareSideBySide": "Side-by-side comparison mode",
        "tooltip.colorChannels": "View color channels or luminance",
        "tooltip.scopesHistogram": "Show histogram/waveform scopes",
        "tooltip.gridOverlay": "Grid overlay (rule of thirds, center)",
        "tooltip.aspectRatioMask": "Aspect ratio overlay mask",
        "tooltip.compareBlendMode": "Compare blend mode",
        "tooltip.audioVisualizer": "Audio visualizer mode",
        "tooltip.exportFrame": "Save current frame as PNG",
        "tooltip.copyFrame": "Copy current frame to clipboard",
        "tooltip.resetExposure": "Reset exposure to 0",
        "tooltip.resetGamma": "Reset gamma to 1.00",
        "tooltip.resetInPoint": "Reset In point to start",
        "tooltip.resetOutPoint": "Reset Out point to end",
        "tooltip.maintenanceTools": "Database maintenance tools",
        "tooltip.resetPlayerControls": "Reset all viewer controls",

        // --- Panel: Filters ---
        "filter.all": "All",
        "filter.any": "Any",
        "filter.images": "Images",
        "filter.videos": "Videos",
        "filter.audio": "Audio",
        "filter.onlyWithWorkflow": "Only with workflow",
        "filter.anyRating": "Any rating",
        "filter.minStars": "{n}+ stars",
        "filter.resolutionAtLeast": "At least (>=)",
        "filter.resolutionAtMost": "At most (<=)",
        "filter.anytime": "Anytime",
        "filter.today": "Today",
        "filter.yesterday": "Yesterday",
        "filter.thisWeek": "This week",
        "filter.thisMonth": "This month",
        "filter.last7days": "Last 7 days",
        "filter.last30days": "Last 30 days",
        "placeholder.workflowId": "Workflow ID",
        "action.generate": "Generate",
        "action.clear": "Clear",
        "action.refresh": "Refresh",
        "weekday.monShort": "Mon",
        "weekday.tueShort": "Tue",
        "weekday.wedShort": "Wed",
        "weekday.thuShort": "Thu",
        "weekday.friShort": "Fri",
        "weekday.satShort": "Sat",
        "weekday.sunShort": "Sun",
        "group.core": "Core",
        "group.media": "Media",
        "group.time": "Time",

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
        "status.loading": "Loading",
        "status.disabled": "Disabled",
        "status.na": "N/A",
        "status.generating": "Generating...",
        "status.scanning": "Scanning...",
        "status.error": "Error",
        "status.capabilities": "Capabilities",
        "status.toolStatus": "Tool status",
        "status.selectCustomFolder": "Select a custom folder first",
        "status.errorGetConfig": "Error: Failed to get config",
        "status.discoveringTools": "Capabilities: discovering tools...",
        "status.indexStatus": "Index Status",
        "status.memoryPurgeStarted": "Memory purge started...",
        "status.toolStatusChecking": "Tool status: checking...",
        "status.resetIndexHint": "Reset index cache (requires allowResetIndex in settings).",
        "status.scanningHint": "This may take a while",
        "status.toolAvailable": "{tool} available",
        "status.toolUnavailable": "{tool} unavailable",
        "status.unknown": "unknown",
        "status.available": "available",
        "status.missing": "missing",
        "status.path": "Path",
        "state.on": "on",
        "state.off": "off",
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
        "status.apiNotFoundHint":
            "Backend routes are not loaded. Restart ComfyUI and check the terminal for Majoor import errors.",
        "status.errorChecking": "Error checking status",
        "status.dbCorrupted": "Database is corrupted",
        "status.dbCorruptedHint":
            'Use the "Delete DB" button below to force-delete and rebuild the index.',
        "status.retryFailed": "Retry failed",
        "status.customBrowserScanDisabled": "Scan is disabled in Browser scope",
        "status.customBrowserScanDisabledHint": "Use Outputs, Inputs, or All to run indexing scans",
        "status.dbBackupNone": "No DB backup available",
        "status.dbBackupSelectHint": "Select a DB backup to restore",
        "status.dbBackupLoading": "Loading DB backups...",
        "status.dbSaveHint": "Create a DB backup snapshot now.",
        "status.dbRestoreHint": "Restore selected DB backup and restart indexing.",
        "status.dbHealthLocked": "DB health: locked",
        "status.dbHealthOk": "DB health: ok",
        "status.dbHealthError": "DB health: error",
        "status.dbRestoreInProgress": "DB restore in progress",
        "status.enrichmentIdle": "idle",
        "status.enrichmentQueue": "Enrich queue: {count}",
        "status.maintenanceBusy": "Maintenance in progress",
        "status.scanInProgress": "Scan in progress",
        "status.scanInProgressHint": "Please wait for scan completion",
        "status.scanningScope": "Scanning scope: {scope}",
        "status.indexHealthOk": "Index health: ok",
        "status.indexHealthPartial": "Index health: partial",
        "status.indexHealthEmpty": "Index health: empty",
        "status.pending": "Pending",
        "status.toast.info": "Index status: checking",
        "status.toast.success": "Index status: ready",
        "status.toast.warning": "Index status: attention needed",
        "status.toast.error": "Index status: error",
        "status.toast.browser": "Index status: browser scope",
        "status.browserMetricsHidden": "Browser mode: global DB/index metrics hidden",
        "runtime.unavailable": "Runtime: unavailable",
        "runtime.metricsTitle":
            "Runtime Metrics\nDB active connections: {active}\nEnrichment queue: {enrichQ}\nWatcher pending files: {pending}",
        "runtime.metricsLine":
            "DB active: {active} | Enrich Q: {enrichQ} | Watcher pending: {pending}",
        "runtime.writeAuthActive": "Write auth: active {tokenHint}",
        "runtime.writeAuthMissing": "Write auth: missing in this browser {tokenHint}",
        "runtime.writeAuthRequired": "Write auth: required",
        "runtime.writeAuthNotRequired": "Write auth: not required",
        "runtime.writeAuthBlocked": "Write auth: writes blocked by server",
        "runtime.writeAuthUnknown": "Write auth: unknown",

        // --- Scopes ---
        "scope.all": "Inputs + Outputs",
        "scope.allFull": "All (Inputs + Outputs)",
        "scope.input": "Inputs",
        "scope.output": "Outputs",
        "scope.custom": "Custom",
        "scope.workflow": "Workflow",
        "scope.customBrowser": "Browser",
        "scope.similar": "Similar",

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
        "msg.noMessages": "No messages for now.",
        "msg.noPinnedFolders": "No pinned folders",
        "msg.noTagsYet": "No tags yet...",
        "msg.category.information": "Information",
        "msg.shortcuts.title": "Shortcut Guide",
        "msg.shortcuts.body":
            "All active shortcuts are grouped here by section so they stay visible inside Message Center.",
        "msg.shortcuts.intro": "Current keyboard shortcuts grouped by section for quick reference.",
        "msg.shortcuts.openGuide": "Open full guide",
        "msg.shortcuts.section.panel": "Global / Panel",
        "msg.shortcuts.section.grid": "Grid View",
        "msg.shortcuts.section.viewer": "Standard Viewer",
        "msg.shortcuts.section.mfv": "Floating Viewer",
        "msg.shortcuts.section.video": "Video Playback",
        "msg.category.release": "Release",
        "msg.whatsNew.title.dndGraphMapSettings": "New Version 2.4.8 - DnD, Graph Map & Settings",
        "msg.whatsNew.body.dndGraphMapSettings":
            "Version 2.4.8 released: Drag and Drop has been fixed and clarified, including canvas/node drops, staging behavior, visual feedback, and ComfyUI workflow-drop interactions. Graph Map in the Floating Viewer now lets you inspect embedded workflows without opening them on the canvas, copy nodes or attributes, and transfer node attributes to a similar selected node in the canvas. Settings access and explanations were also improved, with easier access from the panel gear icon and the Floating Viewer.",
        "msg.whatsNew.title.version246": "New Version 2.4.6",
        "msg.whatsNew.body.version246":
            "Version 2.4.6 released: Various bug fixes and performance & fluidity improvements. Improved concatenate support for default and custom nodes (by Forsion07). Added support helpers for Api Node and Ernie Image. Live Stream in Floating Viewer is now disabled by default. See CHANGELOG for details.",
        "msg.whatsNew.title.gridMfvToolboxUpgrade": "What's New - Grid & MFV Upgrade",
        "msg.whatsNew.body.gridMfvToolboxUpgrade":
            "Grid performance and fluidity have been improved. The Majoor Floating Viewer is no longer a light viewer only: it now includes advanced features such as Node Stream, Node Parameters, and direct node editing from inside the viewer. New tools were also added to the toolbox, alongside broader code corrections and cleanup.",
        "msg.tip.title.majoorImageOpsNodePack": "Do you know this node pack ?",
        "msg.tip.body.majoorImageOpsNodePack":
            "Discover Majoor ImageOps, a ComfyUI node pack with practical image operation nodes for your workflows.",
        "label.openNodePack": "Open Node Pack",
        "msg.tip.title.graphMapGuide": "Tip - Graph Map Guide",
        "msg.tip.body.graphMapGuide":
            "Graph Map now has its own documentation page with screenshots and a quick walkthrough. Open the guide to see how to read the workflow map, inspect selected nodes, and use the node detail actions.",
        "label.graphMapGuide": "Graph Map Guide",
        "msg.tip.title.mfvGuide": "Tip - MFV Guide",
        "msg.tip.body.mfvGuide":
            "MFV now has its own illustrated guide covering compare modes, A/B/C/D pins, streams, node parameters, run/stop, pop-out, and how Graph Map complements the viewer workflow.",
        "label.mfvGuide": "MFV Guide",
        "label.changelog": "Changelog",
        "label.settingsGuide": "Settings Guide",
        "msg.tip.title.mfvLivePreviewDefaults": "Tip - Floating Viewer Auto-Open",
        "msg.tip.body.mfvLivePreviewDefaults":
            "Live Stream (green button in the viewer) and KSampler Preview can be activated by default via Settings \u2192 Majoor Assets Manager \u203a Viewer. Live Stream follows final generation outputs after execution. KSampler Preview streams denoising frames during execution. Selected-node previews are handled by Node Stream.",
        "msg.whatsNew.title.version243": "New Version 2.4.3",
        "msg.whatsNew.body.version243":
            "Version 2.4.3 released: Improved assets metadata parsing, Grid Compare capability in floating viewer up to 4 Assets, ping pong loop in main Viewer player, job id and stack id in DB for better assets management, stack assets generated from same workflow job with same job ID, generated feed feature, lite version of grid in bottom tab. Code refactor for maintainability and various bug fixes. See CHANGELOG for details.",
        "msg.whatsNew.title.version241": "New Version 2.4.1",
        "msg.whatsNew.body.version241":
            "Version 2.4.1 released: CLIP-based semantic search with AI toggle, rgthree/easy node support, shortcut guide tab, upscaler model extraction. Fixed MFV memory leaks, workflow filters, SQL placeholders. Enhanced geninfo extraction, tag handling, calendar. See CHANGELOG for details.",
        "msg.whatsNew.title.floatingViewerShortcuts": "What's New",
        "msg.whatsNew.body.floatingViewerShortcuts":
            "Floating Viewer keyboard shortcuts added: Open/close MFV with V, compare with C, Live Stream with L, and KSampler Preview with K. See the Shortcut Guide tab for the full list.",
        "msg.whatsNew.title.pinReference": "What's New",
        "msg.whatsNew.body.pinReference":
            "Floating Viewer: new Pin Reference feature. You can now pin A or B, then compare quickly with selected assets in the grid while keeping the fixed reference.",
        "msg.whatsNew.title.vectorResetKeepVectors": "Important",
        "msg.whatsNew.body.vectorResetKeepVectors":
            "Reset index and Delete DB now first ask whether to keep AI vectors. If you already have older indexed assets, keeping the vectors is recommended: a full reset without them can trigger a long Vector Backfill for old assets and temporarily increase RAM usage.",
        "msg.whatsNew.title.localUserGuide": "Need help?",
        "msg.whatsNew.body.localUserGuide":
            "Open the local User Guide directly from your Assets Manager custom_nodes folder.",
        "msg.category.development": "Development",
        "msg.development.title.vueRefactoring": "Vue 3 Refactoring",
        "msg.development.body.vueRefactoring":
            "Frontend modernization ongoing: Core UI components are being migrated to Vue 3 for better maintainability and compatibility with new ComfyUI frontend. This ensures long-term support and cleaner architecture.",
        "label.viewProgress": "View Progress",
        "msg.collectionAdd.added": 'Added {added} item(s) to "{name}".',
        "msg.collectionAdd.skippedExisting":
            "Skipped {count} item(s): already present in the collection.",
        "msg.collectionAdd.skippedDuplicate": "Ignored {count} duplicate(s) in selection.",
        "msg.collectionAdd.noneAddedExisting": 'No new items added to "{name}" (all exist).',
        "msg.nightlyUpdateTitle": "Nightly update available",
        "msg.nightlyUpdateDetail":
            "A newer nightly build is available. Download it here: https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/releases/tag/nightly",
        "msg.newVersionTitle": "Majoor Assets Manager update available",
        "msg.newVersionDetail": "Version {latest} is available. You are currently using {current}.",
        "msg.dbResetNotice": "Database reset required",

        // --- Viewer ---
        "viewer.genInfo": "Generation Info",
        "viewer.workflow": "Workflow",
        "viewer.metadata": "Metadata",
        "viewer.noWorkflow": "No workflow data",
        "viewer.noMetadata": "No metadata available",
        "viewer.copySuccess": "Copied to clipboard!",
        "viewer.copySuccessShort": "Copied!",
        "viewer.copyFailed": "Failed to copy",
        "viewer.mode": "Viewer mode",
        "viewer.mode.simple": "Simple",
        "viewer.mode.abCompare": "A/B Compare",
        "viewer.mode.sideBySide": "Side-by-side",
        "viewer.mode.grid": "Grid",
        "viewer.pinSlots": "Pin slots A/B/C/D",
        "viewer.loadingGenerationData": "Loading generation data...",
        "viewer.errorLoadingMetadata": "Error Loading Metadata",
        "viewer.noGenerationDataFile": "No generation data found for this file.",
        "viewer.metadataErrorWithCode": "{message}\n\nCode: {code}\nClick to retry.",
        "viewer.metadataErrorRetry": "{message}\n\nClick to retry.",
        "video.controls": "Video controls",
        "video.previewControls": "Video preview controls",
        "video.playPause": "Play/Pause",
        "video.playPauseSpace": "Play/Pause (Space)",
        "video.play": "Play",
        "video.pause": "Pause",
        "video.seek": "Seek",
        "video.seekThrough": "Seek through video",
        "video.dragSetIn": "Drag to set In",
        "video.dragSetOut": "Drag to set Out",
        "video.currentTimeTotal": "Current time / Total duration",
        "video.currentFrame": "Current frame number",
        "video.stepBack": "Step back",
        "video.stepForward": "Step forward",
        "video.goToIn": "Go to In",
        "video.goToOut": "Go to Out",
        "video.setInFromCurrent": "Set In from current frame",
        "video.setOutFromCurrent": "Set Out from current frame",
        "video.loopPlaybackInRange": "Loop playback in range",
        "video.pingpongPlayback": "Ping-pong playback (forward then reverse)",
        "video.loop": "Loop",
        "video.inFrame": "In frame",
        "video.outFrame": "Out frame",
        "video.frameIncrement": "Frame increment",
        "video.fpsStepping": "FPS (used for frame stepping)",
        "video.fps": "FPS",
        "video.playbackSpeed": "Playback speed",
        "video.mute": "Mute",
        "video.unmute": "Unmute",
        "video.volume": "Volume",
        "video.resetInToStart": "Reset In to start",
        "video.resetOutToEnd": "Reset Out to end",
        "video.step": "Step",
        "video.speed": "Speed",
        "video.resetPlayerControls": "Reset player controls",

        // --- Sidebar ---
        "sidebar.placeholderSelectAsset": "Select an asset to see details",
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
        "sidebar.fileInfo.title": "File Info",
        "sidebar.fileInfo.dimensionsTooltip": "Image/video resolution in pixels",
        "sidebar.fileInfo.duration": "Duration",
        "sidebar.fileInfo.durationTooltip": "Video duration",
        "sidebar.fileInfo.fpsTooltip": "Native frame rate",
        "sidebar.fileInfo.length": "Length",
        "sidebar.fileInfo.frames": "{count} frames",
        "sidebar.fileInfo.lengthTooltip": "Total frame count",
        "sidebar.fileInfo.generationTime": "Generation Time",
        "sidebar.fileInfo.generationTimeTooltip":
            "Time taken to generate this asset (workflow execution time)",
        "sidebar.fileInfo.time": "Time",
        "sidebar.fileInfo.dateTooltip": "File creation/generation date",
        "sidebar.fileInfo.timeTooltip": "File creation/generation time",
        "sidebar.fileInfo.fileSize": "File Size",
        "sidebar.fileInfo.fileSizeTooltip": "File size on disk",
        "sidebar.fileInfo.assetId": "Asset ID",
        "sidebar.fileInfo.assetIdTooltip": "Internal database asset identifier",
        "sidebar.fileInfo.jobId": "Job ID",
        "sidebar.fileInfo.jobIdTooltip": "Workflow execution job identifier (prompt_id)",
        "sidebar.fileInfo.sourceNode": "Source Node",
        "sidebar.fileInfo.sourceNodeTooltip": "ComfyUI node id that produced this file",
        "sidebar.fileInfo.nodeType": "Node Type",
        "sidebar.fileInfo.nodeTypeTooltip": "ComfyUI node class that produced this file",
        "sidebar.fileInfo.workflowId": "Workflow ID",
        "sidebar.fileInfo.workflowIdTooltip":
            "ComfyUI workflow identifier (from workflow.id in extra_data)",
        "sidebar.folder.details": "Folder Details",
        "sidebar.folder.name": "Name",
        "sidebar.folder.path": "Path",
        "sidebar.folder.folders": "Folders",
        "sidebar.folder.files": "Files",
        "sidebar.folder.created": "Created",
        "sidebar.folder.modified": "Modified",
        "sidebar.folder.note": "Note",
        "sidebar.folder.scanTruncated": "Scan was truncated for performance",
        "sidebar.generation.title": "Generation",
        "sidebar.generation.workflowEngine": "Workflow engine: {value}",
        "sidebar.generation.apiProvider": "API provider: {value}",
        "sidebar.generation.override": "Override",
        "sidebar.generation.overrideTooltip": "This field was forced by Majoor Gen Info Override",
        "sidebar.generation.metadataTruncated": "Metadata Truncated",
        "sidebar.generation.metadataTruncatedBody":
            "Generation data is incomplete because it exceeded the size limit.",
        "sidebar.generation.generationData": "Generation Data",
        "sidebar.generation.mediaOnlyPipeline":
            "This file looks like a media-only pipeline (e.g. LoadVideo/VideoCombine) and does not contain generation parameters.",
        "sidebar.generation.promptPipeline": "Prompt Pipeline ({count} variants)",
        "sidebar.generation.promptN": "Prompt {n}",
        "sidebar.generation.positive": "POSITIVE",
        "sidebar.generation.negative": "NEGATIVE",
        "sidebar.generation.positivePrompt": "Positive Prompt",
        "sidebar.generation.negativePrompt": "Negative Prompt",
        "sidebar.generation.promptAlignment": "Prompt Alignment",
        "sidebar.generation.promptAlignmentTooltip":
            "How closely the generated image matches the prompt (SigLIP2 score)",
        "sidebar.generation.aiCaptionTooltip": "AI caption generated by Florence-2",
        "sidebar.generation.copyCaptionTooltip": "Click to copy caption",
        "sidebar.generation.aiCaptionDisabled": "AI caption controls are disabled",
        "sidebar.generation.aiDisabledEnv":
            "AI features are disabled (enable vector search env var).",
        "sidebar.generation.aiDisabledSettings": "AI features are disabled in settings.",
        "sidebar.generation.imageDescription": "Image Description",
        "sidebar.generation.noImageDescription": "No image description yet.",
        "sidebar.generation.lyrics": "Lyrics",
        "sidebar.generation.pipeline": "Generation Pipeline",
        "sidebar.generation.stageBase": "Base",
        "sidebar.generation.stageTextToImage": "Text-to-Image",
        "sidebar.generation.stageImageToImage": "Image-to-Image",
        "sidebar.generation.stageInpaint": "Inpaint",
        "sidebar.generation.stageUpscale": "Upscale",
        "sidebar.generation.stageRefine": "Refine",
        "sidebar.generation.stageRefineUpscale": "Refine / Upscale",
        "sidebar.generation.stagePassN": "Pass {n}",
        "sidebar.generation.modelBranches": "Model Branches",
        "sidebar.generation.highNoise": "High Noise",
        "sidebar.generation.lowNoise": "Low Noise",
        "sidebar.generation.loraStack": "LoRA Stack",
        "sidebar.generation.modelLora": "Model & LoRA",
        "sidebar.generation.model": "Model",
        "sidebar.generation.models": "Models",
        "sidebar.generation.sampling": "Sampling",
        "sidebar.generation.audio": "Audio",
        "sidebar.generation.image": "Image",
        "sidebar.generation.notes": "Notes",
        "sidebar.generation.ttsInstruction": "TTS Instruction",
        "sidebar.generation.seed": "Seed",
        "sidebar.generation.copySeedTooltip": "Click to copy seed: {seed}",
        "sidebar.generation.sourceFiles": "Source Files",
        "sidebar.generation.customInfoN": "Custom Info {n}",
        "sidebar.generation.checkpoint": "Checkpoint",
        "sidebar.generation.checkpointN": "Checkpoint {n}",
        "sidebar.generation.upscaler": "Upscaler",
        "sidebar.generation.loras": "LoRAs",
        "sidebar.generation.sampler": "Sampler",
        "sidebar.generation.steps": "Steps",
        "sidebar.generation.cfgScale": "CFG Scale",
        "sidebar.generation.cfgHighNoise": "CFG High Noise",
        "sidebar.generation.cfgLowNoise": "CFG Low Noise",
        "sidebar.generation.scheduler": "Scheduler",
        "sidebar.generation.denoise": "Denoise",
        "sidebar.generation.narratorVoice": "Narrator Voice",
        "sidebar.generation.language": "Language",
        "sidebar.generation.repetitionPenalty": "Repetition Penalty",
        "sidebar.generation.maxNewTokens": "Max New Tokens",
        "sidebar.generation.device": "Device",
        "sidebar.generation.voicePreset": "Voice Preset",
        "sidebar.generation.compileMode": "Compile Mode",
        "sidebar.generation.torchCompile": "Torch Compile",
        "sidebar.generation.cudaGraphs": "CUDA Graphs",
        "sidebar.generation.xVectorOnly": "X-Vector Only",
        "sidebar.generation.chunking": "Chunking",
        "sidebar.generation.maxCharsChunk": "Max Chars/Chunk",
        "sidebar.generation.chunkMethod": "Chunk Method",
        "sidebar.generation.silenceBetweenChunks": "Silence Between Chunks (ms)",
        "sidebar.generation.audioCache": "Audio Cache",
        "sidebar.generation.batchSize": "Batch Size",
        "sidebar.generation.lyricsStrength": "Lyrics Strength",
        "sidebar.generation.clipSkip": "Clip Skip",
        "sidebar.generation.workflowNotes": "Workflow Notes",
        "sidebar.generation.temperature": "Temperature",
        "sidebar.generation.dtype": "Dtype",
        "sidebar.generation.attention": "Attention",
        "workflowSidebar.nodes": "Nodes",
        "workflowSidebar.links": "Links",
        "workflowSidebar.groups": "Groups",
        "workflowSidebar.close": "Close sidebar",
        "workflowSidebar.graphMap": "Graph Map",
        "workflowSidebar.comfyWorkflow": "ComfyUI Workflow",
        "workflowSidebar.workflowNodes": "Workflow Nodes",
        "workflowSidebar.moreNodes": "+{count} more nodes",
        "workflowSidebar.sourceSynthetic": "Synthetic",
        "workflowSidebar.sourceEmbedded": "Embedded",
        "workflowSidebar.sizeCompact": "Compact",
        "workflowSidebar.sizeComfort": "Comfort",
        "workflowSidebar.sizeExpanded": "Expanded",
        "workflowSidebar.minimapSizeTitle": "{label} minimap",
        "workflowSidebar.nodeLabels": "Node Labels",
        "workflowSidebar.nodeColors": "Node Colors",
        "workflowSidebar.showLinks": "Show Links",
        "workflowSidebar.showFramesGroups": "Show Frames/Groups",
        "workflowSidebar.renderBypassState": "Render Bypass State",
        "workflowSidebar.renderErrorState": "Render Error State",
        "workflowSidebar.showViewport": "Show Viewport",
        "workflowSidebar.minimapHint": "Click/drag to navigate - wheel to zoom",
        "workflowSidebar.showRawJson": "Show raw JSON",
        "genInfoOverride.autoFillFromWorkflow": "Auto fill from workflow",
        "genInfoOverride.pick": "Pick",
        "genInfoOverride.pickField": "Pick {field}",
        "genInfoOverride.pickFromWorkflow": "Pick Gen Info from workflow",
        "model3d.controlHint": "Rotate: left drag  Pan: right drag  Zoom: wheel",
        "model3d.viewportAction": "3D viewport action",
        "model3d.preview": "3D preview",
        "model3d.unavailable": "3D viewer unavailable",
        "model3d.background": "Background",
        "model3d.material": "Material",
        "model3d.skeleton": "Skeleton",
        "model3d.lights": "Lights",
        "model3d.intensity": "Intensity",
        "model3d.play": "Play",
        "model3d.pause": "Pause",
        "model3d.playPause": "Play / Pause",
        "model3d.playbackSpeed": "Playback speed",
        "model3d.reset": "Reset",
        "model3d.resetView": "Reset 3D view",
        "model3d.grid": "Grid",
        "model3d.toggleGrid": "Toggle grid",
        "model3d.persp": "Persp",
        "model3d.ortho": "Ortho",
        "model3d.switchCamera": "Switch perspective / orthographic",
        "model3d.settings": "Settings",
        "model3d.downloadFile": "Download {file}",
        "badge.collisionName": "Name: {name}",
        "badge.collisionPaths": "Paths:",
        "badge.collisionSelect": "Click to select collisions in current view",
        "badge.workflow.pendingParsing": "Pending: parsing metadata...",
        "badge.workflow.complete": "Complete: workflow + generation data detected",
        "badge.workflow.partialWorkflowOnly": "Partial: workflow only (generation data missing)",
        "badge.workflow.partialGenerationOnly": "Partial: generation data only (workflow missing)",
        "badge.workflow.none": "None: no workflow or generation data found",
        "badge.workflow.pendingNotParsed": "Pending: metadata not parsed yet",
        "badge.workflow.enrichmentQueued":
            "Pending: database metadata enrichment in progress ({count} queued)",
        "badge.workflow.enrichment": "Pending: database metadata enrichment in progress",
        "badge.workflow.aiTooltip": "{title}\nAI: {ai}\nClick to rescan this file",
        "badge.workflow.tooltip": "{title}\nClick to rescan this file",
        "badge.ai.vectorIndexed": "vector indexed",
        "badge.ai.tagSuggestions": "AI tag suggestions",
        "badge.ai.enhancedPrompt": "enhanced prompt",
        "badge.ai.indexed": "indexed",
        "badge.rating": "Rating: {rating} star{plural}",
        "badge.generationTimeMinutes": "Generation time: {minutes} minutes ({seconds}s)",
        "badge.generationTimeSeconds": "Generation time: {seconds} seconds",
        "badge.tags": "Tags: {tags}",

        // --- Context Menu ---
        "ctx.openViewer": "Open in viewer",
        "ctx.loadWorkflow": "Load workflow",
        "ctx.duplicateWorkflow": "Duplicate workflow",
        "ctx.renameWorkflow": "Rename workflow",
        "ctx.categorizeWorkflow": "Set workflow category",
        "ctx.deleteWorkflow": "Delete workflow",
        "dialog.workflowSaveName": "Workflow name",
        "dialog.workflowCategory": "Workflow category",
        "dialog.deleteWorkflowConfirm": "Delete this workflow JSON and its adjacent thumbnail files?",
        "toast.workflowSaved": "Workflow saved",
        "toast.workflowSaveFailed": "Failed to save workflow.",
        "toast.workflowSerializeFailed": "Could not read the current ComfyUI workflow.",
        "toast.workflowMissingPath": "Workflow file path is missing.",
        "toast.workflowLoadFailed": "Failed to load workflow.",
        "toast.workflowImportUnavailable": "ComfyUI workflow import is unavailable in this frontend.",
        "toast.workflowLoaded": "Workflow loaded",
        "toast.workflowUpdated": "Workflow updated",
        "toast.workflowDeleted": "Workflow deleted",
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
        "ctx.resetIndexFile": "Reset index (this file)",
        "ctx.openInNewTab": "Open in New Tab",
        "ctx.downloadOriginal": "Download Original",
        "ctx.download": "Download",
        "ctx.editTags": "Edit tags",
        "ctx.setRating": "Set rating",
        "ctx.resetRating": "Reset rating",
        "ctx.showMetadataPanel": "Show metadata panel",
        "ctx.unpinFolder": "Unpin folder",
        "ctx.openFolder": "Open folder",
        "ctx.pinAsBrowserRoot": "Pin as Browser Root",

        // --- Dialogs ---
        "dialog.confirm": "Confirm",
        "dialog.cancel": "Cancel",
        "dialog.yes": "Yes",
        "dialog.no": "No",
        "dialog.ok": "OK",
        "dialog.close": "Close",
        "dialog.prompt": "Prompt",
        "dialog.choiceTypeNumber": "Type a number:",
        "dialog.delete.title": "Delete file?",
        "dialog.delete.msg": "Are you sure you want to delete this file? This cannot be undone.",
        "dialog.rename.title": "Rename file",
        "dialog.rename.placeholder": "New filename",
        "dialog.newCollection.title": "New collection",
        "dialog.newCollection.placeholder": "Collection name",
        "dialog.resetIndex.title": "Reset index?",
        "dialog.resetIndex.msg": "This will delete the database and rescan all files. Continue?",
        "dialog.securityWarning":
            "This looks like a system or very broad directory.\n\nAdding it can expose sensitive files via the viewer/custom roots feature.\n\nContinue?",
        "dialog.securityWarningTitle": "Majoor: Security Warning",
        "dialog.enterFolderPath": "Enter a folder path to add as a Custom root:",
        "dialog.customFoldersTitle": "Majoor: Custom Folders",
        "dialog.removeFolder": 'Remove the custom folder "{name}"?',
        "dialog.deleteCollection": 'Delete collection "{name}"?',
        "dialog.createCollection": "Create collection",
        "dialog.collectionPlaceholder": "My collection",
        "dialog.browserRootLabelOptional": "Label for new browser root (optional)",
        "dialog.newFolderName": "New folder name",
        "dialog.renameFolder": "Rename folder",
        "dialog.destinationDirectoryPath": "Destination directory path",
        "dialog.deleteFolderRecursive": 'Delete folder "{name}" and all contents?',
        "dialog.folderLabelOptional": "Folder label (optional)",
        "dialog.unpinFolder": 'Unpin folder "{name}"?',
        "dialog.dbRestore.confirm": "Restore selected DB backup? This will replace current DB.",
        "dialog.mergeDuplicateTags": "Merge duplicate tags?",
        "dialog.deleteExactDuplicates": "Delete exact duplicates?",
        "dialog.startDuplicateAnalysis": "Start duplicate analysis?",
        "dialog.dbDelete.confirm":
            "This will permanently delete the index database and rebuild it from scratch. All ratings, tags, and cached metadata will be lost.\n\nContinue?",
        "dialog.settingsSaveFailed":
            "Majoor: Failed to save settings (browser storage full or blocked).",
        "dialog.confirmDeleteTitle": "Majoor: Confirm delete",
        "dialog.deleteSelectedFiles": "Delete {count} selected files?",
        "dialog.deleteSingleFile": 'Delete "{label}"?',
        "dialog.vectorsReset.title": "AI vectors",
        "dialog.vectorsReset.choice":
            "Also reset AI vectors?\n\nConfirm = yes, reset everything (vectors will be recalculated)\nCancel = no, keep existing vectors",
        "dialog.vectorsReset.keepQuestion":
            "Keep existing AI vectors?\n\nConfirm = keep vectors\nCancel = continue without vectors",
        "dialog.vectorsReset.wipeConfirm":
            "Reset AI vectors too?\n\nConfirm = yes, reset everything\nCancel = abort",
        "dialog.vectorsReset.singleQuestion":
            "Choose reset mode for {action}:\n\nYes = keep existing AI vectors\nNo = full reset (vectors will be recalculated)\nCancel = abort",
        "dialog.vectorsReset.optionKeep": "Yes - keep vectors",
        "dialog.vectorsReset.optionFull": "No - full reset",
        "dialog.vectorsReset.optionCancel": "Cancel",
        "dialog.resetIndex.confirmKeepVectors":
            "This will reset index data and rescan files while keeping existing AI vectors.\n\nContinue?",
        "dialog.dbDelete.keepVectorsConfirm":
            "This will reset index data and keep existing AI vectors. Database files will not be force-deleted.\n\nContinue?",

        // --- Toasts ---
        "toast.scanStarted": "Scan started",
        "toast.scanComplete": "Scan complete",
        "toast.scanFailed": "Scan failed",
        "toast.resetTriggered": "Reset triggered: Reindexing all files...",
        "toast.resetStarted": "Index reset started. Files will be reindexed in the background.",
        "toast.resetFailed": "Failed to reset index",
        "toast.resetFailedCorrupt":
            'Reset failed - database is corrupted. Use the "Delete DB" button to force-delete and rebuild.',
        "toast.dbDeleteTriggered": "Deleting database and rebuilding...",
        "toast.dbDeleteSuccess": "Database deleted and rebuilt. Files are being reindexed.",
        "toast.dbDeleteFailed": "Failed to delete database",
        "toast.memoryPurgeComplete":
            "Memory purge complete. Majoor AI and ComfyUI model caches were released.",
        "toast.memoryPurgeCompleteMajoorOnly":
            "Memory purge complete. Majoor AI caches were released.",
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
        "toast.failedCreateSmartCollection": "Failed to create smart collection",
        "toast.failedAddAssetsToSmartCollection": "Failed to add assets to smart collection",
        "toast.noGroupsFoundIndexFirst": "No groups found. Index more assets first.",
        "toast.failedLoadClusterAssets": "Failed to load cluster assets",
        "toast.collectionCreatedWithAssets": 'Collection "{name}" created with {count} assets!',
        "toast.collectionCreatedNamed": 'Collection "{name}" created.',
        "toast.clusterAnalysisFailed": "Cluster analysis failed",
        "toast.removeFromCollectionFailed": "Failed to remove from collection.",
        "toast.removeFromCollectionError": "Error removing from collection: {error}",
        "toast.copyClipboardFailed": "Failed to copy to clipboard",
        "toast.metadataRefreshFailed": "Failed to refresh metadata.",
        "toast.ratingCleared": "Rating cleared",
        "toast.ratingSetN": "Rating set to {n} stars",
        "toast.tagsUpdated": "Tags updated",
        "toast.remoteLanPresetApplied":
            "Recommended remote LAN setup applied. This browser session is now authorized for Majoor write operations.",
        "toast.remoteLanPresetFailed": "Failed to apply the recommended remote LAN setup.",
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
        "toast.dbRestoreStopping": "Stopping running workers",
        "toast.dbRestoreResetting": "Unlocking and resetting database",
        "toast.dbRestoreReplacing": "Replacing database files",
        "toast.dbRestoreRescan": "Restarting scan",
        "toast.dbRestoreSuccess": "Database backup restored",
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
        "toast.writeAuthBootstrapHelp":
            "Write access is blocked. Sign in to ComfyUI and retry so Majoor can bootstrap the remote session automatically, or set a Majoor API token in Settings -> Security.",
        "toast.writeAuthSignInRequired":
            "Write access is blocked. Sign in to ComfyUI first, then retry so Majoor can bootstrap the remote session token automatically.",
        "toast.writeAuthConfiguredTokenRequired":
            "Write access requires the Majoor API token already configured on the server. Open Settings -> Security -> API Token and enter the matching token.",
        "toast.writeAuthTitle": "Majoor remote write access",
        "toast.vectorBackfillStarting": "Starting vector backfill... This may take a while.",
        "toast.vectorBackfillRunning": "Vector backfill still running in background{job}.",
        "toast.vectorBackfillComplete":
            "Vector backfill complete! Processed: {processed}, Indexed: {indexed}, Skipped: {skipped}",
        "toast.vectorBackfillFailedGeneric": "Backfill failed",
        "toast.vectorBackfillFailedDetail": "Vector backfill failed: {error}",
        "toast.aiSearchPartiallyIndexed":
            "AI search index is only partially built ({indexed}/{eligible}, {percent}%). Run Vector Backfill for existing assets.",
        "toast.rescanUpdatingAiIndex": "Rescanning file + updating AI index...",
        "toast.metadataVectorUpdated": "Metadata + AI vector index updated for this asset.",
        "toast.metadataUpdatedVectorFailed":
            "Metadata updated. AI vector index could not be updated.",
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
        "toast.failedToggleWatcher": "Failed to toggle watcher",
        "toast.failedUpdateMetadataFallback": "Failed to update metadata fallback settings",
        "toast.failedSetIndexDirectory": "Failed to set index directory",
        "toast.indexDirectorySavedRestart": "Index directory saved. Restart ComfyUI to apply.",
        "toast.failedSetOutputDirectory": "Failed to set output directory",
        "toast.nativeBrowserUnavailable":
            "Native folder browser unavailable. Please enter path manually.",

        // --- Summary ---
        "summary.assets": "assets",
        "summary.folders": "folders",
        "summary.selected": "selected",
        "summary.hidden": "hidden",
        "summary.duplicates": "duplicates",
        "summary.similar": "similar",

        // --- Commands / Tooltips ---
        "command.openFloatingViewer": "Open floating viewer",
        "command.openGeneratedFeed": "Open generated feed",
        "command.openSettings": "Open Majoor settings",
        "command.openNodeContext": "Show assets from selected node",
        "tooltip.openAssetsManager": "Open Majoor Assets Manager",
        "tooltip.openFloatingViewer": "Open Majoor floating viewer",
        "tooltip.openGeneratedFeed": "Open the Majoor generated feed panel",
        "tooltip.openNodeContext": "Show the latest indexed assets produced by this node",
        "tooltip.openMajoorSettings": "Open Majoor Assets Manager settings",

        // --- Filters / Status ---
        "label.refineResults": "Refine your results",
        "label.workflowModelFamily": "Model family",
        "placeholder.workflowModelFamily": "Flux, Wan, SDXL...",
        "label.workflowRunsOn": "Runs on",
        "action.clearAll": "Clear all",
        "status.cached": "Last known status",
        "status.toast.workflow": "Index status: workflow scope",

        // --- Hotkeys ---
        "hotkey.scan": "Scan (S)",
        "hotkey.search": "Search (Ctrl+F)",
        "hotkey.details": "Toggle details (D)",
        "hotkey.delete": "Delete (Del)",
        "hotkey.viewer": "Open viewer (Enter)",
        "hotkey.escape": "Close (Esc)",
    },

    "fr-FR": {
        // --- French translations (partial - ~50 keys) ---
        "tab.output": "Sortie",
        "tab.input": "Entree",
        "tab.all": "Tout",
        "tab.custom": "Navigateur",
        "tab.workflow": "Workflow",
        "tab.similar": "Similaire",
        "manager.title": "Gestionnaire d'assets",
        "manager.sidebarLabel": "Assets\nManager",
        "cat.feed": "Flux genere",
        "command.scanAssets": "Scanner les assets",
        "command.toggleFloatingViewer": "Basculer le floating viewer",
        "command.refreshAssetsGrid": "Rafraichir la grille d'assets",
        "bottomFeed.title": "Flux Genere",
        "label.floatingViewer": "Viewer",
        "bottomFeed.subtitle": "Version legere de la grille output avec assets recents et anciens",
        "bottomFeed.openManager": "Ouvrir le manager",
        "bottomFeed.refresh": "Rafraichir",
        "bottomFeed.loading": "Chargement des assets recents...",
        "bottomFeed.empty": "Aucun asset genere pour le moment.",
        "bottomFeed.loadFailed": "Impossible de charger les assets generes.",
        "bottomFeed.groupTitle": "Groupe de generation",
        "bottomFeed.groupOpen": "Afficher les autres assets de cette generation",

        "scope.all": "Entrees + Sorties",
        "scope.allFull": "Tout (Entrees + Sorties)",
        "scope.input": "Entrees",
        "scope.output": "Sorties",
        "scope.custom": "Navigateur",
        "scope.workflow": "Workflow",
        "scope.customBrowser": "Navigateur",
        "scope.similar": "Similaire",

        "search.placeholder": "Rechercher des assets...",
        "search.title": "Rechercher par nom de fichier, tags ou attributs (ex. rating:5, ext:png)",
        "search.semanticToggle": "Activer/desactiver la recherche semantique IA (CLIP)",
        "search.aiSearch": "Recherche IA",
        "search.findSimilar": "Trouver similaires",
        "search.findingSimilar": "Recherche d'assets similaires...",
        "search.selectAssetForSimilar":
            "Selectionnez d'abord un asset pour trouver des images/videos similaires.",
        "search.findSimilarFailed": "Echec de la recherche similaire",
        "search.similarResults": "Similaires a l'asset #{id} ({n} resultats)",
        "search.similarReference": "Reference #{id}",
        "search.similarDisabled": "Les fonctionnalites IA sont desactivees dans les parametres",
        "tooltip.openMessages": "Messages et nouveautes",
        "tooltip.openMessagesUnread": "Messages ({count} non lus)",
        "tooltip.markMessagesRead": "Marquer tous les messages comme lus",
        "tooltip.noAssetsDay": "Aucun asset ce jour",
        "tooltip.assetsDaySingular": "{count} asset",
        "tooltip.assetsDayPlural": "{count} assets",
        "tooltip.openAssetsManager": "Ouvrir Majoor Assets Manager",
        "tooltip.openFloatingViewer": "Ouvrir le floating viewer Majoor",
        "tooltip.openGeneratedFeed": "Ouvrir le panneau du flux genere Majoor",
        "tooltip.openNodeContext": "Afficher les derniers assets indexes produits par ce noeud",
        "tooltip.openMajoorSettings": "Ouvrir les parametres de Majoor Assets Manager",
        "tooltip.previewStreamOff":
            "Preview KSampler : OFF - cliquer pour afficher les images de denoising pendant l'execution",
        "tooltip.previewStreamOn":
            "Preview KSampler : ON - affiche les images de denoising pendant l'execution",
        "tooltip.nodeStreamOff":
            "Node Stream : OFF - cliquer pour suivre les previews du noeud selectionne, dont les canvas live ImageOps",
        "tooltip.nodeStreamOn":
            "Node Stream : ON - suit la preview du noeud selectionne quand un media frontend existe",
        "tooltip.nodeParams": "Parametres du noeud",
        "tooltip.queuePrompt": "Lancer le prompt",
        "tooltip.queueStop": "Arreter la generation",
        "tooltip.noUnreadMessages": "Aucun message non lu",
        "label.toastHistory": "Historique",
        "label.sameWorkflow": "Generes avec le meme workflow",
        "tooltip.tab.similar": "Parcourir les trouvailles similaires courantes",
        "tooltip.tab.workflow": "Parcourir les workflows enregistres",
        "tooltip.saveCurrentWorkflow": "Enregistrer le workflow courant",
        "tooltip.filterWorkflowId": "Filtrer les assets generes depuis le meme workflow embarque",
        "placeholder.workflowId": "Workflow ID",
        "ctx.loadWorkflow": "Charger le workflow",
        "ctx.duplicateWorkflow": "Dupliquer le workflow",
        "ctx.renameWorkflow": "Renommer le workflow",
        "ctx.categorizeWorkflow": "Definir la categorie du workflow",
        "ctx.deleteWorkflow": "Supprimer le workflow",
        "dialog.workflowSaveName": "Nom du workflow",
        "dialog.workflowCategory": "Categorie du workflow",
        "dialog.deleteWorkflowConfirm": "Supprimer ce JSON workflow et ses thumbnails adjacents ?",
        "toast.workflowSaved": "Workflow enregistre",
        "toast.workflowSaveFailed": "Echec de l'enregistrement du workflow.",
        "toast.workflowSerializeFailed": "Impossible de lire le workflow ComfyUI courant.",
        "toast.workflowMissingPath": "Chemin du fichier workflow manquant.",
        "toast.workflowLoadFailed": "Echec du chargement du workflow.",
        "toast.workflowImportUnavailable": "Import workflow ComfyUI indisponible dans ce frontend.",
        "toast.workflowLoaded": "Workflow charge",
        "toast.workflowUpdated": "Workflow mis a jour",
        "toast.workflowDeleted": "Workflow supprime",
        "action.copy": "Copier",
        "action.generate": "Generer",
        "action.clickToCopy": "Cliquer pour copier",
        "action.clear": "Effacer",
        "action.clearAll": "Tout effacer",
        "action.refresh": "Rafraichir",
        "command.openFloatingViewer": "Ouvrir le floating viewer",
        "command.openGeneratedFeed": "Ouvrir le flux genere",
        "command.openSettings": "Ouvrir les parametres Majoor",
        "command.openNodeContext": "Afficher les assets du noeud selectionne",
        "label.refineResults": "Affiner les resultats",
        "label.workflowModelFamily": "Famille de modele",
        "label.workflowRunsOn": "Execute sur",
        "placeholder.workflowModelFamily": "Flux, Wan, SDXL...",
        "status.loading": "Chargement",
        "status.disabled": "Desactive",
        "status.na": "N/A",
        "status.generating": "Generation...",
        "status.unavailable": "Indisponible",
        "status.cached": "Dernier statut connu",
        "status.toast.workflow": "Statut index : scope workflow",
        "status.memoryPurgeStarted": "Purge memoire demarree...",
        "state.on": "on",
        "state.off": "off",
        "btn.memoryPurge": "Purge memoire",
        "btn.memoryPurging": "Purge...",
        "tooltip.memoryPurge":
            "Decharge les modeles IA Majoor, demande a ComfyUI de decharger les modeles charges, puis vide le cache torch si ComfyUI est idle.",
        "toast.memoryPurgeComplete":
            "Purge memoire terminee. Les caches des modeles IA Majoor et ComfyUI ont ete liberes.",
        "toast.memoryPurgeCompleteMajoorOnly":
            "Purge memoire terminee. Les caches IA Majoor ont ete liberes.",
        "viewer.copySuccessShort": "Copie !",
        "viewer.loadingGenerationData": "Chargement des donnees de generation...",
        "viewer.errorLoadingMetadata": "Erreur de chargement des metadonnees",
        "viewer.noGenerationDataFile": "Aucune donnee de generation trouvee pour ce fichier.",
        "viewer.metadataErrorWithCode": "{message}\n\nCode : {code}\nCliquer pour reessayer.",
        "viewer.metadataErrorRetry": "{message}\n\nCliquer pour reessayer.",
        "sidebar.fileInfo.title": "Infos fichier",
        "sidebar.fileInfo.dimensionsTooltip": "Resolution image/video en pixels",
        "sidebar.fileInfo.duration": "Duree",
        "sidebar.fileInfo.durationTooltip": "Duree de la video",
        "sidebar.fileInfo.fpsTooltip": "Frequence d'image native",
        "sidebar.fileInfo.length": "Longueur",
        "sidebar.fileInfo.frames": "{count} frames",
        "sidebar.fileInfo.lengthTooltip": "Nombre total de frames",
        "sidebar.fileInfo.generationTime": "Temps de generation",
        "sidebar.fileInfo.generationTimeTooltip":
            "Temps necessaire pour generer cet asset (temps d'execution workflow)",
        "sidebar.fileInfo.time": "Heure",
        "sidebar.fileInfo.dateTooltip": "Date de creation/generation du fichier",
        "sidebar.fileInfo.timeTooltip": "Heure de creation/generation du fichier",
        "sidebar.fileInfo.fileSize": "Taille fichier",
        "sidebar.fileInfo.fileSizeTooltip": "Taille du fichier sur disque",
        "sidebar.fileInfo.assetId": "Asset ID",
        "sidebar.fileInfo.assetIdTooltip": "Identifiant interne de l'asset en base",
        "sidebar.fileInfo.jobId": "Job ID",
        "sidebar.fileInfo.jobIdTooltip": "Identifiant du job workflow (prompt_id)",
        "sidebar.fileInfo.sourceNode": "Node source",
        "sidebar.fileInfo.sourceNodeTooltip": "ID du node ComfyUI qui a produit ce fichier",
        "sidebar.fileInfo.nodeType": "Type de node",
        "sidebar.fileInfo.nodeTypeTooltip": "Classe du node ComfyUI qui a produit ce fichier",
        "sidebar.fileInfo.workflowId": "Workflow ID",
        "sidebar.fileInfo.workflowIdTooltip":
            "Identifiant du workflow ComfyUI (depuis workflow.id dans extra_data)",
        "sidebar.folder.details": "Details dossier",
        "sidebar.folder.name": "Nom",
        "sidebar.folder.path": "Chemin",
        "sidebar.folder.folders": "Dossiers",
        "sidebar.folder.files": "Fichiers",
        "sidebar.folder.created": "Cree",
        "sidebar.folder.modified": "Modifie",
        "sidebar.folder.note": "Note",
        "sidebar.folder.scanTruncated": "Scan tronque pour les performances",
        "sidebar.generation.title": "Generation",
        "sidebar.generation.workflowEngine": "Moteur workflow : {value}",
        "sidebar.generation.apiProvider": "Provider API : {value}",
        "sidebar.generation.override": "Override",
        "sidebar.generation.overrideTooltip": "Ce champ a ete force par Majoor Gen Info Override",
        "sidebar.generation.metadataTruncated": "Metadonnees tronquees",
        "sidebar.generation.metadataTruncatedBody":
            "Les donnees de generation sont incompletes car elles depassent la limite de taille.",
        "sidebar.generation.generationData": "Donnees de generation",
        "sidebar.generation.mediaOnlyPipeline":
            "Ce fichier ressemble a une pipeline media-only (ex. LoadVideo/VideoCombine) et ne contient pas de parametres de generation.",
        "sidebar.generation.promptPipeline": "Pipeline prompt ({count} variantes)",
        "sidebar.generation.promptN": "Prompt {n}",
        "sidebar.generation.positive": "POSITIF",
        "sidebar.generation.negative": "NEGATIF",
        "sidebar.generation.positivePrompt": "Prompt positif",
        "sidebar.generation.negativePrompt": "Prompt negatif",
        "sidebar.generation.promptAlignment": "Alignement prompt",
        "sidebar.generation.promptAlignmentTooltip":
            "Mesure a quel point l'image generee correspond au prompt (score SigLIP2)",
        "sidebar.generation.aiCaptionTooltip": "Caption IA generee par Florence-2",
        "sidebar.generation.copyCaptionTooltip": "Cliquer pour copier la caption",
        "sidebar.generation.aiCaptionDisabled": "Les controles de caption IA sont desactives",
        "sidebar.generation.aiDisabledEnv":
            "Les fonctions IA sont desactivees (activez la variable d'environnement vector search).",
        "sidebar.generation.aiDisabledSettings": "Les fonctions IA sont desactivees dans les parametres.",
        "sidebar.generation.imageDescription": "Description image",
        "sidebar.generation.noImageDescription": "Aucune description image pour le moment.",
        "sidebar.generation.lyrics": "Lyrics",
        "sidebar.generation.pipeline": "Pipeline de generation",
        "sidebar.generation.stageBase": "Base",
        "sidebar.generation.stageTextToImage": "Texte vers image",
        "sidebar.generation.stageImageToImage": "Image vers image",
        "sidebar.generation.stageInpaint": "Inpaint",
        "sidebar.generation.stageUpscale": "Upscale",
        "sidebar.generation.stageRefine": "Refine",
        "sidebar.generation.stageRefineUpscale": "Refine / Upscale",
        "sidebar.generation.stagePassN": "Pass {n}",
        "sidebar.generation.modelBranches": "Branches modele",
        "sidebar.generation.highNoise": "High Noise",
        "sidebar.generation.lowNoise": "Low Noise",
        "sidebar.generation.loraStack": "Stack LoRA",
        "sidebar.generation.modelLora": "Modele & LoRA",
        "sidebar.generation.model": "Modele",
        "sidebar.generation.sampling": "Sampling",
        "sidebar.generation.audio": "Audio",
        "sidebar.generation.image": "Image",
        "sidebar.generation.notes": "Notes",
        "sidebar.generation.ttsInstruction": "Instruction TTS",
        "sidebar.generation.seed": "Seed",
        "sidebar.generation.copySeedTooltip": "Cliquer pour copier le seed : {seed}",
        "sidebar.generation.sourceFiles": "Fichiers source",
        "sidebar.generation.customInfoN": "Info custom {n}",
        "sidebar.generation.checkpoint": "Checkpoint",
        "sidebar.generation.checkpointN": "Checkpoint {n}",
        "sidebar.generation.upscaler": "Upscaler",
        "sidebar.generation.loras": "LoRAs",
        "sidebar.generation.sampler": "Sampler",
        "sidebar.generation.steps": "Steps",
        "sidebar.generation.cfgScale": "CFG Scale",
        "sidebar.generation.cfgHighNoise": "CFG High Noise",
        "sidebar.generation.cfgLowNoise": "CFG Low Noise",
        "sidebar.generation.scheduler": "Scheduler",
        "sidebar.generation.denoise": "Denoise",
        "sidebar.generation.narratorVoice": "Voix narrateur",
        "sidebar.generation.language": "Langue",
        "sidebar.generation.repetitionPenalty": "Repetition Penalty",
        "sidebar.generation.maxNewTokens": "Max New Tokens",
        "sidebar.generation.device": "Device",
        "sidebar.generation.voicePreset": "Voice Preset",
        "sidebar.generation.compileMode": "Compile Mode",
        "sidebar.generation.torchCompile": "Torch Compile",
        "sidebar.generation.cudaGraphs": "CUDA Graphs",
        "sidebar.generation.xVectorOnly": "X-Vector Only",
        "sidebar.generation.chunking": "Chunking",
        "sidebar.generation.maxCharsChunk": "Max Chars/Chunk",
        "sidebar.generation.chunkMethod": "Methode chunk",
        "sidebar.generation.silenceBetweenChunks": "Silence entre chunks (ms)",
        "sidebar.generation.audioCache": "Cache audio",
        "sidebar.generation.batchSize": "Batch Size",
        "sidebar.generation.lyricsStrength": "Lyrics Strength",
        "sidebar.generation.clipSkip": "Clip Skip",
        "sidebar.generation.workflowNotes": "Notes workflow",
        "sidebar.generation.temperature": "Temperature",
        "sidebar.generation.dtype": "Dtype",
        "sidebar.generation.attention": "Attention",
        "viewer.mode": "Mode viewer",
        "viewer.mode.simple": "Simple",
        "viewer.mode.abCompare": "Comparaison A/B",
        "viewer.mode.sideBySide": "Cote a cote",
        "viewer.mode.grid": "Grille",
        "viewer.pinSlots": "Epingler les slots A/B/C/D",
        "workflowSidebar.nodes": "Noeuds",
        "workflowSidebar.links": "Liens",
        "workflowSidebar.groups": "Groupes",
        "workflowSidebar.close": "Fermer la sidebar",
        "workflowSidebar.graphMap": "Graph Map",
        "workflowSidebar.comfyWorkflow": "Workflow ComfyUI",
        "workflowSidebar.workflowNodes": "Noeuds du workflow",
        "workflowSidebar.moreNodes": "+{count} noeuds en plus",
        "workflowSidebar.sourceSynthetic": "Synthetique",
        "workflowSidebar.sourceEmbedded": "Integre",
        "workflowSidebar.sizeCompact": "Compact",
        "workflowSidebar.sizeComfort": "Confort",
        "workflowSidebar.sizeExpanded": "Etendu",
        "workflowSidebar.minimapSizeTitle": "Mini-map {label}",
        "workflowSidebar.nodeLabels": "Labels des noeuds",
        "workflowSidebar.nodeColors": "Couleurs des noeuds",
        "workflowSidebar.showLinks": "Afficher les liens",
        "workflowSidebar.showFramesGroups": "Afficher frames/groupes",
        "workflowSidebar.renderBypassState": "Afficher l'etat bypass",
        "workflowSidebar.renderErrorState": "Afficher l'etat erreur",
        "workflowSidebar.showViewport": "Afficher le viewport",
        "workflowSidebar.minimapHint": "Cliquer/glisser pour naviguer - molette pour zoomer",
        "workflowSidebar.showRawJson": "Afficher le JSON brut",
        "genInfoOverride.autoFillFromWorkflow": "Auto-fill depuis le workflow",
        "genInfoOverride.pick": "Choisir",
        "genInfoOverride.pickField": "Choisir {field}",
        "genInfoOverride.pickFromWorkflow": "Choisir Gen Info depuis le workflow",
        "dialog.close": "Fermer",
        "model3d.controlHint": "Rotation : drag gauche  Pan : drag droit  Zoom : molette",
        "model3d.viewportAction": "Action viewport 3D",
        "model3d.preview": "Preview 3D",
        "model3d.unavailable": "Viewer 3D indisponible",
        "model3d.background": "Fond",
        "model3d.material": "Materiau",
        "model3d.skeleton": "Squelette",
        "model3d.lights": "Lumieres",
        "model3d.intensity": "Intensite",
        "model3d.play": "Lecture",
        "model3d.pause": "Pause",
        "model3d.playPause": "Lecture / Pause",
        "model3d.playbackSpeed": "Vitesse de lecture",
        "model3d.reset": "Reset",
        "model3d.resetView": "Reset vue 3D",
        "model3d.grid": "Grille",
        "model3d.toggleGrid": "Afficher/masquer la grille",
        "model3d.persp": "Persp",
        "model3d.ortho": "Ortho",
        "model3d.switchCamera": "Basculer perspective / orthographique",
        "model3d.settings": "Parametres",
        "model3d.downloadFile": "Telecharger {file}",
        "badge.collisionName": "Nom : {name}",
        "badge.collisionPaths": "Chemins :",
        "badge.collisionSelect": "Cliquer pour selectionner les collisions dans la vue courante",
        "badge.workflow.pendingParsing": "En attente : parsing des metadonnees...",
        "badge.workflow.complete": "Complet : workflow + donnees de generation detectes",
        "badge.workflow.partialWorkflowOnly": "Partiel : workflow seulement (donnees de generation manquantes)",
        "badge.workflow.partialGenerationOnly": "Partiel : donnees de generation seulement (workflow manquant)",
        "badge.workflow.none": "Aucun : aucun workflow ou donnees de generation trouves",
        "badge.workflow.pendingNotParsed": "En attente : metadonnees pas encore parsees",
        "badge.workflow.enrichmentQueued":
            "En attente : enrichissement des metadonnees en base ({count} en file)",
        "badge.workflow.enrichment": "En attente : enrichissement des metadonnees en base",
        "badge.workflow.aiTooltip": "{title}\nIA : {ai}\nCliquer pour rescanner ce fichier",
        "badge.workflow.tooltip": "{title}\nCliquer pour rescanner ce fichier",
        "badge.ai.vectorIndexed": "vecteur indexe",
        "badge.ai.tagSuggestions": "suggestions de tags IA",
        "badge.ai.enhancedPrompt": "prompt enrichi",
        "badge.ai.indexed": "indexe",
        "badge.rating": "Rating : {rating} etoile{plural}",
        "badge.generationTimeMinutes": "Temps de generation : {minutes} minutes ({seconds}s)",
        "badge.generationTimeSeconds": "Temps de generation : {seconds} secondes",
        "badge.tags": "Tags : {tags}",
        "weekday.monShort": "Lun",
        "weekday.tueShort": "Mar",
        "weekday.wedShort": "Mer",
        "weekday.thuShort": "Jeu",
        "weekday.friShort": "Ven",
        "weekday.satShort": "Sam",
        "weekday.sunShort": "Dim",

        "setting.ai.vector.enabled.name": "Activer la recherche semantique IA",
        "setting.ai.vector.enabled.desc":
            "Active la recherche semantique basee sur CLIP. Desactivez pour une recherche par mots-cles uniquement.",
        "setting.ai.vector.captionOnIndex.name":
            "Generer les captions IA pendant l'indexation",
        "setting.ai.vector.captionOnIndex.desc":
            "Autorise l'indexation vectorielle automatique et le backfill a executer les captions Florence-2 pour les images. C'est plus lent et peut utiliser beaucoup de VRAM/CPU ; laissez desactive pour demarrer la grille plus vite.",
        "setting.viewer.pauseExecution.name":
            "Majoor : Pause du viewer principal pendant l'execution",
        "setting.viewer.pauseExecution.desc":
            "Met en pause les processeurs de rendu du viewer principal pendant une generation ComfyUI pour reduire la concurrence CPU/GPU.",
        "setting.viewer.floatingPauseExecution.name":
            "Majoor : Pause du Floating Viewer pendant l'execution",
        "setting.viewer.floatingPauseExecution.desc":
            "Met en pause le Floating Viewer pendant la generation. Desactivez cette option pour garder les steps visibles en direct.",
        "setting.viewer.mfvPreviewMethod.name": "Majoor : Methode de preview MFV",
        "setting.viewer.mfvPreviewMethod.desc":
            "Mode de preview force par le bouton Run du Floating Viewer. 'taesd' donne la meilleure chance d'avoir un preview, avec repli sur latent2rgb quand c'est possible.",

        "runtime.unavailable": "Runtime indisponible",
        "runtime.metricsTitle":
            "Metriques runtime\nConnexions DB actives : {active}\nFile enrichissement : {enrichQ}\nFichiers watcher en attente : {pending}",
        "runtime.metricsLine":
            "DB active : {active} | File enrich. : {enrichQ} | Watcher en attente : {pending}",
        "runtime.writeAuthActive": "Auth ecriture : active {tokenHint}",
        "runtime.writeAuthMissing": "Auth ecriture : absente dans ce navigateur {tokenHint}",
        "runtime.writeAuthRequired": "Auth ecriture : requise",
        "runtime.writeAuthNotRequired": "Auth ecriture : non requise",
        "runtime.writeAuthBlocked": "Auth ecriture : ecritures bloquees par le serveur",
        "runtime.writeAuthUnknown": "Auth ecriture : inconnue",
        "status.runtimeProgress": "Progression runtime : {value}/{max}",
        "status.queueRemaining": "File restante : {count}",
        "status.executionCached": "Noeuds en cache reutilises : {count}",
        "status.activePrompt": "Prompt actif : {id}",

        "btn.dbSave": "Sauvegarder BDD",
        "btn.dbRestore": "Restaurer BDD",
        "btn.back": "Retour",
        "btn.up": "Monter",
        "btn.saving": "Sauvegarde...",
        "btn.restoring": "Restauration...",
        "btn.markAllRead": "Tout marquer lu",

        "ctx.pinAsBrowserRoot": "Epingler comme racine Browser",
        "ctx.createFolderHere": "Creer dossier ici...",
        "ctx.renameFolder": "Renommer dossier...",
        "ctx.moveFolder": "Deplacer dossier...",
        "ctx.deleteFolder": "Supprimer dossier...",
        "ctx.refreshMetadata": "Rafraichir metadonnees",
        "ctx.openFolder": "Ouvrir dossier",

        "dialog.browserRootLabelOptional": "Label pour nouvelle racine browser (optionnel)",
        "dialog.newFolderName": "Nom du nouveau dossier",
        "dialog.renameFolder": "Renommer dossier",
        "dialog.destinationDirectoryPath": "Chemin dossier destination",
        "dialog.deleteFolderRecursive": 'Supprimer le dossier "{name}" et tout son contenu ?',
        "dialog.settingsSaveFailed":
            "Majoor : echec sauvegarde des parametres (stockage navigateur plein ou bloque).",
        "dialog.yes": "Oui",
        "dialog.no": "Non",
        "dialog.ok": "OK",
        "dialog.prompt": "Saisie",
        "dialog.choiceTypeNumber": "Entrez un numero :",
        "dialog.confirmDeleteTitle": "Majoor : confirmer suppression",
        "dialog.deleteSelectedFiles": "Supprimer {count} fichiers selectionnes ?",
        "dialog.deleteSingleFile": 'Supprimer "{label}" ?',
        "dialog.vectorsReset.title": "Vecteurs IA",
        "dialog.vectorsReset.choice":
            "Reinitialiser aussi les vecteurs IA ?\n\nConfirmer = oui, tout reinitialiser (les vecteurs seront recalcules)\nAnnuler = non, conserver les vecteurs existants",
        "dialog.vectorsReset.keepQuestion":
            "Conserver les vecteurs IA existants ?\n\nConfirmer = conserver les vecteurs\nAnnuler = continuer sans vecteurs",
        "dialog.vectorsReset.wipeConfirm":
            "Reinitialiser aussi les vecteurs IA ?\n\nConfirmer = oui, tout reinitialiser\nAnnuler = abandonner",
        "dialog.vectorsReset.singleQuestion":
            "Choisissez le mode de reinitialisation pour {action} :\n\nOui = conserver les vecteurs IA existants\nNon = reinitialisation complete (les vecteurs seront recalcules)\nAnnuler = abandonner",
        "dialog.vectorsReset.optionKeep": "Oui - conserver vecteurs",
        "dialog.vectorsReset.optionFull": "Non - reinit complete",
        "dialog.vectorsReset.optionCancel": "Annuler",
        "dialog.resetIndex.confirmKeepVectors":
            "Cette action reinitialise l'index et relance le scan en conservant les vecteurs IA existants.\n\nContinuer ?",
        "dialog.dbDelete.keepVectorsConfirm":
            "Cette action reinitialise l'index et conserve les vecteurs IA existants. Les fichiers DB ne seront pas supprimes de force.\n\nContinuer ?",

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
        "toast.failedCreateSmartCollection": "Echec creation collection intelligente",
        "toast.failedAddAssetsToSmartCollection":
            "Echec ajout des assets a la collection intelligente",
        "toast.noGroupsFoundIndexFirst": "Aucun groupe trouve. Indexez plus d'assets d'abord.",
        "toast.failedLoadClusterAssets": "Echec chargement assets du cluster",
        "toast.collectionCreatedWithAssets": 'Collection "{name}" creee avec {count} assets !',
        "toast.collectionCreatedNamed": 'Collection "{name}" creee.',
        "toast.clusterAnalysisFailed": "Echec analyse des clusters",
        "toast.vectorBackfillStarting":
            "Demarrage du vector backfill... Cela peut prendre du temps.",
        "toast.vectorBackfillRunning": "Le vector backfill continue en arriere-plan{job}.",
        "toast.vectorBackfillComplete":
            "Vector backfill termine ! Traites : {processed}, Indexes : {indexed}, Ignores : {skipped}",
        "toast.vectorBackfillFailedGeneric": "Echec du backfill",
        "toast.vectorBackfillFailedDetail": "Echec du vector backfill : {error}",
        "toast.aiSearchPartiallyIndexed":
            "L'index de recherche IA n'est que partiellement construit ({indexed}/{eligible}, {percent} %). Lancez Vector Backfill pour les assets existants.",
        "toast.rescanUpdatingAiIndex": "Rescan du fichier + mise a jour index IA...",
        "toast.metadataVectorUpdated":
            "Metadonnees + index vectoriel IA mis a jour pour cet asset.",
        "toast.metadataUpdatedVectorFailed":
            "Metadonnees mises a jour. L'index vectoriel IA n'a pas pu etre mis a jour.",

        "label.computer": "Ordinateur",
        "label.collection": "collection",
        "rating.title": "Note : {n}",
        "rating.label": "Note",
        "rating.setN": "Definir la note a {n}",
        "tags.title": "Tags : {tags}",
        "tags.label": "Tags",
        "tags.addLabel": "Ajouter un tag",
        "tags.remove": "Supprimer le tag",
        "tags.suggestions": "Suggestions de tags",
        "label.thisFile": "ce fichier",
        "label.messages": "Messages",
        "label.readMe": "Read Me",
        "label.userGuide": "Guide utilisateur",
        "label.info": "Info",
        "btn.giveStar": "Mettre une etoile",
        "label.resolutionMinWxH": "Min LxH (px)",
        "label.resolutionMaxWxH": "Max LxH (px)",
        "msg.noMessages": "Aucun message pour le moment.",
        "msg.noPinnedFolders": "Aucun dossier epingle",
        "sidebar.placeholderSelectAsset": "Selectionnez un asset pour voir les details",
        "msg.noTagsYet": "Aucun tag pour le moment...",
        "msg.category.information": "Information",
        "msg.shortcuts.title": "Guide des raccourcis",
        "msg.shortcuts.body":
            "Tous les raccourcis actifs sont regroupes ici par section pour rester visibles dans le Message Center.",
        "msg.shortcuts.intro":
            "Raccourcis clavier actuels groupes par section pour consultation rapide.",
        "msg.shortcuts.openGuide": "Ouvrir le guide complet",
        "msg.shortcuts.section.panel": "Global / Panneau",
        "msg.shortcuts.section.grid": "Vue grille",
        "msg.shortcuts.section.viewer": "Viewer standard",
        "msg.shortcuts.section.mfv": "Floating Viewer",
        "msg.shortcuts.section.video": "Lecture video",
        "msg.category.release": "Version",
        "msg.whatsNew.title.dndGraphMapSettings": "Nouvelle Version 2.4.8 - DnD, Graph Map et Parametres",
        "msg.whatsNew.body.dndGraphMapSettings":
            "Version 2.4.8 publiee : le Drag and Drop a ete corrige et clarifie, y compris pour le depot sur canvas/noeud, le comportement de staging, le feedback visuel et les interactions avec le workflow-drop de ComfyUI. Graph Map dans le Floating Viewer permet maintenant d'inspecter les workflows embarques sans les ouvrir sur le canvas, de copier des noeuds ou leurs attributs, et de transferer les attributs d'un noeud vers un noeud similaire selectionne sur le canvas. L'acces aux parametres et leurs explications ont aussi ete ameliores, avec un acces plus simple depuis l'icone engrenage du panneau et depuis le Floating Viewer.",
        "msg.whatsNew.title.version246": "Nouvelle Version 2.4.6",
        "msg.whatsNew.body.version246":
            "Version 2.4.6 publiee : divers correctifs de bugs et ameliorations de performances et fluidite. Support concatenate ameliore pour les nodes par defaut et custom (par Forsion07). Ajout des helpers pour Api Node et Ernie Image. Le Live Stream du Floating Viewer est desormais desactive par defaut. Voir CHANGELOG pour details.",
        "msg.whatsNew.title.gridMfvToolboxUpgrade": "Quoi de neuf - upgrade Grid et MFV",
        "msg.whatsNew.body.gridMfvToolboxUpgrade":
            "Les performances et la fluidite de la grid ont ete ameliorees. Le Majoor Floating Viewer n'est plus seulement un viewer light : il integre maintenant des fonctions avancees comme Node Stream, Node Parameters et l'edition directe des nodes depuis le viewer. De nouveaux outils ont aussi ete ajoutes dans la toolbox, avec en plus plusieurs corrections et nettoyages de code.",
        "msg.tip.title.majoorImageOpsNodePack": "Do you know this node pack ?",
        "msg.tip.body.majoorImageOpsNodePack":
            "Decouvrez Majoor ImageOps, un node pack ComfyUI avec des nodes pratiques pour les operations d'image dans vos workflows.",
        "label.openNodePack": "Ouvrir le node pack",
        "msg.tip.title.graphMapGuide": "Conseil - Guide Graph Map",
        "msg.tip.body.graphMapGuide":
            "Graph Map dispose maintenant de sa propre page de documentation avec captures d'ecran et explication rapide. Ouvrez le guide pour voir comment lire la carte du workflow, inspecter les noeuds selectionnes et utiliser les actions du panneau de detail.",
        "label.graphMapGuide": "Guide Graph Map",
        "msg.tip.title.mfvGuide": "Conseil - Guide MFV",
        "msg.tip.body.mfvGuide":
            "MFV dispose maintenant de son propre guide illustre avec les modes de comparaison, les pins A/B/C/D, les streams, les Node Parameters, Run/Stop, le pop-out et la facon dont Graph Map complete naturellement le workflow du viewer.",
        "label.mfvGuide": "Guide MFV",
        "label.changelog": "Changelog",
        "label.settingsGuide": "Guide des param\u00e8tres",
        "msg.tip.title.mfvLivePreviewDefaults": "Conseil - Ouverture automatique du Viewer",
        "msg.tip.body.mfvLivePreviewDefaults":
            "Le Live Stream (bouton vert dans le viewer) et la pr\u00e9visualisation KSampler peuvent \u00eatre activ\u00e9s par d\u00e9faut via Param\u00e8tres \u2192 Majoor Assets Manager \u203a Viewer. Lorsque le Live Stream est actif, cliquer sur un node Load Image ou la fin d'une g\u00e9n\u00e9ration ouvrira automatiquement le Floating Viewer et affichera le r\u00e9sultat. La pr\u00e9visualisation KSampler diffuse les \u00e9tapes de d\u00e9bruitage en direct. Les deux options peuvent \u00eatre d\u00e9finies comme \u00e9tat par d\u00e9faut pour que le viewer soit toujours pr\u00eat.",
        "msg.whatsNew.title.version243": "Nouvelle Version 2.4.3",
        "msg.whatsNew.body.version243":
            "Version 2.4.3 publiee : analyse des metadonnees des assets amelioree, capacite Grid Compare dans le floating viewer jusqu'a 4 Assets, boucle ping pong dans le Viewer principal, job id et stack id dans la BDD pour une meilleure gestion des assets, empilement des assets generes depuis le meme workflow avec le meme job ID, fonctionnalite de feed genere, version legere de la grille dans l'onglet bottom. Refactorisation du code pour la maintenabilite et divers correctifs de bugs. Voir CHANGELOG pour details.",
        "msg.whatsNew.title.version241": "Nouvelle Version 2.4.1",
        "msg.whatsNew.body.version241":
            "Version 2.4.1 publiee : recherche semantique CLIP avec AI toggle, support rgthree/easy node, onglet shortcut guide, extraction de modele upscaler. Correction de fuites memoire MFV, filtres workflow, SQL placeholders. Amelioration extraction geninfo, gestion tags, calendrier. Voir CHANGELOG pour details.",
        "msg.whatsNew.title.floatingViewerShortcuts": "Quoi de neuf",
        "msg.whatsNew.body.floatingViewerShortcuts":
            "Nouveaux raccourcis clavier pour le Floating Viewer : ouvrir/fermer le MFV avec V, comparaison avec C, Live Stream avec L, et KSampler Preview avec K. Voir l'onglet Shortcut Guide pour la liste complete.",
        "msg.whatsNew.title.pinReference": "Quoi de neuf",
        "msg.whatsNew.body.pinReference":
            "Floating Viewer : nouvelle fonction Pin Reference. Vous pouvez maintenant epingler A ou B, puis comparer rapidement avec les assets selectionnes dans la grille tout en gardant la reference fixe.",
        "msg.whatsNew.title.vectorResetKeepVectors": "Quoi de neuf",
        "msg.whatsNew.body.vectorResetKeepVectors":
            "Reset index et Delete DB demandent d'abord s'il faut conserver les vecteurs IA. Si vous avez deja des anciens assets indexes, garder les vecteurs est recommande : un reset complet sans eux peut declencher un long Vector Backfill sur les anciens assets et augmenter temporairement la consommation RAM.",
        "msg.whatsNew.title.localUserGuide": "Quoi de neuf",
        "msg.whatsNew.body.localUserGuide":
            "Ouvrez le Guide utilisateur local directement depuis le dossier custom_nodes d'Assets Manager.",
        "msg.category.development": "Developpement",
        "msg.development.title.vueRefactoring": "Refactorisation Vue 3",
        "msg.development.body.vueRefactoring":
            "Modernisation du frontend en cours : Les composants UI nucleaires sont en cours de migration vers Vue 3 pour une meilleure maintenabilite et compatibilite avec le nouveau frontend ComfyUI. Cela garantit un support a long terme et une architecture plus propre.",
        "label.viewProgress": "Voir la progression",
        "msg.collectionAdd.added": '{added} element(s) ajoute(s) a "{name}".',
        "msg.collectionAdd.skippedExisting":
            "{count} element(s) ignores : deja presents dans la collection.",
        "msg.collectionAdd.skippedDuplicate": "{count} doublon(s) ignores dans la selection.",
        "msg.collectionAdd.noneAddedExisting":
            'Aucun nouvel element ajoute a "{name}" (tous deja presents).',
        "msg.dbResetNoticeDetail":
            'Note de mise a jour Majoor :\n\nPour eviter les erreurs de base de donnees avec cette version, supprimez votre index existant. Cliquez sur le bouton "Delete DB" dans le panneau Index Status pour le reinitialiser.',
        "msg.nightlyUpdateTitle": "Nouvelle nightly disponible",
        "msg.nightlyUpdateDetail":
            "Une build nightly plus recente est disponible. Télécharger : https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/releases/tag/nightly",
        "msg.newVersionTitle": "Mise à jour disponible",
        "msg.newVersionDetail":
            "La version {latest} est disponible. Version installée : {current}.",
        "tooltip.starGithub": "Ouvrir GitHub et mettre une etoile",
    },
};

const LANGUAGE_NAMES: Record<string, string> = Object.freeze({
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

// Generated translations are loaded lazily to speed up startup.
// en-US is always available inline; other locales are loaded on demand.
let _generatedTranslationsLoaded = false;
let _generatedTranslationsPromise: Promise<void> | null = null;

function _mergeGeneratedTranslations(GENERATED_TRANSLATIONS: any) {
    if (_generatedTranslationsLoaded) return;
    _generatedTranslationsLoaded = true;
    Object.entries(GENERATED_TRANSLATIONS || {}).forEach(([code, entries]) => {
        DICTIONARY[code] = { ...(DICTIONARY[code] || {}), ...((entries as Record<string, any>) || {}) };
    });
    _backfillFromEnUS();
}

function _backfillFromEnUS() {
    const EN_US_DICT = DICTIONARY["en-US"] || {};
    Object.keys(DICTIONARY).forEach((code) => {
        if (code === "en-US") return;
        DICTIONARY[code] = { ...EN_US_DICT, ...(DICTIONARY[code] || {}) };
    });
}

/**
 * Load generated translations on demand (for non-English locales).
 * Returns a promise that resolves once translations are merged.
 * @returns {Promise<void>}
 */
function _ensureGeneratedTranslations() {
    if (_generatedTranslationsLoaded) return Promise.resolve();
    if (!_generatedTranslationsPromise) {
        _generatedTranslationsPromise = import("./i18n.generated.js")
            .then(({ GENERATED_TRANSLATIONS }) => {
                _mergeGeneratedTranslations(GENERATED_TRANSLATIONS);
            })
            .catch((e) => {
                console.warn("[Majoor i18n] Failed to load generated translations:", e);
                _backfillFromEnUS();
            });
    }
    return _generatedTranslationsPromise;
}

// For en-US, backfill empty locale stubs immediately (no generated data needed).
_backfillFromEnUS();

// -----------------------------------------------------------------------------
// API
// -----------------------------------------------------------------------------

/**
 * Map various locale codes to our supported languages.
 * Uses lookup table for O(1) performance instead of sequential if statements.
 * @param {string} locale - Locale code to map
 * @returns {string} Mapped language code
 */
function mapLocale(locale: any) {
    if (!locale) return DEFAULT_LANG;
    const raw = String(locale || "").trim();
    const lower = raw.toLowerCase();

    // Fast lookup in mapping table
    if (LOCALE_MAP[lower]) return LOCALE_MAP[lower];

    // Direct match for full locale codes
    if (DICTIONARY[raw]) return raw;

    return DEFAULT_LANG;
}

function _readStoredLang() {
    try {
        for (const key of LANG_STORAGE_KEYS) {
            const value = String(SettingsStore.get(key) || "").trim();
            if (value) return value;
        }
    } catch (e) {
        console.debug?.(e);
    }
    return "";
}

function _persistLang(lang: any) {
    try {
        // Keep legacy and new key in sync for smooth upgrades.
        SettingsStore.set(LANG_STORAGE_KEYS[0], lang);
        SettingsStore.set(LANG_STORAGE_KEYS[1], lang);
    } catch (e) {
        console.debug?.(e);
    }
}

function _readFollowComfyLang() {
    try {
        const raw = String(SettingsStore.get(FOLLOW_COMFY_LANG_STORAGE_KEY) || "")
            .trim()
            .toLowerCase();
        if (!raw) return true;
        return !["0", "false", "no", "off"].includes(raw);
    } catch (e) {
        console.debug?.(e);
    }
    return true;
}

function _persistFollowComfyLang(enabled: any) {
    try {
        SettingsStore.set(FOLLOW_COMFY_LANG_STORAGE_KEY, enabled ? "1" : "0");
    } catch (e) {
        console.debug?.(e);
    }
}

function _readComfyLocaleCandidates(app: any) {
    const out: string[] = [];
    const pushCandidate = (value: any) => {
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
        pushCandidate(getSettingForApp(app, key));
    }

    // Additional frontend locale surfaces (if present).
    pushCandidate(app?.ui?.locale);
    pushCandidate(app?.locale);
    pushCandidate(app?.ui?.i18n?.locale);

    return out;
}

function _readPlatformLocaleCandidates() {
    const out: string[] = [];
    const pushCandidate = (value: any) => {
        if (typeof value !== "string") return;
        const v = value.trim();
        if (v) out.push(v);
    };
    try {
        if (typeof document !== "undefined") {
            pushCandidate(document?.documentElement?.lang);
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        if (typeof navigator !== "undefined") {
            pushCandidate(navigator?.language);
            const langs = Array.isArray(navigator?.languages) ? navigator.languages : [];
            for (const lang of langs) pushCandidate(lang);
        }
    } catch (e) {
        console.debug?.(e);
    }
    return out;
}

/**
 * Apply RTL direction for RTL languages.
 */
function _applyRTL() {
    try {
        if (typeof document !== "undefined" && document.documentElement) {
            const isRTL = RTL_LANGUAGES.has(currentLang);
            document.documentElement.dir = isRTL ? "rtl" : "ltr";
        }
    } catch (e) {
        console.debug?.(e);
    }
}

/**
 * Detect and set language from ComfyUI settings.
 * Tries multiple sources compatible with legacy and modern ComfyUI frontends.
 */
export const initI18n = (app: MajoorComfyApp | null | undefined): void => {
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
 * @param {string} lang - Language code to set
 */
export const setLang = (lang: string): void => {
    if (!DICTIONARY[lang]) {
        console.warn(`[Majoor i18n] Unknown language: ${lang}, falling back to ${DEFAULT_LANG}`);
        lang = DEFAULT_LANG;
    }

    if (currentLang === lang) return;

    currentLang = lang;

    // Persist preference
    _persistLang(lang);

    // Apply RTL direction for RTL languages
    _applyRTL();

    // If switching to a non-English locale, ensure generated translations are loaded.
    if (lang !== DEFAULT_LANG && !_generatedTranslationsLoaded) {
        void _ensureGeneratedTranslations().then(() => {
            // Re-notify listeners once translations are available so UI updates.
            Array.from(_langChangeListeners).forEach((cb) => {
                try {
                    cb(lang);
                } catch (e) {
                    console.debug?.(e);
                }
            });
        });
    }

    // Notify listeners
    Array.from(_langChangeListeners).forEach((cb) => {
        try {
            cb(lang);
        } catch (e) {
            console.debug?.(e);
        }
    });
};

export const subscribeLangChange = (callback: (lang: string) => void): (() => void) => {
    if (typeof callback !== "function") return () => {};
    _langChangeListeners.add(callback);
    return () => {
        try {
            _langChangeListeners.delete(callback);
        } catch (e) {
            console.debug?.(e);
        }
    };
};

export const setFollowComfyLanguage = (enabled: boolean): void => {
    _persistFollowComfyLang(!!enabled);
};

/**
 * Start syncing language with ComfyUI settings.
 * Uses timer guard to prevent multiple intervals running simultaneously.
 */
export const startComfyLanguageSync = (app: MajoorComfyApp | null | undefined): void => {
    // Clear any existing timer (guard against multiple calls)
    try {
        if (_comfyLangSyncTimer) {
            clearInterval(_comfyLangSyncTimer);
            _comfyLangSyncTimer = null;
        }
        if (typeof window !== "undefined" && window.__MJR_COMFY_LANG_SYNC_TIMER__) {
            clearInterval(window.__MJR_COMFY_LANG_SYNC_TIMER__);
            window.__MJR_COMFY_LANG_SYNC_TIMER__ = null;
        }
    } catch (e) {
        console.debug?.(e);
    }

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
        } catch (e) {
            console.debug?.(e);
        }
    }, 2000);

    try {
        if (typeof window !== "undefined") {
            window.__MJR_COMFY_LANG_SYNC_TIMER__ = _comfyLangSyncTimer;
        }
    } catch (e) {
        console.debug?.(e);
    }
};

/**
 * Stop syncing language with ComfyUI settings.
 * Clears the interval started by startComfyLanguageSync().
 */
export const stopComfyLanguageSync = () => {
    try {
        if (_comfyLangSyncTimer) {
            clearInterval(_comfyLangSyncTimer);
            _comfyLangSyncTimer = null;
        }
        if (typeof window !== "undefined" && window.__MJR_COMFY_LANG_SYNC_TIMER__) {
            clearInterval(window.__MJR_COMFY_LANG_SYNC_TIMER__);
            window.__MJR_COMFY_LANG_SYNC_TIMER__ = null;
        }
    } catch (e) {
        console.debug?.(e);
    }
};

/**
 * Get the current language code.
 * @returns {string} Current language code
 */
export const getCurrentLang = () => currentLang;

/**
 * Get list of supported languages.
 * @returns {Array<{code: string, name: string}>} Array of supported languages
 */
export const getSupportedLanguages = () =>
    Object.keys(DICTIONARY).map((code) => ({
        code,
        name: LANGUAGE_NAMES[code] || code,
    }));

/**
 * Check if current language is RTL (right-to-left).
 * @returns {boolean} True if current language is RTL
 */
export const isRTL = () => RTL_LANGUAGES.has(currentLang);

/**
 * Translate a key.
 * @param {string} key - Translation key
 * @param {string|object} defaultOrParams - Default text or params object
 * @param {object} params - Parameters for interpolation (e.g., {n: 5})
 * @returns {string} Translated text
 */
export const t = (key: string, defaultOrParams?: string | Record<string, unknown>, params?: Record<string, any>): string => {
    const dict = DICTIONARY[currentLang] || DICTIONARY[DEFAULT_LANG];
    const fallbackDict = DICTIONARY[DEFAULT_LANG];

    let text = dict[key] || fallbackDict[key];

    if (!text) {
        const missingId = `${currentLang}:${String(key || "")}`;

        // Bounded missing key tracking to prevent memory leaks
        if (!_missingTranslationKeys.has(missingId)) {
            if (_missingTranslationKeys.size >= MAX_MISSING_KEYS) {
                // Remove oldest entries (first 20%) when limit reached
                const toRemove = Math.floor(MAX_MISSING_KEYS * 0.2);
                const iterator = _missingTranslationKeys.values();
                for (let i = 0; i < toRemove; i++) {
                    const val = iterator.next().value;
                    if (val) _missingTranslationKeys.delete(val);
                }
            }
            _missingTranslationKeys.add(missingId);

            try {
                console.warn(
                    `[Majoor i18n] Missing translation key "${key}" for locale "${currentLang}"`,
                );
            } catch (e) {
                console.debug?.(e);
            }

            try {
                if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
                    window.dispatchEvent(
                        new CustomEvent("mjr-i18n-missing-key", {
                            detail: { key: String(key || ""), locale: currentLang },
                        }),
                    );
                }
            } catch (e) {
                console.debug?.(e);
            }
        }
        // Return default or key
        if (typeof defaultOrParams === "string") return defaultOrParams;
        return key;
    }

    // Handle params - support both {key} syntax (without spaces)
    const actualParams = typeof defaultOrParams === "object" ? defaultOrParams : params;
    if (actualParams && typeof actualParams === "object") {
        // Replace {key} with values (regex handles {key} without spaces)
        Object.entries(actualParams).forEach(([k, v]) => {
            // Use replaceAll with a literal template string instead of new RegExp to avoid
            // ReDoS risk when keys contain regex metacharacters.
            text = text.replaceAll(`{${k}}`, String(v));
        });
    }

    return text;
};

/**
 * Clear missing translation keys cache.
 * Useful for testing or when translations are dynamically added.
 */
export const clearMissingKeysCache = () => {
    _missingTranslationKeys.clear();
};
