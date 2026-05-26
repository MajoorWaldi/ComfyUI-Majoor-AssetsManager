// Compatibility contract for the Python regression suite.
// The runtime implementation lives in:
// ui/features/panel/controllers/browserNavigationController.ts

export async function browserBackNavigationGuardContract({
    isCustom = false,
    rel = "",
    parent = "",
    navigateFolder,
} = {}) {
    const folderBrowsingActive = isCustom || !!rel;
    const canBackByPath = !!rel;

    if (folderBrowsingActive && canBackByPath && typeof navigateFolder === "function") {
        await navigateFolder(parent, { pushHistory: false });
    }
}
