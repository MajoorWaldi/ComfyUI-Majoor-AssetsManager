import { describe, expect, it, vi, beforeEach } from "vitest";

const keyboardState = vi.hoisted(() => ({
    installGridKeyboard: vi.fn(),
}));

vi.mock("../features/grid/GridKeyboard.js", () => ({
    installGridKeyboard: keyboardState.installGridKeyboard,
}));

describe("useGridKeyboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("binds the legacy keyboard with grid-owned accessors", async () => {
        const keyboard = {
            bind: vi.fn(),
            dispose: vi.fn(),
        };
        keyboardState.installGridKeyboard.mockReturnValue(keyboard);

        const { bindLegacyGridKeyboard } = await import("../vue/composables/useGridKeyboard.js");

        const container = {
            _mjrGetGridState: vi.fn(() => ({ assets: [{ id: 1 }] })),
            _mjrGetSelectedAssets: vi.fn(() => [{ id: 1 }]),
            _mjrGetActiveAsset: vi.fn(() => ({ id: 1 })),
            _mjrOnKeyboardAssetChanged: vi.fn(),
            _mjrOpenKeyboardDetails: vi.fn(),
        };

        const dispose = bindLegacyGridKeyboard(container);

        expect(keyboardState.installGridKeyboard).toHaveBeenCalledWith(
            expect.objectContaining({
                gridContainer: container,
                getState: expect.any(Function),
                getSelectedAssets: expect.any(Function),
                getActiveAsset: expect.any(Function),
                onAssetChanged: expect.any(Function),
                onOpenDetails: expect.any(Function),
            }),
        );
        expect(keyboard.bind).toHaveBeenCalledTimes(1);
        expect(container._mjrGridKeyboard).toBe(keyboard);

        const options = keyboardState.installGridKeyboard.mock.calls[0][0];
        expect(options.getState()).toEqual({ assets: [{ id: 1 }] });
        expect(options.getSelectedAssets()).toEqual([{ id: 1 }]);
        expect(options.getActiveAsset()).toEqual({ id: 1 });
        options.onAssetChanged({ id: 1, rating: 5 });
        options.onOpenDetails();

        expect(container._mjrOnKeyboardAssetChanged).toHaveBeenCalledWith({
            id: 1,
            rating: 5,
        });
        expect(container._mjrOpenKeyboardDetails).toHaveBeenCalledTimes(1);

        dispose();

        expect(keyboard.dispose).toHaveBeenCalledTimes(1);
        expect(container._mjrGridKeyboard).toBeNull();
    });
});
