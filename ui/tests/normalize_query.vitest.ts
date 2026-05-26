import { describe, expect, it } from "vitest";

import { normalizeQuery } from "../features/panel/controllers/query.js";

describe("normalizeQuery", () => {
    it('returns "*" for null input', () => {
        expect(normalizeQuery(null)).toBe("*");
    });

    it('returns "*" for undefined input', () => {
        expect(normalizeQuery(undefined)).toBe("*");
    });

    it('returns "*" for empty string value', () => {
        expect(normalizeQuery({ value: "" })).toBe("*");
    });

    it('returns "*" for whitespace-only value', () => {
        expect(normalizeQuery({ value: "   " })).toBe("*");
    });

    it("trims and returns non-empty string value", () => {
        expect(normalizeQuery({ value: "  flowers  " })).toBe("flowers");
    });

    it("handles an input element-like object with tagName INPUT", () => {
        const input = { tagName: "INPUT", value: "cats" };
        expect(normalizeQuery(input)).toBe("cats");
    });

    it("handles nested .value wrapping (Vue ref-like)", () => {
        const ref = { value: { value: { tagName: "INPUT", value: "dogs" } } };
        expect(normalizeQuery(ref)).toBe("dogs");
    });

    it("handles an object with querySelector returning an input", () => {
        const container = {
            tagName: "DIV",
            querySelector(sel) {
                if (sel === "#mjr-search-input") {
                    return { tagName: "INPUT", value: "landscapes" };
                }
                return null;
            },
        };
        expect(normalizeQuery(container)).toBe("landscapes");
    });

    it("falls back to mjr-input class when #mjr-search-input is not found", () => {
        const container = {
            tagName: "DIV",
            querySelector(sel) {
                if (sel === "input.mjr-input") {
                    return { tagName: "INPUT", value: "portraits" };
                }
                return null;
            },
        };
        expect(normalizeQuery(container)).toBe("portraits");
    });

    it('returns "*" for a completely empty object', () => {
        expect(normalizeQuery({})).toBe("*");
    });

    it("handles a textarea element", () => {
        const textarea = { tagName: "TEXTAREA", value: "prompt text" };
        expect(normalizeQuery(textarea)).toBe("prompt text");
    });
});
