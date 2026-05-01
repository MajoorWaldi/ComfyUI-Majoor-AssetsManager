import {
    getHotkeysState,
    isHotkeysSuspended,
    setHotkeysScope,
    setHotkeysSuspendedFlag,
} from "./hotkeysState.js";
import { getActiveGridContainer } from "../panelRuntimeRefs.js";

export function setHotkeysSuspended(suspended) {
    setHotkeysSuspendedFlag(suspended);
}

export function createPanelHotkeysController({
    onTriggerScan,
    getScanContext,
    onToggleDetails,
    onToggleFloatingViewer,
    onFocusSearch,
    onClearSearch,
    allowListKeys,
} = {}) {
    let panelFocused = false;
    let panelHovered = false;
    let boundEl = null;

    const allowed =
        allowListKeys instanceof Set
            ? allowListKeys
            : new Set([
                  " ",
                  "ArrowUp",
                  "ArrowDown",
                  "ArrowLeft",
                  "ArrowRight",
                  "PageUp",
                  "PageDown",
                  "Home",
                  "End",
                  "Enter",
                  "Escape",
                  "Tab",
              ]);

    const isPanelActive = () => panelFocused || panelHovered;
    const isPanelHotkeyContext = (event) => {
        if (isPanelActive()) return true;
        try {
            const target = event?.target;
            if (boundEl && target && typeof boundEl.contains === "function") {
                if (boundEl === target || boundEl.contains(target)) return true;
            }
        } catch (e) {
            console.debug?.(e);
        }
        try {
            return Boolean(boundEl?.isConnected) && document.activeElement === document.body;
        } catch (e) {
            console.debug?.(e);
            return false;
        }
    };

    const isGridHotkeyContext = (event) => {
        try {
            const targetGrid = event?.target?.closest?.(".mjr-grid");
            if (targetGrid) return true;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            const activeGrid = getActiveGridContainer();
            if (!activeGrid) return false;
            if (document.activeElement === document.body) return true;
            return activeGrid.contains?.(document.activeElement) || false;
        } catch (e) {
            console.debug?.(e);
            return false;
        }
    };

    const handlers = {
        focusin: () => {
            panelFocused = true;
        },
        focusout: () => {
            panelFocused = false;
        },
        mouseenter: () => {
            panelHovered = true;
        },
        mouseleave: () => {
            panelHovered = false;
        },
        keydown: (event) => {
            // Check if hotkeys are suspended (e.g. when dialogs/popovers are open)
            if (isHotkeysSuspended()) return;

            // Check if viewer has hotkey priority
            if (getHotkeysState().scope === "viewer") return;

            // Check if panel is active before processing hotkeys
            // This ensures hotkeys only work when the panel is hovered or focused
            if (!isPanelHotkeyContext(event)) return;

            const lower = event.key?.toLowerCase?.() || "";
            const isTypingTarget =
                event.target?.isContentEditable ||
                event.target?.closest?.("input, textarea, select, [contenteditable='true']");

            // Ctrl/Cmd+S triggers an index scan for the current scope, without letting the
            // surrounding ComfyUI UI capture the shortcut (e.g. workflow save).
            if (lower === "s" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation?.();
                try {
                    const ctx = typeof getScanContext === "function" ? getScanContext() : null;
                    onTriggerScan?.(ctx);
                } catch (e) {
                    console.debug?.(e);
                }
                return;
            }

            // Ctrl/Cmd+F or Ctrl/Cmd+K focuses the search box (matching docs/SHORTCUTS & HOTKEYS guides).
            if ((lower === "f" || lower === "k") && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation?.();
                try {
                    onFocusSearch?.();
                } catch (e) {
                    console.debug?.(e);
                }
                return;
            }

            // Ctrl/Cmd+H clears the search box.
            if (lower === "h" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation?.();
                try {
                    onClearSearch?.();
                } catch (e) {
                    console.debug?.(e);
                }
                return;
            }

            // D toggles the Details sidebar for the current selection.
            if (lower === "d" && !event.ctrlKey && !event.metaKey && !event.altKey) {
                if (isTypingTarget) return;
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation?.();
                try {
                    onToggleDetails?.();
                } catch (e) {
                    console.debug?.(e);
                }
                return;
            }

            // V toggles the floating viewer for the current panel selection.
            // Keep modified V shortcuts untouched for app/browser behaviors such as paste.
            if (
                lower === "v" &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.altKey &&
                !event.shiftKey
            ) {
                if (isTypingTarget) return;
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation?.();
                try {
                    onToggleFloatingViewer?.();
                } catch (e) {
                    console.debug?.(e);
                }
                return;
            }

            // For navigation keys, prevent ComfyUI global handlers from stealing focus/scroll.
            // Only intercept if panel is actually active.
            // Never intercept while typing in inputs (e.g. tags editor in the sidebar).
            if (allowed.has(event.key) && isPanelHotkeyContext(event)) {
                if (isTypingTarget) return;
                if (isGridHotkeyContext(event)) return;
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation?.();
            }
        },
    };

    const bind = (el) => {
        if (!el || boundEl === el) return;
        if (boundEl) dispose();
        boundEl = el;

        try {
            boundEl.addEventListener("focusin", handlers.focusin);
            boundEl.addEventListener("focusout", handlers.focusout);
            boundEl.addEventListener("mouseenter", handlers.mouseenter);
            boundEl.addEventListener("mouseleave", handlers.mouseleave);
        } catch (e) {
            console.debug?.(e);
        }

        // Use global listener with capture phase for keydown to ensure it works regardless of focus
        try {
            window.addEventListener("keydown", handlers.keydown, { capture: true });
        } catch (e) {
            console.debug?.(e);
        }
        setHotkeysScope("panel");
    };

    const dispose = () => {
        if (!boundEl) return;
        try {
            boundEl.removeEventListener("focusin", handlers.focusin);
            boundEl.removeEventListener("focusout", handlers.focusout);
            boundEl.removeEventListener("mouseenter", handlers.mouseenter);
            boundEl.removeEventListener("mouseleave", handlers.mouseleave);
        } catch (e) {
            console.debug?.(e);
        }

        // Remove global listener for keydown
        try {
            window.removeEventListener("keydown", handlers.keydown, { capture: true });
        } catch (e) {
            console.debug?.(e);
        }
        if (getHotkeysState().scope === "panel") {
            setHotkeysScope(null);
        }
        boundEl = null;
    };

    return { bind, dispose };
}
