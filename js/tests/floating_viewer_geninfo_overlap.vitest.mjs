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

describe("floating viewer geninfo sidebar", () => {
    beforeEach(() => {
        document.head.innerHTML = "";
        document.body.innerHTML = "";
        injectThemeCss();
    });

    it("renders video geninfo in the side panel instead of over the player", async () => {
        const { FloatingViewer } = await import("../features/viewer/FloatingViewer.js");

        const viewer = new FloatingViewer();
        viewer._contentEl = document.createElement("div");
        viewer._genSidebarEl = document.createElement("aside");
        document.body.appendChild(viewer._contentEl);
        document.body.appendChild(viewer._genSidebarEl);
        viewer._mediaA = {
            filename: "clip.mp4",
            url: "http://example.com/clip.mp4",
            generation_time_ms: 12_300,
        };
        viewer._buildGenInfoDOM = vi.fn(() => makeGenInfoFragment());

        viewer._renderSimple();
        viewer._renderGenInfoSidebar();

        const player = viewer._contentEl.querySelector(".mjr-mfv-player-host");
        const overlay = viewer._contentEl.querySelector(".mjr-mfv-geninfo");
        const sidebar = viewer._genSidebarEl.querySelector(".mjr-mfv-gen-sidebar-body");

        expect(player).toBeTruthy();
        expect(overlay).toBeFalsy();
        expect(sidebar).toBeTruthy();
        expect(sidebar.textContent).toContain("Prompt: test");
        expect(viewer._genSidebarEl.querySelector(".mjr-mfv-gen-time-badge")?.textContent).toContain(
            "12.3s",
        );
    });

    it("keeps legacy geninfo overlay nodes hidden by default", () => {
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

        expect(styles.display).toBe("none");
    });

    it("only shows asset A geninfo after returning to simple mode", async () => {
        const { FloatingViewer, MFV_MODES } = await import("../features/viewer/FloatingViewer.js");

        const viewer = new FloatingViewer();
        viewer._genSidebarEl = document.createElement("aside");
        viewer._mediaA = { filename: "a.png", metadata_raw: { prompt: "asset A prompt", seed: 1 } };
        viewer._mediaB = { filename: "b.png", metadata_raw: { prompt: "asset B prompt", seed: 2 } };
        document.body.appendChild(viewer._genSidebarEl);

        viewer._mode = MFV_MODES.AB;
        viewer._renderGenInfoSidebar();
        expect(viewer._genSidebarEl.textContent).toContain("Asset A");
        expect(viewer._genSidebarEl.textContent).toContain("Asset B");

        viewer._mode = MFV_MODES.SIMPLE;
        viewer._renderGenInfoSidebar();
        expect(viewer._genSidebarEl.textContent).toContain("Current Asset");
        expect(viewer._genSidebarEl.textContent).toContain("asset A prompt");
        expect(viewer._genSidebarEl.textContent).not.toContain("Asset B");
        expect(viewer._genSidebarEl.textContent).not.toContain("asset B prompt");
    });
});
