import { describe, expect, it, vi } from "vitest";

import {
    collectGraphVisits,
    findGraphNodeByQualifiedId,
    getNodeLocatorId,
    walkGraphNodes,
} from "../app/graphTraversal.js";

describe("graphTraversal", () => {
    it("uses official locator IDs while retaining readable qualified paths", () => {
        const childNode = { id: 7, type: "MajoorSaveImage" };
        const childGraph = { id: "graph-uuid", name: "Nested", nodes: [childNode] };
        const rootNode = { id: 2, title: "Group", subgraph: childGraph };
        const root = { nodes: [rootNode] };
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
});
