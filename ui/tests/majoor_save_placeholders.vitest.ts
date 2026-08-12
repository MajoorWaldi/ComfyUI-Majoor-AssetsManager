import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
    app: null as any,
}));

vi.mock("../app/hostAdapter.js", () => ({
    getRawHostApp: () => state.app,
}));

describe("Majoor save placeholders extension", () => {
    beforeEach(() => {
        vi.resetModules();
        state.app = null;
    });

    it("installs serialization through the public nodeCreated hook", async () => {
        let extension: any = null;
        const graph = {
            nodes: [
                {
                    title: "Sampler",
                    widgets: [{ name: "seed", value: "12/34" }],
                },
            ],
        };
        state.app = {
            graph,
            registerExtension: vi.fn((definition: any) => {
                extension = definition;
            }),
        };

        await import("../integration/majoor_save_placeholders.js");

        expect(extension?.beforeRegisterNodeDef).toBeUndefined();
        expect(typeof extension?.nodeCreated).toBe("function");

        const filenameWidget: any = {
            name: "filename_prefix",
            value: "Majoor/%Sampler.seed%",
        };
        const node = {
            type: "MajoorSaveImage",
            graph,
            widgets: [filenameWidget],
        };
        extension.nodeCreated(node);

        expect(filenameWidget.serializeValue()).toBe("Majoor/12_34");
    });

    it("ignores unrelated nodes", async () => {
        let extension: any = null;
        state.app = {
            registerExtension: vi.fn((definition: any) => {
                extension = definition;
            }),
        };

        await import("../integration/majoor_save_placeholders.js");
        const widget: any = { name: "filename_prefix", value: "Core" };
        extension.nodeCreated({ type: "SaveImage", widgets: [widget] });

        expect(widget.serializeValue).toBeUndefined();
    });
});
