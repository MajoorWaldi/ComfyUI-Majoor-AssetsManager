import { EVENTS } from "../../app/events.js";
import { get, getAssetMetadata, vectorFindSimilar } from "../../api/client.js";
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

function readAssetField(asset: any, key: string): string {
    return String(asset?.[key] ?? asset?.file_info?.[key] ?? "").trim();
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
    similarPopover,
    similarFindBtn,
    similarDuplicatesBtn,
    similarSameNodeBtn,
    similarSameWorkflowBtn,
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
    closePeerPopovers,
    popovers,
    workflowIdInput,
    reloadGrid,
    getDuplicatesAlert,
}: Record<string, any>): void {
    const selectedAssetId = () =>
        String(readActiveAssetId() || readSelectedAssetIds()[0] || "").trim();

    const selectedNumericAssetId = () => {
        const selectedId = Number(selectedAssetId());
        return Number.isFinite(selectedId) && selectedId > 0 ? selectedId : 0;
    };

    const getActiveAssetFromGrid = () => {
        const activeId = selectedAssetId();
        if (!activeId) return null;
        try {
            const getAssets = gridContainer?._mjrGetAssets;
            const list = typeof getAssets === "function" ? getAssets() : [];
            return Array.isArray(list)
                ? list.find((asset) => String(asset?.id || "") === activeId) || null
                : null;
        } catch (err) {
            console.debug?.(err);
            return null;
        }
    };

    const getActiveAsset = async () => {
        const fromGrid = getActiveAssetFromGrid();
        if (fromGrid) return fromGrid;
        const id = selectedNumericAssetId();
        if (!id) return null;
        return fetchActiveAssetMetadata(id);
    };

    const fetchActiveAssetMetadata = async (id = selectedNumericAssetId()) => {
        if (!id) return null;
        try {
            const res = await getAssetMetadata(id, { timeoutMs: 30_000 });
            return res?.ok ? res.data || null : null;
        } catch (err) {
            console.debug?.(err);
            return null;
        }
    };

    const hydrateActiveAssetWhenMissing = async (asset: any, keys: string[]) => {
        if (asset && keys.some((key) => readAssetField(asset, key))) return asset;
        const fresh = await fetchActiveAssetMetadata();
        return fresh || asset;
    };

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

    const runFindSimilar = async () => {
        if (!isAiEnabled()) {
            comfyToast(similarDisabledTitle, "info", 2200);
            return;
        }

        try {
            closePopovers();
        } catch (err) {
            console.debug?.(err);
        }

        const selectedId = selectedNumericAssetId();
        if (!selectedId) {
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
    };

    const runFindDuplicates = async () => {
        try {
            closePopovers?.();
        } catch (err) {
            console.debug?.(err);
        }
        const activeAsset = await getActiveAsset();
        const activeId = String(activeAsset?.id || selectedAssetId() || "").trim();
        const members = Array.isArray(activeAsset?._mjrDupMembers)
            ? activeAsset._mjrDupMembers
            : [];
        if (members.length >= 2) {
            writePanelValue("similarResults", members);
            writePanelValue("similarSourceAssetId", activeId ? `duplicates:${activeId}` : "duplicates");
            writePanelValue(
                "similarTitle",
                t("search.duplicateResults", "Duplicates ({n} assets)", { n: members.length }),
            );
            await scopeController?.setScope?.("similar");
            return;
        }

        const alert = getDuplicatesAlert?.() || {};
        const group = alert?.firstGroup;
        if (group && Array.isArray(group.assets) && group.assets.length >= 2) {
            writePanelValue("similarResults", group.assets);
            writePanelValue("similarSourceAssetId", "duplicates");
            writePanelValue(
                "similarTitle",
                t("search.duplicateResults", "Duplicates ({n} assets)", { n: group.assets.length }),
            );
            await scopeController?.setScope?.("similar");
            return;
        }

        comfyToast(
            t(
                "search.noKnownDuplicates",
                "No duplicate group is available yet. Run duplicate analysis from the duplicate alert first.",
            ),
            "info",
            3200,
        );
    };

    const runSameSaveNode = async () => {
        const asset = await hydrateActiveAssetWhenMissing(await getActiveAsset(), [
            "source_node_id",
            "source_node_type",
        ]);
        const sourceNodeId = readAssetField(asset, "source_node_id");
        if (!sourceNodeId) {
            comfyToast(
                t("search.noSourceNode", "Selected asset has no persisted source node id."),
                "info",
                2600,
            );
            return;
        }
        await openNodeContext({
            sourceNodeId,
            sourceNodeType: readAssetField(asset, "source_node_type"),
            jobId: readAssetField(asset, "job_id"),
            title: readAssetField(asset, "source_node_type") || sourceNodeId,
        });
    };

    const runSameWorkflow = async () => {
        try {
            closePopovers?.();
        } catch (err) {
            console.debug?.(err);
        }
        const asset = await hydrateActiveAssetWhenMissing(await getActiveAsset(), ["workflow_id"]);
        const workflowId = readAssetField(asset, "workflow_id");
        if (!workflowId) {
            comfyToast(
                t("search.noWorkflowId", "Selected asset has no persisted workflow id."),
                "info",
                2600,
            );
            return;
        }
        writePanelValue("workflowId", workflowId);
        try {
            if (workflowIdInput) workflowIdInput.value = workflowId;
        } catch (err) {
            console.debug?.(err);
        }
        try {
            await scopeController?.setScope?.(state.scope || "output");
        } catch (err) {
            console.debug?.(err);
        }
        await reloadGrid?.();
    };

    // -- Similar menu button + actions --------------------------------------

    similarBtn?.addEventListener(
        "click",
        (e: any) => {
            e.stopPropagation();
            try {
                closePeerPopovers?.();
            } catch (err) {
                console.debug?.(err);
            }
            popovers?.toggle?.(similarPopover, similarBtn);
        },
        { signal: panelLifecycleAC?.signal },
    );

    const bindAction = (button: any, handler: any) => {
        button?.addEventListener(
            "click",
            (event: any) => {
                event.stopPropagation();
                void handler();
            },
            { signal: panelLifecycleAC?.signal },
        );
    };

    bindAction(similarFindBtn, runFindSimilar);
    bindAction(similarDuplicatesBtn, runFindDuplicates);
    bindAction(similarSameNodeBtn, runSameSaveNode);
    bindAction(similarSameWorkflowBtn, runSameWorkflow);

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
