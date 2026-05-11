import { EVENTS } from "../../app/events.js";
import { t } from "../../app/i18n.js";
import { comfyToast } from "../../app/toast.js";

const FLOATING_VIEWER_POPOUT_THEME_PROPS = [
    "--border-color",
    "--border-default",
    "--button-hover-surface",
    "--button-surface",
    "--comfy-accent",
    "--comfy-font",
    "--comfy-input-bg",
    "--comfy-menu-bg",
    "--comfy-menu-secondary-bg",
    "--comfy-status-error",
    "--comfy-status-success",
    "--comfy-status-warning",
    "--content-bg",
    "--content-fg",
    "--descrip-text",
    "--destructive-background",
    "--font-inter",
    "--input-text",
    "--interface-menu-surface",
    "--interface-panel-hover-surface",
    "--interface-panel-selected-surface",
    "--interface-panel-surface",
    "--modal-card-background",
    "--muted-foreground",
    "--primary-background",
    "--primary-background-hover",
    "--radius-lg",
    "--radius-md",
    "--radius-sm",
    "--success-background",
    "--warning-background",
];

function isFloatingViewerElectronAppHost() {
    try {
        const root = typeof window !== "undefined" ? window : globalThis;
        const electronVersion = root?.process?.versions?.electron;
        if (typeof electronVersion === "string" && electronVersion.trim()) {
            return true;
        }
        if (root?.electron || root?.ipcRenderer || root?.electronAPI) {
            return true;
        }
        const userAgent = String(
            root?.navigator?.userAgent || globalThis?.navigator?.userAgent || "",
        );
        const hasElectronUa = /\bElectron\//i.test(userAgent);
        const isVsCodeShell = /\bCode\//i.test(userAgent);
        if (hasElectronUa && !isVsCodeShell) {
            return true;
        }
    } catch (e) {
        console.debug?.(e);
    }
    return false;
}

function traceFloatingViewerPopout(stage, detail = null, level = "info") {
    const payload = {
        stage: String(stage || "unknown"),
        detail,
        ts: Date.now(),
    };
    try {
        const root = typeof window !== "undefined" ? window : globalThis;
        const key = "__MJR_MFV_POPOUT_TRACE__";
        const history = Array.isArray(root[key]) ? root[key] : [];
        history.push(payload);
        root[key] = history.slice(-20);
        root.__MJR_MFV_POPOUT_LAST__ = payload;
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const logger =
            level === "error" ? console.error : level === "warn" ? console.warn : console.info;
        logger?.("[MFV popout]", payload);
    } catch (e) {
        console.debug?.(e);
    }
}

function mergeFloatingViewerPopoutClasses(sourceClassName, ...extraClasses) {
    return Array.from(
        new Set(
            [String(sourceClassName || ""), ...extraClasses].join(" ").split(/\s+/).filter(Boolean),
        ),
    ).join(" ");
}

function copyFloatingViewerPopoutAttributes(sourceEl, targetEl) {
    if (!sourceEl || !targetEl) return;
    for (const attr of Array.from(sourceEl.attributes || [])) {
        const name = String(attr?.name || "");
        if (!name || name === "class" || name === "style") continue;
        try {
            targetEl.setAttribute(name, attr.value);
        } catch (e) {
            console.debug?.(e);
        }
    }
}

function copyFloatingViewerPopoutThemeVars(sourceEl, targetEl) {
    if (!sourceEl || !targetEl?.style) return;
    const getComputedStyleFn =
        (typeof window !== "undefined" && window?.getComputedStyle) || globalThis?.getComputedStyle;
    if (typeof getComputedStyleFn !== "function") return;

    let computed = null;
    try {
        computed = getComputedStyleFn(sourceEl);
    } catch (e) {
        console.debug?.(e);
    }
    if (!computed) return;

    for (const propName of FLOATING_VIEWER_POPOUT_THEME_PROPS) {
        try {
            const value = String(computed.getPropertyValue?.(propName) || "").trim();
            if (value) {
                targetEl.style.setProperty(propName, value);
            }
        } catch (e) {
            console.debug?.(e);
        }
    }

    try {
        const colorScheme = String(computed.getPropertyValue?.("color-scheme") || "").trim();
        if (colorScheme) {
            targetEl.style.colorScheme = colorScheme;
        }
    } catch (e) {
        console.debug?.(e);
    }
}

