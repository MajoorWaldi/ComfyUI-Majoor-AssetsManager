import { safeClosest } from "../../utils/dom.js";

export function installViewerLightDismiss({ overlay, requestClose }: { overlay: any; requestClose: () => void }): void {
    try {
        let ptrDown: any = null;
        overlay.addEventListener(
            "pointerdown",
            (e: any) => {
                if (e.isPrimary === false) return;
                ptrDown = { x: e.clientX, y: e.clientY, t: Date.now() };
            },
            { capture: true, passive: true },
        );

        overlay.addEventListener("click", (e: any) => {
            try {
                if (e.defaultPrevented || e.button !== 0) return;

                if (ptrDown) {
                    const dx = e.clientX - ptrDown.x;
                    const dy = e.clientY - ptrDown.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > 6 || Date.now() - ptrDown.t > 600) return;
                }

                const target = e.target;
                if (
                    safeClosest(target, ".mjr-viewer-header") ||
                    safeClosest(target, ".mjr-viewer-footer") ||
                    safeClosest(target, ".mjr-viewer-geninfo") ||
                    safeClosest(target, ".mjr-video-controls") ||
                    safeClosest(target, ".mjr-context-menu") ||
                    safeClosest(target, ".mjr-ab-slider") ||
                    safeClosest(target, ".mjr-viewer-loupe") ||
                    safeClosest(target, ".mjr-viewer-probe") ||
                    safeClosest(target, ".mjr-viewer-media") ||
                    (target &&
                        (target.tagName === "IMG" ||
                            target.tagName === "VIDEO" ||
                            target.tagName === "CANVAS"))
                ) {
                    return;
                }
                requestClose?.();
            } catch (e2: any) {
                console.debug?.(e2);
            }
        });
    } catch (e: any) {
        console.debug?.(e);
    }
}
