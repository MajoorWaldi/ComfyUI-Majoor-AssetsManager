/**
 * Dialog template factories — one per dialog variant.
 *
 * Each template depends only on the core dialog infrastructure exported from
 * `./dialogs.js` (DOM helpers, styling, ComfyUI bridge).
 */

import {
    $el,
    getComfyDialogCtor,
    getExtensionManagerDialog,
    getExtensionManagerToast,
    getNativeDialog,
    hideDialogNativeClose,
    styleDialog,
    toNativeDialogMessage,
} from "./dialogs.js";
import { t } from "./i18n.js";

export const comfyAlert = async (message, title = "Majoor", options = {}) => {
    const extensionDialog = getExtensionManagerDialog();
    if (extensionDialog && typeof extensionDialog.alert === "function") {
        try {
            await extensionDialog.alert({
                title: String(title || "Majoor"),
                message: String(message || ""),
            });
            return;
        } catch (e) {
            console.debug?.(e);
        }
    }

    const extensionToast = getExtensionManagerToast();
    if (extensionToast) {
        try {
            const detail = String(message || "");
            if (typeof extensionToast.addAlert === "function") {
                extensionToast.addAlert(detail);
            } else {
                extensionToast.add({
                    severity: "info",
                    summary: String(title || "Majoor"),
                    detail,
                    life: 5000,
                });
            }
            return;
        } catch (e) {
            console.debug?.(e);
        }
    }

    const forceNative = options?.native !== false;
    if (forceNative) {
        const nativeDialog = getNativeDialog();
        if (nativeDialog) {
            try {
                nativeDialog.show(toNativeDialogMessage(message, title));
                try {
                    nativeDialog.element.style.zIndex = "1100";
                } catch (e) {
                    console.debug?.(e);
                }
                return;
            } catch (e) {
                console.debug?.(e);
            }
        }
    }

    const Dialog = getComfyDialogCtor();
    if (!Dialog) {
        try {
            window.alert(message);
        } catch (e) {
            console.debug?.(e);
        }
        return;
    }

    return new Promise((resolve) => {
        const dialog = new Dialog();
        styleDialog(dialog);

        const close = () => {
            try {
                dialog.close();
            } catch (e) {
                console.debug?.(e);
            }
            resolve();
        };

        const content = $el(
            "div",
            {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    padding: "18px 20px 18px 20px",
                },
            },
            [
                $el(
                    "div",
                    {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                        },
                    },
                    [
                        $el("div", {
                            textContent: title,
                            style: {
                                fontWeight: "700",
                                fontSize: "30px",
                                color: "rgba(255,255,255,0.96)",
                                lineHeight: "1.2",
                            },
                        }),
                    ],
                ),
                $el("div", {
                    textContent: String(message || ""),
                    style: {
                        fontSize: "22px",
                        color: "rgba(255,255,255,0.86)",
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.45",
                    },
                }),
                $el(
                    "div",
                    {
                        style: { display: "flex", justifyContent: "flex-end", gap: "10px" },
                    },
                    [
                        $el("button", {
                            textContent: t("dialog.confirm", "Confirm"),
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
                    ],
                ),
            ],
        );

        try {
            dialog.show(content);
            setTimeout(() => hideDialogNativeClose(dialog), 0);
        } catch {
            try {
                window.alert(message);
            } catch (e) {
                console.debug?.(e);
            }
            resolve();
        }
    });
};

