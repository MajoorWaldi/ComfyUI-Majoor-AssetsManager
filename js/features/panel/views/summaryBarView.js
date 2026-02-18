import { createContextPillsView } from "./contextPillsView.js";
import { t } from "../../../app/i18n.js";

const _safeText = (v) => {
    try {
        return String(v ?? "");
    } catch {
        return "";
    }
};

const _titleScope = (scope) => {
    const s = String(scope || "").toLowerCase();
    if (s === "input" || s === "inputs") return t("scope.input");
    if (s === "custom") return t("scope.customBrowser");
    if (s === "all") return t("tab.all");
    return t("scope.output");
};

export function createSummaryBarView() {
    const bar = document.createElement("div");
    bar.className = "mjr-am-summary";
    bar.setAttribute("aria-live", "polite");

    const left = document.createElement("div");
    left.className = "mjr-am-summary-left";

    const right = document.createElement("div");
    right.className = "mjr-am-summary-right";

    const text = document.createElement("div");
    text.className = "mjr-am-summary-text";

    const pillsView = createContextPillsView();
    const dupAlert = document.createElement("button");
    dupAlert.type = "button";
    dupAlert.className = "mjr-am-dup-alert";
    dupAlert.style.cssText = "padding:2px 8px;border:1px solid var(--border-color,#555);background:var(--comfy-menu-bg,#222);color:var(--input-text,#eee);border-radius:999px;cursor:pointer;";
    dupAlert.style.display = "none";
    dupAlert.title = t("tooltip.duplicateSuggestions");
    right.appendChild(dupAlert);

    left.appendChild(text);
    right.appendChild(pillsView.wrap);
    bar.appendChild(left);
    bar.appendChild(right);

    const update = ({ state, gridContainer, context = null, actions = null } = {}) => {
        const folderStats = (() => {
            try {
                const cards = Array.from(gridContainer?.querySelectorAll?.(".mjr-asset-card") || []);
                let folders = 0;
                for (const card of cards) {
                    const kind = String(card?._mjrAsset?.kind || "").toLowerCase();
                    if (kind === "folder") folders += 1;
                }
                return { total: cards.length, folders };
            } catch {
                return { total: 0, folders: 0 };
            }
        })();

        const cardsCount = (() => {
            try {
                return Number(gridContainer?.querySelectorAll?.(".mjr-asset-card")?.length || 0) || 0;
            } catch {
                return 0;
            }
        })();

        const selectedCount = (() => {
            try {
                const fromState = Array.isArray(state?.selectedAssetIds) ? state.selectedAssetIds.length : 0;
                if (fromState > 0) return fromState;
            } catch {}
            try {
                return Number(gridContainer?.querySelectorAll?.(".mjr-asset-card.is-selected")?.length || 0) || 0;
            } catch {
                return 0;
            }
        })();

        const datasetTotal = Number(gridContainer?.dataset?.mjrTotal || 0) || 0;
        const total = datasetTotal || Math.max(0, Number(state?.lastGridTotal ?? 0) || 0);

        const datasetShown = Number(gridContainer?.dataset?.mjrShown || 0) || 0;
        const shown =
            datasetShown ||
            Math.max(0, Number(state?.lastGridCount ?? 0) || 0) ||
            cardsCount;

        const scope = _titleScope(state?.scope || gridContainer?.dataset?.mjrScope || "output");

        const countPart = total && total >= shown ? `${shown}/${total}` : `${shown}`;
        const primaryLabel =
            shown > 0 && folderStats.total > 0 && folderStats.folders === folderStats.total ? t("summary.folders") : t("summary.assets");
        const parts = [`${primaryLabel}: ${countPart}`];
        if (selectedCount > 0) parts.push(`${t("summary.selected")}: ${selectedCount}`);
        parts.push(scope);
        try {
            const hidden = Number(gridContainer?.dataset?.mjrHiddenPngSiblings || 0) || 0;
            const enabled = String(gridContainer?.dataset?.mjrHidePngSiblingsEnabled || "") === "1";
            if (enabled && hidden > 0) parts.push(`${t("summary.hidden")}: ${hidden}`);
        } catch {}

        try {
            text.textContent = parts.filter(Boolean).join(" | ");
        } catch {}

        try {
            const alert = context?.duplicatesAlert || null;
            const exact = Number(alert?.exactCount || 0) || 0;
            const similar = Number(alert?.similarCount || 0) || 0;
            const hasAlert = exact > 0 || similar > 0;
            if (!hasAlert) {
                dupAlert.style.display = "none";
                dupAlert.onclick = null;
            } else {
                dupAlert.style.display = "";
                dupAlert.textContent = `${t("summary.duplicates")}: ${exact} | ${t("summary.similar")}: ${similar}`;
                dupAlert.onclick = () => {
                    try {
                        actions?.onDuplicateAlertClick?.(alert);
                    } catch {}
                };
            }
        } catch {}

        const rawQuery = _safeText(context?.rawQuery || "").trim();
        try {
            pillsView.update({ state, gridContainer, rawQuery, actions });
        } catch {}
    };

    return { bar, update };
}
