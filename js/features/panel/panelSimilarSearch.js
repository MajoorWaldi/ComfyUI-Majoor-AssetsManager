import { EVENTS } from "../../app/events.js";
import { vectorFindSimilar } from "../../api/client.js";
import { comfyToast } from "../../app/toast.js";
import { t } from "../../app/i18n.js";

/**
 * Binds the "Find Similar" button and the stack-group open event.
 *
 * Both interactions build a virtual asset list from vector search results /
 * a stack-group member set, write it to panel state, and switch the panel to
 * the "similar" view scope.
 *
 * Listeners are removed automatically when `panelLifecycleAC` is aborted.
 */
export function bindSimilarSearch({
    similarBtn,
    gridContainer,
    state,
    panelLifecycleAC,
    isAiEnabled,
    similarDisabledTitle,
    readActiveAssetId,
    readSelectedAssetIds,
    readPanelValue,
    writePanelValue,
    scopeController,
    closePopovers,
}) {
    // ── Similar button click ───────────────────────────────────────────────

    similarBtn?.addEventListener(
        "click",
        async (e) => {
            e.stopPropagation();
            if (!isAiEnabled()) {
                comfyToast(similarDisabledTitle, "info", 2200);
                return;
            }

            try {
                closePopovers();
            } catch (err) {
                console.debug?.(err);
            }

            const selectedIdRaw = String(
                readActiveAssetId() || readSelectedAssetIds()[0] || "",
            ).trim();
            const selectedId = Number(selectedIdRaw);
            if (!Number.isFinite(selectedId) || selectedId <= 0) {
                comfyToast(
                    t(
                        "search.selectAssetForSimilar",
                        "Select an asset first to find similar images/videos.",
                    ),
                    "info",
                    2500,
                );
                return;
            }

            const prevTitle = similarBtn.title;
            similarBtn.disabled = true;
            similarBtn.title = t("search.findingSimilar", "Finding similar assets...");
            try {
                const res = await vectorFindSimilar(selectedId, {
                    topK: 100,
                    scope: state.scope || "output",
                    customRootId: state.customRootId || "",
                });
                if (!res?.ok) {
                    comfyToast(
                        String(
                            res?.error ||
                                t("search.findSimilarFailed", "Failed to find similar assets"),
                        ),
                        "error",
                        3000,
                    );
                    return;
                }
                const list = Array.isArray(res?.data) ? res.data : [];
                writePanelValue("similarResults", list);
                writePanelValue("similarSourceAssetId", String(selectedId));
                writePanelValue(
                    "similarTitle",
                    t("search.similarResults", "Similar to asset #{id} ({n} results)", {
                        id: selectedId,
                        n: list.length,
                    }),
                );
                await scopeController?.setScope?.("similar");
            } catch (err) {
                console.debug?.(err);
                comfyToast(
                    t("search.findSimilarFailed", "Failed to find similar assets"),
                    "error",
                    3000,
                );
            } finally {
                similarBtn.disabled = false;
                similarBtn.title = prevTitle;
            }
        },
        { signal: panelLifecycleAC?.signal },
    );

    // ── Stack-group open event ─────────────────────────────────────────────

    gridContainer?.addEventListener(
        EVENTS.OPEN_STACK_GROUP,
        async (event) => {
            try {
                const detail = event?.detail || {};
                const list = Array.isArray(detail?.members) ? detail.members : [];
                writePanelValue("similarResults", list);
                writePanelValue("similarSourceAssetId", String(detail?.asset?.id || ""));
                writePanelValue(
                    "similarTitle",
                    String(detail?.title || "").trim() ||
                        `Generation group (${list.length} assets)`,
                );
                await scopeController?.setScope?.("similar");
            } catch (err) {
                console.debug?.(err);
            }
        },
        { signal: panelLifecycleAC?.signal },
    );
}
