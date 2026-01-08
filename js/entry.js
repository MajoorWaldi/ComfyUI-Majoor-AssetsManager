/**
 * Entry Point - Majoor Assets Manager
 * Registers extension with ComfyUI and mounts UI.
 */

import { app } from "../../scripts/app.js";
import { testAPI, triggerStartupScan } from "./app/bootstrap.js";
import { ensureStyleLoaded } from "./app/style.js";
import { registerMajoorSettings } from "./app/settings.js";
import { initDragDrop } from "./features/dnd/DragDrop.js";
import { loadAssets, upsertAsset, captureAnchor, restoreAnchor, isAtBottom, scrollToBottom } from "./features/grid/GridView.js";
import { renderAssetsManager, getActiveGridContainer } from "./features/panel/AssetsManagerPanel.js";
import { extractOutputFiles } from "./utils/extractOutputFiles.js";
import { post, get } from "./api/client.js";
import { ENDPOINTS } from "./api/endpoints.js";
import { buildListURL } from "./api/endpoints.js";

const UI_FLAGS = {
    useComfyThemeUI: true,
};

function isObservabilityEnabled() {
    try {
        const raw = localStorage?.getItem?.("mjrSettings");
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        return !!parsed?.observability?.enabled;
    } catch {
        return false;
    }
}

app.registerExtension({
    name: "Majoor.AssetsManager",

    async setup() {
        testAPI();
        ensureStyleLoaded({ enabled: UI_FLAGS.useComfyThemeUI });
        initDragDrop();

        registerMajoorSettings(app, () => {
            const grid = getActiveGridContainer();
            if (grid) loadAssets(grid);
        });

        triggerStartupScan();

        const api = app.api || (app.ui ? app.ui.api : null);
        if (api) {
            // Avoid double-binding when ComfyUI reloads extensions.
            try {
                if (api._mjrExecutedHandler) {
                    api.removeEventListener("executed", api._mjrExecutedHandler);
                }
            } catch {}

            api._mjrExecutedHandler = async (event) => {
                const output = event.detail?.output;
                const grid = getActiveGridContainer();
                if (!output || !grid) return;

                const hasMedia = output.images || output.gifs || output.videos;
                if (!hasMedia) return;

                console.log("📂 Majoor [ℹ️] New media generated, refreshing grid...");

                setTimeout(async () => {
                    await new Promise((resolve) => setTimeout(resolve, 1500));

                    const files = extractOutputFiles(output);
                    if (!files.length) return;

                    await post(ENDPOINTS.INDEX_FILES, { files, incremental: true });

                    const latestGrid = getActiveGridContainer();
                    if (latestGrid) {
                        // Use incremental update instead of full reload
                        const anchor = captureAnchor(latestGrid);

                        // Get assets for the specific files that were just generated
                        const generatedFiles = files.map(f => f.filename); // Use the files we know were just generated
                        const scope = latestGrid.dataset?.mjrScope || "output";
                        const customRootId = latestGrid.dataset?.mjrCustomRootId || "";
                        const subfolder = latestGrid.dataset?.mjrSubfolder || "";
                        const kind = latestGrid.dataset?.mjrFilterKind || "";
                        const workflowOnly = latestGrid.dataset?.mjrFilterWorkflowOnly === "1";
                        const minRating = Number(latestGrid.dataset?.mjrFilterMinRating || 0) || 0;

                        // For each generated file, try to find the corresponding asset
                        for (const file of generatedFiles) {
                            // Build a query specifically for this file
                            const url = buildListURL({
                                q: file,  // Search specifically for this filename
                                limit: 1,
                                offset: 0,
                                scope,
                                subfolder,
                                customRootId: customRootId || null,
                                kind: kind || null,
                                hasWorkflow: workflowOnly ? true : null,
                                minRating: minRating > 0 ? minRating : null,
                                includeTotal: false
                            });

                            const result = await get(url);
                            if (result.ok && result.data?.assets?.length > 0) {
                                const asset = result.data.assets[0];
                                upsertAsset(latestGrid, asset);
                            }
                        }

                        // Check if user is at bottom to decide whether to follow newest
                        if (isAtBottom(latestGrid)) {
                            // If user is at bottom, scroll to bottom after upserting all assets

                            // Wait for layout to stabilize before scrolling
                            await new Promise(r => requestAnimationFrame(() => r()));
                            await new Promise(r => requestAnimationFrame(() => r()));
                            scrollToBottom(latestGrid);
                        } else {
                            // If user is not at bottom, preserve scroll position
                            await restoreAnchor(latestGrid, anchor);
                        }
                    }
                }, 500);
            };
            api.addEventListener("executed", api._mjrExecutedHandler);

            console.log("📂 Majoor [✅] Real-time listener registered");
        } else {
            console.warn("📂 Majoor [⚠️] API not available, real-time updates disabled");
        }

        if (app.extensionManager?.registerSidebarTab) {
            app.extensionManager.registerSidebarTab({
                id: "majoor-assets",
                icon: "pi pi-folder",
                title: "Assets Manager",
                tooltip: "Majoor Assets Manager - Browse and search your outputs",
                type: "custom",
                render: (el) => {
                    void renderAssetsManager(el, { useComfyThemeUI: UI_FLAGS.useComfyThemeUI });
                },
            });

            console.log("📂 Majoor Assets Manager: Sidebar tab registered");
        } else {
            console.warn("📂 Majoor Assets Manager: extensionManager.registerSidebarTab is unavailable");
        }
    },
});
