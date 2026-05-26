import { APP_CONFIG } from "../app/config.js";

export const noop = (): void => {};

function _debugEnabled(flag: string): boolean {
    try {
        return Boolean((APP_CONFIG as Record<string, unknown>)?.[flag]);
    } catch {
        return false;
    }
}

function _warn(label: string, err: unknown): void {
    try {
        console.warn(`[Majoor] ${label}`, err);
    } catch (e) {
        console.debug?.(e);
    }
}

export function safeCall<T>(fn: (() => T) | null | undefined, label = "safeCall"): T | undefined {
    try {
        return fn?.();
    } catch (err) {
        if (_debugEnabled("DEBUG_SAFE_CALL")) _warn(label, err);
        return undefined;
    }
}

export function safeAddListener(
    target: EventTarget | null | undefined,
    event: string,
    handler: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
    label = "safeAddListener",
): () => void {
    try {
        target?.addEventListener?.(event, handler, options);
        return () => {
            try {
                target?.removeEventListener?.(event, handler, options);
            } catch (err) {
                if (_debugEnabled("DEBUG_SAFE_LISTENERS"))
                    _warn(`${label}:remove:${String(event || "")}`, err);
            }
        };
    } catch (err) {
        if (_debugEnabled("DEBUG_SAFE_LISTENERS"))
            _warn(`${label}:add:${String(event || "")}`, err);
        return noop;
    }
}
