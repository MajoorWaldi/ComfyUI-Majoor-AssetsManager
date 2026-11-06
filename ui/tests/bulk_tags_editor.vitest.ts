// @vitest-environment happy-dom

/**
 * Bulk tags editor + client tests:
 * - updateAssetsTagsBulk posts {ids, add, remove} to /mjr/am/assets/tags
 * - GridContextMenu renders the bulk editor when opened with a selection
 * - BulkTagsEditor shows per-tag coverage, sends chunked batch calls,
 *   dispatches mjr:asset-tags-changed per updated asset, and skips workflow assets.
 */
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
    getAssetsBatch: vi.fn(),
    updateAssetsTagsBulk: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
    comfyToast: vi.fn(),
}));

const eventsMock = vi.hoisted(() => ({
    safeDispatchCustomEvent: vi.fn(),
}));

vi.mock("../api/client.js", () => ({
    getAssetsBatch: apiMock.getAssetsBatch,
    updateAssetsTagsBulk: apiMock.updateAssetsTagsBulk,
}));

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback, params) => {
        if (!params || typeof fallback !== "string") return fallback;
        return fallback.replace(/\{(\w+)\}/g, (_match, key) => String(params[key] ?? ""));
    },
}));

vi.mock("../app/toast.js", () => ({
    comfyToast: toastMock.comfyToast,
}));

vi.mock("../utils/events.js", () => ({
    safeDispatchCustomEvent: eventsMock.safeDispatchCustomEvent,
}));

vi.mock("../vue/components/common/TagsEditor.vue", () => ({
    default: { template: "<div class='single-tags-stub' />" },
}));

const MButtonStub = {
    inheritAttrs: false,
    template: '<button v-bind="$attrs"><slot /></button>',
};

const MInputTextStub = {
    inheritAttrs: false,
    emits: ["update:modelValue"],
    props: { modelValue: { type: String, default: "" } },
    template:
        '<input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
};

function resetGridContextState(state, helpers) {
    helpers.closeAllGridContextMenus();
    state.portalOwnerId = "";
    state.mountedPortalIds.splice(0, state.mountedPortalIds.length);
    state.main.items = [];
    state.submenu.items = [];
}

function mockBulkResponse({ updated_ids = [], unchanged_ids = [], failed = [], tags = {} } = {}) {
    return {
        ok: true,
        data: { updated_ids, unchanged_ids, failed, tags },
    };
}

async function flushAsync(ticks = 30) {
    for (let index = 0; index < ticks; index += 1) {
        await Promise.resolve();
    }
    await nextTick();
}

async function mountBulkEditor(assets) {
    const { default: BulkTagsEditor } = await import("../vue/components/grid/BulkTagsEditor.vue");
    const wrapper = mount(BulkTagsEditor, {
        attachTo: document.body,
        props: { assets },
        global: {
            stubs: { MButton: MButtonStub, MInputText: MInputTextStub },
        },
    });
    await flushAsync();
    return wrapper;
}

function chipText(tag) {
    const chips = Array.from(document.body.querySelectorAll(".mjr-tag-chip"));
    const chip = chips.find((element) => element.textContent.includes(tag));
    return chip ? chip.textContent.replace(/\s+/g, " ").trim() : null;
}

async function typeTag(wrapper, tag) {
    const input = wrapper.find("input.mjr-tag-input");
    input.setValue(tag);
    await input.trigger("keydown", { key: "Enter" });
    await flushAsync();
}

