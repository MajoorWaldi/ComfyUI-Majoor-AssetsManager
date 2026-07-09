import { beforeEach, describe, expect, it, vi } from "vitest";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("../api/client.js", () => ({
    get: vi.fn(),
    post,
    getAssetMetadata: vi.fn(),
    VECTOR_BACKFILL_DEFAULT_POLL_INTERVAL_MS: 1000,
    VECTOR_BACKFILL_DEFAULT_POLL_TIMEOUT_MS: 1_800_000,
    VECTOR_BACKFILL_MAX_POLL_TIMEOUT_MS: 43_200_000,
}));

import { openInFolder } from "../api/clientOps.js";

describe("openInFolder", () => {
    beforeEach(() => post.mockReset());

    it("prefers an explicit filepath over an asset ID", async () => {
        const filepath =
            "D:\\____comfy_outputs\\projects\\26_001_estee_lauder_multi_protein\\01_in\\refs\\image10.jpeg";

        await openInFolder({ id: "asset:custom-root:image10.jpeg", filepath });

        expect(post).toHaveBeenCalledWith("/mjr/am/open-in-folder", { filepath });
    });

    it("uses the asset ID when no filepath is available", async () => {
        await openInFolder({ id: 42 });

        expect(post).toHaveBeenCalledWith("/mjr/am/open-in-folder", { asset_id: "42" });
    });
});
