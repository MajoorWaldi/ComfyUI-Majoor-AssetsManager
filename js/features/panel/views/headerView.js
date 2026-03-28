import { createIconButton } from "./iconButton.js";
import { createTabsView } from "./tabsView.js";
import { get } from "../../../api/client.js";
import { ENDPOINTS } from "../../../api/endpoints.js";
import { t } from "../../../app/i18n.js";
import { VERSION_UPDATE_EVENT, getStoredVersionUpdateState } from "../../../app/versionCheck.js";
import { EVENTS } from "../../../app/events.js";
import { setTooltipHint } from "../../../utils/tooltipShortcuts.js";

let _extensionMetadataPromise = null;
const VERSION_BADGE_LABEL_CLASS = "mjr-am-version-badge-label";
const MFV_TOOLTIP_HINT = "V, Ctrl/Cmd+V";

function getExtensionMetadata() {
    if (!_extensionMetadataPromise) {
        // Keep API shape but avoid requesting a manifest file that may not exist.
        _extensionMetadataPromise = Promise.resolve({}).catch((err) => {
            _extensionMetadataPromise = null;
            throw err;
        });
    }
    return _extensionMetadataPromise;
}

function getVersionBadgeLabelEl(badge) {
    try {
        return badge?.querySelector?.(`.${VERSION_BADGE_LABEL_CLASS}`) || null;
    } catch {
        return null;
    }
}

function readVersionBadgeText(badge) {
    const label = getVersionBadgeLabelEl(badge);
    return String(label?.textContent || badge?.textContent || "").trim();
}

function setVersionBadgeText(badge, text, { channel = "" } = {}) {
    const label = getVersionBadgeLabelEl(badge);
    if (label) {
        label.textContent = String(text || "");
    } else if (badge) {
        badge.textContent = String(text || "");
    }
    if (badge) {
        try {
            if (channel) {
                badge.dataset.mjrVersionChannel = channel;
            }
        } catch (e) {
            console.debug?.(e);
        }
    }
}

function isNightlyVersion(version, branch = "") {
    const v = String(version || "")
        .trim()
        .toLowerCase();
    const b = String(branch || "")
        .trim()
        .toLowerCase();
    const nightlyKeywords = ["nightly", "dev", "alpha", "experimental"];
    const hasNightlyKeyword = nightlyKeywords.some((kw) => v.includes(kw) || b.includes(kw));
    const hasCommitHash = v.includes("+") || (v.length > 10 && /^[a-f0-9]+$/i.test(v));
    return hasNightlyKeyword || hasCommitHash;
}

function applyExtensionMetadata(badge, isNightly) {
    getExtensionMetadata()
        .then((info) => {
            const alreadyNightly =
                String(badge?.dataset?.mjrVersionChannel || "")
                    .trim()
                    .toLowerCase() === "nightly" ||
                readVersionBadgeText(badge).toLowerCase() === "nightly";
            if (!isNightly && !alreadyNightly) {
                const version =
                    (typeof info?.version === "string" ? info.version.trim() : "") || "";
                if (version) {
                    setVersionBadgeText(badge, `v${version}`, { channel: "stable" });
                }
            }
        })
        .catch(() => {
            _extensionMetadataPromise = null;
        });
}

async function hydrateBackendVersionBadge(badge, isNightly) {
    try {
        const result = await get(ENDPOINTS.VERSION, { cache: "no-cache" });
        if (!result?.ok) {
            return;
        }
        const version = String(result.data?.version || "").trim();
        const branch = String(result.data?.branch || "")
            .trim()
            .toLowerCase();
        if (isNightlyVersion(version, branch) || isNightly) {
            setVersionBadgeText(badge, "nightly", { channel: "nightly" });
            return;
        }
        if (version) {
            setVersionBadgeText(badge, version.startsWith("v") ? version : `v${version}`, {
                channel: "stable",
            });
        }
    } catch {
        // ignore
    }
}

