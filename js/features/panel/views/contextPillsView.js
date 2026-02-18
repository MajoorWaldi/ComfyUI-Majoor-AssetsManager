import { t } from "../../../app/i18n.js";

const _safeText = (v) => {
    try {
        return String(v ?? "");
    } catch {
        return "";
    }
};

const _labelSort = (key) => {
    const k = String(key || "");
    if (k === "name_asc") return t("sort.nameAZ");
    if (k === "name_desc") return t("sort.nameZA");
    if (k === "mtime_asc") return t("sort.oldest");
    return t("sort.newest");
};

const _labelScope = (scope) => {
    const s = String(scope || "").toLowerCase();
    if (s === "custom") return t("scope.customBrowser");
    if (s === "all") return t("tab.all");
    if (s === "input" || s === "inputs") return t("scope.input");
    return t("scope.output");
};

function _createPill({ label, value, onClear } = {}) {
    const pill = document.createElement("div");
    pill.className = "mjr-context-pill";

    const txt = document.createElement("span");
    txt.className = "mjr-context-pill-text";
    txt.textContent = value != null && String(value).length ? `${label}: ${String(value)}` : String(label || "");
    pill.appendChild(txt);

    if (typeof onClear === "function") {
        const x = document.createElement("button");
        x.type = "button";
        x.className = "mjr-context-pill-x";
        x.title = t("tooltip.clearFilter", { label: label || t("label.filters") });
        x.setAttribute("aria-label", t("tooltip.clearFilter", { label: label || t("label.filters") }));
        x.textContent = "x";
        x.addEventListener("click", (e) => {
            try {
                e.preventDefault();
                e.stopPropagation();
            } catch {}
            try {
                onClear();
            } catch {}
        });
        pill.appendChild(x);
    }

    return pill;
}

export function createContextPillsView() {
    const root = document.createElement("div");
    root.className = "mjr-am-context-pills";

    const update = ({ state, rawQuery = "", actions = null } = {}) => {
        const safeActions = actions && typeof actions === "object" ? actions : {};

        const query = _safeText(rawQuery || "").trim();
        const isQueryActive = query.length > 0 && query !== "*";

        const isFilterActive = !!(
            _safeText(state?.kindFilter || "").trim()
            || !!state?.workflowOnly
            || (Number(state?.minRating || 0) || 0) > 0
            || (Number(state?.minSizeMB || 0) || 0) > 0
            || (Number(state?.maxSizeMB || 0) || 0) > 0
            || (Number(state?.minWidth || 0) || 0) > 0
            || (Number(state?.minHeight || 0) || 0) > 0
            || (Number(state?.maxWidth || 0) || 0) > 0
            || (Number(state?.maxHeight || 0) || 0) > 0
            || _safeText(state?.workflowType || "").trim()
            || _safeText(state?.dateRangeFilter || "").trim()
            || _safeText(state?.dateExactFilter || "").trim()
        );
        const isSortActive = _safeText(state?.sort || "mtime_desc").trim() !== "mtime_desc";
        const isCollectionActive = _safeText(state?.collectionId || "").trim().length > 0;
        const scopeValue = String(state?.scope || "output").toLowerCase();
        const isBrowserScope = scopeValue === "custom";
        const isScopeActive = scopeValue !== "output";

        const anyContext =
            isQueryActive || isFilterActive || isSortActive || isCollectionActive || isScopeActive;
        void anyContext;

        try {
            root.replaceChildren();
        } catch {}

        if (!isBrowserScope && isCollectionActive) {
            root.appendChild(
                _createPill({
                    label: t("label.collections"),
                    value: _safeText(state?.collectionName || state?.collectionId || "").trim(),
                    onClear: () => safeActions?.clearCollection?.()
                })
            );
        }
        if (isScopeActive) {
            root.appendChild(
                _createPill({
                    label: t("label.scope"),
                    value: _labelScope(state?.scope || "output"),
                    onClear: () => safeActions?.clearScope?.()
                })
            );
        }
        if (isQueryActive) {
            root.appendChild(
                _createPill({
                    label: t("label.query"),
                    value: query,
                    onClear: () => safeActions?.clearQuery?.()
                })
            );
        }
        if (_safeText(state?.kindFilter || "").trim()) {
            root.appendChild(
                _createPill({
                    label: t("label.type"),
                    value: _safeText(state?.kindFilter || "").trim(),
                    onClear: () => safeActions?.clearKind?.()
                })
            );
        }
        if (Number(state?.minRating || 0) > 0) {
            root.appendChild(
                _createPill({
                    label: t("label.rating"),
                    value: `>= ${Number(state?.minRating || 0)}`,
                    onClear: () => safeActions?.clearMinRating?.()
                })
            );
        }
        if (state?.workflowOnly) {
            root.appendChild(
                _createPill({
                    label: t("label.workflow"),
                    value: t("label.only"),
                    onClear: () => safeActions?.clearWorkflowOnly?.()
                })
            );
        }
        if (_safeText(state?.workflowType || "").trim()) {
            root.appendChild(
                _createPill({
                    label: t("label.workflowType"),
                    value: _safeText(state?.workflowType || "").trim(),
                    onClear: () => safeActions?.clearWorkflowType?.()
                })
            );
        }
        if ((Number(state?.minSizeMB || 0) || 0) > 0 || (Number(state?.maxSizeMB || 0) || 0) > 0) {
            const min = Number(state?.minSizeMB || 0) || 0;
            const max = Number(state?.maxSizeMB || 0) || 0;
            const label = min > 0 && max > 0 ? `${min}-${max} MB` : min > 0 ? `>= ${min} MB` : `<= ${max} MB`;
            root.appendChild(
                _createPill({
                    label: t("sidebar.size"),
                    value: label,
                    onClear: () => safeActions?.clearSize?.()
                })
            );
        }
        if (
            (Number(state?.minWidth || 0) || 0) > 0
            || (Number(state?.minHeight || 0) || 0) > 0
            || (Number(state?.maxWidth || 0) || 0) > 0
            || (Number(state?.maxHeight || 0) || 0) > 0
        ) {
            const isLte = String(state?.resolutionCompare || "gte") === "lte";
            const w = Number(isLte ? state?.maxWidth : state?.minWidth || 0) || 0;
            const h = Number(isLte ? state?.maxHeight : state?.minHeight || 0) || 0;
            root.appendChild(
                _createPill({
                    label: t("label.resolution"),
                    value: `${isLte ? "<=" : ">="} ${w || 0}x${h || 0} px`,
                    onClear: () => safeActions?.clearResolution?.()
                })
            );
        }
        if (_safeText(state?.dateRangeFilter || "").trim()) {
            root.appendChild(
                _createPill({
                    label: t("sidebar.date"),
                    value: _safeText(state?.dateRangeFilter || "").trim(),
                    onClear: () => safeActions?.clearDateRange?.()
                })
            );
        }
        if (_safeText(state?.dateExactFilter || "").trim()) {
            root.appendChild(
                _createPill({
                    label: t("label.day"),
                    value: _safeText(state?.dateExactFilter || "").trim(),
                    onClear: () => safeActions?.clearDateExact?.()
                })
            );
        }
        if (isSortActive) {
            root.appendChild(
                _createPill({
                    label: t("label.sort"),
                    value: _labelSort(state?.sort),
                    onClear: () => safeActions?.clearSort?.()
                })
            );
        }
    };

    return { wrap: root, update };
}

