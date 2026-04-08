import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { APP_CONFIG } from "../app/config.js";
import { createAudioVisualizer } from "../features/viewer/audioVisualizer.js";

function createWebGLStub() {
    return {
        VERTEX_SHADER: 1,
        FRAGMENT_SHADER: 2,
        ARRAY_BUFFER: 3,
        DYNAMIC_DRAW: 4,
        LINE_STRIP: 5,
        COMPILE_STATUS: 6,
        LINK_STATUS: 7,
        COLOR_BUFFER_BIT: 8,
        createShader: vi.fn(() => ({})),
        shaderSource: vi.fn(),
        compileShader: vi.fn(),
        getShaderParameter: vi.fn(() => true),
        deleteShader: vi.fn(),
        createProgram: vi.fn(() => ({})),
        attachShader: vi.fn(),
        linkProgram: vi.fn(),
        getProgramParameter: vi.fn(() => true),
        useProgram: vi.fn(),
        getAttribLocation: vi.fn(() => 0),
        getUniformLocation: vi.fn(() => ({})),
        createBuffer: vi.fn(() => ({})),
        bindBuffer: vi.fn(),
        bufferData: vi.fn(),
        enableVertexAttribArray: vi.fn(),
        vertexAttribPointer: vi.fn(),
        uniform4f: vi.fn(),
        drawArrays: vi.fn(),
        viewport: vi.fn(),
        clearColor: vi.fn(),
        clear: vi.fn(),
        deleteBuffer: vi.fn(),
        deleteProgram: vi.fn(),
    };
}

describe("audio visualizer modes", () => {
    const prevDisableWebGLAudio = APP_CONFIG.VIEWER_DISABLE_WEBGL_AUDIO;

    beforeEach(() => {
        globalThis.window = {
            devicePixelRatio: 1,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        };
        APP_CONFIG.VIEWER_DISABLE_WEBGL_AUDIO = false;
    });

    afterEach(() => {
        APP_CONFIG.VIEWER_DISABLE_WEBGL_AUDIO = prevDisableWebGLAudio;
    });

    it("switches between simple 2D and artistic WebGL drawers in place", () => {
        const contextCalls = [];
        const gl = createWebGLStub();
        const canvas = {
            clientWidth: 640,
            clientHeight: 240,
            width: 0,
            height: 0,
            getContext: vi.fn((kind) => {
                contextCalls.push(kind);
                if (kind === "2d") return {};
                if (kind === "webgl") return gl;
                return null;
            }),
        };
        const audioEl = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        };

        const viz = createAudioVisualizer({ canvas, audioEl, mode: "simple" });
        expect(contextCalls.filter((kind) => kind === "2d").length).toBeGreaterThan(0);
        expect(contextCalls.includes("webgl")).toBe(false);

        viz.setMode("artistic");
        expect(contextCalls.includes("webgl")).toBe(true);

        viz.setMode("simple");
        expect(contextCalls.filter((kind) => kind === "2d").length).toBeGreaterThan(1);

        viz.destroy();
    });
});
