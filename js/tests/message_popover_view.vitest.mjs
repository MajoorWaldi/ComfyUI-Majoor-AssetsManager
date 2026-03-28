import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback,
}));

function createElementStub(tagName) {
    return {
        tagName: String(tagName || "").toUpperCase(),
        className: "",
        id: "",
        hidden: false,
        style: {},
        children: [],
        attributes: new Map(),
        appendChild(child) {
            this.children.push(child);
            return child;
        },
        setAttribute(name, value) {
            this.attributes.set(name, String(value));
        },
    };
}

describe("messagePopoverView", () => {
    beforeEach(() => {
        globalThis.document = {
            createElement: vi.fn((tag) => createElementStub(tag)),
        };
    });

    it("creates separate tabs and panels for messages and shortcuts", async () => {
        const { createMessagePopoverView } =
            await import("../features/panel/views/messagePopoverView.js");
        const view = createMessagePopoverView();

        expect(view.messageTabBtn.textContent).toBe("Messages");
        expect(view.shortcutsTabBtn.textContent).toBe("Shortcut Guide");
        expect(view.messageList.hidden).toBe(false);
        expect(view.shortcutsPanel.hidden).toBe(true);
    });
});
