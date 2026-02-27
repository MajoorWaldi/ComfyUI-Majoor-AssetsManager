/**
 * Shared button components to reduce duplication.
 */

/**
 * Create a simple button with text label and optional title.
 * Used by Viewer toolbar and overlays.
 */
export function createIconButton(label, title) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.title = title || "";
    try {
        btn.setAttribute("aria-label", title || label || "Button");
    } catch (e) { console.debug?.(e); }
    
    // Unified style from toolbar.js
    btn.style.cssText = `
        padding: 6px 12px;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    `;
    
    // Hover effect (simulated via JS since we use inline styles)
    btn.onmouseenter = () => {
        if (!btn.disabled) btn.style.background = "rgba(255, 255, 255, 0.1)";
    };
    btn.onmouseleave = () => {
        if (!btn.disabled) btn.style.background = "transparent";
    };

    return btn;
}

/**
 * Create a button that toggles 'active' state (mode button).
 */
export function createModeButton(label, mode) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.dataset.mode = mode;
    try {
        btn.setAttribute("aria-label", label);
        btn.setAttribute("aria-pressed", "false");
    } catch (e) { console.debug?.(e); }
    
    // Unified style from toolbar.js
    btn.style.cssText = `
        padding: 4px 12px;
        background: linear-gradient(180deg, rgba(206, 211, 218, 0.1), rgba(206, 211, 218, 0.03));
        border: 0.8px solid rgba(196, 202, 210, 0.3);
        color: rgba(230, 233, 238, 0.95);
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.16s;
    `;

    return btn;
}
