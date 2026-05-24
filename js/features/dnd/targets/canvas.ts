const getCanvasRect = (app: any) => {
    const canvas = app?.canvas?.canvas || document.querySelector("canvas");
    if (!canvas) return null;
    return canvas.getBoundingClientRect();
};

export const isCanvasDropTarget = (app: any, event: any) => {
    const rect = getCanvasRect(app);
    if (!rect) return false;
    const x = event.clientX;
    const y = event.clientY;
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
};

export const markCanvasDirty = (app: any) => {
    try {
        app?.graph?.setDirtyCanvas?.(true, true);
    } catch (e: any) {
        console.debug?.(e);
    }
    try {
        app?.canvas?.setDirty?.(true, true);
    } catch (e: any) {
        console.debug?.(e);
    }
};
