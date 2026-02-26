/**
 * ComfyUI-native-ish dialogs for extensions.
 *
 * Uses ComfyDialog if available from the injected Comfy app UI to avoid browser
 * alert/confirm/prompt popups. Falls back to window.* when unavailable.
 */

const getComfyUi = () => {
    try {
        const app = getComfyApp();
        return app?.ui || null;
    } catch {
        return null;
    }
};

const BLOCKED_PROP_KEYS = new Set(["__proto__", "constructor", "prototype", "innerHTML", "outerHTML", "srcdoc"]);
const ALLOWED_DIRECT_PROPS = new Set([
    "id",
    "name",
    "value",
    "type",
    "checked",
    "disabled",
    "placeholder",
    "title",
    "textContent",
    "htmlFor",
    "role",
    "tabIndex",
]);

const fallbackEl = (tag, props = {}, children = []) => {
    const el = document.createElement(tag);
    Object.entries(props || {}).forEach(([key, value]) => {
        const propKey = String(key || "");
        if (!propKey || BLOCKED_PROP_KEYS.has(propKey)) return;
        if (key === "style" && value && typeof value === "object") {
            Object.assign(el.style, value);
            return;
        }
        if (key === "className") {
            el.className = String(value);
            return;
        }
        if (propKey.startsWith("on")) {
            if (typeof value === "function") {
                el.addEventListener(propKey.slice(2).toLowerCase(), value);
            }
            return;
        }
        if (ALLOWED_DIRECT_PROPS.has(propKey)) {
            try {
                el[propKey] = value;
                return;
            } catch {}
        }
        try {
            el.setAttribute(propKey, String(value));
        } catch {}
    });
    const childList = Array.isArray(children) ? children : [children];
    childList.filter(Boolean).forEach((c) => {
        try {
            el.appendChild(c);
        } catch {
            el.appendChild(document.createTextNode(String(c)));
        }
    });
    return el;
};

const $el = (tag, props, children) => {
    const ui = getComfyUi();
    if (ui?.$el) {
        try {
            return ui.$el(tag, props, children);
        } catch {
            // fall through
        }
    }
    return fallbackEl(tag, props, children);
};

const getComfyDialogCtor = () => {
    const ui = getComfyUi();
    return ui?.ComfyDialog || null;
};

const DIALOG_Z_INDEX = 999_999;
const DIALOG_WIDTH_PX = 560;
const DIALOG_RADIUS_PX = 12;

const styleDialog = (dialog) => {
    try {
        // Ensure dialogs are above extension panels/popovers.
        dialog.element.style.zIndex = String(DIALOG_Z_INDEX);
        dialog.element.style.width = `${DIALOG_WIDTH_PX}px`;
        dialog.element.style.padding = "0";
        dialog.element.style.backgroundColor = "var(--comfy-menu-bg, #131722)";
        dialog.element.style.border = "1px solid rgba(255,255,255,0.14)";
        dialog.element.style.borderRadius = `${DIALOG_RADIUS_PX}px`;
        dialog.element.style.boxSizing = "border-box";
        dialog.element.style.overflow = "hidden";
        dialog.element.style.boxShadow = "0 18px 48px rgba(0,0,0,0.48)";
    } catch {}
};

const hideDialogNativeClose = (dialog) => {
    try {
        const root = dialog?.element;
        if (!root) return;
        const maybeClose = root.querySelectorAll("button,[role='button']");
        for (const el of maybeClose) {
            const text = String(el?.textContent || "").trim().toLowerCase();
            const aria = String(el?.getAttribute?.("aria-label") || "").trim().toLowerCase();
            if (text === "close" || aria === "close") {
                try {
                    el.style.display = "none";
                } catch {}
            }
        }
    } catch {}
};

export const comfyAlert = async (message, title = "Majoor") => {
    const Dialog = getComfyDialogCtor();
    if (!Dialog) {
        try {
            window.alert(message);
        } catch {}
        return;
    }

    return new Promise((resolve) => {
        const dialog = new Dialog();
        styleDialog(dialog);

        const close = () => {
            try {
                dialog.close();
            } catch {}
            resolve();
        };

        const content = $el("div", {
            style: {
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                padding: "18px 20px 18px 20px",
            },
        }, [
            $el("div", {
                style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                },
            }, [
                $el("div", {
                    textContent: title,
                    style: {
                        fontWeight: "700",
                        fontSize: "30px",
                        color: "rgba(255,255,255,0.96)",
                        lineHeight: "1.2",
                    },
                }),
            ]),
            $el("div", {
                textContent: String(message || ""),
                style: {
                    fontSize: "22px",
                    color: "rgba(255,255,255,0.86)",
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.45",
                },
            }),
            $el("div", {
                style: { display: "flex", justifyContent: "flex-end", gap: "10px" },
            }, [
                $el("button", {
                    textContent: "Confirm",
                    onclick: close,
                    style: {
                        padding: "10px 16px",
                        borderRadius: "10px",
                        border: "1px solid rgba(17,132,255,0.75)",
                        background: "#1184ff",
                        color: "rgba(255,255,255,0.98)",
                        fontWeight: "600",
                        cursor: "pointer",
                    },
                }),
            ]),
        ]);

        try {
            dialog.show(content);
            setTimeout(() => hideDialogNativeClose(dialog), 0);
        } catch {
            try {
                window.alert(message);
            } catch {}
            resolve();
        }
    });
};

