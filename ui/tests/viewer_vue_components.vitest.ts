// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick, defineComponent, h } from "vue";

async function flushUi(cycles = 3) {
    for (let index = 0; index < cycles; index += 1) {
        await nextTick();
        await Promise.resolve();
    }
}

const studioViewerStub = defineComponent({
    name: "StudioViewer",
    render() {
        return h("div", { class: "studio-viewer-stub" });
    },
});

const floatingHostStub = defineComponent({
    name: "FloatingViewerHost",
    render() {
        return h("div", { class: "floating-viewer-host-stub" });
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

    it("wires ViewerPortal.vue to the open-viewer event and tears down on unmount", async () => {
        const installFloatingViewerGlobalHandlers = vi.fn();
        const teardownFloatingViewerManager = vi.fn();

        vi.doMock("../features/viewer/floatingViewerManager.js", () => ({
            installFloatingViewerGlobalHandlers,
            teardownFloatingViewerManager,
        }));

        const { EVENTS } = await import("../app/events.js");
        const { studioViewerState, closeStudioViewer } =
            await import("../features/viewer/studio/studioViewerState.js");
        const { default: ViewerPortal } = await import("../vue/components/viewer/ViewerPortal.vue");

        const wrapper = mount(ViewerPortal, {
            global: {
                stubs: {
                    StudioViewer: studioViewerStub,
                    FloatingViewerHost: floatingHostStub,
                },
            },
        });
        await flushUi();

        expect(installFloatingViewerGlobalHandlers).toHaveBeenCalledTimes(1);
        expect(wrapper.find(".studio-viewer-stub").exists()).toBe(true);
        expect(wrapper.find(".floating-viewer-host-stub").exists()).toBe(true);

        const assets = [{ id: 10 }, { id: 11 }];
        const detail: any = { assets, index: 1, mode: "ab" };
        window.dispatchEvent(new CustomEvent(EVENTS.OPEN_VIEWER, { detail }));
        await flushUi(1);

        // Every open request (compare modes included) goes to the Studio viewer.
        expect(detail.handled).toBe(true);
        expect(studioViewerState.open).toBe(true);
        expect(studioViewerState.index).toBe(1);
        expect(studioViewerState.compare).toBe("wipe");
        closeStudioViewer();

        wrapper.unmount();
        expect(teardownFloatingViewerManager).toHaveBeenCalledTimes(1);

        const late: any = { assets, index: 0 };
        window.dispatchEvent(new CustomEvent(EVENTS.OPEN_VIEWER, { detail: late }));
        expect(late.handled).toBeUndefined();
        expect(studioViewerState.open).toBe(false);
    });
});