describe("updateAssetsTagsBulk client", () => {
    let fetchCalls;

    beforeEach(() => {
        vi.resetModules();
        fetchCalls = [];
        globalThis.fetch = vi.fn(async (url: any, init: any) => {
            fetchCalls.push({ url: String(url), body: JSON.parse(init?.body || "{}") });
            return {
                status: 200,
                headers: {
                    get: (name: any) => (name === "content-type" ? "application/json" : null),
                },
                json: async () => ({ ok: true, data: { updated_ids: [1], tags: { "1": ["x"] } } }),
            };
        }) as unknown as typeof fetch;
    });

    const bulkFetchCalls = () =>
        fetchCalls.filter((call) => call.url.includes("/mjr/am/assets/tags"));

    it("posts ids with add and remove to the batch endpoint", async () => {
        const client: any = await vi.importActual("../api/client.js");
        const result = await client.updateAssetsTagsBulk([1, "2", 2, "bad"], {
            add: ["x"],
            remove: ["y"],
        });

        expect(result.ok).toBe(true);
        expect(bulkFetchCalls()).toHaveLength(1);
        expect(bulkFetchCalls()[0].url).toContain("/mjr/am/assets/tags");
        expect(bulkFetchCalls()[0].body).toEqual({ ids: [1, 2], add: ["x"], remove: ["y"] });
    });

    it("skips the request when nothing would change", async () => {
        const client: any = await vi.importActual("../api/client.js");
        const result = await client.updateAssetsTagsBulk([1], {});

        expect(result.ok).toBe(false);
        expect(result.code).toBe("INVALID_INPUT");
        expect(fetchCalls).toHaveLength(0);
    });

    it("drops empty tags before sending", async () => {
        const client: any = await vi.importActual("../api/client.js");
        await client.updateAssetsTagsBulk([3], { add: ["  ", "ok"], remove: [""] });

        expect(bulkFetchCalls()[0].body).toEqual({ ids: [3], add: ["ok"], remove: [] });
    });
});

