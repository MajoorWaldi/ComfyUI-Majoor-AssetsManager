import { beforeEach, describe, expect, it, vi } from "vitest";

const bridgeState = vi.hoisted(() => ({
    app: null,
}));

const rendererState = vi.hoisted(() => ({
    constructed: [],
    disposed: [],
    synced: [],
}));

vi.mock("../app/comfyApiBridge.js", () => ({
    getComfyApp: () => bridgeState.app,
}));

vi.mock("../features/viewer/workflowSidebar/NodeWidgetRenderer.js", () => ({
    NodeWidgetRenderer: class NodeWidgetRendererMock {
        constructor(node) {
            this.node = node;
            this.el = makeElement("section");
            this.el.dataset.nodeId = String(node?.id ?? "");
            rendererState.constructed.push(node?.id ?? null);
        }

        syncFromGraph() {
            rendererState.synced.push(this.node?.id ?? null);
        }

        dispose() {
            rendererState.disposed.push(this.node?.id ?? null);
        }
    },
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
    const el = {
        tagName: String(tagName || "").toUpperCase(),
        children: [],
        className: "",
        classList: makeClassList(),
        dataset: {},
        style: {},
        textContent: "",
        ownerDocument: null,
        appendChild(child) {
            this.children.push(child);
            return child;
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        setAttribute: vi.fn(),
        remove: vi.fn(),
    };

    let innerHtmlValue = "";
    Object.defineProperty(el, "innerHTML", {
        get() {
            return innerHtmlValue;
        },
        set(value) {
            innerHtmlValue = String(value || "");
            if (innerHtmlValue === "") {
                this.children.length = 0;
            }
        },
    });

    return el;
}

describe("WorkflowSidebar live sync", () => {
    beforeEach(() => {
        rendererState.constructed = [];
        rendererState.disposed = [];
        rendererState.synced = [];

        const doc = {
            createElement: vi.fn((tag) => {
                const el = makeElement(tag);
                el.ownerDocument = doc;
                return el;
            }),
            activeElement: null,
            defaultView: {
                requestAnimationFrame: vi.fn(() => 1),
                cancelAnimationFrame: vi.fn(),
                setTimeout,
                clearTimeout,
            },
        };

        globalThis.document = doc;
        globalThis.window = {
            ...(globalThis.window || {}),
            requestAnimationFrame: vi.fn(() => 1),
            cancelAnimationFrame: vi.fn(),
            setTimeout,
            clearTimeout,
        };

        bridgeState.app = {
            canvas: {
                selected_nodes: {},
            },
        };
    });

    it("rebuilds immediately when the selected canvas nodes change", async () => {
        const { WorkflowSidebar } =
            await import("../features/viewer/workflowSidebar/WorkflowSidebar.js");

        const nodeA = { id: 11 };
        const nodeB = { id: 22 };
        bridgeState.app.canvas.selected_nodes = { 11: nodeA };

        const sidebar = new WorkflowSidebar();
        sidebar.show();

        expect(rendererState.constructed).toEqual([11]);
        expect(rendererState.synced).toContain(11);

        bridgeState.app.canvas.selected_nodes = { 22: nodeB };
        sidebar.syncFromGraph();

        expect(rendererState.constructed).toEqual([11, 22]);
        expect(rendererState.disposed).toContain(11);
        expect(rendererState.synced.at(-1)).toBe(22);
    });

    it("keeps syncing current node values without forcing a rebuild", async () => {
        const { WorkflowSidebar } =
            await import("../features/viewer/workflowSidebar/WorkflowSidebar.js");

        const nodeA = { id: 33 };
        bridgeState.app.canvas.selected_nodes = { 33: nodeA };

        const sidebar = new WorkflowSidebar();
        sidebar.show();
        rendererState.synced = [];

        sidebar.syncFromGraph();

        expect(rendererState.constructed).toEqual([33]);
        expect(rendererState.synced).toEqual([33]);
    });
});
