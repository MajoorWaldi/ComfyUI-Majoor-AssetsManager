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
});
