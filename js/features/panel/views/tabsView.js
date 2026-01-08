export function createTabsView() {
    const tabs = document.createElement("div");
    tabs.classList.add("mjr-tabs");

    const makeTab = (label, scope) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = label;
        btn.dataset.scope = scope;
        btn.classList.add("mjr-tab");
        return btn;
    };

    const tabAll = makeTab("All", "all");
    const tabInputs = makeTab("Inputs", "input");
    const tabOutputs = makeTab("Outputs", "output");
    const tabCustom = makeTab("Custom", "custom");
    tabs.appendChild(tabAll);
    tabs.appendChild(tabInputs);
    tabs.appendChild(tabOutputs);
    tabs.appendChild(tabCustom);

    return {
        tabs,
        tabButtons: { tabAll, tabInputs, tabOutputs, tabCustom }
    };
}

