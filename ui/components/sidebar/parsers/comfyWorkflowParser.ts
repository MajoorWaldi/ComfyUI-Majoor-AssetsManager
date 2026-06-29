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
    const promptGraph = getPromptGraph(workflow);
    const samplerPasses: any[] = [];

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

        const resolvedSeed = resolveLinkedScalar(inputs.seed, promptGraph);
        const resolvedSteps = resolveLinkedScalar(inputs.steps, promptGraph);
        const resolvedCfg = resolveLinkedScalar(inputs.cfg, promptGraph);
        const resolvedDenoise = resolveLinkedScalar(inputs.denoise, promptGraph);
        if (resolvedSeed !== undefined && metadata.seed === undefined)
            metadata.seed = resolvedSeed;
        if (resolvedSteps !== undefined && metadata.steps === undefined)
            metadata.steps = resolvedSteps;
        if (resolvedCfg !== undefined && metadata.cfg === undefined) metadata.cfg = resolvedCfg;
        if (inputs.sampler_name && !metadata.sampler) metadata.sampler = inputs.sampler_name;
        if (inputs.scheduler && !metadata.scheduler) metadata.scheduler = inputs.scheduler;
        if (resolvedDenoise !== undefined && metadata.denoise === undefined)
            metadata.denoise = resolvedDenoise;
        if (isSamplerClass(classType)) {
            const passStage = classifySamplerPass(node, promptGraph);
            const linkedSettings = resolveSamplerLinkedSettings(node, promptGraph);
            const linkedModel =
                resolveLinkedModelName(node?.inputs?.model, promptGraph) ||
                resolveLinkedModelName(linkedSettings.model_link, promptGraph);
            samplerPasses.push({
                sampler_name: inputs.sampler_name || linkedSettings.sampler_name || inputs.sampler,
                scheduler: inputs.scheduler || linkedSettings.scheduler,
                steps: resolveLinkedScalar(inputs.steps, promptGraph) ?? linkedSettings.steps,
                cfg: resolveLinkedScalar(inputs.cfg, promptGraph) ?? linkedSettings.cfg,
                denoise: resolveLinkedScalar(inputs.denoise, promptGraph) ?? linkedSettings.denoise,
                seed: resolveLinkedScalar(inputs.seed ?? inputs.noise_seed, promptGraph) ?? linkedSettings.seed,
                start_at_step: resolveLinkedScalar(inputs.start_at_step, promptGraph),
                end_at_step: resolveLinkedScalar(inputs.end_at_step, promptGraph),
                model: linkedModel,
                pass_stage: passStage,
            });
        }

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
            if (!metadata.model && !classType.includes("upscale")) {
                setModel("model", v);
            }
        }
        if (classType.includes("upscale")) setModel("upscaler", inputs.model_name || inputs.upscale_model || inputs.model);
        setModel("vae", inputs.vae_name || inputs.vae);
        setModel("clip", inputs.clip_name || inputs.clip);
        const unetName = inputs.unet_name || inputs.unet;
        if (typeof unetName === "string" && unetName.trim()) {
            const models = metadata.models && typeof metadata.models === "object" ? metadata.models : {};
            if (/high[_\s-]?noise/i.test(unetName)) models.unet_high_noise = { name: unetName.trim() };
            else if (/low[_\s-]?noise/i.test(unetName)) models.unet_low_noise = { name: unetName.trim() };
            else setModel("unet", unetName);
            if (Object.keys(models).length) metadata.models = models;
        }
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
            if (name) {
                const item: Record<string, any> = { name };
                if (inputs.strength_model !== undefined) item.strength_model = inputs.strength_model;
                else item.weight = w;
                loras.push(item);
            }
        }
    }

    const uniqueLoras = dedupeGenerationItems(loras);
    const uniqueSamplerPasses = dedupeGenerationItems(samplerPasses, samplerPassKey);
    if (uniqueLoras.length) metadata.loras = uniqueLoras;
    if (uniqueSamplerPasses.length > 1) metadata.all_samplers = uniqueSamplerPasses;
    return Object.keys(metadata).length > 0 ? metadata : null;
}

function stableGenerationKey(item: any): string {
    if (!item || typeof item !== "object") return JSON.stringify(item);
    const out: Record<string, any> = {};
    for (const key of Object.keys(item).sort()) {
        const value = item[key];
        if (value === undefined || value === null || value === "") continue;
        out[key] = value;
    }
    return JSON.stringify(out);
}

function samplerPassKey(item: any): string {
    if (!item || typeof item !== "object") return stableGenerationKey(item);
    const parts = [
        item.sampler_name || item.sampler || "",
        item.scheduler || "",
        item.steps ?? "",
        item.cfg ?? "",
        item.denoise ?? "",
        item.seed ?? "",
        item.start_at_step ?? "",
        item.end_at_step ?? "",
    ];
    return parts.map((part) => String(part)).join("::");
}

