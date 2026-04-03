import { describe, expect, it, vi } from "vitest";

import {
    enqueueRatingTagsHydration,
    updateCardRatingTagsBadges,
} from "../features/grid/RatingTagsHydrator.js";

describe("RatingTagsHydrator - Vue badge path", () => {
    it("met a jour l'asset reactif pour les cartes Vue sans creer de badges imperatifs", () => {
        const thumb = {
            querySelector: vi.fn(() => null),
        };
        const card = {
            _mjrIsVue: true,
            _mjrAsset: { rating: 0, tags: [] },
            isConnected: true,
            querySelector: vi.fn((sel) => (sel === ".mjr-thumb" ? thumb : null)),
        };

        const deps = {
            createRatingBadge: vi.fn(() => ({ nodeType: 1 })),
            createTagsBadge: vi.fn(() => ({ nodeType: 1 })),
        };

        updateCardRatingTagsBadges(card, 4, "[\"alpha\",\"beta\"]", deps);

        expect(card._mjrAsset.rating).toBe(4);
        expect(card._mjrAsset.tags).toEqual(["alpha", "beta"]);
        expect(deps.createRatingBadge).not.toHaveBeenCalled();
        expect(deps.createTagsBadge).not.toHaveBeenCalled();
    });

    it("supprime les badges legacy imperatifs sur une carte Vue", () => {
        const legacyRating = {
            attributes: [{ name: "class" }, { name: "style" }],
            remove: vi.fn(),
        };
        const legacyTags = {
            attributes: [{ name: "class" }, { name: "style" }],
            remove: vi.fn(),
        };
        const thumb = {
            querySelector: vi.fn((sel) => {
                if (sel === ".mjr-rating-badge") return legacyRating;
                if (sel === ".mjr-tags-badge") return legacyTags;
                return null;
            }),
        };
        const card = {
            _mjrIsVue: true,
            _mjrAsset: { rating: 0, tags: [] },
            isConnected: true,
            querySelector: vi.fn((sel) => (sel === ".mjr-thumb" ? thumb : null)),
        };

        updateCardRatingTagsBadges(card, 5, ["x"], {
            createRatingBadge: vi.fn(),
            createTagsBadge: vi.fn(),
        });

        expect(legacyRating.remove).toHaveBeenCalledTimes(1);
        expect(legacyTags.remove).toHaveBeenCalledTimes(1);
        expect(card._mjrAsset.rating).toBe(5);
        expect(card._mjrAsset.tags).toEqual(["x"]);
    });

    it("retombe en mode imperatif si la carte n'a pas d'asset reactif", () => {
        const appended = [];
        const thumb = {
            querySelector: vi.fn(() => null),
            appendChild: vi.fn((node) => appended.push(node)),
        };
        const card = {
            _mjrIsVue: true,
            isConnected: true,
            querySelector: vi.fn((sel) => (sel === ".mjr-thumb" ? thumb : null)),
        };
        const ratingBadge = { kind: "rating" };
        const tagsBadge = { kind: "tags" };
        const deps = {
            createRatingBadge: vi.fn(() => ratingBadge),
            createTagsBadge: vi.fn(() => tagsBadge),
        };

        updateCardRatingTagsBadges(card, 3, "tag1, tag2", deps);

        expect(deps.createRatingBadge).toHaveBeenCalledTimes(1);
        expect(deps.createTagsBadge).toHaveBeenCalledTimes(1);
        expect(appended).toEqual([ratingBadge, tagsBadge]);
    });

    it("hydrate les tags manquants meme si rating est deja present", async () => {
        const grid = {};
        const asset = { id: 1001, rating: 4, tags: [] };
        const card = {
            _mjrIsVue: true,
            _mjrAsset: asset,
            isConnected: true,
            querySelector: vi.fn(() => null),
        };
        const hydrateAssetRatingTags = vi.fn(async () => ({
            ok: true,
            data: { rating: 4, tags: ["persisted-tag"] },
        }));
        const deps = {
            stateMap: new Map(),
            concurrency: 1,
            queueMax: 32,
            seenMax: 5000,
            seenTtlMs: 60_000,
            pruneBudgetRef: { value: 0 },
            hydrateAssetRatingTags,
            createRatingBadge: vi.fn(() => null),
            createTagsBadge: vi.fn(() => null),
            safeDispatchCustomEvent: vi.fn(),
            events: { rating: "mjr:rating-updated", tags: "mjr:tags-updated" },
        };

        enqueueRatingTagsHydration(grid, card, asset, deps);
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(hydrateAssetRatingTags).toHaveBeenCalledTimes(1);
        expect(asset.tags).toEqual(["persisted-tag"]);
    });

    it("n hydrate pas quand rating et tags sont deja presents", async () => {
        const grid = {};
        const asset = { id: 1002, rating: 5, tags: ["ready"] };
        const card = {
            _mjrIsVue: true,
            _mjrAsset: asset,
            isConnected: true,
            querySelector: vi.fn(() => null),
        };
        const hydrateAssetRatingTags = vi.fn(async () => ({
            ok: true,
            data: { rating: 5, tags: ["ready"] },
        }));
        const deps = {
            stateMap: new Map(),
            concurrency: 1,
            queueMax: 32,
            seenMax: 5000,
            seenTtlMs: 60_000,
            pruneBudgetRef: { value: 0 },
            hydrateAssetRatingTags,
            createRatingBadge: vi.fn(() => null),
            createTagsBadge: vi.fn(() => null),
            safeDispatchCustomEvent: vi.fn(),
            events: { rating: "mjr:rating-updated", tags: "mjr:tags-updated" },
        };

        enqueueRatingTagsHydration(grid, card, asset, deps);
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(hydrateAssetRatingTags).not.toHaveBeenCalled();
        expect(asset.tags).toEqual(["ready"]);
    });
});
