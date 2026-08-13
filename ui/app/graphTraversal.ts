type LooseRecord = Record<string, any>;

export type GraphVisit = { graph: LooseRecord; label: string };
export type GraphNodeVisit = {
    node: LooseRecord;
    graph: LooseRecord;
    label: string;
    /** ComfyUI UI-state identifier: <graph UUID>:<local id>, or the local id at root. */
    locatorId: string;
    /** Human-readable path retained for diagnostics and older Majoor state. */
    qualifiedId: string;
};

export function getHostRootGraph(app: any = null): LooseRecord | null {
    return app?.rootGraph ?? app?.graph?.rootGraph ?? app?.graph ?? app?.canvas?.graph ?? null;
}

export function getGraphNodes(graph: any): LooseRecord[] {
    if (!graph || typeof graph !== "object") return [];
    if (Array.isArray(graph.nodes)) return graph.nodes.filter(Boolean);
    if (Array.isArray(graph._nodes)) return graph._nodes.filter(Boolean);
    const byId = graph._nodes_by_id ?? graph.nodes_by_id ?? null;
    if (byId instanceof Map) return Array.from(byId.values()).filter(Boolean) as LooseRecord[];
    if (byId && typeof byId === "object") return Object.values(byId).filter(Boolean) as LooseRecord[];
    return [];
}

export function getGraphLinks(graph: any): any {
    return graph?.links ?? graph?._links ?? null;
}

export function getGraphLabel(graph: any, fallback: string): string {
    return String(graph?.name ?? graph?.title ?? graph?.id ?? fallback).trim() || fallback;
}

function _isRootGraph(graph: any): boolean {
    if (!graph || typeof graph !== "object") return false;
    return graph.isRootGraph === true || graph.rootGraph === graph;
}

export function getNodeLocatorId(node: any, graph: any = node?.graph): string {
    const nodeId = String(node?.id ?? node?.ID ?? "").trim();
    if (!nodeId) return "";
    const graphId = _isRootGraph(graph) ? "" : String(graph?.id ?? "").trim();
    return graphId ? `${graphId}:${nodeId}` : nodeId;
}

function _pushGraphVisit(out: GraphVisit[], seen: Set<any>, graph: any, label: string): void {
    if (!graph || typeof graph !== "object" || seen.has(graph)) return;
    seen.add(graph);
    out.push({ graph, label });
}

export function getGraphSubgraphs(graph: any): LooseRecord[] {
    if (!graph || typeof graph !== "object") return [];
    const source = graph.subgraphs ?? graph.definitions?.subgraphs ?? graph.workflow?.definitions?.subgraphs;
    if (!source) return [];
    if (source instanceof Map) return Array.from(source.values()).filter(Boolean) as LooseRecord[];
    if (Array.isArray(source)) return source.filter(Boolean);
    if (typeof source === "object") return Object.values(source).filter(Boolean) as LooseRecord[];
    return [];
}

export function getNodeSubgraphs(node: any): LooseRecord[] {
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
    ].filter((graph): graph is LooseRecord => Boolean(graph && typeof graph === "object" && getGraphNodes(graph).length > 0));

    if (Array.isArray(node?.nodes) && node.nodes.length > 0 && node.nodes !== node?.graph?.nodes) {
        candidates.push({ nodes: node.nodes });
    }

    return candidates;
}

function _serializedWorkflowGraphs(graph: any): GraphVisit[] {
    const workflow = typeof graph?.serialize === "function" ? graph.serialize() : null;
    const subgraphs = Array.isArray(workflow?.definitions?.subgraphs) ? workflow.definitions.subgraphs : [];
    return subgraphs.map((subgraph: LooseRecord, index: number) => ({
        graph: subgraph,
        label: `Subgraph ${getGraphLabel(subgraph, String(subgraph?.id ?? index + 1))}`,
    }));
}

