const RESIZE_OBSERVER_LOOP_MESSAGES = [
    "ResizeObserver loop completed with undelivered notifications.",
    "ResizeObserver loop limit exceeded",
];

export function isBenignResizeObserverLoopError(value) {
    try {
        const message = String(value?.message || value || "");
        return RESIZE_OBSERVER_LOOP_MESSAGES.some((known) => message.includes(known));
    } catch {
        return false;
    }
}

export function installBenignConsoleNoiseFilter() {
    if (typeof window === "undefined") return null;
    try {
        window.__MJR_BENIGN_CONSOLE_NOISE_FILTER__?.abort?.();
    } catch (e) {
        console.debug?.(e);
    }

    let controller = null;
    try {
        controller = new AbortController();
    } catch {
        controller = null;
    }

    const onError = (event) => {
        try {
            if (!isBenignResizeObserverLoopError(event?.message || event?.error)) return;
            event.preventDefault?.();
            event.stopImmediatePropagation?.();
        } catch (e) {
            console.debug?.(e);
        }
    };

    const options = controller ? { capture: true, signal: controller.signal } : true;
    window.addEventListener("error", onError, options);

    const handle = {
        abort() {
            try {
                controller?.abort?.();
            } catch (e) {
                console.debug?.(e);
            }
            if (!controller) {
                try {
                    window.removeEventListener("error", onError, true);
                } catch (e) {
                    console.debug?.(e);
                }
            }
        },
    };
    window.__MJR_BENIGN_CONSOLE_NOISE_FILTER__ = handle;
    return handle;
}