function syncFloatingViewerPopoutDocumentTheme(doc) {
    if (!doc?.documentElement || !doc?.body || !document?.documentElement) return;

    const sourceHtml = document.documentElement;
    const sourceBody = document.body;
    const targetHtml = doc.documentElement;
    const targetBody = doc.body;

    targetHtml.className = mergeFloatingViewerPopoutClasses(
        sourceHtml.className,
        "mjr-mfv-popout-document",
    );
    targetBody.className = mergeFloatingViewerPopoutClasses(
        sourceBody?.className,
        "mjr-mfv-popout-body",
    );

    copyFloatingViewerPopoutAttributes(sourceHtml, targetHtml);
    copyFloatingViewerPopoutAttributes(sourceBody, targetBody);
    copyFloatingViewerPopoutThemeVars(sourceHtml, targetHtml);
    copyFloatingViewerPopoutThemeVars(sourceBody, targetBody);

    if (sourceHtml?.lang) targetHtml.lang = sourceHtml.lang;
    if (sourceHtml?.dir) targetHtml.dir = sourceHtml.dir;
}

function createFloatingViewerPopoutRoot(doc) {
    if (!doc?.body) return null;
    try {
        const existingRoot = doc.getElementById?.("mjr-mfv-popout-root");
        existingRoot?.remove?.();
    } catch (e) {
        console.debug?.(e);
    }
    const root = doc.createElement("div");
    root.id = "mjr-mfv-popout-root";
    root.className = "mjr-mfv-popout-root";
    doc.body.appendChild(root);
    return root;
}

function refreshFloatingViewerAfterDocumentMove(viewer) {
    viewer._resetGenDropdownForCurrentDocument();
    viewer._rebindControlHandlers();
    viewer._bindPanelInteractions();
    viewer._bindDocumentUiHandlers();
    viewer._unbindLayoutObserver?.();
    viewer._bindLayoutObserver?.();
    viewer._refresh?.();
    viewer._updatePopoutBtnUI();
}

export function setFloatingViewerDesktopExpanded(viewer, active) {
    if (!viewer.element) return;
    const shouldExpand = Boolean(active);
    if (viewer._desktopExpanded === shouldExpand) return;

    const el = viewer.element;
    if (shouldExpand) {
        viewer._desktopExpandRestore = {
            parent: el.parentNode || null,
            nextSibling: el.nextSibling || null,
            styleAttr: el.getAttribute("style"),
        };
        if (el.parentNode !== document.body) {
            document.body.appendChild(el);
        }
        el.classList.add("mjr-mfv--desktop-expanded", "is-visible");
        el.setAttribute("aria-hidden", "false");
        el.style.position = "fixed";
        el.style.top = "12px";
        el.style.left = "12px";
        el.style.right = "12px";
        el.style.bottom = "12px";
        el.style.width = "auto";
        el.style.height = "auto";
        el.style.maxWidth = "none";
        el.style.maxHeight = "none";
        el.style.minWidth = "320px";
        el.style.minHeight = "240px";
        el.style.resize = "none";
        el.style.margin = "0";
        el.style.zIndex = "2147483000";
        viewer._desktopExpanded = true;
        viewer.isVisible = true;
        refreshFloatingViewerAfterDocumentMove(viewer);
        traceFloatingViewerPopout("electron-in-app-expanded", { isVisible: viewer.isVisible });
        return;
    }

    const restore = viewer._desktopExpandRestore;
    viewer._desktopExpanded = false;
    el.classList.remove("mjr-mfv--desktop-expanded");
    if (restore?.styleAttr == null || restore.styleAttr === "") {
        el.removeAttribute("style");
    } else {
        el.setAttribute("style", restore.styleAttr);
    }
    if (restore?.parent && restore.parent.isConnected) {
        if (restore.nextSibling && restore.nextSibling.parentNode === restore.parent) {
            restore.parent.insertBefore(el, restore.nextSibling);
        } else {
            restore.parent.appendChild(el);
        }
    }
    viewer._desktopExpandRestore = null;
    refreshFloatingViewerAfterDocumentMove(viewer);
    traceFloatingViewerPopout("electron-in-app-restored", null);
}