function createVersionDot() {
    const dot = document.createElement("span");
    Object.assign(dot.style, {
        position: "absolute",
        top: "2px",
        right: "-3px",
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: "#f44336",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.6)",
        display: "none",
        pointerEvents: "none",
    });
    dot.setAttribute("aria-hidden", "true");
    return dot;
}

function updateVersionDot(dot, visible) {
    if (!dot) return;
    dot.style.display = visible ? "block" : "none";
}

function resolveRuntimeBranch() {
    try {
        if (typeof window !== "undefined" && window?.MajoorAssetsManagerBranch) {
            return String(window.MajoorAssetsManagerBranch);
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        if (typeof process !== "undefined" && process?.env?.MAJOR_ASSETS_MANAGER_BRANCH) {
            return String(process.env.MAJOR_ASSETS_MANAGER_BRANCH);
        }
    } catch (e) {
        console.debug?.(e);
    }
    return "";
}

export function createHeaderView() {
    const branch = resolveRuntimeBranch();
    const isNightly = branch === "nightly";
    const version = isNightly ? "nightly" : "?";

    const header = document.createElement("div");
    header.classList.add("mjr-am-header");

    const headerRow = document.createElement("div");
    headerRow.classList.add("mjr-am-header-row");

    const headerLeft = document.createElement("div");
    headerLeft.classList.add("mjr-am-header-left");

    // Use PrimeIcons (ComfyUI ships them) for maximum compatibility across extension loaders.
    const headerIcon = document.createElement("i");
    headerIcon.className = "mjr-am-header-icon pi pi-folder";
    headerIcon.setAttribute("aria-hidden", "true");

    const headerTitle = document.createElement("div");
    headerTitle.classList.add("mjr-am-header-title");
    headerTitle.textContent = t("manager.title");

    // Version badge with link to Ko-fi
    const versionBadge = document.createElement("a");
    versionBadge.href = "https://ko-fi.com/majoorwaldi";
    versionBadge.target = "_blank";
    versionBadge.rel = "noopener noreferrer";
    versionBadge.className = "mjr-am-version-badge";
    versionBadge.style.position = "relative";
    versionBadge.dataset.mjrVersionChannel = isNightly ? "nightly" : "stable";
    versionBadge.title = t("tooltip.supportKofi");
    versionBadge.style.cssText = `
        font-size: 10px;
        opacity: 0.6;
        margin-left: 6px;
        padding: 2px 5px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.08);
        color: inherit;
        text-decoration: none;
        cursor: pointer;
        transition: opacity 0.2s, background 0.2s;
        vertical-align: middle;
    `;
    versionBadge.onmouseenter = () => {
        versionBadge.style.opacity = "1";
        versionBadge.style.background = "rgba(255, 255, 255, 0.15)";
    };
    versionBadge.onmouseleave = () => {
        versionBadge.style.opacity = "0.6";
        versionBadge.style.background = "rgba(255, 255, 255, 0.08)";
    };

    const versionLabel = document.createElement("span");
    versionLabel.className = VERSION_BADGE_LABEL_CLASS;
    versionLabel.textContent = isNightly ? "nightly" : `v${version}`;

    const versionDot = createVersionDot();
    versionBadge.appendChild(versionLabel);
    versionBadge.appendChild(versionDot);

    headerLeft.appendChild(headerIcon);
    headerLeft.appendChild(headerTitle);
    headerLeft.appendChild(versionBadge);

    const headerActions = document.createElement("div");
    headerActions.classList.add("mjr-am-header-actions");

    const headerTools = document.createElement("div");
    headerTools.classList.add("mjr-am-header-tools");

    const { tabs, tabButtons } = createTabsView();
    headerActions.appendChild(tabs);
    headerActions.appendChild(headerTools);

    const customMenuBtn = createIconButton("pi-folder-open", t("tooltip.browserFolders"));
    const filterBtn = createIconButton("pi-filter", t("label.filters"));
    const sortBtn = createIconButton("pi-sort", t("label.sort"));
    const collectionsBtn = createIconButton("pi-bookmark", t("label.collections"));
    const pinnedFoldersBtn = createIconButton("pi-folder", t("tooltip.pinnedFolders"));

    customMenuBtn.style.display = "none";
    headerTools.appendChild(customMenuBtn);

    // Floating Viewer toggle button — opens/closes the MFV overlay.
    const mfvBtn = createIconButton("pi-eye", t("tooltip.openMFV", "Open Floating Viewer"));
    setTooltipHint(mfvBtn, t("tooltip.openMFV", "Open Floating Viewer"), MFV_TOOLTIP_HINT);
    mfvBtn.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent(EVENTS.MFV_TOGGLE));
    });
    const _mfvVisibilityHandler = (e) => {
        const active = Boolean(e?.detail?.visible);
        mfvBtn.classList.toggle("mjr-mfv-btn-active", active);
        setTooltipHint(
            mfvBtn,
            active
                ? t("tooltip.closeMFV", "Close Floating Viewer")
                : t("tooltip.openMFV", "Open Floating Viewer"),
            MFV_TOOLTIP_HINT,
        );
        // Swap icon: pi-eye-slash when MFV is open, pi-eye when closed
        const icon = mfvBtn.querySelector("i");
        if (icon) icon.className = active ? "pi pi-eye-slash" : "pi pi-eye";
    };
    window.addEventListener(EVENTS.MFV_VISIBILITY_CHANGED, _mfvVisibilityHandler);
    headerTools.appendChild(mfvBtn);

    const messageBtn = createIconButton(
        "pi-info-circle",
        t("tooltip.openMessages", "Messages and updates"),
    );
    messageBtn.classList.add("mjr-message-btn");
    const messageBadge = document.createElement("span");
    messageBadge.className = "mjr-message-badge";
    messageBadge.style.display = "none";
    messageBadge.setAttribute("aria-hidden", "true");
    messageBtn.appendChild(messageBadge);
    headerTools.appendChild(messageBtn);

    headerRow.appendChild(headerLeft);
    headerRow.appendChild(headerActions);
    header.appendChild(headerRow);

    const applyDotState = (state) => {
        const stateChannel = String(state?.channel || "")
            .trim()
            .toLowerCase();
        const stateCurrent = String(state?.current || "")
            .trim()
            .toLowerCase();
        const stateLatest = String(state?.latest || "")
            .trim()
            .toLowerCase();
        if (stateChannel === "nightly" || stateCurrent === "nightly" || stateLatest === "nightly") {
            setVersionBadgeText(versionBadge, "nightly", { channel: "nightly" });
        }
        updateVersionDot(versionDot, Boolean(state?.available));
    };
    try {
        applyDotState(getStoredVersionUpdateState());
    } catch (e) {
        console.debug?.(e);
    }
    let versionUpdateListener = null;
    const dispose = () => {
        try {
            if (versionUpdateListener && typeof window !== "undefined") {
                window.removeEventListener(VERSION_UPDATE_EVENT, versionUpdateListener);
            }
        } catch (e) {
            console.debug?.(e);
        }
        versionUpdateListener = null;
        try {
            window.removeEventListener(EVENTS.MFV_VISIBILITY_CHANGED, _mfvVisibilityHandler);
        } catch (e) {
            console.debug?.(e);
        }
    };
    if (typeof window !== "undefined") {
        versionUpdateListener = (event) => {
            try {
                applyDotState(event?.detail);
            } catch (e) {
                console.debug?.(e);
            }
        };
        window.addEventListener(VERSION_UPDATE_EVENT, versionUpdateListener);
    }
    header._mjrVersionUpdateCleanup = dispose;

    applyExtensionMetadata(versionBadge, isNightly);
    void hydrateBackendVersionBadge(versionBadge, isNightly);

    return {
        header,
        headerActions,
        headerTools,
        tabs,
        tabButtons,
        customMenuBtn,
        filterBtn,
        sortBtn,
        collectionsBtn,
        pinnedFoldersBtn,
        mfvBtn,
        messageBtn,
        dispose,
    };
}
