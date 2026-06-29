import { normalizeMetadataSearchPrefix } from "./metadataSectionCatalog.js";

export interface PrefixSearchTerm {
    field: string;
    value: string;
    exclude: boolean;
    raw: string;
}

export function parsePrefixSearchQuery(query: any): {
    plainQuery: string;
    terms: PrefixSearchTerm[];
    mode: "AND" | "OR";
} {
    const tokens = String(query || "").match(/"[^"]+"|'[^']+'|\S+/g) || [];
    const plain: string[] = [];
    const terms: PrefixSearchTerm[] = [];
    let mode: "AND" | "OR" = "AND";
    for (const rawToken of tokens) {
        const token = String(rawToken || "").trim();
        if (!token) continue;
        const upper = token.toUpperCase();
        if (upper === "AND" || upper === "OR") {
            mode = upper;
            continue;
        }
        const exclude = token.startsWith("-");
        const body = exclude ? token.slice(1).trim() : token;
        const colon = body.indexOf(":");
        if (colon <= 0) {
            plain.push(token);
            continue;
        }
        const field = normalizeMetadataSearchPrefix(body.slice(0, colon));
        const value = body.slice(colon + 1).trim().replace(/^["']|["']$/g, "");
        if (!field || !value) {
            plain.push(token);
            continue;
        }
        terms.push({ field, value, exclude, raw: token });
    }
    return { plainQuery: plain.join(" ").trim(), terms, mode };
}
