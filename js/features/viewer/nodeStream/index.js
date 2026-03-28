/**
 * Node Stream — live-stream intermediate ComfyUI node outputs to the MFV.
 *
 * ## Two data paths
 *
 * **Path 1 (file-based)** — for OUTPUT_NODE=True nodes (SaveImage, PreviewImage,
 * VHS_VideoCombine, etc.) that return `{"ui": {"images"|"gifs": [...]}}`.
 * Uses adapter registry → `onNodeOutputsUpdated`.
 *
 * **Path 2 (canvas-based)** — for ANY processing node whose output is visible
 * on the canvas (node.imgs).  Hooks the `executing` API event to detect when
 * a node finishes, then reads its preview from the canvas DOM.
 * Works with LayerStyle, KJNodes, Essentials, VHS, core ComfyUI — anything.
 *
 * ## Quick start — add a custom adapter
 *
 *   import { createAdapter } from "./adapters/BaseAdapter.js";
 *   import { registerAdapter } from "../nodeStream/NodeStreamRegistry.js";
 *
 *   registerAdapter(createAdapter({
 *       name: "my-custom-adapter",
 *       priority: 50,
 *       description: "Handles MyCustomNode output",
 *       canHandle(classType, outputs) {
 *           return classType === "MyCustomNode" && !!outputs?.my_output;
 *       },
 *       extractMedia(classType, outputs, nodeId) {
 *           return outputs.my_output.map(item => ({
 *               filename: item.filename,
 *               subfolder: item.subfolder || "",
 *               type: item.type || "output",
 *               _nodeId: nodeId,
 *               _classType: classType,
 *           }));
 *       },
 *   }));
 *
 * ## From console / third-party extensions
 *
 *   window.MajoorNodeStream.registerAdapter(
 *       window.MajoorNodeStream.createAdapter({ ... })
 *   );
 *   window.MajoorNodeStream.listAdapters();
 *   window.MajoorNodeStream.getKnownNodeSets();
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
    registerAdapter,
    listAdapters,
} from "./NodeStreamController.js";

export { findAdapter, registerAdapter as registerAdapterDirect } from "./NodeStreamRegistry.js";
export { createAdapter } from "./adapters/BaseAdapter.js";
export {
    isKnownProcessingNode,
    isKnownOutputNode,
    getKnownNodeSets,
} from "./adapters/KnownNodesAdapter.js";
