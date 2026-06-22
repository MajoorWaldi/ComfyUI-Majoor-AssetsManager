// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";

const toastMock = vi.hoisted(() => vi.fn());

vi.mock("../app/toast.js", () => ({
    comfyToast: toastMock,
}));

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback, params) => {
        if (!params || typeof fallback !== "string") return fallback || "";
        return fallback.replace(/\{(\w+)\}/g, (_match, name) => String(params[name] ?? ""));
    },
}));

describe("panel stack-group similar scope", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        toastMock.mockReset();
    });

    it("truncates very large stack groups before switching to similar scope", async () => {
        const { bindSimilarSearch } = await import("../features/panel/panelSimilarSearch.js");
        const { EVENTS } = await import("../app/events.js");

        const gridContainer = document.createElement("div");
        const writes = new Map();
        const setScope = vi.fn(async () => {});
        bindSimilarSearch({
            similarBtn: document.createElement("button"),
            gridContainer,
            state: {},
            panelLifecycleAC: new AbortController(),
            isAiEnabled: () => false,
            similarDisabledTitle: "",
            readActiveAssetId: () => "",
            readSelectedAssetIds: () => [],
            readPanelValue: (key, fallback) => writes.get(key) ?? fallback,
            writePanelValue: (key, value) => writes.set(key, value),
            scopeController: { setScope },
            closePopovers: vi.fn(),
        });

        const members = Array.from({ length: 750 }, (_item, index) => ({
            id: index + 1,
            filename: `asset-${index + 1}.png`,
        }));
        gridContainer.dispatchEvent(
            new CustomEvent(EVENTS.OPEN_STACK_GROUP, {
                bubbles: true,
                detail: {
                    asset: { id: "source-1" },
                    members,
                    title: "Generation group (750 assets)",
                },
            }),
        );
        await Promise.resolve();
        await Promise.resolve();

        expect(writes.get("similarResults")).toHaveLength(500);
        expect(writes.get("similarSourceAssetId")).toBe("group:source-1");
        expect(writes.get("similarTitle")).toContain("500/750");
        expect(toastMock).toHaveBeenCalledWith(
            expect.stringContaining("500/750"),
            "warn",
            5000,
        );
        expect(setScope).toHaveBeenCalledWith("similar");
    });
});
