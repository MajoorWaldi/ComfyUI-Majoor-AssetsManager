/**
 * Hand-written shapes for what the "glue" components in ui/vue/App.vue and
 * ui/vue/components/panel/HeaderSection.vue expect back from `ref="..."` on
 * their children.
 *
 * Every .vue import resolves to the same generic `DefineComponent` via
 * ui/types/shims-vue.d.ts (see that file's comment), so `InstanceType<typeof
 * SomeComponent>` can't reflect a component's real defineExpose() shape here
 * — there's no vue-tsc/Volar step generating per-file virtual types (blocked:
 * this repo's typescript@7 is the native/Go rewrite, which the whole
 * classic-tsc-based toolchain — vue-tsc included — can't load; see git log
 * for the vue-tsc install attempt). These interfaces are the manual
 * equivalent: written to match each component's defineExpose() object by
 * hand, so parent refs get a real shape instead of `any`, even though
 * nothing here re-verifies they stay in sync if the child's expose changes.
 */

/** A component instance ref where only the root element ($el) is used. */
export type MjrComponentWithEl = { $el?: HTMLElement } | HTMLElement | null;

/** Generic get/set facade FilterPopover exposes in place of a native <select>/checkbox. */
export interface MjrValueFacade {
    value: unknown;
    addEventListener: (...args: unknown[]) => void;
    removeEventListener: (...args: unknown[]) => void;
    dispatchEvent: (...args: unknown[]) => boolean;
}

export interface MjrStatusSectionExpose {
    statusSection: unknown;
    statusDot: Element | null;
    statusText: Element | null;
    capabilitiesSection: Element | null;
}

export interface MjrSummaryBarSectionExpose {
    summaryBar: HTMLElement | null;
    updateSummaryBar: (payload?: { state?: unknown; gridContainer?: unknown; context?: unknown; actions?: unknown }) => void;
    folderBreadcrumb: HTMLElement | null;
    setFolderBreadcrumb: (payload?: { visible?: boolean; back?: unknown; up?: unknown; items?: unknown[] }) => void;
}

export interface MjrSidebarSectionExpose {
    sidebar: HTMLElement | null;
}

export interface MjrAssetsGridExpose {
    readonly browseSection: HTMLElement | null;
    readonly gridWrapper: HTMLElement | null;
    readonly gridContainer: HTMLElement | null;
    onGridContainerReady: (container?: unknown) => HTMLElement | null;
    bindGridHostState: (opts?: unknown) => () => void;
    restoreGridUiState: (initialLoadPromise: unknown, opts?: unknown) => unknown;
    initAssetsQueryController: (options?: unknown) => unknown;
    loadAssets: (...args: unknown[]) => unknown;
    loadAssetsFromList: (...args: unknown[]) => unknown;
    prepareGridForScopeSwitch: (...args: unknown[]) => unknown;
    refreshGrid: (...args: unknown[]) => unknown;
    captureAnchor: (...args: unknown[]) => unknown;
    restoreAnchor: (...args: unknown[]) => unknown;
    hydrateGridFromSnapshot: (...args: unknown[]) => unknown;
    upsertAsset: (...args: unknown[]) => unknown;
    removeAssets: (...args: unknown[]) => unknown;
    disposeGrid: (...args: unknown[]) => unknown;
}

export interface MjrSearchBarExpose {
    readonly searchSection: HTMLElement | null;
    readonly searchInputEl: HTMLInputElement | null;
    readonly similarBtn: HTMLElement | null;
    readonly similarPopover: HTMLElement | null;
    readonly similarFindBtn: HTMLElement | null;
    readonly similarDuplicatesBtn: HTMLElement | null;
    readonly similarSameNodeBtn: HTMLElement | null;
    readonly similarSameWorkflowBtn: HTMLElement | null;
    readonly semanticBtn: HTMLElement | null;
    setSemanticEnabled: (enabled: unknown) => void;
}

