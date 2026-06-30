import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildWorkflowContentURL, buildWorkflowDiffURL, buildWorkflowValidateURL, buildWorkflowVersionsURL } from "../api/endpoints.js";

function makeStorage() {
    const store = new Map();
    return {
        getItem(key) {
            return store.has(key) ? store.get(key) : null;
        },
        setItem(key, value) {
            store.set(String(key), String(value));
        },
        removeItem(key) {
            store.delete(String(key));
        },
    };
}

describe("workflow api client", () => {
    beforeEach(() => {
        vi.resetModules();
        globalThis.localStorage = makeStorage();
        globalThis.sessionStorage = makeStorage();
        globalThis.app = { ui: {}, extensionManager: { toast: { add: vi.fn() } } };
        globalThis.window = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
            location: { origin: "http://localhost" },
            app: globalThis.app,
        };
        globalThis.fetch = vi.fn(async () => ({
            status: 200,
            headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
            json: async () => ({ ok: true, data: {} }),
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("builds a workflow content URL with escaped filepath", () => {
        const url = buildWorkflowContentURL("C:/ComfyUI/user/default/workflows/demo workflow.json");
        expect(url).toContain("/mjr/am/workflows/content?filepath=");
        expect(url).toContain("demo%20workflow.json");
    });

    it("builds a workflow validate URL with escaped filepath", () => {
        const url = buildWorkflowValidateURL("C:/ComfyUI/user/default/workflows/demo workflow.json");
        expect(url).toContain("/mjr/am/workflows/validate?filepath=");
        expect(url).toContain("demo%20workflow.json");
    });

    it("builds workflow versions and diff URLs", () => {
        expect(buildWorkflowVersionsURL("C:/tmp/wf.json")).toContain("/mjr/am/workflows/versions?filepath=");
        const diffUrl = buildWorkflowDiffURL("C:/tmp/wf.json", "C:/tmp/.history/wf/old.json");
        expect(diffUrl).toContain("/mjr/am/workflows/diff?filepath=");
        expect(diffUrl).toContain("version_filepath=");
    });

    it("maps missing filepath to INVALID_INPUT without fetch", async () => {
        const client = await import("../api/client.js");
        const result = await client.getWorkflowContent("");

        expect(result.ok).toBe(false);
        expect(result.code).toBe("INVALID_INPUT");
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("posts mark-loaded to the dedicated endpoint", async () => {
        globalThis.fetch = vi.fn(async () => ({
            status: 200,
            headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
            json: async () => ({ ok: true, data: { updated: true } }),
        }));

        const client = await import("../api/client.js");
        const result = await client.markWorkflowLoaded({ filepath: "C:/tmp/wf.json" });

        expect(result.ok).toBe(true);
        const markLoadedCall = globalThis.fetch.mock.calls.find(([url]) =>
            String(url).includes("/mjr/am/workflows/mark-loaded"),
        );
        expect(markLoadedCall).toBeTruthy();
    });

    it("fetches workflow validation diagnostics", async () => {
        globalThis.fetch = vi.fn(async () => ({
            status: 200,
            headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
            json: async () => ({ ok: true, data: { valid: true, required_nodes: [] } }),
        }));

        const client = await import("../api/client.js");
        const result = await client.validateWorkflow("C:/tmp/wf.json");

        expect(result.ok).toBe(true);
        const validateCall = globalThis.fetch.mock.calls.find(([url]) =>
            String(url).includes("/mjr/am/workflows/validate"),
        );
        expect(validateCall).toBeTruthy();
    });

    it("fetches workflow versions and diff", async () => {
        globalThis.fetch = vi.fn(async () => ({
            status: 200,
            headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
            json: async () => ({ ok: true, data: { versions: [], changed: [] } }),
        }));

        const client = await import("../api/client.js");
        const versions = await client.listWorkflowVersions("C:/tmp/wf.json");
        const diff = await client.diffWorkflow("C:/tmp/wf.json");

        expect(versions.ok).toBe(true);
        expect(diff.ok).toBe(true);
        expect(globalThis.fetch.mock.calls.some(([url]) => String(url).includes("/mjr/am/workflows/versions"))).toBe(true);
        expect(globalThis.fetch.mock.calls.some(([url]) => String(url).includes("/mjr/am/workflows/diff"))).toBe(true);
    });

    it("posts favorite to the dedicated endpoint", async () => {
        globalThis.fetch = vi.fn(async () => ({
            status: 200,
            headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
            json: async () => ({ ok: true, data: { updated: true, favorite: true } }),
        }));

        const client = await import("../api/client.js");
        const result = await client.setWorkflowFavorite({ filepath: "C:/tmp/wf.json", favorite: true });

        expect(result.ok).toBe(true);
        const favoriteCall = globalThis.fetch.mock.calls.find(([url]) =>
            String(url).includes("/mjr/am/workflows/favorite"),
        );
        expect(favoriteCall).toBeTruthy();
    });

    it("fetches linked workflow thumbnail candidates from the dedicated endpoint", async () => {
        globalThis.fetch = vi.fn(async () => ({
            status: 200,
            headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
            json: async () => ({ ok: true, data: [] }),
        }));

        const client = await import("../api/client.js");
        const result = await client.listWorkflowThumbnailCandidates({ filepath: "C:/tmp/wf.json", limit: 3 });

        expect(result.ok).toBe(true);
        const candidatesCall = globalThis.fetch.mock.calls.find(([url]) =>
            String(url).includes("/mjr/am/workflows/thumbnail-candidates"),
        );
        expect(candidatesCall).toBeTruthy();
    });

    it("fetches indexed workflow model families from the dedicated endpoint", async () => {
        globalThis.fetch = vi.fn(async () => ({
            status: 200,
            headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
            json: async () => ({ ok: true, data: { model_families: [{ label: "Flux", value: "Flux" }] } }),
        }));

        const client = await import("../api/client.js");
        const result = await client.listWorkflowModelFamilies();

        expect(result.ok).toBe(true);
        const familiesCall = globalThis.fetch.mock.calls.find(([url]) =>
            String(url).includes("/mjr/am/workflows/model-families"),
        );
        expect(familiesCall).toBeTruthy();
    });

    it("fetches workflow scope cards from the list endpoint", async () => {
        globalThis.fetch = vi.fn(async () => ({
            status: 200,
            headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
            json: async () => ({ ok: true, data: { assets: [] } }),
        }));

        const client = await import("../api/client.js");
        const result = await client.listWorkflows({ q: "*", limit: 25 });

        expect(result.ok).toBe(true);
        const listCall = globalThis.fetch.mock.calls.find(([url]) =>
            String(url).includes("/mjr/am/list") && String(url).includes("scope=workflow"),
        );
        expect(listCall).toBeTruthy();
    });

    it("posts workflow thumbnail copy requests to the dedicated endpoint", async () => {
        globalThis.fetch = vi.fn(async () => ({
            status: 200,
            headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
            json: async () => ({ ok: true, data: { updated: true } }),
        }));

        const client = await import("../api/client.js");
        const result = await client.setWorkflowThumbnail({
            filepath: "C:/tmp/wf.json",
            source_filepath: "C:/tmp/candidate.png",
        });

        expect(result.ok).toBe(true);
        const thumbCall = globalThis.fetch.mock.calls.find(([url]) =>
            String(url).includes("/mjr/am/workflows/thumbnail/set"),
        );
        expect(thumbCall).toBeTruthy();
    });

    it("posts workflow tags updates to the workflow endpoint", async () => {
        globalThis.fetch = vi.fn(async () => ({
            status: 200,
            headers: { get: (name) => (name === "content-type" ? "application/json" : null) },
            json: async () => ({ ok: true, data: { updated: true, tags: ["cinematic"] } }),
        }));

        const client = await import("../api/client.js");
        const result = await client.updateAssetTags(
            { id: 1, kind: "workflow", filepath: "C:/tmp/wf.json" },
            ["cinematic"],
        );

        expect(result.ok).toBe(true);
        const tagsCall = globalThis.fetch.mock.calls.find(([url]) =>
            String(url).includes("/mjr/am/workflows/tags"),
        );
        expect(tagsCall).toBeTruthy();
    });
});
