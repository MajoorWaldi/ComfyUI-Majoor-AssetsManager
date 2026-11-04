import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function makeApp(initialTabs: any[]) {
    const tabs = [...initialTabs];
    const extensionManager = {
        getSidebarTabs: vi.fn(() => [...tabs]),
        unregisterSidebarTab: vi.fn((id: string) => {
            const index = tabs.findIndex((tab) => tab.id === id);
            if (index >= 0) tabs.splice(index, 1);
        }),
        registerSidebarTab: vi.fn((tab: any) => {
            tabs.push(tab);
        }),
    };
    return { app: { extensionManager }, tabs, extensionManager };
}

describe("native assets tab coexistence", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    async function load(app: any) {
        const host = await import("../app/hostAdapter.js");
        host.init(app);
        return import("../features/runtime/nativeAssetsTab.js");
    }

    it("only recognises the core assets tab, never Majoor's or unrelated tabs", async () => {
        const mod = await load(makeApp([]).app);
        expect(mod.isNativeAssetsTab({ id: "assets" })).toBe(true);
        expect(mod.isNativeAssetsTab({ id: "majoor-assets" })).toBe(false);
        expect(mod.isNativeAssetsTab({ id: "queue" })).toBe(false);
        expect(mod.isNativeAssetsTab({ id: "node-library" })).toBe(false);
    });

    it("hides the native tab on opt-in and restores the same definition on opt-out", async () => {
        const native = { id: "assets", title: "Assets", type: "vue" };
        const { app, tabs } = makeApp([native, { id: "majoor-assets" }, { id: "queue" }]);
        const mod = await load(app);

        mod.setNativeAssetsTabHidden(true);
        expect(tabs.map((tab) => tab.id)).toEqual(["majoor-assets", "queue"]);
        expect(mod.getHiddenNativeAssetsTabIds()).toEqual(["assets"]);

        mod.setNativeAssetsTabHidden(false);
        expect(tabs).toContain(native);
        expect(mod.getHiddenNativeAssetsTabIds()).toEqual([]);
    });

    it("hides a native tab registered after setup thanks to delayed retries", async () => {
        const { app, tabs } = makeApp([{ id: "majoor-assets" }]);
        const mod = await load(app);

        mod.setNativeAssetsTabHidden(true);
        tabs.push({ id: "assets" });
        vi.advanceTimersByTime(600);
        expect(tabs.map((tab) => tab.id)).toEqual(["majoor-assets"]);

        mod.teardownNativeAssetsTab();
        expect(tabs.map((tab) => tab.id)).toContain("assets");
    });

    it("is a no-op on hosts without getSidebarTabs", async () => {
        const mod = await load({ extensionManager: {} });
        expect(() => mod.setNativeAssetsTabHidden(true)).not.toThrow();
        expect(mod.getHiddenNativeAssetsTabIds()).toEqual([]);
        mod.teardownNativeAssetsTab();
    });
});
