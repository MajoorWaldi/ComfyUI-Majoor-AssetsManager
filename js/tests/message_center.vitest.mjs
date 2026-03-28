import { beforeEach, describe, expect, it, vi } from "vitest";

class MemoryStorage {
    constructor() {
        this.store = new Map();
    }

    clear() {
        this.store.clear();
    }

    getItem(key) {
        return this.store.has(key) ? this.store.get(key) : null;
    }

    removeItem(key) {
        this.store.delete(key);
    }

    setItem(key, value) {
        this.store.set(key, String(value));
    }
}

function installRuntimeGlobals() {
    const eventTarget = new EventTarget();
    eventTarget.location = { href: "http://127.0.0.1:8188/" };
    globalThis.window = eventTarget;
    globalThis.localStorage = new MemoryStorage();
    globalThis.CustomEvent = class CustomEvent extends Event {
        constructor(type, init = {}) {
            super(type);
            this.detail = init.detail;
        }
    };
}

async function loadMessageCenter() {
    vi.resetModules();
    return import("../features/panel/messages/messageCenter.js");
}

describe("messageCenter", () => {
    beforeEach(() => {
        installRuntimeGlobals();
    });

    it("sanitizes unsupported levels to safe values", async () => {
        const { addPanelMessage, listPanelMessages } = await loadMessageCenter();

        addPanelMessage({ id: "bad-level", title: "Bad", level: "error urgent" });
        addPanelMessage({ id: "warn-level", title: "Warn", level: "warn" });

        const bad = listPanelMessages().find((message) => message.id === "bad-level");
        const warn = listPanelMessages().find((message) => message.id === "warn-level");

        expect(bad?.level).toBe("info");
        expect(warn?.level).toBe("warning");
    });

    it("keeps builtin removals dismissed across reloads", async () => {
        const builtinId = "whats-new-2026-03-05-pin-reference";
        const firstLoad = await loadMessageCenter();

        firstLoad.ensurePanelMessagesReady();
        expect(firstLoad.listPanelMessages().map((message) => message.id)).toContain(builtinId);
        expect(firstLoad.removePanelMessage(builtinId)).toBe(true);
        expect(firstLoad.listPanelMessages().map((message) => message.id)).not.toContain(builtinId);

        const secondLoad = await loadMessageCenter();
        secondLoad.ensurePanelMessagesReady();
        expect(secondLoad.listPanelMessages().map((message) => message.id)).not.toContain(
            builtinId,
        );
    });

    it("keeps builtin announcements cleared after clear all", async () => {
        const firstLoad = await loadMessageCenter();

        firstLoad.ensurePanelMessagesReady();
        expect(firstLoad.listPanelMessages().length).toBeGreaterThan(0);
        firstLoad.clearPanelMessages();
        expect(firstLoad.listPanelMessages()).toEqual([]);

        const secondLoad = await loadMessageCenter();
        secondLoad.ensurePanelMessagesReady();
        expect(secondLoad.listPanelMessages()).toEqual([]);
    });

    it("does not inject shortcuts as a normal builtin message entry", async () => {
        const firstLoad = await loadMessageCenter();

        firstLoad.ensurePanelMessagesReady();
        const ids = firstLoad.listPanelMessages().map((message) => message.id);

        expect(ids).not.toContain("info-2026-03-06-shortcut-guide");
    });

    it("includes the floating viewer shortcuts announcement as a builtin message", async () => {
        const firstLoad = await loadMessageCenter();

        firstLoad.ensurePanelMessagesReady();
        const entry = firstLoad
            .listPanelMessages()
            .find((message) => message.id === "whats-new-2026-03-06-floating-viewer-shortcuts");

        expect(entry).toMatchObject({
            id: "whats-new-2026-03-06-floating-viewer-shortcuts",
            titleKey: "msg.whatsNew.title.floatingViewerShortcuts",
            bodyKey: "msg.whatsNew.body.floatingViewerShortcuts",
            level: "info",
        });
    });

    it("returns the stored merged message when updating an existing entry", async () => {
        const { addPanelMessage, listPanelMessages, upsertPanelMessage } =
            await loadMessageCenter();

        addPanelMessage({
            id: "existing-message",
            title: "Initial title",
            createdAt: 123456,
            level: "info",
        });

        const updated = upsertPanelMessage({
            id: "existing-message",
            title: "Updated title",
            level: "success",
        });
        const stored = listPanelMessages().find((message) => message.id === "existing-message");

        expect(updated.createdAt).toBe(123456);
        expect(updated.title).toBe("Updated title");
        expect(updated.level).toBe("success");
        expect(stored).toMatchObject({
            id: "existing-message",
            title: "Updated title",
            createdAt: 123456,
            level: "success",
        });
    });
});
