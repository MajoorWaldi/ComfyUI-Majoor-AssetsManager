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
    reloadGrid
}) {
    const isSensitivePath = (input) => {
        try {
            const raw = String(input || "").trim();
            if (!raw) return false;
            const p = raw.replaceAll("\\", "/").toLowerCase();

            // Very broad roots (drive root / filesystem root).
            if (p === "/" || /^[a-z]:\/?$/.test(p)) return true;

            // Common sensitive/system folders (best-effort heuristics).
            const needles = [
                "/windows",
                "/program files",
                "/program files (x86)",
                "/users",
                "/appdata",
                "/system32",
                "/etc",
                "/usr",
                "/bin",
                "/var",
            ];
            return needles.some((n) => p === n || p.startsWith(n + "/") || p.includes(n + "/"));
        } catch {
            return false;
        }
    };

    const refreshCustomRoots = async (preferId = null) => {
        // Show loading state
        const originalPlaceholder = customSelect.querySelector('option[value=""]')?.textContent || "Select folder…";
        customSelect.innerHTML = "";

        const loadingOption = document.createElement("option");
        loadingOption.value = "";
        loadingOption.textContent = "Loading...";
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
            } else {
                customSelect.value = "";
                state.customRootId = "";
            }
            customRemoveBtn.disabled = !state.customRootId;
        } catch (err) {
            console.warn("Majoor: failed to load custom roots", err);
            // Show error state
            customSelect.innerHTML = "";
            const errorOption = document.createElement("option");
            errorOption.value = "";
            errorOption.textContent = "Error loading folders";
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
                customRemoveBtn.disabled = !state.customRootId;
                await reloadGrid();
            }
        });

        customAddBtn.addEventListener("click", async () => {
            // Disable button during operation to prevent multiple clicks
            customAddBtn.disabled = true;
            customAddBtn.textContent = "Adding...";

            try {
                // Attempt to open the native folder selector via the backend
                const response = await post("/mjr/sys/browse-folder", {});

                if (response && response.ok && response.data && response.data.path) {
                    // If a path is returned, use it directly
                    const path = response.data.path;

                    // (Optional) Security check as in the original code
                    if (isSensitivePath(path)) {
                        const ok = await comfyConfirm(
                            "This looks like a system or very broad directory.\n\nAdding it can expose sensitive files via the viewer/custom roots feature.\n\nContinue?",
                            "Majoor: Security Warning"
                        );
                        if (!ok) return;
                    }

                    // Send to backend for actual addition
                    const json = await post(ENDPOINTS.CUSTOM_ROOTS, { path });
                    if (!json?.ok) {
                        comfyToast(json?.error || "Failed to add custom folder", "error");
                        return;
                    }
                    // Refresh
                    comfyToast("Folder linked successfully", "success");
                    await refreshCustomRoots(json.data?.id);
                    await reloadGrid();
                    return;
                } else if (response && !response.ok && (response.code === "TKINTER_ERROR" || response.code === "HEADLESS_ENV" || response.code === "TKINTER_UNAVAILABLE")) {
                    // Handle specific tkinter errors
                    console.warn("Tkinter error:", response.error);
                    comfyToast("Native folder browser unavailable. Please enter path manually.", "warning");
                }
            } catch (e) {
                console.log("Native selector failed or was cancelled, falling back to manual input...", e);
            } finally {
                // Re-enable button regardless of outcome
                customAddBtn.disabled = false;
                customAddBtn.textContent = "Add…";
            }

            // --- FALLBACK TO ORIGINAL METHOD (Text box) ---
            const path = await comfyPrompt(
                "Enter a folder path to add as a Custom root:",
                "",
                "Majoor: Custom Folders"
            );
            if (!path) return;

            try {
                if (isSensitivePath(path)) {
                    const ok = await comfyConfirm(
                        "This looks like a system or very broad directory.\n\nAdding it can expose sensitive files via the viewer/custom roots feature.\n\nContinue?",
                        "Majoor: Security Warning"
                    );
                    if (!ok) return;
                }
            } catch {}

            try {
                // Show loading state
                customAddBtn.disabled = true;
                customAddBtn.textContent = "Adding...";

                const json = await post(ENDPOINTS.CUSTOM_ROOTS, { path });
                if (!json?.ok) {
                    comfyToast(json?.error || "Failed to add custom folder", "error");
                    return;
                }
                const newId = json.data?.id;
                comfyToast("Folder linked successfully", "success");
                await refreshCustomRoots(newId);
                await reloadGrid();
            } catch (err) {
                console.warn("Majoor: add custom root failed", err);
                comfyToast("An error occurred while adding the custom folder", "error");
            } finally {
                // Re-enable button regardless of outcome
                customAddBtn.disabled = false;
                customAddBtn.textContent = "Add…";
            }
        });

        customRemoveBtn.addEventListener("click", async () => {
            if (!state.customRootId) return;

            const selectedOption = customSelect.options[customSelect.selectedIndex];
            const folderName = selectedOption ? selectedOption.text : "this folder";

            const ok = await comfyConfirm(`Remove the custom folder "${folderName}"?`, "Majoor: Custom Folders");
            if (!ok) return;

            // Show loading state
            customRemoveBtn.disabled = true;
            customRemoveBtn.textContent = "Removing...";

            try {
                const json = await post(ENDPOINTS.CUSTOM_ROOTS_REMOVE, { id: state.customRootId });
                if (!json?.ok) {
                    comfyToast(json?.error || "Failed to remove custom folder", "error");
                    return;
                }
                comfyToast("Folder removed", "success");
                state.customRootId = "";
                await refreshCustomRoots();
                await reloadGrid();
            } catch (err) {
                console.warn("Majoor: remove custom root failed", err);
                comfyToast("An error occurred while removing the custom folder", "error");
            } finally {
                // Re-enable button regardless of outcome
                customRemoveBtn.disabled = !state.customRootId; // Keep disabled if no selection
                customRemoveBtn.textContent = "Remove";
            }
        });
    };

    return { refreshCustomRoots, bind };
}

