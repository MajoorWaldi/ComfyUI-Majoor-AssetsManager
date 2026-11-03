/**
 * Optional coexistence with ComfyUI's native "Assets" sidebar tab.
 *
 * Recent ComfyUI frontends ship their own media/assets sidebar tab. Majoor
 * never touches it by default; users who prefer a single assets panel can opt
 * in to hide the native one. Hiding goes through the official extension
 * manager API (`getSidebarTabs` / `unregisterSidebarTab`) and the removed tab
 * definition is kept so it can be re-registered verbatim when the option is
 * turned off again.
 */

import {
    listHostSidebarTabs,
    registerSidebarTab,
    unregisterHostSidebarTab,
} from "../../app/hostAdapter.js";

/** Known ids of the core frontend's assets/media sidebar tab across releases. */
const NATIVE_ASSETS_TAB_IDS = new Set(["assets", "media-assets", "assets-sidebar"]);

/**
 * Core sidebar tabs are registered when the graph view mounts, which can be
 * after extensions finish `setup()`. Re-apply a few times so an early opt-in
 * still takes effect.
 */
const RETRY_DELAYS_MS = [500, 2000, 6000];

let _hideRequested = false;
const _hiddenTabs = new Map<string, any>();
let _retryTimers: ReturnType<typeof setTimeout>[] = [];

export function isNativeAssetsTab(tab: any): boolean {
    const id = String(tab?.id || "")
        .trim()
        .toLowerCase();
    if (!id || id.startsWith("majoor") || id.startsWith("mjr")) return false;
    return NATIVE_ASSETS_TAB_IDS.has(id);
}

function _clearRetries(): void {
    for (const timer of _retryTimers.splice(0)) clearTimeout(timer);
}

function _hideNow(): number {
    let hidden = 0;
    for (const tab of listHostSidebarTabs()) {
        if (!isNativeAssetsTab(tab)) continue;
        const id = String(tab.id);
        if (unregisterHostSidebarTab(id)) {
            _hiddenTabs.set(id, tab);
            hidden += 1;
        }
    }
    return hidden;
}

function _restoreNow(): void {
    for (const [id, tab] of [..._hiddenTabs.entries()]) {
        const alreadyBack = listHostSidebarTabs().some((t: any) => String(t?.id || "") === id);
        if (alreadyBack || registerSidebarTab(tab)) _hiddenTabs.delete(id);
    }
}

/** Apply the user's preference. Safe to call repeatedly. */
export function setNativeAssetsTabHidden(hidden: boolean): void {
    _hideRequested = !!hidden;
    _clearRetries();
    if (!_hideRequested) {
        _restoreNow();
        return;
    }
    _hideNow();
    for (const delay of RETRY_DELAYS_MS) {
        _retryTimers.push(
            setTimeout(() => {
                if (_hideRequested) _hideNow();
            }, delay),
        );
    }
}

/** Extension teardown: give the core tab back and stop pending retries. */
export function teardownNativeAssetsTab(): void {
    _hideRequested = false;
    _clearRetries();
    _restoreNow();
}

export function getHiddenNativeAssetsTabIds(): string[] {
    return [..._hiddenTabs.keys()];
}
