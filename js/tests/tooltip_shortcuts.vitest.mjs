import { describe, expect, it } from "vitest";

import { appendTooltipHint, setTooltipHint } from "../utils/tooltipShortcuts.js";

describe("tooltipShortcuts", () => {
    it("appends shortcut hints once", () => {
        expect(appendTooltipHint("Open Floating Viewer", "V, Ctrl/Cmd+V")).toBe(
            "Open Floating Viewer (V, Ctrl/Cmd+V)",
        );
        expect(appendTooltipHint("Close sidebar (Esc)", "Esc")).toBe("Close sidebar (Esc)");
        expect(appendTooltipHint("Mode: A/B Compare - click to switch", "C")).toBe(
            "Mode: A/B Compare - click to switch (C)",
        );
    });

    it("sets title and aria-label together", () => {
        const attrs = new Map();
        const button = {
            title: "",
            setAttribute(name, value) {
                attrs.set(name, String(value));
            },
        };

        const tooltip = setTooltipHint(button, "Close viewer", "Esc");

        expect(tooltip).toBe("Close viewer (Esc)");
        expect(button.title).toBe("Close viewer (Esc)");
        expect(attrs.get("aria-label")).toBe("Close viewer (Esc)");
    });
});
