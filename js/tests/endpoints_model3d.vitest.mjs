import { describe, expect, it } from "vitest";

import { buildViewerResourceURL } from "../api/endpoints.js";

describe("buildViewerResourceURL", () => {
    it("prefers asset_id when available", () => {
        const url = buildViewerResourceURL(
            { id: 42, filename: "mesh.glb" },
            "../textures/albedo.png",
        );
        expect(url).toContain("/mjr/am/viewer/resource?");
        expect(url).toContain("asset_id=42");
        expect(url).toContain("relpath=..%2Ftextures%2Falbedo.png");
    });

    it("falls back to rooted custom-view context without asset id", () => {
        const url = buildViewerResourceURL(
            { filename: "robot.gltf", subfolder: "models", type: "custom", root_id: "root-7" },
            "../textures/albedo.png",
        );
        expect(url).toContain("filename=robot.gltf");
        expect(url).toContain("subfolder=models");
        expect(url).toContain("root_id=root-7");
        expect(url).not.toContain("asset_id=");
    });
});
