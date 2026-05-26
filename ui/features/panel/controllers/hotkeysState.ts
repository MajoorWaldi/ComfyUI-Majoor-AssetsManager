const HOTKEYS_STATE: Record<string, any> = {
    suspended: false,
    scope: null,
    ratingHotkeysActive: false,
};

export function getHotkeysState(): Record<string, any> {
    return HOTKEYS_STATE;
}

export function setHotkeysScope(scope: string | null): void {
    HOTKEYS_STATE.scope = scope == null ? null : String(scope);
}

export function isHotkeysSuspended(): boolean {
    return !!HOTKEYS_STATE.suspended;
}

export function setHotkeysSuspendedFlag(suspended: boolean): void {
    HOTKEYS_STATE.suspended = Boolean(suspended);
}

export function setRatingHotkeysActive(active: boolean): void {
    HOTKEYS_STATE.ratingHotkeysActive = Boolean(active);
}