describe("BulkTagsEditor", () => {
    let wrappers = [];

    beforeEach(() => {
        vi.resetModules();
        document.body.innerHTML = "";
        apiMock.getAssetsBatch.mockReset();
        apiMock.updateAssetsTagsBulk.mockReset();
        toastMock.comfyToast.mockReset();
        eventsMock.safeDispatchCustomEvent.mockReset();
        wrappers = [];
    });

    afterEach(async () => {
        const contextMenu = await import("../features/contextmenu/gridContextMenuState.js");
        wrappers.forEach((wrapper) => wrapper.unmount());
        wrappers = [];
        resetGridContextState(contextMenu.gridContextMenuState, contextMenu);
        await nextTick();
        document.body.innerHTML = "";
    });

    it("shows the union of tags with per-tag coverage", async () => {
        apiMock.getAssetsBatch.mockImplementation(async (ids) => ({
            ok: true,
            data: ids.map((id) => ({
                id,
                tags: { 1: ["alpha", "beta"], 2: ["alpha"], 3: ["gamma"] }[id] || [],
            })),
        }));

        const wrapper = await mountBulkEditor([
            { id: 1, tags: [] },
            { id: 2, tags: [] },
            { id: 3, tags: [] },
        ]);
        wrappers.push(wrapper);

        expect(chipText("alpha")).toBe("alpha (2/3) x");
        expect(chipText("beta")).toBe("beta (1/3) x");
        expect(chipText("gamma")).toBe("gamma (1/3) x");
    });

    it("adds a typed tag to all assets and refreshes coverage from the response", async () => {
        apiMock.getAssetsBatch.mockResolvedValue({ ok: true, data: [] });
        apiMock.updateAssetsTagsBulk.mockResolvedValue(
            mockBulkResponse({
                updated_ids: [1, 2, 3],
                tags: { "1": ["x"], "2": ["x"], "3": ["x"] },
            }),
        );

        const assets = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const wrapper = await mountBulkEditor(assets);
        wrappers.push(wrapper);

        await typeTag(wrapper, "x");

        expect(apiMock.updateAssetsTagsBulk).toHaveBeenCalledTimes(1);
        expect(apiMock.updateAssetsTagsBulk.mock.calls[0][0]).toEqual([1, 2, 3]);
        expect(apiMock.updateAssetsTagsBulk.mock.calls[0][1]).toEqual({ add: ["x"], remove: [] });
        expect(eventsMock.safeDispatchCustomEvent).toHaveBeenCalledTimes(3);
        expect(eventsMock.safeDispatchCustomEvent).toHaveBeenCalledWith(
            "mjr:asset-tags-changed",
            { assetId: "1", tags: ["x"] },
            { warnPrefix: "[BulkTagsEditor]" },
        );
        expect(chipText("x")).toBe("x (3/3) x");
    });

    it("removes a tag from all assets via the chip remove button", async () => {
        apiMock.getAssetsBatch.mockImplementation(async (ids) => ({
            ok: true,
            data: ids.map((id) => ({ id, tags: ["gone"] })),
        }));
        apiMock.updateAssetsTagsBulk.mockResolvedValue(
            mockBulkResponse({ updated_ids: [1, 2], tags: { "1": [], "2": [] } }),
        );

        const wrapper = await mountBulkEditor([{ id: 1 }, { id: 2 }]);
        wrappers.push(wrapper);

        const remove = wrapper.find(".mjr-tag-chip-remove");
        await remove.trigger("click");
        await nextTick();
        await nextTick();

        expect(apiMock.updateAssetsTagsBulk).toHaveBeenCalledWith([1, 2], {
            add: [],
            remove: ["gone"],
        });
        expect(wrapper.vm.coverageEntries).toHaveLength(0);
    });

    it("clicking a partial tag adds it to the remaining assets", async () => {
        apiMock.getAssetsBatch.mockImplementation(async (ids) => ({
            ok: true,
            data: ids.map((id) => ({ id, tags: id === 1 ? ["partial"] : [] })),
        }));
        apiMock.updateAssetsTagsBulk.mockResolvedValue(
            mockBulkResponse({ updated_ids: [2, 3], tags: { "2": ["partial"], "3": ["partial"] } }),
        );

        const wrapper = await mountBulkEditor([{ id: 1 }, { id: 2 }, { id: 3 }]);
        wrappers.push(wrapper);

        const chips = wrapper.findAll(".mjr-tag-chip");
        const partial = chips.find((chip) => chip.text().includes("partial"));
        await partial.trigger("click");
        await flushAsync();

        expect(apiMock.updateAssetsTagsBulk).toHaveBeenCalledWith([1, 2, 3], {
            add: ["partial"],
            remove: [],
        });
    });

    it("typing a tag that exists at partial coverage adds it to the rest", async () => {
        apiMock.getAssetsBatch.mockImplementation(async (ids) => ({
            ok: true,
            data: ids.map((id) => ({ id, tags: id === 1 ? ["partial"] : [] })),
        }));
        apiMock.updateAssetsTagsBulk.mockResolvedValue(
            mockBulkResponse({ updated_ids: [2, 3], tags: { "2": ["partial"], "3": ["partial"] } }),
        );

        const wrapper = await mountBulkEditor([{ id: 1 }, { id: 2 }, { id: 3 }]);
        wrappers.push(wrapper);

        await typeTag(wrapper, "partial");

        expect(apiMock.updateAssetsTagsBulk).toHaveBeenCalledWith([1, 2, 3], {
            add: ["partial"],
            remove: [],
        });
        expect((wrapper.find("input.mjr-tag-input").element as HTMLInputElement).value).toBe("");
    });

    it("typing a tag that is already on every asset is a no-op without a request", async () => {
        apiMock.getAssetsBatch.mockImplementation(async (ids) => ({
            ok: true,
            data: ids.map((id) => ({ id, tags: ["everywhere"] })),
        }));

        const wrapper = await mountBulkEditor([{ id: 1 }, { id: 2 }]);
        wrappers.push(wrapper);

        await typeTag(wrapper, "everywhere");

        expect(apiMock.updateAssetsTagsBulk).not.toHaveBeenCalled();
        expect((wrapper.find("input.mjr-tag-input").element as HTMLInputElement).value).toBe(
            "everywhere",
        );
    });

    it("warns and keeps the input when a typed tag is invalid", async () => {
        apiMock.getAssetsBatch.mockResolvedValue({ ok: true, data: [] });

        const wrapper = await mountBulkEditor([{ id: 1 }]);
        wrappers.push(wrapper);

        await typeTag(wrapper, "x".repeat(120));

        expect(apiMock.updateAssetsTagsBulk).not.toHaveBeenCalled();
        const warning = toastMock.comfyToast.mock.calls.find(
            (call) => String(call[1]) === "warning",
        );
        expect(warning).toBeTruthy();
        expect((wrapper.find("input.mjr-tag-input").element as HTMLInputElement).value).toBe(
            "x".repeat(120),
        );
    });

    it("disables the input and chips while hydrating", async () => {
        let resolveHydration;
        apiMock.getAssetsBatch.mockReturnValue(
            new Promise((resolve) => {
                resolveHydration = resolve;
            }),
        );

        const { default: BulkTagsEditor } =
            await import("../vue/components/grid/BulkTagsEditor.vue");
        const wrapper = mount(BulkTagsEditor, {
            attachTo: document.body,
            props: { assets: [{ id: 1 }] },
            global: {
                stubs: { MButton: MButtonStub, MInputText: MInputTextStub },
            },
        });
        wrappers.push(wrapper);
        await nextTick();

        expect((wrapper.find("input.mjr-tag-input").element as HTMLInputElement).disabled).toBe(
            true,
        );
        expect(wrapper.find(".mjr-bulk-tags-editor").classes()).toContain("is-disabled");

        resolveHydration({ ok: true, data: [] });
        await flushAsync();

        expect((wrapper.find("input.mjr-tag-input").element as HTMLInputElement).disabled).toBe(
            false,
        );
        expect(wrapper.find(".mjr-bulk-tags-editor").classes()).not.toContain("is-disabled");
    });

    it("warns once when hydration fails and falls back to card tags", async () => {
        apiMock.getAssetsBatch.mockResolvedValue({ ok: false, error: "db down" });

        const wrapper = await mountBulkEditor([{ id: 1, tags: ["from-card"] }]);
        wrappers.push(wrapper);

        expect(chipText("from-card")).toBe("from-card (1/1) x");
        const warning = toastMock.comfyToast.mock.calls.find(
            (call) =>
                String(call[1]) === "warning" &&
                String(call[0]).includes("counts may be incomplete"),
        );
        expect(warning).toBeTruthy();
        expect(
            toastMock.comfyToast.mock.calls.filter((call) =>
                String(call[0]).includes("counts may be incomplete"),
            ),
        ).toHaveLength(1);
    });

    it("counts workflow and invalid-id skips separately in the toast", async () => {
        apiMock.getAssetsBatch.mockResolvedValue({ ok: true, data: [] });
        apiMock.updateAssetsTagsBulk.mockResolvedValue(
            mockBulkResponse({ updated_ids: [1], tags: { "1": ["x"] } }),
        );

        const wrapper = await mountBulkEditor([
            { id: 1 },
            { id: 2, kind: "workflow" },
            { filepath: "/no/id.png" },
        ]);
        wrappers.push(wrapper);

        await typeTag(wrapper, "x");

        expect(apiMock.updateAssetsTagsBulk.mock.calls[0][0]).toEqual([1]);
        const summary = toastMock.comfyToast.mock.calls
            .map((call) => String(call[0]))
            .find((text) => text.includes("skipped"));
        expect(summary).toContain("1 workflow");
        expect(summary).toContain("1 no id");
        expect(summary.startsWith(",")).toBe(false);
    });

    it("uses a standalone skip sentence when nothing was updated or failed", async () => {
        apiMock.getAssetsBatch.mockResolvedValue({ ok: true, data: [] });
        apiMock.updateAssetsTagsBulk.mockResolvedValue(
            mockBulkResponse({ unchanged_ids: [1], tags: { "1": [] } }),
        );

        const wrapper = await mountBulkEditor([{ id: 1 }, { id: 2, kind: "workflow" }]);
        wrappers.push(wrapper);

        await typeTag(wrapper, "x");

        const summary = toastMock.comfyToast.mock.calls
            .map((call) => String(call[0]))
            .find((text) => text.includes("workflow asset(s) skipped"));
        expect(summary).toBeTruthy();
        expect(summary.startsWith(",")).toBe(false);
    });

    it("sends chunked sequential calls for large selections with a progress toast", async () => {
        const ids = Array.from({ length: 1201 }, (_, index) => index + 1);
        apiMock.getAssetsBatch.mockResolvedValue({ ok: true, data: [] });
        apiMock.updateAssetsTagsBulk.mockResolvedValue(
            mockBulkResponse({
                updated_ids: [],
                unchanged_ids: ids,
                tags: Object.fromEntries(ids.map((id) => [String(id), ["x"]])),
            }),
        );

        const wrapper = await mountBulkEditor(ids.map((id) => ({ id })));
        wrappers.push(wrapper);

        await typeTag(wrapper, "x");

        expect(apiMock.updateAssetsTagsBulk).toHaveBeenCalledTimes(3);
        expect(apiMock.updateAssetsTagsBulk.mock.calls[0][0]).toHaveLength(500);
        expect(apiMock.updateAssetsTagsBulk.mock.calls[1][0]).toHaveLength(500);
        expect(apiMock.updateAssetsTagsBulk.mock.calls[2][0]).toHaveLength(201);
        const progress = toastMock.comfyToast.mock.calls.find(
            (call) => String(call[1]) === "info" && String(call[0]).includes("1201"),
        );
        expect(progress).toBeTruthy();
    });

    it("excludes workflow assets from the call and notes them in the toast", async () => {
        apiMock.getAssetsBatch.mockResolvedValue({ ok: true, data: [] });
        apiMock.updateAssetsTagsBulk.mockResolvedValue(
            mockBulkResponse({ updated_ids: [1], tags: { "1": ["x"] } }),
        );

        const wrapper = await mountBulkEditor([{ id: 1 }, { id: 2, kind: "workflow" }]);
        wrappers.push(wrapper);

        await typeTag(wrapper, "x");

        expect(apiMock.updateAssetsTagsBulk.mock.calls[0][0]).toEqual([1]);
        const summary = toastMock.comfyToast.mock.calls
            .map((call) => String(call[0]))
            .find((text) => text.includes("skipped"));
        expect(summary).toBeTruthy();
    });

    it("blocks new tags once the union reaches 50 entries", async () => {
        const manyTags = Array.from({ length: 50 }, (_, index) => `tag-${index}`);
        apiMock.getAssetsBatch.mockImplementation(async (ids) => ({
            ok: true,
            data: ids.map((id) => ({ id, tags: manyTags })),
        }));

        const wrapper = await mountBulkEditor([{ id: 1 }]);
        wrappers.push(wrapper);

        await typeTag(wrapper, "overflow");

        expect(apiMock.updateAssetsTagsBulk).not.toHaveBeenCalled();
        const warning = toastMock.comfyToast.mock.calls.find((call) =>
            String(call[0]).includes("Maximum number of tags reached"),
        );
        expect(warning).toBeTruthy();
        expect((wrapper.find("input.mjr-tag-input").element as HTMLInputElement).value).toBe(
            "overflow",
        );
    });
});

