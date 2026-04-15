import { EVENTS } from "../../app/events.js";
import { t } from "../../app/i18n.js";
import { setTooltipHint } from "../../utils/tooltipShortcuts.js";

const BUTTON_HOST_ATTR = "data-mjr-topbar-mfv-host";
const BUTTON_ATTR = "data-mjr-topbar-mfv-button";
const SLOT_ATTR = "data-mjr-topbar-mfv-slot";
const BUTTON_LABEL_KEY = "label.floatingViewer";
const BUTTON_LABEL_FALLBACK = "Viewer";
const MFV_TOOLTIP_HINT = "V, Ctrl/Cmd+V";

let _observer = null;
let _observedTarget = null;
let _bodyObserver = null;
let _visibilityListener = null;
let _resizeListener = null;
let _syncQueued = false;
let _syncTimer = null;
let _visible = false;
let _hasVisibilitySignal = false;

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
    return container.querySelector(".queue-button-group") || null;
}

function ensureSlotMounted(container) {
    if (!container) return null;

    let slot = container.querySelector(`[${SLOT_ATTR}]`);
    if (!slot) {
        slot = document.createElement("div");
        slot.setAttribute(SLOT_ATTR, "1");
        slot.className = "flex h-full items-center pointer-events-auto";
        slot.style.position = "relative";
        slot.style.zIndex = "10030";
        slot.style.padding = "0 4px";
    }

    const anchor = getAnchor(container);
    const parent = anchor?.parentElement || container;

    if (slot.parentElement !== parent) {
        if (anchor && parent) {
            parent.insertBefore(slot, anchor.nextSibling);
        } else {
            parent.appendChild(slot);
        }
    } else if (anchor && parent && slot.previousSibling !== anchor) {
        parent.insertBefore(slot, anchor.nextSibling);
    } else if (!anchor && slot !== parent.lastElementChild) {
        parent.appendChild(slot);
    }

    return slot;
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
    const tooltipLabel = _visible
        ? t("tooltip.closeMFV", "Close Floating Viewer")
        : t("tooltip.openMFV", "Open Floating Viewer");
    setTooltipHint(button, tooltipLabel, MFV_TOOLTIP_HINT, {
        ariaLabel: tooltipLabel,
    });
    button.setAttribute("aria-pressed", _visible ? "true" : "false");
    button.classList.toggle("primary", _visible);
    button.classList.toggle("mjr-topbar-mfv-active", _visible);
    button.replaceChildren(
        createIcon(_visible ? "pi pi-eye-slash" : "pi pi-eye"),
        createLabel(t(BUTTON_LABEL_KEY, BUTTON_LABEL_FALLBACK)),
    );
}

function dispatchLaunch() {
    try {
        window.dispatchEvent(new Event(EVENTS.MFV_TOGGLE));
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
    host.className = "mjr-topbar-mfv-button-host";
    host.style.position = "relative";

    host.appendChild(createButton());
    return host;
}

function _syncVisibleFromDom() {
    if (typeof document === "undefined") return;
    if (_hasVisibilitySignal) return;
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

    const slot = ensureSlotMounted(container);
    if (!slot) {
        updateViewerTopOffset(container);
        return null;
    }

    let host = slot.querySelector(`[${BUTTON_HOST_ATTR}]`);
    if (!host) {
        host = createButtonHost();
    }

    if (host.parentElement !== slot) {
        slot.replaceChildren(host);
    }

    updateViewerTopOffset(container);
    updateButtonState(host.querySelector(`[${BUTTON_ATTR}]`));
    return slot;
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
            _hasVisibilitySignal = true;
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
    _hasVisibilitySignal = false;

    try {
        document.documentElement?.style?.setProperty("--mjr-mfv-top-offset", "60px");
        document.querySelector(`[${BUTTON_HOST_ATTR}]`)?.remove?.();
        document.querySelector(`[${SLOT_ATTR}]`)?.remove?.();
    } catch (e) {
        console.debug?.(e);
    }
}
