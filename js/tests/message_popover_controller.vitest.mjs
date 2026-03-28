import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback,
}));

vi.mock("../features/panel/messages/messageCenter.js", () => ({
    PANEL_MESSAGES_EVENT: "mjr:test:messages",
    ensurePanelMessagesReady: vi.fn(),
    getPanelLastReadAt: vi.fn(() => 0),
    getPanelUnreadCount: vi.fn(() => 0),
    listPanelMessages: vi.fn(() => []),
    markPanelMessagesRead: vi.fn(),
}));

vi.mock("../features/panel/messages/shortcutGuide.js", () => ({
    createShortcutGuidePanel: vi.fn(() => ({ nodeType: "shortcut-guide" })),
}));

function createClassList() {
    const names = new Set();
    return {
        toggle(name, active) {
            if (active) names.add(name);
            else names.delete(name);
        },
        contains(name) {
            return names.has(name);
        },
    };
}

function createNode() {
    return {
        className: "",
        id: "",
        hidden: false,
        style: {},
        textContent: "",
        classList: createClassList(),
        attributes: new Map(),
        childNodes: [],
        setAttribute(name, value) {
            this.attributes.set(name, String(value));
        },
        replaceChildren(...children) {
            this.childNodes = children;
        },
        appendChild(child) {
            this.childNodes.push(child);
            return child;
        },
        addEventListener() {},
    };
}

describe("messagePopoverController", () => {
    beforeEach(() => {
        const eventTarget = new EventTarget();
        eventTarget.location = { href: "http://127.0.0.1:8188/" };
        globalThis.window = eventTarget;
        globalThis.document = {
            createElement: vi.fn(() => createNode()),
        };
    });

    it("shows only the shortcut panel in shortcut guide tab", async () => {
        const { bindMessagePopoverController } =
            await import("../features/panel/messages/messagePopoverController.js");

        const badge = { style: {}, textContent: "" };
        const messageBtn = {
            classList: createClassList(),
            setAttribute() {},
            querySelector(selector) {
                return selector === ".mjr-message-badge" ? badge : null;
            },
            addEventListener() {},
        };
        const title = createNode();
        const messagePopover = createNode();
        const messageList = createNode();
        const shortcutsPanel = createNode();
        const messageTabBtn = createNode();
        const shortcutsTabBtn = createNode();
        const markReadBtn = createNode();
        const popovers = {
            toggle() {},
            close() {},
        };

        const controller = bindMessagePopoverController({
            messageBtn,
            messagePopover,
            title,
            messageList,
            shortcutsPanel,
            messageTabBtn,
            shortcutsTabBtn,
            markReadBtn,
            popovers,
        });

        controller.showShortcutsTab();

        expect(title.textContent).toBe("Shortcut Guide");
        expect(messageList.hidden).toBe(true);
        expect(messageList.style.display).toBe("none");
        expect(messageList.attributes.get("aria-hidden")).toBe("true");
        expect(shortcutsPanel.hidden).toBe(false);
        expect(shortcutsPanel.style.display).toBe("");
        expect(shortcutsPanel.attributes.get("aria-hidden")).toBe("false");
        expect(markReadBtn.hidden).toBe(true);

        controller.showMessagesTab();

        expect(title.textContent).toBe("Messages");
        expect(messageList.hidden).toBe(false);
        expect(messageList.style.display).toBe("");
        expect(shortcutsPanel.hidden).toBe(true);
        expect(shortcutsPanel.style.display).toBe("none");
        expect(markReadBtn.hidden).toBe(false);
    });
});
