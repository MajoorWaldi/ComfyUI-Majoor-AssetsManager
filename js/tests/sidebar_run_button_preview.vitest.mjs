import { describe, expect, it } from "vitest";

import {
    buildPromptRequestBody,
    enrichPromptDataForMfv,
    resolveMfvPreviewMethod,
} from "../features/viewer/workflowSidebar/sidebarRunButton.js";

describe("sidebarRunButton MFV preview forcing", () => {
    it("normalizes configured preview methods to supported values", () => {
        expect(resolveMfvPreviewMethod("TAESD")).toBe("taesd");
        expect(resolveMfvPreviewMethod(" latent2rgb ")).toBe("latent2rgb");
        expect(resolveMfvPreviewMethod("bogus")).toBe("taesd");
    });

    it("injects preview_method and workflow metadata into queue payload", () => {
        const promptData = enrichPromptDataForMfv(
            {
                output: { 1: { class_type: "KSampler" } },
                workflow: { nodes: [{ id: 1 }] },
            },
            "taesd",
        );

        expect(promptData.extra_data.preview_method).toBe("taesd");
        expect(promptData.extra_data.extra_pnginfo.workflow).toEqual({ nodes: [{ id: 1 }] });
    });

    it("builds POST /prompt body with client_id when available", () => {
        const body = buildPromptRequestBody(
            {
                output: { 1: { class_type: "SamplerCustomAdvanced" } },
                workflow: { nodes: [{ id: 1 }] },
            },
            { previewMethod: "default", clientId: "client-42" },
        );

        expect(body.prompt).toEqual({ 1: { class_type: "SamplerCustomAdvanced" } });
        expect(body.client_id).toBe("client-42");
        expect(body.extra_data.extra_pnginfo.workflow).toEqual({ nodes: [{ id: 1 }] });
        expect(body.extra_data.preview_method).toBeUndefined();
    });
});
