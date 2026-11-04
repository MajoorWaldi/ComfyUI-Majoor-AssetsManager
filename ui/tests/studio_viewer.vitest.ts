/* @vitest-environment happy-dom */

import { flushPromises, mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/client.js", async (importOriginal) => ({
    ...((await importOriginal()) as object),
    getAssetMetadata: vi.fn(async () => ({ ok: true, data: { geninfo: { seed: { value: 7 } } } })),
    getFileMetadataScoped: vi.fn(async () => ({ ok: false })),
    getViewerInfo: vi.fn(async () => ({ ok: true, data: { fps_raw: "24/1", frame_count: 48 } })),
    updateAssetRating: vi.fn(async () => ({ ok: true, data: {} })),
}));
vi.mock("../features/viewer/genInfo.js", () => ({
    ensureViewerMetadataAsset: vi.fn(async (asset: any) => ({
        ...asset,
        geninfo: { seed: { value: 7 } },
    })),
}));

import { updateAssetRating } from "../api/client.js";
import {
    closeStudioViewer,
    openStudioViewer,
    studioViewerState,
} from "../features/viewer/studio/studioViewerState.js";
import StudioViewer from "../vue/components/viewer/studio/StudioViewer.vue";

const ASSETS = [
    { id: 1, filename: "render_a.png", kind: "image", width: 1024, height: 1024, type: "output" },
    { id: 2, filename: "render_b.png", kind: "image", width: 512, height: 512, type: "output" },
    { id: 3, filename: "clip.mp4", kind: "video", type: "output" },
];

let mounted: any[] = [];

function mountViewer() {
    const wrapper = mount(StudioViewer, {
        attachTo: document.body,
        global: {
            stubs: {
                teleport: true,
                MButton: {
                    template:
                        '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /></button>',
                },
                RatingEditor: true,
                TagsEditor: true,
                SidebarGenerationSection: {
                    props: ["asset"],
                    template: '<div class="gen-stub">{{ asset?.geninfo?.seed?.value }}</div>',
                },
                SidebarWorkflowSection: true,
                SidebarFileInfoSection: true,
                StudioImageStage: {
                    props: ["src", "compare", "compareSrc", "mediaFilter"],
                    template:
                        '<div class="stage-stub" :data-src="src" :data-compare="compare" :data-compare-src="compareSrc || \'\'" />',
                },
                StudioZebra: true,
                StudioScopes: true,
                StudioProbe: true,
                StudioModel3D: true,
                StudioPlayer: {
                    props: ["src", "fps", "frameCount"],
                    template: '<div class="player-stub" :data-fps="fps" />',
                },
            },
        },
    });
    mounted.push(wrapper);
    return wrapper;
}

function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = window) {
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
}

describe("StudioViewer", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        closeStudioViewer();
    });
    afterEach(() => {
        for (const wrapper of mounted.splice(0)) wrapper.unmount();
        closeStudioViewer();
        document.body.innerHTML = "";
    });

    it("renders the current asset with its generation data and navigates", async () => {
        const wrapper = mountViewer();
        openStudioViewer(ASSETS, 0);
        await flushPromises();

        expect(wrapper.find(".mjr-studio__filename").text()).toBe("render_a.png");
        expect(wrapper.find(".mjr-studio__counter").text()).toBe("1 / 3");
        expect(wrapper.find(".mjr-studio__summary").text()).toContain("1024×1024");
        expect(wrapper.find(".gen-stub").text()).toBe("7");
        expect(wrapper.findAll(".mjr-studio__thumb")).toHaveLength(3);

        press("ArrowRight");
        await flushPromises();
        expect(studioViewerState.index).toBe(1);
        expect(wrapper.find(".mjr-studio__filename").text()).toBe("render_b.png");

        press("ArrowLeft");
        press("ArrowLeft");
        await flushPromises();
        expect(studioViewerState.index).toBe(2); // wraps around
        expect(wrapper.find(".player-stub").attributes("data-fps")).toBe("24");

        press("Escape");
        await nextTick();
        expect(studioViewerState.open).toBe(false);
        expect(wrapper.find(".mjr-studio").exists()).toBe(false);
    });

    it("rates with number keys and ignores shortcuts while typing", async () => {
        mountViewer();
        openStudioViewer(ASSETS, 0);
        await flushPromises();

        const event = press("4");
        await flushPromises();
        expect(updateAssetRating).toHaveBeenCalledWith(ASSETS[0], 4);
        expect(event.defaultPrevented).toBe(true);

        const input = document.createElement("input");
        document.body.appendChild(input);
        press("ArrowRight", {}, input);
        await nextTick();
        expect(studioViewerState.index).toBe(0);
    });

    it("toggles A/B compare in place and picks the next same-kind asset as B", async () => {
        const wrapper = mountViewer();
        openStudioViewer(ASSETS, 1);
        await flushPromises();

        press("c");
        await nextTick();
        expect(studioViewerState.open).toBe(true);
        expect(wrapper.emitted("open-classic")).toBeUndefined();
        const stage = wrapper.find(".stage-stub");
        expect(stage.attributes("data-compare")).toBe("wipe");
        // B skips the video and wraps to the other image.
        expect(stage.attributes("data-compare-src")).toMatch(/\/asset\/1$/);

        press("x");
        await flushPromises();
        expect(studioViewerState.index).toBe(0);
        expect(wrapper.find(".stage-stub").attributes("data-compare-src")).toMatch(/\/asset\/2$/);

        press("c");
        await nextTick();
        expect(wrapper.find(".stage-stub").attributes("data-compare")).toBe("off");
    });

    it("opens with the compare mode requested by the caller", async () => {
        const wrapper = mountViewer();
        openStudioViewer(ASSETS, 0, "sidebyside");
        await flushPromises();
        expect(wrapper.find(".stage-stub").attributes("data-compare")).toBe("side");
    });

    it("drives review tools from the rail shortcuts", async () => {
        const wrapper = mountViewer();
        openStudioViewer(ASSETS, 0);
        await flushPromises();
        expect(wrapper.find(".mjr-studio-rail").exists()).toBe(true);

        press("z");
        press("g");
        press("p");
        await nextTick();
        const rail = wrapper.findComponent({ name: "StudioToolRail" });
        const tools = rail.props("tools") as any;
        expect(tools.zebra).toBe(true);
        expect(tools.grid).toBe("thirds");
        expect(tools.probe).toBe(true);

        press("r");
        await nextTick();
        expect(tools.zebra).toBe(false);
        expect(tools.grid).toBe("off");
    });
});
