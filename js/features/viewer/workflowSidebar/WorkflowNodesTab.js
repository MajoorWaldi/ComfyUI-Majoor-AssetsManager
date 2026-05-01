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

import { getRawHostApp } from "../../../app/hostAdapter.js";
import { NodeWidgetRenderer } from "./NodeWidgetRenderer.js";

const getComfyApp = () => getRawHostApp();

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

    get el() {
        return this._el;
    }

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
        // Toggle the highlight class on every render so it survives DOM
        // rebuilds (signature changes after adding/removing a node).
        let target = null;
        for (const renderer of this._renderers) {
            const isSelected = String(renderer._node?.id ?? "") === selectedId;
            renderer.el?.classList?.toggle("is-selected-from-graph", isSelected);
            if (isSelected) target = renderer;
        }
        if (!selectedId) {
            this._lastSelectedId = "";
            return;
        }
        if (selectedId === this._lastSelectedId) return;
        this._lastSelectedId = selectedId;
        if (!target) return;
        if (!target._expanded) target.setExpanded(true);
        // Promote the selected node to the first position of its container.
        // For nested nodes, that's the top of their parent subgraph group;
        // top-level nodes go to the very top of the sidebar list. Order
        // resets naturally on the next full rebuild (graph topology change).
        try {
            const itemEl = target._mjrTreeItemEl || target.el;
            this._openTreeBranch(itemEl);
            const parent = itemEl?.parentElement;
            if (parent && parent.firstElementChild !== itemEl) {
                parent.insertBefore(itemEl, parent.firstElementChild);
            }
            target.el?.scrollIntoView({ block: "start", inline: "nearest" });
        } catch (e) {
            console.debug?.("[MFV] promote selected node failed", e);
        }
    }

    _maybeRebuildList() {
        const tree = _buildNodeTree(_getGraph());
        const q = (this._searchQuery || "").toLowerCase().trim();
        const filtered = q ? _filterTree(tree, q) : tree;
        const sig = _treeSignature(filtered);

        if (sig === this._lastNodeSig) {
            this._syncCanvasSelection();
            return;
        }
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

        this._renderItems(filtered, this._list, 0, null);
        this._syncCanvasSelection();
    }

    /**
     * Recursively render tree items into a container.
     * @param {{node: object, children: object[]}[]} items
     * @param {HTMLElement} container
     * @param {number} depth
     */
    _renderItems(items, container, depth, parentItem) {
        for (const { node, children } of items) {
            const nodeId = String(node?.id ?? "");
            const childCount = children.length;

            const itemEl = document.createElement("div");
            itemEl.className = "mjr-ws-tree-item";
            itemEl.dataset.nodeId = nodeId;
            itemEl._mjrNodeId = nodeId;
            itemEl._mjrParentTreeItem = parentItem || null;
            if (childCount > 0) itemEl.classList.add("mjr-ws-tree-item--subgraph");
            if (depth > 0) itemEl.classList.add("mjr-ws-tree-item--nested");

            const renderer = new NodeWidgetRenderer(node, {
                collapsible: true,
                expanded: this._expandedNodeIds.has(nodeId),
                depth,
                isSubgraph: childCount > 0,
                childCount,
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
            renderer._mjrTreeItemEl = itemEl;
            this._renderers.push(renderer);
            itemEl.appendChild(renderer.el);

            if (childCount > 0) {
                const isOpen = this._expandedChildrenIds.has(nodeId);

                const toggleBtn = document.createElement("button");
                toggleBtn.type = "button";
                toggleBtn.className = "mjr-ws-children-toggle";
                if (depth > 0) toggleBtn.classList.add("mjr-ws-children-toggle--nested");
                _setChildrenToggleLabel(toggleBtn, childCount, isOpen);

                const childrenEl = document.createElement("div");
                childrenEl.className = "mjr-ws-children";
                childrenEl.hidden = !isOpen;
                itemEl._mjrChildrenToggle = toggleBtn;
                itemEl._mjrChildrenEl = childrenEl;
                itemEl._mjrChildCount = childCount;

                this._renderItems(children, childrenEl, depth + 1, itemEl);

                toggleBtn.addEventListener("click", () => {
                    this._setTreeItemChildrenOpen(itemEl, childrenEl.hidden);
                });

                itemEl.appendChild(toggleBtn);
                itemEl.appendChild(childrenEl);
            }

            container.appendChild(itemEl);
        }
    }

    _setTreeItemChildrenOpen(itemEl, open) {
        if (!itemEl?._mjrChildrenEl || !itemEl?._mjrChildrenToggle) return;
        const nodeId = String(itemEl._mjrNodeId || "");
        itemEl._mjrChildrenEl.hidden = !open;
        if (nodeId) {
            if (open) this._expandedChildrenIds.add(nodeId);
            else this._expandedChildrenIds.delete(nodeId);
        }
        _setChildrenToggleLabel(
            itemEl._mjrChildrenToggle,
            Number(itemEl._mjrChildCount) || 0,
            open,
        );
    }

    _openTreeBranch(itemEl) {
        let current = itemEl || null;
        while (current) {
            const parent = current._mjrParentTreeItem || null;
            if (parent) this._setTreeItemChildrenOpen(parent, true);
            current = parent;
        }
        this._setTreeItemChildrenOpen(itemEl, true);
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _getGraph() {
    try {
        const app = getComfyApp();
        return app?.graph ?? app?.canvas?.graph ?? null;
    } catch {
        return null;
    }
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
    ].filter((g) => g && typeof g === "object" && _getGraphNodes(g).length > 0);

    // Some GROUP-style nodes expose inner nodes directly as node.nodes
    // (a different array from the parent graph's nodes).
    if (Array.isArray(node?.nodes) && node.nodes.length > 0 && node.nodes !== node?.graph?.nodes) {
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
    const nodes = _getGraphNodes(graph);
    const result = [];
    for (const node of nodes) {
        if (!node) continue;
        const subgraphs = _getSubgraphsFromNode(node);
        const children = subgraphs.flatMap((sg) => _buildNodeTree(sg, visited));
        result.push({ node, children });
    }
    return result;
}

function _getGraphNodes(graph) {
    if (!graph || typeof graph !== "object") return [];

    if (Array.isArray(graph.nodes)) return graph.nodes.filter(Boolean);
    if (Array.isArray(graph._nodes)) return graph._nodes.filter(Boolean);

    const byId = graph._nodes_by_id ?? graph.nodes_by_id ?? null;
    if (byId instanceof Map) return Array.from(byId.values()).filter(Boolean);
    if (byId && typeof byId === "object") return Object.values(byId).filter(Boolean);

    return [];
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
            ids.push("[");
            collect(children);
            ids.push("]");
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
                -node.pos[0] + w / (2 * scale) - (node.size?.[0] ?? 100) / 2,
                -node.pos[1] + h / (2 * scale) - (node.size?.[1] ?? 80) / 2,
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
        if (Array.isArray(selected))
            return selected.map((node) => String(node?.id ?? "")).filter(Boolean);
        if (selected instanceof Map) {
            return Array.from(selected.values())
                .map((node) => String(node?.id ?? ""))
                .filter(Boolean);
        }
        if (typeof selected === "object") {
            return Object.values(selected)
                .map((node) => String(node?.id ?? ""))
                .filter(Boolean);
        }
    } catch (e) {
        console.debug?.("[MFV] _getSelectedNodeIds", e);
    }
    return [];
}