export interface MjrCustomRootsPopoverExpose {
    readonly customSelect: MjrValueFacade;
    readonly customAddBtn: HTMLElement | null;
    readonly customRemoveBtn: HTMLElement | null;
}

export interface MjrMessagePopoverExpose {
    readonly $el?: HTMLElement;
    readonly title: HTMLElement | null;
    readonly markReadBtn: HTMLElement | null;
    readonly messageTabBtn: HTMLElement | null;
    readonly messageTabBadge: HTMLElement | null;
    readonly historyTabBtn: HTMLElement | null;
    readonly historyTabBadge: HTMLElement | null;
    readonly historyTabCount: HTMLElement | null;
    readonly shortcutsTabBtn: HTMLElement | null;
    readonly messageList: HTMLElement | null;
    readonly historyPanel: HTMLElement | null;
    readonly shortcutsPanel: HTMLElement | null;
}

export interface MjrPinnedFoldersPopoverExpose {
    readonly $el?: HTMLElement;
    readonly pinnedFoldersMenu: HTMLElement | null;
    setPinnedFolders: (payload?: unknown) => void;
    setPinnedFoldersLoading: (value: boolean, label?: string) => void;
}

export interface MjrFilterPopoverExpose {
    readonly $el?: HTMLElement;
    readonly kindSelect: MjrValueFacade;
    readonly wfCheckbox: MjrValueFacade;
    readonly workflowTypeSelect: MjrValueFacade;
    readonly workflowIdInput: MjrValueFacade;
    readonly workflowModelInput: MjrValueFacade;
    readonly workflowModelFamilyOptions: Array<{ label: string; value: string }>;
    readonly workflowRunsOnSelect: MjrValueFacade;
    readonly ratingSelect: MjrValueFacade;
    readonly minSizeInput: HTMLInputElement | null;
    readonly maxSizeInput: HTMLInputElement | null;
    readonly resolutionPresetSelect: MjrValueFacade;
    readonly minWidthInput: HTMLInputElement | null;
    readonly minHeightInput: HTMLInputElement | null;
    readonly maxWidthInput: HTMLInputElement | null;
    readonly maxHeightInput: HTMLInputElement | null;
    readonly dateRangeSelect: MjrValueFacade;
    readonly dateExactInput: HTMLInputElement | null;
    readonly agendaContainer: HTMLElement | null;
}

export interface MjrSimilarSearchPopoverExpose {
    readonly $el?: HTMLElement;
    readonly findSimilarBtn: HTMLElement | null;
    readonly findDuplicatesBtn: HTMLElement | null;
    readonly sameNodeBtn: HTMLElement | null;
    readonly sameWorkflowBtn: HTMLElement | null;
}

export interface MjrCollectionsPopoverExpose {
    readonly $el?: HTMLElement;
    refresh: () => Promise<void>;
}

export interface MjrVirtualAssetGridHostExpose {
    readonly gridContainer: (HTMLDivElement & Record<string, unknown>) | null;
    readonly assets: unknown[];
    loadAssets: (...args: unknown[]) => unknown;
    loadAssetsFromList: (...args: unknown[]) => unknown;
    loadNextPage: (...args: unknown[]) => unknown;
    appendNextPage: (...args: unknown[]) => unknown;
    refreshHead: (...args: unknown[]) => unknown;
    upsertRealtime: (...args: unknown[]) => unknown;
    prepareGridForScopeSwitch: (...args: unknown[]) => unknown;
    refreshGrid: (...args: unknown[]) => unknown;
    removeAssets: (...args: unknown[]) => unknown;
    upsertAsset: (...args: unknown[]) => unknown;
    getCanonicalState: (...args: unknown[]) => unknown;
    getDebugSnapshot: (...args: unknown[]) => unknown;
    captureAnchor: (...args: unknown[]) => unknown;
    restoreAnchor: (...args: unknown[]) => unknown;
    hydrateFromSnapshot: (...args: unknown[]) => unknown;
    dispose: () => unknown;
}
