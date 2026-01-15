export function createSortController({ state, sortBtn, sortMenu, sortPopover, popovers, reloadGrid, onChanged = null }) {
    const sortOptions = [
        { key: "mtime_desc", label: "Newest first" },
        { key: "mtime_asc", label: "Oldest first" },
        { key: "name_asc", label: "Name A → Z" },
        { key: "name_desc", label: "Name Z → A" },
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
        for (const opt of sortOptions) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "mjr-menu-item";

            const label = document.createElement("span");
            label.className = "mjr-menu-item-label";
            label.textContent = opt.label;

            const check = document.createElement("i");
            check.className = "pi pi-check mjr-menu-item-check";
            check.style.opacity = opt.key === state.sort ? "1" : "0";

            btn.appendChild(label);
            btn.appendChild(check);

            btn.addEventListener("click", async () => {
                state.sort = opt.key;
                setSortIcon(state.sort);
                renderSortMenu();
                try {
                    onChanged?.();
                } catch {}
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
            } catch {}
            renderSortMenu();
            popovers.toggle(sortPopover, sortBtn);
        });
    };

    return { bind, renderSortMenu, setSortIcon };
}