export function activateFloatingViewerDesktopExpandedFallback(viewer, error) {
    viewer._desktopPopoutUnsupported = true;
    traceFloatingViewerPopout(
        "electron-in-app-fallback",
        { message: error?.message || String(error || "unknown error") },
        "warn",
    );
    viewer._setDesktopExpanded(true);
    try {
        comfyToast(
            t(
                "toast.popoutElectronInAppFallback",
                "Desktop PiP is unavailable here. Viewer expanded inside the app instead.",
            ),
            "warning",
            4500,
        );
    } catch (e) {
        console.debug?.(e);
    }
}

export function tryFloatingViewerElectronPopupFallback(viewer, el, w, h, reason) {
    traceFloatingViewerPopout(
        "electron-popup-fallback-attempt",
        { reason: reason?.message || String(reason || "unknown") },
        "warn",
    );
    viewer._fallbackPopout(el, w, h);
    if (viewer._popoutWindow) {
        viewer._desktopPopoutUnsupported = false;
        traceFloatingViewerPopout("electron-popup-fallback-opened", null);
        return true;
    }
    return false;
}

export function popOutFloatingViewer(viewer) {
    if (viewer._isPopped || !viewer.element) return;
    const el = viewer.element;
    viewer._stopEdgeResize();
    const isElectronHost = isFloatingViewerElectronAppHost();
    const hasDocumentPiP = typeof window !== "undefined" && "documentPictureInPicture" in window;
    const userAgent = String(
        window?.navigator?.userAgent || globalThis?.navigator?.userAgent || "",
    );

    const w = Math.max(el.offsetWidth || 520, 400);
    const h = Math.max(el.offsetHeight || 420, 300);

    traceFloatingViewerPopout("start", {
        isElectronHost,
        hasDocumentPiP,
        userAgent,
        width: w,
        height: h,
        desktopPopoutUnsupported: viewer._desktopPopoutUnsupported,
    });

    if (isElectronHost && viewer._desktopPopoutUnsupported) {
        traceFloatingViewerPopout("electron-in-app-fallback-reuse", null);
        viewer._setDesktopExpanded(true);
        return;
    }

    if (isElectronHost) {
        traceFloatingViewerPopout("electron-popup-request", { width: w, height: h });
        if (viewer._tryElectronPopupFallback(el, w, h, new Error("Desktop popup requested"))) {
            return;
        }
    }

    if (isElectronHost && "documentPictureInPicture" in window) {
        traceFloatingViewerPopout("electron-pip-request", { width: w, height: h });
        window.documentPictureInPicture
            .requestWindow({ width: w, height: h })
            .then((pipWindow) => {
                traceFloatingViewerPopout("electron-pip-opened", {
                    hasDocument: Boolean(pipWindow?.document),
                });
                viewer._popoutWindow = pipWindow;
                viewer._isPopped = true;
                viewer._popoutRestoreGuard = false;
                try {
                    viewer._popoutAC?.abort();
                } catch (e) {
                    console.debug?.(e);
                }
                viewer._popoutAC = new AbortController();
                const popoutSignal = viewer._popoutAC.signal;

                const handlePopupClosing = () => viewer._schedulePopInFromPopupClose();
                viewer._popoutCloseHandler = handlePopupClosing;

                const doc = pipWindow.document;
                doc.title = "Majoor Viewer";
                viewer._installPopoutStyles(doc);
                const root = createFloatingViewerPopoutRoot(doc);
                if (!root) {
                    viewer._activateDesktopExpandedFallback(
                        new Error("Popup root creation failed"),
                    );
                    return;
                }

                try {
                    const adopted = typeof doc.adoptNode === "function" ? doc.adoptNode(el) : el;
                    root.appendChild(adopted);
                    traceFloatingViewerPopout("electron-pip-adopted", {
                        usedAdoptNode: typeof doc.adoptNode === "function",
                    });
                } catch (e) {
                    traceFloatingViewerPopout(
                        "electron-pip-adopt-failed",
                        { message: e?.message || String(e) },
                        "warn",
                    );
                    console.warn("[MFV] PiP adoptNode failed", e);
                    viewer._isPopped = false;
                    viewer._popoutWindow = null;
                    try {
                        pipWindow.close();
                    } catch (_e) {
                        console.debug?.(_e);
                    }
                    viewer._activateDesktopExpandedFallback(e);
                    return;
                }
                el.classList.add("is-visible");
                viewer.isVisible = true;

                refreshFloatingViewerAfterDocumentMove(viewer);
                traceFloatingViewerPopout("electron-pip-ready", { isPopped: viewer._isPopped });

                pipWindow.addEventListener("pagehide", handlePopupClosing, {
                    signal: popoutSignal,
                });
                viewer._startPopoutCloseWatch();

                viewer._popoutKeydownHandler = (e) => {
                    const tag = String(e?.target?.tagName || "").toLowerCase();
                    if (
                        e?.defaultPrevented ||
                        e?.target?.isContentEditable ||
                        tag === "input" ||
                        tag === "textarea" ||
                        tag === "select"
                    ) {
                        return;
                    }
                    viewer._forwardKeydownToController(e);
                };
                pipWindow.addEventListener("keydown", viewer._popoutKeydownHandler, {
                    signal: popoutSignal,
                });
            })
            .catch((err) => {
                traceFloatingViewerPopout(
                    "electron-pip-request-failed",
                    { message: err?.message || String(err) },
                    "warn",
                );
                viewer._activateDesktopExpandedFallback(err);
            });
        return;
    }

    if (isElectronHost) {
        traceFloatingViewerPopout("electron-no-pip-api", { hasDocumentPiP: hasDocumentPiP });
        viewer._activateDesktopExpandedFallback(
            new Error("Document Picture-in-Picture unavailable after popup failure"),
        );
        return;
    }

    traceFloatingViewerPopout("browser-fallback-popup", { width: w, height: h });
    viewer._fallbackPopout(el, w, h);
}

