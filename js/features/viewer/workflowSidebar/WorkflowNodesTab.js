/**
 * WorkflowNodesTab lists all workflow nodes and exposes each node's parameters
 * inline through a collapsible section.
 *
 * Subgraph container nodes show an extra toggle to expand/collapse their inner
 * nodes as a nested group below the container.
 *
 * The node list DOM is only rebuilt when the set of nodes actually changes —
 * value sync runs every frame without touching the DOM structure.
 */

import { getComfyApp } from "../../../app/comfyApiBridge.js";
import { NodeWidgetRenderer } from "./NodeWidgetRenderer.js";

export class WorkflowNodesTab {
    constructor() {
        this._searchQuery = "";
        /** Which node widget panels are open (at most one at a time). */
        this._expandedNodeIds = new Set();
        /** Which subgraph container nodes have their children list open. */
        this._expandedChildrenIds = new Set();
        /** Flat list of every NodeWidgetRenderer currently in the DOM. */
        this._renderers = [];
        this._el = this._build();
        this._lastNodeSig = "";
        this._lastSelectedId = "";
    }

    get el() { return this._el; }

    refresh() {
        this._maybeRebuildList();
        for (const renderer of this._renderers) renderer.syncFromGraph();
    }

    forceRebuild() {
        this._lastNodeSig = "";
        this._maybeRebuildList();
    }

    dispose() {
        for (const renderer of this._renderers) renderer.dispose();
        this._renderers = [];
        this._el?.remove?.();
    }

    _build() {
        const wrap = document.createElement("div");
        wrap.className = "mjr-ws-nodes-tab";

        const searchWrap = document.createElement("div");
        searchWrap.className = "mjr-ws-search-wrap";

        const searchIcon = document.createElement("i");
        searchIcon.className = "pi pi-search mjr-ws-search-icon";
        searchIcon.setAttribute("aria-hidden", "true");
        searchWrap.appendChild(searchIcon);

        this._searchInput = document.createElement("input");
        this._searchInput.type = "text";
        this._searchInput.className = "mjr-ws-search";
        this._searchInput.placeholder = "Search nodes...";
        this._searchInput.addEventListener("input", () => {
            this._searchQuery = this._searchInput.value;
            this.forceRebuild();
        });
        searchWrap.appendChild(this._searchInput);

        const clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.className = "mjr-ws-search-clear";
        clearBtn.title = "Clear search";
        clearBtn.innerHTML = '<i class="pi pi-times" aria-hidden="true"></i>';
        clearBtn.addEventListener("click", () => {
            this._searchInput.value = "";
            this._searchQuery = "";
            this.forceRebuild();
        });
        searchWrap.appendChild(clearBtn);

        wrap.appendChild(searchWrap);

        this._list = document.createElement("div");
        this._list.className = "mjr-ws-nodes-list";
        wrap.appendChild(this._list);

        return wrap;
    }

    _syncCanvasSelection() {
        const selectedIds = _getSelectedNodeIds();
        const selectedId = selectedIds[0] || "";
        if (!selectedId || selectedId === this._lastSelectedId) return;
        this._lastSelectedId = selectedId;
        for (const renderer of this._renderers) {
            if (String(renderer._node?.id ?? "") === selectedId && !renderer._expanded) {
                renderer.setExpanded(true);
                break;
            }
        }
    }

    _maybeRebuildList() {
        const graph = _getGraph();
        const tree = graph ? _buildNodeTree(graph) : [];
        const q = (this._searchQuery || "").toLowerCase().trim();
        const filtered = q ? _filterTree(tree, q) : tree;
        const sig = _treeSignature(filtered);

        this._syncCanvasSelection();

        if (sig === this._lastNodeSig) return;
        this._lastNodeSig = sig;

        for (const renderer of this._renderers) renderer.dispose();
        this._renderers = [];
        this._list.innerHTML = "";

        if (!filtered.length) {
            const empty = document.createElement("div");
            empty.className = "mjr-ws-sidebar-empty";
            empty.textContent = tree.length ? "No nodes match your search" : "No nodes in workflow";
            this._list.appendChild(empty);
            return;
        }

        this._renderItems(filtered, this._list, 0);
    }

