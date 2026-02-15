export function createPinnedFoldersPopoverView() {
    const pinnedFoldersPopover = document.createElement("div");
    pinnedFoldersPopover.className = "mjr-popover mjr-pinned-folders-popover";
    pinnedFoldersPopover.style.display = "none";
    pinnedFoldersPopover.style.cssText = "display:none;";

    const pinnedFoldersMenu = document.createElement("div");
    pinnedFoldersMenu.className = "mjr-menu";
    pinnedFoldersMenu.style.cssText = "display:grid; gap:6px;";
    pinnedFoldersPopover.appendChild(pinnedFoldersMenu);

    return { pinnedFoldersPopover, pinnedFoldersMenu };
}

