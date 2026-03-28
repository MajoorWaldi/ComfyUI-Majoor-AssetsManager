import { get } from "../../../api/client.js";
import { debounce } from "../../../utils/debounce.js";
import { t } from "../../../app/i18n.js";
import { createIconButton } from "./iconButton.js";
import { appendTooltipHint } from "../../../utils/tooltipShortcuts.js";

const SEARCH_TOOLTIP_HINT = "Ctrl/Cmd+F, Ctrl/Cmd+K, Ctrl/Cmd+H";

export function createSearchView({
    filterBtn,
    sortBtn,
    collectionsBtn,
    pinnedFoldersBtn,
    filterPopover,
    sortPopover,
    collectionsPopover,
    pinnedFoldersPopover,
}) {
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
        } catch (e) {
            console.debug?.(e);
        }
        return `mjr-search-autocomplete-${Math.random().toString(36).slice(2, 11)}`;
    })();
    const dataList = document.createElement("datalist");
    dataList.id = dataListId;

    const searchInputEl = document.createElement("input");
    searchInputEl.type = "text";
    searchInputEl.id = "mjr-search-input";
    searchInputEl.classList.add("mjr-input");
    searchInputEl.placeholder = t("search.placeholder", "Search assets...");
    searchInputEl.title = appendTooltipHint(
        t("search.title", "Search by filename, tags, or attributes (e.g. rating:5, ext:png)"),
        SEARCH_TOOLTIP_HINT,
    );
    searchInputEl.setAttribute("list", dataListId);

    // ── Semantic Search Toggle ──────────────────────────────────────
    let semanticMode = false;
    const semanticBtn = document.createElement("button");
    semanticBtn.type = "button";
    semanticBtn.classList.add("mjr-ai-control");
    const semanticToggleTitle = t(
        "search.semanticToggle",
        "Toggle AI semantic search (CLIP-based)",
    );
    semanticBtn.title = semanticToggleTitle;
    semanticBtn.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        padding: 0;
        border-radius: 6px;
        border: 1px solid rgba(0, 188, 212, 0.25);
        background: transparent;
        color: rgba(0, 188, 212, 0.5);
        cursor: pointer;
        font-size: 13px;
        transition: all 0.15s ease;
        flex-shrink: 0;
    `;
    const semanticIcon = document.createElement("i");
    semanticIcon.className = "pi pi-sparkles";
    semanticBtn.appendChild(semanticIcon);

    const updateSemanticStyle = () => {
        if (semanticMode) {
            semanticBtn.style.background = "rgba(0, 188, 212, 0.2)";
            semanticBtn.style.borderColor = "rgba(0, 188, 212, 0.6)";
            semanticBtn.style.color = "#00BCD4";
            semanticBtn.style.boxShadow = "0 0 6px rgba(0, 188, 212, 0.3)";
            searchInputEl.placeholder = t(
                "search.semanticPlaceholder",
                "Describe what you're looking for...",
            );
            searchInputEl.title = appendTooltipHint(
                t(
                    "search.semanticTitle",
                    "AI semantic search — describe your image in natural language",
                ),
                SEARCH_TOOLTIP_HINT,
            );
        } else {
            semanticBtn.style.background = "transparent";
            semanticBtn.style.borderColor = "rgba(0, 188, 212, 0.25)";
            semanticBtn.style.color = "rgba(0, 188, 212, 0.5)";
            semanticBtn.style.boxShadow = "none";
            searchInputEl.placeholder = t("search.placeholder", "Search assets...");
            searchInputEl.title = appendTooltipHint(
                t(
                    "search.title",
                    "Search by filename, tags, or attributes (e.g. rating:5, ext:png)",
                ),
                SEARCH_TOOLTIP_HINT,
            );
        }
    };

    const setSemanticMode = (nextMode, { emitInput = false } = {}) => {
        semanticMode = !!nextMode;
        updateSemanticStyle();
        try {
            searchInputEl.dataset.mjrSemanticMode = semanticMode ? "1" : "0";
            if (emitInput) {
                searchInputEl.dispatchEvent(new Event("input", { bubbles: true }));
            }
        } catch (err) {
            console.debug?.(err);
        }
    };

    const setSemanticEnabled = (enabled) => {
        const isEnabled = !!enabled;
        if (!isEnabled) {
            setSemanticMode(false, { emitInput: true });
        }
        semanticBtn.disabled = !isEnabled;
        semanticBtn.setAttribute("aria-disabled", isEnabled ? "false" : "true");
        semanticBtn.title = isEnabled
            ? semanticToggleTitle
            : t("search.semanticDisabled", "AI semantic search is disabled in settings");
    };

    semanticBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        setSemanticMode(!semanticMode, { emitInput: true });
    });

    semanticBtn.addEventListener("mouseenter", () => {
        if (!semanticMode && !semanticBtn.disabled) {
            semanticBtn.style.borderColor = "rgba(0, 188, 212, 0.5)";
            semanticBtn.style.color = "#00BCD4";
        }
    });
    semanticBtn.addEventListener("mouseleave", () => {
        if (!semanticMode && !semanticBtn.disabled) {
            semanticBtn.style.borderColor = "rgba(0, 188, 212, 0.25)";
            semanticBtn.style.color = "rgba(0, 188, 212, 0.5)";
        }
    });

    // Autocomplete handler
    const handleAutocomplete = debounce(async (e) => {
        const val = (e.target.value || "").trim();
        // Skip autocomplete in semantic mode
        if (semanticMode) return;
        // Trigger only if generic search (not attribute search like rating:5)
        if (val.length < 2 || val.includes(":")) return;

        try {
            const res = await get("/mjr/am/autocomplete", { q: val, limit: 10 });
            if (res && res.ok && Array.isArray(res.data)) {
                // Keep current options if focused? Datalist handles this.
                dataList.innerHTML = "";
                res.data.forEach((term) => {
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
    searchInner.appendChild(dataList);
    searchSection.appendChild(searchInner);

    const searchTools = document.createElement("div");
    searchTools.className = "mjr-am-search-tools";

    const semanticAnchor = document.createElement("div");
    semanticAnchor.className = "mjr-popover-anchor";
    semanticAnchor.appendChild(semanticBtn);

    const similarBtn = createIconButton("pi-clone", t("search.findSimilar", "Find Similar"));
    similarBtn.classList.add("mjr-ai-control");

    const filterAnchor = document.createElement("div");
    filterAnchor.className = "mjr-popover-anchor";
    filterAnchor.appendChild(filterBtn);
    filterAnchor.appendChild(filterPopover);

    const similarAnchor = document.createElement("div");
    similarAnchor.className = "mjr-popover-anchor";
    similarAnchor.appendChild(similarBtn);

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

    searchTools.appendChild(semanticAnchor);
    searchTools.appendChild(similarAnchor);
    searchTools.appendChild(filterAnchor);
    searchTools.appendChild(sortAnchor);
    searchTools.appendChild(collectionsAnchor);
    searchTools.appendChild(pinnedFoldersAnchor);
    searchSection.appendChild(searchTools);

    setSemanticMode(false);

    return { searchSection, searchInputEl, similarBtn, semanticBtn, setSemanticEnabled };
}
