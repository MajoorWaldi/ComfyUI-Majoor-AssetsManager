export function createSortPopoverView() {
    const sortPopover = document.createElement("div");
    sortPopover.className = "mjr-popover mjr-sort-popover";
    sortPopover.style.display = "none";

    const sortMenu = document.createElement("div");
    sortMenu.className = "mjr-menu";
    sortPopover.appendChild(sortMenu);

    return { sortPopover, sortMenu };
}