export const comfyConfirm = async (message, title = "Majoor") => {
    const Dialog = getComfyDialogCtor();
    if (!Dialog) {
        try {
            return window.confirm(message);
        } catch {
            return false;
        }
    }

    return new Promise((resolve) => {
        const dialog = new Dialog();
        styleDialog(dialog);

        const finish = (value) => {
            try {
                dialog.close();
            } catch {}
            resolve(!!value);
        };

        const content = $el("div", {
            style: {
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                padding: "18px 20px 18px 20px",
            },
        }, [
            $el("div", {
                style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                },
            }, [
                $el("div", {
                    textContent: title,
                    style: {
                        fontWeight: "700",
                        fontSize: "30px",
                        color: "rgba(255,255,255,0.96)",
                        lineHeight: "1.2",
                    },
                }),
            ]),
            $el("div", {
                textContent: String(message || ""),
                style: {
                    fontSize: "22px",
                    color: "rgba(255,255,255,0.86)",
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.45",
                },
            }),
            $el("div", {
                style: { display: "flex", justifyContent: "flex-end", gap: "10px" },
            }, [
                $el("button", {
                    textContent: "Cancel",
                    onclick: () => finish(false),
                    style: {
                        padding: "10px 16px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.85)",
                        fontWeight: "600",
                        cursor: "pointer",
                    },
                }),
                $el("button", {
                    textContent: "Confirm",
                    onclick: () => finish(true),
                    style: {
                        padding: "10px 16px",
                        borderRadius: "10px",
                        border: "1px solid rgba(17,132,255,0.75)",
                        background: "#1184ff",
                        color: "rgba(255,255,255,0.98)",
                        fontWeight: "600",
                        cursor: "pointer",
                    },
                }),
            ]),
        ]);

        try {
            dialog.show(content);
            setTimeout(() => hideDialogNativeClose(dialog), 0);
        } catch {
            try {
                resolve(!!window.confirm(message));
            } catch {
                resolve(false);
            }
        }
    });
};

export const comfyPrompt = async (message, defaultValue = "", title = "Majoor") => {
    const Dialog = getComfyDialogCtor();
    if (!Dialog) {
        try {
            return window.prompt(message, defaultValue);
        } catch {
            return null;
        }
    }

    return new Promise((resolve) => {
        const dialog = new Dialog();
        styleDialog(dialog);

        const finish = (value) => {
            try {
                dialog.close();
            } catch {}
            resolve(value ?? null);
        };

        const input = $el("input", {
            type: "text",
            value: String(defaultValue ?? ""),
            style: {
                width: "100%",
                padding: "10px 10px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "rgba(255,255,255,0.9)",
                outline: "none",
                boxSizing: "border-box",
            },
            onkeydown: (e) => {
                if (e.key === "Enter") finish(input.value);
                if (e.key === "Escape") finish(null);
                e.stopPropagation();
            },
        });

        const content = $el("div", {
            style: {
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "16px",
            },
        }, [
            $el("div", {
                textContent: title,
                style: {
                    fontWeight: "600",
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.95)",
                },
            }),
            $el("div", {
                textContent: String(message || ""),
                style: {
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.80)",
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.4",
                },
            }),
            input,
            $el("div", {
                style: { display: "flex", justifyContent: "flex-end", gap: "10px" },
            }, [
                $el("button", {
                    textContent: "Cancel",
                    onclick: () => finish(null),
                    style: {
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(0,0,0,0.25)",
                        color: "rgba(255,255,255,0.85)",
                        cursor: "pointer",
                    },
                }),
                $el("button", {
                    textContent: "OK",
                    onclick: () => finish(input.value),
                    style: {
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid rgba(95,179,255,0.45)",
                        background: "rgba(95,179,255,0.18)",
                        color: "rgba(255,255,255,0.95)",
                        cursor: "pointer",
                    },
                }),
            ]),
        ]);

        try {
            dialog.show(content);
            setTimeout(() => hideDialogNativeClose(dialog), 0);
            setTimeout(() => {
                try {
                    input.focus();
                    input.select();
                } catch {}
            }, 0);
        } catch {
            try {
                resolve(window.prompt(message, defaultValue));
            } catch {
                resolve(null);
            }
        }
    });
};
import { getComfyApp } from "./comfyApiBridge.js";
