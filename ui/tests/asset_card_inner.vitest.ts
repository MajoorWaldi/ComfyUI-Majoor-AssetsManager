/* @vitest-environment happy-dom */

import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AssetCardInner from "../vue/components/grid/AssetCardInner.vue";
import { APP_CONFIG } from "../app/config.js";

vi.mock("../features/grid/MediaBlobCache.js", () => ({
    MediaBlobCache: {
        acquireUrl: vi.fn(async () => null),
        hasError: vi.fn(() => false),
        markError: vi.fn(),
        releaseUrl: vi.fn(),
    },
}));

describe("AssetCardInner media display", () => {
    beforeEach(() => {
        APP_CONFIG.GRID_VIDEO_AUTOPLAY_MODE = "hover";
        vi.stubGlobal(
            "IntersectionObserver",
            class {
                observe() {}
                unobserve() {}
                disconnect() {}
            },
        );
    });

    it("prefers official thumbnail_url and display_name for image cards", () => {
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
            global: {
                stubs: {
                    MButton: true,
                    RatingBadge: true,
                    TagsBadge: true,
                    GenTimeBadge: true,
                },
            },
        });

        expect(wrapper.find("img.mjr-thumb-media").attributes("src")).toBe("/api/assets/thumb-1");
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
            global: {
                stubs: {
                    MButton: true,
                    RatingBadge: true,
                    TagsBadge: true,
                    GenTimeBadge: true,
                },
            },
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
                    preview_url: "/api/assets/meta",
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
});
