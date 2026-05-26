type LooseRecord = Record<string, any>;

export type GraphVisit = { graph: LooseRecord; label: string };
export type GraphNodeVisit = { node: LooseRecord; graph: LooseRecord; label: string };

export function getHostRootGraph(app: any): LooseRecord | null {
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
    for (const serialized of _serializedWorkflowGraphs(root)) {
        _pushGraphVisit(out, seen, serialized.graph, serialized.label);
    }
    return out;
}

export function walkGraphNodes(appOrGraph: any, callback: (visit: GraphNodeVisit) => void): void {
    for (const visit of collectGraphVisits(appOrGraph)) {
        for (const node of getGraphNodes(visit.graph)) {
            callback({ node, graph: visit.graph, label: visit.label });
        }
    }
}

export function findGraphNodeById(appOrGraph: any, nodeId: any): LooseRecord | null {
    const wanted = String(nodeId ?? "");
    if (!wanted) return null;
    let found: LooseRecord | null = null;
    walkGraphNodes(appOrGraph, ({ node }) => {
        if (!found && String(node?.id ?? "") === wanted) found = node;
    });
    return found;
}
