/**
 * Node Stream — selection-only preview follow for the MFV.
 *
 * The active implementation follows the selected canvas node and streams the
 * best frontend-observable preview already available in ComfyUI.
 *
 * Built-in adapters remain an internal compatibility registry used for debug
 * listing and known-node inspection only. Third-party adapter registration is
 * no longer part of the active public Node Stream contract.
 */

export {
    initNodeStream,
    onNodeOutputs,
    teardownNodeStream,
    setNodeStreamActive,
    getNodeStreamActive,
    setWatchMode,
    getWatchMode,
    pinNode,
    getPinnedNodeId,
    getSelectedNodeId,
    listAdapters,
} from "./NodeStreamController.js";

export {
    isKnownProcessingNode,
    isKnownOutputNode,
    getKnownNodeSets,
} from "./adapters/KnownNodesAdapter.js";
