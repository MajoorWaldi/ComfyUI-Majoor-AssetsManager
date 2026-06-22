import { t } from "../../../app/i18n.js";

const tx = (key: string, fallback = ""): string => t(key, fallback, undefined);

interface SummaryGridContainer {
    dataset?: Record<string, any>;
    _mjrGetRenderedCards?: () => unknown;
}

interface SummaryPanelState {
    lastGridCount?: unknown;
    lastGridTotal?: unknown;
    selectedAssetIds?: unknown;
    scope?: unknown;
    viewScope?: unknown;
}

interface DuplicatesAlert {
    exactCount?: unknown;
    similarCount?: unknown;
}

interface SummaryContext {
    rawQuery?: unknown;
    duplicatesAlert?: DuplicatesAlert | null;
}

interface SummaryBarStateOptions {
    state?: SummaryPanelState | null;
    gridContainer?: SummaryGridContainer | null;
    context?: SummaryContext | null;
}

const safeText = (value: any): string => {
    try {
        return String(value ?? "");
    } catch {
        return "";
    }
};

const titleScope = (scope: any): string => {
    const normalized = String(scope || "").toLowerCase();
    if (normalized === "similar") return tx("scope.similar", "Similar");
    if (normalized === "workflow") return tx("scope.workflow", "Workflow");
    if (normalized === "input" || normalized === "inputs") return tx("scope.input");
    if (normalized === "custom") return tx("scope.customBrowser");
    if (normalized === "all") return tx("tab.all");
    return tx("scope.output");
};

function readRenderedCards(gridContainer?: SummaryGridContainer | null): unknown[] {
    try {
        const getter = gridContainer?._mjrGetRenderedCards;
        if (typeof getter === "function") {
            const cards = getter();
            return Array.isArray(cards) ? cards : [];
        }
    } catch (e) {
        console.debug?.(e);
    }
    return [];
}

function selectedCountFromDataset(gridContainer?: SummaryGridContainer | null): number {
    try {
        const rawList = String(gridContainer?.dataset?.mjrSelectedAssetIds || "").trim();
        if (rawList) {
            const parsed = JSON.parse(rawList);
            if (Array.isArray(parsed)) return parsed.length;
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const activeId = String(gridContainer?.dataset?.mjrSelectedAssetId || "").trim();
        if (activeId) return 1;
    } catch (e) {
        console.debug?.(e);
    }
    return 0;
}

export function buildSummaryBarState({
    state,
    gridContainer,
    context = null,
}: SummaryBarStateOptions = {}) {
    const cards = readRenderedCards(gridContainer);

    const folderStats = (() => {
        try {
            let folders = 0;
            for (const card of cards) {
                const row = card as { _mjrAsset?: { kind?: unknown } } | null;
                const kind = String(row?._mjrAsset?.kind || "").toLowerCase();
                if (kind === "folder") folders += 1;
            }
            return { total: cards.length, folders };
        } catch {
            return { total: 0, folders: 0 };
        }
    })();

    const cardsCount = Number(cards.length || 0) || 0;
    const selectedCount = (() => {
        try {
            const fromState = Array.isArray(state?.selectedAssetIds) ? state.selectedAssetIds.length : 0;
            if (fromState > 0) return fromState;
        } catch (e) {
            console.debug?.(e);
        }
        return selectedCountFromDataset(gridContainer);
    })();

    const datasetTotal = Number(gridContainer?.dataset?.mjrTotal || 0) || 0;
    const total = datasetTotal || Math.max(0, Number(state?.lastGridTotal ?? 0) || 0);

    const datasetShown = Number(gridContainer?.dataset?.mjrShown || 0) || 0;
    const shown = datasetShown || Math.max(0, Number(state?.lastGridCount ?? 0) || 0) || cardsCount;

    const activeScope = String(
        state?.viewScope || state?.scope || gridContainer?.dataset?.mjrScope || "output",
    ).toLowerCase();

    const countPart = total && total >= shown ? `${shown}/${total}` : `${shown}`;
    const primaryLabel =
        shown > 0 && folderStats.total > 0 && folderStats.folders === folderStats.total
            ? tx("summary.folders")
            : tx("summary.assets");

    const parts = [`${primaryLabel}: ${countPart}`];
    if (selectedCount > 0) parts.push(`${tx("summary.selected")}: ${selectedCount}`);
    parts.push(titleScope(activeScope));

    try {
        const hidden = Number(gridContainer?.dataset?.mjrHiddenPngSiblings || 0) || 0;
        const enabled = String(gridContainer?.dataset?.mjrHidePngSiblingsEnabled || "") === "1";
        if (enabled && hidden > 0) parts.push(`${tx("summary.hidden")}: ${hidden}`);
    } catch (e) {
        console.debug?.(e);
    }

    const duplicatesAlert = context?.duplicatesAlert || null;
    const exact = Number(duplicatesAlert?.exactCount || 0) || 0;
    const similar = Number(duplicatesAlert?.similarCount || 0) || 0;
    const showDuplicates = activeScope !== "similar" && (exact > 0 || similar > 0);

    return {
        shown,
        total,
        activeScope,
        summaryText: parts.filter(Boolean).join(" | "),
        duplicateText: showDuplicates
            ? `${tx("summary.duplicates")}: ${exact} | ${tx("summary.similar")}: ${similar}`
            : "",
        showDuplicates,
        rawQuery: safeText(context?.rawQuery || "").trim(),
    };
}
