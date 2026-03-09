import { get } from "../api/client.js";
import { ENDPOINTS } from "../api/endpoints.js";
import { comfyToast } from "./toast.js";
import { comfyAlert } from "./dialogs.js";
import { t } from "./i18n.js";
import { SettingsStore } from "./settings/SettingsStore.js";

export const VERSION_UPDATE_EVENT = "mjr:version-update-available";
const VERSION_UPDATE_STATE_KEY = "__MJR_VERSION_UPDATE_STATE__";
const LATEST_RELEASE_URL = "https://api.github.com/repos/MajoorWaldi/ComfyUI-Majoor-AssetsManager/releases/latest";
const NIGHTLY_RELEASE_URL = "https://api.github.com/repos/MajoorWaldi/ComfyUI-Majoor-AssetsManager/releases/tags/nightly";
const LAST_CHECK_KEY = "majoor_last_update_check";
const VERSION_TOAST_NOTICE_VERSION_KEY = "majoor_version_toast_notice_version";
const DB_RESET_NOTICE_VERSION_KEY = "majoor_db_reset_notice_version";
const AI_FEATURES_NOTICE_LOCAL_BUILD_KEY = "majoor_ai_features_notice_local_build";
const NIGHTLY_RELEASE_MARKER_KEY = "majoor_nightly_release_marker";
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

let _versionUpdateState = { available: false, timestamp: Date.now() };

function normalizeVersion(value) {
    if (!value) return "";
    return String(value).trim().replace(/^v/i, "");
}

/**
 * Check whether a version/branch should be treated as nightly/dev build.
 */
function isNightly(version, branch) {
    const v = String(version || "").trim().toLowerCase();
    const b = String(branch || "").trim().toLowerCase();
    const nightlyKeywords = ["nightly", "dev", "alpha", "experimental"];
    const hasNightlyKeyword = nightlyKeywords.some((kw) => v.includes(kw) || b.includes(kw));

    // Examples: 1.2.0+a1b2c3d, 6432abc, deadbeef...
    const hasCommitHash = v.includes("+") || (v.length > 10 && /^[a-f0-9]+$/i.test(v));

    return hasNightlyKeyword || hasCommitHash;
}

function parseVersionSegments(value) {
    return String(value || "")
        .split("-")[0]
        .split(".")
        .map((part) => {
            const num = parseInt(part, 10);
            return Number.isFinite(num) ? Math.max(0, num) : 0;
        });
}

function isNewerVersion(remote, local) {
    if (!remote || !local) return false;
    const remoteParts = parseVersionSegments(remote);
    const localParts = parseVersionSegments(local);
    const length = Math.max(remoteParts.length, localParts.length);
    for (let i = 0; i < length; i += 1) {
        const remoteValue = Number.isFinite(remoteParts[i]) ? remoteParts[i] : 0;
        const localValue = Number.isFinite(localParts[i]) ? localParts[i] : 0;
        if (remoteValue > localValue) return true;
        if (remoteValue < localValue) return false;
    }
    return false;
}

function createFetchTimeoutSignal(timeoutMs) {
    const ms = Math.max(1, Number(timeoutMs) || 10000);
    try {
        if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
            return { signal: AbortSignal.timeout(ms), cleanup: () => {} };
        }
    } catch (e) { console.debug?.(e); }
    try {
        if (typeof AbortController !== "undefined") {
            const controller = new AbortController();
            const timer = setTimeout(() => {
                try {
                    controller.abort();
                } catch (e) { console.debug?.(e); }
            }, ms);
            return {
                signal: controller.signal,
                cleanup: () => {
                    try {
                        clearTimeout(timer);
                    } catch (e) { console.debug?.(e); }
                },
            };
        }
    } catch (e) { console.debug?.(e); }
    return { signal: undefined, cleanup: () => {} };
}

async function fetchReleasePayload(url) {
    const { signal, cleanup } = createFetchTimeoutSignal(10_000);
    const response = await fetch(url, {
        cache: "no-cache",
        signal,
        headers: {
            Accept: "application/vnd.github+json",
        },
    }).finally(() => cleanup());
    if (!response.ok) {
        throw new Error(`GitHub release request failed (${response.status})`);
    }
    const payload = await response.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
        throw new Error("GitHub release returned invalid payload");
    }
    return payload;
}

async function fetchLatestReleaseVersion() {
    const payload = await fetchReleasePayload(LATEST_RELEASE_URL);
    return normalizeVersion(payload.tag_name);
}

async function fetchNightlyReleaseMarker() {
    const payload = await fetchReleasePayload(NIGHTLY_RELEASE_URL);
    const marker = String(
        payload.published_at
        || payload.created_at
        || payload.updated_at
        || payload.target_commitish
        || payload.tag_name
        || ""
    ).trim();
    return marker;
}

function emitVersionUpdateState(state) {
    _versionUpdateState = { ...state, timestamp: Date.now() };
    const w = typeof window !== "undefined" ? window : null;
    if (w) {
        try {
            w[VERSION_UPDATE_STATE_KEY] = _versionUpdateState;
        } catch (e) { console.debug?.(e); }
        try {
            w.dispatchEvent(new CustomEvent(VERSION_UPDATE_EVENT, { detail: _versionUpdateState }));
        } catch (e) { console.debug?.(e); }
    }
}

