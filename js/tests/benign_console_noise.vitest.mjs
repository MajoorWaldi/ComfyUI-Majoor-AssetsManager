import { describe, expect, it } from "vitest";

import { isBenignResizeObserverLoopError } from "../features/runtime/benignConsoleNoise.js";

describe("benign console noise filter", () => {
    it("matches only known ResizeObserver loop browser messages", () => {
        expect(
            isBenignResizeObserverLoopError(
                "ResizeObserver loop completed with undelivered notifications.",
            ),
        ).toBe(true);
        expect(isBenignResizeObserverLoopError("ResizeObserver loop limit exceeded")).toBe(true);
        expect(isBenignResizeObserverLoopError(new Error("ResizeObserver exploded"))).toBe(false);
        expect(isBenignResizeObserverLoopError("Failed to fetch asset metadata")).toBe(false);
    });
});
