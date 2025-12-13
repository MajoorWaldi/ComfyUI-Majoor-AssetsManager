import { api } from "../../scripts/api.js";
import { app } from "../../scripts/app.js";

export function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

export function applyStyles(el, styles = {}) {
  Object.entries(styles).forEach(([k, v]) => {
    if (v !== undefined && v !== null) el.style[k] = v;
  });
}

export function getBaseName(name) {
  const idx = name.lastIndexOf(".");
  return idx > 0 ? name.slice(0, idx) : name;
}

export function getExt(name) {
  const idx = name.lastIndexOf(".");
  return idx > -1 ? name.slice(idx + 1).toUpperCase() : "";
}

export function detectKindFromExt(extUpper) {
  const ext = extUpper.toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";
  if (["mp4", "mov", "webm", "mkv"].includes(ext)) return "video";
  if (["wav", "mp3", "flac", "ogg", "m4a", "aac"].includes(ext)) return "audio";
  if (["obj", "fbx", "glb", "gltf", "stl"].includes(ext)) return "model3d";
  return "other";
}

export function buildViewUrl(file) {
  const url = new URL("/view", window.location.origin);
  url.searchParams.set("filename", file.filename || file.name);
  if (file.subfolder) url.searchParams.set("subfolder", file.subfolder);
  url.searchParams.set("type", "output");
  return url.toString();
}

export const BADGE_STYLES = {
  rating: {
    position: "absolute",
    top: "4px",
    right: "4px",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    color: "#ffd45a",
    padding: "1px 5px",
    zIndex: "5",
    pointerEvents: "none",
    fontSize: "0.75rem",
  },
  tags: {
    position: "absolute",
    top: "23px",
    right: "4px",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    color: "#fff",
    padding: "1px 5px",
    zIndex: "5",
    pointerEvents: "none",
    fontSize: "0.65rem",
    maxWidth: "60%",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};

export const CARD_STYLES = {
  position: "relative",
  border: "1px solid var(--border-color, #444)",
  borderRadius: "8px",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  background: "rgba(255,255,255,0.02)",
  cursor: "pointer",
  transition: "border-color 0.12s ease, box-shadow 0.12s ease, background 0.12s ease",
};

export const CONTEXT_MENU_STYLES = {
  position: "absolute",
  zIndex: "9999",
  padding: "10px",
  background: "#1b1b1b",
  borderRadius: "5px",
  boxShadow: "0px 0px 10px rgba(0,0,0,0.3)",
  minWidth: "140px",
};

export const mjrSettingsDefaults = {
  autoRefresh: { enabled: true, interval: 5000, focusOnly: true },
  metaPanel: { showByDefault: true, refreshInterval: 2000 },
  grid: { cardSize: "medium", showTags: true, showRating: true },
  viewer: {
    navEnabled: true,
    autoplayVideos: true,
    loopVideos: true,
    muteVideos: true,
    showRatingHUD: true,
    ratingHotkeys: true,
    useCheckerboard: false,
  },
  siblings: { hidePngSiblings: true },
  toasts: { enabled: true, verbosity: "all", duration: 3200 },
  hotkeys: {
    enabled: true,
    rating: true,
    enterOpen: true,
    frameStep: true,
  },
};

export function mjrDeepMerge(base, override) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  if (!override || typeof override !== "object") return out;
  Object.keys(override).forEach((k) => {
    const bv = out[k];
    const ov = override[k];
    if (bv && typeof bv === "object" && !Array.isArray(bv) && ov && typeof ov === "object" && !Array.isArray(ov)) {
      out[k] = mjrDeepMerge(bv, ov);
    } else {
      out[k] = ov;
    }
  });
  return out;
}

export function mjrLoadSettings() {
  try {
    const raw = localStorage.getItem("mjrFMSettings");
    if (!raw) return { ...mjrSettingsDefaults };
    const parsed = JSON.parse(raw);
    return mjrDeepMerge(mjrSettingsDefaults, parsed);
  } catch (err) {
    console.warn("[Majoor.AssetsManager] settings load failed, using defaults", err);
    return { ...mjrSettingsDefaults };
  }
}

export function mjrSaveSettings(settings) {
  try {
    localStorage.setItem("mjrFMSettings", JSON.stringify(settings || mjrSettingsDefaults));
  } catch (err) {
    console.warn("[Majoor.AssetsManager] settings save failed", err);
  }
}

export let mjrSettings = mjrLoadSettings();
export function setMjrSettings(next) {
  mjrSettings = next;
  mjrSaveSettings(mjrSettings);
  return mjrSettings;
}

export function mjrCardBasePx() {
  const sizeMap = { compact: 160, medium: 200, large: 240 };
  return sizeMap[mjrSettings.grid.cardSize] || sizeMap.medium;
}

export let mjrPrefetchedFiles = null;
let mjrPrefetchPromise = null;
export async function mjrPrefetchOutputs() {
  if (mjrPrefetchPromise) return mjrPrefetchPromise;
  mjrPrefetchPromise = api
    .fetchApi("/mjr/filemanager/files")
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      mjrPrefetchedFiles = data.files || data.items || [];
      return mjrPrefetchedFiles;
    })
    .catch((err) => {
      console.warn("[Majoor.AssetsManager] prefetch outputs failed", err);
      mjrPrefetchedFiles = null;
    });
  return mjrPrefetchPromise;
}

export function mjrShouldShowToast(kind) {
  if (!mjrSettings.toasts.enabled) return false;
  const v = mjrSettings.toasts.verbosity || "all";
  if (v === "all") return true;
  if (v === "errors") return kind === "error";
  if (v === "warnings") return kind === "warn" || kind === "error";
  return false;
}

export function mjrShowToast(kind = "info", message = "", title = null, duration = null) {
  if (!mjrShouldShowToast(kind)) return;

  const severityMap = {
    info: "info",
    success: "success",
    warn: "warn",
    error: "error",
  };

  if (!app.toast || !app.toast.add) {
    console.log(`[${kind.toUpperCase()}] ${title ? title + ": " : ""}${message}`);
    return;
  }

  app.toast.add({
    severity: severityMap[kind] || "info",
    summary: title || (kind.charAt(0).toUpperCase() + kind.slice(1)),
    detail: message,
    life: duration || 3000,
    closable: true,
  });
}

export function mjrAttachHoverFeedback(el, message, delay = 3000) {
  if (!el) return;
  let t = null;
  let lastShownAt = 0;
  const cooldownMs = 2000;
  el.addEventListener("mouseenter", () => {
    const now = Date.now();
    if (now - lastShownAt < cooldownMs) return; // throttle repeated hover toasts
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      mjrShowToast("info", message, "Info", 2500);
      lastShownAt = Date.now();
    }, delay);
  });
  const clear = () => {
    if (t) {
      clearTimeout(t);
      t = null;
    }
  };
  el.addEventListener("mouseleave", clear);
  el.addEventListener("click", clear);
}

// Trigger prefetch at startup
mjrPrefetchOutputs();
