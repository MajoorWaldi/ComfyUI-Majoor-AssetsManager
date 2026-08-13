import { describe, expect, it, vi } from "vitest";

import {
    collectGraphVisits,
    findGraphNodeById,
    findGraphNodeByQualifiedId,
    getNodeLocatorId,
    walkGraphNodes,
} from "../app/graphTraversal.js";

describe("graphTraversal", () => {
    it("uses official locator IDs while retaining readable qualified paths", () => {
        const childNode = { id: 7, type: "MajoorSaveImage" };
        const childGraph = { id: "graph-uuid", name: "Nested", nodes: [childNode] };
        const rootNode = { id: 2, title: "Group", subgraph: childGraph };
        const root = { id: "00000000-0000-0000-0000-000000000000", isRootGraph: true, nodes: [rootNode] };
        const visits: any[] = [];

        walkGraphNodes(root, (visit) => visits.push(visit));

        expect(getNodeLocatorId(rootNode, root)).toBe("2");
        expect(getNodeLocatorId(childNode, childGraph)).toBe("graph-uuid:7");
        expect(visits.find((visit) => visit.node === childNode)).toMatchObject({
            locatorId: "graph-uuid:7",
            qualifiedId: "Workflow / Group::7",
        });
        expect(findGraphNodeByQualifiedId(root, "graph-uuid:7")).toBe(childNode);
    });

    it("includes serialized subgraph definitions when live instances are unavailable", () => {
        const serialized = {
            id: "serialized-uuid",
            name: "Stored",
            nodes: [{ id: 3, type: "MajoorSaveVideo" }],
        };
        const root = {
            nodes: [],
            serialize: vi.fn(() => ({ definitions: { subgraphs: [serialized] } })),
        };

        expect(collectGraphVisits(root).map((visit) => visit.graph)).toContain(serialized);
    });

    it("resolves hierarchical execution IDs through concrete subgraph nodes", () => {
        const leaf = { id: 9, type: "PreviewImage" };
        const nested = { id: "nested-uuid", nodes: [leaf] };
        const child = { id: 7, subgraph: nested };
        const childGraph = { id: "child-uuid", nodes: [child] };
        const host = { id: 3, subgraph: childGraph };
        const rootLeafWithSameLocalId = { id: 9, type: "RootPreview" };
        const root = { isRootGraph: true, nodes: [host, rootLeafWithSameLocalId] };

        expect(findGraphNodeById(root, "3:7:9")).toBe(leaf);
        expect(findGraphNodeById(root, "child-uuid:7")).toBe(child);
        expect(findGraphNodeById(root, "9")).toBe(rootLeafWithSameLocalId);
    });

    it("does not append serialized duplicates when live subgraphs are available", () => {
        const live = { id: "shared-uuid", nodes: [{ id: 4 }] };
        const serialized = { id: "shared-uuid", nodes: [{ id: 4 }] };
        const root = {
            isRootGraph: true,
            nodes: [{ id: 1, subgraph: live }],
            serialize: vi.fn(() => ({ definitions: { subgraphs: [serialized] } })),
        };

        const graphs = collectGraphVisits(root).map((visit) => visit.graph);
        expect(graphs).toContain(live);
        expect(graphs).not.toContain(serialized);
    });
});
