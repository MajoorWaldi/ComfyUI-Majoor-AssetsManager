import { NODE_STREAM_FEATURE_ENABLED } from "../viewer/nodeStream/nodeStreamFeatureFlag.js";

export function exposeDebugApis({ resolveNodeStreamModule }) {
    if (typeof window === "undefined") return;

    window.MajoorDebug = {
        exportMetrics: () => window.MajoorMetrics?.exportMetrics?.(),
        getMetrics: () => window.MajoorMetrics?.getMetricsReport?.(),
        resetMetrics: () => window.MajoorMetrics?.resetMetrics?.(),
    };
    console.debug?.(
        "[Majoor] Debug commands available: window.MajoorDebug.exportMetrics(), window.MajoorDebug.getMetrics(), window.MajoorDebug.resetMetrics()",
    );

    if (!NODE_STREAM_FEATURE_ENABLED) {
        try {
            delete window.MajoorNodeStream;
        } catch {
            window.MajoorNodeStream = undefined;
        }
        return;
    }

    const nodeStreamApi =
        (fn) =>
        async (...args) => {
            const mod = await resolveNodeStreamModule();
            return mod?.[fn]?.(...args);
        };

    window.MajoorNodeStream = {
        mode: "selection-only",
        listAdapters: nodeStreamApi("listAdapters"),
        async getKnownNodeSets() {
            const { getKnownNodeSets } =
                await import("../viewer/nodeStream/adapters/KnownNodesAdapter.js");
            return getKnownNodeSets();
        },
    };
    console.debug?.(
        "[Majoor] NodeStream API: window.MajoorNodeStream.mode, .listAdapters(), .getKnownNodeSets()",
    );
}
