// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.hoisted(() => vi.fn());

vi.mock("../api/client.js", () => ({
    get: getMock,
}));

vi.mock("../api/endpoints.js", () => ({
    buildStackMembersURL: vi.fn((stackId) => `/mjr/am/stacks/${stackId}`),
}));

describe("StackGroupCards overlay buttons", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        getMock.mockReset();
    });

    it("keeps stack-group button clickable without bubbling card press/drag events", async () => {
        const { ensureStackGroupCard } = await import("../features/grid/StackGroupCards.js");
        const { EVENTS } = await import("../app/events.js");

        const grid = document.createElement("div");
        grid.dataset.mjrGroupStacks = "1";
        const card = document.createElement("div");
        card.className = "mjr-asset-card";
        grid.appendChild(card);

        const asset = {
            id: "asset-1",
            filename: "image.png",
            stack_id: "stack-1",
            mtime: 100,
        };
        const members = [
            asset,
            {
                id: "asset-2",
                filename: "image-2.png",
                stack_id: "stack-1",
                mtime: 200,
            },
        ];
        getMock.mockResolvedValue({ ok: true, data: members });

        ensureStackGroupCard(grid, card, asset);

        const button = card.querySelector(".mjr-stack-group-button");
        expect(button).toBeTruthy();
        expect(button.draggable).toBe(false);

        const cardMouseDown = vi.fn();
        card.addEventListener("mousedown", cardMouseDown);
        const down = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
        button.dispatchEvent(down);
        expect(cardMouseDown).not.toHaveBeenCalled();
        expect(down.defaultPrevented).toBe(true);

        const cardDragStart = vi.fn();
        card.addEventListener("dragstart", cardDragStart);
        const dragStart = new Event("dragstart", { bubbles: true, cancelable: true });
        button.dispatchEvent(dragStart);
        expect(cardDragStart).not.toHaveBeenCalled();
        expect(dragStart.defaultPrevented).toBe(true);

        const openStackGroup = vi.fn();
        grid.addEventListener(EVENTS.OPEN_STACK_GROUP, openStackGroup);

        button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(getMock).toHaveBeenCalledWith("/mjr/am/stacks/stack-1", { timeoutMs: 30_000 });
        expect(openStackGroup).toHaveBeenCalledTimes(1);
        expect(card.dataset.mjrStacked).toBe("true");
        expect(card.dataset.mjrStackCount).toBe("2");
        expect(button.textContent).toContain("2");

        const [{ detail }] = openStackGroup.mock.calls[0];
        expect(detail.stackId).toBe("stack-1");
        expect(detail.members.map((entry) => entry.id)).toEqual(["asset-2", "asset-1"]);
    });

    it("skips imperative button creation for Vue cards (_mjrIsVue guard)", async () => {
        const { ensureStackGroupCard, ensureDupStackCard } =
            await import("../features/grid/StackGroupCards.js");

        const grid = document.createElement("div");
        grid.dataset.mjrGroupStacks = "1";
        const card = document.createElement("div");
        card.className = "mjr-asset-card";
        card._mjrIsVue = true;
        grid.appendChild(card);

        const asset = {
            id: "asset-1",
            filename: "image.png",
            stack_id: "stack-1",
            stack_asset_count: 3,
            _mjrDupStack: true,
            _mjrDupCount: 2,
        };

        ensureStackGroupCard(grid, card, asset);
        expect(card.querySelector(".mjr-stack-group-button")).toBeNull();

        ensureDupStackCard(grid, card, asset);
        expect(card.querySelector(".mjr-dup-stack-button")).toBeNull();
    });

    it("still creates buttons for non-Vue cards", async () => {
        const { ensureStackGroupCard, ensureDupStackCard } =
            await import("../features/grid/StackGroupCards.js");

        const grid = document.createElement("div");
        grid.dataset.mjrGroupStacks = "1";
        const card = document.createElement("div");
        card.className = "mjr-asset-card";
        // _mjrIsVue not set
        grid.appendChild(card);

        const asset = {
            id: "asset-1",
            filename: "image.png",
            stack_id: "stack-1",
            stack_asset_count: 3,
            _mjrDupStack: true,
            _mjrDupCount: 2,
            _mjrDupMembers: [{ id: "a1" }, { id: "a2" }],
        };

        ensureStackGroupCard(grid, card, asset);
        expect(card.querySelector(".mjr-stack-group-button")).toBeTruthy();

        ensureDupStackCard(grid, card, asset);
        expect(card.querySelector(".mjr-dup-stack-button")).toBeTruthy();
    });
});