export function getStoredVersionUpdateState() {
    return _versionUpdateState;
}

function buildLocalNoticeKey(localVersion, branch) {
    const v = String(localVersion || "unknown").trim().toLowerCase();
    const b = String(branch || "unknown").trim().toLowerCase();
    return `${v}::${b}`;
}

function showAiFeaturesNoticeOnce(localVersion, branch) {
    // Disabled: No longer show AI features work-in-progress popup
    return;
}

export async function checkMajoorVersion({ force = false } = {}) {
    if (typeof window === "undefined") {
        return null;
    }

    let localVersion = "";
    let branch = "";
    try {
        const result = await get(ENDPOINTS.VERSION);
        if (!result?.ok) {
            emitVersionUpdateState({ available: false });
            return null;
        }
        localVersion = normalizeVersion(result.data?.version);
        branch = String(result.data?.branch || "").trim().toLowerCase();
    } catch {
        emitVersionUpdateState({ available: false });
        return null;
    }

    showAiFeaturesNoticeOnce(localVersion, branch);
    let skipRemoteCheck = false;
    try {
        if (!force) {
            const lastCheck = Number(SettingsStore.get(LAST_CHECK_KEY) || 0);
            if (Number.isFinite(lastCheck) && Date.now() - lastCheck < CHECK_INTERVAL_MS) {
                skipRemoteCheck = true;
            }
        }
    } catch {
        // localStorage might be disabled; continue without caching
    }

    if (!localVersion || isNightly(localVersion, branch)) {
        if (skipRemoteCheck) {
            emitVersionUpdateState({ available: false });
            return null;
        }

        let nightlyMarker = "";
        try {
            nightlyMarker = await fetchNightlyReleaseMarker();
            const previousMarker = String(SettingsStore.get(NIGHTLY_RELEASE_MARKER_KEY) || "").trim();
            const updateAvailable = Boolean(previousMarker && nightlyMarker && previousMarker !== nightlyMarker);

            emitVersionUpdateState({
                available: updateAvailable,
                current: localVersion || "nightly",
                latest: "nightly",
                channel: "nightly",
            });

            if (updateAvailable) {
                comfyToast(
                    {
                        summary: t("msg.nightlyUpdateTitle", "Majoor Assets Manager"),
                        detail: t(
                            "msg.nightlyUpdateDetail",
                            "A newer nightly build is available: https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/releases/tag/nightly"
                        ),
                    },
                    "info",
                    0
                );
            }

            if (nightlyMarker) {
                try {
                    SettingsStore.set(NIGHTLY_RELEASE_MARKER_KEY, nightlyMarker);
                } catch (e) { console.debug?.(e); }
            }
        } catch (error) {
            console.warn("Unable to check Majoor nightly updates:", error);
            emitVersionUpdateState({ available: false });
        } finally {
            try {
                SettingsStore.set(LAST_CHECK_KEY, String(Date.now()));
            } catch {
                // ignore
            }
        }
        return null;
    }

    if (skipRemoteCheck) {
        return null;
    }

    let remoteVersion = "";
    try {
        remoteVersion = await fetchLatestReleaseVersion();
    } catch (error) {
        console.warn("Unable to check Majoor updates:", error);
        emitVersionUpdateState({ available: false });
        return null;
    } finally {
        try {
            SettingsStore.set(LAST_CHECK_KEY, String(Date.now()));
        } catch {
            // ignore
        }
    }

    if (!remoteVersion || !isNewerVersion(remoteVersion, localVersion)) {
        emitVersionUpdateState({ available: false });
        return null;
    }

    emitVersionUpdateState({
        available: true,
        current: localVersion,
        latest: remoteVersion,
    });

    try {
        const toastShownFor = String(SettingsStore.get(VERSION_TOAST_NOTICE_VERSION_KEY) || "").trim();
        if (toastShownFor !== remoteVersion) {
            comfyToast(
                {
                    summary: t("msg.newVersionTitle", "Majoor Assets Manager"),
                    detail: t("msg.newVersionDetail", "A new version is available: {latest} (Current: {current})", {
                        latest: remoteVersion,
                        current: localVersion,
                    }),
                },
                "info",
                0
            );
            try {
                SettingsStore.set(VERSION_TOAST_NOTICE_VERSION_KEY, remoteVersion);
            } catch (e) { console.debug?.(e); }
        }
    } catch (e) { console.debug?.(e); }

    try {
        const alreadyShownFor = String(SettingsStore.get(DB_RESET_NOTICE_VERSION_KEY) || "").trim();
        if (alreadyShownFor !== remoteVersion) {
            setTimeout(() => {
                comfyAlert(
                    t(
                        "msg.dbResetNoticeDetail",
                        "Majoor Update Notice:\n\nTo avoid database errors with this new version, please delete your existing index. Click the 'Delete DB' button in the Index Status panel to reset it."
                    ),
                    "Majoor",
                    { native: true }
                );
            }, 1000);
            try {
                SettingsStore.set(DB_RESET_NOTICE_VERSION_KEY, remoteVersion);
            } catch (e) { console.debug?.(e); }
        }
    } catch (e) { console.debug?.(e); }


    return { current: localVersion, latest: remoteVersion };
}

