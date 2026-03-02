import { get } from "../../../api/client.js";
import { debounce } from "../../../utils/debounce.js";
import { t } from "../../../app/i18n.js";

export function createSearchView({ filterBtn, sortBtn, collectionsBtn, pinnedFoldersBtn, filterPopover, sortPopover, collectionsPopover, pinnedFoldersPopover }) {
    const searchSection = document.createElement("div");
    searchSection.classList.add("mjr-am-search");

    const searchInner = document.createElement("div");
    searchInner.classList.add("mjr-am-search-pill");

    const searchIcon = document.createElement("span");
    searchIcon.classList.add("mjr-am-search-icon");
    const searchIconEl = document.createElement("i");
    searchIconEl.className = "pi pi-search";
    searchIcon.appendChild(searchIconEl);

    // Autocomplete datalist
    const dataListId = (() => {
        try {
            if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
                return `mjr-search-autocomplete-${crypto.randomUUID()}`;
            }
        } catch (e) { console.debug?.(e); }
        return `mjr-search-autocomplete-${Math.random().toString(36).slice(2, 11)}`;
    })();
    const dataList = document.createElement("datalist");
    dataList.id = dataListId;
    
    const searchInputEl = document.createElement("input");
    searchInputEl.type = "text";
    searchInputEl.id = "mjr-search-input";
    searchInputEl.classList.add("mjr-input");
    searchInputEl.placeholder = t("search.placeholder", "Search assets...");
    searchInputEl.title = t("search.title", "Search by filename, tags, or attributes (e.g. rating:5, ext:png)");
    searchInputEl.setAttribute("list", dataListId);

    // ── Semantic Search Toggle ──────────────────────────────────────
    let semanticMode = false;
    const semanticBtn = document.createElement("button");
    semanticBtn.type = "button";
    semanticBtn.title = t("search.semanticToggle", "Toggle AI semantic search (CLIP-based)");
    semanticBtn.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 72px;
        height: 28px;
        padding: 0 8px;
        border-radius: 6px;
        border: 1px solid rgba(0, 188, 212, 0.25);
        background: transparent;
        color: rgba(0, 188, 212, 0.5);
        cursor: pointer;
        font-size: 10px;
        font-weight: 700;
        white-space: nowrap;
        transition: all 0.15s ease;
        flex-shrink: 0;
        margin-left: 4px;
    `;
    semanticBtn.textContent = t("search.aiSearch", "AI Search");

    const updateSemanticStyle = () => {
        if (semanticMode) {
            semanticBtn.style.background = "rgba(0, 188, 212, 0.2)";
            semanticBtn.style.borderColor = "rgba(0, 188, 212, 0.6)";
            semanticBtn.style.color = "#00BCD4";
            semanticBtn.style.boxShadow = "0 0 6px rgba(0, 188, 212, 0.3)";
            searchInputEl.placeholder = t("search.semanticPlaceholder", "Describe what you're looking for...");
            searchInputEl.title = t("search.semanticTitle", "AI semantic search — describe your image in natural language");
        } else {
            semanticBtn.style.background = "transparent";
            semanticBtn.style.borderColor = "rgba(0, 188, 212, 0.25)";
            semanticBtn.style.color = "rgba(0, 188, 212, 0.5)";
            semanticBtn.style.boxShadow = "none";
            searchInputEl.placeholder = t("search.placeholder", "Search assets...");
            searchInputEl.title = t("search.title", "Search by filename, tags, or attributes (e.g. rating:5, ext:png)");
        }
    };

    semanticBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        semanticMode = !semanticMode;
        updateSemanticStyle();
        // Dispatch event so grid picks it up
        try {
            searchInputEl.dataset.mjrSemanticMode = semanticMode ? "1" : "0";
            searchInputEl.dispatchEvent(new Event("input", { bubbles: true }));
        } catch (err) { console.debug?.(err); }
    });

    semanticBtn.addEventListener("mouseenter", () => {
        if (!semanticMode) {
            semanticBtn.style.borderColor = "rgba(0, 188, 212, 0.5)";
            semanticBtn.style.color = "#00BCD4";
        }
    });
    semanticBtn.addEventListener("mouseleave", () => {
        if (!semanticMode) {
            semanticBtn.style.borderColor = "rgba(0, 188, 212, 0.25)";
            semanticBtn.style.color = "rgba(0, 188, 212, 0.5)";
        }
    });

    // ── Audit Mode Toggle ───────────────────────────────────────────
    let auditMode = false;
    const auditBtn = document.createElement("button");
    auditBtn.type = "button";
    auditBtn.title = t("search.auditToggle", "Library Audit — show assets missing tags, ratings or with low alignment score");
    auditBtn.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        border: 1px solid rgba(255, 152, 0, 0.25);
        background: transparent;
        color: rgba(255, 152, 0, 0.5);
        cursor: pointer;
        font-size: 13px;
        transition: all 0.15s ease;
        flex-shrink: 0;
        margin-left: 4px;
    `;
    auditBtn.textContent = "⚠";

    const updateAuditStyle = () => {
        if (auditMode) {
            auditBtn.style.background = "rgba(255, 152, 0, 0.18)";
            auditBtn.style.borderColor = "rgba(255, 152, 0, 0.65)";
            auditBtn.style.color = "#FF9800";
            auditBtn.style.boxShadow = "0 0 6px rgba(255, 152, 0, 0.3)";
        } else {
            auditBtn.style.background = "transparent";
            auditBtn.style.borderColor = "rgba(255, 152, 0, 0.25)";
            auditBtn.style.color = "rgba(255, 152, 0, 0.5)";
            auditBtn.style.boxShadow = "none";
        }
    };

    auditBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        auditMode = !auditMode;
        updateAuditStyle();
        try {
            searchInputEl.dataset.mjrAuditMode = auditMode ? "1" : "0";
            searchInputEl.dispatchEvent(new Event("input", { bubbles: true }));
        } catch (err) { console.debug?.(err); }
    });

    auditBtn.addEventListener("mouseenter", () => {
        if (!auditMode) {
            auditBtn.style.borderColor = "rgba(255, 152, 0, 0.5)";
            auditBtn.style.color = "#FF9800";
        }
    });
    auditBtn.addEventListener("mouseleave", () => {
        if (!auditMode) {
            auditBtn.style.borderColor = "rgba(255, 152, 0, 0.25)";
            auditBtn.style.color = "rgba(255, 152, 0, 0.5)";
        }
    });

    // Autocomplete handler
    const handleAutocomplete = debounce(async (e) => {
        const val = (e.target.value || "").trim();
        // Typing a new query deactivates audit mode
        if (auditMode && val && val !== "*") {
            auditMode = false;
            searchInputEl.dataset.mjrAuditMode = "0";
            updateAuditStyle();
        }
        // Skip autocomplete in semantic mode
        if (semanticMode) return;
        // Trigger only if generic search (not attribute search like rating:5)
        if (val.length < 2 || val.includes(":")) return; 

        try {
            const res = await get("/mjr/am/autocomplete", { q: val, limit: 10 });
            if (res && res.ok && Array.isArray(res.data)) {
                // Keep current options if focused? Datalist handles this.
                dataList.innerHTML = "";
                res.data.forEach(term => {
                    const opt = document.createElement("option");
                    opt.value = term;
                    dataList.appendChild(opt);
                });
            }
        } catch {
            // Ignore autocomplete errors
        }
    }, 300);

    searchInputEl.addEventListener("input", handleAutocomplete);

    searchInner.appendChild(searchIcon);
    searchInner.appendChild(searchInputEl);
    searchInner.appendChild(semanticBtn);
    searchInner.appendChild(auditBtn);
    searchInner.appendChild(dataList);
    searchSection.appendChild(searchInner);


    const searchTools = document.createElement("div");
    searchTools.className = "mjr-am-search-tools";

    const filterAnchor = document.createElement("div");
    filterAnchor.className = "mjr-popover-anchor";
    filterAnchor.appendChild(filterBtn);
    filterAnchor.appendChild(filterPopover);

    const sortAnchor = document.createElement("div");
    sortAnchor.className = "mjr-popover-anchor";
    sortAnchor.appendChild(sortBtn);
    sortAnchor.appendChild(sortPopover);

    const collectionsAnchor = document.createElement("div");
    collectionsAnchor.className = "mjr-popover-anchor";
    if (collectionsBtn) collectionsAnchor.appendChild(collectionsBtn);
    if (collectionsPopover) collectionsAnchor.appendChild(collectionsPopover);

    const pinnedFoldersAnchor = document.createElement("div");
    pinnedFoldersAnchor.className = "mjr-popover-anchor";
    if (pinnedFoldersBtn) pinnedFoldersAnchor.appendChild(pinnedFoldersBtn);
    if (pinnedFoldersPopover) pinnedFoldersAnchor.appendChild(pinnedFoldersPopover);

    searchTools.appendChild(filterAnchor);
    searchTools.appendChild(sortAnchor);
    searchTools.appendChild(collectionsAnchor);
    searchTools.appendChild(pinnedFoldersAnchor);
    searchSection.appendChild(searchTools);

    return { searchSection, searchInputEl };
}