export const comfyConfirm = async (message, title = "Majoor") => {
    const extensionDialog = getExtensionManagerDialog();
    if (extensionDialog) {
        try {
            const payload = {
                title: String(title || t("dialog.confirm", "Confirm")),
                message: String(message || ""),
            };
            const result =
                typeof extensionDialog.confirm === "function"
                    ? await extensionDialog.confirm(payload)
                    : null;
            return !!result;
        } catch (e) {
            console.debug?.(e);
        }
    }

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
            } catch (e) {
                console.debug?.(e);
            }
            resolve(!!value);
        };

        const content = $el(
            "div",
            {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    padding: "18px 20px 18px 20px",
                },
            },
            [
                $el(
                    "div",
                    {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                        },
                    },
                    [
                        $el("div", {
                            textContent: title,
                            style: {
                                fontWeight: "700",
                                fontSize: "30px",
                                color: "rgba(255,255,255,0.96)",
                                lineHeight: "1.2",
                            },
                        }),
                    ],
                ),
                $el("div", {
                    textContent: String(message || ""),
                    style: {
                        fontSize: "22px",
                        color: "rgba(255,255,255,0.86)",
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.45",
                    },
                }),
                $el(
                    "div",
                    {
                        style: { display: "flex", justifyContent: "flex-end", gap: "10px" },
                    },
                    [
                        $el("button", {
                            textContent: t("dialog.cancel", "Cancel"),
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
                            textContent: t("dialog.confirm", "Confirm"),
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
                    ],
                ),
            ],
        );

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

export const comfyYesNoCancel = async (message, title = "Majoor", labels = {}) => {
    const yesLabel = String(labels?.yes || t("dialog.yes", "Yes"));
    const noLabel = String(labels?.no || t("dialog.no", "No"));
    const cancelLabel = String(labels?.cancel || t("dialog.cancel", "Cancel"));

    const Dialog = getComfyDialogCtor();
    if (!Dialog) {
        try {
            const answer = window.prompt(
                `${String(title || "Majoor")}\n\n${String(message || "")}\n\n${yesLabel}=y, ${noLabel}=n, ${cancelLabel}=c`,
                "c",
            );
            const normalized = String(answer || "")
                .trim()
                .toLowerCase();
            if (!normalized) return "cancel";
            if (["y", "yes", "1"].includes(normalized)) return "yes";
            if (["n", "no", "2"].includes(normalized)) return "no";
            return "cancel";
        } catch {
            return "cancel";
        }
    }

    return new Promise((resolve) => {
        const dialog = new Dialog();
        styleDialog(dialog);

        const finish = (value) => {
            try {
                dialog.close();
            } catch (e) {
                console.debug?.(e);
            }
            resolve(value || "cancel");
        };

        const content = $el(
            "div",
            {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    padding: "18px 20px 18px 20px",
                },
                onkeydown: (e) => {
                    if (e.key === "Escape") {
                        e.preventDefault();
                        finish("cancel");
                    }
                },
            },
            [
                $el(
                    "div",
                    {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                        },
                    },
                    [
                        $el("div", {
                            textContent: title,
                            style: {
                                fontWeight: "700",
                                fontSize: "30px",
                                color: "rgba(255,255,255,0.96)",
                                lineHeight: "1.2",
                            },
                        }),
                    ],
                ),
                $el("div", {
                    textContent: String(message || ""),
                    style: {
                        fontSize: "22px",
                        color: "rgba(255,255,255,0.86)",
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.45",
                    },
                }),
                $el(
                    "div",
                    {
                        style: {
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "10px",
                            flexWrap: "wrap",
                        },
                    },
                    [
                        $el("button", {
                            textContent: yesLabel,
                            onclick: () => finish("yes"),
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
                        $el("button", {
                            textContent: noLabel,
                            onclick: () => finish("no"),
                            style: {
                                padding: "10px 16px",
                                borderRadius: "10px",
                                border: "1px solid rgba(244,67,54,0.70)",
                                background: "rgba(244,67,54,0.18)",
                                color: "rgba(255,220,220,0.98)",
                                fontWeight: "600",
                                cursor: "pointer",
                            },
                        }),
                        $el("button", {
                            textContent: cancelLabel,
                            onclick: () => finish("cancel"),
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
                    ],
                ),
            ],
        );

        try {
            dialog.show(content);
            setTimeout(() => hideDialogNativeClose(dialog), 0);
        } catch {
            resolve("cancel");
        }
    });
};

export const comfyChoice = async (message, title = "Majoor", choices = []) => {
    const safeChoices = Array.isArray(choices)
        ? choices
              .filter((c) => c && typeof c === "object")
              .map((c, idx) => ({
                  id: String(c.id || `choice_${idx}`),
                  label: String(c.label || c.id || `Choice ${idx + 1}`),
                  variant: String(c.variant || "").toLowerCase(),
              }))
        : [];

    if (!safeChoices.length) return null;

    const Dialog = getComfyDialogCtor();
    if (!Dialog) {
        try {
            const numbered = safeChoices.map((c, idx) => `${idx + 1}. ${c.label}`).join("\n");
            const answer = window.prompt(
                `${String(title || "Majoor")}\n\n${String(message || "")}\n\n${numbered}\n\n${t("dialog.choiceTypeNumber", "Type a number:")}`,
                String(safeChoices.length),
            );
            if (answer == null) return null;
            const index = Number.parseInt(String(answer).trim(), 10) - 1;
            if (Number.isInteger(index) && index >= 0 && index < safeChoices.length) {
                return safeChoices[index].id;
            }
            return null;
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
            } catch (e) {
                console.debug?.(e);
            }
            resolve(value ?? null);
        };

        const buttonForChoice = (choice) => {
            const isDanger = choice.variant === "danger";
            const isPrimary = choice.variant === "primary";
            return $el("button", {
                textContent: choice.label,
                onclick: () => finish(choice.id),
                style: {
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: isDanger
                        ? "1px solid rgba(244,67,54,0.70)"
                        : isPrimary
                          ? "1px solid rgba(17,132,255,0.75)"
                          : "1px solid rgba(255,255,255,0.18)",
                    background: isDanger
                        ? "rgba(244,67,54,0.18)"
                        : isPrimary
                          ? "#1184ff"
                          : "rgba(255,255,255,0.06)",
                    color: isDanger
                        ? "rgba(255,220,220,0.98)"
                        : isPrimary
                          ? "rgba(255,255,255,0.98)"
                          : "rgba(255,255,255,0.85)",
                    fontWeight: "600",
                    cursor: "pointer",
                },
            });
        };

        const content = $el(
            "div",
            {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    padding: "18px 20px 18px 20px",
                },
                onkeydown: (e) => {
                    if (e.key === "Escape") {
                        e.preventDefault();
                        finish(null);
                    }
                },
            },
            [
                $el(
                    "div",
                    {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                        },
                    },
                    [
                        $el("div", {
                            textContent: title,
                            style: {
                                fontWeight: "700",
                                fontSize: "30px",
                                color: "rgba(255,255,255,0.96)",
                                lineHeight: "1.2",
                            },
                        }),
                    ],
                ),
                $el("div", {
                    textContent: String(message || ""),
                    style: {
                        fontSize: "22px",
                        color: "rgba(255,255,255,0.86)",
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.45",
                    },
                }),
                $el(
                    "div",
                    {
                        style: {
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "10px",
                            flexWrap: "wrap",
                        },
                    },
                    safeChoices.map(buttonForChoice),
                ),
            ],
        );

        try {
            dialog.show(content);
            setTimeout(() => hideDialogNativeClose(dialog), 0);
        } catch {
            resolve(null);
        }
    });
};

