export function createSortPopoverView() {
    const sortPopover = document.createElement("div");
    sortPopover.className = "mjr-popover mjr-sort-popover";
    sortPopover.style.display = "none";
    sortPopover.style.cssText = `
        display:none;
        border: 1px solid rgba(120,180,255,0.35);
        background: linear-gradient(180deg, rgba(16,24,36,0.96) 0%, rgba(11,16,24,0.96) 100%);
        box-shadow: 0 14px 34px rgba(0,0,0,0.42), 0 0 0 1px rgba(130,185,255,0.16) inset;
        border-radius: 12px;
        padding: 10px;
        min-width: 220px;
    `;

    const sortMenu = document.createElement("div");
    sortMenu.className = "mjr-menu";
    sortMenu.style.cssText = "display:grid; gap:6px;";
    sortPopover.appendChild(sortMenu);

    return { sortPopover, sortMenu };
}