describe("GridContextMenu Edit tags selection gating", () => {
    function buildGridWithCard(asset) {
        const gridContainer = document.createElement("div");
        const card = document.createElement("div");
        card.className = "mjr-asset-card";
        (card as any)._mjrAsset = asset;
        gridContainer.appendChild(card);
        return { gridContainer, card };
    }

    async function openMenuFor(gridContainer, card, selectedAssets) {
        const contextMenu = await import("../features/contextmenu/gridContextMenuState.js");
        const { bindGridContextMenu } = await import("../features/contextmenu/GridContextMenu.js");

        gridContainer._mjrGetSelectedAssets = () => selectedAssets;
        gridContainer.dataset.mjrSelectedAssetIds = JSON.stringify(
            selectedAssets.map((entry) => String(entry.id)),
        );
        bindGridContextMenu({ gridContainer, getState: () => ({}) });

        card.dispatchEvent(
            new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                clientX: 10,
                clientY: 12,
            }),
        );
        await flushAsync();

        const editTagsItem = contextMenu.gridContextMenuState.main.items.find((item) =>
            String(item.label || "").startsWith("Edit tags"),
        );
        expect(editTagsItem).toBeTruthy();
        await editTagsItem.action();
        await flushAsync();
        return { contextMenu, editTagsItem };
    }

    beforeEach(() => {
        vi.resetModules();
        document.body.innerHTML = "";
        apiMock.getAssetsBatch.mockReset();
        apiMock.updateAssetsTagsBulk.mockReset();
        toastMock.comfyToast.mockReset();
        eventsMock.safeDispatchCustomEvent.mockReset();
    });

    afterEach(async () => {
        const contextMenu = await import("../features/contextmenu/gridContextMenuState.js");
        contextMenu.closeAllGridContextMenus();
        document.body.innerHTML = "";
    });

    it("right-clicking an unselected card opens the single-card editor for that card", async () => {
        const selection = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const outsider = { id: 4, tags: [] };
        const { gridContainer, card } = buildGridWithCard(outsider);

        const { contextMenu, editTagsItem } = await openMenuFor(gridContainer, card, selection);

        expect(editTagsItem.label).toBe("Edit tags");
        expect(contextMenu.gridContextMenuState.tags.assets).toBeNull();
        expect(contextMenu.gridContextMenuState.tags.asset).toEqual(outsider);
    });

    it("right-clicking a selected card with 3 selected opens the bulk editor", async () => {
        const selection = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const { gridContainer, card } = buildGridWithCard(selection[1]);

        const { contextMenu, editTagsItem } = await openMenuFor(gridContainer, card, selection);

        expect(editTagsItem.label).toBe("Edit tags (3 selected)");
        expect(contextMenu.gridContextMenuState.tags.assets).toEqual(selection);
        expect(contextMenu.gridContextMenuState.tags.open).toBe(true);
    });

    it("a single selected card keeps the single-card editor", async () => {
        const selection = [{ id: 7 }];
        const { gridContainer, card } = buildGridWithCard(selection[0]);

        const { contextMenu, editTagsItem } = await openMenuFor(gridContainer, card, selection);

        expect(editTagsItem.label).toBe("Edit tags");
        expect(contextMenu.gridContextMenuState.tags.assets).toBeNull();
        expect(contextMenu.gridContextMenuState.tags.asset).toEqual(selection[0]);
    });
});

