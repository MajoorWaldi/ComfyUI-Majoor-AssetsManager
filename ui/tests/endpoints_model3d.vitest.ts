import { describe, expect, it } from "vitest";

import { buildNodeContextMembersURL, buildViewerResourceURL } from "../api/endpoints.js";

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

    it("ignores malformed asset ids and falls back to filepath context", () => {
        const url = buildViewerResourceURL(
            { id: "not-an-id", filepath: "C:/assets/models/robot.gltf" },
            "../textures/albedo.png",
        );
        expect(url).toContain("filepath=C%3A%2Fassets%2Fmodels%2Frobot.gltf");
        expect(url).not.toContain("asset_id=");
    });
});

describe("buildNodeContextMembersURL", () => {
    it("builds latest node context URL by default", () => {
        expect(buildNodeContextMembersURL("12")).toBe("/mjr/am/stacks/by-node/12/members");
    });

    it("adds job, latest, and limit parameters when provided", () => {
        expect(
            buildNodeContextMembersURL("Save Image", {
                jobId: "prompt/1",
                latest: false,
                limit: 25,
            }),
        ).toBe(
            "/mjr/am/stacks/by-node/Save%20Image/members?job_id=prompt%2F1&latest=0&limit=25",
        );
    });
});
