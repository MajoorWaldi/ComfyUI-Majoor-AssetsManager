import { t } from "../../../app/i18n.js";

const SHORTCUT_GUIDE_SECTIONS = Object.freeze([
    {
        id: "panel",
        titleKey: "msg.shortcuts.section.panel",
        title: "Global / Panel",
        items: Object.freeze([
            { keys: "Ctrl+S / Cmd+S", description: "Trigger index scan" },
            { keys: "Ctrl+F / Ctrl+K", description: "Focus search input" },
            { keys: "Ctrl+H", description: "Clear search input" },
            { keys: "D", description: "Toggle details sidebar" },
            { keys: "V / Ctrl+V / Cmd+V", description: "Toggle Floating Viewer" },
        ]),
    },
    {
        id: "grid",
        titleKey: "msg.shortcuts.section.grid",
        title: "Grid View",
        items: Object.freeze([
            { keys: "Arrow Keys", description: "Navigate selection" },
            { keys: "Enter / Space", description: "Open viewer" },
            { keys: "C", description: "Compare A/B (2 selected)" },
            { keys: "G", description: "Side-by-side compare (2-4 selected)" },
            { keys: "T", description: "Edit tags" },
            { keys: "B / Shift+B", description: "Add or remove from collection" },
            { keys: "Delete", description: "Delete selected file" },
            { keys: "F2", description: "Rename file" },
        ]),
    },
    {
        id: "viewer",
        titleKey: "msg.shortcuts.section.viewer",
        title: "Standard Viewer",
        items: Object.freeze([
            { keys: "Esc", description: "Close viewer" },
            { keys: "F", description: "Toggle fullscreen" },
            { keys: "D", description: "Toggle info panel" },
            { keys: "I", description: "Toggle pixel probe" },
            { keys: "Z", description: "Toggle zebra exposure overlay" },
            { keys: "G", description: "Cycle grid overlays" },
            { keys: "Space", description: "Play or pause video" },
            { keys: "Left / Right", description: "Previous or next asset" },
        ]),
    },
    {
        id: "mfv",
        titleKey: "msg.shortcuts.section.mfv",
        title: "Floating Viewer",
        items: Object.freeze([
            { keys: "Esc", description: "Close Floating Viewer" },
            { keys: "V / Ctrl+V / Cmd+V", description: "Open or close Floating Viewer" },
            { keys: "C", description: "Cycle compare modes: A/B, Side-by-side, Off (Simple mode)" },
            { keys: "K", description: "Toggle KSampler denoising preview" },
            { keys: "L", description: "Toggle final-output Live Stream" },
            { keys: "N", description: "Toggle selected-node Node Stream" },
        ]),
    },
    {
        id: "video",
        titleKey: "msg.shortcuts.section.video",
        title: "Video Playback",
        items: Object.freeze([
            { keys: "Space", description: "Play or pause" },
            { keys: "[ / ]", description: "Set In / Out points" },
            { keys: "Shift+[ / Shift+]", description: "Clear In / Out points" },
            { keys: "Home / End", description: "Jump to start or end" },
            { keys: "Mouse Wheel", description: "Zoom in or out when supported" },
        ]),
    },
]);

export function listShortcutGuideSections() {
    return SHORTCUT_GUIDE_SECTIONS.map((section) => ({
        ...section,
        items: Array.isArray(section.items) ? section.items.map((item) => ({ ...item })) : [],
    }));
}

export function createShortcutGuidePanel() {
    const root = document.createElement("div");
    root.className = "mjr-shortcut-guide";

    const intro = document.createElement("div");
    intro.className = "mjr-shortcut-guide-intro";
    intro.textContent = t(
        "msg.shortcuts.intro",
        "Current keyboard shortcuts grouped by section for quick reference.",
    );
    root.appendChild(intro);

    for (const section of listShortcutGuideSections()) {
        const card = document.createElement("section");
        card.className = "mjr-shortcut-section";

        const heading = document.createElement("div");
        heading.className = "mjr-shortcut-section-title";
        heading.textContent = t(section.titleKey, section.title);
        card.appendChild(heading);

        const list = document.createElement("div");
        list.className = "mjr-shortcut-list";

        for (const item of section.items) {
            const row = document.createElement("div");
            row.className = "mjr-shortcut-row";

            const key = document.createElement("kbd");
            key.className = "mjr-shortcut-key";
            key.textContent = String(item.keys || "").trim();

            const desc = document.createElement("div");
            desc.className = "mjr-shortcut-desc";
            desc.textContent = String(item.description || "").trim();

            row.appendChild(key);
            row.appendChild(desc);
            list.appendChild(row);
        }

        card.appendChild(list);
        root.appendChild(card);
    }

    return root;
}
