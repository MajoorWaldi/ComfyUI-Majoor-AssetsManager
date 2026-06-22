import { EVENTS } from "../../app/events.js";
import { t } from "../../app/i18n.js";
import { setTooltipHint } from "../../utils/tooltipShortcuts.js";

const BUTTON_HOST_ATTR = "data-mjr-topbar-mfv-host";
const BUTTON_ATTR = "data-mjr-topbar-mfv-button";
const SLOT_ATTR = "data-mjr-topbar-mfv-slot";
const BUTTON_LABEL_KEY = "label.floatingViewer";
const BUTTON_LABEL_FALLBACK = "Viewer";
const MFV_TOOLTIP_HINT = "V";
const ACTIONBAR_SELECTORS = [
    ".actionbar-container",
    "[data-testid='actionbar-container']",
    "[data-testid='topbar']",
    ".comfyui-topbar",
];
const BUTTON_GROUP_SELECTORS = [
    ".queue-button-group",
    ".comfyui-button-group",
    "[role='toolbar']",
];
const FALLBACK_ACTIONBAR_SELECTORS = [".topbar"];

let _observer: any = null;
let _observedTarget: any = null;
let _bodyObserver: any = null;
let _visibilityListener: any = null;
let _resizeListener: any = null;
let _syncQueued = false;
let _syncTimer: any = null;
let _visible = false;
let _hasVisibilitySignal = false;

function _tryObserveActionbar(container: any) {
    if (_observer && _observedTarget === container) return;
    if (!container) {
        _observeBodyForActionbar();
        return;
    }
    // Disconnect previous observer if target changed
    try {
        _observer?.disconnect?.();
    } catch (_) {
        /* noop */
    }
    _observer = new MutationObserver(() => scheduleSync());
    _observer.observe(container, { childList: true, subtree: true });
    _observedTarget = container;
    _observeBodyForActionbar();
}

function _observeBodyForActionbar() {
    if (_bodyObserver || typeof MutationObserver === "undefined" || !document.body) return;
    _bodyObserver = new MutationObserver(() => scheduleSync());
    _bodyObserver.observe(document.body, { childList: true, subtree: true });
}

function _isConnected(el: any) {
    return Boolean(el?.isConnected || (el && document.body?.contains?.(el)));
}

function getButtonGroup(container: any) {
    if (!container?.querySelector) return null;
    for (const selector of BUTTON_GROUP_SELECTORS) {
        const el = container.querySelector(selector);
        if (el) return el;
    }
    return null;
}

function isValidActionbarCandidate(el: any, { allowFallback = false } = {}) {
    if (!el) return false;
    if (!allowFallback) return true;
    return Boolean(getButtonGroup(el));
}

function getActionbarContainer() {
    if (typeof document === "undefined") return null;
    for (const selector of ACTIONBAR_SELECTORS) {
        const el = document.querySelector(selector);
        if (isValidActionbarCandidate(el)) return el;
    }
    for (const selector of FALLBACK_ACTIONBAR_SELECTORS) {
        const candidates = Array.from(document.querySelectorAll(selector));
        const el = candidates.find((candidate) =>
            isValidActionbarCandidate(candidate, { allowFallback: true }),
        );
        if (el) return el;
    }
    return null;
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

function getTopbarButtonParent(container: any) {
    if (!container) return null;
    return getButtonGroup(container) || container;
}

function ensureSlotMounted(container: any) {
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

    const parent = getTopbarButtonParent(container);

    if (slot.parentElement !== parent) {
        if (parent) {
            parent.appendChild(slot);
        }
    } else if (parent && slot !== parent.lastElementChild) {
        parent.appendChild(slot);
    }

    return slot;
}

function createIcon() {
    const icon = document.createElement("i");
    icon.className = "mjr-topbar-mfv-icon pi pi-eye";
    icon.setAttribute("aria-hidden", "true");
    return icon;
}

function createLabel(text = "Viewer") {
    const label = document.createElement("span");
    label.className = "mjr-topbar-mfv-label";
    label.textContent = text;
    return label;
}

function updateButtonState(button: any) {
    if (!button) return;
    const tooltipLabel = _visible
        ? t("tooltip.closeMFV", "Close Majoor Floating Viewer")
        : t("tooltip.openMFV", "Open Majoor Floating Viewer");
    setTooltipHint(button, tooltipLabel, MFV_TOOLTIP_HINT, {
        ariaLabel: tooltipLabel,
    });
    button.setAttribute("aria-pressed", _visible ? "true" : "false");
    button.classList.toggle("primary", _visible);
    button.classList.toggle("mjr-topbar-mfv-active", _visible);
    button.replaceChildren(
        createIcon(),
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
    button.setAttribute("data-command-id", "mjr.toggleFloatingViewer");
    button.className = "comfyui-button p-button p-component mjr-topbar-mfv-button";
    button.style.position = "relative";
    button.style.zIndex = "10030";
    button.style.width = "auto";
    button.style.height = "32px";
    button.style.minWidth = "32px";
    button.style.padding = "0 8px";
    button.style.gap = "8px";
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
    const viewerNode = document.querySelector(".mjr-mfv");
    if (_hasVisibilitySignal && !viewerNode) return;
    const viewerOpen = !!viewerNode?.classList?.contains?.("is-visible");
    if (_visible !== viewerOpen) {
        _visible = viewerOpen;
    }
}

function ensureButtonMounted() {
    const container = getActionbarContainer();
    if (!container) {
        updateViewerTopOffset(null);
        _tryObserveActionbar(null);
        return null;
    }

    if (_observedTarget && !_isConnected(_observedTarget)) {
        try {
            _observer?.disconnect?.();
        } catch (e) {
            console.debug?.(e);
        }
        _observer = null;
        _observedTarget = null;
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

export function mountTopBarMfvButton(): boolean {
    if (typeof window === "undefined" || typeof document === "undefined" || !document.body) {
        return false;
    }

    scheduleSync();

    if (!_visibilityListener) {
        _visibilityListener = (event: any) => {
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

export function teardownTopBarMfvButton(): void {
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
        document.querySelectorAll(`[${BUTTON_HOST_ATTR}]`).forEach((el: any) => el.remove?.());
        document.querySelectorAll(`[${SLOT_ATTR}]`).forEach((el: any) => el.remove?.());
    } catch (e) {
        console.debug?.(e);
    }
}
