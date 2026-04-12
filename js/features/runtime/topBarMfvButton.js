import { EVENTS } from "../../app/events.js";
import { t } from "../../app/i18n.js";

const BUTTON_HOST_ATTR = "data-mjr-topbar-mfv-host";
const BUTTON_ATTR = "data-mjr-topbar-mfv-button";

let _observer = null;
let _observedTarget = null;
let _bodyObserver = null;
let _visibilityListener = null;
let _resizeListener = null;
let _syncQueued = false;
let _syncTimer = null;
let _visible = false;

function _tryObserveActionbar(container) {
    if (_observer && _observedTarget === container) return;
    if (!container) {
        // Actionbar not in DOM yet — observe body shallowly to detect it
        if (!_bodyObserver && typeof MutationObserver !== "undefined") {
            _bodyObserver = new MutationObserver(() => {
                const c = getActionbarContainer();
                if (c) {
                    _bodyObserver?.disconnect?.();
                    _bodyObserver = null;
                    scheduleSync();
                }
            });
            _bodyObserver.observe(document.body, { childList: true, subtree: true });
        }
        return;
    }
    // Disconnect previous observer if target changed
    try { _observer?.disconnect?.(); } catch (_) { /* noop */ }
    _observer = new MutationObserver(() => scheduleSync());
    _observer.observe(container, { childList: true });
    _observedTarget = container;
    // Body observer no longer needed
    try { _bodyObserver?.disconnect?.(); } catch (_) { /* noop */ }
    _bodyObserver = null;
}

function getActionbarContainer() {
    if (typeof document === "undefined") return null;
    return document.querySelector(".actionbar-container");
}

function updateViewerTopOffset(container = getActionbarContainer()) {
    if (typeof document === "undefined") return;
    const rootStyle = document.documentElement?.style;
    if (!rootStyle) return;

    if (!container) {
        rootStyle.setProperty("--mjr-mfv-top-offset", "60px");
        return;
    }

    const rect = container.getBoundingClientRect();
    const safeTop = Math.max(60, Math.ceil(rect.bottom + 12));
    rootStyle.setProperty("--mjr-mfv-top-offset", `${safeTop}px`);
}

function getAnchor(container) {
    if (!container) return null;
    const queueGroup = container.querySelector(".queue-button-group");
    return queueGroup?.closest(".flex.h-full.items-center") || null;
}

function createIcon(className = "pi pi-eye") {
    const icon = document.createElement("i");
    icon.className = className;
    icon.setAttribute("aria-hidden", "true");
    return icon;
}

function createLabel(text = "Viewer") {
    const label = document.createElement("span");
    label.className = "mjr-topbar-mfv-label";
    label.textContent = text;
    return label;
}

function updateButtonState(button) {
    if (!button) return;
    const tooltip = _visible
        ? t("tooltip.closeMFV", "Close Floating Viewer")
        : t("tooltip.openMFV", "Open Floating Viewer");
    button.setAttribute("title", tooltip);
    button.setAttribute("aria-label", tooltip);
    button.setAttribute("aria-pressed", _visible ? "true" : "false");
    button.classList.toggle("primary", _visible);
    button.classList.toggle("mjr-topbar-mfv-active", _visible);
    button.replaceChildren(createIcon("pi pi-eye"), createLabel("Viewer"));
}

function findViewerControlButton(labelStart) {
    if (typeof document === "undefined") return null;
    const buttons = document.querySelectorAll("button[aria-label]");
    for (const button of buttons) {
        const label = String(button.getAttribute("aria-label") || "").trim();
        if (label.startsWith(labelStart)) {
            return button;
        }
    }
    return null;
}

function ensureViewerToggleEnabled(labelStart, fallbackEventName) {
    const button = findViewerControlButton(labelStart);
    if (button) {
        if (button.getAttribute("aria-pressed") !== "true") {
            button.click();
        }
        return true;
    }
    if (fallbackEventName) {
        window.dispatchEvent(new Event(fallbackEventName));
    }
    return false;
}

function ensureViewerModesEnabled(attempt = 0) {
    const liveReady = ensureViewerToggleEnabled("Live Stream:", EVENTS.MFV_LIVE_TOGGLE);
    const previewReady = ensureViewerToggleEnabled("KSampler Preview:", EVENTS.MFV_PREVIEW_TOGGLE);
    if ((liveReady && previewReady) || attempt >= 10) {
        scheduleSync();
        return;
    }

    setTimeout(() => {
        ensureViewerModesEnabled(attempt + 1);
    }, 80);
}

