export function looksLikeComfyPromptGraph(obj) {
    try {
        const entries = Object.entries(obj || {});
        if (!entries.length) return false;
        let hits = 0;
        for (const [, v] of entries.slice(0, 50)) {
            if (!v || typeof v !== "object") continue;
            if (v.inputs && typeof v.inputs === "object") hits += 1;
            if (hits >= 2) return true;
        }
        return false;
    } catch {
        return false;
    }
}

export function parseComfyUIWorkflow(workflow) {
    if (!workflow || typeof workflow !== "object") return null;

    const metadata = {};

    const promptGraph = workflow.prompt && typeof workflow.prompt === "object" ? workflow.prompt : null;
    const graph = promptGraph || (looksLikeComfyPromptGraph(workflow) ? workflow : null);

    if (graph) {
        const loras = [];
        for (const [, node] of Object.entries(graph)) {
            if (!node || typeof node !== "object") continue;
            const inputs = node.inputs;
            if (!inputs || typeof inputs !== "object") continue;

            const classType = String(node?.class_type || node?.type || "").toLowerCase();
            const title = String(node?.title || node?._meta?.title || "").toLowerCase();

            const setIfString = (key, value) => {
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
                const isPositive = title.includes("positive") || title.includes("(prompt)") || title.includes("prompt");
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

            if (inputs.seed !== undefined && metadata.seed === undefined) metadata.seed = inputs.seed;
            if (inputs.steps !== undefined && metadata.steps === undefined) metadata.steps = inputs.steps;
            if (inputs.cfg !== undefined && metadata.cfg === undefined) metadata.cfg = inputs.cfg;
            if (inputs.sampler_name && !metadata.sampler) metadata.sampler = inputs.sampler_name;
            if (inputs.scheduler && !metadata.scheduler) metadata.scheduler = inputs.scheduler;
            if (inputs.denoise !== undefined && metadata.denoise === undefined) metadata.denoise = inputs.denoise;

            if (inputs.width !== undefined && metadata.width === undefined) metadata.width = inputs.width;
            if (inputs.height !== undefined && metadata.height === undefined) metadata.height = inputs.height;

            // Model chain extraction (keep names only; UI will normalize/strip extensions).
            // Different node packs use different keys, so we try a small set of common ones.
            const setModel = (key, value) => {
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
            setModel("diffusion", inputs.diffusion_name || inputs.diffusion_model || inputs.diffusion);

            const looksLikeLora = classType.includes("lora") || classType.includes("loraloader");
            if (looksLikeLora) {
                const name = inputs.lora_name || inputs.lora || inputs.name || null;
                const w = inputs.strength_model ?? inputs.strength ?? inputs.weight ?? inputs.lora_strength ?? null;
                if (name) loras.push({ name, weight: w });
            }
        }
        if (loras.length) metadata.loras = loras;
    }

    return Object.keys(metadata).length > 0 ? metadata : null;
}
