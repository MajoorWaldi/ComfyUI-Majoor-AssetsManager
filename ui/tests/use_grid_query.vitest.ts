import { describe, expect, it } from "vitest";

import {
    createGridQuery,
    gridQueryHasActiveFilters,
    gridQueryKey,
    gridListQueryKey,
    isDefaultOutputBrowseQuery,
    readGridQueryFromDataset,
    readGridQueryFromElement,
    readGridQueryText,
    readGridSortKey,
} from "../vue/grid/useGridQuery.js";

describe("useGridQuery helpers", () => {
    it("normalizes an immutable grid query", () => {
        const query = createGridQuery({
            scope: "Output",
            q: "  portrait  ",
            kind: "Image",
            minRating: "4",
            workflowOnly: "1",
            sort: "MTIME_DESC",
            semanticMode: true,
        });

        expect(Object.isFrozen(query)).toBe(true);
        expect(query).toMatchObject({
            scope: "output",
            q: "portrait",
            query: "portrait",
            kind: "image",
            minRating: 4,
            workflowOnly: true,
            sort: "mtime_desc",
            semanticMode: true,
        });
    });

    it("leaves UI-only booleans absent unless explicitly provided", () => {
        const query = createGridQuery();

        expect(query.semanticMode).toBeUndefined();
        expect(query.groupStacks).toBeUndefined();
    });

    it("reads all grid filter fields from a DOM dataset shape", () => {
        const query = readGridQueryFromDataset({
            mjrScope: "custom",
            mjrQuery: "cat",
            mjrCustomRootId: "root-a",
            mjrSubfolder: "animals",
            mjrCollectionId: "collection-a",
            mjrViewScope: "folder",
            mjrFilterKind: "video",
            mjrFilterWorkflowOnly: "1",
            mjrFilterMinRating: "3",
            mjrFilterMinSizeMB: "10",
            mjrFilterMaxSizeMB: "20",
            mjrFilterResolutionCompare: "lte",
            mjrFilterMinWidth: "512",
            mjrFilterMinHeight: "512",
            mjrFilterMaxWidth: "2048",
            mjrFilterMaxHeight: "2048",
            mjrFilterWorkflowType: "t2i",
            mjrFilterDateRange: "TODAY",
            mjrFilterDateExact: "2026-04-30",
            mjrSort: "name_asc",
            mjrSemanticMode: "1",
            mjrGroupStacks: "1",
        });

        expect(query).toMatchObject({
            scope: "custom",
            q: "cat",
            customRootId: "root-a",
            subfolder: "animals",
            collectionId: "collection-a",
            viewScope: "folder",
            kind: "video",
            workflowOnly: true,
            minRating: 3,
            minSizeMB: 10,
            maxSizeMB: 20,
            resolutionCompare: "lte",
            minWidth: 512,
            minHeight: 512,
            maxWidth: 2048,
            maxHeight: 2048,
            workflowType: "T2I",
            dateRange: "today",
            dateExact: "2026-04-30",
            sort: "name_asc",
            semanticMode: true,
            groupStacks: true,
        });
    });

    it("bridges query and sort reads from a grid element", () => {
        const element = {
            dataset: {
                mjrQuery: "  fox  ",
                mjrSort: "NAME_DESC",
                mjrScope: "output",
            },
        };

        expect(readGridQueryFromElement(element)).toMatchObject({ q: "fox", sort: "name_desc" });
        expect(readGridQueryText(element, "*")).toBe("fox");
        expect(readGridSortKey(element, "mtime_desc")).toBe("name_desc");
        expect(readGridQueryText(null, "fallback")).toBe("fallback");
    });

    it("detects default output browse and stable query keys", () => {
        const defaultQuery = createGridQuery();
        const filteredQuery = createGridQuery({ minRating: 5 });

        expect(isDefaultOutputBrowseQuery(defaultQuery)).toBe(true);
        expect(gridQueryHasActiveFilters(defaultQuery)).toBe(false);
        expect(isDefaultOutputBrowseQuery(filteredQuery)).toBe(false);
        expect(gridQueryHasActiveFilters(filteredQuery)).toBe(true);
        expect(gridQueryKey(defaultQuery)).toBe(gridQueryKey(createGridQuery({ q: "*" })));
    });

    it("does not treat UI-only modes as active search filters", () => {
        const groupedDefaultOutput = createGridQuery({
            scope: "output",
            q: "*",
            sort: "mtime_desc",
            viewScope: "output",
            semanticMode: true,
            groupStacks: true,
        });

        expect(gridQueryHasActiveFilters(groupedDefaultOutput)).toBe(false);
        expect(isDefaultOutputBrowseQuery(groupedDefaultOutput)).toBe(true);
    });

    it("treats a virtual view scope as an active filter", () => {
        const similarView = createGridQuery({ scope: "output", viewScope: "similar" });

        expect(gridQueryHasActiveFilters(similarView)).toBe(true);
        expect(isDefaultOutputBrowseQuery(similarView)).toBe(false);
    });

    it("builds the list key used by early fetch without UI-only fields", () => {
        const query = createGridQuery({
            scope: "output",
            q: "*",
            sort: "mtime_desc",
            viewScope: "folder",
            semanticMode: true,
            groupStacks: true,
        });

        expect(gridListQueryKey(query)).toBe([
            "output",
            "*",
            "mtime_desc",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "gte",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ].join("|"));
        expect(gridQueryKey(query)).not.toBe(gridListQueryKey(query));
    });
});
