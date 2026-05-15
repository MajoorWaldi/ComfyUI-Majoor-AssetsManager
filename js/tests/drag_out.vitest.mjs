import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const postMock = vi.fn();

vi.mock("../api/client.js", () => ({
    post: postMock,
}));

vi.mock("../api/endpoints.js", () => ({
    ENDPOINTS: {
        BATCH_ZIP_CREATE: "/mjr/am/batch-zip",
    },
    buildBatchZipDownloadURL: (token) => `/mjr/am/batch-zip/${encodeURIComponent(token)}`,
    buildCleanDownloadURL: (filepath) => `/mjr/am/assets/download-clean?path=${encodeURIComponent(filepath)}`,
}));

vi.mock("../utils/ids.js", () => ({
    createSecureToken: () => "mjr_1234567890123456789012345678",
    pickRootId: (asset) => asset?.root_id || asset?.custom_root_id || "",
}));

describe("drag-out to OS", () => {
    beforeEach(() => {
        postMock.mockReset();
        postMock.mockResolvedValue({ ok: true });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function makeDataTransfer() {
        const data = new Map();
        return {
            effectAllowed: "",
            setData: vi.fn((type, value) => data.set(type, value)),
            getData: (type) => data.get(type) || "",
        };
    }

    it("creates a batch zip drag payload for a selected multi-file drag", async () => {
        const { applyDragOutToOS } = await import("../features/dnd/out/DragOut.js");
        const container = { dataset: {}, _mjrGetAssets: null };
        const card = { dataset: {} };
        const assets = [
            { id: "a", filename: "one.png", subfolder: "", type: "output" },
            { id: "b", filename: "two.png", subfolder: "set", type: "output" },
        ];
        container.dataset.mjrSelectedAssetIds = JSON.stringify(["a", "b"]);
        container._mjrGetAssets = () => assets;
        card.dataset.mjrAssetId = "a";
        const dt = makeDataTransfer();

        applyDragOutToOS({
            dt,
            asset: assets[0],
            containerEl: container,
            card,
            viewUrl: "/view?filename=one.png",
        });

        expect(postMock).toHaveBeenCalledWith("/mjr/am/batch-zip", {
            token: "mjr_1234567890123456789012345678",
            items: [
                { filename: "one.png", subfolder: "", type: "output", root_id: undefined },
                { filename: "two.png", subfolder: "set", type: "output", root_id: undefined },
            ],
            strip_metadata: false,
        });
        expect(dt.getData("DownloadURL")).toContain("application/zip:Majoor_Batch_2.zip:");
        expect(dt.getData("DownloadURL")).toContain("/mjr/am/batch-zip/mjr_1234567890123456789012345678");
        expect(dt.getData("text/uri-list")).toContain(
            "/mjr/am/batch-zip/mjr_1234567890123456789012345678",
        );
        expect(dt.effectAllowed).toBe("copy");
    });

    it("uses the canonical selected-assets API for multi-file drag-out", async () => {
        const { applyDragOutToOS } = await import("../features/dnd/out/DragOut.js");
        const assets = [
            { id: "a", filename: "one.png", subfolder: "", type: "output" },
            { id: "b", filename: "two.png", subfolder: "set", type: "output" },
            { id: "c", filename: "three.png", subfolder: "", type: "output" },
        ];
        const container = {
            dataset: { mjrSelectedAssetIds: JSON.stringify(["a", "b"]) },
            _mjrGetAssets: () => [assets[0]],
            _mjrGetSelectedAssets: () => [assets[0], assets[1]],
        };
        const card = { dataset: { mjrAssetId: "a" } };
        const dt = makeDataTransfer();

        applyDragOutToOS({
            dt,
            asset: assets[0],
            containerEl: container,
            card,
            viewUrl: "/view?filename=one.png",
        });

        expect(postMock).toHaveBeenCalledWith("/mjr/am/batch-zip", {
            token: "mjr_1234567890123456789012345678",
            items: [
                { filename: "one.png", subfolder: "", type: "output", root_id: undefined },
                { filename: "two.png", subfolder: "set", type: "output", root_id: undefined },
            ],
            strip_metadata: false,
        });
        expect(dt.getData("DownloadURL")).toContain("application/zip:Majoor_Batch_2.zip:");
    });

    it("creates a clean batch zip drag payload for S-key multi-file drag-out", async () => {
        const { applyDragOutToOS } = await import("../features/dnd/out/DragOut.js");
        const assets = [
            { id: "a", filename: "one.png", subfolder: "", type: "output" },
            { id: "b", filename: "two.png", subfolder: "set", type: "output" },
        ];
        const container = {
            dataset: { mjrSelectedAssetIds: JSON.stringify(["a", "b"]) },
            _mjrGetSelectedAssets: () => assets,
        };
        const card = { dataset: { mjrAssetId: "a" } };
        const dt = makeDataTransfer();

        applyDragOutToOS({
            dt,
            asset: assets[0],
            containerEl: container,
            card,
            viewUrl: "/view?filename=one.png",
            stripMetadata: true,
        });

        expect(postMock).toHaveBeenCalledWith("/mjr/am/batch-zip", {
            token: "mjr_1234567890123456789012345678",
            items: [
                { filename: "one.png", subfolder: "", type: "output", root_id: undefined },
                { filename: "two.png", subfolder: "set", type: "output", root_id: undefined },
            ],
            strip_metadata: true,
        });
        expect(dt.getData("DownloadURL")).toContain("application/zip:Majoor_Clean_Batch_2.zip:");
    });

    it("falls back to single-file DownloadURL when the dragged card is not selected", async () => {
        const { applyDragOutToOS } = await import("../features/dnd/out/DragOut.js");
        const container = { dataset: {}, _mjrGetAssets: null };
        const card = { dataset: {} };
        const asset = { id: "a", filename: "one.png", type: "output" };
        container.dataset.mjrSelectedAssetIds = JSON.stringify(["b", "c"]);
        container._mjrGetAssets = () => [asset];
        card.dataset.mjrAssetId = "a";
        const dt = makeDataTransfer();

        applyDragOutToOS({
            dt,
            asset,
            containerEl: container,
            card,
            viewUrl: "/view?filename=one.png",
        });

        expect(postMock).not.toHaveBeenCalled();
        expect(dt.getData("DownloadURL")).toContain("application/octet-stream:one.png:");
        expect(dt.getData("text/uri-list")).toContain("/view?filename=one.png");
    });

    it("does not trigger clean metadata downloads after a normal OS drag-out", async () => {
        const { handleDragEnd } = await import("../features/dnd/out/DragOut.js");
        const clicks = [];
        vi.stubGlobal("window", { location: { href: "http://localhost:3000/" } });
        vi.stubGlobal("document", {
            body: { appendChild: vi.fn() },
            createElement: vi.fn(() => ({
                href: "",
                download: "",
                style: {},
                click: vi.fn(function click() {
                    clicks.push(this.href);
                }),
                remove: vi.fn(),
            })),
        });

        handleDragEnd(
            { dataTransfer: { dropEffect: "copy" } },
            {
                asset: {
                    id: "a",
                    filename: "one.png",
                    filepath: "C:/out/one.png",
                    has_workflow: true,
                },
                containerEl: { dataset: {} },
                card: { dataset: { mjrAssetId: "a" } },
                stripMetadata: false,
            },
        );

        expect(clicks).toEqual([]);
    });

    it("uses the clean download URL for S-key single-file drag-out", async () => {
        const { applyDragOutToOS } = await import("../features/dnd/out/DragOut.js");
        const asset = {
            id: "a",
            filename: "one.png",
            filepath: "C:/out/one.png",
            type: "output",
        };
        const dt = makeDataTransfer();

        applyDragOutToOS({
            dt,
            asset,
            containerEl: { dataset: {} },
            card: { dataset: { mjrAssetId: "a" } },
            viewUrl: "/view?filename=one.png",
            stripMetadata: true,
        });

        expect(postMock).not.toHaveBeenCalled();
        expect(dt.getData("DownloadURL")).toContain(
            "application/octet-stream:one.png:http://localhost:3000/mjr/am/assets/download-clean?path=C%3A%2Fout%2Fone.png",
        );
    });

    it("falls back to the normal URL for S-key single-file drag-out without a filepath", async () => {
        const { applyDragOutToOS } = await import("../features/dnd/out/DragOut.js");
        const asset = {
            id: "a",
            filename: "one.png",
            type: "output",
        };
        const dt = makeDataTransfer();

        applyDragOutToOS({
            dt,
            asset,
            containerEl: { dataset: {} },
            card: { dataset: { mjrAssetId: "a" } },
            viewUrl: "/view?filename=one.png",
            stripMetadata: true,
        });

        expect(postMock).not.toHaveBeenCalled();
        expect(dt.getData("DownloadURL")).toContain(
            "application/octet-stream:one.png:http://localhost:3000/view?filename=one.png",
        );
    });
});
