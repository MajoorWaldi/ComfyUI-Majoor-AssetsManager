import { beforeEach, describe, expect, it } from "vitest";

import {
    getHotkeysState,
    setHotkeysScope,
    isHotkeysSuspended,
    setHotkeysSuspendedFlag,
    setRatingHotkeysActive,
} from "../features/panel/controllers/hotkeysState.js";

describe("hotkeysState", () => {
    beforeEach(() => {
        setHotkeysScope(null);
        setHotkeysSuspendedFlag(false);
        setRatingHotkeysActive(false);
    });

    it("returns default state after reset", () => {
        const state = getHotkeysState();
        expect(state.scope).toBeNull();
        expect(state.suspended).toBe(false);
        expect(state.ratingHotkeysActive).toBe(false);
    });

    describe("setHotkeysScope", () => {
        it("sets scope to a string value", () => {
            setHotkeysScope("grid");
            expect(getHotkeysState().scope).toBe("grid");
        });

        it("coerces non-string values to string", () => {
            setHotkeysScope(42);
            expect(getHotkeysState().scope).toBe("42");
        });

        it("resets scope to null when called with null", () => {
            setHotkeysScope("grid");
            setHotkeysScope(null);
            expect(getHotkeysState().scope).toBeNull();
        });

        it("resets scope to null when called with undefined", () => {
            setHotkeysScope("grid");
            setHotkeysScope(undefined);
            expect(getHotkeysState().scope).toBeNull();
        });
    });

    describe("isHotkeysSuspended / setHotkeysSuspendedFlag", () => {
        it("is not suspended by default", () => {
            expect(isHotkeysSuspended()).toBe(false);
        });

        it("suspends hotkeys", () => {
            setHotkeysSuspendedFlag(true);
            expect(isHotkeysSuspended()).toBe(true);
        });

        it("coerces truthy values to boolean", () => {
            setHotkeysSuspendedFlag(1);
            expect(getHotkeysState().suspended).toBe(true);
        });

        it("coerces falsy values to boolean", () => {
            setHotkeysSuspendedFlag(0);
            expect(getHotkeysState().suspended).toBe(false);
        });
    });

    describe("setRatingHotkeysActive", () => {
        it("activates rating hotkeys", () => {
            setRatingHotkeysActive(true);
            expect(getHotkeysState().ratingHotkeysActive).toBe(true);
        });

        it("deactivates rating hotkeys", () => {
            setRatingHotkeysActive(true);
            setRatingHotkeysActive(false);
            expect(getHotkeysState().ratingHotkeysActive).toBe(false);
        });
    });

    describe("cleanup contract – scope reset mirrors panelRuntime teardown", () => {
        it("resets scope from grid to null (matches cleanup section #29)", () => {
            setHotkeysScope("grid");
            expect(getHotkeysState().scope).toBe("grid");

            // Mirrors: if (getHotkeysState().scope === "grid") setHotkeysScope(null);
            if (getHotkeysState().scope === "grid") {
                setHotkeysScope(null);
            }
            expect(getHotkeysState().scope).toBeNull();
        });

        it("does not reset scope when scope is not grid", () => {
            setHotkeysScope("sidebar");
            if (getHotkeysState().scope === "grid") {
                setHotkeysScope(null);
            }
            expect(getHotkeysState().scope).toBe("sidebar");
        });
    });
});
