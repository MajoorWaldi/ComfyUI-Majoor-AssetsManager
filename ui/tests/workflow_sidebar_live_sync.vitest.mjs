import { beforeEach, describe, expect, it, vi } from "vitest";

const bridgeState = vi.hoisted(() => ({
    app: null,
}));

const rendererState = vi.hoisted(() => ({
    constructed: [],
    disposed: [],
    synced: [],
    instances: [],
    options: [],
}));

vi.mock("../app/comfyApiBridge.js", () => ({
    getComfyApp: () => bridgeState.app,
}));

vi.mock("../features/viewer/workflowSidebar/NodeWidgetRenderer.js", () => ({
    NodeWidgetRenderer: class NodeWidgetRendererMock {
        constructor(node, opts = {}) {
            this._node = node;
            this.node = node;
            this.opts = opts;
            this._expanded = opts.expanded !== false;
            this.el = makeElement("section");
            this.el.dataset.nodeId = String(node?.id ?? "");
            rendererState.constructed.push(node?.id ?? null);
            rendererState.instances.push(this);
            rendererState.options.push(opts);
        }

        setExpanded(expanded) {
            this._expanded = Boolean(expanded);
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
            child.parentElement = this;
            this.children.push(child);
            return child;
        },
        insertBefore(child, before) {
            child.parentElement = this;
            const currentIndex = this.children.indexOf(child);
            if (currentIndex >= 0) this.children.splice(currentIndex, 1);
            const beforeIndex = this.children.indexOf(before);
            if (beforeIndex >= 0) this.children.splice(beforeIndex, 0, child);
            else this.children.push(child);
            return child;
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        setAttribute: vi.fn(),
        remove: vi.fn(),
        scrollIntoView: vi.fn(),
    };

    Object.defineProperty(el, "firstElementChild", {
        get() {
            return this.children[0] || null;
        },
    });

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
        rendererState.instances = [];
        rendererState.options = [];

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
            graph: {
                nodes: [],
            },
        };
    });

    it("lists all workflow nodes even when no canvas node is selected", async () => {
        const { WorkflowSidebar } =
            await import("../features/viewer/workflowSidebar/WorkflowSidebar.js");

        const nodeA = { id: 11 };
        const nodeB = { id: 22 };
        bridgeState.app.graph.nodes = [nodeA, nodeB];
        bridgeState.app.canvas.selected_nodes = {};

        const sidebar = new WorkflowSidebar();
        sidebar.show();

        expect(rendererState.constructed).toEqual([11, 22]);
        expect(rendererState.synced).toEqual([11, 22]);
    });

    it("syncs selection changes without rebuilding the full node list", async () => {
        const { WorkflowSidebar } =
            await import("../features/viewer/workflowSidebar/WorkflowSidebar.js");

        const nodeA = { id: 11 };
        const nodeB = { id: 22 };
        bridgeState.app.graph.nodes = [nodeA, nodeB];

        const sidebar = new WorkflowSidebar();
        sidebar.show();

        bridgeState.app.canvas.selected_nodes = { 22: nodeB };
        sidebar.syncFromGraph();

        expect(rendererState.constructed).toEqual([11, 22]);
        expect(rendererState.disposed).toEqual([]);
        expect(rendererState.synced.slice(-2)).toEqual([11, 22]);
        expect(rendererState.instances[0].el.classList.contains("is-selected-from-graph")).toBe(false);
        expect(rendererState.instances[1].el.classList.contains("is-selected-from-graph")).toBe(true);

        bridgeState.app.canvas.selected_nodes = {};
        sidebar.syncFromGraph();

        expect(rendererState.instances[0].el.classList.contains("is-selected-from-graph")).toBe(false);
        expect(rendererState.instances[1].el.classList.contains("is-selected-from-graph")).toBe(false);
    });

    it("keeps syncing current node values without forcing a rebuild", async () => {
        const { WorkflowSidebar } =
            await import("../features/viewer/workflowSidebar/WorkflowSidebar.js");

        const nodeA = { id: 33 };
        bridgeState.app.graph.nodes = [nodeA];

        const sidebar = new WorkflowSidebar();
        sidebar.show();
        rendererState.synced = [];

        sidebar.syncFromGraph();

        expect(rendererState.constructed).toEqual([33]);
        expect(rendererState.synced).toEqual([33]);
    });

    it("keeps subgraph inner nodes attached below the selected subgraph", async () => {
        const { WorkflowSidebar } =
            await import("../features/viewer/workflowSidebar/WorkflowSidebar.js");

        const outsideNode = { id: 10, type: "PreviewImage" };
        const innerNode = { id: 30, type: "KSampler" };
        const subgraphNode = {
            id: 20,
            title: "Face Detailer",
            type: "12345678-1234-1234-1234-123456789abc",
            subgraph: { nodes: [innerNode] },
        };
        bridgeState.app.graph.nodes = [outsideNode, subgraphNode];

        const sidebar = new WorkflowSidebar();
        sidebar.show();

        const list = sidebar._nodesTab._list;
        const subgraphRenderer = rendererState.instances[1];
        const innerRenderer = rendererState.instances[2];
        const subgraphItem = subgraphRenderer._mjrTreeItemEl;

        expect(rendererState.constructed).toEqual([10, 20, 30]);
        expect(rendererState.options[1]).toMatchObject({ isSubgraph: true, childCount: 1 });
        expect(subgraphItem.children[0]).toBe(subgraphRenderer.el);
        expect(subgraphItem._mjrChildrenEl.children[0]).toBe(innerRenderer._mjrTreeItemEl);
        expect(subgraphItem._mjrChildrenEl.hidden).toBe(true);

        bridgeState.app.canvas.selected_nodes = { 20: subgraphNode };
        sidebar.syncFromGraph();

        expect(list.children[0]).toBe(subgraphItem);
        expect(subgraphItem.children[0]).toBe(subgraphRenderer.el);
        expect(subgraphItem._mjrChildrenEl.hidden).toBe(false);
        expect(subgraphItem._mjrChildrenEl.children[0]).toBe(innerRenderer._mjrTreeItemEl);
        expect(subgraphRenderer.el.classList.contains("is-selected-from-graph")).toBe(true);
    });

    it("throttles live sync so sidebar widgets are not refreshed on every animation frame", async () => {
        let rafCallback = null;
        document.defaultView.requestAnimationFrame = vi.fn((cb) => {
            rafCallback = cb;
            return 1;
        });
        window.requestAnimationFrame = document.defaultView.requestAnimationFrame;

        const { WorkflowSidebar } =
            await import("../features/viewer/workflowSidebar/WorkflowSidebar.js");

        const nodeA = { id: 77 };
        bridgeState.app.graph.nodes = [nodeA];

        const sidebar = new WorkflowSidebar();
        const syncSpy = vi.fn();
        sidebar.syncFromGraph = syncSpy;
        sidebar.show();
        const baselineTs = Number(sidebar._lastLiveSyncAt) || 0;

        expect(syncSpy).toHaveBeenCalledTimes(0);
        expect(typeof rafCallback).toBe("function");

        rafCallback(baselineTs + 100);
        expect(syncSpy).toHaveBeenCalledTimes(0);

        rafCallback(baselineTs + 300);
        expect(syncSpy).toHaveBeenCalledTimes(1);
    });
});
