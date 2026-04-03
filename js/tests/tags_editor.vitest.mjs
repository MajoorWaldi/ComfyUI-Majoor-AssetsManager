import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
    getAvailableTags: vi.fn(),
    updateAssetTags: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
    comfyToast: vi.fn(),
}));

const eventsMock = vi.hoisted(() => ({
    safeDispatchCustomEvent: vi.fn(),
}));

vi.mock("../api/client.js", () => ({
    getAvailableTags: apiMock.getAvailableTags,
    updateAssetTags: apiMock.updateAssetTags,
}));

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback, params) => {
        if (!params || typeof fallback !== "string") return fallback;
        return fallback.replace(/\{(\w+)\}/g, (_match, key) => String(params[key] ?? ""));
    },
}));

vi.mock("../app/toast.js", () => ({
    comfyToast: toastMock.comfyToast,
}));

vi.mock("../utils/events.js", () => ({
    safeDispatchCustomEvent: eventsMock.safeDispatchCustomEvent,
}));

class ElementStub {
    constructor(tagName) {
        this.tagName = String(tagName || "").toUpperCase();
        this.children = [];
        this.parentNode = null;
        this.className = "";
        this.style = {};
        this.attributes = new Map();
        this.listeners = new Map();
        this.textContent = "";
        this.value = "";
        this.type = "";
        this.placeholder = "";
        this.disabled = false;
        this.dataset = {};
        this.isConnected = true;
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index >= 0) {
            this.children.splice(index, 1);
            child.parentNode = null;
        }
        return child;
    }

    setAttribute(name, value) {
        this.attributes.set(String(name), String(value));
    }

    getAttribute(name) {
        return this.attributes.get(String(name));
    }

    addEventListener(type, handler) {
        const key = String(type);
        const handlers = this.listeners.get(key) || [];
        handlers.push(handler);
        this.listeners.set(key, handlers);
    }

    dispatchEvent(event) {
        const payload = event || {};
        payload.type = String(payload.type || "");
        payload.target = payload.target || this;
        payload.currentTarget = this;
        payload.defaultPrevented = false;
        payload.preventDefault =
            payload.preventDefault ||
            (() => {
                payload.defaultPrevented = true;
            });
        payload.stopPropagation = payload.stopPropagation || (() => {});

        for (const handler of this.listeners.get(payload.type) || []) {
            handler(payload);
        }
        return !payload.defaultPrevented;
    }

    querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
    }

    querySelectorAll(selector) {
        const out = [];
        const matcher = createSelectorMatcher(selector);
        const visit = (node) => {
            for (const child of node.children) {
                if (matcher(child)) out.push(child);
                visit(child);
            }
        };
        visit(this);
        return out;
    }

    click() {
        this.dispatchEvent({ type: "click" });
    }

    set innerHTML(_value) {
        this.children = [];
    }
}

function createSelectorMatcher(selector) {
    const raw = String(selector || "").trim();
    if (!raw) return () => false;

    if (raw.startsWith(".")) {
        const className = raw.slice(1);
        return (element) => element.className.split(/\s+/).includes(className);
    }

    if (raw.includes(".")) {
        const [tagName, className] = raw.split(".", 2);
        const expectedTag = String(tagName || "").toUpperCase();
        return (element) =>
            element.tagName === expectedTag && element.className.split(/\s+/).includes(className);
    }

    const expectedTag = raw.toUpperCase();
    return (element) => element.tagName === expectedTag;
}

async function flushPromises(count = 5) {
    for (let i = 0; i < count; i += 1) {
        await Promise.resolve();
    }
}

describe("TagsEditor", () => {
    beforeEach(() => {
        vi.resetModules();
        apiMock.getAvailableTags.mockReset();
        apiMock.updateAssetTags.mockReset();
        toastMock.comfyToast.mockReset();
        eventsMock.safeDispatchCustomEvent.mockReset();

        globalThis.document = {
            createElement: vi.fn((tagName) => new ElementStub(tagName)),
        };
    });

    afterEach(() => {
        delete globalThis.document;
    });

    it("dedupes initial tags and external updates case-insensitively", async () => {
        apiMock.getAvailableTags.mockResolvedValue({ ok: true, data: [] });

        const { createTagsEditor } = await import("../components/TagsEditor.js");
        const asset = { id: 7, tags: ["Cat", "cat", "Dog"] };
        const editor = createTagsEditor(asset, vi.fn());

        expect(asset.tags).toEqual(["Cat", "Dog"]);
        expect(editor.querySelectorAll(".mjr-tag-chip")).toHaveLength(2);

        editor._mjrSetTags(["Bird", "bird", "Cat"]);

        expect(asset.tags).toEqual(["Bird", "Cat"]);
        expect(editor.querySelectorAll(".mjr-tag-chip")).toHaveLength(2);
    });

    it("uses backend-returned tags and blocks duplicate case variants on save", async () => {
        apiMock.getAvailableTags.mockResolvedValue({ ok: true, data: [] });
        apiMock.updateAssetTags.mockResolvedValue({
            ok: true,
            data: { asset_id: 1, tags: ["Dog"] },
        });

        const onUpdate = vi.fn();
        const { createTagsEditor } = await import("../components/TagsEditor.js");
        const asset = { id: 1, tags: [] };
        const editor = createTagsEditor(asset, onUpdate);
        const input = editor.querySelector(".mjr-tag-input");

        input.value = "dog";
        input.dispatchEvent({ type: "keydown", key: "Enter" });
        await flushPromises();

        expect(apiMock.updateAssetTags).toHaveBeenCalledTimes(1);
        expect(apiMock.updateAssetTags.mock.calls[0][1]).toEqual(["dog"]);
        expect(asset.tags).toEqual(["Dog"]);
        expect(onUpdate).toHaveBeenCalledWith(["Dog"]);
        expect(eventsMock.safeDispatchCustomEvent).toHaveBeenCalledWith(
            "mjr:asset-tags-changed",
            { assetId: "1", tags: ["Dog"] },
            { warnPrefix: "[TagsEditor]" },
        );

        input.value = "DOG";
        input.dispatchEvent({ type: "keydown", key: "Enter" });
        await flushPromises();

        expect(apiMock.updateAssetTags).toHaveBeenCalledTimes(1);
    });

    it("enforces the 50-tag limit before posting", async () => {
        apiMock.getAvailableTags.mockResolvedValue({ ok: true, data: [] });
        apiMock.updateAssetTags.mockResolvedValue({
            ok: true,
            data: { asset_id: 1, tags: [] },
        });

        const { createTagsEditor } = await import("../components/TagsEditor.js");
        const asset = { id: 1, tags: Array.from({ length: 50 }, (_, i) => `tag-${i}`) };
        const editor = createTagsEditor(asset, vi.fn());
        const input = editor.querySelector(".mjr-tag-input");

        input.value = "overflow";
        input.dispatchEvent({ type: "keydown", key: "Enter" });
        await flushPromises();

        expect(asset.tags).toHaveLength(50);
        expect(asset.tags.includes("overflow")).toBe(false);
        expect(apiMock.updateAssetTags).not.toHaveBeenCalled();
    });
});
