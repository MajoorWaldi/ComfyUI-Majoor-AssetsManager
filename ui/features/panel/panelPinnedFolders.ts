import { get, post } from "../../api/client.js";
import { ENDPOINTS } from "../../api/endpoints.js";
import { comfyConfirm } from "../../app/dialogs.js";
import { comfyToast } from "../../app/toast.js";
import { t } from "../../app/i18n.js";

/**
 * Binds the pinned-folders popover.
 *
 * Vue owns the menu item rendering through PinnedFoldersPopover; this controller
 * keeps the API calls and panel navigation side effects in the runtime layer.
 */
export function bindPinnedFolders({
    pinnedFoldersBtn,
    pinnedFoldersController = null,
    pinnedFoldersMenu = null,
    pinnedFoldersPopover,
    popovers,
    closeOtherPopovers,
    state,
    gridContainer,
    customSelect,
    scopeController,
    customRootsController,
    gridController,
    applyWatcherForScope,
    refreshDuplicateAlerts,
    notifyContextChanged,
    panelLifecycleAC,
}: Record<string, any>): void {
    const normalizeRoot = (root: any) => {
        const id = String(root?.id || "").trim();
        if (!id) return null;
        const path = String(root?.path || "").trim();
        const label = String(root?.name || path || id).trim();
        return {
            id,
            label: label || id,
            path,
        };
    };

    const readRoots = async () => {
        try {
            const res = await get(
                ENDPOINTS.CUSTOM_ROOTS,
                panelLifecycleAC?.signal ? { signal: panelLifecycleAC.signal } : undefined,
            );
            return res?.ok && Array.isArray(res.data)
                ? res.data.map(normalizeRoot).filter(Boolean)
                : [];
        } catch (e) {
            console.debug?.(e);
            return [];
        }
    };

    const openPinnedFolder = async (root: any) => {
        const id = String(root?.id || "").trim();
        if (!id) return;
        const label = String(root?.label || root?.path || id).trim();

        state.scope = "custom";
        try {
            if (gridContainer) gridContainer.dataset.mjrScope = "custom";
        } catch (e) {
            console.debug?.(e);
        }
        state.customRootId = id;
        state.customRootLabel = label;
        state.currentFolderRelativePath = "";
        try {
            if (customSelect) customSelect.value = id;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            scopeController?.setActiveTabStyles?.();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            await applyWatcherForScope(state.scope);
        } catch (e) {
            console.debug?.(e);
        }
        try {
            await refreshDuplicateAlerts();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            notifyContextChanged();
        } catch (e) {
            console.debug?.(e);
        }
        popovers.close(pinnedFoldersPopover);
        await gridController.reloadGrid();
    };

    const unpinFolder = async (root: any, event: any = null) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();

        const id = String(root?.id || "").trim();
        if (!id) return;
        const label = String(root?.label || root?.path || id).trim();
        const ok = await comfyConfirm(
            t("dialog.unpinFolder", 'Unpin folder "{name}"?', { name: label }),
        );
        if (!ok) return;

        const res = await post(ENDPOINTS.CUSTOM_ROOTS_REMOVE, { id });
        if (!res?.ok) {
            comfyToast(
                res?.error || t("toast.unpinFolderFailed", "Failed to unpin folder"),
                "error",
            );
            return;
        }
        if (String(state.customRootId || "") === id) {
            state.customRootId = "";
            state.customRootLabel = "";
            state.currentFolderRelativePath = "";
        }
        try {
            await customRootsController.refreshCustomRoots();
        } catch (e) {
            console.debug?.(e);
        }
        await renderPinnedFoldersMenu();
        await gridController.reloadGrid();
    };

    const renderVueMenu = (roots: any) => {
        if (typeof pinnedFoldersController?.setPinnedFolders !== "function") return false;
        pinnedFoldersController.setPinnedFolders({
            roots,
            emptyLabel: t("msg.noPinnedFolders", "No pinned folders"),
            loadingLabel: t("status.loading", "Loading..."),
            unpinLabel: t("ctx.unpinFolder", "Unpin folder"),
            onOpen: openPinnedFolder,
            onUnpin: unpinFolder,
            loading: false,
        });
        return true;
    };

    const renderDomFallback = (roots: any) => {
        if (!pinnedFoldersMenu) return;
        try {
            pinnedFoldersMenu.replaceChildren();
        } catch (e) {
            console.debug?.(e);
        }
        if (!roots.length) {
            const empty = document.createElement("div");
            empty.className = "mjr-muted";
            empty.style.cssText = "padding:10px 12px; opacity:0.75;";
            empty.textContent = t("msg.noPinnedFolders", "No pinned folders");
            pinnedFoldersMenu.appendChild(empty);
            return;
        }
        for (const root of roots) {
            const row = document.createElement("div");
            row.className = "mjr-pinned-folder-row";

            const openBtn = document.createElement("button");
            openBtn.type = "button";
            openBtn.className = "mjr-menu-item mjr-pinned-folder-open";
            openBtn.textContent = root.label;
            openBtn.addEventListener("click", () => openPinnedFolder(root), {
                signal: panelLifecycleAC?.signal,
            });

            const unpinBtn = document.createElement("button");
            unpinBtn.type = "button";
            unpinBtn.className = "mjr-menu-item mjr-pinned-folder-unpin";
            unpinBtn.title = t("ctx.unpinFolder", "Unpin folder");
            unpinBtn.textContent = "x";
            unpinBtn.addEventListener("click", (event) => unpinFolder(root, event), {
                signal: panelLifecycleAC?.signal,
            });

            row.appendChild(openBtn);
            row.appendChild(unpinBtn);
            pinnedFoldersMenu.appendChild(row);
        }
    };

    async function renderPinnedFoldersMenu() {
        try {
            pinnedFoldersController?.setPinnedFoldersLoading?.(
                true,
                t("status.loading", "Loading..."),
            );
        } catch (e) {
            console.debug?.(e);
        }
        const roots = await readRoots();
        if (!renderVueMenu(roots)) {
            renderDomFallback(roots);
        }
    }

    pinnedFoldersBtn?.addEventListener(
        "click",
        async (e: any) => {
            e.stopPropagation();
            try {
                await renderPinnedFoldersMenu();
            } catch (e) {
                console.debug?.(e);
            }
            closeOtherPopovers();
            popovers.toggle(pinnedFoldersPopover, pinnedFoldersBtn);
        },
        { signal: panelLifecycleAC?.signal },
    );
}
