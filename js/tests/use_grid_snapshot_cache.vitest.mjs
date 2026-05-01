import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    buildGridSnapshotKey,
    compactSnapshotAsset,
    getGridSnapshot,
    hasGridSnapshot,
    normalizeGridSnapshot,
    rememberGridSnapshot,
    resetGridSnapshotCacheForTests,
} from "../vue/grid/useGridSnapshotCache.js";

function makeStorage() {
    const data = new Map();
    return {
        getItem: vi.fn((key) => data.get(String(key)) ?? null),
        setItem: vi.fn((key, value) => data.set(String(key), String(value))),
        removeItem: vi.fn((key) => data.delete(String(key))),
        clear: vi.fn(() => data.clear()),
    };
}

describe("useGridSnapshotCache", () => {
    beforeEach(() => {
        vi.useRealTimers();
        resetGridSnapshotCacheForTests();
        globalThis.localStorage = makeStorage();
        globalThis.sessionStorage = makeStorage();
    });

    it("builds stable keys compatible with existing snapshot inputs", () => {
        expect(
            buildGridSnapshotKey({
                scope: "output",
                query: "*",
                sort: "mtime_desc",
            }),
        ).toBe(
            JSON.stringify({
                scope: "output",
                query: "*",
                customRootId: "",
                subfolder: "",
                collectionId: "",
                viewScope: "",
                kind: "",
                workflowOnly: "",
                minRating: "",
                minSizeMB: "",
                maxSizeMB: "",
                resolutionCompare: "",
                minWidth: "",
                minHeight: "",
                maxWidth: "",
                maxHeight: "",
                workflowType: "",
                dateRange: "",
                dateExact: "",
                sort: "mtime_desc",
                semanticMode: "",
            }),
        );
    });

    it("compacts assets to persisted grid fields", () => {
        const compact = compactSnapshotAsset({
            id: 1,
            filename: "one.png",
            source: "output",
            tags: Array.from({ length: 100 }, (_, index) => `tag-${index}`),
            ignored: "nope",
        });

        expect(compact).toMatchObject({
            id: 1,
            filename: "one.png",
            source: "output",
            type: "output",
            kind: "image",
        });
        expect(compact.ignored).toBeUndefined();
        expect(compact.tags).toHaveLength(80);
    });

    it("does not remember snapshots while the snapshot cache is disabled", () => {
        const key = buildGridSnapshotKey({ scope: "output", query: "*", sort: "mtime_desc" });

        expect(
            rememberGridSnapshot(key, {
                assets: [{ id: 1, filename: "one.png" }],
                total: 50,
                offset: 1,
                done: false,
                query: "*",
                title: "Output",
            }),
        ).toBe(false);

        expect(hasGridSnapshot(key)).toBe(false);
        expect(getGridSnapshot(key)).toBeNull();
    });

    it("rejects expired or empty snapshots", () => {
        expect(normalizeGridSnapshot({ at: Date.now(), assets: [] })).toBeNull();
        expect(
            normalizeGridSnapshot({
                at: Date.now() - 31 * 60 * 1000,
                assets: [{ id: 1, filename: "old.png" }],
            }),
        ).toBeNull();
    });
});
