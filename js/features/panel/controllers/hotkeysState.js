const HOTKEYS_STATE = {
    suspended: false,
    scope: null,
    ratingHotkeysActive: false,
};

export function getHotkeysState() {
    return HOTKEYS_STATE;
}

export function setHotkeysScope(scope) {
    HOTKEYS_STATE.scope = scope == null ? null : String(scope);
}

export function isHotkeysSuspended() {
    return !!HOTKEYS_STATE.suspended;
}

export function setHotkeysSuspendedFlag(suspended) {
    HOTKEYS_STATE.suspended = Boolean(suspended);
}

export function setRatingHotkeysActive(active) {
    HOTKEYS_STATE.ratingHotkeysActive = Boolean(active);
}
