// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick, defineComponent, h } from "vue";

function resetViewerContextMenuState(state) {
    state.portalOwnerId = "";
    state.mountedPortalIds.splice(0, state.mountedPortalIds.length);

    state.main.open = false;
    state.main.x = 0;
    state.main.y = 0;
    state.main.items = [];
    state.main.title = "";

    state.submenu.open = false;
    state.submenu.x = 0;
    state.submenu.y = 0;
    state.submenu.items = [];
    state.submenu.title = "";

    state.tags.open = false;
    state.tags.x = 0;
    state.tags.y = 0;
    state.tags.asset = null;
    state.tags.onChanged = null;
}

async function flushUi(cycles = 3) {
    for (let index = 0; index < cycles; index += 1) {
        await nextTick();
        await Promise.resolve();
    }
}

const viewerMenuStub = defineComponent({
    name: "ViewerContextMenu",
    render() {
        return h("div", { class: "viewer-context-menu-stub" });
    },
});

const overlayHostStub = defineComponent({
    name: "ViewerOverlayHost",
    render() {
        return h("div", { class: "viewer-overlay-host-stub" });
    },
});

const floatingHostStub = defineComponent({
    name: "FloatingViewerHost",
    render() {
        return h("div", { class: "floating-viewer-host-stub" });
    },
});

const contextMenuPortalStub = defineComponent({
    name: "ViewerContextMenuPortal",
    render() {
        return h("div", { class: "viewer-context-menu-portal-stub" });
    },
});

