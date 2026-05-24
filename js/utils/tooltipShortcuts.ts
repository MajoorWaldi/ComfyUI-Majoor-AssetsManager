export function appendTooltipHint(label: string, hint: string): string {
    const base = String(label || "").trim();
    const suffix = String(hint || "").trim();

    if (!suffix) return base;
    if (!base) return suffix;
    if (suffix.length === 1) {
        const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (new RegExp(`\\(${escaped}\\)|\\b${escaped}\\b`, "i").test(base)) {
            return base;
        }
    } else if (base.toLowerCase().includes(suffix.toLowerCase())) {
        return base;
    }
    return `${base} (${suffix})`;
}

export function setTooltipHint(
    element: HTMLElement | null | undefined,
    label: string,
    hint: string,
    { setAriaLabel = true, ariaLabel = null }: { setAriaLabel?: boolean; ariaLabel?: string | null } = {},
): string {
    if (!element) return "";

    const title = appendTooltipHint(label, hint);
    element.title = title;

    if (setAriaLabel) {
        const ariaBase = ariaLabel == null ? label : ariaLabel;
        element.setAttribute("aria-label", appendTooltipHint(ariaBase, hint));
    }

    return title;
}
