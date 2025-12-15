import { api } from "../../../../scripts/api.js";

export function createMetadataFetcher(state, gridView) {
  let metadataAbortCtrl = null;
  let metadataFetchInFlight = null;
  let metadataDebounceTimer = null;
  let currentGridView = gridView || null;

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

    try {
      const res = await metadataFetchInFlight;
      if (thisCtrl.signal.aborted || reqVersion !== state.renderVersion) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (thisCtrl.signal.aborted || reqVersion !== state.renderVersion) return;

      const metaByKey = new Map();
      (data.metadatas || []).forEach((m) => metaByKey.set(`${m.subfolder || ""}/${m.filename || ""}`, m));

      state.files.forEach((f) => {
        const key = `${f.subfolder || ""}/${f.filename || f.name || ""}`;
        const m = metaByKey.get(key);
        if (m) {
          f.rating = m.rating ?? 0;
          f.tags = m.tags || [];
          if (m.has_workflow !== undefined) f.hasWorkflow = !!m.has_workflow;
          f.__metaLoaded = true;
        }
      });

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
      if (fullList.slice(effectiveStart, effectiveEnd).some((f) => !f.__metaLoaded)) {
        fetchMetadataForVisible();
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

  return { fetchMetadataForVisible, onRequestMetadata, cleanup, setGridView };
}
