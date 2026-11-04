// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRatingHotkeysController } from "../features/panel/controllers/ratingHotkeysController.js";
import { comfyToast } from "../app/toast.js";

const interpolateT = (key: any, defOrParams?: any, params?: any) => {
    let text = typeof defOrParams === "string" ? defOrParams : String(key ?? "");
    const p =
        (typeof defOrParams === "object" && defOrParams !== null ? defOrParams : params) || {};
    for (const [k, v] of Object.entries(p)) text = text.replaceAll(`{${k}}`, String(v));
    return text;
};

const updateRating = vi.hoisted(() => vi.fn().mockResolvedValue({ ok: true }));
const updateRatingBulk = vi.hoisted(() =>
    vi.fn().mockResolvedValue({ ok: true, data: { updated_ids: [], failed: [] } }),
);
const selectionState = vi.hoisted(() => ({ ids: new Set(["42"]) }));
vi.mock("../api/client.js", () => ({
    updateAssetRating: updateRating,
    updateAssetsRatingBulk: updateRatingBulk,
}));
vi.mock("../app/toast.js", () => ({ comfyToast: vi.fn() }));
vi.mock("../app/i18n.js", () => ({
    t: (key: any, defOrParams?: any, params?: any) => interpolateT(key, defOrParams, params),
}));
vi.mock("../features/panel/controllers/hotkeysState.js", () => ({
    getHotkeysState: () => ({ scope: "panel" }),
    isHotkeysSuspended: () => false,
    setRatingHotkeysActive: vi.fn(),
}));
vi.mock("../features/grid/GridSelectionManager.js", () => ({
    getSelectedIdSet: () => selectionState.ids,
}));

let controller: ReturnType<typeof createRatingHotkeysController>;
beforeEach(() => {
    updateRating.mockClear();
    updateRatingBulk.mockReset();
    updateRatingBulk.mockResolvedValue({ ok: true, data: { updated_ids: [], failed: [] } });
    vi.mocked(comfyToast).mockClear();
    selectionState.ids = new Set(["42"]);
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

describe("rating hotkeys bulk selection", () => {
    const pressKey = (key: string) => {
        const event = new KeyboardEvent("keydown", {
            key,
            code: `Numpad${key}`,
            bubbles: true,
            cancelable: true,
        });
        document.body.dispatchEvent(event);
        return event;
    };

    it("rates a multi-card selection in one batch call without per-asset calls", async () => {
        selectionState.ids = new Set(["1", "2", "3"]);
        const event = pressKey("4");
        expect(event.defaultPrevented).toBe(true);
        await vi.waitFor(() => expect(updateRatingBulk).toHaveBeenCalledTimes(1));
        expect(updateRatingBulk).toHaveBeenCalledWith(["1", "2", "3"], 4);
        expect(updateRating).not.toHaveBeenCalled();
    });

    it("dispatches one rating-changed event per updated id", async () => {
        selectionState.ids = new Set(["1", "2", "3"]);
        updateRatingBulk.mockResolvedValue({
            ok: true,
            data: { updated_ids: [1, 2, 3], failed: [] },
        });
        const events: any[] = [];
        const onEvent = (ev: any) => events.push(ev.detail);
        window.addEventListener("mjr:asset-rating-changed", onEvent);
        pressKey("4");
        await vi.waitFor(() => expect(events).toHaveLength(3));
        expect(events.map((d) => d.assetId).sort()).toEqual(["1", "2", "3"]);
        expect(events.every((d) => d.rating === 4)).toBe(true);
        window.removeEventListener("mjr:asset-rating-changed", onEvent);
    });

    it("keeps the per-asset path for a single selected card", async () => {
        selectionState.ids = new Set(["42"]);
        pressKey("3");
        await vi.waitFor(() => expect(updateRating).toHaveBeenCalledTimes(1));
        expect(updateRating).toHaveBeenCalledWith("42", 3);
        expect(updateRatingBulk).not.toHaveBeenCalled();
    });

    it("chunks 1201 selected ids into sequential batch calls with a progress toast", async () => {
        const ids = Array.from({ length: 1201 }, (_v, i) => String(i + 1));
        selectionState.ids = new Set(ids);
        pressKey("2");
        await vi.waitFor(() => expect(updateRatingBulk).toHaveBeenCalledTimes(3));
        const sizes = updateRatingBulk.mock.calls.map((call: any[]) => call[0].length);
        expect(sizes).toEqual([500, 500, 201]);
        expect(updateRatingBulk.mock.calls.every((call: any[]) => call[1] === 2)).toBe(true);
        expect(
            vi
                .mocked(comfyToast)
                .mock.calls.some(
                    (call: any[]) =>
                        String(call[0]).includes("1201") && String(call[0]).includes("500"),
                ),
        ).toBe(true);
    });

    it("shows a partial summary toast and events only for updated ids", async () => {
        selectionState.ids = new Set(["1", "2", "3"]);
        updateRatingBulk.mockResolvedValue({
            ok: true,
            data: {
                updated_ids: [1, 2],
                failed: [{ id: 3, code: "NOT_FOUND", error: "Asset not found: 3" }],
            },
        });
        const events: any[] = [];
        const onEvent = (ev: any) => events.push(ev.detail);
        window.addEventListener("mjr:asset-rating-changed", onEvent);
        pressKey("4");
        await vi.waitFor(() => expect(events).toHaveLength(2));
        expect(
            vi
                .mocked(comfyToast)
                .mock.calls.some((call: any[]) => String(call[0]) === "2 rated, 1 failed"),
        ).toBe(true);
        window.removeEventListener("mjr:asset-rating-changed", onEvent);
    });
});
