export const fetchFileAsDataTransferFile = async (payload, buildURL) => {
    if (!payload?.filename) return null;
    const url = buildURL(payload);
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        const name = payload.filename || "file";
        return new File([blob], name, { type: blob.type || "application/octet-stream" });
    } catch {
        return null;
    }
};

export const dispatchSyntheticDrop = (target, file) => {
    if (!target || !file) return false;
    try {
        const dt = new DataTransfer();
        dt.items.add(file);
        const evt = new DragEvent("drop", {
            bubbles: true,
            cancelable: true,
            dataTransfer: dt
        });
        target.dispatchEvent(evt);
        return true;
    } catch {
        return false;
    }
};

