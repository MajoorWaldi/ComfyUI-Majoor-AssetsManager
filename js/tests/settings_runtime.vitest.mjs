import { beforeEach, describe, expect, it, vi } from "vitest";

const getRuntimeStatus = vi.fn();
const getSecuritySettings = vi.fn();
const t = vi.fn((key, fallback, vars) => {
    if (!fallback) return key;
    if (!vars || typeof vars !== "object") return fallback;
    return String(fallback).replace(/\{(\w+)\}/g, (_m, name) => String(vars[name] ?? `{${name}}`));
});

vi.mock("../api/client.js", () => ({
    getRuntimeStatus,
    getSecuritySettings,
}));

vi.mock("../app/i18n.js", () => ({
    t,
}));

function createElement(tagName, registry) {
    return {
        tagName,
        id: "",
        style: {},
        textContent: "",
        title: "",
        children: [],
        parentElement: null,
        appendChild(child) {
            child.parentElement = this;
            this.children.push(child);
            if (child.id) registry.set(child.id, child);
            return child;
        },
        remove() {
            if (this.parentElement) {
                this.parentElement.children = this.parentElement.children.filter(
                    (child) => child !== this,
                );
            }
            if (this.id) registry.delete(this.id);
        },
    };
}

function createDocument() {
    const registry = new Map();
    const host = createElement("div", registry);
    host.className = "mjr-assets-manager mjr-am-container";
    return {
        host,
        createElement: (tagName) => createElement(tagName, registry),
        getElementById: (id) => registry.get(id) || null,
        querySelector: (selector) =>
            selector === ".mjr-assets-manager.mjr-am-container" ? host : null,
        __registry: registry,
    };
}

describe("settingsRuntime", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        const document = createDocument();
        globalThis.document = document;
        globalThis.window = {
            __MJR_RUNTIME_STATUS_INTERVAL__: null,
            __MJR_RUNTIME_STATUS_INFLIGHT__: null,
            __MJR_RUNTIME_STATUS_MISS_COUNT__: null,
        };
        globalThis.sessionStorage = {
            getItem: vi.fn(() => "token_1234567890abcd"),
        };
        globalThis.getComputedStyle = vi.fn(() => ({ position: "static" }));
        globalThis.setInterval = vi.fn(() => 1);
        globalThis.clearInterval = vi.fn();
    });

    it("renders runtime metrics and active write auth state in the dashboard", async () => {
        getRuntimeStatus.mockResolvedValue({
            ok: true,
            data: {
                db: { active_connections: 3 },
                index: { enrichment_queue_length: 4 },
                watcher: { pending_files: 5 },
            },
        });
        getSecuritySettings.mockResolvedValue({
            ok: true,
            data: {
                prefs: {
                    allow_write: true,
                    require_auth: true,
                    token_configured: true,
                    token_hint: "...abcd",
                },
            },
        });

        const mod = await import("../app/settings/settingsRuntime.js");
        mod.startRuntimeStatusDashboard();
        await Promise.resolve();
        await Promise.resolve();

        const dashboard = globalThis.document.getElementById("mjr-runtime-status-dashboard");
        expect(dashboard).toBeTruthy();
        expect(dashboard.__mjrMetricsLine.textContent).toBe(
            "DB active: 3 | Enrich Q: 4 | Watcher pending: 5",
        );
        expect(dashboard.__mjrAuthLine.textContent).toBe("Write auth: active ...abcd");
        expect(dashboard.__mjrAuthLine.style.color).toBe("#7ee0a0");
    });
});
