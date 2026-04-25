// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback,
}));

vi.mock("../app/toast.js", () => ({
    comfyToast: vi.fn(),
}));

vi.mock("../app/events.js", () => ({
    EVENTS: {},
}));

vi.mock("../api/endpoints.js", () => ({
    buildViewURL: vi.fn(() => "http://example.com/media.mp4"),
    buildAssetViewURL: vi.fn(() => "http://example.com/media.mp4"),
}));

vi.mock("../features/viewer/videoSync.js", () => ({
    installFollowerVideoSync: vi.fn(() => ({ abort: vi.fn() })),
}));

vi.mock("../features/viewer/model3dRenderer.js", () => ({
    isModel3DInteractionTarget: vi.fn(() => false),
    createModel3DMediaElement: vi.fn(() => {
        const el = document.createElement("div");
        el.className = "mjr-model3d-host";
        return el;
    }),
    MODEL3D_EXTS: new Set(),
}));

const __dirname = dirname(fileURLToPath(import.meta.url));
const themeCss = readFileSync(resolve(__dirname, "../theme/theme-comfy.css"), "utf8");

function injectThemeCss() {
    const style = document.createElement("style");
    style.setAttribute("data-test-theme", "mjr");
    style.textContent = themeCss;
    document.head.appendChild(style);
}

function makeGenInfoFragment() {
    const frag = document.createDocumentFragment();
    const row = document.createElement("div");
    row.dataset.field = "prompt";
    const strong = document.createElement("strong");
    strong.textContent = "Prompt: ";
    row.appendChild(strong);
    row.appendChild(document.createTextNode("test"));
    frag.appendChild(row);
    return frag;
}

describe("floating viewer geninfo overlap protection", () => {
    beforeEach(() => {
        document.head.innerHTML = "";
        document.body.innerHTML = "";
        injectThemeCss();
    });

    it("adds the above-player modifier when simple mode renders a video player with geninfo", async () => {
        const { FloatingViewer } = await import("../features/viewer/FloatingViewer.js");

        const viewer = new FloatingViewer();
        viewer._contentEl = document.createElement("div");
        document.body.appendChild(viewer._contentEl);
        viewer._mediaA = {
            filename: "clip.mp4",
            url: "http://example.com/clip.mp4",
        };
        viewer._buildGenInfoDOM = vi.fn(() => makeGenInfoFragment());

        viewer._renderSimple();

        const player = viewer._contentEl.querySelector(".mjr-mfv-player-host");
        const overlay = viewer._contentEl.querySelector(".mjr-mfv-geninfo");

        expect(player).toBeTruthy();
        expect(overlay).toBeTruthy();
        expect(overlay.classList.contains("mjr-mfv-geninfo--above-player")).toBe(true);
    });

    it("anchors a geninfo overlay to the top when it follows a simple player", () => {
        const wrap = document.createElement("div");
        wrap.className = "mjr-mfv-simple-container";
        wrap.style.position = "relative";
        wrap.style.width = "480px";
        wrap.style.height = "320px";

        const player = document.createElement("div");
        player.className = "mjr-mfv-simple-player";
        const controls = document.createElement("div");
        controls.className = "mjr-mfv-simple-player-controls";
        player.appendChild(controls);

        const overlay = document.createElement("div");
        overlay.className = "mjr-mfv-geninfo";
        overlay.appendChild(makeGenInfoFragment());

        wrap.appendChild(player);
        wrap.appendChild(overlay);
        document.body.appendChild(wrap);

        const styles = getComputedStyle(overlay);

        expect(styles.top).toBe("8px");
        expect(styles.bottom).toBe("auto");
    });
});
