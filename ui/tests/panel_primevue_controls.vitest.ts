// @vitest-environment happy-dom

import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

const panelStore = reactive({
    sort: "mtime_desc",
    kindFilter: "",
    workflowOnly: false,
    workflowType: "",
    minRating: 0,
    minSizeMB: 0,
    maxSizeMB: 0,
    minWidth: 0,
    minHeight: 0,
    maxWidth: 0,
    maxHeight: 0,
    dateRangeFilter: "",
    dateExactFilter: "",
});

vi.mock("../stores/usePanelStore.js", () => ({
    usePanelStore: () => panelStore,
}));

vi.mock("../app/i18n.js", () => ({
    t: (key, fallback) => fallback || key,
}));

const MButtonStub = {
    props: {
        severity: String,
        text: Boolean,
        rounded: Boolean,
    },
    inheritAttrs: false,
    template: '<button v-bind="$attrs"><slot /></button>',
};

const MInputTextStub = {
    inheritAttrs: false,
    template: '<input v-bind="$attrs" />',
};

const MSelectStub = {
    props: {
        modelValue: { type: [String, Number, Boolean, null], default: "" },
        options: { type: Array, default: () => [] },
        optionLabel: { type: String, default: "label" },
        optionValue: { type: String, default: "value" },
    },
    emits: ["update:modelValue"],
    inheritAttrs: false,
    template: `
        <select
            v-bind="$attrs"
            :value="modelValue"
            @change="$emit('update:modelValue', $event.target.value)"
        >
            <option
                v-for="option in options"
                :key="String(option?.[optionValue] ?? '')"
                :value="option?.[optionValue] ?? ''"
            >
                {{ option?.[optionLabel] ?? option?.[optionValue] ?? '' }}
            </option>
        </select>
    `,
};

const MCheckboxStub = {
    props: {
        modelValue: Boolean,
        binary: Boolean,
    },
    emits: ["update:modelValue"],
    inheritAttrs: false,
    template: `
        <input
            v-bind="$attrs"
            type="checkbox"
            :checked="modelValue"
            @change="$emit('update:modelValue', $event.target.checked)"
        />
    `,
};

const MDialogStub = {
    props: {
        visible: Boolean,
        modal: Boolean,
        showHeader: Boolean,
        closable: Boolean,
        closeOnEscape: Boolean,
        draggable: Boolean,
        autoZIndex: Boolean,
        appendTo: String,
        contentClass: String,
    },
    inheritAttrs: false,
    template: '<div v-if="visible" v-bind="$attrs"><slot /></div>',
};

const MMenuStub = {
    props: {
        model: { type: Array, default: () => [] },
    },
    inheritAttrs: false,
    template: `
        <div v-bind="$attrs">
            <div
                v-for="item in model"
                :key="String(item?.key ?? item?.label ?? '')"
                @click="item?.command?.({ item })"
            >
                <slot name="item" :item="item" :label="item?.label" :props="{}">
                    {{ item?.label }}
                </slot>
            </div>
        </div>
    `,
};

const MListboxStub = {
    props: {
        modelValue: { type: null, default: null },
        options: { type: Array, default: () => [] },
    },
    emits: ["update:modelValue", "change"],
    inheritAttrs: false,
    template: `
        <div v-bind="$attrs">
            <div
                v-for="(option, index) in options"
                :key="String(option)"
                @click="$emit('update:modelValue', option); $emit('change', { value: option })"
            >
                <slot name="option" :option="option" :index="index">{{ option }}</slot>
            </div>
        </div>
    `,
};

const MTreeStub = {
    props: {
        value: { type: Array, default: () => [] },
    },
    inheritAttrs: false,
    template: `
        <div v-bind="$attrs">
            <div v-for="node in value" :key="String(node?.key ?? node?.label ?? '')">
                <slot :node="node">{{ node?.label }}</slot>
            </div>
        </div>
    `,
};

const MVirtualScrollerStub = {
    props: {
        items: { type: Array, default: () => [] },
        itemSize: Number,
        scrollHeight: String,
        numToleratedItems: Number,
    },
    inheritAttrs: false,
    template: `
        <div v-bind="$attrs">
            <div v-for="(item, index) in items" :key="String(item?.id ?? item?.name ?? index)">
                <slot name="item" :item="item" :options="{ index }" />
            </div>
        </div>
    `,
};