function dedupeGenerationItems<T>(items: T[], keyFn: (item: T) => string = stableGenerationKey): T[] {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const item of items) {
        const key = keyFn(item);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(item);
    }
    return out;
}

function getPromptGraph(workflow: any): Record<string, any> | null {
    if (!workflow || typeof workflow !== "object") return null;
    let prompt = workflow.prompt;
    if (typeof prompt === "string" && prompt.trim()) {
        try {
            prompt = JSON.parse(prompt);
        } catch {
            prompt = null;
        }
    }
    const candidate = prompt && typeof prompt === "object" ? prompt : workflow;
    return looksLikeComfyPromptGraph(candidate) ? candidate : null;
}

function isSamplerClass(classType: string): boolean {
    if (classType.includes("ksamplerselect") || classType.includes("samplerselect")) return false;
    return (
        classType.includes("ksampler") ||
        classType.includes("samplercustom") ||
        classType.includes("sampler_custom")
    );
}

function classifySamplerPass(node: any, promptGraph: Record<string, any> | null): string {
    if (!promptGraph) return "";
    const linkedModel = resolveLinkedModelName(node?.inputs?.model, promptGraph).toLowerCase();
    if (hasHighNoiseRole(linkedModel)) return "high";
    if (hasLowNoiseRole(linkedModel)) return "low";
    if (/\b(upscale|upscaler|_to_\d{3,5}|to[_-]?\d{3,5})\b/i.test(linkedModel)) {
        return "upscale";
    }
    const allInputs = collectUpstreamClassTypes(node, promptGraph);
    const allHaystack = allInputs.join(" ");
    if (hasHighNoiseRole(allHaystack)) return "high";
    if (hasLowNoiseRole(allHaystack)) return "low";
    if (/\b(pidconditioning|imageupscalewithmodel|ultimate|supir|esrgan|realesrgan)\b/i.test(allHaystack)) {
        return "upscale";
    }
    const upstream = collectUpstreamClassTypes(node, promptGraph, "latent_image");
    const haystack = upstream.join(" ");
    if (/\b(inpaint|vaeencodeforinpaint|setlatentnoise mask|masktoimage)\b/i.test(haystack)) {
        return "inpaint";
    }
    if (
        /\b(latentupscale|latentupsampler|imageupscalewithmodel|ultimate|supir|esrgan|realesrgan)\b/i.test(haystack) &&
        !hasHighNoiseRole(allHaystack) &&
        !hasLowNoiseRole(allHaystack)
    ) {
        return "upscale";
    }
    if (/\b(vaeencode|loadimage|imagebatch|imagetolatent)\b/i.test(haystack)) {
        return "img2img";
    }
    if (/\b(emptylatentimage|emptysd3latentimage|emptychromaradiancelatentimage|empty latent)\b/i.test(haystack)) {
        return "txt2img";
    }
    return "";
}

function hasHighNoiseRole(value: any): boolean {
    return /(?:^|[^a-z0-9])high[_\s-]?noise(?:[^a-z0-9]|$)/i.test(String(value || ""));
}

function hasLowNoiseRole(value: any): boolean {
    return /(?:^|[^a-z0-9])low[_\s-]?noise(?:[^a-z0-9]|$)/i.test(String(value || ""));
}

function collectUpstreamClassTypes(
    node: any,
    promptGraph: Record<string, any>,
    inputName?: string,
): string[] {
    const startValues = inputName ? [node?.inputs?.[inputName]] : Object.values(node?.inputs || {});
    const out: string[] = [];
    const visited = new Set<string>();
    const visit = (current: any) => {
        const id = String(current?._mjrPromptId || current?.id || "");
        if (id && visited.has(id)) return;
        if (id) visited.add(id);
        const classType = String(current?.class_type || current?.type || current?._meta?.title || "");
        if (classType) out.push(classType.toLowerCase());
        const inputs = current?.inputs && typeof current.inputs === "object" ? current.inputs : {};
        for (const value of Object.values(inputs)) {
            const linked = getLinkedNode(value, promptGraph);
            if (linked) visit(linked);
        }
    };
    for (const value of startValues) {
        const start = getLinkedNode(value, promptGraph);
        if (start) visit(start);
    }
    return out;
}

