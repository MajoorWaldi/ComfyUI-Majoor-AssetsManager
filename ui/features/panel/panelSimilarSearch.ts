import { EVENTS } from "../../app/events.js";
import { get, vectorFindSimilar } from "../../api/client.js";
import { buildNodeContextMembersURL } from "../../api/endpoints.js";
import { comfyToast } from "../../app/toast.js";
import { t } from "../../app/i18n.js";

const STACK_GROUP_RENDER_LIMIT = 500;

function isNodeContextRouteMissing(res: any) {
    return (
        Number(res?.status || 0) === 404 &&
        String(res?.error || "")
            .toLowerCase()
            .includes("non-json")
    );
}

function limitStackGroupMembers(list: any[], title = "") {
    const items = Array.isArray(list) ? list : [];
    if (items.length <= STACK_GROUP_RENDER_LIMIT) {
        return { list: items, title, truncated: false, total: items.length };
    }
    return {
        list: items.slice(0, STACK_GROUP_RENDER_LIMIT),
        title: `${String(title || "").trim() || "Generation group"} - showing first ${STACK_GROUP_RENDER_LIMIT}/${items.length}`,
        truncated: true,
        total: items.length,
    };
}

function buildGroupSourceId(detail: Record<string, any> = {}) {
    const stackId = String(detail?.stackId || detail?.stack_id || "").trim();
    if (stackId) return `stack:${stackId}`;
    const assetId = String(detail?.asset?.id || "").trim();
    if (detail?.isDupGroup) return assetId ? `duplicates:${assetId}` : "duplicates";
    return assetId ? `group:${assetId}` : "group";
}

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
}: Record<string, any>): void {
    const openNodeContext = async (detail: Record<string, any> = {}) => {
        const sourceNodeId = String(detail?.sourceNodeId || detail?.source_node_id || "").trim();
        if (!sourceNodeId) return;
        try {
            closePopovers?.();
        } catch (err) {
            console.debug?.(err);
        }
        try {
            const res = await get(
                buildNodeContextMembersURL(sourceNodeId, {
                    jobId: detail?.jobId || detail?.job_id || "",
                    latest: detail?.latest !== false,
                    limit: 500,
                }),
                { timeoutMs: 30_000 },
            );
            if (!res?.ok) {
                if (isNodeContextRouteMissing(res)) {
                    const root = ((window as any).MajoorAssetsManager ||= {});
                    if (!root.nodeContextRouteMissingToastShown) {
                        root.nodeContextRouteMissingToastShown = true;
                        comfyToast(
                            t(
                                "nodeContext.routeMissing",
                                "Node context backend route is not loaded yet. Restart ComfyUI after updating Majoor Assets Manager.",
                            ),
                            "warn",
                            7000,
                        );
                    }
                    return;
                }
                comfyToast(
                    String(res?.error || t("nodeContext.loadFailed", "Failed to load node assets")),
                    "error",
                    3000,
                );
                return;
            }
            const list = Array.isArray(res?.data) ? res.data : [];
            if (!list.length) {
                comfyToast(
                    t("nodeContext.noAssets", "No indexed assets found for this node yet."),
                    "info",
                    2600,
                );
                return;
            }
            const nodeLabel = String(
                detail?.title || detail?.sourceNodeType || detail?.source_node_type || sourceNodeId,
            ).trim();
            writePanelValue("similarResults", list);
            writePanelValue("similarSourceAssetId", `node:${sourceNodeId}`);
            writePanelValue(
                "similarTitle",
                t("nodeContext.resultsTitle", "Node {node} outputs ({n} assets)", {
                    node: nodeLabel || sourceNodeId,
                    n: list.length,
                }),
            );
            await scopeController?.setScope?.("similar");
        } catch (err) {
            console.debug?.(err);
            comfyToast(t("nodeContext.loadFailed", "Failed to load node assets"), "error", 3000);
        }
    };

    // -- Similar button click -----------------------------------------------

    similarBtn?.addEventListener(
        "click",
        async (e: any) => {
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

    // -- Stack-group open event ---------------------------------------------

    gridContainer?.addEventListener(
        EVENTS.OPEN_STACK_GROUP,
        async (event: any) => {
            try {
                const detail = event?.detail || {};
                const rawList = Array.isArray(detail?.members) ? detail.members : [];
                const fallbackTitle = `Generation group (${rawList.length} assets)`;
                const limited = limitStackGroupMembers(
                    rawList,
                    String(detail?.title || "").trim() || fallbackTitle,
                );
                if (limited.truncated) {
                    comfyToast(
                        `Large stack truncated to ${STACK_GROUP_RENDER_LIMIT}/${limited.total} assets to keep the grid responsive.`,
                        "warn",
                        5000,
                    );
                }
                writePanelValue("similarResults", limited.list);
                writePanelValue("similarSourceAssetId", buildGroupSourceId(detail));
                writePanelValue("similarTitle", limited.title || fallbackTitle);
                await Promise.resolve();
                await scopeController?.setScope?.("similar");
            } catch (err) {
                console.debug?.(err);
            }
        },
        { signal: panelLifecycleAC?.signal },
    );

    window.addEventListener(
        EVENTS.OPEN_NODE_CONTEXT,
        (event) => {
            void openNodeContext((event as any)?.detail || {});
        },
        { signal: panelLifecycleAC?.signal },
    );

    try {
        const pending = (window as any).MajoorAssetsManager?.pendingNodeContext || null;
        if (pending) {
            (window as any).MajoorAssetsManager.pendingNodeContext = null;
            setTimeout(() => {
                void openNodeContext(pending);
            }, 0);
        }
    } catch (err) {
        console.debug?.(err);
    }
}
