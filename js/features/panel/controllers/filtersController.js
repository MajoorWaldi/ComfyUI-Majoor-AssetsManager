export function bindFilters({ state, kindSelect, wfCheckbox, ratingSelect, reloadGrid }) {
    kindSelect.addEventListener("change", async () => {
        state.kindFilter = kindSelect.value || "";
        await reloadGrid();
    });
    wfCheckbox.addEventListener("change", async () => {
        state.workflowOnly = Boolean(wfCheckbox.checked);
        await reloadGrid();
    });
    ratingSelect.addEventListener("change", async () => {
        state.minRating = Number(ratingSelect.value || 0) || 0;
        await reloadGrid();
    });
}

