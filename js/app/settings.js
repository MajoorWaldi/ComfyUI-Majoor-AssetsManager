/**
 * Majoor settings integration with ComfyUI settings panel.
 */

import { APP_CONFIG, APP_DEFAULTS } from "./config.js";
import { getSecuritySettings, setSecuritySettings, setProbeBackendMode } from "../api/client.js";
import { safeDispatchCustomEvent } from "../utils/events.js";

import { SETTINGS_KEY } from "./settingsStore.js";
const SETTINGS_PREFIX = "Majoor";
const SETTINGS_CATEGORY = "Majoor Assets Manager";
const SETTINGS_REG_FLAG = "__mjrSettingsRegistered";

const DEFAULT_SETTINGS = {
    debug: {
        safeCall: APP_DEFAULTS.DEBUG_SAFE_CALL,
        safeListeners: APP_DEFAULTS.DEBUG_SAFE_LISTENERS,
        viewer: APP_DEFAULTS.DEBUG_VIEWER,
    },
    grid: {
        pageSize: APP_DEFAULTS.DEFAULT_PAGE_SIZE,
        minSize: APP_DEFAULTS.GRID_MIN_SIZE,
        gap: APP_DEFAULTS.GRID_GAP,
    },
    infiniteScroll: {
        enabled: APP_DEFAULTS.INFINITE_SCROLL_ENABLED,
        rootMargin: APP_DEFAULTS.INFINITE_SCROLL_ROOT_MARGIN,
        threshold: APP_DEFAULTS.INFINITE_SCROLL_THRESHOLD,
        bottomGapPx: APP_DEFAULTS.BOTTOM_GAP_PX,
    },
    siblings: {
        hidePngSiblings: true,
    },
    autoScan: {
        enabled: APP_DEFAULTS.AUTO_SCAN_ENABLED,
        onStartup: APP_DEFAULTS.AUTO_SCAN_ON_STARTUP,
    },
    status: {
        pollInterval: APP_DEFAULTS.STATUS_POLL_INTERVAL,
    },
    viewer: {
        allowPanAtZoom1: APP_DEFAULTS.VIEWER_ALLOW_PAN_AT_ZOOM_1,
        videoGradeThrottleFps: APP_DEFAULTS.VIEWER_VIDEO_GRADE_THROTTLE_FPS,
        scopesFps: APP_DEFAULTS.VIEWER_SCOPES_FPS,
        metaTtlMs: APP_DEFAULTS.VIEWER_META_TTL_MS,
        metaMaxEntries: APP_DEFAULTS.VIEWER_META_MAX_ENTRIES,
    },
    rtHydrate: {
        concurrency: APP_DEFAULTS.RT_HYDRATE_CONCURRENCY,
        queueMax: APP_DEFAULTS.RT_HYDRATE_QUEUE_MAX,
        seenMax: APP_DEFAULTS.RT_HYDRATE_SEEN_MAX,
        pruneBudget: APP_DEFAULTS.RT_HYDRATE_PRUNE_BUDGET,
        seenTtlMs: APP_DEFAULTS.RT_HYDRATE_SEEN_TTL_MS,
    },
    observability: {
        enabled: false,
    },
    sidebar: {
        position: "right",
    },
    probeBackend: {
        mode: "auto",
    },
    ratingTagsSync: {
        enabled: false,
    },
    cache: {
        tagsTTLms: 30_000,
    },
    workflowMinimap: {
        nodeColors: true,
        showLinks: true,
        showGroups: true,
        renderBypassState: true,
        renderErrorState: true,
        showViewport: true,
    },
    security: {
        safeMode: false,
        allowWrite: true,
        allowDelete: true,
        allowRename: true,
        allowOpenInFolder: true,
        allowResetIndex: false,
    },
};

const _safeBool = (value, fallback) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["1", "true", "yes", "on"].includes(normalized)) return true;
        if (["0", "false", "no", "off"].includes(normalized)) return false;
    }
    return !!fallback;
};

const _safeNum = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number(fallback);
};

const _safeOneOf = (value, allowed, fallback) => {
    const candidate = typeof value === "string" ? value.trim() : String(value ?? "");
    return allowed.includes(candidate) ? candidate : fallback;
};

const deepMerge = (base, next) => {
    const output = { ...base };
    if (!next || typeof next !== "object") {
        return output;
    }
    Object.keys(next).forEach((key) => {
        const value = next[key];
        if (value && typeof value === "object" && !Array.isArray(value)) {
            output[key] = deepMerge(base[key] || {}, value);
        } else if (value !== undefined) {
            output[key] = value;
        }
    });
    return output;
};

