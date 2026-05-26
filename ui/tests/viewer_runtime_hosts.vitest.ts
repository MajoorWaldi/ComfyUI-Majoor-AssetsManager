import { beforeEach, describe, expect, it, vi } from "vitest";

describe("viewerRuntimeHosts", () => {
    beforeEach(() => {
        vi.resetModules();
        globalThis.document = {
            body: {
                appendChild: vi.fn(),
                querySelectorAll: vi.fn(() => []),
                isConnected: true,
            },
            documentElement: {
                appendChild: vi.fn(),
                querySelectorAll: vi.fn(() => []),
                isConnected: true,
            },
        };
    });

    it("appends the floating viewer to document.body even when a Vue host is registered", async () => {
        const host = {
            appendChild: vi.fn(),
            querySelectorAll: vi.fn(() => []),
            isConnected: true,
        };
        const node = { parentNode: null };

        const { registerFloatingViewerHost, appendFloatingViewerNode } =
            await import("../features/viewer/viewerRuntimeHosts.js");

        registerFloatingViewerHost(host);
        appendFloatingViewerNode(node);

        expect(document.body.appendChild).toHaveBeenCalledWith(node);
        expect(host.appendChild).not.toHaveBeenCalledWith(node);
    });

    it("falls back to documentElement before the registered host when document.body is unavailable", async () => {
        document.body = null;
        const host = {
            appendChild: vi.fn(),
            querySelectorAll: vi.fn(() => []),
            isConnected: true,
        };
        const node = { parentNode: null };

        const { registerFloatingViewerHost, appendFloatingViewerNode } =
            await import("../features/viewer/viewerRuntimeHosts.js");

        registerFloatingViewerHost(host);
        appendFloatingViewerNode(node);

        expect(document.documentElement.appendChild).toHaveBeenCalledWith(node);
        expect(host.appendChild).not.toHaveBeenCalledWith(node);
    });
});
