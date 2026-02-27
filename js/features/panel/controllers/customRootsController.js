import { t } from "../../../app/i18n.js";

export function createCustomRootsController({
    state,
    customSelect,
    customRemoveBtn,
    comfyConfirm,
    comfyPrompt,
    comfyToast,
    get,
    post,
    ENDPOINTS,
    reloadGrid,
    onRootChanged = null
}) {
    const refreshCustomRoots = async (preferId = null) => {
        // Show loading state
        const originalPlaceholder = customSelect.querySelector('option[value=""]')?.textContent || t("label.selectFolder", "Select folder…");
        customSelect.innerHTML = "";

        const loadingOption = document.createElement("option");
        loadingOption.value = "";
        loadingOption.textContent = t("msg.loading");
        loadingOption.disabled = true;
        customSelect.appendChild(loadingOption);
        customSelect.disabled = true;

        try {
            const json = await get(ENDPOINTS.CUSTOM_ROOTS);
            const roots = json && json.ok && Array.isArray(json.data) ? json.data : [];
            customSelect.innerHTML = "";

            const placeholder = document.createElement("option");
            placeholder.value = "";
            placeholder.textContent = originalPlaceholder;
            customSelect.appendChild(placeholder);

            roots.forEach((r) => {
                const opt = document.createElement("option");
                opt.value = r.id;
                opt.textContent = r.name || r.path || r.id;
                customSelect.appendChild(opt);
            });

            const desired = preferId || state.customRootId;
            if (desired && roots.some((r) => r.id === desired)) {
                customSelect.value = desired;
                state.customRootId = desired;
                try {
                    const sel = customSelect.options[customSelect.selectedIndex];
                    state.customRootLabel = String(sel?.text || "").trim();
                } catch {
                    state.customRootLabel = "";
                }
            } else {
                customSelect.value = "";
                state.customRootId = "";
                state.customRootLabel = "";
            }
            customRemoveBtn.disabled = !state.customRootId;
        } catch (err) {
            console.warn("Majoor: failed to load custom roots", err);
            // Show error state
            customSelect.innerHTML = "";
            const errorOption = document.createElement("option");
            errorOption.value = "";
            errorOption.textContent = t("msg.errorLoadingFolders");
            errorOption.disabled = true;
            customSelect.appendChild(errorOption);
        } finally {
            customSelect.disabled = false;
        }
    };

    const bind = ({ customAddBtn, customRemoveBtn }) => {
        const disposers = [];
        const addManagedListener = (target, event, handler) => {
            if (!target?.addEventListener || typeof handler !== "function") return;
            try {
                target.addEventListener(event, handler);
            } catch {
                return;
            }
            disposers.push(() => {
                try {
                    target.removeEventListener(event, handler);
                } catch {}
            });
        };

        const onCustomRootChange = async () => {
            // Only update state if not disabled (not in loading/error state)
            if (!customSelect.disabled) {
                state.customRootId = customSelect.value || "";
                try {
                    const sel = customSelect.options[customSelect.selectedIndex];
                    state.customRootLabel = String(sel?.text || "").trim();
                } catch {
                    state.customRootLabel = "";
                }
                state.currentFolderRelativePath = "";
                customRemoveBtn.disabled = !state.customRootId;
                try {
                    await onRootChanged?.(state);
                } catch {}
                await reloadGrid();
            }
        };
        addManagedListener(customSelect, "change", onCustomRootChange);

        if (customAddBtn) {
            customAddBtn.disabled = false;
            customAddBtn.title = t("btn.add", "Add");
        }
        const onCustomAddClick = async () => {
            let pickedPath = "";
            try {
                const browseRes = await post(ENDPOINTS.BROWSE_FOLDER, {});
                if (browseRes?.ok) {
                    pickedPath = String(browseRes?.data?.path || "").trim();
                }
            } catch {}
            if (!pickedPath) {
                const manual = await comfyPrompt(t("dialog.enterFolderPath", "Enter folder path"), "");
                pickedPath = String(manual || "").trim();
            }
            if (!pickedPath) return;

            const label = await comfyPrompt(t("dialog.folderLabelOptional", "Folder label (optional)"), "");
            const createRes = await post(ENDPOINTS.CUSTOM_ROOTS, {
                path: pickedPath,
                label: String(label || "").trim() || undefined,
            });
            if (!createRes?.ok) {
                comfyToast(createRes?.error || t("toast.failedAddFolder", "Failed to add browser folder"), "error");
                return;
            }

            const preferredId = String(createRes?.data?.id || "").trim() || null;
            await refreshCustomRoots(preferredId);
            try {
                await onRootChanged?.(state);
            } catch {}
            await reloadGrid();
            comfyToast(t("toast.folderAdded", "Folder added"), "success");
        };
        addManagedListener(customAddBtn, "click", onCustomAddClick);

        const onCustomRemoveClick = async () => {
            if (!state.customRootId) return;

            const selectedOption = customSelect.options[customSelect.selectedIndex];
            const folderName = selectedOption ? selectedOption.text : t("label.thisFolder", "this folder");

            const ok = await comfyConfirm(t("dialog.removeFolder", `Remove the browser folder "${folderName}"?`, { name: folderName }), t("dialog.customFoldersTitle", "Majoor: Browser Folders"));
            if (!ok) return;

            // Show loading state
            customRemoveBtn.disabled = true;
            customRemoveBtn.textContent = t("btn.removing");

            try {
                const json = await post(ENDPOINTS.CUSTOM_ROOTS_REMOVE, { id: state.customRootId });
                if (!json?.ok) {
                    comfyToast(json?.error || t("toast.failedRemoveFolder", "Failed to remove browser folder"), "error");
                    return;
                }
                comfyToast(t("toast.folderRemoved", "Folder removed"), "success");
                state.customRootId = "";
                state.customRootLabel = "";
                state.currentFolderRelativePath = "";
                await refreshCustomRoots();
                await reloadGrid();
            } catch (err) {
                console.warn("Majoor: remove custom root failed", err);
                comfyToast(t("toast.errorRemovingFolder", "An error occurred while removing the browser folder"), "error");
            } finally {
                // Re-enable button regardless of outcome
                customRemoveBtn.disabled = !state.customRootId; // Keep disabled if no selection
                customRemoveBtn.textContent = t("btn.remove");
            }
        };
        addManagedListener(customRemoveBtn, "click", onCustomRemoveClick);

        return () => {
            for (const dispose of disposers.splice(0)) {
                try {
                    dispose();
                } catch {}
            }
        };
    };

    return { refreshCustomRoots, bind };
}

