import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const dndState = vi.hoisted(() => ({
    installDragDropRuntime: vi.fn(),
    teardownDragDropRuntime: vi.fn(),
}));

vi.mock("../features/dnd/DragDrop.js", () => ({
    installDragDropRuntime: dndState.installDragDropRuntime,
    teardownDragDropRuntime: dndState.teardownDragDropRuntime,
}));

let mountHooks = [];
let unmountHooks = [];

vi.mock("vue", () => ({
    onMounted: (fn) => mountHooks.push(fn),
    onUnmounted: (fn) => unmountHooks.push(fn),
}));

describe("useDragDrop", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mountHooks = [];
        unmountHooks = [];
    });

    it("installs DnD runtime on mount", async () => {
        dndState.installDragDropRuntime.mockReturnValue(null);
        const { useDragDrop } = await import("../vue/composables/useDragDrop.js");
        useDragDrop();

        expect(mountHooks).toHaveLength(1);
        mountHooks[0]();
        expect(dndState.installDragDropRuntime).toHaveBeenCalledTimes(1);
    });

    it("calls dispose and teardown on unmount", async () => {
        const dispose = vi.fn();
        dndState.installDragDropRuntime.mockReturnValue(dispose);
        const { useDragDrop } = await import("../vue/composables/useDragDrop.js");
        useDragDrop();

        mountHooks[0]();
        unmountHooks[0]();

        expect(dispose).toHaveBeenCalledWith({ force: true });
        expect(dndState.teardownDragDropRuntime).toHaveBeenCalledWith({ force: true });
    });

    it("survives install failure gracefully", async () => {
        dndState.installDragDropRuntime.mockImplementation(() => {
            throw new Error("boom");
        });
        const { useDragDrop } = await import("../vue/composables/useDragDrop.js");
        useDragDrop();

        expect(() => mountHooks[0]()).not.toThrow();
    });

    it("survives teardown failure gracefully", async () => {
        dndState.installDragDropRuntime.mockReturnValue(() => {
            throw new Error("dispose fail");
        });
        dndState.teardownDragDropRuntime.mockImplementation(() => {
            throw new Error("teardown fail");
        });
        const { useDragDrop } = await import("../vue/composables/useDragDrop.js");
        useDragDrop();

        mountHooks[0]();
        expect(() => unmountHooks[0]()).not.toThrow();
    });

    it("handles null dispose return", async () => {
        dndState.installDragDropRuntime.mockReturnValue(undefined);
        const { useDragDrop } = await import("../vue/composables/useDragDrop.js");
        useDragDrop();

        mountHooks[0]();
        expect(() => unmountHooks[0]()).not.toThrow();
        expect(dndState.teardownDragDropRuntime).toHaveBeenCalledTimes(1);
    });
});
