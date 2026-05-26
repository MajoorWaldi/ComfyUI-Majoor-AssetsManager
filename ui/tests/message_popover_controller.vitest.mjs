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
        querySelector(selector) {
            if (!String(selector || "").startsWith(".")) return null;
            const cls = selector.slice(1);
            const stack = [...this.childNodes];
            while (stack.length) {
                const node = stack.shift();
                if (
                    String(node?.className || "")
                        .split(/\s+/)
                        .includes(cls)
                )
                    return node;
                if (Array.isArray(node?.childNodes)) stack.push(...node.childNodes);
            }
            return null;
        },
        addEventListener() {},
    };
}

describe("messagePopoverController", () => {
    beforeEach(() => {
        const eventTarget = new EventTarget();
        eventTarget.location = { href: "http://127.0.0.1:8188/" };
        globalThis.window = eventTarget;
        globalThis.localStorage = {
            _data: new Map(),
            getItem(key) {
                return this._data.has(key) ? this._data.get(key) : null;
            },
            setItem(key, value) {
                this._data.set(key, String(value));
            },
            clear() {
                this._data.clear();
            },
        };
        globalThis.CustomEvent = class CustomEvent extends Event {
            constructor(type, init = {}) {
                super(type);
                this.detail = init.detail;
            }
        };
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

    it("renders rich toast history entries with detail and metadata", async () => {
        const historyModule = await import("../features/panel/messages/toastHistory.js");
        historyModule.addToastHistory({
            message: "Indexed 3 assets",
            title: "Vector Backfill",
            detail: "Indexed 3 assets across 2 folders",
            type: "success",
            source: "ai-index",
            status: "running",
            durationMs: 3600,
            progress: {
                current: 3,
                total: 120,
                percent: 3,
                eligible_total: 120,
                candidate_total: 10,
                indexed: 3,
                skipped: 1,
                errors: 0,
                label: "running",
            },
            actionLabel: "Open docs",
            actionUrl: "https://example.com/docs",
        });

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
        const historyPanel = createNode();
        const messageTabBtn = createNode();
        const historyTabBtn = createNode();
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
            historyPanel,
            messageTabBtn,
            historyTabBtn,
            shortcutsTabBtn,
            markReadBtn,
            popovers,
        });

        controller.showHistoryTab();

        expect(title.textContent).toBe("History");
        const historyList = historyPanel.querySelector(".mjr-history-list");
        expect(historyList).not.toBeNull();
        const item = historyList.childNodes[0];
        expect(item.className).toContain("mjr-history-item--success");

        const content = item.childNodes[1];
        expect(content.childNodes[0].textContent).toBe("Vector Backfill");
        expect(content.childNodes[1].textContent).toBe("Indexed 3 assets across 2 folders");
        expect(content.childNodes[2].childNodes[1].textContent).toBe("3.6s");
        expect(content.childNodes[2].childNodes[2].textContent).toBe("running");
        expect(content.childNodes[2].childNodes[3].textContent).toBe("ai-index");
        expect(content.childNodes[3].childNodes[0].textContent).toContain("running");
        expect(content.childNodes[3].childNodes[0].textContent).toContain("3/120");
        expect(content.childNodes[3].childNodes[1].childNodes[0].style.width).toBe("3%");
        expect(content.childNodes[4].textContent).toBe("Open docs");
    });
});
