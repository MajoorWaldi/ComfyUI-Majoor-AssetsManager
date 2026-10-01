import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/client.js", () => ({ get: vi.fn() }));
vi.mock("../api/endpoints.js", () => ({ ENDPOINTS: { HEALTH_COUNTERS: "/api/health/counters" } }));
vi.mock("../app/toast.js", () => ({ comfyToast: vi.fn() }));
vi.mock("../app/i18n.js", () => ({ t: (_key: string, fallback: string) => fallback }));

class FakeElement extends EventTarget {
    dataset: Record<string, string> = { mjrQuery: "*" };
    isConnected = true;
    clientWidth = 320;
    clientHeight = 240;
    scrollTop = 0;
    getClientRects = () => [{ width: 320, height: 240 }];
    querySelector = () => null;
}

/** Mirrors panelRuntime: a debounced request that drains into the shared controller. */
function createRequestQueuedReload(controller: any) {
    let timer: any = null;
    return () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            controller.queuedReload().catch(() => {});
        }, 120);
    };
}

async function mountReloadWiring() {
    const { createAssetsQueryController } = await import("../vue/composables/useAssetsQuery.js");
    const { bindGridEvents } = await import("../features/panel/panelGridEventBindings.js");

    const gridContainer = new FakeElement();
    const gridWrapper = new FakeElement();
    const lifecycle = new AbortController();
    const reloadGrid = vi.fn(() => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 300)));
    const gridController = { reloadGrid };

    const controller = createAssetsQueryController({
        gridContainer,
        gridWrapper,
        gridController,
        captureAnchor: () => null,
        restoreAnchor: async () => {},
        lifecycleSignal: lifecycle.signal,
    });
    bindGridEvents({
        gridContainer,
        panelLifecycleAC: lifecycle,
        requestQueuedReload: createRequestQueuedReload(controller),
        notifyContextChanged: () => {},
        markUserInteraction: () => {},
        writePanelValue: () => {},
        popovers: { close: () => {} },
        collectionsPopover: null,
        gridController,
        registerSummaryDispose: () => {},
    });
    return { gridContainer, reloadGrid, lifecycle };
}

describe("mjr:reload-grid", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        (globalThis as any).window = new EventTarget();
        (globalThis as any).CustomEvent =
            (globalThis as any).CustomEvent ||
            class extends Event {
                detail: any;
                constructor(type: string, init: any = {}) {
                    super(type);
                    this.detail = init.detail;
                }
            };
    });

    afterEach(() => {
        vi.useRealTimers();
        delete (globalThis as any).window;
    });

    it("reloads the grid once for a single global request", async () => {
        const { reloadGrid, lifecycle } = await mountReloadWiring();

        window.dispatchEvent(new CustomEvent("mjr:reload-grid", { detail: { reason: "core-execution-assets-ready" } }));
        await vi.advanceTimersByTimeAsync(2000);

        expect(reloadGrid).toHaveBeenCalledTimes(1);
        lifecycle.abort();
    });

    it("does not reload while maintenance is active", async () => {
        const { reloadGrid, lifecycle } = await mountReloadWiring();
        (globalThis as any)._mjrMaintenanceActive = true;

        window.dispatchEvent(new CustomEvent("mjr:reload-grid", { detail: { reason: "scan" } }));
        await vi.advanceTimersByTimeAsync(2000);

        expect(reloadGrid).not.toHaveBeenCalled();
        delete (globalThis as any)._mjrMaintenanceActive;
        lifecycle.abort();
    });

    it("still reloads once for an event dispatched on the grid element itself", async () => {
        const { gridContainer, reloadGrid, lifecycle } = await mountReloadWiring();

        gridContainer.dispatchEvent(new CustomEvent("mjr:reload-grid"));
        await vi.advanceTimersByTimeAsync(2000);

        expect(reloadGrid).toHaveBeenCalledTimes(1);
        lifecycle.abort();
    });
});
