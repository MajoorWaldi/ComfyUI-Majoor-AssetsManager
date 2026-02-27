export function createScopeController({
    state,
    tabButtons,
    customMenuBtn,
    customPopover,
    popovers,
    reloadGrid,
    onChanged = null,
    onScopeChanged = null,
    onBeforeReload = null
}) {
    let scopeSwitchSeq = 0;

    const setActiveTabStyles = () => {
        const buttons = Object.values(tabButtons || {});
        buttons.forEach((b) => {
            const scope = b?.dataset?.scope;
            const active = scope === state.scope;
            b?.classList?.toggle?.("is-active", active);
        });

        customMenuBtn.style.display = "none";
        customPopover.style.display = "none";
        popovers.close(customPopover);
    };

    const setScope = async (scope) => {
        const requestedSeq = ++scopeSwitchSeq;
        const allowed = new Set(["output", "outputs", "input", "inputs", "all", "custom"]);
        const normalized = String(scope || "").toLowerCase();
        if (!allowed.has(normalized)) return;

        // Switching scope exits any active collection view.
        state.collectionId = "";
        state.collectionName = "";

        state.scope = normalized === "outputs" ? "output" : normalized === "inputs" ? "input" : normalized;
        // Scope switch should reset folder context to avoid stale filtering behavior.
        state.currentFolderRelativePath = "";
        if (state.scope !== "custom") {
            state.customRootId = "";
        }

        setActiveTabStyles();
        try {
            onChanged?.();
        } catch (e) { console.debug?.(e); }
        try {
            await onScopeChanged?.(state);
        } catch (e) { console.debug?.(e); }
        if (requestedSeq !== scopeSwitchSeq) return;
        try {
            await onBeforeReload?.(state);
        } catch (e) { console.debug?.(e); }
        if (requestedSeq !== scopeSwitchSeq) return;
        await reloadGrid();
    };

    return { setScope, setActiveTabStyles };
}

