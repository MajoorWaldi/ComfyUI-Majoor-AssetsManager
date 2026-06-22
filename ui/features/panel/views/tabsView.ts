import { t } from "../../../app/i18n.js";

export function createTabsView(): Record<string, any> {
    const tabs = document.createElement("div");
    tabs.classList.add("mjr-tabs");

    const makeTab = (label: any, scope: any, tooltip: any) => {
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
    const tabWorkflow = makeTab(
        t("tab.workflow", "Workflow"),
        "workflow",
        t("tooltip.tab.workflow", "Browse saved workflows"),
    );
    const tabSimilar = makeTab(
        t("tab.similar", "Similar"),
        "similar",
        t("tooltip.tab.similar", "Browse current similar findings"),
    );
    tabSimilar.style.display = "none";
    tabs.appendChild(tabAll);
    tabs.appendChild(tabInputs);
    tabs.appendChild(tabOutputs);
    tabs.appendChild(tabCustom);
    tabs.appendChild(tabWorkflow);
    tabs.appendChild(tabSimilar);

    return {
        tabs,
        tabButtons: { tabAll, tabInputs, tabOutputs, tabCustom, tabWorkflow, tabSimilar },
    };
}