export function collectGraphVisits(appOrGraph: any): GraphVisit[] {
    const root = appOrGraph?.graph || appOrGraph?.canvas || appOrGraph?.rootGraph ? getHostRootGraph(appOrGraph) : appOrGraph;
    const out: GraphVisit[] = [];
    const seen = new Set<any>();
    const stack: GraphVisit[] = [];
    _pushGraphVisit(stack, seen, root, "Workflow");
    while (stack.length) {
        const current = stack.pop();
        if (!current) continue;
        out.push(current);
        for (const subgraph of getGraphSubgraphs(current.graph)) {
            _pushGraphVisit(stack, seen, subgraph, `${current.label} / ${getGraphLabel(subgraph, "Subgraph")}`);
        }
        for (const node of getGraphNodes(current.graph)) {
            for (const subgraph of getNodeSubgraphs(node)) {
                _pushGraphVisit(
                    stack,
                    seen,
                    subgraph,
                    `${current.label} / ${String(node?.title || node?.type || "Subgraph").trim()}`,
                );
            }
        }
    }
    // `serialize()` creates fresh objects, so mixing its definitions with live
    // subgraphs duplicates every nested node. It is strictly a compatibility
    // fallback for hosts/workflows that expose no live subgraph hierarchy.
    if (out.length <= 1) {
        for (const serialized of _serializedWorkflowGraphs(root)) {
            _pushGraphVisit(out, seen, serialized.graph, serialized.label);
        }
    }
    return out;
}

export function walkGraphNodes(appOrGraph: any, callback: (visit: GraphNodeVisit) => void): void {
    for (const visit of collectGraphVisits(appOrGraph)) {
        for (const [index, node] of getGraphNodes(visit.graph).entries()) {
            const nodeId = String(node?.id ?? node?.ID ?? index).trim() || String(index);
            callback({
                node,
                graph: visit.graph,
                label: visit.label,
                locatorId: getNodeLocatorId(node, visit.graph),
                qualifiedId: `${visit.label}::${nodeId}`,
            });
        }
    }
}

export function findGraphNodeById(appOrGraph: any, nodeId: any): LooseRecord | null {
    const wanted = String(nodeId ?? "").trim();
    if (!wanted) return null;
    const root = appOrGraph?.graph || appOrGraph?.canvas || appOrGraph?.rootGraph
        ? getHostRootGraph(appOrGraph)
        : appOrGraph;
    if (!root) return null;

    const getLocalNode = (graph: any, localId: string): LooseRecord | null => {
        if (!graph) return null;
        const numericId = /^-?\d+$/.test(localId) ? Number(localId) : localId;
        try {
            const direct = graph.getNodeById?.(numericId) ?? graph.getNodeById?.(localId);
            if (direct) return direct;
        } catch (_e: any) {
            // Plain serialized graphs do not expose getNodeById.
        }
        return getGraphNodes(graph).find((node) => String(node?.id ?? node?.ID ?? "") === localId) ?? null;
    };

    // ComfyUI execution IDs are root-to-leaf node paths (`123:456:789`).
    // Traverse the concrete SubgraphNode instances, matching the official
    // frontend getNodeByExecutionId contract.
    const parts = wanted.split(":").filter(Boolean);
    if (parts.length > 1) {
        let graph: any = root;
        let validPath = true;
        for (const parentId of parts.slice(0, -1)) {
            const hostNode = getLocalNode(graph, parentId);
            const subgraph = hostNode?.subgraph ?? hostNode?._subgraph ?? null;
            if (!subgraph) {
                validPath = false;
                break;
            }
            graph = subgraph;
        }
        if (validPath) {
            const executionNode = getLocalNode(graph, parts[parts.length - 1]);
            if (executionNode) return executionNode;
        }
    }

    // Locator IDs (`<subgraph UUID>:<local id>`) remain supported for stored UI state.
    let locatorMatch: LooseRecord | null = null;
    walkGraphNodes(root, (visit) => {
        if (!locatorMatch && visit.locatorId === wanted) locatorMatch = visit.node;
    });
    if (locatorMatch) return locatorMatch;

    // An unqualified ID officially addresses the root graph. Preserve a safe
    // compatibility fallback only when exactly one nested definition matches.
    const rootMatch = getLocalNode(root, wanted);
    if (rootMatch) return rootMatch;
    const nestedMatches: LooseRecord[] = [];
    walkGraphNodes(root, ({ node, graph }) => {
        if (graph !== root && String(node?.id ?? node?.ID ?? "") === wanted) nestedMatches.push(node);
    });
    return nestedMatches.length === 1 ? nestedMatches[0] : null;
}

export function findGraphNodeByQualifiedId(appOrGraph: any, qualifiedId: any): LooseRecord | null {
    const wanted = String(qualifiedId ?? "");
    if (!wanted) return null;
    let found: LooseRecord | null = null;
    walkGraphNodes(appOrGraph, (visit) => {
        if (!found && (visit.qualifiedId === wanted || visit.locatorId === wanted)) found = visit.node;
    });
    return found;
}
