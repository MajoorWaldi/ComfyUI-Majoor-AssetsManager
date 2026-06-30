// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";

const drawWorkflowMinimap = vi.fn();
const synthesizeWorkflowFromPromptGraph = vi.fn(() => null);
const moveWorkflow = vi.fn(async () => ({
    ok: true,
    data: {
        workflow: {
            category: "art/flux",
        },
    },
}));
const comfyToast = vi.fn();

let settingsState;

vi.mock("../components/sidebar/utils/minimap.js", () => ({
    drawWorkflowMinimap,
    synthesizeWorkflowFromPromptGraph,
}));

vi.mock("../app/settings.js", () => ({
    loadMajoorSettings: () => settingsState,
    saveMajoorSettings: (next) => {
        settingsState = next;
    },
}));

vi.mock("../app/settingsStore.js", () => ({
    MINIMAP_LEGACY_SETTINGS_KEY: "legacy-minimap",
}));

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback,
}));

vi.mock("../api/client.js", () => ({
    moveWorkflow,
}));

vi.mock("../app/toast.js", () => ({
    comfyToast,
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

describe("SidebarWorkflowSection", () => {
    beforeEach(() => {
        settingsState = {
            workflowMinimap: {
                enabled: true,
                nodeColors: true,
                showLinks: true,
                showGroups: true,
                renderBypassState: true,
                renderErrorState: true,
                showViewport: true,
                showNodeLabels: false,
                size: "comfortable",
            },
        };
        drawWorkflowMinimap.mockReset();
        drawWorkflowMinimap.mockImplementation((_canvas, _workflow, options) => ({
            resolvedView: {
                zoom: Number(options?.view?.zoom) || 1,
                centerX: Number(options?.view?.centerX) || 100,
                centerY: Number(options?.view?.centerY) || 200,
                visibleW: 400,
                visibleH: 300,
                viewMinX: (Number(options?.view?.centerX) || 100) - 200,
                viewMinY: (Number(options?.view?.centerY) || 200) - 150,
            },
            bounds: {
                width: 800,
                height: 600,
            },
            canvasToWorld: (x, y) => ({ x: 100 + Number(x), y: 200 + Number(y) }),
            hitTestNode: () => null,
        }));
        globalThis.ResizeObserver = class {
            observe() {}
            disconnect() {}
        };
        globalThis.PointerEvent = globalThis.PointerEvent || MouseEvent;
        moveWorkflow.mockReset();
        moveWorkflow.mockImplementation(async () => ({
            ok: true,
            data: {
                workflow: {
                    category: "art/flux",
                },
            },
        }));
        comfyToast.mockReset();
        window.app = {
            canvas: {
                canvas: { width: 1000, height: 800, clientWidth: 1000, clientHeight: 800 },
                ds: { scale: 1, offset: [0, 0] },
                setDirty: vi.fn(),
            },
            graph: {
                setDirtyCanvas: vi.fn(),
            },
        };
        HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
            setTransform: vi.fn(),
        }));
    });

    it("shows workflow stats and persists size and label toggles", async () => {
        const { default: SidebarWorkflowSection } =
            await import("../vue/components/panel/sidebar/SidebarWorkflowSection.vue");

        const wrapper = mount(SidebarWorkflowSection, {
            props: {
                asset: {
                    has_generation_data: true,
                    workflow: {
                        nodes: [{ id: 1, pos: [0, 0], size: [180, 80], type: "KSampler" }],
                        links: [[1, 1, 0, 2, 0, "LINK"]],
                        groups: [{ bounding: [0, 0, 220, 120] }],
                        extra: {},
                    },
                },
            },
            attachTo: document.body,
            global: {
                stubs: {
                    MButton: MButtonStub,
                    MTree: MTreeStub,
                },
            },
        });

        expect(wrapper.text()).toContain("Nodes");
        expect(wrapper.text()).toContain("Links");
        expect(wrapper.text()).toContain("Groups");
        expect(wrapper.text()).toContain("Embedded");

        await wrapper
            .findAll("button")
            .find((node) => node.text().includes("Expanded"))
            .trigger("click");
        expect(settingsState.workflowMinimap.size).toBe("expanded");

        await wrapper.find('button[title="Minimap settings"]').trigger("click");
        await wrapper
            .findAll("button")
            .find((node) => node.text().includes("Node Labels"))
            .trigger("click");
        expect(settingsState.workflowMinimap.showNodeLabels).toBe(true);

        const canvas = wrapper.find("canvas");
        expect(canvas.attributes("style")).toContain("height: 220px");
        expect(drawWorkflowMinimap).toHaveBeenCalled();

        wrapper.unmount();
    });

    it("navigates the main workflow on minimap drag and supports local minimap zoom", async () => {
        const { default: SidebarWorkflowSection } =
            await import("../vue/components/panel/sidebar/SidebarWorkflowSection.vue");

        const wrapper = mount(SidebarWorkflowSection, {
            props: {
                asset: {
                    has_generation_data: true,
                    workflow: {
                        nodes: [{ id: 1, pos: [0, 0], size: [180, 80], type: "KSampler" }],
                        links: [],
                        groups: [],
                        extra: {},
                    },
                },
            },
            attachTo: document.body,
            global: {
                stubs: {
                    MButton: MButtonStub,
                    MTree: MTreeStub,
                },
            },
        });

        const canvas = wrapper.find("canvas");
        canvas.element.getBoundingClientRect = () => ({
            left: 10,
            top: 20,
            width: 320,
            height: 160,
            right: 330,
            bottom: 180,
        });

        await canvas.trigger("pointerdown", {
            button: 0,
            pointerId: 4,
            clientX: 60,
            clientY: 50,
        });

        expect(window.app.canvas.ds.offset).toEqual([350, 170]);
        expect(window.app.canvas.setDirty).toHaveBeenCalled();
        expect(window.app.graph.setDirtyCanvas).toHaveBeenCalled();

        await canvas.trigger("wheel", {
            deltaY: -120,
            clientX: 60,
            clientY: 50,
        });

        const lastCall = drawWorkflowMinimap.mock.calls.at(-1);
        expect(Number(lastCall?.[2]?.view?.zoom)).toBeGreaterThan(1);

        wrapper.unmount();
    });

    it("edits the workflow category inline", async () => {
        const { default: SidebarWorkflowSection } =
            await import("../vue/components/panel/sidebar/SidebarWorkflowSection.vue");

        const wrapper = mount(SidebarWorkflowSection, {
            props: {
                asset: {
                    filepath: "F:/workflows/demo.json",
                    category: "drafts",
                    has_generation_data: true,
                    workflow: {
                        nodes: [{ id: 1, pos: [0, 0], size: [180, 80], type: "KSampler" }],
                        links: [],
                        groups: [],
                        extra: {},
                    },
                },
            },
            attachTo: document.body,
            global: {
                stubs: {
                    MButton: MButtonStub,
                    MTree: MTreeStub,
                },
            },
        });

        expect(wrapper.text()).toContain("drafts");

        const input = wrapper.find('input[placeholder="Workflow category"]');
        await input.setValue("art/flux");
        await wrapper.findAll("button").find((node) => node.text() === "Move").trigger("click");

        expect(moveWorkflow).toHaveBeenCalledWith(
            { filepath: "F:/workflows/demo.json", category: "art/flux" },
            { timeoutMs: 30000 },
        );
        expect(comfyToast).toHaveBeenCalled();

        wrapper.unmount();
    });

    it("shows a compact workflow category label for deep paths", async () => {
        const { default: SidebarWorkflowSection } =
            await import("../vue/components/panel/sidebar/SidebarWorkflowSection.vue");

        const wrapper = mount(SidebarWorkflowSection, {
            props: {
                asset: {
                    filepath: "F:/workflows/demo.json",
                    category: "PROJECTS/PERSONAL/02_OUT/VIDEOS/260513/Atopi",
                    has_generation_data: true,
                    workflow: {
                        nodes: [{ id: 1, pos: [0, 0], size: [180, 80], type: "KSampler" }],
                        links: [],
                        groups: [],
                        extra: {},
                    },
                },
            },
            attachTo: document.body,
            global: {
                stubs: {
                    MButton: MButtonStub,
                    MTree: MTreeStub,
                },
            },
        });
        await nextTick();

        const categoryBlock = wrapper
            .findAll("div")
            .find((node) => node.text().includes("Category") && node.text().includes("Atopi"));

        expect(categoryBlock?.text()).toContain("Atopi");
        expect(categoryBlock?.text()).not.toContain("PROJECTS");

        const input = wrapper.find('input[placeholder="Workflow category"]');
        expect(input.element.value).toBe("PROJECTS/PERSONAL/02_OUT/VIDEOS/260513/Atopi");

        wrapper.unmount();
    });
});