export const loadMajoorSettings = () => {
    if (typeof localStorage === "undefined") return { ...DEFAULT_SETTINGS };
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return { ...DEFAULT_SETTINGS };
        const parsed = JSON.parse(raw);
        const allowed = new Set([
            "debug",
            "grid",
            "infiniteScroll",
            "siblings",
            "autoScan",
            "status",
            "viewer",
            "rtHydrate",
            "observability",
            "sidebar",
            "probeBackend",
            "ratingTagsSync",
            "cache",
            "workflowMinimap",
            "security",
        ]);
        const sanitized = {};
        if (parsed && typeof parsed === "object") {
            for (const [key, value] of Object.entries(parsed)) {
                if (allowed.has(key)) sanitized[key] = value;
            }
        }
        return deepMerge(DEFAULT_SETTINGS, sanitized);
    } catch (error) {
        console.warn("[Majoor] settings load failed, using defaults", error);
        return { ...DEFAULT_SETTINGS };
    }
};

export const saveMajoorSettings = (settings) => {
    if (typeof localStorage === "undefined") return;
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.warn("[Majoor] settings save failed", error);
        try {
            const now = Date.now();
            const last = Number(window?._mjrSettingsSaveFailAt || 0) || 0;
            if (now - last > 30_000) {
                window._mjrSettingsSaveFailAt = now;
                import("./dialogs.js")
                    .then(({ comfyAlert }) => comfyAlert("Majoor: Failed to save settings (browser storage full or blocked)."))
                    .catch(() => {});
            }
        } catch {}
        try {
            safeDispatchCustomEvent("mjr-settings-save-failed", { error: String(error?.message || error || "") }, { warnPrefix: "[Majoor]" });
        } catch {}
    }
};

const applySettingsToConfig = (settings) => {
    const maxPage = Number(APP_DEFAULTS.MAX_PAGE_SIZE) || 2000;
    const pageSize = Math.max(
        50,
        Math.min(maxPage, Number(settings.grid?.pageSize) || APP_DEFAULTS.DEFAULT_PAGE_SIZE)
    );
    APP_CONFIG.DEFAULT_PAGE_SIZE = pageSize;
    APP_CONFIG.AUTO_SCAN_ENABLED = !!settings.autoScan?.enabled;
    APP_CONFIG.AUTO_SCAN_ON_STARTUP = !!settings.autoScan?.onStartup;
    APP_CONFIG.STATUS_POLL_INTERVAL = Math.max(1000, Number(settings.status?.pollInterval) || APP_DEFAULTS.STATUS_POLL_INTERVAL);

    APP_CONFIG.DEBUG_SAFE_CALL = !!settings.debug?.safeCall;
    APP_CONFIG.DEBUG_SAFE_LISTENERS = !!settings.debug?.safeListeners;
    APP_CONFIG.DEBUG_VIEWER = !!settings.debug?.viewer;

    APP_CONFIG.GRID_MIN_SIZE = Math.max(60, Math.min(600, Math.round(_safeNum(settings.grid?.minSize, APP_DEFAULTS.GRID_MIN_SIZE))));
    APP_CONFIG.GRID_GAP = Math.max(0, Math.min(40, Math.round(_safeNum(settings.grid?.gap, APP_DEFAULTS.GRID_GAP))));

    APP_CONFIG.INFINITE_SCROLL_ENABLED = !!settings.infiniteScroll?.enabled;
    APP_CONFIG.INFINITE_SCROLL_ROOT_MARGIN = String(settings.infiniteScroll?.rootMargin || APP_DEFAULTS.INFINITE_SCROLL_ROOT_MARGIN);
    APP_CONFIG.INFINITE_SCROLL_THRESHOLD = Math.max(0, Math.min(1, _safeNum(settings.infiniteScroll?.threshold, APP_DEFAULTS.INFINITE_SCROLL_THRESHOLD)));
    APP_CONFIG.BOTTOM_GAP_PX = Math.max(0, Math.min(5000, Math.round(_safeNum(settings.infiniteScroll?.bottomGapPx, APP_DEFAULTS.BOTTOM_GAP_PX))));

    APP_CONFIG.VIEWER_ALLOW_PAN_AT_ZOOM_1 = !!settings.viewer?.allowPanAtZoom1;
    APP_CONFIG.VIEWER_VIDEO_GRADE_THROTTLE_FPS = Math.max(1, Math.min(60, Math.round(_safeNum(settings.viewer?.videoGradeThrottleFps, APP_DEFAULTS.VIEWER_VIDEO_GRADE_THROTTLE_FPS))));
    APP_CONFIG.VIEWER_SCOPES_FPS = Math.max(1, Math.min(60, Math.round(_safeNum(settings.viewer?.scopesFps, APP_DEFAULTS.VIEWER_SCOPES_FPS))));
    APP_CONFIG.VIEWER_META_TTL_MS = Math.max(1000, Math.min(10 * 60_000, Math.round(_safeNum(settings.viewer?.metaTtlMs, APP_DEFAULTS.VIEWER_META_TTL_MS))));
    APP_CONFIG.VIEWER_META_MAX_ENTRIES = Math.max(50, Math.min(5000, Math.round(_safeNum(settings.viewer?.metaMaxEntries, APP_DEFAULTS.VIEWER_META_MAX_ENTRIES))));

    APP_CONFIG.RT_HYDRATE_CONCURRENCY = Math.max(1, Math.min(16, Math.round(_safeNum(settings.rtHydrate?.concurrency, APP_DEFAULTS.RT_HYDRATE_CONCURRENCY))));
    APP_CONFIG.RT_HYDRATE_QUEUE_MAX = Math.max(10, Math.min(5000, Math.round(_safeNum(settings.rtHydrate?.queueMax, APP_DEFAULTS.RT_HYDRATE_QUEUE_MAX))));
    APP_CONFIG.RT_HYDRATE_SEEN_MAX = Math.max(1000, Math.min(200_000, Math.round(_safeNum(settings.rtHydrate?.seenMax, APP_DEFAULTS.RT_HYDRATE_SEEN_MAX))));
    APP_CONFIG.RT_HYDRATE_PRUNE_BUDGET = Math.max(10, Math.min(10_000, Math.round(_safeNum(settings.rtHydrate?.pruneBudget, APP_DEFAULTS.RT_HYDRATE_PRUNE_BUDGET))));
    APP_CONFIG.RT_HYDRATE_SEEN_TTL_MS = Math.max(5_000, Math.min(6 * 60 * 60_000, Math.round(_safeNum(settings.rtHydrate?.seenTtlMs, APP_DEFAULTS.RT_HYDRATE_SEEN_TTL_MS))));
};

