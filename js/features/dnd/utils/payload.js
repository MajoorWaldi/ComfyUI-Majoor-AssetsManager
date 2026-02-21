import { pickRootId } from "../../../utils/ids.js";

export const buildPayloadViewURL = (payload, { buildCustomViewURL, buildViewURL }) => {
    const type = String(payload?.type || "output").toLowerCase();
    if (type === "custom") {
        return buildCustomViewURL(payload?.filename || "", payload?.subfolder || "", pickRootId(payload));
    }
    if (type === "input") {
        return buildViewURL(payload?.filename || "", payload?.subfolder || "", "input");
    }
    return buildViewURL(payload?.filename || "", payload?.subfolder || "", "output");
};

const _sanitizeDraggedPayload = (value) => {
    if (!value || typeof value !== "object") return null;

    const filename = String(value.filename || "").trim();
    if (!filename) return null;
    if (filename.includes("/") || filename.includes("\\") || filename.includes("\x00")) return null;

    const subfolder = String(value.subfolder || "").replace(/\x00/g, "");
    const rawType = String(value.type || "output").toLowerCase();
    const type = rawType === "input" || rawType === "custom" ? rawType : "output";

    const rootId = value.root_id == null ? undefined : String(value.root_id).trim();
    const kind = value.kind == null ? undefined : String(value.kind).toLowerCase();

    return {
        filename,
        subfolder,
        type,
        root_id: rootId || undefined,
        kind: kind || undefined
    };
};

export const getDraggedAsset = (event, mimeType) => {
    const data = event?.dataTransfer?.getData?.(mimeType);
    if (!data) return null;
    try {
        return _sanitizeDraggedPayload(JSON.parse(data));
    } catch {
        return null;
    }
};