export function fallbackPopoutFloatingViewer(viewer, el, w, h) {
    traceFloatingViewerPopout("browser-popup-open", { width: w, height: h });
    const left = (window.screenX || window.screenLeft) + Math.round((window.outerWidth - w) / 2);
    const top = (window.screenY || window.screenTop) + Math.round((window.outerHeight - h) / 2);
    const features = `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`;
    const popup = window.open("about:blank", "_mjr_viewer", features);
    if (!popup) {
        traceFloatingViewerPopout("browser-popup-blocked", null, "warn");
        console.warn("[MFV] Pop-out blocked — allow popups for this site.");
        return;
    }
    traceFloatingViewerPopout("browser-popup-opened", { hasDocument: Boolean(popup?.document) });
    viewer._popoutWindow = popup;
    viewer._isPopped = true;
    viewer._popoutRestoreGuard = false;
    try {
        viewer._popoutAC?.abort();
    } catch (e) {
        console.debug?.(e);
    }
    viewer._popoutAC = new AbortController();
    const popoutSignal = viewer._popoutAC.signal;
    const handlePopupClosing = () => viewer._schedulePopInFromPopupClose();
    viewer._popoutCloseHandler = handlePopupClosing;

    const mountViewer = () => {
        let doc;
        try {
            doc = popup.document;
        } catch {
            return;
        }
        if (!doc) return;

        doc.title = "Majoor Viewer";
        viewer._installPopoutStyles(doc);
        const root = createFloatingViewerPopoutRoot(doc);
        if (!root) return;

        try {
            root.appendChild(doc.adoptNode(el));
        } catch (e) {
            console.warn("[MFV] adoptNode failed", e);
            return;
        }
        el.classList.add("is-visible");
        viewer.isVisible = true;
        refreshFloatingViewerAfterDocumentMove(viewer);
    };

    try {
        mountViewer();
    } catch (e) {
        console.debug?.("[MFV] immediate mount failed, retrying on load", e);
        try {
            popup.addEventListener("load", mountViewer, { signal: popoutSignal });
        } catch (e2) {
            console.debug?.("[MFV] pop-out page load listener failed", e2);
        }
    }

    popup.addEventListener("beforeunload", handlePopupClosing, { signal: popoutSignal });
    popup.addEventListener("pagehide", handlePopupClosing, { signal: popoutSignal });
    popup.addEventListener("unload", handlePopupClosing, { signal: popoutSignal });
    viewer._startPopoutCloseWatch();

    viewer._popoutKeydownHandler = (e) => {
        const tag = String(e?.target?.tagName || "").toLowerCase();
        if (
            e?.defaultPrevented ||
            e?.target?.isContentEditable ||
            tag === "input" ||
            tag === "textarea" ||
            tag === "select"
        ) {
            return;
        }
        viewer._forwardKeydownToController(e);
    };
    popup.addEventListener("keydown", viewer._popoutKeydownHandler, { signal: popoutSignal });
}

