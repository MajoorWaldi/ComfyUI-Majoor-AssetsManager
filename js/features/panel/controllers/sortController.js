import { t } from "../../../app/i18n.js";

export function createSortController({ state, sortBtn, sortMenu, sortPopover, popovers, reloadGrid, onChanged = null }) {
    const getSortOptions = () => [
        { key: "mtime_desc", label: t("sort.newest") },
        { key: "mtime_asc", label: t("sort.oldest") },
        { key: "name_asc", label: t("sort.nameAZ") },
        { key: "name_desc", label: t("sort.nameZA") },
    ];

    const setSortIcon = (key) => {
        const icon = sortBtn.querySelector("i");
        if (!icon) return;
        if (key === "name_asc") icon.className = "pi pi-sort-alpha-down";
        else if (key === "name_desc") icon.className = "pi pi-sort-alpha-up";
        else if (key === "mtime_asc") icon.className = "pi pi-sort-amount-up-alt";
        else icon.className = "pi pi-sort-amount-down";
    };

    const renderSortMenu = () => {
        sortMenu.replaceChildren();
        const sortOptions = getSortOptions();
        for (const opt of sortOptions) {
            const isActive = opt.key === state.sort;
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "mjr-menu-item";
            btn.style.cssText = `
                display:flex;
                align-items:center;
                justify-content:space-between;
                width:100%;
                gap:10px;
                padding:9px 10px;
                border-radius:9px;
                border:1px solid ${isActive ? "rgba(120,190,255,0.68)" : "rgba(120,190,255,0.18)"};
                background:${isActive
                    ? "linear-gradient(135deg, rgba(70,130,255,0.28), rgba(20,95,185,0.22))"
                    : "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))"};
                box-shadow:${isActive ? "0 0 0 1px rgba(160,210,255,0.22) inset, 0 8px 18px rgba(35,95,185,0.26)" : "none"};
                transition: border-color 120ms ease, background 120ms ease, box-shadow 120ms ease;
            `;

            const label = document.createElement("span");
            label.className = "mjr-menu-item-label";
            label.textContent = opt.label;
            label.style.cssText = `font-weight:${isActive ? "700" : "600"}; color:${isActive ? "rgba(208,234,255,0.98)" : "var(--fg-color, #e6edf7)"};`;

            const check = document.createElement("i");
            check.className = "pi pi-check mjr-menu-item-check";
            check.style.cssText = `opacity:${isActive ? "1" : "0"}; color: rgba(133,203,255,0.98);`;

            btn.appendChild(label);
            btn.appendChild(check);
            btn.addEventListener("mouseenter", () => {
                if (isActive) return;
                btn.style.borderColor = "rgba(145,205,255,0.4)";
                btn.style.background = "linear-gradient(135deg, rgba(80,140,255,0.18), rgba(32,100,200,0.14))";
            });
            btn.addEventListener("mouseleave", () => {
                if (isActive) return;
                btn.style.borderColor = "rgba(120,190,255,0.18)";
                btn.style.background = "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))";
            });

            btn.addEventListener("click", async () => {
                state.sort = opt.key;
                setSortIcon(state.sort);
                renderSortMenu();
                try {
                    onChanged?.();
                } catch (e) { console.debug?.(e); }
                sortPopover.style.display = "none";
                popovers.close(sortPopover);
                await reloadGrid();
            });

            sortMenu.appendChild(btn);
        }
    };

    const bind = ({ onBeforeToggle } = {}) => {
        setSortIcon(state.sort);
        renderSortMenu();
        sortBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            try {
                onBeforeToggle?.();
            } catch (e) { console.debug?.(e); }
            renderSortMenu();
            popovers.toggle(sortPopover, sortBtn);
        });
    };

    return { bind, renderSortMenu, setSortIcon };
}