const GLOBAL_STUBS = {
    MButton: MButtonStub,
    MInputText: MInputTextStub,
    MSelect: MSelectStub,
    MCheckbox: MCheckboxStub,
    MDialog: MDialogStub,
    MMenu: MMenuStub,
    MListbox: MListboxStub,
    MTree: MTreeStub,
    MVirtualScroller: MVirtualScrollerStub,
};

describe("PrimeVue-backed panel controls", () => {
    beforeEach(() => {
        Object.assign(panelStore, {
            sort: "mtime_desc",
            kindFilter: "",
            workflowOnly: false,
            workflowType: "",
            minRating: 0,
            minSizeMB: 0,
            maxSizeMB: 0,
            minWidth: 0,
            minHeight: 0,
            maxWidth: 0,
            maxHeight: 0,
            dateRangeFilter: "",
            dateExactFilter: "",
        });
    });

    afterEach(() => {
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    it("keeps SortPopover menu choices reactive through MMenu", async () => {
        const sortEvents = [];
        const listener = (event) => sortEvents.push(event.detail);
        window.addEventListener("mjr:sort-changed", listener);

        const mod = await import("../vue/components/panel/SortPopover.vue");
        const wrapper = mount(mod.default, {
            global: { stubs: GLOBAL_STUBS },
        });

        await wrapper.findAll(".mjr-menu-item")[2].trigger("click");

        expect(panelStore.sort).toBe("name_asc");
        expect(sortEvents).toEqual([{ sort: "name_asc" }]);

        window.removeEventListener("mjr:sort-changed", listener);
        wrapper.unmount();
    });

    it("exposes FilterPopover PrimeVue inputs as real DOM elements", async () => {
        const filterEvents = [];
        const listener = () => filterEvents.push(true);
        window.addEventListener("mjr:filters-changed", listener);

        const mod = await import("../vue/components/panel/FilterPopover.vue");
        const wrapper = mount(mod.default, {
            global: { stubs: GLOBAL_STUBS },
        });

        expect(wrapper.vm.minSizeInput).toBeInstanceOf(HTMLInputElement);
        expect(wrapper.vm.maxSizeInput).toBeInstanceOf(HTMLInputElement);

        wrapper.vm.minSizeInput.value = "2.5";
        wrapper.vm.maxSizeInput.value = "1";
        wrapper.vm.minSizeInput.dispatchEvent(new Event("change", { bubbles: true }));

        expect(panelStore.minSizeMB).toBe(2.5);
        expect(panelStore.maxSizeMB).toBe(2.5);
        expect(wrapper.vm.maxSizeInput.value).toBe("2.5");
        expect(filterEvents.length).toBeGreaterThan(0);

        window.removeEventListener("mjr:filters-changed", listener);
        wrapper.unmount();
    });

    it("keeps FilterPopover select and checkbox facades synced with Pinia state", async () => {
        const mod = await import("../vue/components/panel/FilterPopover.vue");
        const wrapper = mount(mod.default, {
            global: { stubs: GLOBAL_STUBS },
        });

        expect(wrapper.vm.kindSelect.value).toBe("");
        expect(wrapper.vm.wfCheckbox.checked).toBe(false);

        wrapper.vm.kindSelect.value = "video";
        wrapper.vm.wfCheckbox.checked = true;
        wrapper.vm.workflowTypeSelect.value = "i2i";
        wrapper.vm.ratingSelect.value = "4";
        wrapper.vm.resolutionPresetSelect.value = "fhd";
        wrapper.vm.dateRangeSelect.value = "today";

        expect(panelStore.kindFilter).toBe("video");
        expect(panelStore.workflowOnly).toBe(true);
        expect(panelStore.workflowType).toBe("I2I");
        expect(panelStore.minRating).toBe(4);
        expect(panelStore.minWidth).toBe(1920);
        expect(panelStore.minHeight).toBe(1080);
        expect(panelStore.dateRangeFilter).toBe("today");

        wrapper.unmount();
    });

    it("exposes CustomRootsPopover PrimeVue actions as real DOM buttons", async () => {
        const mod = await import("../vue/components/panel/CustomRootsPopover.vue");
        const wrapper = mount(mod.default, {
            global: { stubs: GLOBAL_STUBS },
        });

        expect(wrapper.vm.customSelect.value).toBe("");
        expect(wrapper.vm.customSelect.options).toHaveLength(1);
        expect(wrapper.vm.customAddBtn).toBeInstanceOf(HTMLButtonElement);
        expect(wrapper.vm.customRemoveBtn).toBeInstanceOf(HTMLButtonElement);
        expect(wrapper.vm.customRemoveBtn.disabled).toBe(true);

        const option = document.createElement("option");
        option.value = "root-a";
        option.textContent = "Root A";
        wrapper.vm.customSelect.innerHTML = "";
        wrapper.vm.customSelect.appendChild(option);
        wrapper.vm.customSelect.value = "root-a";

        expect(wrapper.vm.customSelect.selectedIndex).toBe(0);
        expect(wrapper.vm.customSelect.selectedOptions[0].text).toBe("Root A");

        wrapper.unmount();
    });

    it("exposes MessagePopover PrimeVue tabs and actions as real DOM buttons", async () => {
        const mod = await import("../vue/components/panel/MessagePopover.vue");
        const wrapper = mount(mod.default, {
            global: { stubs: GLOBAL_STUBS },
        });

        expect(wrapper.vm.markReadBtn).toBeInstanceOf(HTMLButtonElement);
        expect(wrapper.vm.messageTabBtn).toBeInstanceOf(HTMLButtonElement);
        expect(wrapper.vm.historyTabBtn).toBeInstanceOf(HTMLButtonElement);
        expect(wrapper.vm.shortcutsTabBtn).toBeInstanceOf(HTMLButtonElement);
        expect(wrapper.vm.messageList).toBeInstanceOf(HTMLDivElement);
        expect(wrapper.vm.historyPanel).toBeInstanceOf(HTMLDivElement);

        wrapper.unmount();
    });

    it("renders pinned folders through Vue-owned MButton menu items", async () => {
        const open = vi.fn();
        const unpin = vi.fn();
        const mod = await import("../vue/components/panel/PinnedFoldersPopover.vue");
        const wrapper = mount(mod.default, {
            global: { stubs: GLOBAL_STUBS },
        });

        wrapper.vm.setPinnedFolders({
            roots: [{ id: "root-a", label: "Root A", path: "C:/assets/root-a" }],
            emptyLabel: "No pinned folders",
            unpinLabel: "Unpin folder",
            onOpen: open,
            onUnpin: unpin,
        });
        await nextTick();

        const buttons = wrapper.findAll("button.mjr-menu-item");
        expect(buttons).toHaveLength(2);
        expect(wrapper.text()).toContain("Root A");
        expect(wrapper.text()).toContain("C:/assets/root-a");

        await buttons[0].trigger("click");
        await buttons[1].trigger("click");

        expect(open).toHaveBeenCalledWith({
            id: "root-a",
            label: "Root A",
            path: "C:/assets/root-a",
        });
        expect(unpin.mock.calls[0][0]).toEqual({
            id: "root-a",
            label: "Root A",
            path: "C:/assets/root-a",
        });

        wrapper.unmount();
    });

    it("renders folder breadcrumbs through Vue-owned MButton actions", async () => {
        const back = vi.fn();
        const openCats = vi.fn();
        const mod = await import("../vue/components/panel/SummaryBarSection.vue");
        const wrapper = mount(mod.default, {
            global: { stubs: GLOBAL_STUBS },
        });

        wrapper.vm.setFolderBreadcrumb({
            visible: true,
            back: { label: "Back", disabled: false, onClick: back },
            up: { label: "Up", disabled: true, onClick: vi.fn() },
            items: [
                { label: "Computer", target: "", current: false, onClick: vi.fn() },
                { label: "cats", target: "animals/cats", current: true, onClick: openCats },
            ],
        });
        await nextTick();

        const breadcrumb = wrapper.find(".mjr-folder-breadcrumb");
        expect(breadcrumb.classes()).toContain("is-visible");
        const buttons = breadcrumb.findAll("button");
        expect(buttons).toHaveLength(4);
        expect(buttons[1].attributes("disabled")).toBeDefined();
        expect(buttons[3].attributes("disabled")).toBeDefined();

        await buttons[0].trigger("click");
        await buttons[3].trigger("click");

        expect(back).toHaveBeenCalledTimes(1);
        expect(openCats).not.toHaveBeenCalled();

        wrapper.unmount();
    });
});
