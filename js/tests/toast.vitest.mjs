import { beforeEach, describe, expect, it, vi } from "vitest";

const getComfyApp = vi.fn(() => null);
const getExtensionToastApi = vi.fn(() => null);

vi.mock("../app/comfyApiBridge.js", () => ({
    getComfyApp,
    getExtensionToastApi,
}));

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback, params) => {
        if (!params) return fallback;
        return String(fallback || "").replace(/\{(\w+)\}/g, (_m, key) => String(params[key] ?? ""));
    },
}));

class MemoryStorage {
    constructor() {
        this.store = new Map();
    }
    getItem(key) {
        return this.store.has(key) ? this.store.get(key) : null;
    }
    setItem(key, value) {
        this.store.set(key, String(value));
    }
    clear() {
        this.store.clear();
    }
}

function createClassList() {
    const names = new Set();
    return {
        add(name) {
            names.add(name);
        },
        remove(name) {
            names.delete(name);
        },
        contains(name) {
            return names.has(name);
        },
    };
}

function createElement(tagName) {
    return {
        tagName: String(tagName || "").toUpperCase(),
        id: "",
        className: "",
        textContent: "",
        onclick: null,
        style: {},
        attributes: new Map(),
        childNodes: [],
        parentNode: null,
        isConnected: false,
        classList: createClassList(),
        setAttribute(name, value) {
            this.attributes.set(name, String(value));
        },
        appendChild(child) {
            child.parentNode = this;
            child.isConnected = this.isConnected;
            this.childNodes.push(child);
            return child;
        },
        removeChild(child) {
            this.childNodes = this.childNodes.filter((node) => node !== child);
            child.parentNode = null;
            child.isConnected = false;
            return child;
        },
        querySelectorAll(selector) {
            if (selector !== ".mjr-toast") return [];
            return this.childNodes.filter((node) =>
                String(node.className || "").includes("mjr-toast"),
            );
        },
    };
}

function readNodeText(node) {
    if (!node) return "";
    const own = String(node.textContent || "");
    const children = Array.isArray(node.childNodes)
        ? node.childNodes.map((child) => readNodeText(child)).join("")
        : "";
    return `${own}${children}`;
}

function installRuntimeGlobals() {
    const body = createElement("body");
    body.isConnected = true;
    const elementsById = new Map();

    globalThis.document = {
        body,
        createElement: vi.fn((tag) => createElement(tag)),
        getElementById: vi.fn((id) => elementsById.get(id) || null),
    };

    const originalAppend = body.appendChild.bind(body);
    body.appendChild = (child) => {
        const appended = originalAppend(child);
        if (child?.id) elementsById.set(child.id, child);
        child.isConnected = true;
        return appended;
    };

    globalThis.window = new EventTarget();
    globalThis.localStorage = new MemoryStorage();
    globalThis.CustomEvent = class CustomEvent extends Event {
        constructor(type, init = {}) {
            super(type);
            this.detail = init.detail;
        }
    };
    globalThis.requestAnimationFrame = (cb) => {
        cb();
        return 1;
    };
}

async function loadToastModules() {
    vi.resetModules();
    const toastModule = await import("../app/toast.js");
    const historyModule = await import("../features/panel/messages/toastHistory.js");
    return { toastModule, historyModule };
}

describe("toast", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        installRuntimeGlobals();
    });

    it("normalizes warn severity for history and fallback rendering", async () => {
        const { toastModule, historyModule } = await loadToastModules();

        toastModule.comfyToast("Heads up", "warn", 1500);

        // No DOM fallback container is created — native-only path when no API is available
        expect(document.getElementById("mjr-toast-container")).toBeNull();
        expect(historyModule.listToastHistory()[0]).toMatchObject({
            message: "Heads up",
            type: "warning",
        });
    });

    it("stores readable detail text in history for object toasts", async () => {
        const { toastModule, historyModule } = await loadToastModules();

        toastModule.comfyToast({ summary: "Import", detail: "3 assets added" }, "success", 2500);

        expect(historyModule.listToastHistory()[0]).toMatchObject({
            message: "Import: 3 assets added",
            title: "Import",
            detail: "3 assets added",
            durationMs: 2500,
            persistent: false,
            type: "success",
        });
    });

    it("keeps persistent info toasts in history instead of filtering them out", async () => {
        const { toastModule, historyModule } = await loadToastModules();

        toastModule.comfyToast({ summary: "Update", detail: "A new version is available" }, "info", 0);

        expect(historyModule.listToastHistory()[0]).toMatchObject({
            message: "Update: A new version is available",
            title: "Update",
            detail: "A new version is available",
            type: "info",
            persistent: true,
        });
    });

    it("stores extended history metadata when provided", async () => {
        const { toastModule, historyModule } = await loadToastModules();

        toastModule.comfyToast("Indexed 3 assets", "success", 3600, {
            history: {
                title: "Vector Backfill",
                detail: "Indexed 3 assets across 2 folders",
                source: "ai-index",
                actionLabel: "Open docs",
                actionUrl: "https://example.com/docs",
            },
        });

        expect(historyModule.listToastHistory()[0]).toMatchObject({
            message: "Indexed 3 assets",
            title: "Vector Backfill",
            detail: "Indexed 3 assets across 2 folders",
            source: "ai-index",
            actionLabel: "Open docs",
            actionUrl: "https://example.com/docs",
            type: "success",
            durationMs: 3600,
        });
    });

    it("updates a tracked history entry instead of duplicating progress steps", async () => {
        const { toastModule, historyModule } = await loadToastModules();

        toastModule.recordToastHistory("Reset started", "info", 0, {
            history: {
                trackId: "maintenance:reset_index",
                title: "Reset index",
                status: "started",
            },
        });
        toastModule.recordToastHistory("Restarting scan", "info", 0, {
            history: {
                trackId: "maintenance:reset_index",
                title: "Reset index",
                status: "restarting_scan",
            },
        });

        expect(historyModule.listToastHistory()).toHaveLength(1);
        expect(historyModule.listToastHistory()[0]).toMatchObject({
            message: "Restarting scan",
            title: "Reset index",
            trackId: "maintenance:reset_index",
            status: "restarting_scan",
            persistent: true,
        });
    });

    it("records both persistent and timed toasts in history when native API is unavailable", async () => {
        const { toastModule, historyModule } = await loadToastModules();

        toastModule.comfyToast("Broken", "error", 0);
        toastModule.comfyToast("Recovered", "success", 2000);

        // No DOM fallback container — both toasts are captured in history only
        expect(document.getElementById("mjr-toast-container")).toBeNull();
        const messages = historyModule.listToastHistory().map((h) => h.message);
        expect(messages).toContain("Broken");
        expect(messages).toContain("Recovered");
    });

    it("uses native extension toast when available and still records history", async () => {
        const nativeAdd = vi.fn();
        getComfyApp.mockReturnValue({ extensionManager: { toast: { add: nativeAdd } } });
        getExtensionToastApi.mockReturnValue({ add: nativeAdd });
        const { toastModule, historyModule } = await loadToastModules();

        toastModule.comfyToast("Native hello", "success", 1234);

        expect(nativeAdd).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: "success",
                detail: "Native hello",
                life: 1234,
            }),
        );
        expect(historyModule.listToastHistory()[0]).toMatchObject({
            message: "Native hello",
            type: "success",
        });
        expect(document.getElementById("mjr-toast-container")).toBeNull();
    });
});
