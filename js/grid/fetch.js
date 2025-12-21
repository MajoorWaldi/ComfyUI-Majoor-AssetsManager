import { api } from "../../../../scripts/api.js";

export function createMetadataFetcher(state, gridView, opts = {}) {
  let metadataAbortCtrl = null;
  let metadataFetchInFlight = null;
  let metadataDebounceTimer = null;
  let currentGridView = gridView || null;
  let onMetadataUpdated = typeof opts.onMetadataUpdated === "function" ? opts.onMetadataUpdated : null;

  // Retry limit tracking to prevent infinite loops
  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_BACKOFF_MS = 1000; // Start with 1 second
  let retryCount = 0;
  let lastRetryTime = 0;

  const setOnMetadataUpdated = (fn) => {
    onMetadataUpdated = typeof fn === "function" ? fn : null;
  };

  const shouldHydrateForFilter = () => {
    const tagFilter = (state.tagFilter || "").trim();
    const minRating = Number(state.minRating || 0);
    return !!tagFilter || minRating > 0;
  };

  const applyBatchResults = (data) => {
    const metaByKey = new Map();
    (data.metadatas || []).forEach((m) => metaByKey.set(`${m.subfolder || ""}/${m.filename || ""}`, m));

    let updatedCount = 0;
    state.files.forEach((f) => {
      const key = `${f.subfolder || ""}/${f.filename || f.name || ""}`;
      const m = metaByKey.get(key);
      if (m) {
        f.rating = m.rating ?? 0;
        f.tags = m.tags || [];
        if (m.has_workflow !== undefined) f.hasWorkflow = !!m.has_workflow;
        f.__metaLoaded = true;
        updatedCount += 1;
      }
    });
    return updatedCount;
  };

  async function fetchMetadataForVisible() {
    if (metadataFetchInFlight) return;
    const reqVersion = state.renderVersion;
    const fullList = state.filtered || [];
    const { visibleStart: start, visibleEnd: end } = state;

    const buffer = 20;
    const effectiveStart = Math.max(0, start - buffer);
    const effectiveEnd = Math.min(fullList.length, end + buffer);

    const visibleSlice = fullList.slice(effectiveStart, effectiveEnd);
    const targetFiles = visibleSlice.filter((f) => !f.__metaLoaded);

    if (!targetFiles.length) return;
    const batch = targetFiles.slice(0, 30).map((f) => ({ filename: f.filename || f.name, subfolder: f.subfolder || "" }));

    if (metadataAbortCtrl) {
      try {
        metadataAbortCtrl.abort();
      } catch (_) {}
    }
    metadataAbortCtrl = new AbortController();
    const thisCtrl = metadataAbortCtrl;

    metadataFetchInFlight = api.fetchApi("/mjr/filemanager/metadata/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: batch }),
      signal: thisCtrl.signal,
    });

    let updatedAny = false;
    try {
      const res = await metadataFetchInFlight;
      if (thisCtrl.signal.aborted || reqVersion !== state.renderVersion) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error("[Majoor.AssetsManager] Failed to parse metadata JSON response", parseErr);
        throw new Error(`JSON parse error: ${parseErr.message}`);
      }

      if (thisCtrl.signal.aborted || reqVersion !== state.renderVersion) return;
      updatedAny = applyBatchResults(data) > 0;

      if (currentGridView) currentGridView.renderGrid();
    } catch (err) {
      if (err?.name === "AbortError") {
        // ignore aborted fetch
      } else {
        console.warn("[Majoor.AssetsManager] batch metadata load failed", err);
      }
    } finally {
      metadataFetchInFlight = null;
      if (metadataAbortCtrl === thisCtrl) metadataAbortCtrl = null;
      if (updatedAny && onMetadataUpdated) {
        setTimeout(() => {
          try {
            onMetadataUpdated();
          } catch (_) {}
        }, 0);
      }

      // Retry with exponential backoff and max attempts
      if (reqVersion === state.renderVersion && fullList.slice(effectiveStart, effectiveEnd).some((f) => !f.__metaLoaded)) {
        const now = Date.now();

        // Reset retry count if enough time has passed
        if (now - lastRetryTime > 30000) {
          retryCount = 0;
        }

        if (retryCount < MAX_RETRY_ATTEMPTS) {
          const backoffDelay = updatedAny ? 0 : RETRY_BACKOFF_MS * Math.pow(2, retryCount);
          retryCount++;
          lastRetryTime = now;

          setTimeout(() => {
            fetchMetadataForVisible();
          }, backoffDelay);
        } else {
          console.warn("[Majoor.AssetsManager] Max metadata fetch retries reached, stopping to prevent infinite loop");
        }
      } else {
        // Reset retry count on successful completion
        retryCount = 0;
      }
    }
  }

  async function fetchMetadataForFilter() {
    if (metadataFetchInFlight) return;
    if (!shouldHydrateForFilter()) return;

    const reqVersion = state.renderVersion;
    const allFiles = state.files || [];
    const targetFiles = allFiles.filter((f) => !f.__metaLoaded).slice(0, 30);
    if (!targetFiles.length) return;

    const batch = targetFiles.map((f) => ({ filename: f.filename || f.name, subfolder: f.subfolder || "" }));

    if (metadataAbortCtrl) {
      try {
        metadataAbortCtrl.abort();
      } catch (_) {}
    }
    metadataAbortCtrl = new AbortController();
    const thisCtrl = metadataAbortCtrl;

    metadataFetchInFlight = api.fetchApi("/mjr/filemanager/metadata/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: batch }),
      signal: thisCtrl.signal,
    });

    let updatedAny = false;
    try {
      const res = await metadataFetchInFlight;
      if (thisCtrl.signal.aborted || reqVersion !== state.renderVersion) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (thisCtrl.signal.aborted || reqVersion !== state.renderVersion) return;
      updatedAny = applyBatchResults(data) > 0;
      if (currentGridView) currentGridView.renderGrid();
    } catch (err) {
      if (err?.name === "AbortError") {
        // ignore aborted fetch
      } else {
        console.warn("[Majoor.AssetsManager] filter metadata load failed", err);
      }
    } finally {
      metadataFetchInFlight = null;
      if (metadataAbortCtrl === thisCtrl) metadataAbortCtrl = null;
      if (updatedAny && onMetadataUpdated) {
        setTimeout(() => {
          try {
            onMetadataUpdated();
          } catch (_) {}
        }, 0);
      }
      if (reqVersion === state.renderVersion && shouldHydrateForFilter() && allFiles.some((f) => !f.__metaLoaded)) {
        fetchMetadataForFilter();
      }
    }
  }

  const onRequestMetadata = (start, end) => {
    state.visibleStart = start;
    state.visibleEnd = end;
    if (metadataDebounceTimer) clearTimeout(metadataDebounceTimer);
    metadataDebounceTimer = setTimeout(() => fetchMetadataForVisible(), 150);
  };

  const cleanup = () => {
    if (metadataDebounceTimer) clearTimeout(metadataDebounceTimer);
    if (metadataAbortCtrl) {
      try {
        metadataAbortCtrl.abort();
      } catch (_) {}
    }
  };

  const setGridView = (gv) => {
    currentGridView = gv;
  };

  return { fetchMetadataForVisible, fetchMetadataForFilter, onRequestMetadata, cleanup, setGridView, setOnMetadataUpdated };
}
