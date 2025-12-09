import { api } from "../../scripts/api.js";

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
    top: "5px",
    right: "5px",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    color: "#ffd45a",
    padding: "2px 6px",
    zIndex: "5",
    pointerEvents: "none",
  },
  tags: {
    position: "absolute",
    bottom: "5px",
    right: "5px",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    color: "#fff",
    padding: "2px 6px",
    zIndex: "5",
    pointerEvents: "none",
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
    console.warn("[Majoor.FileManager] settings load failed, using defaults", err);
    return { ...mjrSettingsDefaults };
  }
}

export function mjrSaveSettings(settings) {
  try {
    localStorage.setItem("mjrFMSettings", JSON.stringify(settings || mjrSettingsDefaults));
  } catch (err) {
    console.warn("[Majoor.FileManager] settings save failed", err);
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
      console.warn("[Majoor.FileManager] prefetch outputs failed", err);
      mjrPrefetchedFiles = null;
    });
  return mjrPrefetchPromise;
}

let mjrToastContainer = null;
let mjrToastStyleInjected = false;

export function mjrEnsureToastContainer() {
  if (!mjrToastStyleInjected) {
    const style = document.createElement("style");
    style.textContent = `
    .mjr-toast-container {
      position: fixed;
      top: 14px;
      right: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 10000;
      pointer-events: none;
    }
    .mjr-toast {
      min-width: 200px;
      max-width: 360px;
      padding: 10px 12px;
      border-radius: 8px;
      background: rgba(18,18,18,0.95);
      color: #f2f2f2;
      box-shadow: 0 6px 18px rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.05);
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.85rem;
      letter-spacing: 0.1px;
      opacity: 0;
      transform: translateX(12px);
      transition: opacity 0.15s ease, transform 0.15s ease;
      pointer-events: auto;
    }
    .mjr-toast-accent {
      width: 4px;
      align-self: stretch;
      border-radius: 4px;
      background: #4ea3ff;
    }
    .mjr-toast-title {
      font-weight: 600;
      margin-bottom: 2px;
      font-size: 0.8rem;
    }
    .mjr-toast-body {
      opacity: 0.9;
      font-size: 0.82rem;
      line-height: 1.3;
    }
    `;
    document.head.appendChild(style);
    mjrToastStyleInjected = true;
  }

  if (!mjrToastContainer) {
    const wrap = document.createElement("div");
    wrap.className = "mjr-toast-container";
    mjrToastContainer = wrap;
    document.body.appendChild(wrap);
  }
  return mjrToastContainer;
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

  const container = mjrEnsureToastContainer();
  const toast = document.createElement("div");
  toast.className = "mjr-toast";
  const accent = document.createElement("div");
  accent.className = "mjr-toast-accent";
  const colors = {
    info: "#4ea3ff",
    success: "#6dd679",
    warn: "#f7c14b",
    error: "#f45b69",
  };
  accent.style.background = colors[kind] || "#4ea3ff";

  const bodyWrap = document.createElement("div");
  bodyWrap.style.display = "flex";
  bodyWrap.style.flexDirection = "column";
  bodyWrap.style.gap = "2px";

  if (title) {
    const t = document.createElement("div");
    t.className = "mjr-toast-title";
    t.textContent = title;
    bodyWrap.appendChild(t);
  }
  if (message) {
    const b = document.createElement("div");
    b.className = "mjr-toast-body";
    b.textContent = message;
    bodyWrap.appendChild(b);
  }

  toast.appendChild(accent);
  toast.appendChild(bodyWrap);
  container.appendChild(toast);

  // trigger animation
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";
  });

  const ttl = duration || mjrSettings.toasts.duration || 3200;
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(12px)";
    setTimeout(() => {
      toast.remove();
    }, 180);
  }, ttl);
}

export function mjrAttachHoverFeedback(el, message, delay = 3000) {
  if (!el) return;
  let t = null;
  el.addEventListener("mouseenter", () => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      mjrShowToast("info", message, "Info", 2500);
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

// État global partagé pour éviter les problèmes d'import circulaire
export const mjrGlobalState = {
  instances: new Set(),
};
