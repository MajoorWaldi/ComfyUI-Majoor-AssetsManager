// @vitest-environment happy-dom

import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../vue/components/common/TagsEditor.vue", () => ({
    default: defineComponent({
        name: "MockTagsEditor",
        props: {
            asset: { type: Object, default: null },
            modelValue: { type: Array, default: () => [] },
        },
        emits: ["update:modelValue", "tags-change"],
        setup(_props, { emit }) {
            return () =>
                h(
                    "button",
                    {
                        type: "button",
                        class: "mock-tags-editor-apply",
                        onClick: () => {
                            emit("update:modelValue", ["updated-tag"]);
                            emit("tags-change", { tags: ["updated-tag"] });
                        },
                    },
                    "Apply tags",
                );
        },
    }),
}));

function ensureCustomEvent() {
    if (typeof globalThis.CustomEvent === "function") return;
    globalThis.CustomEvent = class CustomEvent extends Event {
        constructor(type, init = {}) {
            super(type, init);
            this.detail = init.detail;
        }
    };
}

function resetViewerContextState(state, helpers) {
    helpers.closeAllViewerContextMenus();
    state.portalOwnerId = "";
    state.mountedPortalIds.splice(0, state.mountedPortalIds.length);
    state.main.items = [];
    state.main.title = "";
    state.submenu.items = [];
    state.submenu.title = "";
}

async function click(selector) {
    const element = document.body.querySelector(selector);
    expect(element).toBeTruthy();
    element.click();
    await nextTick();
}

function mountViewerContextMenu(component) {
    return mount(component, {
        attachTo: document.body,
        global: {
            stubs: {
                teleport: true,
            },
        },
    });
}

describe("ViewerContextMenu.vue", () => {
    let wrappers = [];

    beforeEach(() => {
        vi.resetModules();
        ensureCustomEvent();
        document.body.innerHTML = "";
        window.innerWidth = 1280;
        window.innerHeight = 720;
        wrappers = [];
    });

    afterEach(async () => {
        const contextMenu = await import("../features/contextmenu/viewerContextMenuState.js");
        wrappers.forEach((wrapper) => wrapper.unmount());
        wrappers = [];
        resetViewerContextState(contextMenu.viewerContextMenuState, contextMenu);
        await nextTick();
        document.body.innerHTML = "";
    });

    it("renders the main viewer menu, runs the action, and closes it on click", async () => {
        const { default: ViewerContextMenu } =
            await import("../vue/components/viewer/ViewerContextMenu.vue");
        const contextMenu = await import("../features/contextmenu/viewerContextMenuState.js");

        resetViewerContextState(contextMenu.viewerContextMenuState, contextMenu);

        const action = vi.fn();
        const wrapper = mountViewerContextMenu(ViewerContextMenu);
        wrappers.push(wrapper);

        contextMenu.openViewerContextMenu({
            x: 48,
            y: 64,
            items: [{ id: "copy", type: "item", label: "Copy", action }],
        });
        await nextTick();

        const menu = document.body.querySelector('[aria-label="Viewer context menu"]');
        expect(menu).toBeTruthy();
        expect(menu.textContent).toContain("Copy");

        await click(".mjr-context-menu-item");

        expect(action).toHaveBeenCalledTimes(1);
        expect(contextMenu.viewerContextMenuState.main.open).toBe(false);
        expect(document.body.querySelector('[aria-label="Viewer context menu"]')).toBeNull();
    });

    it("opens the submenu when a menu item with children is selected", async () => {
        const { default: ViewerContextMenu } =
            await import("../vue/components/viewer/ViewerContextMenu.vue");
        const contextMenu = await import("../features/contextmenu/viewerContextMenuState.js");

        resetViewerContextState(contextMenu.viewerContextMenuState, contextMenu);

        wrappers.push(mountViewerContextMenu(ViewerContextMenu));

        contextMenu.openViewerContextMenu({
            x: 12,
            y: 18,
            items: [
                {
                    id: "rating",
                    type: "item",
                    label: "Rating",
                    submenu: [{ id: "five", type: "item", label: "5 stars" }],
                },
            ],
        });
        await nextTick();

        await click(".mjr-context-menu-item");

        const submenu = document.body.querySelector('[aria-label="Viewer context submenu"]');
        expect(submenu).toBeTruthy();
        expect(contextMenu.viewerContextMenuState.submenu.open).toBe(true);
        expect(submenu.textContent).toContain("5 stars");
    });

    it("updates tag state and calls the change callback through the tags popover", async () => {
        const { default: ViewerContextMenu } =
            await import("../vue/components/viewer/ViewerContextMenu.vue");
        const contextMenu = await import("../features/contextmenu/viewerContextMenuState.js");

        resetViewerContextState(contextMenu.viewerContextMenuState, contextMenu);

        const asset = { id: 11, tags: ["before"] };
        const onChanged = vi.fn();
        wrappers.push(mountViewerContextMenu(ViewerContextMenu));

        contextMenu.openViewerTagsPopover({
            x: 22,
            y: 36,
            asset,
            onChanged,
        });
        await nextTick();

        await click(".mock-tags-editor-apply");

        expect(asset.tags).toEqual(["updated-tag"]);
        expect(onChanged).toHaveBeenCalledWith(["updated-tag"]);
    });
});
