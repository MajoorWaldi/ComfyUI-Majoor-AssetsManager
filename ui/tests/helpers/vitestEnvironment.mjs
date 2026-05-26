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

export function ensureWindowStub(overrides = {}) {
    const current = globalThis.window;
    if (
        !current ||
        typeof current.addEventListener !== "function" ||
        typeof current.removeEventListener !== "function"
    ) {
        globalThis.window = createWindowStub(overrides);
        return globalThis.window;
    }
    Object.assign(current, overrides);
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
