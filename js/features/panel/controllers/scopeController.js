export function createScopeController({
    state,
    tabButtons,
    customMenuBtn,
    customPopover,
    popovers,
    reloadGrid,
    onChanged = null,
    onScopeChanged = null,
    onBeforeReload = null,
}) {
    let scopeSwitchSeq = 0;
    const hasSimilarResults = () => {
        try {
            return !!(
                String(state?.viewScope || "")
                    .trim()
                    .toLowerCase() === "similar" ||
                (Array.isArray(state?.similarResults) && state.similarResults.length > 0) ||
                String(state?.similarTitle || "").trim()
            );
        } catch {
            return false;
        }
    };

    const resetSimilarScope = () => {
        state.viewScope = "";
        state.similarResults = [];
        state.similarTitle = "";
        state.similarSourceAssetId = "";
    };

    const setActiveTabStyles = () => {
        const buttons = Object.values(tabButtons || {});
        const activeScope = String(state?.viewScope || state?.scope || "output").toLowerCase();
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
            state.viewScope = "similar";
            setActiveTabStyles();
            try {
                onChanged?.();
            } catch (e) {
                console.debug?.(e);
            }
            try {
                await onBeforeReload?.(state);
            } catch (e) {
                console.debug?.(e);
            }
            if (requestedSeq !== scopeSwitchSeq) return;
            await reloadGrid();
            return;
        }

        // Switching scope exits any active collection view.
        state.collectionId = "";
        state.collectionName = "";
        resetSimilarScope();

        state.scope =
            normalized === "outputs" ? "output" : normalized === "inputs" ? "input" : normalized;
        // Scope switch should reset folder context to avoid stale filtering behavior.
        state.currentFolderRelativePath = "";
        if (state.scope !== "custom") {
            state.customRootId = "";
        }

        setActiveTabStyles();
        try {
            onChanged?.();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            await onScopeChanged?.(state);
        } catch (e) {
            console.debug?.(e);
        }
        if (requestedSeq !== scopeSwitchSeq) return;
        try {
            await onBeforeReload?.(state);
        } catch (e) {
            console.debug?.(e);
        }
        if (requestedSeq !== scopeSwitchSeq) return;
        await reloadGrid();
    };

    return { setScope, setActiveTabStyles, clearSimilarScope };
}
