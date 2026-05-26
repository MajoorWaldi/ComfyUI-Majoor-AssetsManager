// @vitest-environment happy-dom

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const runtimeHostsMock = vi.hoisted(() => ({
    registerFloatingViewerHost: vi.fn(),
    unregisterFloatingViewerHost: vi.fn(),
    registerViewerOverlayHost: vi.fn(),
    unregisterViewerOverlayHost: vi.fn(),
}));

vi.mock("../features/viewer/viewerRuntimeHosts.js", () => ({
    registerFloatingViewerHost: runtimeHostsMock.registerFloatingViewerHost,
    unregisterFloatingViewerHost: runtimeHostsMock.unregisterFloatingViewerHost,
    registerViewerOverlayHost: runtimeHostsMock.registerViewerOverlayHost,
    unregisterViewerOverlayHost: runtimeHostsMock.unregisterViewerOverlayHost,
}));

describe("viewer Vue host components", () => {
    beforeEach(() => {
        vi.resetModules();
        document.body.innerHTML = "";
        Object.values(runtimeHostsMock).forEach((mockFn) => mockFn.mockReset());
        runtimeHostsMock.registerFloatingViewerHost.mockImplementation(
            (host) => () => runtimeHostsMock.unregisterFloatingViewerHost(host),
        );
        runtimeHostsMock.registerViewerOverlayHost.mockImplementation(
            (host) => () => runtimeHostsMock.unregisterViewerOverlayHost(host),
        );
    });

    it("registers and unregisters the floating viewer host with the rendered element", async () => {
        const { default: FloatingViewerHost } =
            await import("../vue/components/viewer/FloatingViewerHost.vue");

        const wrapper = mount(FloatingViewerHost, {
            attachTo: document.body,
        });

        const hostElement = wrapper.element;
        expect(hostElement.className).toContain("mjr-viewer-runtime-host");
        expect(hostElement.className).toContain("mjr-viewer-runtime-host--floating");
        expect(hostElement.getAttribute("style")).toContain("position: fixed");
        expect(runtimeHostsMock.registerFloatingViewerHost).toHaveBeenCalledWith(hostElement);

        wrapper.unmount();

        expect(runtimeHostsMock.unregisterFloatingViewerHost).toHaveBeenCalledOnce();
        expect(runtimeHostsMock.unregisterFloatingViewerHost).toHaveBeenCalledWith(hostElement);
    });

    it("registers and unregisters the main viewer overlay host with the rendered element", async () => {
        const { default: ViewerOverlayHost } =
            await import("../vue/components/viewer/ViewerOverlayHost.vue");

        const wrapper = mount(ViewerOverlayHost, {
            attachTo: document.body,
        });

        const hostElement = wrapper.element;
        expect(hostElement.className).toContain("mjr-viewer-runtime-host");
        expect(hostElement.className).toContain("mjr-viewer-runtime-host--main");
        expect(hostElement.getAttribute("style")).toContain("pointer-events: none");
        expect(runtimeHostsMock.registerViewerOverlayHost).toHaveBeenCalledWith(hostElement);

        wrapper.unmount();

        expect(runtimeHostsMock.unregisterViewerOverlayHost).toHaveBeenCalledOnce();
        expect(runtimeHostsMock.unregisterViewerOverlayHost).toHaveBeenCalledWith(hostElement);
    });
});
