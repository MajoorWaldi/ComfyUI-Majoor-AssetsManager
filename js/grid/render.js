import { detectKindFromExt, getBaseName, getExt, mjrSettings } from "../ui_settings.js";
import { normalizeMtimeValue } from "../am_filters.js";

export function createApplyFilterAndRender(state, fetchMetadataForVisible, fetchMetadataForFilter) {
  let gridView = null;

  const applyFilterAndRender = (options = {}) => {
    const { skipMetadataFetch = false } = options;
    const q = (state.search || "").trim().toLowerCase();
    const tagFilter = (state.tagFilter || "").trim().toLowerCase();
    const minRating = Number(state.minRating || 0);
    const needsMetaFilter = minRating > 0 || !!tagFilter;
    const hidePng = !!mjrSettings.siblings.hidePngSiblings;
    let nonImageStems = null;
    if (hidePng) {
      nonImageStems = new Set();
      for (const f of state.files) {
        const raw = f.name || f.filename || "";
        if ((f.kind || detectKindFromExt(f.ext || getExt(raw) || "")) !== "image") {
          nonImageStems.add(getBaseName(raw));
        }
      }
    }

    state.filtered = state.files.filter((file) => {
      const rawName = file.name || file.filename || "";
      const extUpper = (file.ext || getExt(rawName) || "").toUpperCase();
      const kind = file.kind || detectKindFromExt(extUpper);
      if (hidePng && nonImageStems?.has(getBaseName(rawName)) && extUpper === "PNG") return false;

      const name = rawName.toLowerCase();
      const folder = (file.subfolder || "").toLowerCase();
      if (q && !name.includes(q) && !folder.includes(q)) return false;

      file.mtime = normalizeMtimeValue(file.mtime);
      if (state.collectionSet) {
        const fileRelPath = `${file.subfolder ? file.subfolder + "/" : ""}${rawName}`;
        if (!state.collectionSet.has(fileRelPath)) return false;
      } else if (state.smartFilter && !state.smartFilter(file)) {
        return false;
      }

      const fileRating = Number(file.rating ?? 0);
      const hasMeta = !!file.__metaLoaded || file.rating !== undefined || Array.isArray(file.tags);
      if (needsMetaFilter && !hasMeta) return false;
      if (fileRating < minRating) return false;

      const tagsArr = Array.isArray(file.tags) ? file.tags : [];
      if (tagFilter && !tagsArr.some((tag) => String(tag).toLowerCase().includes(tagFilter))) return false;

      return true;
    });

    state.filtered.sort((a, b) => b.mtime - a.mtime || a.name.localeCompare(b.name));
    state.renderVersion = (state.renderVersion || 0) + 1;

    if (gridView) gridView.renderGrid();

    if (!skipMetadataFetch) {
      fetchMetadataForVisible();
      if (needsMetaFilter && typeof fetchMetadataForFilter === "function") {
        fetchMetadataForFilter();
      }
    }
  };

  const setGridView = (gv) => {
    gridView = gv;
  };

  return { applyFilterAndRender, setGridView };
}
