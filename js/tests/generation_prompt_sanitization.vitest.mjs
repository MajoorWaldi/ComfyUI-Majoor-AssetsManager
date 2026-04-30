// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";

import {
    normalizePromptsForDisplay,
    sanitizePromptForDisplay,
} from "../components/sidebar/parsers/geninfoParser.js";
import { buildGenerationSectionState } from "../vue/components/panel/sidebar/generationSectionState.js";

describe("generation prompt sanitization", () => {
    it("drops filepath-like positive prompts from display", () => {
        expect(
            sanitizePromptForDisplay(
                "d:/__comfy_outputs/projects/veille/02_out/videos/260402/lidox.mp4",
            ),
        ).toBe("");
    });

    it("keeps natural-language prompts intact", () => {
        expect(sanitizePromptForDisplay("sunset over mountains, cinematic lighting")).toBe(
            "sunset over mountains, cinematic lighting",
        );
    });

    it("prevents alignment UI when the only prompt is a filepath", () => {
        const prompts = normalizePromptsForDisplay(
            "d:/__comfy_outputs/projects/veille/02_out/videos/260402/lidox.mp4",
            "",
        );
        expect(prompts.positive).toBe("");

        const state = buildGenerationSectionState({
            id: 8050,
            kind: "video",
            prompt: "d:/__comfy_outputs/projects/veille/02_out/videos/260402/lidox.mp4",
        });

        expect(state.kind).toBe("empty");
        expect(state.positivePrompt).toBe("");
        expect(state.showAlignment).toBe(false);
    });
});