    /**
     * Recursively render tree items into a container.
     * @param {{node: object, children: object[]}[]} items
     * @param {HTMLElement} container
     * @param {number} depth
     */
    _renderItems(items, container, depth) {
        for (const { node, children } of items) {
            const nodeId = String(node?.id ?? "");

            const renderer = new NodeWidgetRenderer(node, {
                collapsible: true,
                expanded: this._expandedNodeIds.has(nodeId),
                depth,
                onLocate: () => _focusNode(node),
                onToggle: (expanded) => {
                    if (expanded) {
                        this._expandedNodeIds = new Set([nodeId]);
                        for (const r of this._renderers) {
                            if (r !== renderer) r.setExpanded(false);
                        }
                    } else {
                        this._expandedNodeIds.delete(nodeId);
                    }
                },
            });
            this._renderers.push(renderer);
            container.appendChild(renderer.el);

            if (children.length > 0) {
                const isOpen = this._expandedChildrenIds.has(nodeId);

                const toggleBtn = document.createElement("button");
                toggleBtn.type = "button";
                toggleBtn.className = "mjr-ws-children-toggle";
                if (depth > 0) toggleBtn.classList.add("mjr-ws-children-toggle--nested");
                _setChildrenToggleLabel(toggleBtn, children.length, isOpen);

                const childrenEl = document.createElement("div");
                childrenEl.className = "mjr-ws-children";
                childrenEl.hidden = !isOpen;

                this._renderItems(children, childrenEl, depth + 1);

                toggleBtn.addEventListener("click", () => {
                    const nowOpen = childrenEl.hidden;
                    childrenEl.hidden = !nowOpen;
                    if (nowOpen) this._expandedChildrenIds.add(nodeId);
                    else this._expandedChildrenIds.delete(nodeId);
                    _setChildrenToggleLabel(toggleBtn, children.length, nowOpen);
                });

                container.appendChild(toggleBtn);
                container.appendChild(childrenEl);
            }
        }
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _getGraph() {
    try {
        const app = getComfyApp();
        return app?.graph ?? app?.canvas?.graph ?? null;
    } catch { return null; }
}

function _getSubgraphsFromNode(node) {
    const candidates = [
        node?.subgraph,
        node?._subgraph,
        node?.subgraph?.graph,
        node?.subgraph?.lgraph,
        node?.properties?.subgraph,
        node?.subgraph_instance,
        node?.subgraph_instance?.graph,
        node?.inner_graph,
        node?.subgraph_graph,
    ].filter((g) => g && typeof g === "object" && Array.isArray(g.nodes));

    // Some GROUP-style nodes expose inner nodes directly as node.nodes
    // (a different array from the parent graph's nodes).
    if (
        Array.isArray(node?.nodes) &&
        node.nodes.length > 0 &&
        node.nodes !== node?.graph?.nodes
    ) {
        candidates.push({ nodes: node.nodes });
    }

    return candidates;
}

/**
 * Build a recursive tree: [{node, children}] from a LiteGraph graph object.
 */
function _buildNodeTree(graph, visited = new Set()) {
    if (!graph || visited.has(graph)) return [];
    visited.add(graph);
    const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
    const result = [];
    for (const node of nodes) {
        if (!node) continue;
        const subgraphs = _getSubgraphsFromNode(node);
        const children = subgraphs.flatMap((sg) => _buildNodeTree(sg, visited));
        result.push({ node, children });
    }
    return result;
}

/**
 * Recursively filter tree items. A container is kept if it matches OR any child matches.
 */
function _filterTree(items, q) {
    const result = [];
    for (const { node, children } of items) {
        const nodeMatches =
            (node.type || "").toLowerCase().includes(q) ||
            (node.title || "").toLowerCase().includes(q);
        const filteredChildren = _filterTree(children, q);
        if (nodeMatches || filteredChildren.length > 0) {
            result.push({ node, children: filteredChildren });
        }
    }
    return result;
}

/** Depth-first signature of all node IDs — encodes both set and tree order. */
function _treeSignature(items) {
    const ids = [];
    function collect(arr) {
        for (const { node, children } of arr) {
            ids.push(node.id);
            collect(children);
        }
    }
    collect(items);
    return ids.join(",");
}

function _setChildrenToggleLabel(btn, count, isOpen) {
    const icon = isOpen ? "pi-chevron-down" : "pi-chevron-right";
    btn.innerHTML = `<i class="pi ${icon}" aria-hidden="true"></i><span>${count} inner node${count !== 1 ? "s" : ""}</span>`;
    btn.setAttribute("aria-expanded", String(isOpen));
}

function _focusNode(node) {
    try {
        const app = getComfyApp();
        const canvas = app?.canvas;
        if (!canvas) return;

        canvas.selectNode?.(node, false);

        if (typeof canvas.centerOnNode === "function") {
            canvas.centerOnNode(node);
        } else if (node.pos && canvas.ds) {
            const canvasEl = canvas.canvas;
            const w = canvasEl?.width ?? 800;
            const h = canvasEl?.height ?? 600;
            const scale = canvas.ds.scale ?? 1;
            canvas.ds.offset = [
                -node.pos[0] + w / (2 * scale) - ((node.size?.[0] ?? 100) / 2),
                -node.pos[1] + h / (2 * scale) - ((node.size?.[1] ?? 80) / 2),
            ];
            canvas.setDirty?.(true, true);
        }

        canvas.canvas?.focus?.();
    } catch (e) {
        console.debug?.("[MFV] _focusNode", e);
    }
}

function _getSelectedNodeIds() {
    try {
        const app = getComfyApp();
        const selected = app?.canvas?.selected_nodes ?? app?.canvas?.selectedNodes ?? null;
        if (!selected) return [];
        if (Array.isArray(selected)) return selected.map((node) => String(node?.id ?? "")).filter(Boolean);
        if (selected instanceof Map) {
            return Array.from(selected.values()).map((node) => String(node?.id ?? "")).filter(Boolean);
        }
        if (typeof selected === "object") {
            return Object.values(selected).map((node) => String(node?.id ?? "")).filter(Boolean);
        }
    } catch (e) {
        console.debug?.("[MFV] _getSelectedNodeIds", e);
    }
    return [];
}
