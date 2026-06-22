// @vitest-environment happy-dom

import { mount } from "@vue/test-utils";
import { nextTick, reactive } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";

const panelStore = reactive({
    kindFilter: "",
    lastGridCount: 0,
    lastGridTotal: 0,
    viewScope: "output",
});

vi.mock("../stores/usePanelStore.js", () => ({
    usePanelStore: () => panelStore,
}));

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback || _key,
}));

vi.mock("../features/panel/views/contextPillsView.js", () => ({
    createContextPillsView: () => ({
        wrap: document.createElement("div"),
        update: vi.fn(),
    }),
}));

vi.mock("../vue/components/panel/summaryBarState.js", () => ({
    buildSummaryBarState: () => ({
        shown: 0,
        total: 0,
        activeScope: "output",
        summaryText: "",
        duplicateText: "",
        showDuplicates: false,
        rawQuery: "",
    }),
}));

const MButtonStub = {
    props: {
        severity: String,
        text: Boolean,
        rounded: Boolean,
        disabled: Boolean,
    },
    inheritAttrs: false,
    template: '<button v-bind="$attrs" :disabled="disabled"><slot /></button>',
};

describe("SummaryBarSection media shortcut icons", () => {
    afterEach(() => {
        panelStore.kindFilter = "";
    });

    it("toggles kindFilter and emits mjr:filters-changed", async () => {
        const filterEvents = [];
        const onFiltersChanged = () => filterEvents.push(true);
        window.addEventListener("mjr:filters-changed", onFiltersChanged);

        const mod = await import("../vue/components/panel/SummaryBarSection.vue");
        const wrapper = mount(mod.default, {
            global: {
                stubs: {
                    MButton: MButtonStub,
                },
            },
        });

        const buttons = wrapper.findAll(".mjr-media-shortcut-btn");
        expect(buttons).toHaveLength(4);

        await buttons[0].trigger("click");
        await nextTick();
        expect(panelStore.kindFilter).toBe("image");
        expect(filterEvents.length).toBe(1);
        expect(buttons[0].classes()).toContain("mjr-context-active");

        await buttons[0].trigger("click");
        await nextTick();
        expect(panelStore.kindFilter).toBe("");
        expect(filterEvents.length).toBe(2);

        await buttons[3].trigger("click");
        await nextTick();
        expect(panelStore.kindFilter).toBe("model3d");
        expect(filterEvents.length).toBe(3);

        wrapper.unmount();
        window.removeEventListener("mjr:filters-changed", onFiltersChanged);
    });
});
