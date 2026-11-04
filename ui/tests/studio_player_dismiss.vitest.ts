/* @vitest-environment happy-dom */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import StudioPlayer from "../vue/components/viewer/studio/StudioPlayer.vue";

const MButton = { template: '<button v-bind="$attrs"><slot /></button>' };

function mountPlayer(props: Record<string, unknown>) {
    return mount(StudioPlayer, {
        props: { src: "/a.mp3", kind: "audio", ...props },
        global: { stubs: { MButton } },
    });
}

describe("StudioPlayer light dismiss", () => {
    it("emits dismiss when the bare background is clicked and light dismiss is on", async () => {
        const wrapper = mountPlayer({ lightDismiss: true });
        await wrapper.find(".mjr-studio-player").trigger("click");
        expect(wrapper.emitted("dismiss")).toHaveLength(1);
        wrapper.unmount();
    });

    it("ignores background clicks by default (floating viewer)", async () => {
        const wrapper = mountPlayer({});
        await wrapper.find(".mjr-studio-player").trigger("click");
        expect(wrapper.emitted("dismiss")).toBeUndefined();
        wrapper.unmount();
    });

    it("does not dismiss when the controls are clicked", async () => {
        const wrapper = mountPlayer({ lightDismiss: true });
        await wrapper.find(".mjr-studio-player__controls").trigger("click");
        expect(wrapper.emitted("dismiss")).toBeUndefined();
        wrapper.unmount();
    });
});
