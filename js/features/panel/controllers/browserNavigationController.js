import { t } from "../../../app/i18n.js";

export function createBrowserNavigationController({
    state,
    gridContainer,
    folderBreadcrumb,
    customSelect,
    reloadGrid,
    onContextChanged = null,
    lifecycleSignal = null,
} = {}) {
    const folderBackStack = [];

    const normPath = (value) => String(value || "").trim().replaceAll("\\", "/");
    const isWindowsDrive = (part) => /^[a-zA-Z]:$/.test(String(part || "").trim());
    const currentFolderPath = () => normPath(state.currentFolderRelativePath || "");

    const pushUniqueHistory = (stack, value) => {
        const v = normPath(value);
        if (!Array.isArray(stack)) return;
        if (!v && v !== "") return;
        const top = stack.length ? normPath(stack[stack.length - 1]) : null;
        if (top === v) return;
        stack.push(v);
    };

    const popDistinctHistory = (stack, current) => {
        const cur = normPath(current);
        if (!Array.isArray(stack)) return null;
        while (stack.length) {
            const candidate = normPath(stack.pop());
            if (candidate !== cur) return candidate;
        }
        return null;
    };

    const setFolderPath = (next) => {
        const v = normPath(next);
        state.currentFolderRelativePath = v;
        try {
            if (gridContainer?.dataset) gridContainer.dataset.mjrSubfolder = v;
        } catch (e) { console.debug?.(e); }
    };

    const resolveFolderTargetPath = (asset) => {
        const rawSubfolder = normPath(asset?.subfolder || "");
        if (rawSubfolder) return rawSubfolder;

        const rawFilepath = normPath(asset?.filepath || asset?.path || "");
        if (rawFilepath) {
            const kind = String(asset?.kind || "").toLowerCase();
            if (kind === "folder") return rawFilepath;
            // Defensive fallback: if a file path is emitted, browse its parent folder.
            const parent = parentFolderPath(rawFilepath);
            return parent || rawFilepath;
        }

        const name = normPath(asset?.filename || "");
        if (!name) return currentFolderPath();
        const base = currentFolderPath();
        if (!base) return name;
        return `${base}/${name}`.replace(/\/{2,}/g, "/");
    };

    const parentFolderPath = (pathValue) => {
        const cur = normPath(pathValue);
        if (!cur) return "";
        const parts = cur.split("/").filter(Boolean);
        if (!parts.length) return "";
        if (parts.length === 1) return isWindowsDrive(parts[0]) ? `${parts[0]}/` : "";
        parts.pop();
        if (parts.length === 1 && isWindowsDrive(parts[0])) return `${parts[0]}/`;
        return parts.join("/");
    };

    const notifyContext = () => {
        try {
            onContextChanged?.();
        } catch (e) { console.debug?.(e); }
        try {
            renderBreadcrumb();
        } catch (e) { console.debug?.(e); }
    };

    const resetGridScrollToTop = () => {
        try {
            if (gridContainer && typeof gridContainer.scrollTop === "number") {
                gridContainer.scrollTop = 0;
            }
        } catch (e) { console.debug?.(e); }
        try {
            const parent = gridContainer?.parentElement || null;
            if (parent && typeof parent.scrollTop === "number") {
                parent.scrollTop = 0;
            }
        } catch (e) { console.debug?.(e); }
    };

    const navigateFolder = async (target, { pushHistory = true } = {}) => {
        const prev = currentFolderPath();
        const next = normPath(target);
        if (prev === next) return;
        if (pushHistory) pushUniqueHistory(folderBackStack, prev);
        setFolderPath(next);
        resetGridScrollToTop();
        notifyContext();
        await reloadGrid?.();
    };

    const resetToBrowserRoot = async () => {
        state.customRootId = "";
        setFolderPath("");
        resetGridScrollToTop();
        notifyContext();
        await reloadGrid?.();
    };

    const renderBreadcrumb = () => {
        const isCustom = String(state.scope || "") === "custom";
        const rel = String(state.currentFolderRelativePath || "").trim().replaceAll("\\", "/");
        const folderBrowsingActive = isCustom || !!rel;
        const selectedRootId = String(state.customRootId || "").trim();
        const selectedRootLabel = (() => {
            if (!selectedRootId) return "";
            try {
                const opt = customSelect?.selectedOptions?.[0] || null;
                return String(opt?.textContent || "").trim();
            } catch {
                return "";
            }
        })();

        if (!folderBrowsingActive) {
            folderBackStack.length = 0;
            folderBreadcrumb.style.display = "none";
            folderBreadcrumb.replaceChildren();
            return;
        }
        folderBreadcrumb.style.display = "flex";
        folderBreadcrumb.replaceChildren();

        const backBtn = document.createElement("button");
        backBtn.type = "button";
        backBtn.textContent = t("btn.back", "Back");
        backBtn.className = "mjr-btn-link";
        const hasSelectedRoot = !!String(state.customRootId || "").trim();
        const canBackToBrowserRoot = hasSelectedRoot && !rel;
        const canBackByPath = !!rel;
        backBtn.disabled = folderBackStack.length === 0 && !canBackToBrowserRoot && !canBackByPath;
        backBtn.style.cssText = "background:rgba(122,162,255,0.12);border:1px solid rgba(122,162,255,0.35);border-radius:6px;padding:2px 8px;font:inherit;color:var(--mjr-accent, #7aa2ff);cursor:pointer;";
        backBtn.addEventListener(
            "click",
            async () => {
                const prev = popDistinctHistory(folderBackStack, currentFolderPath());
                if (prev != null) {
                    await navigateFolder(prev, { pushHistory: false });
                    return;
                }
                const cur = currentFolderPath();
                if (cur) {
                    const parent = parentFolderPath(cur);
                    if (parent === cur) {
                        if (hasSelectedRoot) await resetToBrowserRoot();
                        return;
                    }
                    await navigateFolder(parent, { pushHistory: false });
                    return;
                }
                if (canBackToBrowserRoot) await resetToBrowserRoot();
            },
            { signal: lifecycleSignal || undefined }
        );
        folderBreadcrumb.appendChild(backBtn);

        const upBtn = document.createElement("button");
        upBtn.type = "button";
        upBtn.textContent = t("btn.up", "Up");
        upBtn.className = "mjr-btn-link";
        upBtn.disabled = !rel || parentFolderPath(currentFolderPath()) === currentFolderPath();
        upBtn.style.cssText = "background:rgba(122,162,255,0.10);border:1px solid rgba(122,162,255,0.30);border-radius:6px;padding:2px 8px;font:inherit;color:var(--mjr-accent, #7aa2ff);cursor:pointer;";
        upBtn.addEventListener(
            "click",
            async () => {
                const parent = parentFolderPath(currentFolderPath());
                if (parent === currentFolderPath()) {
                    if (hasSelectedRoot) await resetToBrowserRoot();
                    return;
                }
                await navigateFolder(parent);
            },
            { signal: lifecycleSignal || undefined }
        );
        folderBreadcrumb.appendChild(upBtn);

        const sep0 = document.createElement("span");
        sep0.textContent = "|";
        sep0.style.opacity = "0.5";
        folderBreadcrumb.appendChild(sep0);

        const mk = (label, target, isCurrent = false) => {
            const el = document.createElement("button");
            el.type = "button";
            el.textContent = label;
            el.className = "mjr-btn-link";
            el.style.cssText = `background:none;border:none;padding:0;color:${isCurrent ? "var(--mjr-text, inherit)" : "var(--mjr-accent, #7aa2ff)"};cursor:${isCurrent ? "default" : "pointer"};font:inherit;`;
            if (!isCurrent) {
                el.addEventListener(
                    "click",
                    async () => {
                        if (label === "Computer" && String(state.customRootId || "").trim()) {
                            await resetToBrowserRoot();
                            return;
                        }
                        await navigateFolder(target);
                    },
                    { signal: lifecycleSignal || undefined }
                );
            } else {
                el.disabled = true;
            }
            return el;
        };

        folderBreadcrumb.appendChild(mk(t("label.computer", "Computer"), "", !rel));
        if (selectedRootId) {
            const sepRoot = document.createElement("span");
            sepRoot.textContent = "/";
            sepRoot.style.opacity = "0.6";
            folderBreadcrumb.appendChild(sepRoot);
            folderBreadcrumb.appendChild(mk(selectedRootLabel || selectedRootId, "", !rel));
        }
        if (!rel) return;
        const parts = rel.split("/").filter(Boolean);
        let acc = "";
        for (let i = 0; i < parts.length; i++) {
            const sep = document.createElement("span");
            sep.textContent = "/";
            sep.style.opacity = "0.6";
            folderBreadcrumb.appendChild(sep);
            if (!acc) acc = isWindowsDrive(parts[i]) ? `${parts[i]}/` : parts[i];
            else acc = `${acc}/${parts[i]}`.replace(/\/{2,}/g, "/");
            folderBreadcrumb.appendChild(mk(parts[i], acc, i === parts.length - 1));
        }
    };

    const bindGridFolderNavigation = () => {
        const onOpenFolderAsset = async (e) => {
            const asset = e?.detail?.asset || null;
            const target = resolveFolderTargetPath(asset || {});
            const prev = currentFolderPath();
            if (target !== prev) {
                pushUniqueHistory(folderBackStack, prev);
                setFolderPath(target);
                resetGridScrollToTop();
                notifyContext();
                try {
                    await reloadGrid?.();
                } catch (e) { console.debug?.(e); }
            }
        };

        const onCustomSubfolderChanged = async (e) => {
            const next = String(e?.detail?.subfolder || "").trim().replaceAll("\\", "/");
            const prev = currentFolderPath();
            if (next !== prev) {
                pushUniqueHistory(folderBackStack, prev);
                setFolderPath(next);
                resetGridScrollToTop();
                notifyContext();
                try {
                    await reloadGrid?.();
                } catch (e) { console.debug?.(e); }
            }
        };
        gridContainer?.addEventListener?.("mjr:custom-subfolder-changed", onCustomSubfolderChanged, {
            signal: lifecycleSignal || undefined,
        });
        gridContainer?.addEventListener?.("mjr:open-folder-asset", onOpenFolderAsset, {
            signal: lifecycleSignal || undefined,
        });
        try {
            gridContainer._mjrHasCustomSubfolderHandler = true;
        } catch (e) { console.debug?.(e); }
        return () => {
            try {
                gridContainer?.removeEventListener?.("mjr:custom-subfolder-changed", onCustomSubfolderChanged);
            } catch (e) { console.debug?.(e); }
            try {
                gridContainer?.removeEventListener?.("mjr:open-folder-asset", onOpenFolderAsset);
            } catch (e) { console.debug?.(e); }
            try {
                gridContainer._mjrHasCustomSubfolderHandler = false;
            } catch (e) { console.debug?.(e); }
        };
    };

    return {
        renderBreadcrumb,
        resetHistory: () => {
            folderBackStack.length = 0;
        },
        bindGridFolderNavigation,
        notifyContext,
    };
}
