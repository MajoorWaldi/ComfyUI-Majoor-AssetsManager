import { NODE_STREAM_FEATURE_ENABLED } from "../viewer/nodeStream/nodeStreamFeatureFlag.js";

export function exposeDebugApis({ resolveNodeStreamModule }: { resolveNodeStreamModule: (...args: any[]) => any }): void {
    if (typeof window === "undefined") return;

    (window as any).MajoorDebug = {
        exportMetrics: () => (window as any).MajoorMetrics?.exportMetrics?.(),
        getMetrics: () => (window as any).MajoorMetrics?.getMetricsReport?.(),
        resetMetrics: () => (window as any).MajoorMetrics?.resetMetrics?.(),
    };
    console.debug?.(
        "[Majoor] Debug commands available: window.MajoorDebug.exportMetrics(), window.MajoorDebug.getMetrics(), window.MajoorDebug.resetMetrics()",
    );

    if (!NODE_STREAM_FEATURE_ENABLED) {
        try {
            delete (window as any).MajoorNodeStream;
        } catch {
            (window as any).MajoorNodeStream = undefined;
        }
        return;
    }

    const nodeStreamApi =
        (fn: any) =>
        async (...args: any[]) => {
            const mod = await resolveNodeStreamModule();
            return mod?.[fn]?.(...args);
        };

    (window as any).MajoorNodeStream = {
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
