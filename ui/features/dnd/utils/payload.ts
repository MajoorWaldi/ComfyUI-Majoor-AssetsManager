import { pickRootId } from "../../../utils/ids.js";

export const buildPayloadViewURL = (payload: any, { buildCustomViewURL, buildViewURL }: any) => {
    const type = String(payload?.type || "output").toLowerCase();
    if (type === "custom") {
        return buildCustomViewURL(
            payload?.filename || "",
            payload?.subfolder || "",
            pickRootId(payload),
        );
    }
    if (type === "input") {
        return buildViewURL(payload?.filename || "", payload?.subfolder || "", "input");
    }
    if (type === "temp") {
        return buildViewURL(payload?.filename || "", payload?.subfolder || "", "temp");
    }
    return buildViewURL(payload?.filename || "", payload?.subfolder || "", "output");
};

const _sanitizeDraggedPayload = (value: any) => {
    if (!value || typeof value !== "object") return null;

    const filename = String(value.filename || "").trim();
    if (!filename) return null;
    if (filename.includes("/") || filename.includes("\\") || filename.includes("\x00")) return null;

    const rawSubfolder = String(value.subfolder || "").replace(/\x00/g, "");
    // Reject path traversal attempts in subfolder
    const subfolder = rawSubfolder
        .split(/[\\/]/)
        .filter((seg: any) => seg !== ".." && seg !== ".")
        .join("/")
        .replace(/^\/+/, "");
    const rawType = String(value.type || "output").toLowerCase();
    const type = rawType === "input" || rawType === "temp" || rawType === "custom" ? rawType : "output";

    const rootId = value.root_id == null ? undefined : String(value.root_id).trim();
    const kind = value.kind == null ? undefined : String(value.kind).toLowerCase();
    const filepath = value.filepath == null ? undefined : String(value.filepath).replace(/\x00/g, "").trim();

    return {
        filename,
        subfolder,
        type,
        root_id: rootId || undefined,
        kind: kind || undefined,
        filepath: kind === "workflow" && filepath ? filepath : undefined,
    };
};

export const sanitizeDraggedPayload = _sanitizeDraggedPayload;

export const getDraggedAsset = (event: any, mimeType: any) => {
    const data = event?.dataTransfer?.getData?.(mimeType);
    if (!data) return null;
    try {
        return _sanitizeDraggedPayload(JSON.parse(data));
    } catch {
        return null;
    }
};