export function clearFloatingViewerPopoutCloseWatch(viewer) {
    if (viewer._popoutCloseTimer == null) return;
    try {
        window.clearInterval(viewer._popoutCloseTimer);
    } catch (e) {
        console.debug?.(e);
    }
    viewer._popoutCloseTimer = null;
}

export function startFloatingViewerPopoutCloseWatch(viewer) {
    viewer._clearPopoutCloseWatch();
    viewer._popoutCloseTimer = window.setInterval(() => {
        if (!viewer._isPopped) {
            viewer._clearPopoutCloseWatch();
            return;
        }
        const popup = viewer._popoutWindow;
        if (!popup || popup.closed) {
            viewer._clearPopoutCloseWatch();
            viewer._schedulePopInFromPopupClose();
        }
    }, 250);
}

export function scheduleFloatingViewerPopInFromPopupClose(viewer) {
    if (!viewer._isPopped || viewer._popoutRestoreGuard) return;
    viewer._popoutRestoreGuard = true;
    window.setTimeout(() => {
        try {
            viewer.popIn({ closePopupWindow: false });
        } finally {
            viewer._popoutRestoreGuard = false;
        }
    }, 0);
}

export function installFloatingViewerPopoutStyles(viewer, doc) {
    void viewer;
    if (!doc?.head) return;
    try {
        for (const existing of doc.head.querySelectorAll("[data-mjr-popout-cloned-style='1']")) {
            existing.remove();
        }
    } catch (e) {
        console.debug?.(e);
    }
    syncFloatingViewerPopoutDocumentTheme(doc);
    // Copy CSS variables from the main document's <html> element (ComfyUI theme vars)
    try {
        const htmlInlineStyle = document.documentElement.style.cssText;
        if (htmlInlineStyle) {
            const varsStyle = doc.createElement("style");
            varsStyle.setAttribute("data-mjr-popout-cloned-style", "1");
            varsStyle.textContent = `:root { ${htmlInlineStyle} }`;
            doc.head.appendChild(varsStyle);
        }
    } catch (e) {
        console.debug?.(e);
    }
    for (const ss of document.querySelectorAll('link[rel="stylesheet"], style')) {
        try {
            let clone = null;
            if (ss.tagName === "LINK") {
                clone = doc.createElement("link");
                for (const attr of Array.from(ss.attributes || [])) {
                    if (attr?.name === "href") continue;
                    clone.setAttribute(attr.name, attr.value);
                }
                clone.setAttribute("href", ss.href || ss.getAttribute("href") || "");
            } else {
                clone = doc.importNode(ss, true);
            }
            clone.setAttribute("data-mjr-popout-cloned-style", "1");
            doc.head.appendChild(clone);
        } catch (e) {
            console.debug?.(e);
        }
    }
    const overrideStyle = doc.createElement("style");
    overrideStyle.setAttribute("data-mjr-popout-cloned-style", "1");
    overrideStyle.textContent = `
        html.mjr-mfv-popout-document {
            min-height: 100%;
            background:
                radial-gradient(
                    1200px 420px at 50% 0%,
                    color-mix(in srgb, var(--primary-background, var(--comfy-accent, #5fb3ff)) 10%, transparent),
                    transparent 62%
                ),
                linear-gradient(
                    180deg,
                    color-mix(in srgb, var(--interface-panel-surface, var(--content-bg, #16191f)) 82%, #000 18%),
                    color-mix(in srgb, var(--interface-menu-surface, var(--comfy-menu-bg, #1f2227)) 84%, #000 16%)
                ) !important;
        }
        body.mjr-mfv-popout-body {
            margin: 0 !important;
            display: flex !important;
            min-height: 100vh !important;
            overflow: hidden !important;
            background: transparent !important;
        }
        #mjr-mfv-popout-root,
        .mjr-mfv-popout-root {
            flex: 1 !important;
            min-width: 0 !important;
            min-height: 0 !important;
            display: flex !important;
            isolation: isolate;
        }
        body.mjr-mfv-popout-body .mjr-mfv {
            position: static !important;
            width: 100% !important;
            height: 100% !important;
            min-width: 0 !important;
            min-height: 0 !important;
            resize: none !important;
            border-radius: 0 !important;
            display: flex !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
            transform: none !important;
            max-width: none !important;
            max-height: none !important;
            overflow: hidden !important;
        }
    `;
    doc.head.appendChild(overrideStyle);
}

