import { comfyConfirm } from "../../app/dialogs.js";
import { comfyToast } from "../../app/toast.js";
import { t } from "../../app/i18n.js";
import { mergeDuplicateTags, deleteAssets, startDuplicatesAnalysis } from "../../api/client.js";

/**
 * Builds the `extraActions` object wired into the context controller.
 *
 * Houses all context-menu actions that require async API calls or complex
 * cross-controller coordination:
 *  - clearSimilarScope          — exits the similar-results view
 *  - clearTransientContext      — resets similar-results state
 *  - resetBrowserHistory        — clears folder navigation stack
 *  - onDuplicateAlertClick      — merge / delete duplicate assets flow
 *
 * @returns {object} extraActions
 */
export function buildContextMenuExtraActions({
    state,
    scopeController,
    browserNav,
    gridController,
    getDuplicatesAlert,
    refreshDuplicateAlerts,
}) {
    return {
        clearSimilarScope: async () => {
            try {
                await scopeController?.clearSimilarScope?.();
            } catch (e) {
                console.debug?.(e);
            }
        },

        clearTransientContext: async () => {
            try {
                state.viewScope = "";
                state.similarResults = [];
                state.similarTitle = "";
                state.similarSourceAssetId = "";
            } catch (e) {
                console.debug?.(e);
            }
        },

        resetBrowserHistory: () => {
            try {
                browserNav?.resetHistory?.();
            } catch (e) {
                console.debug?.(e);
            }
        },

        onDuplicateAlertClick: async (alert) => {
            const current = alert || getDuplicatesAlert() || {};
            const grp = current.firstGroup;

            if (grp && Array.isArray(grp.assets) && grp.assets.length >= 2) {
                const keep = grp.assets[0] || {};
                const dupIds = grp.assets
                    .slice(1)
                    .map((x) => Number(x?.id || 0))
                    .filter((x) => x > 0);

                if (dupIds.length) {
                    const mergeOk = await comfyConfirm(
                        t(
                            "dialog.mergeDuplicateTags",
                            'Exact duplicates detected ({count}). Merge tags into "{target}"?',
                            { count: grp.assets.length, target: keep?.filename || keep?.id },
                        ),
                    );
                    if (mergeOk) {
                        const mergeRes = await mergeDuplicateTags(Number(keep?.id || 0), dupIds);
                        if (mergeRes?.ok)
                            comfyToast(t("toast.tagsMerged", "Tags merged"), "success", 2200);
                        else
                            comfyToast(
                                t("toast.tagMergeFailed", "Tag merge failed: {error}", {
                                    error: mergeRes?.error || "error",
                                }),
                                "warning",
                                3500,
                            );
                    }

                    const delOk = await comfyConfirm(
                        t("dialog.deleteExactDuplicates", "Delete {count} exact duplicate(s)?", {
                            count: dupIds.length,
                        }),
                    );
                    if (delOk) {
                        const delRes = await deleteAssets(dupIds);
                        if (delRes?.ok) {
                            comfyToast(
                                t("toast.duplicatesDeleted", "Duplicates deleted"),
                                "success",
                                2200,
                            );
                            await gridController.reloadGrid();
                        } else {
                            comfyToast(
                                t("toast.deleteFailed", "Delete failed: {error}", {
                                    error: delRes?.error || "error",
                                }),
                                "warning",
                                3500,
                            );
                        }
                    }
                    await refreshDuplicateAlerts();
                    return;
                }
            }

            const startOk = await comfyConfirm(
                t("dialog.startDuplicateAnalysis", "Start duplicate analysis in background?"),
            );
            if (!startOk) return;
            const runRes = await startDuplicatesAnalysis(500);
            if (runRes?.ok)
                comfyToast(
                    t("toast.dupAnalysisStarted", "Duplicate analysis started"),
                    "info",
                    2200,
                );
            else
                comfyToast(
                    t("toast.analysisNotStarted", "Analysis not started: {error}", {
                        error: runRes?.error || "error",
                    }),
                    "warning",
                    3500,
                );
            await refreshDuplicateAlerts();
        },
    };
}
