export const METADATA_SECTION_CATALOG_VERSION = 1;
export const METADATA_PARSER_FAMILY_VERSION = "geninfo-catalog-v1";

export const metadataSectionCatalog = {
    version: METADATA_SECTION_CATALOG_VERSION,
    parser_family_version: METADATA_PARSER_FAMILY_VERSION,
    sections: [
        { key: "file_info", title: "File Info", searchField: "file", aliases: ["filename", "path", "size", "resolution"] },
        { key: "prompt", title: "Prompt", searchField: "prompt", aliases: ["positive", "negative", "text"] },
        { key: "model", title: "Models", searchField: "model", aliases: ["checkpoint", "ckpt", "vae", "clip"] },
        { key: "sampler", title: "Sampling", searchField: "sampler", aliases: ["sampling", "scheduler", "steps", "cfg", "seed", "denoise"] },
        { key: "lora", title: "LoRAs", searchField: "lora", aliases: ["loras", "lycoris"] },
        { key: "control", title: "Control", searchField: "control", aliases: ["controlnet", "adapter", "ipadapter"] },
        { key: "upscale", title: "Upscaling", searchField: "upscale", aliases: ["upscaler", "upscaling", "scale"] },
        { key: "workflow_nodes", title: "Workflow Nodes", searchField: "node", aliases: ["nodes", "workflow_node", "workflow_nodes"] },
        { key: "tags", title: "Tags", searchField: "tag", aliases: ["tags", "rating"] },
    ],
};

export function metadataSearchAliases(): Record<string, string> {
    const aliases: Record<string, string> = {};
    for (const section of metadataSectionCatalog.sections) {
        aliases[section.key] = section.searchField;
        aliases[section.searchField] = section.searchField;
        for (const alias of section.aliases || []) aliases[String(alias).toLowerCase()] = section.searchField;
    }
    return aliases;
}

export function normalizeMetadataSearchPrefix(prefix: any): string {
    const key = String(prefix || "").trim().toLowerCase();
    return metadataSearchAliases()[key] || "";
}

export function metadataSectionByKey(key: any): any {
    const wanted = String(key || "").trim().toLowerCase();
    if (!wanted) return null;
    return metadataSectionCatalog.sections.find((section) => section.key === wanted) || null;
}