export function popInFloatingViewer(viewer, { closePopupWindow = true } = {}) {
    if (viewer._desktopExpanded) {
        viewer._setDesktopExpanded(false);
        return;
    }
    if (!viewer._isPopped || !viewer.element) return;
    const popup = viewer._popoutWindow;
    viewer._clearPopoutCloseWatch();
    try {
        viewer._popoutAC?.abort();
    } catch (e) {
        console.debug?.(e);
    }
    viewer._popoutAC = null;
    viewer._popoutCloseHandler = null;
    viewer._popoutKeydownHandler = null;
    viewer._isPopped = false;

    let adopted = viewer.element;
    try {
        adopted = adopted?.ownerDocument === document ? adopted : document.adoptNode(adopted);
    } catch (e) {
        console.debug?.("[MFV] pop-in adopt failed", e);
    }
    document.body.appendChild(adopted);
    adopted.classList.add("is-visible");
    adopted.setAttribute("aria-hidden", "false");
    viewer.isVisible = true;

    refreshFloatingViewerAfterDocumentMove(viewer);

    if (closePopupWindow) {
        try {
            popup?.close();
        } catch (e) {
            console.debug?.(e);
        }
    }
    viewer._popoutWindow = null;
}

export function updateFloatingViewerPopoutButtonUI(viewer) {
    if (!viewer._popoutBtn) return;
    const activePopoutState = viewer._isPopped || viewer._desktopExpanded;
    if (viewer.element) {
        viewer.element.classList.toggle("mjr-mfv--popped", activePopoutState);
    }
    viewer._popoutBtn.classList.toggle("mjr-popin-active", activePopoutState);
    const icon = viewer._popoutBtn.querySelector("i") || document.createElement("i");
    const label = activePopoutState
        ? t("tooltip.popInViewer", "Return to floating panel")
        : t("tooltip.popOutViewer", "Pop out viewer to separate window");
    icon.className = activePopoutState ? "pi pi-sign-in" : "pi pi-external-link";
    viewer._popoutBtn.title = label;
    viewer._popoutBtn.setAttribute("aria-label", label);
    viewer._popoutBtn.setAttribute("aria-pressed", String(activePopoutState));
    if (!viewer._popoutBtn.contains(icon)) {
        viewer._popoutBtn.replaceChildren(icon);
    }
}
