import { t } from "../../../app/i18n.js";

export function createTabsView() {
    const tabs = document.createElement("div");
    tabs.classList.add("mjr-tabs");

    const makeTab = (label, scope, tooltip) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = label;
        btn.dataset.scope = scope;
        btn.classList.add("mjr-tab");
        btn.title = tooltip;
        return btn;
    };

    const tabAll = makeTab(t("tab.all"), "all", t("tooltip.tab.all"));
    const tabInputs = makeTab(t("tab.input"), "input", t("tooltip.tab.input"));
    const tabOutputs = makeTab(t("tab.output"), "output", t("tooltip.tab.output"));
    const tabCustom = makeTab(t("tab.custom"), "custom", t("tooltip.tab.custom"));
    tabs.appendChild(tabAll);
    tabs.appendChild(tabInputs);
    tabs.appendChild(tabOutputs);
    tabs.appendChild(tabCustom);

    return {
        tabs,
        tabButtons: { tabAll, tabInputs, tabOutputs, tabCustom }
    };
}

