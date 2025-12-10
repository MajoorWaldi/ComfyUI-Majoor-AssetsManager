import { api } from "../../scripts/api.js";
import {
  mjrPrefetchedFiles,
  mjrShowToast,
} from "./ui_settings.js";
import { normalizeMtimeOnList, normalizeMtimeValue } from "./am_filters.js";

export const mjrRefreshDefaults = { silent: true, forceFiles: false, metaOnly: false };

export const mergeLoadOpts = (current, next) => {
  if (!current) return next;
  return {
    silent: current.silent && next.silent,
    force: current.force || next.force,
    skipMetadataFetch: current.skipMetadataFetch && next.skipMetadataFetch,
  };
};

export const normalizeRefreshOptions = (optionsOrSilent = true, forceFiles = false) => {
  if (typeof optionsOrSilent === "object" && optionsOrSilent !== null) {
    return { ...mjrRefreshDefaults, ...optionsOrSilent };
  }
  return { ...mjrRefreshDefaults, silent: !!optionsOrSilent, forceFiles: !!forceFiles };
};

export const mergeRefreshOptions = (current, next) => {
  if (!current) return next;
  return {
    silent: current.silent && next.silent,
    forceFiles: current.forceFiles || next.forceFiles,
    metaOnly: current.metaOnly && next.metaOnly,
  };
};

export function computeSignature(files) {
  try {
    return files
      .map((f) => {
        const path = `${f.subfolder || ""}/${f.filename || f.name || ""}`;
        const mtime = normalizeMtimeValue(f.mtime);
        f.mtime = mtime;
        const rating =
          f.rating ??
          (f.meta && f.meta.rating) ??
          (f.metadata && f.metadata.rating) ??
          0;
        const tags =
          (Array.isArray(f.tags) && f.tags) ||
          (Array.isArray(f.meta && f.meta.tags) && f.meta.tags) ||
          (Array.isArray(f.metadata && f.metadata.tags) && f.metadata.tags) ||
          [];
        return `${path}|${mtime || ""}|${f.size || ""}|${rating}|${tags.length}|${tags.join(",")}`;
      })
      .join(";");
  } catch (err) {
    console.warn("[Majoor.AssetsManager] signature error", err);
    return null;
  }
}

export function sortFilesDeterministically(files) {
  files.sort((a, b) => {
    const am = normalizeMtimeValue(a.mtime);
    const bm = normalizeMtimeValue(b.mtime);
    a.mtime = am;
    b.mtime = bm;
    const diff = bm - am;
    if (diff !== 0) return diff;
    const ak = `${a.subfolder || ""}/${a.filename || a.name || ""}`;
    const bk = `${b.subfolder || ""}/${b.filename || b.name || ""}`;
    return ak.localeCompare(bk);
  });
}

export async function loadFiles(state, gridEl, applyFilterAndRender, opts = {}, refs) {
  const { silent = false, force = false, skipMetadataFetch = false } = opts;
  const { lastSignatureRef, mergeLoadOptsFn = mergeLoadOpts, setLoadingPromise } = refs;

  if (state.loadingPromise) {
    state.nextLoadOpts = mergeLoadOptsFn(state.nextLoadOpts, { silent, force, skipMetadataFetch });
    return state.loadingPromise;
  }

  state.loadingPromise = (async () => {
    state.loading = true;
    if (!silent && gridEl.children.length === 0) {
      gridEl.innerHTML = '<div style="opacity:.7;padding:10px;">Loading outputs…</div>';
    }
    try {
      if (!force && Array.isArray(mjrPrefetchedFiles) && mjrPrefetchedFiles.length) {
        normalizeMtimeOnList(mjrPrefetchedFiles);
        const sig = computeSignature(mjrPrefetchedFiles);
        state.files = mjrPrefetchedFiles;
        lastSignatureRef.value = sig;
        applyFilterAndRender({ skipMetadataFetch });
      }

      const params = new URLSearchParams();
      params.set("t", Date.now().toString());
      if (force) params.set("force", "1");

      const res = await api.fetchApi(`/mjr/filemanager/files?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const incoming = data.files || data.items || [];

      normalizeMtimeOnList(incoming);
      sortFilesDeterministically(incoming);

      const prevMap = new Map();
      (state.files || []).forEach((f) => {
        const raw = f.name || f.filename || "";
        const k = `${f.subfolder || ""}/${raw}`;
        prevMap.set(k, f);
      });
      incoming.forEach((f) => {
        const raw = f.name || f.filename || "";
        const k = `${f.subfolder || ""}/${raw}`;
        const prev = prevMap.get(k);
        if (prev) {
          if (prev.rating !== undefined) f.rating = prev.rating;
          if (Array.isArray(prev.tags)) f.tags = prev.tags;
          if (prev.__metaLoaded) f.__metaLoaded = true;
        }
      });

      const sig = computeSignature(incoming);
      if (!force && sig && sig === lastSignatureRef.value) {
        lastSignatureRef.value = sig;
        return;
      }
      state.files = incoming;
      lastSignatureRef.value = sig;
      applyFilterAndRender({ skipMetadataFetch });
    } catch (err) {
      console.error("[Majoor.AssetsManager] load error", err);
      gridEl.innerHTML = '<div style="color:#e66;padding:10px;">Error loading files (see console).</div>';
      mjrShowToast("error", "Error loading files", "Error");
    } finally {
      state.loading = false;
      const pending = state.nextLoadOpts;
      state.nextLoadOpts = null;
      state.loadingPromise = null;
      if (pending) {
        await loadFiles(state, gridEl, applyFilterAndRender, pending, refs);
      }
    }
  })();

  if (typeof setLoadingPromise === "function") setLoadingPromise(state.loadingPromise);
  return state.loadingPromise;
}

export function createRefreshInstance(state, fetchMetadataForVisible, loadFilesFn, refs) {
  const { mjrRefreshDefaults: refreshDefaults = mjrRefreshDefaults, mergeRefreshOptionsFn = mergeRefreshOptions } = refs || {};
  let instanceRefreshInFlight = null;
  let instanceRefreshPending = null;

  const refreshInstance = async (options = {}) => {
    const opts = { ...refreshDefaults, ...options };
    if (instanceRefreshInFlight) {
      instanceRefreshPending = mergeRefreshOptionsFn(instanceRefreshPending, opts);
      return instanceRefreshInFlight;
    }

    const run = async () => {
      if (!opts.metaOnly) {
        await loadFilesFn(opts);
      }
      await fetchMetadataForVisible();
    };

    instanceRefreshInFlight = run().finally(() => {
      const pending = instanceRefreshPending;
      instanceRefreshPending = null;
      instanceRefreshInFlight = null;
      if (pending) {
        refreshInstance(pending);
      }
    });

    return instanceRefreshInFlight;
  };

  return refreshInstance;
}
