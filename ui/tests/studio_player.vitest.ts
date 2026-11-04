/* @vitest-environment happy-dom */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import StudioImageStage from "../vue/components/viewer/studio/StudioImageStage.vue";
import StudioPlayer from "../vue/components/viewer/studio/StudioPlayer.vue";

const MButton = {
    template: '<button v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /></button>',
};

describe("StudioPlayer", () => {
    it("renders review controls and drives the media element", async () => {
        const wrapper = mount(StudioPlayer, {
            props: {
                src: "/view?filename=clip.mp4",
                kind: "video",
                fps: 24,
                frameCount: 48,
                filename: "clip.mp4",
            },
            global: { stubs: { MButton } },
        });
        const video = wrapper.find("video").element as HTMLVideoElement;
        const pause = vi.spyOn(video, "pause").mockImplementation(() => {});
        Object.defineProperty(video, "duration", { configurable: true, value: 2 });
        await wrapper.find("video").trigger("loadedmetadata");

        // Frame stepping pauses and lands on the next frame.
        (wrapper.vm as any).stepFrame(1);
        expect(pause).toHaveBeenCalled();
        expect(Math.floor(video.currentTime * 24 + 1e-6)).toBe(1);

        // A-B loop markers, speed cycling, chip with frame counter.
        (wrapper.vm as any).setLoopA();
        (wrapper.vm as any).cycleRate(1);
        await wrapper.vm.$nextTick();
        expect(video.playbackRate).toBe(1.5);
        expect(wrapper.text()).toContain("24 fps");
        expect(wrapper.find(".mjr-studio-btn.is-on").exists()).toBe(true);

        const load = vi.spyOn(video, "load").mockImplementation(() => {});
        wrapper.unmount();
        expect(video.getAttribute("src")).toBeNull(); // released, not just paused
        expect(load).toHaveBeenCalled();
    });

    it("renders an audio player without frame controls", () => {
        const wrapper = mount(StudioPlayer, {
            props: { src: "/view?filename=a.mp3", kind: "audio", filename: "a.mp3" },
            global: { stubs: { MButton } },
        });
        expect(wrapper.find("audio").exists()).toBe(true);
        expect(wrapper.find("video").exists()).toBe(false);
        expect(wrapper.text()).not.toContain("fps");
        wrapper.unmount();
    });
});

describe("StudioImageStage", () => {
    it("fits on load and toggles to 100 % on double-click", async () => {
        const wrapper = mount(StudioImageStage, {
            props: { src: "/view?filename=a.png", alt: "a.png" },
        });
        const stage = wrapper.find(".mjr-studio-stage").element as HTMLElement;
        stage.getBoundingClientRect = () =>
            ({ width: 500, height: 500, left: 0, top: 0 }) as DOMRect;
        const img = wrapper.find("img").element as HTMLImageElement;
        Object.defineProperty(img, "naturalWidth", { value: 1000 });
        Object.defineProperty(img, "naturalHeight", { value: 1000 });
        await wrapper.find("img").trigger("load");
        expect(wrapper.emitted("zoom")?.at(-1)).toEqual([0.5]);

        await wrapper.find(".mjr-studio-stage").trigger("dblclick");
        expect(wrapper.emitted("zoom")?.at(-1)).toEqual([1]);
        wrapper.unmount();
    });
});
