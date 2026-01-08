const dndDebugEnabled = () => {
    try {
        return Boolean(window?.MJR_DND_DEBUG);
    } catch {
        return false;
    }
};

export const dndLog = (...args) => {
    if (!dndDebugEnabled()) return;
    console.debug("[Majoor.DnD]", ...args);
};