export const comfyPrompt = async (message, defaultValue = "", title = "Majoor") => {
    const extensionDialog = getExtensionManagerDialog();
    if (extensionDialog) {
        try {
            const payload = {
                title: String(title || t("dialog.prompt", "Prompt")),
                message: String(message || ""),
                defaultValue: String(defaultValue ?? ""),
            };
            const result =
                typeof extensionDialog.prompt === "function"
                    ? await extensionDialog.prompt(payload)
                    : null;
            if (result === null || result === undefined) return null;
            return String(result);
        } catch (e) {
            console.debug?.(e);
        }
    }

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
            } catch (e) {
                console.debug?.(e);
            }
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

        const content = $el(
            "div",
            {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    padding: "16px",
                },
            },
            [
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
                $el(
                    "div",
                    {
                        style: { display: "flex", justifyContent: "flex-end", gap: "10px" },
                    },
                    [
                        $el("button", {
                            textContent: t("dialog.cancel", "Cancel"),
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
                            textContent: t("dialog.ok", "OK"),
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
                    ],
                ),
            ],
        );

        try {
            dialog.show(content);
            setTimeout(() => hideDialogNativeClose(dialog), 0);
            setTimeout(() => {
                try {
                    input.focus();
                    input.select();
                } catch (e) {
                    console.debug?.(e);
                }
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
