import { createPanelStateBridge } from "../../../stores/panelStateBridge.js";

export function createScopeController({
    state,
    tabButtons,
    customMenuBtn,
    customPopover,
    popovers,
    reloadGrid,
    reconcileSelection = null,
    onChanged = null,
    onScopeChanged = null,
    onBeforeReload = null,
}) {
    let scopeSwitchSeq = 0;
    const {
        panelStore,
        read: readState,
        write: writeState,
        controllerState: getControllerState,
    } = createPanelStateBridge(state, [
        "scope",
        "customRootId",
        "currentFolderRelativePath",
        "collectionId",
        "collectionName",
        "viewScope",
        "similarResults",
        "similarTitle",
        "similarSourceAssetId",
    ]);

    const syncVirtualSimilarState = ({
        viewScope = "",
        similarResults = [],
        similarTitle = "",
        similarSourceAssetId = "",
    } = {}) => {
        writeState("viewScope", viewScope);
        writeState("similarResults", similarResults);
        writeState("similarTitle", similarTitle);
        writeState("similarSourceAssetId", similarSourceAssetId);
    };

    const hasSimilarResults = () => {
        try {
            return !!(
                String(readState("viewScope", "") || "")
                    .trim()
                    .toLowerCase() === "similar" ||
                (Array.isArray(readState("similarResults", [])) &&
                    readState("similarResults", []).length > 0) ||
                String(readState("similarTitle", "") || "").trim()
            );
        } catch {
            return false;
        }
    };

    const resetSimilarScope = () => {
        syncVirtualSimilarState();
    };

    const setActiveTabStyles = () => {
        const buttons = Object.values(tabButtons || {});
        const activeScope = String(
            readState("viewScope", "") || readState("scope", "output"),
        ).toLowerCase();
        buttons.forEach((b) => {
            const scope = b?.dataset?.scope;
            const active = scope === activeScope;
            b?.classList?.toggle?.("is-active", active);
        });
        try {
            const similarBtn = tabButtons?.tabSimilar;
            if (similarBtn) {
                similarBtn.style.display = hasSimilarResults() ? "" : "none";
            }
        } catch (e) {
            console.debug?.(e);
        }

        customMenuBtn.style.display = "none";
        customPopover.style.display = "none";
        popovers.close(customPopover);
    };

    const clearSimilarScope = async ({ reload = true } = {}) => {
        const hadSimilar = hasSimilarResults();
        resetSimilarScope();
        // Clear stale search query when exiting similar view to avoid
        // applying it to the scope the user returns to.
        writeState("searchQuery", "");
        setActiveTabStyles();
        try {
            onChanged?.();
        } catch (e) {
            console.debug?.(e);
        }
        if (!hadSimilar || !reload) return;
        await reloadGrid();
    };

    const setScope = async (scope) => {
        const requestedSeq = ++scopeSwitchSeq;
        const allowed = new Set([
            "output",
            "outputs",
            "input",
            "inputs",
            "all",
            "custom",
            "similar",
        ]);
        const normalized = String(scope || "").toLowerCase();
        if (!allowed.has(normalized)) return;

        if (normalized === "similar") {
            if (!hasSimilarResults()) return;
            writeState("viewScope", "similar");
            setActiveTabStyles();
            try {
                onChanged?.();
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await onBeforeReload?.(getControllerState());
            } catch (e) {
                console.debug?.(e);
            }
            await reloadGrid();
            return;
        }

        // Switching scope exits any active collection view and clears
        // the search query so the new scope starts with a clean browse.
        writeState("collectionId", "");
        writeState("collectionName", "");
        writeState("searchQuery", "");
        resetSimilarScope();

        const nextScope =
            normalized === "outputs" ? "output" : normalized === "inputs" ? "input" : normalized;
        if (panelStore?.navigateToScope) {
            try {
                panelStore.navigateToScope(nextScope, { folder: "" });
            } catch (e) {
                console.debug?.(e);
                writeState("scope", nextScope);
                writeState("currentFolderRelativePath", "");
            }
        } else {
            writeState("scope", nextScope);
            writeState("currentFolderRelativePath", "");
        }
        // Scope switch should reset folder context to avoid stale filtering behavior.
        if (String(readState("scope", nextScope)) !== "custom") {
            writeState("customRootId", "");
        }

        setActiveTabStyles();
        try {
            onChanged?.();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            await onScopeChanged?.(getControllerState());
        } catch (e) {
            console.debug?.(e);
        }
        if (requestedSeq !== scopeSwitchSeq) return;
        try {
            await onBeforeReload?.(getControllerState());
        } catch (e) {
            console.debug?.(e);
        }
        if (requestedSeq !== scopeSwitchSeq) return;
        try {
            reconcileSelection?.();
        } catch (e) {
            console.debug?.(e);
        }
        await reloadGrid();
    };

    return { setScope, setActiveTabStyles, clearSimilarScope };
}
