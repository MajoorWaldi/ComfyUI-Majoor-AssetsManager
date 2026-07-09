// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import SidebarFileInfoSection from "../vue/components/panel/sidebar/SidebarFileInfoSection.vue";

describe("SidebarFileInfoSection", () => {
    it("shows execution provenance fields from top-level asset data", () => {
        const wrapper = mount(SidebarFileInfoSection, {
            props: {
                asset: {
                    id: 9,
                    job_id: "prompt-1",
                    source_node_id: "7",
                    source_node_type: "SaveImage",
                    workflow_id: "workflow-1",
                },
            },
        });

        const text = wrapper.text();
        expect(text).toContain("Job ID");
        expect(text).toContain("prompt-1");
        expect(text).toContain("Source Node");
        expect(text).toContain("7");
        expect(text).toContain("Node Type");
        expect(text).toContain("SaveImage");
        expect(text).toContain("Workflow ID");
        expect(text).toContain("workflow-1");
        wrapper.unmount();
    });

    it("shows execution provenance fields from nested file_info", () => {
        const wrapper = mount(SidebarFileInfoSection, {
            props: {
                asset: {
                    file_info: {
                        job_id: "prompt-2",
                        source_node_id: "12",
                        source_node_type: "VHS_VideoCombine",
                        workflow_id: "workflow-2",
                    },
                },
            },
        });

        const text = wrapper.text();
        expect(text).toContain("prompt-2");
        expect(text).toContain("12");
        expect(text).toContain("VHS_VideoCombine");
        expect(text).toContain("workflow-2");
        wrapper.unmount();
    });

    it("always shows technical media fields and formats ffprobe values", () => {
        const wrapper = mount(SidebarFileInfoSection, {
            props: {
                asset: {
                    kind: "video",
                    duration: 2,
                    size_bytes: 1_610_612_736,
                    metadata_raw: {
                        raw_ffprobe: {
                            video_stream: {
                                avg_frame_rate: "24/1",
                                nb_frames: "48",
                                bits_per_raw_sample: "10",
                                sample_aspect_ratio: "1:1",
                                codec_tag_string: "avc1",
                                codec_name: "h264",
                                codec_long_name: "H.264 / AVC",
                                pix_fmt: "yuv420p10le",
                                color_space: "bt709",
                                tags: { encoder: "Lavc" },
                            },
                            format: { tags: {} },
                        },
                    },
                },
            },
        });

        const text = wrapper.text();
        expect(text).toContain("48");
        expect(text).toContain("10-bit fixed");
        expect(text).toContain("1:1");
        expect(text).toContain("avc1");
        expect(text).toContain("H.264 / AVC");
        expect(text).toContain("Lavc");
        expect(text).toContain("yuv420p10le");
        expect(text).toContain("bt709");
        expect(text).toContain("1.5 GB");
        wrapper.unmount();
    });

    it("keeps requested rows visible when metadata is unavailable", () => {
        const wrapper = mount(SidebarFileInfoSection, { props: { asset: { id: 1 } } });
        const text = wrapper.text();
        expect(text).toContain("Frames");
        expect(text).toContain("Bits / Channel");
        expect(text).toContain("Pixel Aspect");
        expect(text).toContain("Codec ID");
        expect(text).toContain("Codec Name");
        expect(text).toContain("Encoder");
        expect(text).toContain("Pixel Format");
        expect(text).toContain("Color Space");
        expect(text).toContain("File Size");
        expect(text).toContain("N/A");
        wrapper.unmount();
    });
});
