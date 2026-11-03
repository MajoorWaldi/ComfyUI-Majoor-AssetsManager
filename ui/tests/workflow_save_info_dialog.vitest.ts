// @vitest-environment happy-dom

import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback,
}));

async function flushDialog() {
    await nextTick();
    await Promise.resolve();
    await nextTick();
}

describe("WorkflowSaveInfoDialog", () => {
    beforeEach(() => {
        vi.resetModules();
        document.body.innerHTML = "";
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("returns save info and keeps blank fields as automatic fallbacks", async () => {
        const dialog = await import("../vue/components/workflows/WorkflowSaveInfoDialog.vue");
        const state = await import("../features/workflows/workflowSaveInfoState.js");
        const wrapper = mount(dialog.default, {
            attachTo: document.body,
            global: {
                stubs: {
                    MButton: {
                        inheritAttrs: false,
                        template: '<button v-bind="$attrs"><slot /></button>',
                    },
                    MInputText: {
                        props: ["modelValue"],
                        emits: ["update:modelValue"],
                        inheritAttrs: false,
                        template:
                            '<input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
                    },
                    MSelect: {
                        props: ["modelValue", "options"],
                        emits: ["update:modelValue"],
                        inheritAttrs: false,
                        template:
                            '<select v-bind="$attrs" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="item in options" :key="item.value" :value="item.value">{{ item.label }}</option></select>',
                    },
                    MTextarea: {
                        props: ["modelValue"],
                        emits: ["update:modelValue"],
                        inheritAttrs: false,
                        template:
                            '<textarea v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
                    },
                },
            },
        });

        const pending = state.openWorkflowSaveInfoDialog({
            name: "starter workflow",
            workflow: { title: "workflow title" },
        });
        await flushDialog();

        const name = document.body.querySelector("input[type='text']");
        const notes = document.body.querySelector("textarea");
        expect((name as any)?.value).toBe("starter workflow");

        notes.value = "Render the preview branch before publishing.";
        notes.dispatchEvent(new Event("input", { bubbles: true }));
        await flushDialog();

        document.body.querySelector(".mjr-workflow-picker-primary")?.dispatchEvent(
            new MouseEvent("click", { bubbles: true }),
        );
        const result = await pending;

        expect(result).toEqual({
            name: "starter workflow",
            task: "",
            model_family: "",
            provider: "",
            runs_on: "",
            notes: "Render the preview branch before publishing.",
        });
        wrapper.unmount();
    });
});