export async function syncBackendSecuritySettings() {
    try {
        const res = await getSecuritySettings();
        if (!res?.ok) return;
        const prefs = res.data?.prefs;
        if (!prefs || typeof prefs !== "object") return;

        const settings = loadMajoorSettings();
        settings.security = settings.security || {};
        settings.security.safeMode = _safeBool(prefs.safe_mode, settings.security.safeMode);
        settings.security.allowWrite = _safeBool(prefs.allow_write, settings.security.allowWrite);
        settings.security.allowDelete = _safeBool(prefs.allow_delete, settings.security.allowDelete);
        settings.security.allowRename = _safeBool(prefs.allow_rename, settings.security.allowRename);
        settings.security.allowOpenInFolder = _safeBool(prefs.allow_open_in_folder, settings.security.allowOpenInFolder);
        settings.security.allowResetIndex = _safeBool(prefs.allow_reset_index, settings.security.allowResetIndex);
        saveMajoorSettings(settings);
        applySettingsToConfig(settings);
        safeDispatchCustomEvent("mjr-settings-changed", { key: "security" }, { warnPrefix: "[Majoor]" });
    } catch (error) {
        console.warn("[Majoor] failed to sync backend security settings", error);
    }
}

export const getComfySettingsDefinitions = () => {
    const defs = [];
    const safeUpdate = (fn) => {
        try {
            const settings = loadMajoorSettings();
            fn(settings);
            saveMajoorSettings(settings);
            applySettingsToConfig(settings);
            safeDispatchCustomEvent("mjr-settings-changed", { key: "*" }, { warnPrefix: "[Majoor]" });
        } catch (error) {
            console.warn("[Majoor] comfy settings update failed", error);
        }
    };

    const cat = (section, label) => [SETTINGS_CATEGORY, section, label];

    defs.push({
        id: `${SETTINGS_PREFIX}.Grid.MinSize`,
        category: cat("Affichage", "Taille des vignettes"),
        name: "Majoor: Taille des vignettes (px)",
        tooltip: "Taille minimale des vignettes dans la grille. Peut nécessiter de réouvrir le panneau.",
        type: "number",
        defaultValue: DEFAULT_SETTINGS.grid.minSize,
        attrs: { min: 60, max: 600, step: 10 },
        onChange: (value) => {
            safeUpdate((settings) => {
                settings.grid = settings.grid || {};
                settings.grid.minSize = Math.max(60, Math.min(600, Math.round(_safeNum(value, DEFAULT_SETTINGS.grid.minSize))));
            });
        },
    });

    defs.push({
        id: `${SETTINGS_PREFIX}.Grid.Gap`,
        category: cat("Affichage", "Espacement"),
        name: "Majoor: Espacement (px)",
        tooltip: "Espace entre les vignettes. Peut nécessiter de réouvrir le panneau.",
        type: "number",
        defaultValue: DEFAULT_SETTINGS.grid.gap,
        attrs: { min: 0, max: 40, step: 1 },
        onChange: (value) => {
            safeUpdate((settings) => {
                settings.grid = settings.grid || {};
                settings.grid.gap = Math.max(0, Math.min(40, Math.round(_safeNum(value, DEFAULT_SETTINGS.grid.gap))));
            });
        },
    });

    defs.push({
        id: `${SETTINGS_PREFIX}.Sidebar.Position`,
        category: cat("Affichage", "Position sidebar"),
        name: "Majoor: Position de la sidebar",
        tooltip: "Afficher la sidebar des détails à gauche ou à droite. Recharger la page pour appliquer.",
        type: "combo",
        defaultValue: DEFAULT_SETTINGS.sidebar.position,
        options: ["left", "right"],
        onChange: (value) => {
            safeUpdate((settings) => {
                settings.sidebar = settings.sidebar || {};
                settings.sidebar.position = _safeOneOf(value, ["left", "right"], DEFAULT_SETTINGS.sidebar.position);
            });
        },
    });

    defs.push({
        id: `${SETTINGS_PREFIX}.General.HideSiblings`,
        category: cat("Affichage", "Masquer aperçus PNG"),
        name: "Majoor: Masquer les aperçus PNG des vidéos",
        tooltip: "Si une vidéo a un fichier .png correspondant, masquer le .png de la grille.",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.siblings.hidePngSiblings,
        onChange: (value) => {
            safeUpdate((settings) => {
                settings.siblings = settings.siblings || {};
                settings.siblings.hidePngSiblings = _safeBool(value, DEFAULT_SETTINGS.siblings.hidePngSiblings);
            });
        },
    });

    defs.push({
        id: `${SETTINGS_PREFIX}.Grid.PageSize`,
        category: cat("Navigation", "Fichiers par page"),
        name: "Majoor: Fichiers par page",
        tooltip: "Nombre de fichiers chargés par requête. Plus = plus rapide mais plus de mémoire.",
        type: "number",
        defaultValue: DEFAULT_SETTINGS.grid.pageSize,
        attrs: { min: 50, max: Number(APP_DEFAULTS.MAX_PAGE_SIZE) || 2000, step: 50 },
        onChange: (value) => {
            safeUpdate((settings) => {
                const maxPage = Number(APP_DEFAULTS.MAX_PAGE_SIZE) || 2000;
                const rounded = Math.round(_safeNum(value, DEFAULT_SETTINGS.grid.pageSize));
                settings.grid = settings.grid || {};
                settings.grid.pageSize = Math.max(50, Math.min(maxPage, rounded));
            });
        },
    });

    defs.push({
        id: `${SETTINGS_PREFIX}.InfiniteScroll.Enabled`,
        category: cat("Navigation", "Défilement infini"),
        name: "Majoor: Défilement infini",
        tooltip: "Charger automatiquement plus de fichiers en scrollant. Désactiver si performances lentes.",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.infiniteScroll.enabled,
        onChange: (value) => {
            safeUpdate((settings) => {
                settings.infiniteScroll = settings.infiniteScroll || {};
                settings.infiniteScroll.enabled = _safeBool(value, DEFAULT_SETTINGS.infiniteScroll.enabled);
            });
        },
    });

    defs.push({
        id: `${SETTINGS_PREFIX}.Viewer.AllowPanAtZoom1`,
        category: cat("Navigation", "Pan sans zoom"),
        name: "Majoor: Autoriser le pan sans zoom",
        tooltip: "Permet de déplacer l'image même sans zoom. Désactivé par défaut pour plus de stabilité.",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.viewer.allowPanAtZoom1,
        onChange: (value) => {
            safeUpdate((settings) => {
                settings.viewer = settings.viewer || {};
                settings.viewer.allowPanAtZoom1 = _safeBool(value, DEFAULT_SETTINGS.viewer.allowPanAtZoom1);
            });
        },
    });

    defs.push({
        id: `${SETTINGS_PREFIX}.AutoScan.Enabled`,
        category: cat("Scan", "Auto-scan à l'ouverture"),
        name: "Majoor: Auto-scan à l'ouverture",
        tooltip: "Scanner automatiquement les dossiers à l'ouverture du panneau.",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.autoScan.enabled,
        onChange: (value) => {
            safeUpdate((settings) => {
                settings.autoScan = settings.autoScan || {};
                settings.autoScan.enabled = _safeBool(value, DEFAULT_SETTINGS.autoScan.enabled);
            });
        },
    });

    defs.push({
        id: `${SETTINGS_PREFIX}.AutoScan.OnStartup`,
        category: cat("Scan", "Auto-scan au démarrage"),
        name: "Majoor: Auto-scan au démarrage",
        tooltip: "Lancer un scan en arrière-plan dès le chargement de ComfyUI.",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.autoScan.onStartup,
        onChange: (value) => {
            safeUpdate((settings) => {
                settings.autoScan = settings.autoScan || {};
                settings.autoScan.onStartup = _safeBool(value, DEFAULT_SETTINGS.autoScan.onStartup);
            });
        },
    });

    defs.push({
        id: `${SETTINGS_PREFIX}.RatingTagsSync.Enabled`,
        category: cat("Scan", "Sync rating/tags vers fichiers"),
        name: "Majoor: Synchroniser rating/tags vers fichiers",
        tooltip: "Écrire les notes et tags dans les métadonnées des fichiers (ExifTool).",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.ratingTagsSync.enabled,
        onChange: (value) => {
            safeUpdate((settings) => {
                settings.ratingTagsSync = settings.ratingTagsSync || {};
                settings.ratingTagsSync.enabled = _safeBool(value, DEFAULT_SETTINGS.ratingTagsSync.enabled);
            });
        },
    });

    defs.push({
        id: `${SETTINGS_PREFIX}.Observability.Enabled`,
        category: cat("Debug", "Observabilité"),
        name: "Majoor: Activer logs détaillés",
        tooltip: "Active les logs détaillés côté backend pour le debugging. Peut impacter les performances.",
        type: "boolean",
        defaultValue: DEFAULT_SETTINGS.observability.enabled,
        onChange: (value) => {
            safeUpdate((settings) => {
                settings.observability = settings.observability || {};
                settings.observability.enabled = _safeBool(value, DEFAULT_SETTINGS.observability.enabled);
            });
        },
    });

    defs.push({
        id: `${SETTINGS_PREFIX}.ProbeBackend.Mode`,
        category: cat("Outils", "Backend métadonnées"),
        name: "Majoor: Backend métadonnées",
        tooltip: "Choisir l'outil pour extraire les métadonnées des fichiers. 'auto' détecte automatiquement le meilleur outil disponible.",
        type: "combo",
        defaultValue: DEFAULT_SETTINGS.probeBackend.mode,
        options: ["auto", "exiftool", "ffprobe", "both"],
        onChange: (value) => {
            const mode = _safeOneOf(value, ["auto", "exiftool", "ffprobe", "both"], DEFAULT_SETTINGS.probeBackend.mode);
            safeUpdate((settings) => {
                settings.probeBackend = settings.probeBackend || {};
                settings.probeBackend.mode = mode;
            });
            try {
                setProbeBackendMode(mode).catch(() => {});
            } catch {}
        },
    });

    const pushMinimapToggle = (idKey, stateKey, label, tooltip) => {
        defs.push({
            id: `${SETTINGS_PREFIX}.WorkflowMinimap.${idKey}`,
            category: cat("Viewer", `Minimap - ${label}`),
            name: `Majoor: Minimap - ${label}`,
            tooltip,
            type: "boolean",
            defaultValue: DEFAULT_SETTINGS.workflowMinimap?.[stateKey],
            onChange: (value) => {
                safeUpdate((settings) => {
                    settings.workflowMinimap = settings.workflowMinimap || {};
                    settings.workflowMinimap[stateKey] = _safeBool(value, DEFAULT_SETTINGS.workflowMinimap?.[stateKey]);
                });
            },
        });
    };

    pushMinimapToggle("NodeColors", "nodeColors", "Couleurs des nodes", "Afficher les couleurs des nodes dans la minimap.");
    pushMinimapToggle("ShowLinks", "showLinks", "Liens", "Afficher les connexions entre nodes dans la minimap.");
    pushMinimapToggle("ShowGroups", "showGroups", "Groupes", "Afficher les groupes de nodes dans la minimap.");
    pushMinimapToggle("RenderBypassState", "renderBypassState", "État bypass", "Montrer l'état bypass des nodes dans la minimap.");
    pushMinimapToggle("RenderErrorState", "renderErrorState", "État erreur", "Montrer les erreurs des nodes dans la minimap.");
    pushMinimapToggle("ShowViewport", "showViewport", "Vue active", "Montrer la zone visible du workflow dans la minimap.");

    const pushSecurityToggle = (key, label, tooltip) => {
        defs.push({
            id: `${SETTINGS_PREFIX}.Security.${key}`,
            category: cat("Sécurité", label),
            name: `Majoor: ${label}`,
            tooltip,
            type: "boolean",
            defaultValue: !!DEFAULT_SETTINGS.security?.[key],
            onChange: (value) => {
                const nextVal = _safeBool(value, DEFAULT_SETTINGS.security?.[key]);
                safeUpdate((settings) => {
                    settings.security = settings.security || {};
                    settings.security[key] = nextVal;
                });
                try {
                    const local = loadMajoorSettings();
                    const sec = local.security || {};
                    setSecuritySettings({
                        safe_mode: _safeBool(sec.safeMode, false),
                        allow_write: _safeBool(sec.allowWrite, true),
                        allow_delete: _safeBool(sec.allowDelete, true),
                        allow_rename: _safeBool(sec.allowRename, true),
                        allow_open_in_folder: _safeBool(sec.allowOpenInFolder, true),
                        allow_reset_index: _safeBool(sec.allowResetIndex, false),
                    })
                        .then((res) => {
                            if (res?.ok && res.data?.prefs) {
                                syncBackendSecuritySettings();
                            } else if (res && res.ok === false) {
                                console.warn("[Majoor] backend security settings update failed", res.error || res);
                            }
                        })
                        .catch(() => {});
                } catch {}
            },
        });
    };

    pushSecurityToggle("safeMode", "Mode sécurisé", "Quand activé, les écritures rating/tags sont bloquées sauf autorisation explicite.");
    pushSecurityToggle("allowWrite", "Autoriser écriture rating/tags", "Autorise l'écriture des notes et tags.");
    pushSecurityToggle("allowDelete", "Autoriser suppression", "Active la suppression de fichiers.");
    pushSecurityToggle("allowRename", "Autoriser renommage", "Active le renommage de fichiers.");
    pushSecurityToggle("allowOpenInFolder", "Autoriser ouvrir dans dossier", "Active l'ouverture dans le dossier.");
    pushSecurityToggle("allowResetIndex", "Autoriser reset index", "Reset le cache d'index (scan journal + metadata cache) et relance un scan complet.");

    return defs;
};