describe("viewer Vue components", () => {
    beforeEach(() => {
        vi.resetModules();
        document.body.innerHTML = "";
    });

    afterEach(() => {
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    it("registers the FloatingViewerHost.vue DOM host with the runtime host service", async () => {
        const registerFloatingViewerHost = vi.fn();
        const unregisterFloatingViewerHost = vi.fn();

        vi.doMock("../features/viewer/viewerRuntimeHosts.js", () => ({
            registerFloatingViewerHost,
            unregisterFloatingViewerHost,
        }));

        const { default: FloatingViewerHost } =
            await import("../vue/components/viewer/FloatingViewerHost.vue");

        const wrapper = mount(FloatingViewerHost, {
            attachTo: document.body,
        });

        expect(registerFloatingViewerHost).toHaveBeenCalledTimes(1);
        const hostNode = registerFloatingViewerHost.mock.calls[0][0];
        expect(hostNode).toBeInstanceOf(HTMLElement);
        expect(hostNode.classList.contains("mjr-viewer-runtime-host--floating")).toBe(true);

        wrapper.unmount();
    });

    it("registers the ViewerOverlayHost.vue DOM host with the runtime host service", async () => {
        const registerViewerOverlayHost = vi.fn();
        const unregisterViewerOverlayHost = vi.fn();

        vi.doMock("../features/viewer/viewerRuntimeHosts.js", () => ({
            registerViewerOverlayHost,
            unregisterViewerOverlayHost,
        }));

        const { default: ViewerOverlayHost } =
            await import("../vue/components/viewer/ViewerOverlayHost.vue");

        const wrapper = mount(ViewerOverlayHost, {
            attachTo: document.body,
        });

        expect(registerViewerOverlayHost).toHaveBeenCalledTimes(1);
        const hostNode = registerViewerOverlayHost.mock.calls[0][0];
        expect(hostNode).toBeInstanceOf(HTMLElement);
        expect(hostNode.classList.contains("mjr-viewer-runtime-host--main")).toBe(true);

        wrapper.unmount();
    });

    it("lets only the owning ViewerContextMenuPortal render the menu component", async () => {
        const { viewerContextMenuState } =
            await import("../features/contextmenu/viewerContextMenuState.js");
        resetViewerContextMenuState(viewerContextMenuState);

        const { default: ViewerContextMenuPortal } =
            await import("../vue/components/viewer/ViewerContextMenuPortal.vue");

        const first = mount(ViewerContextMenuPortal, {
            global: {
                stubs: {
                    ViewerContextMenu: viewerMenuStub,
                },
            },
        });
        const second = mount(ViewerContextMenuPortal, {
            global: {
                stubs: {
                    ViewerContextMenu: viewerMenuStub,
                },
            },
        });
        await flushUi();

        expect(first.find(".viewer-context-menu-stub").exists()).toBe(true);
        expect(second.find(".viewer-context-menu-stub").exists()).toBe(false);

        first.unmount();
        await flushUi();

        expect(second.find(".viewer-context-menu-stub").exists()).toBe(true);

        second.unmount();
        resetViewerContextMenuState(viewerContextMenuState);
    });

    it("pre-warms ViewerPortal.vue, wires the open-viewer event, and tears down on unmount", async () => {
        const instance = {
            open: vi.fn(),
            setMode: vi.fn(),
            dispose: vi.fn(),
        };
        const installFloatingViewerGlobalHandlers = vi.fn();
        const teardownFloatingViewerManager = vi.fn();
        const getViewerInstance = vi.fn(() => instance);

        vi.doMock("../components/Viewer.js", () => ({
            getViewerInstance,
        }));
        vi.doMock("../features/viewer/floatingViewerManager.js", () => ({
            installFloatingViewerGlobalHandlers,
            teardownFloatingViewerManager,
        }));

        const { EVENTS } = await import("../app/events.js");
        const { default: ViewerPortal } = await import("../vue/components/viewer/ViewerPortal.vue");

        const wrapper = mount(ViewerPortal, {
            global: {
                stubs: {
                    ViewerOverlayHost: overlayHostStub,
                    FloatingViewerHost: floatingHostStub,
                    ViewerContextMenuPortal: contextMenuPortalStub,
                },
            },
        });
        await flushUi();

        expect(installFloatingViewerGlobalHandlers).toHaveBeenCalledTimes(1);
        expect(getViewerInstance).toHaveBeenCalledTimes(1);
        expect(wrapper.find(".viewer-overlay-host-stub").exists()).toBe(true);
        expect(wrapper.find(".floating-viewer-host-stub").exists()).toBe(true);
        expect(wrapper.find(".viewer-context-menu-portal-stub").exists()).toBe(true);

        const assets = [{ id: 10 }, { id: 11 }];
        window.dispatchEvent(
            new CustomEvent(EVENTS.OPEN_VIEWER, {
                detail: {
                    assets,
                    index: 1,
                    mode: "ab",
                },
            }),
        );
        await flushUi(1);

        expect(instance.open).toHaveBeenCalledWith(assets, 1);
        expect(instance.setMode).toHaveBeenCalledWith("ab");

        wrapper.unmount();

        expect(teardownFloatingViewerManager).toHaveBeenCalledTimes(1);
        expect(instance.dispose).toHaveBeenCalledTimes(1);

        window.dispatchEvent(
            new CustomEvent(EVENTS.OPEN_VIEWER, {
                detail: { assets, index: 0 },
            }),
        );

        expect(instance.open).toHaveBeenCalledTimes(1);
    });

    it("renders ViewerContextMenu.vue through Teleport and closes the main menu after an action", async () => {
        const { default: ViewerContextMenu } =
            await import("../vue/components/viewer/ViewerContextMenu.vue");
        const { viewerContextMenuState } =
            await import("../features/contextmenu/viewerContextMenuState.js");
        resetViewerContextMenuState(viewerContextMenuState);

        const action = vi.fn();
        viewerContextMenuState.main.open = true;
        viewerContextMenuState.main.x = 20;
        viewerContextMenuState.main.y = 32;
        viewerContextMenuState.main.items = [
            {
                id: "open-asset",
                type: "item",
                label: "Open asset",
                action,
            },
        ];

        const wrapper = mount(ViewerContextMenu, {
            attachTo: document.body,
            global: {
                stubs: {
                    TagsEditor: true,
                },
            },
        });
        await flushUi();

        const menu = document.body.querySelector(".mjr-viewer-context-menu");
        expect(menu).toBeTruthy();
        expect(menu.textContent).toContain("Open asset");

        document.body
            .querySelector(".mjr-context-menu-item")
            ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await flushUi();

        expect(action).toHaveBeenCalledTimes(1);
        expect(viewerContextMenuState.main.open).toBe(false);

        wrapper.unmount();
        resetViewerContextMenuState(viewerContextMenuState);
    });

    it("opens the ViewerContextMenu submenu on hover for submenu items", async () => {
        const { default: ViewerContextMenu } =
            await import("../vue/components/viewer/ViewerContextMenu.vue");
        const { viewerContextMenuState } =
            await import("../features/contextmenu/viewerContextMenuState.js");
        resetViewerContextMenuState(viewerContextMenuState);

        viewerContextMenuState.main.open = true;
        viewerContextMenuState.main.x = 48;
        viewerContextMenuState.main.y = 64;
        viewerContextMenuState.main.items = [
            {
                id: "rating",
                type: "item",
                label: "Rating",
                submenu: [
                    {
                        id: "rating-5",
                        type: "item",
                        label: "5 stars",
                        action: vi.fn(),
                    },
                ],
            },
        ];

        const wrapper = mount(ViewerContextMenu, {
            attachTo: document.body,
            global: {
                stubs: {
                    TagsEditor: true,
                },
            },
        });
        await flushUi();

        document.body
            .querySelector(".mjr-context-menu-item")
            ?.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
        await flushUi();

        expect(viewerContextMenuState.submenu.open).toBe(true);
        expect(
            document.body.querySelector(".mjr-viewer-rating-submenu")?.textContent || "",
        ).toContain("5 stars");

        wrapper.unmount();
        resetViewerContextMenuState(viewerContextMenuState);
    });
});
