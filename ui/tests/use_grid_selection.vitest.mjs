import { beforeEach, describe, expect, it, vi } from "vitest";

function createGridContainer() {
    const bus = new EventTarget();
    return {
        dataset: {},
        children: [],
        addEventListener: (...args) => bus.addEventListener(...args),
        removeEventListener: (...args) => bus.removeEventListener(...args),
        dispatchEvent: (...args) => bus.dispatchEvent(...args),
        appendChild(child) {
            this.children.push(child);
        },
        querySelector(selector) {
            const match = selector.match(/data-mjr-asset-id="([^"]+)"/);
            if (!match) return null;
            const wantedId = String(match[1] || "").replace(/\\([:])/g, "$1");
            return (
                this.children.find(
                    (child) =>
                        child?.className === "mjr-asset-card" &&
                        String(child?.dataset?.mjrAssetId || "") === wantedId,
                ) || null
            );
        },
    };
}

describe("useGridSelection", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        globalThis.CustomEvent =
            globalThis.CustomEvent ||
            class extends Event {
                constructor(type, init = {}) {
                    super(type);
                    this.detail = init.detail;
                }
            };
    });

    it("syncs selection events back to panel state writers", async () => {
        const { bindGridSelectionState } = await import("../vue/composables/useGridSelection.js");

        const gridContainer = createGridContainer();
        const writeSelectedAssetIds = vi.fn();
        const writeActiveAssetId = vi.fn();
        const onSelectionChanged = vi.fn();

        bindGridSelectionState({
            gridContainer,
            writeSelectedAssetIds,
            writeActiveAssetId,
            onSelectionChanged,
        });

        gridContainer.dispatchEvent(
            new CustomEvent("mjr:selection-changed", {
                detail: {
                    selectedIds: [12, "34", "", null],
                    activeId: "34",
                },
            }),
        );

        expect(writeSelectedAssetIds).toHaveBeenCalledWith(["12", "34"]);
        expect(writeActiveAssetId).toHaveBeenCalledWith("34");
        expect(onSelectionChanged).toHaveBeenCalledWith(
            expect.objectContaining({
                selectedIds: [12, "34", "", null],
                activeId: "34",
            }),
        );
    });

    it("restores persisted selection and scroll target on the grid", async () => {
        const { bindGridSelectionState } = await import("../vue/composables/useGridSelection.js");

        const gridContainer = createGridContainer();
        gridContainer._mjrSetSelection = vi.fn();
        gridContainer._mjrScrollToAssetId = vi.fn();

        const binding = bindGridSelectionState({
            gridContainer,
            readSelectedAssetIds: () => ["asset-1", "asset-2"],
            readActiveAssetId: () => "asset-2",
        });

        binding.restoreSelectionState({ scrollTop: 0 });

        expect(gridContainer._mjrSetSelection).toHaveBeenCalledWith(
            ["asset-1", "asset-2"],
            "asset-2",
        );
        expect(gridContainer._mjrScrollToAssetId).toHaveBeenCalledWith("asset-2");
    });

    it("falls back to scrolling the matching DOM card into view when needed", async () => {
        const { bindGridSelectionState } = await import("../vue/composables/useGridSelection.js");

        const gridContainer = createGridContainer();
        const card = {
            className: "mjr-asset-card",
            dataset: { mjrAssetId: "asset:2" },
            scrollIntoView: vi.fn(),
        };
        gridContainer.appendChild(card);

        const binding = bindGridSelectionState({
            gridContainer,
            readSelectedAssetIds: () => ["asset:2"],
            readActiveAssetId: () => "asset:2",
        });

        binding.restoreSelectionState({ scrollTop: 0 });

        expect(card.scrollIntoView).toHaveBeenCalledWith({
            block: "nearest",
            behavior: "instant",
        });
    });
});
