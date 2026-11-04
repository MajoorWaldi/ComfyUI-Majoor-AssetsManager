import { vi } from "vitest";

const vueMockState = vi.hoisted(() => ({
    overrides: {},
}));

export function createWindowStub(overrides = {}) {
    const listeners = new Map();
    return {
        addEventListener: vi.fn((type, listener) => {
            const key = String(type || "");
            const existing = listeners.get(key) || [];
            existing.push(listener);
            listeners.set(key, existing);
        }),
        removeEventListener: vi.fn((type, listener) => {
            const key = String(type || "");
            const existing = listeners.get(key) || [];
            listeners.set(
                key,
                existing.filter((entry) => entry !== listener),
            );
        }),
        dispatchEvent: vi.fn((event) => {
            const key = String(event?.type || "");
            for (const listener of listeners.get(key) || []) {
                listener(event);
            }
            return true;
        }),
        ...overrides,
    };
}

export function ensureNavigatorStub(overrides = {}) {
    const current =
        globalThis.navigator && typeof globalThis.navigator === "object"
            ? globalThis.navigator
            : {};
    Object.assign(current, overrides);
    Object.defineProperty(globalThis, "navigator", {
        configurable: true,
        writable: true,
        value: current,
    });
    try {
        if (globalThis.window && typeof globalThis.window === "object") {
            Object.defineProperty(globalThis.window, "navigator", {
                configurable: true,
                writable: true,
                value: current,
            });
        }
    } catch (e) {
        console.debug?.(e);
    }
    return current;
}

export function ensureWindowStub(overrides = {}) {
    const current = globalThis.window;
    if (
        !current ||
        typeof current.addEventListener !== "function" ||
        typeof current.removeEventListener !== "function"
    ) {
        globalThis.window = createWindowStub(overrides) as any;
        ensureNavigatorStub();
        return globalThis.window;
    }
    Object.assign(current, overrides);
    ensureNavigatorStub();
    return current;
}

vi.mock("vue", async () => {
    const actual = await vi.importActual("vue");
    return {
        ...actual,
        ...vueMockState.overrides,
    };
});

export function mockPartialVue(overrides = {}) {
    vueMockState.overrides = { ...overrides };
}
