function readPath(source: any, paths: string[]) {
    for (const path of paths) {
        const parts = path.split(".");
        let cursor = source;
        for (const part of parts) {
            if (cursor == null) break;
            cursor = cursor?.[part];
        }
        if (cursor !== undefined && cursor !== null && String(cursor).trim?.() !== "") return cursor;
    }
    return "";
}

function normalizeValue(value: any): string {
    if (value == null) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

export const GENINFO_COMPARE_FIELDS = [
    { key: "positive", label: "Positive Prompt", paths: ["geninfo.positive.value", "positive_prompt", "prompt"] },
    { key: "negative", label: "Negative Prompt", paths: ["geninfo.negative.value", "negative_prompt"] },
    { key: "model", label: "Model", paths: ["geninfo.checkpoint.name", "model", "checkpoint"] },
    { key: "lora", label: "LoRA", paths: ["geninfo.loras", "loras", "lora"] },
    { key: "sampler", label: "Sampler", paths: ["geninfo.sampler.name", "sampler"] },
    { key: "scheduler", label: "Scheduler", paths: ["geninfo.scheduler.name", "scheduler"] },
    { key: "steps", label: "Steps", paths: ["geninfo.steps.value", "steps"] },
    { key: "cfg", label: "CFG", paths: ["geninfo.cfg.value", "cfg"] },
    { key: "denoise", label: "Denoise", paths: ["geninfo.denoise.value", "denoise"] },
    { key: "seed", label: "Seed", paths: ["geninfo.seed.value", "seed"] },
    { key: "workflow_nodes", label: "Workflow Nodes", paths: ["geninfo.workflow_nodes", "workflow.nodes"] },
];

export function buildGenInfoComparison(left: any, right: any) {
    return GENINFO_COMPARE_FIELDS.map((field) => {
        const leftValue = normalizeValue(readPath(left, field.paths));
        const rightValue = normalizeValue(readPath(right, field.paths));
        return {
            key: field.key,
            label: field.label,
            left: leftValue,
            right: rightValue,
            changed: leftValue !== rightValue,
        };
    }).filter((row) => row.left || row.right);
}
