/**
 * Folder Card Component
 * @ts-check
 */

export function createFolderCard(asset) {
    const card = document.createElement("div");
    card.className = "mjr-asset-card mjr-card mjr-folder-card";
    card.draggable = false;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Folder ${asset?.filename || ""}`);
    card.setAttribute("aria-selected", "false");

    if (asset?.id != null) {
        try {
            card.dataset.mjrAssetId = String(asset.id);
        } catch {}
    }

    const filename = String(asset?.filename || "");
    try {
        card.dataset.mjrFilenameKey = filename.trim().toLowerCase();
        card.dataset.mjrExt = "FOLDER";
        card.dataset.mjrStem = filename.trim().toLowerCase();
    } catch {}

    const thumb = document.createElement("div");
    thumb.className = "mjr-thumb";
    thumb.style.display = "flex";
    thumb.style.alignItems = "center";
    thumb.style.justifyContent = "center";
    thumb.innerHTML = `
        <svg width="64" height="64" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#F4C74A" d="M10 4l2 2h8a2 2 0 0 1 2 2v1H2V6a2 2 0 0 1 2-2h6z"></path>
            <path fill="#D9A730" d="M2 9h22l-2 9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9z"></path>
        </svg>
    `;

    card._mjrAsset = asset;
    card.appendChild(thumb);

    const info = document.createElement("div");
    info.classList.add("mjr-card-info", "mjr-card-meta");
    info.style.cssText = "position: relative; padding: 6px 8px; min-width: 0;";

    const filenameDiv = document.createElement("div");
    filenameDiv.classList.add("mjr-card-filename");
    filenameDiv.title = filename;
    filenameDiv.textContent = filename;
    filenameDiv.style.cssText = "overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px; padding-right: 12px;";
    info.appendChild(filenameDiv);

    const metaRow = document.createElement("div");
    metaRow.classList.add("mjr-card-meta-row");
    metaRow.style.cssText = "font-size: 0.85em; opacity: 0.7; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 16px;";
    info.appendChild(metaRow);
    card.appendChild(info);
    return card;
}
