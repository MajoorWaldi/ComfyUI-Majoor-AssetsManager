export function createCollectionsPopoverView() {
    const collectionsPopover = document.createElement("div");
    collectionsPopover.className = "mjr-popover mjr-collections-popover";
    collectionsPopover.style.display = "none";
    collectionsPopover.style.cssText = `
        display:none;
        border: 1px solid rgba(120,180,255,0.35);
        background: linear-gradient(180deg, rgba(16,24,36,0.96) 0%, rgba(11,16,24,0.96) 100%);
        box-shadow: 0 14px 34px rgba(0,0,0,0.42), 0 0 0 1px rgba(130,185,255,0.16) inset;
        border-radius: 12px;
        padding: 10px;
        min-width: 280px;
    `;

    const collectionsMenu = document.createElement("div");
    collectionsMenu.className = "mjr-menu";
    collectionsMenu.style.cssText = "display:grid; gap:6px;";
    collectionsPopover.appendChild(collectionsMenu);

    return { collectionsPopover, collectionsMenu };
}

