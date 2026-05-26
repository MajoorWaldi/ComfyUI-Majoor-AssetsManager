import { beforeEach, describe, expect, it } from "vitest";

import {
    clearAssetDragStartCleanup,
    consumeInternalDropOccurred,
    getAssetDragStartCleanup,
    markInternalDropOccurred,
    resetDndRuntimeState,
    setAssetDragStartCleanup,
} from "../features/dnd/runtimeState.js";

describe("dnd runtime state", () => {
    beforeEach(() => {
        resetDndRuntimeState();
    });

    it("consumes the internal drop flag exactly once", () => {
        expect(consumeInternalDropOccurred()).toBe(false);

        markInternalDropOccurred();
        expect(consumeInternalDropOccurred()).toBe(true);
        expect(consumeInternalDropOccurred()).toBe(false);
    });

    it("tracks dragstart cleanup per container without DOM expandos", () => {
        const container = {};
        const cleanup = () => {};

        expect(getAssetDragStartCleanup(container)).toBeNull();

        setAssetDragStartCleanup(container, cleanup);
        expect(getAssetDragStartCleanup(container)).toBe(cleanup);

        clearAssetDragStartCleanup(container);
        expect(getAssetDragStartCleanup(container)).toBeNull();
    });
});