function resolveSamplerLinkedSettings(node: any, promptGraph: Record<string, any> | null) {
    const out: Record<string, any> = {};
    if (!promptGraph) return out;
    const noiseNode = getLinkedNode(node?.inputs?.noise, promptGraph);
    const noiseInputs = noiseNode?.inputs || {};
    if (noiseInputs.noise_seed !== undefined) out.seed = noiseInputs.noise_seed;
    if (noiseInputs.seed !== undefined) out.seed = noiseInputs.seed;
    const guiderNode = getLinkedNode(node?.inputs?.guider, promptGraph);
    const guiderInputs = guiderNode?.inputs || {};
    if (guiderInputs.cfg !== undefined) out.cfg = guiderInputs.cfg;
    if (guiderInputs.model !== undefined) out.model_link = guiderInputs.model;
    const samplerNode = getLinkedNode(node?.inputs?.sampler, promptGraph);
    const samplerInputs = samplerNode?.inputs || {};
    if (samplerInputs.sampler_name) out.sampler_name = samplerInputs.sampler_name;
    const sigmasNode = getLinkedNode(node?.inputs?.sigmas, promptGraph);
    const sigmasInputs = sigmasNode?.inputs || {};
    if (sigmasInputs.scheduler) out.scheduler = sigmasInputs.scheduler;
    if (sigmasInputs.steps !== undefined) out.steps = resolveLinkedScalar(sigmasInputs.steps, promptGraph);
    if (sigmasInputs.denoise !== undefined) out.denoise = resolveLinkedScalar(sigmasInputs.denoise, promptGraph);
    if (out.steps === undefined && typeof sigmasInputs.sigmas === "string") {
        const count = sigmasInputs.sigmas
            .split(",")
            .map((part: string) => part.trim())
            .filter(Boolean).length;
        if (count > 1) out.steps = Math.max(1, count - 1);
    }
    return out;
}

function resolveLinkedScalar(value: any, promptGraph: Record<string, any> | null, visited = new Set<string>()): any {
    if (value === undefined || value === null) return value;
    if (!Array.isArray(value)) return value;
    if (!promptGraph) return undefined;
    const node = getLinkedNode(value, promptGraph);
    if (!node) return undefined;
    const id = String(node?._mjrPromptId || node?.id || value[0] || "");
    if (id && visited.has(id)) return undefined;
    if (id) visited.add(id);
    const inputs = node?.inputs && typeof node.inputs === "object" ? node.inputs : {};
    const classType = String(node?.class_type || node?.type || "").toLowerCase();
    if (classType.includes("switch")) {
        const switchValue = resolveLinkedScalar(inputs.switch, promptGraph, visited);
        const branch = switchValue ? inputs.on_true : inputs.on_false;
        return resolveLinkedScalar(branch, promptGraph, visited);
    }
    if (Object.prototype.hasOwnProperty.call(inputs, "value")) return inputs.value;
    for (const key of ["number", "int", "float", "seed", "steps", "cfg"]) {
        if (Object.prototype.hasOwnProperty.call(inputs, key)) return inputs[key];
    }
    return undefined;
}

function resolveLinkedModelName(value: any, promptGraph: Record<string, any> | null): string {
    if (!promptGraph) return "";
    const visited = new Set<string>();
    const visit = (linkValue: any): string => {
        const current = getLinkedNode(linkValue, promptGraph);
        if (!current) return "";
        const id = String(current?._mjrPromptId || current?.id || "");
        if (id && visited.has(id)) return "";
        if (id) visited.add(id);
        const inputs = current?.inputs || {};
        const classType = String(current?.class_type || current?.type || "").toLowerCase();
        if (classType.includes("switch")) {
            const switchValue = resolveLinkedScalar(inputs.switch, promptGraph);
            const found = visit(switchValue ? inputs.on_true : inputs.on_false);
            if (found) return found;
        }
        const direct =
            inputs.unet_name ||
            inputs.ckpt_name ||
            inputs.model_name ||
            inputs.model ||
            inputs.checkpoint ||
            inputs.checkpoint_name ||
            "";
        if (typeof direct === "string" && direct.trim()) return direct.trim();
        for (const upstream of Object.values(inputs)) {
            const found = visit(upstream);
            if (found) return found;
        }
        return "";
    };
    return visit(value);
}

function getLinkedNode(value: any, promptGraph: Record<string, any>): any | null {
    if (!Array.isArray(value) || value.length < 1) return null;
    const nodeId = String(value[0]);
    const node = promptGraph[nodeId];
    if (!node || typeof node !== "object") return null;
    if (!node._mjrPromptId) {
        try {
            Object.defineProperty(node, "_mjrPromptId", { value: nodeId, enumerable: false });
        } catch {
            // Non-extensible metadata objects are rare; traversal can continue without stable ids.
        }
    }
    return node;
}

function collectComfyWorkflowNodes(workflow: any, visited = new WeakSet()): any[] {
    if (!workflow || typeof workflow !== "object") return [];
    if (visited.has(workflow)) return [];
    visited.add(workflow);

    const out: any[] = [];
    let promptValue = workflow.prompt;
    if (typeof promptValue === "string" && promptValue.trim()) {
        try {
            promptValue = JSON.parse(promptValue);
        } catch {
            promptValue = null;
        }
    }
    const promptGraph = promptValue && typeof promptValue === "object" ? promptValue : null;
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
