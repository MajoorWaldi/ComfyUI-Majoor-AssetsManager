import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const apiState = vi.hoisted(() => ({
    get: vi.fn(),
}));

vi.mock("../api/client.js", () => ({
    get: apiState.get,
}));

vi.mock("../api/endpoints.js", () => ({
    ENDPOINTS: {
        HEALTH_COUNTERS: "/api/health/counters",
    },
}));

function createGridContainer() {
    return {
        dataset: { mjrQuery: "*" },
        isConnected: true,
        clientWidth: 320,
        clientHeight: 240,
        getClientRects: vi.fn(() => [{ width: 320, height: 240 }]),
        querySelector: vi.fn(() => null),
    };
}

function createGridWrapper() {
    return {
        scrollTop: 0,
        isConnected: true,
        clientWidth: 320,
        clientHeight: 240,
        getClientRects: vi.fn(() => [{ width: 320, height: 240 }]),
    };
}

function createInputElement(initialValue = "") {
    class InputStub extends EventTarget {
        constructor(value = "") {
            super();
            this.value = value;
        }
    }
    return new InputStub(initialValue);
}

describe("useAssetsQuery", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.CustomEvent =
            globalThis.CustomEvent ||
            class extends Event {
                constructor(type, init = {}) {
                    super(type);
                    this.detail = init.detail;
                }
            };
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("coalesces queued reloads and restores the anchor after each pass", async () => {
        const { createAssetsQueryController } =
            await import("../vue/composables/useAssetsQuery.js");

        const gridContainer = createGridContainer();
        const gridWrapper = createGridWrapper();
        const captureAnchor = vi.fn(() => ({ id: "anchor-1" }));
        const restoreAnchor = vi.fn(async () => {});
        const resolvers = [];
        const reloadGrid = vi.fn(
            () =>
                new Promise((resolve) => {
                    resolvers.push(resolve);
                }),
        );

        const controller = createAssetsQueryController({
            gridContainer,
            gridWrapper,
            gridController: { reloadGrid },
            captureAnchor,
            restoreAnchor,
            readScrollTop: () => gridWrapper.scrollTop,
        });

        const firstRun = controller.queuedReload();
        controller.queuedReload();

        expect(reloadGrid).toHaveBeenCalledTimes(1);

        resolvers.shift()?.();
        await Promise.resolve();
        await Promise.resolve();

        expect(reloadGrid).toHaveBeenCalledTimes(2);

        resolvers.shift()?.();
        await firstRun;

        expect(captureAnchor).toHaveBeenCalledTimes(2);
        expect(restoreAnchor).toHaveBeenCalledTimes(2);
    });

    it("restores scroll, selection, and sidebar state after the initial load", async () => {
        const { createAssetsQueryController } =
            await import("../vue/composables/useAssetsQuery.js");

        const previousRaf = globalThis.requestAnimationFrame;
        globalThis.requestAnimationFrame = (callback) => {
            callback();
            return 1;
        };

        const gridContainer = createGridContainer();
        const gridWrapper = createGridWrapper();
        const restoreSelectionState = vi.fn();
        const toggleSidebarDetails = vi.fn();

        const controller = createAssetsQueryController({
            gridContainer,
            gridWrapper,
            gridController: { reloadGrid: vi.fn() },
            readScrollTop: () => 42,
            restoreSelectionState,
            readActiveAssetId: () => "asset-9",
            isSidebarOpen: () => true,
            toggleSidebarDetails,
        });

        await controller.restoreUiState(Promise.resolve({ ok: true }));

        expect(gridWrapper.scrollTop).toBe(42);
        expect(restoreSelectionState).toHaveBeenCalledWith({ scrollTop: 42 });
        expect(toggleSidebarDetails).toHaveBeenCalledTimes(1);

        globalThis.requestAnimationFrame = previousRaf;
    });

    it("delegates UI restoration to an external grid host when provided", async () => {
        const { createAssetsQueryController } =
            await import("../vue/composables/useAssetsQuery.js");

        const restoreGridUiState = vi.fn(async () => {});
        const controller = createAssetsQueryController({
            gridContainer: createGridContainer(),
            gridWrapper: createGridWrapper(),
            gridController: { reloadGrid: vi.fn() },
            restoreGridUiState,
        });

        const initialLoadPromise = Promise.resolve({ ok: true });
        await controller.restoreUiState(initialLoadPromise);

        expect(restoreGridUiState).toHaveBeenCalledWith(initialLoadPromise);
    });

    it("auto-loads the default output grid when counters show assets exist", async () => {
        const { createAssetsQueryController } =
            await import("../vue/composables/useAssetsQuery.js");

        vi.useFakeTimers();
        apiState.get.mockResolvedValue({
            ok: true,
            data: { total_assets: 3 },
        });

        const gridContainer = createGridContainer();
        const loadAssets = vi.fn(async () => ({ ok: true }));

        const controller = createAssetsQueryController({
            gridContainer,
            gridWrapper: createGridWrapper(),
            gridController: { reloadGrid: vi.fn() },
            getQuery: () => "*",
            getScope: () => "output",
            loadAssets,
        });

        controller.scheduleAutoLoad(Promise.resolve({ ok: true }), 25);
        await vi.advanceTimersByTimeAsync(25);

        expect(apiState.get).toHaveBeenCalledWith("/api/health/counters?scope=output", {
            signal: undefined,
        });
        expect(loadAssets).toHaveBeenCalledWith(gridContainer);
    });

    it("defers auto-load while the grid host is hidden and resumes when visible again", async () => {
        const { createAssetsQueryController } =
            await import("../vue/composables/useAssetsQuery.js");

        vi.useFakeTimers();
        apiState.get.mockResolvedValue({
            ok: true,
            data: { total_assets: 3 },
        });

        const gridContainer = createGridContainer();
        gridContainer.isConnected = false;
        gridContainer.getClientRects = vi.fn(() => []);
        const gridWrapper = {
            clientWidth: 320,
            clientHeight: 240,
            isConnected: false,
            getClientRects: vi.fn(() => []),
        };
        const loadAssets = vi.fn(async () => ({ ok: true }));

        const controller = createAssetsQueryController({
            gridContainer,
            gridWrapper,
            gridController: { reloadGrid: vi.fn() },
            getQuery: () => "*",
            getScope: () => "output",
            loadAssets,
        });

        controller.scheduleAutoLoad(Promise.resolve({ ok: true }), 25);
        await vi.advanceTimersByTimeAsync(25);
        expect(loadAssets).toHaveBeenCalledTimes(0);

        gridContainer.isConnected = true;
        gridContainer.getClientRects = vi.fn(() => [{ width: 320, height: 240 }]);
        gridWrapper.isConnected = true;
        gridWrapper.getClientRects = vi.fn(() => [{ width: 320, height: 240 }]);

        controller.setVisibility();
        await vi.advanceTimersByTimeAsync(50);

        expect(loadAssets).toHaveBeenCalledWith(gridContainer);
    });

    it("creates a counters update handler that triggers queued reload on new index updates", async () => {
        const { createAssetsQueryController } =
            await import("../vue/composables/useAssetsQuery.js");

        const reloadGrid = vi.fn(async () => ({ ok: true }));
        const controller = createAssetsQueryController({
            gridContainer: createGridContainer(),
            gridWrapper: createGridWrapper(),
            gridController: { reloadGrid },
            captureAnchor: () => null,
            restoreAnchor: async () => {},
        });

        const handleCountersUpdate = controller.createCountersUpdateHandler({
            state: {
                scope: "output",
                collectionId: "",
                kindFilter: "",
                workflowOnly: false,
                minRating: 0,
                minSizeMB: 0,
                maxSizeMB: 0,
                minWidth: 0,
                minHeight: 0,
                maxWidth: 0,
                maxHeight: 0,
                workflowType: "",
                dateRangeFilter: "",
                dateExactFilter: "",
            },
            getRecentUserInteractionAt: () => 0,
        });

        await handleCountersUpdate({
            last_scan_end: "scan-1",
            last_index_end: "idx-1",
            total_assets: 10,
        });
        await handleCountersUpdate({
            last_scan_end: "scan-1",
            last_index_end: "idx-2",
            total_assets: 10,
        });

        expect(reloadGrid).toHaveBeenCalledTimes(1);
    });

    it("does not auto-reload on background total growth when the grid already shows cards", async () => {
        const { createAssetsQueryController } =
            await import("../vue/composables/useAssetsQuery.js");

        const reloadGrid = vi.fn(async () => ({ ok: true }));
        const controller = createAssetsQueryController({
            gridContainer: {
                ...createGridContainer(),
                querySelector: vi.fn((selector) =>
                    selector === ".mjr-asset-card" ? { dataset: { mjrAssetId: "asset-1" } } : null,
                ),
            },
            gridWrapper: createGridWrapper(),
            gridController: { reloadGrid },
            captureAnchor: () => null,
            restoreAnchor: async () => {},
        });

        const handleCountersUpdate = controller.createCountersUpdateHandler({
            state: {
                scope: "output",
                collectionId: "",
                kindFilter: "",
                workflowOnly: false,
                minRating: 0,
                minSizeMB: 0,
                maxSizeMB: 0,
                minWidth: 0,
                minHeight: 0,
                maxWidth: 0,
                maxHeight: 0,
                workflowType: "",
                dateRangeFilter: "",
                dateExactFilter: "",
            },
            getRecentUserInteractionAt: () => 0,
        });

        await handleCountersUpdate({
            last_scan_end: "scan-1",
            last_index_end: "idx-1",
            total_assets: 100,
        });
        await handleCountersUpdate({
            last_scan_end: "scan-1",
            last_index_end: "idx-1",
            total_assets: 140,
        });

        expect(reloadGrid).toHaveBeenCalledTimes(0);
    });

    it("does not auto-reload on background index updates when the grid already shows cards", async () => {
        const { createAssetsQueryController } =
            await import("../vue/composables/useAssetsQuery.js");

        const reloadGrid = vi.fn(async () => ({ ok: true }));
        const controller = createAssetsQueryController({
            gridContainer: {
                ...createGridContainer(),
                querySelector: vi.fn((selector) =>
                    selector === ".mjr-asset-card" ? { dataset: { mjrAssetId: "asset-1" } } : null,
                ),
            },
            gridWrapper: createGridWrapper(),
            gridController: { reloadGrid },
            captureAnchor: () => null,
            restoreAnchor: async () => {},
        });

        const handleCountersUpdate = controller.createCountersUpdateHandler({
            state: {
                scope: "output",
                collectionId: "",
                kindFilter: "",
                workflowOnly: false,
                minRating: 0,
                minSizeMB: 0,
                maxSizeMB: 0,
                minWidth: 0,
                minHeight: 0,
                maxWidth: 0,
                maxHeight: 0,
                workflowType: "",
                dateRangeFilter: "",
                dateExactFilter: "",
            },
            getRecentUserInteractionAt: () => 0,
        });

        await handleCountersUpdate({
            last_scan_end: "scan-1",
            last_index_end: "idx-1",
            total_assets: 100,
        });
        await handleCountersUpdate({
            last_scan_end: "scan-1",
            last_index_end: "idx-2",
            total_assets: 100,
        });

        expect(reloadGrid).toHaveBeenCalledTimes(0);
    });

    it("does not trigger counters-based reload while the grid host is hidden", async () => {
        const { createAssetsQueryController } =
            await import("../vue/composables/useAssetsQuery.js");

        const gridContainer = createGridContainer();
        gridContainer.isConnected = false;
        gridContainer.getClientRects = vi.fn(() => []);
        const gridWrapper = {
            clientWidth: 320,
            clientHeight: 240,
            isConnected: false,
            getClientRects: vi.fn(() => []),
        };
        const reloadGrid = vi.fn(async () => ({ ok: true }));
        const controller = createAssetsQueryController({
            gridContainer,
            gridWrapper,
            gridController: { reloadGrid },
            captureAnchor: () => null,
            restoreAnchor: async () => {},
        });

        const handleCountersUpdate = controller.createCountersUpdateHandler({
            state: {
                scope: "output",
                collectionId: "",
                kindFilter: "",
                workflowOnly: false,
                minRating: 0,
                minSizeMB: 0,
                maxSizeMB: 0,
                minWidth: 0,
                minHeight: 0,
                maxWidth: 0,
                maxHeight: 0,
                workflowType: "",
                dateRangeFilter: "",
                dateExactFilter: "",
            },
            getRecentUserInteractionAt: () => 0,
        });

        await handleCountersUpdate({
            last_scan_end: "scan-1",
            last_index_end: "idx-1",
            total_assets: 10,
        });
        await handleCountersUpdate({
            last_scan_end: "scan-1",
            last_index_end: "idx-2",
            total_assets: 10,
        });

        expect(reloadGrid).toHaveBeenCalledTimes(0);
    });

    it("binds search input with debounce and immediate reload for empty query", async () => {
        const { createAssetsQueryController } =
            await import("../vue/composables/useAssetsQuery.js");

        vi.useFakeTimers();
        const controller = createAssetsQueryController({
            gridContainer: createGridContainer(),
            gridWrapper: createGridWrapper(),
            gridController: { reloadGrid: vi.fn() },
        });

        const searchInputEl = createInputElement("");
        const onQueryChanged = vi.fn();
        const onBeforeReload = vi.fn();
        const startSearchTimer = vi.fn();
        const reloadGrid = vi.fn();

        const dispose = controller.bindSearchInput({
            searchInputEl,
            debounceMs: 200,
            onQueryChanged,
            onBeforeReload,
            startSearchTimer,
            reloadGrid,
        });

        searchInputEl.value = "dragon";
        searchInputEl.dispatchEvent(new Event("input"));
        expect(onQueryChanged).toHaveBeenCalledTimes(1);
        expect(reloadGrid).toHaveBeenCalledTimes(0);

        await vi.advanceTimersByTimeAsync(200);
        expect(startSearchTimer).toHaveBeenCalledTimes(1);
        expect(onBeforeReload).toHaveBeenCalledTimes(1);
        expect(reloadGrid).toHaveBeenCalledTimes(1);

        searchInputEl.value = "";
        searchInputEl.dispatchEvent(new Event("input"));
        expect(startSearchTimer).toHaveBeenCalledTimes(2);
        expect(onBeforeReload).toHaveBeenCalledTimes(2);
        expect(reloadGrid).toHaveBeenCalledTimes(2);

        dispose();
    });
});
