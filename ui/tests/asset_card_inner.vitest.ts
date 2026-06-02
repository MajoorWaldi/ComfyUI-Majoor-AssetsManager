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
});
