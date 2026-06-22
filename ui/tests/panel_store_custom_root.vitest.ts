import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("../api/client.js", () => ({
    get: vi.fn(async () => ({ ok: true, data: [{ id: "root-a", label: "Root A" }] })),
}));

describe("usePanelStore validatePersistedCustomRoot", () => {
    beforeEach(() => {
        vi.resetModules();
        setActivePinia(createPinia());
        globalThis.localStorage = {
            getItem: vi.fn(() => null),
            setItem: vi.fn(),
            removeItem: vi.fn(),
        } as any;
        globalThis.window = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        } as any;
    });

    it("clears stale custom root and falls back to output scope", async () => {
        const { usePanelStore } = await import("../stores/usePanelStore.js");
        const store = usePanelStore();
        store.scope = "custom";
        store.customRootId = "stale-root";
        store.customRootLabel = "Stale";
        store.currentFolderRelativePath = "old";

        await store.validatePersistedCustomRoot();

        expect(store.customRootId).toBe("");
        expect(store.customRootLabel).toBe("");
        expect(store.scope).toBe("output");
        expect(store.currentFolderRelativePath).toBe("");
    });
});
