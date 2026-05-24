const dndDebugEnabled = () => {
    try {
        return Boolean((window as any)?.MJR_DND_DEBUG);
    } catch {
        return false;
    }
};

export const dndLog = (...args: any[]) => {
    if (!dndDebugEnabled()) return;
    console.debug("[Majoor.DnD]", ...args);
};
