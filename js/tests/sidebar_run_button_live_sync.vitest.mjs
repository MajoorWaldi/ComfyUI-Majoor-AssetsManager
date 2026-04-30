import { beforeEach, describe, expect, it, vi } from "vitest";

const bridgeState = vi.hoisted(() => ({
    app: null,
    api: null,
}));

const progressState = vi.hoisted(() => ({
    snapshot: { queue: 0, prompt: null },
    listeners: new Map(),
}));

const ensureTrackingMock = vi.hoisted(() => vi.fn(() => Promise.resolve()));

const progressService = {
    addEventListener(type, handler) {
        const key = String(type || "");
        const list = progressState.listeners.get(key) || [];
        list.push(handler);
        progressState.listeners.set(key, list);
    },
    removeEventListener(type, handler) {
        const key = String(type || "");
        const list = progressState.listeners.get(key) || [];
        progressState.listeners.set(
            key,
            list.filter((entry) => entry !== handler),
        );
    },
    getSnapshot() {
        return progressState.snapshot;
    },
    dispatch(snapshot) {
        progressState.snapshot = snapshot;
        for (const handler of progressState.listeners.get("progress-update") || []) {
            handler({ type: "progress-update", detail: snapshot });
        }
    },
};

vi.mock("../app/comfyApiBridge.js", () => ({
    getComfyApp: () => bridgeState.app,
    getComfyApi: () => bridgeState.api,
}));

vi.mock("../features/viewer/floatingViewerProgress.js", () => ({
    ensureFloatingViewerProgressTracking: ensureTrackingMock,
    floatingViewerProgressService: progressService,
}));

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback,
}));

function makeClassList() {
    const classes = new Set();
    return {
        add: (...tokens) => tokens.forEach((token) => classes.add(String(token))),
        remove: (...tokens) => tokens.forEach((token) => classes.delete(String(token))),
        toggle: (token, force) => {
            const key = String(token);
            if (force === undefined) {
                if (classes.has(key)) {
                    classes.delete(key);
                    return false;
                }
                classes.add(key);
                return true;
            }
            if (force) classes.add(key);
            else classes.delete(key);
            return Boolean(force);
        },
        contains: (token) => classes.has(String(token)),
        toString: () => Array.from(classes).join(" "),
    };
}

function makeElement(tagName) {
    const listeners = new Map();
    const el = {
        tagName: String(tagName || "").toUpperCase(),
        children: [],
        className: "",
        classList: makeClassList(),
        disabled: false,
        title: "",
        type: "",
        style: {},
        dataset: {},
        appendChild(child) {
            this.children.push(child);
            return child;
        },
        setAttribute(name, value) {
            this[name] = value;
        },
        addEventListener(type, handler) {
            const key = String(type || "");
            const list = listeners.get(key) || [];
            list.push(handler);
            listeners.set(key, list);
        },
        removeEventListener(type, handler) {
            const key = String(type || "");
            const list = listeners.get(key) || [];
            listeners.set(
                key,
                list.filter((entry) => entry !== handler),
            );
        },
        click() {
            for (const handler of listeners.get("click") || []) {
                handler({ currentTarget: this, target: this, preventDefault() {} });
            }
        },
    };
    return el;
}

describe("sidebar run button live sync", () => {
    beforeEach(() => {
        progressState.snapshot = { queue: 0, prompt: null };
        progressState.listeners = new Map();
        ensureTrackingMock.mockClear();

        globalThis.document = {
            createElement: vi.fn((tag) => makeElement(tag)),
        };

        bridgeState.app = {
            graphToPrompt: vi.fn(async () => ({
                output: { 1: { class_type: "KSampler" } },
                workflow: { nodes: [{ id: 1 }] },
            })),
        };
        bridgeState.api = {
            queuePrompt: vi.fn(async () => ({ prompt_id: "prompt-1" })),
            interrupt: vi.fn(async () => ({})),
        };
    });

    it("tracks ComfyUI execution state live from the progress service", async () => {
        const { createRunButton } =
            await import("../features/viewer/workflowSidebar/sidebarRunButton.js");

        const handle = createRunButton();
        const runBtn = handle.el.children[0];
        const stopBtn = handle.el.children[1];

        expect(runBtn.disabled).toBe(false);
        expect(stopBtn.disabled).toBe(true);
        expect(ensureTrackingMock).toHaveBeenCalledTimes(1);

        progressService.dispatch({
            queue: 1,
            prompt: { currentlyExecuting: { nodeId: "11" }, errorDetails: null },
        });

        expect(runBtn.disabled).toBe(true);
        expect(runBtn.classList.contains("running")).toBe(true);
        expect(stopBtn.disabled).toBe(false);
        expect(stopBtn.classList.contains("active")).toBe(true);

        progressService.dispatch({ queue: 0, prompt: null });

        expect(runBtn.disabled).toBe(false);
        expect(runBtn.classList.contains("running")).toBe(false);
        expect(stopBtn.disabled).toBe(true);

        handle.dispose();
    });

    it("queues and interrupts through ComfyUI immediately, then follows live progress", async () => {
        const { createRunButton } =
            await import("../features/viewer/workflowSidebar/sidebarRunButton.js");

        const handle = createRunButton();
        const runBtn = handle.el.children[0];
        const stopBtn = handle.el.children[1];

        runBtn.click();
        await Promise.resolve();

        expect(bridgeState.app.graphToPrompt).toHaveBeenCalledTimes(1);
        expect(bridgeState.api.queuePrompt).toHaveBeenCalledTimes(1);
        expect(runBtn.disabled).toBe(true);
        expect(runBtn.classList.contains("running")).toBe(true);
        expect(stopBtn.disabled).toBe(false);

        stopBtn.click();
        await Promise.resolve();

        expect(bridgeState.api.interrupt).toHaveBeenCalledTimes(1);
        expect(runBtn.classList.contains("stopping")).toBe(true);

        progressService.dispatch({ queue: 0, prompt: null });

        expect(runBtn.disabled).toBe(false);
        expect(runBtn.classList.contains("stopping")).toBe(false);
        expect(stopBtn.disabled).toBe(true);

        handle.dispose();
    });
});
