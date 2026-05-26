import { createPopoverManager } from "./views/popoverManager.js";
import { clearActiveGridContainer } from "./panelRuntimeRefs.js";

/**
 * Bootstraps the panel container for a new mount.
 *
 * Captures the host-wrapper inline styles so they can be restored on dispose,
 * tears down any previous runtime instance registered on the same container,
 * then resets the DOM and creates a fresh popover manager.
 *
 * @param {HTMLElement} container
 * @param {{ useComfyThemeUI: boolean }} opts
 * @returns {{ popovers, hostWrapper, hostWrapperPrevStyle }}
 */
export function bootstrapPanelContainer(container: HTMLElement, { useComfyThemeUI }: { useComfyThemeUI: boolean }): Record<string, any> {
    if (useComfyThemeUI) {
        container.classList.add("mjr-assets-manager");
    } else {
        container.classList.remove("mjr-assets-manager");
    }

    // Capture current host-wrapper styles so they can be restored on dispose.
    const hostWrapper = container.parentElement || null;
    const hostWrapperPrevStyle = hostWrapper
        ? {
              height: hostWrapper.style.height,
              minHeight: hostWrapper.style.minHeight,
              width: hostWrapper.style.width,
          }
        : null;
    try {
        if (hostWrapper) {
            hostWrapper.style.height = "100%";
            hostWrapper.style.minHeight = "0";
            hostWrapper.style.width = "100%";
        }
    } catch (e) {
        console.debug?.(e);
    }

    // Invalidate cached grid reference before cleanup to prevent stale access
    // during async teardown of the old panel instance.
    clearActiveGridContainer();

    // Tear down any previous runtime instance registered on this container.
    for (const cleanup of [
        () => (container as any)._eventCleanup?.(),
        () => (container as any)._mjrPopoverManager?.dispose?.(),
        () => (container as any)._mjrHotkeys?.dispose?.(),
        () => (container as any)._mjrRatingHotkeys?.dispose?.(),
        () => (container as any)._mjrSidebarController?.dispose?.(),
        () => (container as any)._mjrGridContextMenuUnbind?.(),
    ]) {
        try {
            cleanup();
        } catch (e) {
            console.debug?.(e);
        }
    }

    container.replaceChildren();
    container.classList.add("mjr-am-container");

    const popovers = createPopoverManager(container);
    try {
        (container as any)._mjrPopoverManager = popovers;
    } catch (e) {
        console.debug?.(e);
    }

    return { popovers, hostWrapper, hostWrapperPrevStyle };
}
