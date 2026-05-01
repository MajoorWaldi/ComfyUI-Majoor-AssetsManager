function stringValue(value, fallback = "") {
    const text = String(value ?? fallback).trim();
    return text || String(fallback);
}

function numberValue(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function boolValue(value) {
    return value === true || value === 1 || String(value || "") === "1";
}

export function createGridQuery(input = {}) {
    const q = stringValue(input.q ?? input.query, "*") || "*";
    const hasResolutionCompare = Object.prototype.hasOwnProperty.call(input, "resolutionCompare");
    const rawResolutionCompare = hasResolutionCompare
        ? String(input.resolutionCompare ?? "").trim().toLowerCase()
        : "gte";
    const resolutionCompare = rawResolutionCompare === "lte"
        ? "lte"
        : rawResolutionCompare
          ? "gte"
          : "";

    return Object.freeze({
        scope: stringValue(input.scope, "output").toLowerCase(),
        q,
        query: q,
        customRootId: stringValue(input.customRootId),
        subfolder: stringValue(input.subfolder),
        collectionId: stringValue(input.collectionId),
        viewScope: stringValue(input.viewScope),
        kind: stringValue(input.kind).toLowerCase(),
        workflowOnly: boolValue(input.workflowOnly),
        minRating: numberValue(input.minRating, 0),
        minSizeMB: numberValue(input.minSizeMB, 0),
        maxSizeMB: numberValue(input.maxSizeMB, 0),
        resolutionCompare,
        minWidth: numberValue(input.minWidth, 0),
        minHeight: numberValue(input.minHeight, 0),
        maxWidth: numberValue(input.maxWidth, 0),
        maxHeight: numberValue(input.maxHeight, 0),
        workflowType: stringValue(input.workflowType).toUpperCase(),
        dateRange: stringValue(input.dateRange).toLowerCase(),
        dateExact: stringValue(input.dateExact),
        sort: stringValue(input.sort, "mtime_desc").toLowerCase(),
        semanticMode:
            input.semanticMode === undefined || input.semanticMode === null
                ? undefined
                : boolValue(input.semanticMode),
        groupStacks:
            input.groupStacks === undefined || input.groupStacks === null
                ? undefined
                : boolValue(input.groupStacks),
    });
}

export function readGridQueryFromDataset(dataset = {}, overrides = {}) {
    return createGridQuery({
        scope: dataset.mjrScope,
        q: dataset.mjrQuery,
        customRootId: dataset.mjrCustomRootId,
        subfolder: dataset.mjrSubfolder,
        collectionId: dataset.mjrCollectionId,
        viewScope: dataset.mjrViewScope,
        kind: dataset.mjrFilterKind,
        workflowOnly: dataset.mjrFilterWorkflowOnly,
        minRating: dataset.mjrFilterMinRating,
        minSizeMB: dataset.mjrFilterMinSizeMB,
        maxSizeMB: dataset.mjrFilterMaxSizeMB,
        resolutionCompare: dataset.mjrFilterResolutionCompare ?? "gte",
        minWidth: dataset.mjrFilterMinWidth,
        minHeight: dataset.mjrFilterMinHeight,
        maxWidth: dataset.mjrFilterMaxWidth,
        maxHeight: dataset.mjrFilterMaxHeight,
        workflowType: dataset.mjrFilterWorkflowType,
        dateRange: dataset.mjrFilterDateRange,
        dateExact: dataset.mjrFilterDateExact,
        sort: dataset.mjrSort,
        semanticMode: dataset.mjrSemanticMode,
        groupStacks: dataset.mjrGroupStacks,
        ...overrides,
    });
}

export function readGridQueryFromElement(element = null, overrides = {}) {
    return readGridQueryFromDataset(element?.dataset || {}, overrides);
}

export function readGridQueryText(element = null, fallback = "*") {
    const dataset = element?.dataset || {};
    return readGridQueryFromDataset(dataset, {
        q: dataset.mjrQuery ?? fallback,
    }).q;
}

export function readGridSortKey(element = null, fallback = "mtime_desc") {
    const dataset = element?.dataset || {};
    return readGridQueryFromDataset(dataset, {
        sort: dataset.mjrSort ?? fallback,
    }).sort;
}

export function gridQueryKey(query = {}) {
    const normalized = createGridQuery(query);
    return [
        normalized.scope,
        normalized.q,
        normalized.sort,
        normalized.customRootId,
        normalized.subfolder,
        normalized.collectionId,
        normalized.viewScope,
        normalized.kind,
        normalized.workflowOnly ? "1" : "",
        normalized.minRating || "",
        normalized.minSizeMB || "",
        normalized.maxSizeMB || "",
        normalized.resolutionCompare,
        normalized.minWidth || "",
        normalized.minHeight || "",
        normalized.maxWidth || "",
        normalized.maxHeight || "",
        normalized.workflowType,
        normalized.dateRange,
        normalized.dateExact,
        normalized.semanticMode === undefined ? "" : normalized.semanticMode ? "1" : "0",
        normalized.groupStacks === undefined ? "" : normalized.groupStacks ? "1" : "0",
    ].join("|");
}

export function gridListQueryKey(query = {}) {
    const normalized = createGridQuery(query);
    return [
        normalized.scope,
        normalized.q,
        normalized.sort,
        normalized.customRootId,
        normalized.subfolder,
        normalized.collectionId,
        normalized.kind,
        normalized.workflowOnly ? "1" : "",
        normalized.minRating || "",
        normalized.minSizeMB || "",
        normalized.maxSizeMB || "",
        normalized.resolutionCompare,
        normalized.minWidth || "",
        normalized.minHeight || "",
        normalized.maxWidth || "",
        normalized.maxHeight || "",
        normalized.workflowType,
        normalized.dateRange,
        normalized.dateExact,
    ].join("|");
}

export function gridQueryHasActiveFilters(query = {}) {
    const normalized = createGridQuery(query);
    const viewScope = normalized.viewScope && normalized.viewScope !== normalized.scope
        ? normalized.viewScope
        : "";
    return !!(
        normalized.subfolder ||
        normalized.customRootId ||
        normalized.collectionId ||
        viewScope ||
        normalized.kind ||
        normalized.workflowOnly ||
        normalized.minRating > 0 ||
        normalized.minSizeMB > 0 ||
        normalized.maxSizeMB > 0 ||
        normalized.minWidth > 0 ||
        normalized.minHeight > 0 ||
        normalized.maxWidth > 0 ||
        normalized.maxHeight > 0 ||
        normalized.workflowType ||
        normalized.dateRange ||
        normalized.dateExact
    );
}

export function isDefaultOutputBrowseQuery(query = {}) {
    const normalized = createGridQuery(query);
    return (
        normalized.scope === "output" &&
        normalized.q === "*" &&
        normalized.sort === "mtime_desc" &&
        !gridQueryHasActiveFilters(normalized)
    );
}
