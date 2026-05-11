// @vitest-environment happy-dom

import { mount } from "@vue/test-utils";
import { reactive, nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const panelStore = reactive({
    sort: "mtime_desc",
    scope: "output",
    viewScope: "output",
    similarResults: [],
    similarTitle: "",
});

vi.mock("../stores/usePanelStore.js", () => ({
    usePanelStore: () => panelStore,
}));

vi.mock("../api/client.js", () => ({
    get: vi.fn(async () => ({ ok: false })),
    getWatcherStatus: vi.fn(async () => ({ ok: true, data: { enabled: true } })),
    toggleWatcher: vi.fn(async () => ({ ok: true })),
}));

vi.mock("../app/i18n.js", () => ({
    t: (key, fallback) => fallback || key,
}));

vi.mock("../app/versionCheck.js", () => ({
    VERSION_UPDATE_EVENT: "mjr:version-update",
    getStoredVersionUpdateState: () => ({ available: false }),
}));

vi.mock("../app/events.js", () => ({
    EVENTS: {
        MFV_TOGGLE: "mjr:mfv-toggle",
        MFV_VISIBILITY_CHANGED: "mjr:mfv-visibility-changed",
    },
}));

vi.mock("../utils/tooltipShortcuts.js", () => ({
    setTooltipHint: (el, label, hint) => {
        if (!el) return;
        const full = hint ? `${label} (${hint})` : label;
        el.setAttribute("title", full);
        el.setAttribute("aria-label", full);
    },
}));

const STUB_COMPONENTS = {
    SearchBar: { template: "<div><slot /></div>" },
    SortPopover: { template: "<div />" },
    FilterPopover: { template: "<div />" },
    CollectionsPopover: { template: "<div />" },
    PinnedFoldersPopover: { template: "<div />" },
    CustomRootsPopover: { template: "<div />" },
    MessagePopover: { template: "<div />" },
};

async function flushMountedState() {
    await nextTick();
    await Promise.resolve();
    await nextTick();
}

describe("HeaderSection MFV button", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    afterEach(() => {
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    it("applies the active class when MFV visibility changes", async () => {
        const mod = await import("../vue/components/panel/HeaderSection.vue");
        const wrapper = mount(mod.default, {
            global: { stubs: STUB_COMPONENTS },
        });
        await flushMountedState();

        const button = wrapper.element.querySelector(".mjr-am-header-tools > button.mjr-icon-btn");
        const icon = button?.querySelector("i");
        expect(button).toBeTruthy();
        expect(icon?.className).toBe("pi pi-images");
        expect(button.getAttribute("title")).toContain("Majoor Floating Viewer");
        expect(button.classList.contains("mjr-mfv-btn-active")).toBe(false);

        window.dispatchEvent(
            new CustomEvent("mjr:mfv-visibility-changed", { detail: { visible: true } }),
        );
        await flushMountedState();

        expect(button.classList.contains("mjr-mfv-btn-active")).toBe(true);
        wrapper.unmount();
    });

    it("starts active when the floating viewer is already visible in the DOM", async () => {
        const liveViewer = document.createElement("div");
        liveViewer.className = "mjr-mfv is-visible";
        document.body.appendChild(liveViewer);

        const mod = await import("../vue/components/panel/HeaderSection.vue");
        const wrapper = mount(mod.default, {
            global: { stubs: STUB_COMPONENTS },
        });
        await flushMountedState();

        const button = wrapper.element.querySelector(".mjr-am-header-tools > button.mjr-icon-btn");
        const icon = button?.querySelector("i");
        expect(button).toBeTruthy();
        expect(icon?.className).toBe("pi pi-images");
        expect(button.classList.contains("mjr-mfv-btn-active")).toBe(true);
        wrapper.unmount();
    });
});
