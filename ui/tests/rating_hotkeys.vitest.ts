// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRatingHotkeysController } from "../features/panel/controllers/ratingHotkeysController.js";

const updateRating = vi.hoisted(() => vi.fn().mockResolvedValue({ ok: true }));
vi.mock("../api/client.js", () => ({ updateAssetRating: updateRating }));
vi.mock("../app/toast.js", () => ({ comfyToast: vi.fn() }));
vi.mock("../app/i18n.js", () => ({ t: (key) => key }));
vi.mock("../features/panel/controllers/hotkeysState.js", () => ({
    getHotkeysState: () => ({ scope: "panel" }),
    isHotkeysSuspended: () => false,
    setRatingHotkeysActive: vi.fn(),
}));
vi.mock("../features/grid/GridSelectionManager.js", () => ({ getSelectedIdSet: () => new Set(["42"]) }));

let controller: ReturnType<typeof createRatingHotkeysController>;
beforeEach(() => {
    updateRating.mockClear();
    document.body.innerHTML = '<div class="mjr-mfv is-visible"></div><div id="grid"></div>';
    controller = createRatingHotkeysController({ gridContainer: document.querySelector("#grid") });
    controller.bind();
});
afterEach(() => { controller.dispose(); document.body.innerHTML = ""; });

describe("rating hotkeys with floating viewer visible", () => {
    it.each(["input", "textarea", "select", "contenteditable"])("leaves numpad digits to %s fields outside the viewer", (tag) => {
        const input = document.createElement(tag === "contenteditable" ? "div" : tag);
        if (tag === "contenteditable") input.setAttribute("contenteditable", "true");
        document.body.appendChild(input);
        input.focus();
        for (let digit = 0; digit <= 5; digit++) {
            const event = new KeyboardEvent("keydown", { key: String(digit), code: `Numpad${digit}`, bubbles: true, cancelable: true });
            input.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(false);
        }
        expect(updateRating).not.toHaveBeenCalled();
    });
    it("still rates selected assets when no field is being edited", () => {
        const event = new KeyboardEvent("keydown", { key: "3", code: "Numpad3", bubbles: true, cancelable: true });
        document.body.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(updateRating).toHaveBeenCalledWith("42", 3);
    });
});
