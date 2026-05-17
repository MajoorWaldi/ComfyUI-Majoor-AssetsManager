import { getComfyApp } from "../comfyApiBridge.js";
import { t } from "../i18n.js";
import { buildMajoorSettings } from "./SettingsPanel.js";

const DIALOG_ID = "mjr-settings-dialog";
const STYLE_ID = "mjr-settings-dialog-style";

let dialogState = null;

const GROUP_META = {
    Cards: { icon: "pi pi-th-large", label: "Cards" },
    Badges: { icon: "pi pi-tags", label: "Badges" },
    Grid: { icon: "pi pi-table", label: "Grid" },
    Sidebar: { icon: "pi pi-window-maximize", label: "Sidebar" },
    Viewer: { icon: "pi pi-images", label: "Viewer" },
    "Generated Feed": { icon: "pi pi-bolt", label: "Generated Feed" },
    Search: { icon: "pi pi-search", label: "Search" },
    Scanning: { icon: "pi pi-sync", label: "Scanning" },
    Security: { icon: "pi pi-shield", label: "Security" },
    Advanced: { icon: "pi pi-cog", label: "Advanced" },
    Remote: { icon: "pi pi-cloud", label: "Remote" },
    General: { icon: "pi pi-sliders-h", label: "General" },
};

function ensureStyles() {
    if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
#${DIALOG_ID} {
    position: fixed;
    inset: 0;
    z-index: 10080;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.48);
    color: var(--fg-color, #ddd);
    font: 13px/1.4 system-ui, -apple-system, Segoe UI, sans-serif;
}
#${DIALOG_ID}[hidden] { display: none; }
#${DIALOG_ID} .mjr-settings-panel {
    width: min(860px, calc(100vw - 32px));
    max-height: min(780px, calc(100vh - 32px));
    display: grid;
    grid-template-rows: auto auto 1fr;
    background: var(--comfy-menu-bg, #252525);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 8px;
    box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
    overflow: hidden;
}
#${DIALOG_ID} .mjr-settings-head,
#${DIALOG_ID} .mjr-settings-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
}
#${DIALOG_ID} .mjr-settings-title {
    font-weight: 700;
    font-size: 14px;
    flex: 1;
}
#${DIALOG_ID} .mjr-settings-close,
#${DIALOG_ID} .mjr-settings-reset {
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: inherit;
    border-radius: 6px;
    min-height: 30px;
    padding: 0 10px;
    cursor: pointer;
}
#${DIALOG_ID} .mjr-settings-close {
    width: 30px;
    padding: 0;
}
#${DIALOG_ID} .mjr-settings-search {
    flex: 1;
    min-width: 160px;
    height: 30px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.22);
    color: inherit;
    padding: 0 10px;
}
#${DIALOG_ID} .mjr-settings-body {
    overflow: auto;
    padding: 12px;
}
#${DIALOG_ID} .mjr-settings-stack {
    display: grid;
    gap: 10px;
}
#${DIALOG_ID} .mjr-settings-group {
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.035);
    overflow: hidden;
}
#${DIALOG_ID} .mjr-settings-group summary {
    min-height: 42px;
    display: grid;
    grid-template-columns: 28px 1fr auto 18px;
    align-items: center;
    gap: 10px;
    padding: 8px 11px;
    cursor: pointer;
    user-select: none;
    background: rgba(255, 255, 255, 0.045);
}
#${DIALOG_ID} .mjr-settings-group summary::-webkit-details-marker {
    display: none;
}
#${DIALOG_ID} .mjr-settings-group-icon {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.07);
    color: var(--input-text, #fff);
}
#${DIALOG_ID} .mjr-settings-group-title {
    color: var(--input-text, #fff);
    font-weight: 700;
}
#${DIALOG_ID} .mjr-settings-group-meta {
    opacity: 0.68;
    font-size: 12px;
}
#${DIALOG_ID} .mjr-settings-chevron {
    transition: transform 0.16s ease;
}
#${DIALOG_ID} details[open] > summary .mjr-settings-chevron {
    transform: rotate(90deg);
}
#${DIALOG_ID} .mjr-settings-group-body {
    padding: 4px 11px 11px;
}
#${DIALOG_ID} .mjr-settings-subgroup {
    margin-top: 8px;
}
#${DIALOG_ID} .mjr-settings-subgroup-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 10px 0 2px;
    color: var(--input-text, #fff);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    opacity: 0.86;
}
#${DIALOG_ID} .mjr-settings-subgroup-title::after {
    content: "";
    height: 1px;
    flex: 1;
    background: rgba(255, 255, 255, 0.10);
}
#${DIALOG_ID} .mjr-settings-row {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(180px, 280px);
    align-items: center;
    gap: 16px;
    padding: 9px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
}
#${DIALOG_ID} .mjr-settings-name {
    font-weight: 600;
    color: var(--p-primary-color, var(--comfy-accent, #8ab4f8));
}
#${DIALOG_ID} .mjr-settings-tip {
    margin-top: 2px;
    opacity: 0.72;
    font-size: 12px;
}
#${DIALOG_ID} input,
#${DIALOG_ID} select {
    min-height: 30px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(0, 0, 0, 0.22);
    color: inherit;
    padding: 0 8px;
}
#${DIALOG_ID} input[type="checkbox"] {
    justify-self: end;
    width: 18px;
    min-height: 18px;
}
#${DIALOG_ID} input[type="color"] {
    padding: 2px;
    width: 56px;
    justify-self: end;
}
@media (max-width: 620px) {
    #${DIALOG_ID} .mjr-settings-row {
        grid-template-columns: 1fr;
        gap: 8px;
    }
}
`;
    document.head.appendChild(style);
}

function cleanName(name) {
    return String(name || "")
        .replace(/^\s*Majoor:\s*/i, "")
        .trim();
}

function groupName(setting) {
    const category = Array.isArray(setting?.category) ? setting.category : [];
    return String(category[1] || "General").trim() || "General";
}

function subgroupName(setting) {
    const category = Array.isArray(setting?.category) ? setting.category : [];
    return category.slice(2).filter(Boolean).join(" / ") || "General";
}

function groupMeta(name) {
    return GROUP_META[name] || { icon: "pi pi-sliders-h", label: name || "General" };
}

function matchesFilter(setting, filter) {
    if (!filter) return true;
    const haystack = [
        setting?.id,
        setting?.name,
        setting?.tooltip,
        ...(Array.isArray(setting?.category) ? setting.category : []),
    ]
        .join(" ")
        .toLowerCase();
    return haystack.includes(filter);
}

function commitSetting(setting, value) {
    if (typeof setting?.onChange !== "function") return;
    setting.defaultValue = value;
    try {
        const result = setting.onChange(value);
        if (result && typeof result.catch === "function") {
            result.catch((e) => {
                console.error?.("[Majoor] settings change failed", e);
            });
        }
    } catch (e) {
        console.error?.("[Majoor] settings change failed", e);
    }
}

function createControl(setting) {
    const type = String(setting?.type || "text").toLowerCase();
    const value = setting?.defaultValue;
    let el;

    if (type === "boolean") {
        el = document.createElement("input");
        el.type = "checkbox";
        el.checked = Boolean(value);
        el.addEventListener("change", () => commitSetting(setting, el.checked));
        return el;
    }

    if (type === "combo") {
        el = document.createElement("select");
        for (const option of setting?.options || []) {
            const opt = document.createElement("option");
            const optionValue =
                option && typeof option === "object" ? option.value ?? option.text ?? option.label : option;
            opt.value = String(optionValue ?? "");
            opt.textContent = String(
                option && typeof option === "object" ? option.text ?? option.label ?? option.value : option,
            );
            el.appendChild(opt);
        }
        el.value = String(value ?? "");
        el.addEventListener("change", () => commitSetting(setting, el.value));
        return el;
    }

    el = document.createElement("input");
    el.type = type === "color" ? "color" : type === "number" ? "number" : type === "password" ? "password" : "text";
    if (setting?.attrs && typeof setting.attrs === "object") {
        for (const [key, attrValue] of Object.entries(setting.attrs)) {
            if (attrValue != null) el.setAttribute(key, String(attrValue));
        }
    }
    el.value = String(value ?? "");
    const eventName = type === "color" ? "input" : "change";
    el.addEventListener(eventName, () => {
        const next = type === "number" ? Number(el.value) : el.value;
        commitSetting(setting, next);
    });
    return el;
}

function renderSettings(body, definitions, filter = "") {
    body.replaceChildren();
    const stack = document.createElement("div");
    stack.className = "mjr-settings-stack";
    body.appendChild(stack);

    const grouped = new Map();
    for (const setting of definitions || []) {
        if (!matchesFilter(setting, filter)) continue;
        const group = groupName(setting);
        const subgroup = subgroupName(setting);
        if (!grouped.has(group)) grouped.set(group, new Map());
        const subgroups = grouped.get(group);
        if (!subgroups.has(subgroup)) subgroups.set(subgroup, []);
        subgroups.get(subgroup).push(setting);
    }

    for (const [group, subgroups] of grouped.entries()) {
        const allSettings = Array.from(subgroups.values()).flat();
        const meta = groupMeta(group);
        const details = document.createElement("details");
        details.className = "mjr-settings-group";
        details.open = Boolean(filter);

        const summary = document.createElement("summary");
        const icon = document.createElement("span");
        icon.className = "mjr-settings-group-icon";
        const iconI = document.createElement("i");
        iconI.className = meta.icon;
        iconI.setAttribute("aria-hidden", "true");
        icon.appendChild(iconI);
        const label = document.createElement("span");
        label.className = "mjr-settings-group-title";
        label.textContent = meta.label || group;
        const count = document.createElement("span");
        count.className = "mjr-settings-group-meta";
        count.textContent = `${allSettings.length} setting${allSettings.length === 1 ? "" : "s"}`;
        const chevron = document.createElement("i");
        chevron.className = "pi pi-chevron-right mjr-settings-chevron";
        chevron.setAttribute("aria-hidden", "true");
        summary.append(icon, label, count, chevron);
        details.appendChild(summary);

        const groupBody = document.createElement("div");
        groupBody.className = "mjr-settings-group-body";
        for (const [subgroup, settings] of subgroups.entries()) {
            const sectionEl = document.createElement("section");
            sectionEl.className = "mjr-settings-subgroup";
            const title = document.createElement("div");
            title.className = "mjr-settings-subgroup-title";
            title.textContent = subgroup;
            sectionEl.appendChild(title);

            for (const setting of settings) {
                const row = document.createElement("label");
                row.className = "mjr-settings-row";
                const text = document.createElement("div");
                const name = document.createElement("div");
                name.className = "mjr-settings-name";
                name.textContent = cleanName(setting?.name) || setting?.id || "Setting";
                text.appendChild(name);
                if (setting?.tooltip) {
                    const tip = document.createElement("div");
                    tip.className = "mjr-settings-tip";
                    tip.textContent = String(setting.tooltip);
                    text.appendChild(tip);
                }
                row.appendChild(text);
                row.appendChild(createControl(setting));
                sectionEl.appendChild(row);
            }
            groupBody.appendChild(sectionEl);
        }
        details.appendChild(groupBody);
        stack.appendChild(details);
    }
}

function buildDialog() {
    ensureStyles();
    const root = document.createElement("div");
    root.id = DIALOG_ID;
    root.hidden = true;
    root.addEventListener("click", (event) => {
        if (event.target === root) closeMajoorSettingsDialog();
    });

    const panel = document.createElement("div");
    panel.className = "mjr-settings-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");

    const head = document.createElement("div");
    head.className = "mjr-settings-head";
    const title = document.createElement("div");
    title.className = "mjr-settings-title";
    title.textContent = t("settings.majoor.title", "Majoor Assets Manager Settings");
    const close = document.createElement("button");
    close.type = "button";
    close.className = "mjr-settings-close";
    close.textContent = "X";
    close.setAttribute("aria-label", t("btn.close", "Close"));
    close.addEventListener("click", closeMajoorSettingsDialog);
    head.append(title, close);

    const tools = document.createElement("div");
    tools.className = "mjr-settings-tools";
    const search = document.createElement("input");
    search.type = "search";
    search.className = "mjr-settings-search";
    search.placeholder = t("placeholder.searchSettings", "Search settings");
    tools.appendChild(search);

    const body = document.createElement("div");
    body.className = "mjr-settings-body";

    panel.append(head, tools, body);
    root.appendChild(panel);
    document.body.appendChild(root);
    return { body, root, search };
}

export function closeMajoorSettingsDialog() {
    if (!dialogState?.root) return;
    dialogState.root.hidden = true;
}

export function openMajoorSettingsDialog(app = getComfyApp()) {
    if (typeof document === "undefined") return false;
    if (!dialogState?.root?.isConnected) {
        dialogState = buildDialog();
    }
    const definitions = buildMajoorSettings(app);
    const render = () =>
        renderSettings(
            dialogState.body,
            definitions,
            String(dialogState.search.value || "").trim().toLowerCase(),
        );
    dialogState.search.oninput = render;
    dialogState.search.value = "";
    render();
    dialogState.root.hidden = false;
    setTimeout(() => dialogState?.search?.focus?.(), 0);
    return true;
}
