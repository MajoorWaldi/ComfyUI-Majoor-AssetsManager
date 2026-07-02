// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";

const toastMock = vi.hoisted(() => vi.fn());
const clientMocks = vi.hoisted(() => ({
    get: vi.fn(),
    getAssetMetadata: vi.fn(),
    vectorFindSimilar: vi.fn(),
}));

vi.mock("../app/toast.js", () => ({
    comfyToast: toastMock,
}));

vi.mock("../api/client.js", () => clientMocks);

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

    it("opens the similar popover and filters by the selected asset workflow id", async () => {
        const { bindSimilarSearch } = await import("../features/panel/panelSimilarSearch.js");

        const similarBtn = document.createElement("button");
        const similarPopover = document.createElement("div");
        const sameWorkflowBtn = document.createElement("button");
        const workflowIdInput = { value: "" };
        const writes = new Map();
        const popovers = {
            toggle: vi.fn((popover) => {
                popover.style.display = popover.style.display === "block" ? "none" : "block";
            }),
            close: vi.fn((popover) => {
                if (popover) popover.style.display = "none";
            }),
        };
        const closePeerPopovers = vi.fn();
        const closePopovers = vi.fn();
        const reloadGrid = vi.fn(async () => {});
        const setScope = vi.fn(async () => {});

        clientMocks.getAssetMetadata.mockResolvedValueOnce({
            ok: true,
            data: {
                id: 42,
                workflow_id: "wf-abc",
                file_info: {},
            },
        });

        bindSimilarSearch({
            similarBtn,
            similarPopover,
            similarSameWorkflowBtn: sameWorkflowBtn,
            gridContainer: document.createElement("div"),
            state: { scope: "output" },
            panelLifecycleAC: new AbortController(),
            isAiEnabled: () => true,
            similarDisabledTitle: "",
            readActiveAssetId: () => "42",
            readSelectedAssetIds: () => [],
            readPanelValue: (key, fallback) => writes.get(key) ?? fallback,
            writePanelValue: (key, value) => writes.set(key, value),
            scopeController: { setScope },
            closePopovers,
            closePeerPopovers,
            popovers,
            workflowIdInput,
            reloadGrid,
        });

        similarBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(closePeerPopovers).toHaveBeenCalled();
        expect(popovers.toggle).toHaveBeenCalledWith(similarPopover, similarBtn);
        expect(similarPopover.style.display).toBe("block");

        sameWorkflowBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        for (let i = 0; i < 5; i += 1) await Promise.resolve();

        expect(closePopovers).toHaveBeenCalled();
        expect(writes.get("workflowId")).toBe("wf-abc");
        expect(workflowIdInput.value).toBe("wf-abc");
        expect(setScope).toHaveBeenCalledWith("output");
        expect(reloadGrid).toHaveBeenCalled();
    });
});
