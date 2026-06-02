export function looksLikeComfyPromptGraph(obj: any): boolean {
    try {
        const entries = Object.entries(obj || {});
        if (!entries.length) return false;
        let hits = 0;
        for (const [, v] of entries.slice(0, 50)) {
            if (!v || typeof v !== "object") continue;
            if ((v as any).inputs && typeof (v as any).inputs === "object") hits += 1;
            if (hits >= 2) return true;
        }
        return false;
    } catch {
        return false;
    }
}

export function parseComfyUIWorkflow(workflow: any): Record<string, any> | null {
    if (!workflow || typeof workflow !== "object") return null;

    const metadata: Record<string, any> = {};
    const loras = [];

    for (const node of collectComfyWorkflowNodes(workflow)) {
        if (!node || typeof node !== "object") continue;
        const inputs = getNodeInputValues(node);
        if (!inputs || typeof inputs !== "object") continue;

        const classType = String((node as any)?.class_type || (node as any)?.type || "").toLowerCase();
        const title = String((node as any)?.title || (node as any)?._meta?.title || "").toLowerCase();

        const setIfString = (key: any, value: any) => {
            if (metadata[key]) return;
            if (typeof value !== "string") return;
            const text = value.trim();
            if (!text) return;
            // Heuristic: ignore numeric-only payloads (can happen on non-prompt nodes that also use `text`).
            if (/^[\d\s.,+-]+$/.test(text)) return;
            metadata[key] = text;
        };

        // Prompt extraction:
        // - Prefer explicit CLIP text encode nodes (ComfyUI conventions)
        // - Avoid taking arbitrary `inputs.text` from unrelated nodes (causes numbers / wrong fields)
        const isClipText =
            classType.includes("cliptextencode") ||
            classType.includes("clip_text_encode") ||
            title.includes("clip text encode");
        if (isClipText && typeof inputs.text === "string") {
            const isNegative = title.includes("negative");
            const isPositive =
                title.includes("positive") ||
                title.includes("(prompt)") ||
                title.includes("prompt");
            if (isNegative) setIfString("negative_prompt", inputs.text);
            else if (isPositive) setIfString("prompt", inputs.text);
            else setIfString("prompt", inputs.text);
        }

        // Backward-compatible prompt fields used by some nodes.
        setIfString("negative_prompt", inputs.negative_prompt);
        setIfString("negative_prompt", inputs.negative);

        // Last-resort: accept `inputs.text` only if class_type/title suggests it's a prompt node.
        // This avoids false positives from note nodes, title fields, or other text-containing nodes.
        if (!metadata.prompt && typeof inputs.text === "string") {
            const maybe = inputs.text.trim();
            const looksLikePromptNode =
                classType.includes("prompt") ||
                classType.includes("encode") ||
                classType.includes("positive") ||
                classType.includes("negative") ||
                title.includes("prompt") ||
                title.includes("positive") ||
                title.includes("negative");
            if (looksLikePromptNode && maybe.length >= 12 && /[a-zA-Z]/.test(maybe)) {
                setIfString("prompt", maybe);
            }
        }

        if (inputs.seed !== undefined && metadata.seed === undefined)
            metadata.seed = inputs.seed;
        if (inputs.steps !== undefined && metadata.steps === undefined)
            metadata.steps = inputs.steps;
        if (inputs.cfg !== undefined && metadata.cfg === undefined) metadata.cfg = inputs.cfg;
        if (inputs.sampler_name && !metadata.sampler) metadata.sampler = inputs.sampler_name;
        if (inputs.scheduler && !metadata.scheduler) metadata.scheduler = inputs.scheduler;
        if (inputs.denoise !== undefined && metadata.denoise === undefined)
            metadata.denoise = inputs.denoise;

        if (inputs.width !== undefined && metadata.width === undefined)
            metadata.width = inputs.width;
        if (inputs.height !== undefined && metadata.height === undefined)
            metadata.height = inputs.height;

        // Model chain extraction (keep names only; UI will normalize/strip extensions).
        // Different node packs use different keys, so we try a small set of common ones.
        const setModel = (key: any, value: any) => {
            if (metadata[key]) return;
            if (typeof value !== "string") return;
            const text = value.trim();
            if (!text) return;
            metadata[key] = text;
        };
        const modelKeyCandidates = [
            inputs.ckpt_name,
            inputs.checkpoint,
            inputs.checkpoint_name,
            inputs.model_name,
            inputs.model,
        ];
        for (const v of modelKeyCandidates) {
            if (!metadata.model) {
                setModel("model", v);
            }
        }
        setModel("vae", inputs.vae_name || inputs.vae);
        setModel("clip", inputs.clip_name || inputs.clip);
        setModel("unet", inputs.unet_name || inputs.unet);
        setModel(
            "diffusion",
            inputs.diffusion_name || inputs.diffusion_model || inputs.diffusion,
        );

        const looksLikeLora = classType.includes("lora") || classType.includes("loraloader");
        if (looksLikeLora) {
            const name = inputs.lora_name || inputs.lora || inputs.name || null;
            const w =
                inputs.strength_model ??
                inputs.strength ??
                inputs.weight ??
                inputs.lora_strength ??
                null;
            if (name) loras.push({ name, weight: w });
        }
    }

    if (loras.length) metadata.loras = loras;
    return Object.keys(metadata).length > 0 ? metadata : null;
}

