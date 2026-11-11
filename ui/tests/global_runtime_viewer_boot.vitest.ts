// @vitest-environment happy-dom

import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, onMounted, onUnmounted } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const opened = vi.hoisted(() => vi.fn());

vi.mock("../vue/composables/useDragDrop.js", () => ({ useDragDrop: () => {} }));
vi.mock("../vue/components/viewer/ViewerPortal.vue", async () => {
    const { EVENTS } = await import("../app/events.js");
    return {
        __esModule: true,
        default: defineComponent({
            emits: ["ready"],
            setup(_props, { emit }) {
                const listener = (e: Event) => {
                    opened((e as CustomEvent).detail);
                    (e as CustomEvent).detail.handled = true;
                };
                onMounted(() => {
                    window.addEventListener(EVENTS.OPEN_VIEWER, listener);
                    emit("ready");
                });
                onUnmounted(() => window.removeEventListener(EVENTS.OPEN_VIEWER, listener));
                return () => null;
            },
        }),
    };
});

describe("GlobalRuntime viewer boot", () => {
    beforeEach(() => {
        vi.resetModules();
        opened.mockReset();
    });

    it("delivers the first OPEN_VIEWER request to the freshly mounted viewer", async () => {
        const { EVENTS } = await import("../app/events.js");
        const { default: GlobalRuntime } = await import("../vue/GlobalRuntime.vue");
        const wrapper = mount(GlobalRuntime, { attachTo: document.body });

        const detail = { assets: [{ id: 1 }], index: 0, mode: "", handled: false };
        window.dispatchEvent(new CustomEvent(EVENTS.OPEN_VIEWER, { detail }));
        await flushPromises();

        expect(opened).toHaveBeenCalledTimes(1);
        expect(opened).toHaveBeenCalledWith(detail);
        expect(detail.handled).toBe(true);

        wrapper.unmount();
    });

    it("does not replay again once the viewer is running", async () => {
        const { EVENTS } = await import("../app/events.js");
        const { default: GlobalRuntime } = await import("../vue/GlobalRuntime.vue");
        const wrapper = mount(GlobalRuntime, { attachTo: document.body });

        window.dispatchEvent(
            new CustomEvent(EVENTS.OPEN_VIEWER, { detail: { assets: [{ id: 1 }] } }),
        );
        await flushPromises();
        window.dispatchEvent(
            new CustomEvent(EVENTS.OPEN_VIEWER, { detail: { assets: [{ id: 2 }] } }),
        );
        await flushPromises();

        expect(opened).toHaveBeenCalledTimes(2);
        wrapper.unmount();
    });
});
