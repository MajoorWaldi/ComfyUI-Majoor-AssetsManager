export const buildPayloadViewURL = (payload, { buildCustomViewURL, buildViewURL }) => {
    const type = String(payload?.type || "output").toLowerCase();
    if (type === "custom") {
        const rootId = payload?.root_id || payload?.rootId || payload?.custom_root_id || "";
        return buildCustomViewURL(payload?.filename || "", payload?.subfolder || "", rootId);
    }
    if (type === "input") {
        return buildViewURL(payload?.filename || "", payload?.subfolder || "", "input");
    }
    return buildViewURL(payload?.filename || "", payload?.subfolder || "", "output");
};

export const getDraggedAsset = (event, mimeType) => {
    const data = event?.dataTransfer?.getData?.(mimeType);
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
};