function collectComfyWorkflowNodes(workflow: any, visited = new WeakSet()): any[] {
    if (!workflow || typeof workflow !== "object") return [];
    if (visited.has(workflow)) return [];
    visited.add(workflow);

    const out: any[] = [];
    const promptGraph = workflow.prompt && typeof workflow.prompt === "object" ? workflow.prompt : null;
    const graph = promptGraph || (looksLikeComfyPromptGraph(workflow) ? workflow : null);
    if (graph) out.push(...Object.values(graph));

    for (const graphLike of getGraphLikeObjects(workflow)) {
        const nodes = Array.isArray(graphLike?.nodes) ? graphLike.nodes.filter(Boolean) : [];
        out.push(...nodes);
        for (const node of nodes) {
            for (const subgraph of getNodeSubgraphCandidates(node)) {
                out.push(...collectComfyWorkflowNodes(subgraph, visited));
            }
        }
        for (const subgraph of getWorkflowSubgraphDefinitions(graphLike)) {
            out.push(...collectComfyWorkflowNodes(subgraph, visited));
        }
    }

    return out;
}

function getGraphLikeObjects(value: any): any[] {
    if (!value || typeof value !== "object") return [];
    const out = [];
    const add = (candidate: any) => {
        if (candidate && typeof candidate === "object" && Array.isArray(candidate.nodes)) out.push(candidate);
    };
    add(value);
    for (const key of ["workflow", "Workflow", "template", "Template", "subgraph", "Subgraph", "graph", "lgraph"]) {
        add(value?.[key]);
    }
    return out;
}

function getWorkflowSubgraphDefinitions(graphLike: any): any[] {
    return [
        ...(Array.isArray(graphLike?.definitions?.subgraphs) ? graphLike.definitions.subgraphs : []),
        ...(Array.isArray(graphLike?.subgraphs) ? graphLike.subgraphs : []),
        ...(Array.isArray(graphLike?.rootGraph?.subgraphs) ? graphLike.rootGraph.subgraphs : []),
    ].filter((item) => item && typeof item === "object" && Array.isArray(item.nodes));
}

function getNodeSubgraphCandidates(node: any): any[] {
    return [
        node?.subgraph,
        node?._subgraph,
        node?.subgraph?.graph,
        node?.subgraph?.lgraph,
        node?.properties?.subgraph,
        node?.subgraph_instance,
        node?.subgraph_instance?.graph,
        node?.inner_graph,
        node?.subgraph_graph,
    ].filter((item) => item && typeof item === "object" && Array.isArray(item.nodes));
}

function getNodeInputValues(node: any): Record<string, any> | null {
    const inputs = (node as any)?.inputs;
    if (inputs && typeof inputs === "object" && !Array.isArray(inputs)) return inputs as Record<string, any>;

    const values = (node as any)?.widgets_values;
    const mapped: Record<string, any> = {};
    if (values && typeof values === "object" && !Array.isArray(values)) {
        for (const [key, value] of Object.entries(values)) mapped[key] = value;
        return mapped;
    }

    if (!Array.isArray(inputs) || !Array.isArray(values)) return null;
    const widgetInputs = inputs.filter(inputLooksLikeWidgetOrUnlinkedValue);
    for (let index = 0; index < values.length; index += 1) {
        const input = widgetInputs[index] || inputs[index] || null;
        const label = String(
            input?.label ||
                input?.localized_name ||
                input?.name ||
                input?.widget?.name ||
                input?.widget?.label ||
                "",
        ).trim();
        mapped[label || `param_${index + 1}`] = values[index];
    }
    return mapped;
}

function inputLooksLikeWidgetOrUnlinkedValue(input: any) {
    if (!input || typeof input !== "object") return false;
    if (input.widget === true) return true;
    if (input.widget && typeof input.widget === "object") return true;
    if (typeof input.widget === "string" && input.widget.trim()) return true;
    if (input.link != null) return false;
    const type = String(input.type || "").trim().toUpperCase();
    return ["INT", "FLOAT", "STRING", "BOOLEAN", "BOOL", "COMBO", "ENUM"].includes(type);
}