function dispatchLaunch() {
    try {
        if (_visible) {
            window.dispatchEvent(new Event(EVENTS.MFV_CLOSE));
        } else {
            window.dispatchEvent(new Event(EVENTS.MFV_OPEN));
            ensureViewerModesEnabled();
        }
    } catch (e) {
        console.debug?.("[Majoor] top bar MFV launch failed", e);
    }
    scheduleSync();
}

function createButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute(BUTTON_ATTR, "1");
    button.className = "comfyui-button mjr-topbar-mfv-button";
    button.style.position = "relative";
    button.style.zIndex = "10030";
    button.style.width = "auto";
    button.style.height = "32px";
    button.style.minWidth = "32px";
    button.style.padding = "0 10px";
    button.style.gap = "6px";
    button.style.display = "inline-flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.whiteSpace = "nowrap";
    button.addEventListener("click", dispatchLaunch);
    updateButtonState(button);
    return button;
}

function createButtonHost() {
    const host = document.createElement("div");
    host.setAttribute(BUTTON_HOST_ATTR, "1");
    host.className = "flex h-full items-center pointer-events-auto";
    host.style.position = "relative";
    host.style.zIndex = "10030";
    host.style.padding = "0 4px";

    host.appendChild(createButton());
    return host;
}

function _syncVisibleFromDom() {
    if (typeof document === "undefined") return;
    const viewerOpen = !!document.querySelector(".mjr-mfv.is-visible");
    if (_visible !== viewerOpen) {
        _visible = viewerOpen;
    }
}

function ensureButtonMounted() {
    const container = getActionbarContainer();
    if (!container) {
        updateViewerTopOffset(null);
        return null;
    }

    _tryObserveActionbar(container);
    _syncVisibleFromDom();

    let host = container.querySelector(`[${BUTTON_HOST_ATTR}]`);
    if (!host) {
        host = createButtonHost();
    }

    const anchor = getAnchor(container);
    if (host.parentElement !== container) {
        if (anchor) {
            container.insertBefore(host, anchor);
        } else {
            container.appendChild(host);
        }
    } else if (anchor && host.nextElementSibling !== anchor) {
        container.insertBefore(host, anchor);
    }

    updateViewerTopOffset(container);
    updateButtonState(host.querySelector(`[${BUTTON_ATTR}]`));
    return host;
}

function scheduleSync() {
    if (_syncQueued) return;
    _syncQueued = true;
    _syncTimer = window.setTimeout(() => {
        _syncQueued = false;
        _syncTimer = null;
        ensureButtonMounted();
    }, 32);
}

export function mountTopBarMfvButton() {
    if (typeof window === "undefined" || typeof document === "undefined" || !document.body) {
        return false;
    }

    scheduleSync();

    if (!_visibilityListener) {
        _visibilityListener = (event) => {
            _visible = Boolean(event?.detail?.visible);
            scheduleSync();
        };
        window.addEventListener(EVENTS.MFV_VISIBILITY_CHANGED, _visibilityListener);
    }

    if (!_resizeListener) {
        _resizeListener = () => scheduleSync();
        window.addEventListener("resize", _resizeListener);
    }

    _tryObserveActionbar(getActionbarContainer());

    return true;
}

export function teardownTopBarMfvButton() {
    try {
        _observer?.disconnect?.();
    } catch (e) {
        console.debug?.(e);
    }
    _observer = null;
    _observedTarget = null;

    try {
        _bodyObserver?.disconnect?.();
    } catch (e) {
        console.debug?.(e);
    }
    _bodyObserver = null;

    try {
        if (_syncTimer) {
            window.clearTimeout(_syncTimer);
        }
    } catch (e) {
        console.debug?.(e);
    }
    _syncTimer = null;

    if (_visibilityListener && typeof window !== "undefined") {
        window.removeEventListener(EVENTS.MFV_VISIBILITY_CHANGED, _visibilityListener);
    }
    _visibilityListener = null;

    if (_resizeListener && typeof window !== "undefined") {
        window.removeEventListener("resize", _resizeListener);
    }
    _resizeListener = null;
    _syncQueued = false;
    _visible = false;

    try {
        document.documentElement?.style?.setProperty("--mjr-mfv-top-offset", "60px");
        document.querySelector(`[${BUTTON_HOST_ATTR}]`)?.remove?.();
    } catch (e) {
        console.debug?.(e);
    }
}
