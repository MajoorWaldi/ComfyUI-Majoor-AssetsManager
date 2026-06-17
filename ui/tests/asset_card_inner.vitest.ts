/* @vitest-environment happy-dom */

import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AssetCardInner from "../vue/components/grid/AssetCardInner.vue";
import { APP_CONFIG } from "../app/config.js";
import { MediaBlobCache } from "../features/grid/MediaBlobCache.js";

vi.mock("../features/grid/MediaBlobCache.js", () => ({
    MediaBlobCache: {
        acquireUrl: vi.fn(async () => null),
        hasError: vi.fn(() => false),
        markError: vi.fn(),
        releaseUrl: vi.fn(),
    },
}));

const buttonStub = {
    template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /></button>',
};

function assetCardGlobal(overrides = {}) {
    return {
        provide: {},
        stubs: {
            MButton: true,
            RatingBadge: true,
            TagsBadge: true,
            GenTimeBadge: true,
        },
        ...overrides,
        stubs: {
            MButton: true,
            RatingBadge: true,
            TagsBadge: true,
            GenTimeBadge: true,
            ...(overrides.stubs || {}),
        },
    };
}

describe("AssetCardInner media display", () => {
    beforeEach(() => {
        APP_CONFIG.GRID_VIDEO_AUTOPLAY_MODE = "hover";
        vi.clearAllMocks();
        vi.stubGlobal(
            "IntersectionObserver",
            class {
                observe() {}
                unobserve() {}
                disconnect() {}
            },
        );
    });

    it("uses stable /view URL and display_name for image cards", () => {
        const wrapper = mount(AssetCardInner, {
            props: {
                asset: {
                    id: "asset-1",
                    filename: "ComfyUI_00001_.png",
                    display_name: "Final render.png",
                    kind: "image",
                    type: "output",
                    subfolder: "renders",
                    thumbnail_url: "/api/assets/thumb-1",
                    preview_url: "/api/assets/preview-1",
                },
            },
            global: assetCardGlobal(),
        });

        expect(wrapper.find("img.mjr-thumb-media").attributes("src")).toBe(
            "/view?filename=ComfyUI_00001_.png&subfolder=renders&type=output",
        );
        expect(wrapper.find(".mjr-card-filename").text()).toBe("Final render");
        expect(wrapper.find(".mjr-card-filename").attributes("title")).toContain("ComfyUI_00001_.png");
        expect(wrapper.find(".mjr-card-filename").attributes("title")).toContain("Subfolder: renders");
    });

    it("uses preview_url as video source and thumbnail_url as poster", () => {
        const wrapper = mount(AssetCardInner, {
            props: {
                asset: {
                    id: "asset-2",
                    filename: "clip.mp4",
                    kind: "video",
                    type: "output",
                    preview_url: "/api/assets/clip-preview",
                    thumbnail_url: "/api/assets/clip-poster",
                },
            },
            global: assetCardGlobal(),
        });

        const video = wrapper.find("video.mjr-thumb-media");
        expect(video.attributes("data-src")).toBe("/api/assets/clip-preview");
        expect(video.attributes("poster")).toBe("/api/assets/clip-poster");
    });

    it("renders audio cards with generated cover artwork", () => {
        const wrapper = mount(AssetCardInner, {
            props: {
                asset: {
                    id: "audio-1",
                    filename: "videoplayback.m4a",
                    display_name: "Videoplayback.m4a",
                    kind: "audio",
                    type: "output",
                    duration: 379,
                },
            },
            global: {
                stubs: {
                    MButton: true,
                    RatingBadge: true,
                    TagsBadge: true,
                    GenTimeBadge: true,
                },
            },
        });

        expect(wrapper.find(".mjr-audio-thumb").exists()).toBe(true);
        expect(wrapper.find(".mjr-audio-thumb-title").text()).toBe("Videoplayback");
        expect(wrapper.find(".mjr-audio-thumb-subtitle").text()).toContain("M4A");
        expect(wrapper.findAll(".mjr-audio-thumb-waveform span").length).toBeGreaterThan(20);
        expect(wrapper.find(".mjr-audio-waveform-overlay").exists()).toBe(false);
    });

    it("loads the paused video source in hover mode so thumbnails are not black before hover", async () => {
        const wrapper = mount(AssetCardInner, {
            attachTo: document.body,
            props: {
                asset: {
                    id: "asset-3",
                    filename: "clip-no-poster.mp4",
                    kind: "video",
                    type: "output",
                    preview_url: "/api/assets/clip-no-poster",
                },
            },
            global: {
                stubs: {
                    MButton: true,
                    RatingBadge: true,
                    TagsBadge: true,
                    GenTimeBadge: true,
                },
            },
        });

        await nextTick();
        await Promise.resolve();

        const video = wrapper.find("video.mjr-thumb-media").element;
        expect(video.getAttribute("src") || video.src).toContain("/api/assets/clip-no-poster");
    });

    it("renders separators between card metadata fields", () => {
        const wrapper = mount(AssetCardInner, {
            props: {
                asset: {
                    id: "asset-4",
                    filename: "meta.png",
                    kind: "image",
                    type: "output",
                    width: 1024,
                    height: 1024,
                    mtime: 1717337460,
                },
            },
            global: {
                stubs: {
                    MButton: true,
                    RatingBadge: true,
                    TagsBadge: true,
                    GenTimeBadge: true,
                },
            },
        });

        const separators = wrapper.findAll(".mjr-meta-separator");
        expect(separators.length).toBeGreaterThanOrEqual(2);
        expect(separators.every((item) => item.text() === "/")).toBe(true);
        expect(wrapper.find(".mjr-card-meta-row").text()).toContain("1024x1024");
    });

    it("emits workflow actions from inline workflow buttons", async () => {
        const wrapper = mount(AssetCardInner, {
            props: {
                asset: {
                    id: "wf-1",
                    filename: "my_workflow.json",
                    kind: "workflow",
                    task: "T2I",
                    model_family: "Flux",
                    runs_on: "local",
                    node_count: 22,
                    favorite: true,
                },
            },
            global: {
                stubs: {
                    MButton: true,
                    RatingBadge: true,
                    TagsBadge: true,
                    GenTimeBadge: true,
                },
            },
        });

        const buttons = wrapper.findAll(".mjr-workflow-card-actions .mjr-workflow-action-btn");
        expect(buttons).toHaveLength(1);
        await buttons[0].trigger("click");

        const actions = wrapper
            .emitted("workflow-action")
            ?.map((eventArgs) => String(eventArgs?.[0]?.type || ""));
        expect(actions).toEqual(["favorite"]);
        expect(buttons[0].classes()).toContain("is-active");
    });

    it("renders workflow missing dependency warning chips", () => {
        const wrapper = mount(AssetCardInner, {
            props: {
                asset: {
                    id: "wf-missing",
                    filename: "broken_workflow.json",
                    kind: "workflow",
                    task: "I2V",
                    missing_nodes_count: 2,
                    missing_models_count: 1,
                },
            },
            global: {
                stubs: {
                    MButton: true,
                    RatingBadge: true,
                    TagsBadge: true,
                    GenTimeBadge: true,
                },
            },
        });

        const chips = wrapper.findAll(".mjr-workflow-missing-chip, .mjr-meta-workflow-missing");
        expect(chips.length).toBeGreaterThan(0);
        expect(wrapper.text()).toContain("Missing:");
    });

    it("shows workflow notes in the hover overlay", () => {
        const wrapper = mount(AssetCardInner, {
            props: {
                asset: {
                    id: "wf-notes",
                    filename: "noted_workflow.json",
                    kind: "workflow",
                    task: "I2I",
                    notes: "Use this workflow for sharp product edits.",
                },
            },
            global: {
                stubs: {
                    MButton: true,
                    RatingBadge: true,
                    TagsBadge: true,
                    GenTimeBadge: true,
                },
            },
        });

        const hover = wrapper.find(".mjr-card-hover-info");
        expect(hover.exists()).toBe(true);
        expect(hover.find(".mjr-hover-workflow-notes").text()).toBe(
            "Use this workflow for sharp product edits.",
        );
        expect(wrapper.find(".mjr-card-filename").attributes("title")).toContain(
            "Notes: Use this workflow for sharp product edits.",
        );
    });

    it("shows workflow fallback shell when no thumbnail is available", () => {
        const wrapper = mount(AssetCardInner, {
            props: {
                asset: {
                    id: "wf-no-thumb",
                    filename: "no_thumbnail.json",
                    kind: "workflow",
                    task: "T2I",
                    thumbnail_url: "",
                },
            },
            global: {
                stubs: {
                    MButton: true,
                    RatingBadge: true,
                    TagsBadge: true,
                    GenTimeBadge: true,
                },
            },
        });

        expect(wrapper.find(".mjr-workflow-thumb").exists()).toBe(true);
        expect(wrapper.find(".mjr-workflow-thumb .pi-sitemap").exists()).toBe(true);
        expect(wrapper.find("img.mjr-thumb-media").exists()).toBe(false);
    });

    it("uses graph_map_thumbnail_url as the workflow preview fallback", () => {
        const wrapper = mount(AssetCardInner, {
            props: {
                asset: {
                    id: "wf-graph-map",
                    filename: "graph_map_workflow.json",
                    kind: "workflow",
                    graph_map_thumbnail_url: "/mjr/am/workflows/graph-map-thumbnail?filepath=demo",
                },
            },
            global: {
                stubs: {
                    MButton: true,
                    RatingBadge: true,
                    TagsBadge: true,
                    GenTimeBadge: true,
                },
            },
        });

        expect(wrapper.find("img.mjr-thumb-media").attributes("src")).toBe(
            "/mjr/am/workflows/graph-map-thumbnail?filepath=demo",
        );
        expect(wrapper.find("img.mjr-workflow-graph-map-preview").exists()).toBe(true);
        expect(wrapper.find(".mjr-workflow-thumb.has-graph-map").exists()).toBe(true);
    });

    it("keeps the previous cached image visible while acquiring a new thumbnail blob", async () => {
        vi.useFakeTimers();
        const acquireResolvers = [];
        MediaBlobCache.acquireUrl.mockImplementation(
            (url) =>
                new Promise((resolve) => {
                    acquireResolvers.push({ url, resolve });
                }),
        );

        const wrapper = mount(AssetCardInner, {
            attachTo: document.body,
            props: {
                asset: {
                    id: "asset-cache",
                    filename: "cache-a.png",
                    kind: "image",
                    subfolder: "renders",
                },
            },
            global: {
                stubs: {
                    MButton: true,
                    RatingBadge: true,
                    TagsBadge: true,
                    GenTimeBadge: true,
                },
            },
        });

        await nextTick();
        await vi.advanceTimersByTimeAsync(120);
        acquireResolvers.shift().resolve("blob:cache-a");
        await nextTick();
        await Promise.resolve();
        await Promise.resolve();
        await nextTick();
        expect(wrapper.find("img.mjr-thumb-media").attributes("src")).toBe("blob:cache-a");

        await wrapper.setProps({
            asset: {
                id: "asset-cache",
                filename: "cache-b.png",
                kind: "image",
                subfolder: "renders",
            },
        });
        await nextTick();

        expect(wrapper.find("img.mjr-thumb-media").attributes("src")).toBe("blob:cache-a");

        await vi.advanceTimersByTimeAsync(120);
        acquireResolvers.shift().resolve("blob:cache-b");
        await nextTick();
        await Promise.resolve();
        await Promise.resolve();
        await nextTick();

        expect(wrapper.find("img.mjr-thumb-media").attributes("src")).toBe("blob:cache-b");
        expect(MediaBlobCache.releaseUrl).toHaveBeenCalledWith(
            "/view?filename=cache-a.png&subfolder=renders&type=output",
        );
        vi.useRealTimers();
    });

    it("retries image rendering when a reused card receives a new image source after an error", async () => {
        const wrapper = mount(AssetCardInner, {
            props: {
                asset: {
                    id: "asset-retry",
                    filename: "broken.png",
                    kind: "image",
                    subfolder: "renders",
                },
            },
            global: {
                stubs: {
                    MButton: true,
                    RatingBadge: true,
                    TagsBadge: true,
                    GenTimeBadge: true,
                },
            },
        });

        await wrapper.find("img.mjr-thumb-media").trigger("error");
        await nextTick();
        expect(wrapper.find(".mjr-media-error-placeholder").exists()).toBe(true);

        await wrapper.setProps({
            asset: {
                id: "asset-retry",
                filename: "fixed.png",
                kind: "image",
                subfolder: "renders",
            },
        });
        await nextTick();

        const img = wrapper.find("img.mjr-thumb-media");
        expect(img.exists()).toBe(true);
        expect(img.attributes("src")).toBe("/view?filename=fixed.png&subfolder=renders&type=output");
    });

    it("retries workflow thumbnail rendering when the thumbnail URL changes after an error", async () => {
        const wrapper = mount(AssetCardInner, {
            props: {
                asset: {
                    id: "wf-retry",
                    filename: "workflow.json",
                    kind: "workflow",
                    thumbnail_url: "/thumbs/broken.png",
                },
            },
            global: {
                stubs: {
                    MButton: true,
                    RatingBadge: true,
                    TagsBadge: true,
                    GenTimeBadge: true,
                },
            },
        });

        await wrapper.find("img.mjr-thumb-media").trigger("error");
        await nextTick();
        expect(wrapper.find("img.mjr-thumb-media").exists()).toBe(false);

        await wrapper.setProps({
            asset: {
                id: "wf-retry",
                filename: "workflow.json",
                kind: "workflow",
                thumbnail_url: "/thumbs/fixed.png",
            },
        });
        await nextTick();

        const img = wrapper.find("img.mjr-thumb-media");
        expect(img.exists()).toBe(true);
        expect(img.attributes("src")).toBe("/thumbs/fixed.png");
    });

    it("detaches video thumbnail src when the card is unmounted", async () => {
        const wrapper = mount(AssetCardInner, {
            attachTo: document.body,
            props: {
                asset: {
                    id: "video-cache",
                    filename: "clip.mp4",
                    kind: "video",
                    preview_url: "/api/assets/clip",
                },
            },
            global: {
                stubs: {
                    MButton: true,
                    RatingBadge: true,
                    TagsBadge: true,
                    GenTimeBadge: true,
                },
            },
        });

        await nextTick();
        await Promise.resolve();

        const video = wrapper.find("video.mjr-thumb-media").element;
        video.setAttribute("src", "/api/assets/clip");

        wrapper.unmount();

        expect(video.getAttribute("src")).toBeNull();
    });

    it("shows only the generation stack action when an asset also belongs to a duplicate stack", () => {
        const stackService = {
            openStackGroup: vi.fn(),
            openDupGroup: vi.fn(),
        };
        const wrapper = mount(AssetCardInner, {
            props: {
                asset: {
                    id: "stack-and-dups",
                    filename: "stacked.png",
                    kind: "image",
                    stack_id: "run-1",
                    stack_asset_count: 2,
                    _mjrDupStack: true,
                    _mjrDupCount: 2,
                },
            },
            global: assetCardGlobal({
                provide: { mjrStackService: stackService },
                stubs: { MButton: buttonStub },
            }),
        });

        expect(wrapper.find(".mjr-stack-group-button").exists()).toBe(true);
        expect(wrapper.find(".mjr-dup-stack-button").exists()).toBe(false);
    });

    it("keeps the duplicate stack action available when there is no generation stack", () => {
        const stackService = {
            openStackGroup: vi.fn(),
            openDupGroup: vi.fn(),
        };
        const wrapper = mount(AssetCardInner, {
            props: {
                asset: {
                    id: "dups-only",
                    filename: "copy.png",
                    kind: "image",
                    _mjrDupStack: true,
                    _mjrDupCount: 2,
                },
            },
            global: assetCardGlobal({
                provide: { mjrStackService: stackService },
                stubs: { MButton: buttonStub },
            }),
        });

        expect(wrapper.find(".mjr-stack-group-button").exists()).toBe(false);
        expect(wrapper.find(".mjr-dup-stack-button").exists()).toBe(true);
    });
});