describe("GridContextMenu bulk tags popover", () => {
    let wrappers = [];

    beforeEach(() => {
        vi.resetModules();
        document.body.innerHTML = "";
        window.innerWidth = 1280;
        window.innerHeight = 720;
        apiMock.getAssetsBatch.mockReset();
        apiMock.updateAssetsTagsBulk.mockReset();
        toastMock.comfyToast.mockReset();
        eventsMock.safeDispatchCustomEvent.mockReset();
        wrappers = [];
    });

    afterEach(async () => {
        const contextMenu = await import("../features/contextmenu/gridContextMenuState.js");
        wrappers.forEach((wrapper) => wrapper.unmount());
        wrappers = [];
        resetGridContextState(contextMenu.gridContextMenuState, contextMenu);
        await nextTick();
        document.body.innerHTML = "";
    });

    it("renders the bulk editor for a multi-asset selection and the single editor otherwise", async () => {
        const { default: GridContextMenu } =
            await import("../vue/components/grid/GridContextMenu.vue");
        const contextMenu = await import("../features/contextmenu/gridContextMenuState.js");

        const wrapper = mount(GridContextMenu, {
            attachTo: document.body,
            global: {
                stubs: { MButton: MButtonStub, MInputText: MInputTextStub, teleport: true },
            },
        });
        wrappers.push(wrapper);

        contextMenu.openGridTagsPopover({
            x: 30,
            y: 40,
            assets: [{ id: 1 }, { id: 2 }, { id: 3 }],
        });
        await nextTick();
        await nextTick();

        expect(document.body.querySelector(".mjr-bulk-tags-editor")).toBeTruthy();
        expect(document.body.querySelector(".single-tags-stub")).toBeNull();

        contextMenu.closeGridTagsPopover();
        contextMenu.openGridTagsPopover({
            x: 30,
            y: 40,
            asset: { id: 1, tags: [] },
        });
        await nextTick();
        await nextTick();

        expect(document.body.querySelector(".mjr-bulk-tags-editor")).toBeNull();
        expect(document.body.querySelector(".single-tags-stub")).toBeTruthy();
    });
});
