import { t } from "../../../app/i18n.js";

export function createCustomRootsController({
    state,
    customSelect,
    customRemoveBtn,
    comfyConfirm,
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
        customSelect.addEventListener("change", async () => {
            // Only update state if not disabled (not in loading/error state)
            if (!customSelect.disabled) {
                state.customRootId = customSelect.value || "";
                try {
                    const sel = customSelect.options[customSelect.selectedIndex];
                    state.customRootLabel = String(sel?.text || "").trim();
                } catch {
                    state.customRootLabel = "";
                }
                state.subfolder = "";
                state.currentFolderRelativePath = "";
                customRemoveBtn.disabled = !state.customRootId;
                try {
                    await onRootChanged?.(state);
                } catch {}
                await reloadGrid();
            }
        });

        // Temporary: custom-root add flow disabled.
        customAddBtn.disabled = true;
        customAddBtn.title = t("status.pending", "Pending");

        customRemoveBtn.addEventListener("click", async () => {
            if (!state.customRootId) return;

            const selectedOption = customSelect.options[customSelect.selectedIndex];
            const folderName = selectedOption ? selectedOption.text : t("label.thisFolder", "this folder");

            const ok = await comfyConfirm(t("dialog.removeFolder", `Remove the custom folder "${folderName}"?`, { name: folderName }), t("dialog.customFoldersTitle", "Majoor: Custom Folders"));
            if (!ok) return;

            // Show loading state
            customRemoveBtn.disabled = true;
            customRemoveBtn.textContent = t("btn.removing");

            try {
                const json = await post(ENDPOINTS.CUSTOM_ROOTS_REMOVE, { id: state.customRootId });
                if (!json?.ok) {
                    comfyToast(json?.error || t("toast.failedRemoveFolder", "Failed to remove custom folder"), "error");
                    return;
                }
                comfyToast(t("toast.folderRemoved", "Folder removed"), "success");
                state.customRootId = "";
                state.customRootLabel = "";
                state.subfolder = "";
                state.currentFolderRelativePath = "";
                await refreshCustomRoots();
                await reloadGrid();
            } catch (err) {
                console.warn("Majoor: remove custom root failed", err);
                comfyToast(t("toast.errorRemovingFolder", "An error occurred while removing the custom folder"), "error");
            } finally {
                // Re-enable button regardless of outcome
                customRemoveBtn.disabled = !state.customRootId; // Keep disabled if no selection
                customRemoveBtn.textContent = t("btn.remove");
            }
        });
    };

    return { refreshCustomRoots, bind };
}