export const registerMajoorSettings = (app, onApplied) => {
    const settings = loadMajoorSettings();
    applySettingsToConfig(settings);

    const tryRegister = () => {
        const settingsApi = app?.ui?.settings;
        const addSetting = settingsApi?.addSetting;
        if (!settingsApi || typeof addSetting !== "function") {
            return false;
        }

        try {
            if (settingsApi[SETTINGS_REG_FLAG]) {
                return true;
            }
        } catch {}

        let supportsCategory = true;
        const safeAddSetting = (payload) => {
            if (!payload || typeof payload !== "object") return;
            try {
                addSetting(payload);
                return;
            } catch (err) {}
            try {
                const { category: _cat, ...rest } = payload;
                supportsCategory = false;
                addSetting(rest);
            } catch {}
        };

        const notifyApplied = (key) => {
            if (typeof onApplied === "function") {
                onApplied(settings, key);
            }
            safeDispatchCustomEvent("mjr-settings-changed", { key }, { warnPrefix: "[Majoor]" });
        };

        const cat = (section, label) => [SETTINGS_CATEGORY, section, label];

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Grid.MinSize`,
            category: cat("Affichage", "Taille des vignettes"),
            name: "Majoor: Taille des vignettes (px)",
            tooltip: "Taille minimale des vignettes. Peut nécessiter de réouvrir le panneau.",
            type: "number",
            defaultValue: settings.grid.minSize,
            attrs: { min: 60, max: 600, step: 10 },
            onChange: (value) => {
                settings.grid.minSize = Math.max(60, Math.min(600, Math.round(Number(value) || DEFAULT_SETTINGS.grid.minSize)));
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("grid.minSize");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Grid.Gap`,
            category: cat("Affichage", "Espacement"),
            name: "Majoor: Espacement (px)",
            tooltip: "Espace entre les vignettes.",
            type: "number",
            defaultValue: settings.grid.gap,
            attrs: { min: 0, max: 40, step: 1 },
            onChange: (value) => {
                settings.grid.gap = Math.max(0, Math.min(40, Math.round(Number(value) || DEFAULT_SETTINGS.grid.gap)));
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("grid.gap");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Sidebar.Position`,
            category: cat("Affichage", "Position sidebar"),
            name: "Majoor: Position sidebar",
            tooltip: "Afficher la sidebar à gauche ou à droite. Recharger la page pour appliquer.",
            type: "combo",
            defaultValue: settings.sidebar?.position || "right",
            options: ["left", "right"],
            onChange: (value) => {
                settings.sidebar = settings.sidebar || {};
                settings.sidebar.position = value === "left" ? "left" : "right";
                saveMajoorSettings(settings);
                notifyApplied("sidebar.position");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.General.HideSiblings`,
            category: cat("Affichage", "Masquer aperçus PNG"),
            name: "Majoor: Masquer aperçus PNG des vidéos",
            tooltip: "Si une vidéo a un fichier .png correspondant, masquer le .png de la grille.",
            type: "boolean",
            defaultValue: !!settings.siblings?.hidePngSiblings,
            onChange: (value) => {
                settings.siblings = settings.siblings || {};
                settings.siblings.hidePngSiblings = !!value;
                saveMajoorSettings(settings);
                notifyApplied("siblings.hidePngSiblings");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Grid.PageSize`,
            category: cat("Navigation", "Fichiers par page"),
            name: "Majoor: Fichiers par page",
            tooltip: "Nombre de fichiers chargés par requête. Plus = plus rapide mais plus de mémoire.",
            type: "number",
            defaultValue: settings.grid.pageSize,
            attrs: { min: 50, max: Number(APP_CONFIG.MAX_PAGE_SIZE) || 2000, step: 50 },
            onChange: (value) => {
                const maxPage = Number(APP_CONFIG.MAX_PAGE_SIZE) || 2000;
                settings.grid.pageSize = Math.max(50, Math.min(maxPage, Number(value) || DEFAULT_SETTINGS.grid.pageSize));
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("grid.pageSize");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.InfiniteScroll.Enabled`,
            category: cat("Navigation", "Défilement infini"),
            name: "Majoor: Défilement infini",
            tooltip: "Charger automatiquement plus de fichiers en scrollant.",
            type: "boolean",
            defaultValue: !!settings.infiniteScroll?.enabled,
            onChange: (value) => {
                settings.infiniteScroll = settings.infiniteScroll || {};
                settings.infiniteScroll.enabled = !!value;
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("infiniteScroll.enabled");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Viewer.AllowPanAtZoom1`,
            category: cat("Navigation", "Pan sans zoom"),
            name: "Majoor: Pan sans zoom",
            tooltip: "Permet de déplacer l'image même sans zoom.",
            type: "boolean",
            defaultValue: !!settings.viewer?.allowPanAtZoom1,
            onChange: (value) => {
                settings.viewer = settings.viewer || {};
                settings.viewer.allowPanAtZoom1 = !!value;
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("viewer.allowPanAtZoom1");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.AutoScan.Enabled`,
            category: cat("Scan", "Auto-scan à l'ouverture"),
            name: "Majoor: Auto-scan à l'ouverture",
            tooltip: "Scanner automatiquement les dossiers à l'ouverture du panneau.",
            type: "boolean",
            defaultValue: settings.autoScan.enabled,
            onChange: (value) => {
                settings.autoScan.enabled = !!value;
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("autoScan.enabled");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.AutoScan.OnStartup`,
            category: cat("Scan", "Auto-scan au démarrage"),
            name: "Majoor: Auto-scan au démarrage",
            tooltip: "Lancer un scan en arrière-plan dès le chargement de ComfyUI.",
            type: "boolean",
            defaultValue: !!settings.autoScan?.onStartup,
            onChange: (value) => {
                settings.autoScan = settings.autoScan || {};
                settings.autoScan.onStartup = !!value;
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("autoScan.onStartup");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.RatingTagsSync.Enabled`,
            category: cat("Scan", "Sync rating/tags vers fichiers"),
            name: "Majoor: Sync rating/tags vers fichiers",
            tooltip: "Écrire les notes et tags dans les métadonnées des fichiers (ExifTool).",
            type: "boolean",
            defaultValue: !!settings.ratingTagsSync?.enabled,
            onChange: (value) => {
                settings.ratingTagsSync = settings.ratingTagsSync || {};
                settings.ratingTagsSync.enabled = !!value;
                saveMajoorSettings(settings);
                notifyApplied("ratingTagsSync.enabled");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.Observability.Enabled`,
            category: cat("Debug", "Observabilité"),
            name: "Majoor: Activer logs détaillés",
            tooltip: "Active les logs détaillés côté backend pour le debugging.",
            type: "boolean",
            defaultValue: !!settings.observability?.enabled,
            onChange: (value) => {
                settings.observability = settings.observability || {};
                settings.observability.enabled = !!value;
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("observability.enabled");
            },
        });

        safeAddSetting({
            id: `${SETTINGS_PREFIX}.ProbeBackend.Mode`,
            category: cat("Outils", "Backend métadonnées"),
            name: "Majoor: Backend métadonnées",
            tooltip: "Choisir l'outil pour extraire les métadonnées des fichiers.",
            type: "combo",
            defaultValue: settings.probeBackend?.mode || DEFAULT_SETTINGS.probeBackend.mode,
            options: ["auto", "exiftool", "ffprobe", "both"],
            onChange: (value) => {
                const mode = _safeOneOf(value, ["auto", "exiftool", "ffprobe", "both"], DEFAULT_SETTINGS.probeBackend.mode);
                settings.probeBackend = settings.probeBackend || {};
                settings.probeBackend.mode = mode;
                saveMajoorSettings(settings);
                applySettingsToConfig(settings);
                notifyApplied("probeBackend.mode");
                setProbeBackendMode(mode).catch(() => {});
            },
        });

        const registerMinimapToggle = (idKey, stateKey, label, tooltip) => {
            safeAddSetting({
                id: `${SETTINGS_PREFIX}.WorkflowMinimap.${idKey}`,
                category: cat("Viewer", `Minimap - ${label}`),
                name: `Majoor: Minimap - ${label}`,
                tooltip,
                type: "boolean",
                defaultValue: !!settings.workflowMinimap?.[stateKey],
                onChange: (value) => {
                    settings.workflowMinimap = settings.workflowMinimap || {};
                    settings.workflowMinimap[stateKey] = !!value;
                    saveMajoorSettings(settings);
                    notifyApplied(`workflowMinimap.${stateKey}`);
                },
            });
        };

        registerMinimapToggle("NodeColors", "nodeColors", "Couleurs des nodes", "Afficher les couleurs des nodes dans la minimap.");
        registerMinimapToggle("ShowLinks", "showLinks", "Liens", "Afficher les connexions entre nodes dans la minimap.");
        registerMinimapToggle("ShowGroups", "showGroups", "Groupes", "Afficher les groupes de nodes dans la minimap.");
        registerMinimapToggle("RenderBypassState", "renderBypassState", "État bypass", "Montrer l'état bypass des nodes dans la minimap.");
        registerMinimapToggle("RenderErrorState", "renderErrorState", "État erreur", "Montrer les erreurs des nodes dans la minimap.");
        registerMinimapToggle("ShowViewport", "showViewport", "Vue active", "Montrer la zone visible du workflow dans la minimap.");

        const registerSecurityToggle = (key, label, tooltip) => {
            safeAddSetting({
                id: `${SETTINGS_PREFIX}.Security.${key}`,
                category: cat("Sécurité", label),
                name: `Majoor: ${label}`,
                tooltip,
                type: "boolean",
                defaultValue: !!settings.security?.[key],
                onChange: (value) => {
                    settings.security = settings.security || {};
                    settings.security[key] = !!value;
                    saveMajoorSettings(settings);
                    notifyApplied(`security.${key}`);
                    try {
                        const sec = settings.security || {};
                        setSecuritySettings({
                            safe_mode: _safeBool(sec.safeMode, false),
                            allow_write: _safeBool(sec.allowWrite, true),
                            allow_delete: _safeBool(sec.allowDelete, true),
                            allow_rename: _safeBool(sec.allowRename, true),
                            allow_open_in_folder: _safeBool(sec.allowOpenInFolder, true),
                            allow_reset_index: _safeBool(sec.allowResetIndex, false),
                        })
                            .then((res) => {
                                if (res?.ok && res.data?.prefs) {
                                    syncBackendSecuritySettings();
                                } else if (res && res.ok === false) {
                                    console.warn("[Majoor] backend security settings update failed", res.error || res);
                                }
                            })
                            .catch(() => {});
                    } catch {}
                },
            });
        };

        registerSecurityToggle("safeMode", "Mode sécurisé", "Quand activé, les écritures rating/tags sont bloquées sauf autorisation explicite.");
        registerSecurityToggle("allowWrite", "Autoriser écriture rating/tags", "Autorise l'écriture des notes et tags.");
        registerSecurityToggle("allowDelete", "Autoriser suppression", "Active la suppression de fichiers.");
        registerSecurityToggle("allowRename", "Autoriser renommage", "Active le renommage de fichiers.");
        registerSecurityToggle("allowOpenInFolder", "Autoriser ouvrir dans dossier", "Active l'ouverture dans le dossier.");
        registerSecurityToggle("allowResetIndex", "Autoriser reset index", "Reset le cache d'index (scan journal + metadata cache) et relance un scan complet.");

        try {
            settingsApi[SETTINGS_REG_FLAG] = true;
        } catch {}

        return true;
    };

    if (!tryRegister()) {
        try {
            const maxAttempts = 30;
            const delayMs = 250;
            let attempts = 0;
            const tick = () => {
                attempts += 1;
                if (tryRegister()) return;
                if (attempts >= maxAttempts) return;
                setTimeout(tick, delayMs);
            };
            setTimeout(tick, delayMs);
        } catch {}
    }

    return settings;
};
