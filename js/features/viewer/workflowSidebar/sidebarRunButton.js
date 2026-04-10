/**
 * sidebarRunButton — standalone "Queue Prompt" button for the MFV toolbar.
 *
 * Delegates entirely to ComfyUI's own app.queuePrompt / api.queuePrompt.
 * Falls back to POST /prompt if neither method is available.
 */

import { getComfyApp, getComfyApi } from "../../../app/comfyApiBridge.js";
import { t } from "../../../app/i18n.js";

const STATE = Object.freeze({ IDLE: "idle", RUNNING: "running", ERROR: "error" });

/**
 * Create a Run button element.
 * @returns {{ el: HTMLButtonElement, dispose: () => void }}
 */
export function createRunButton() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mjr-icon-btn mjr-mfv-run-btn";
    const label = t("tooltip.queuePrompt", "Queue Prompt (Run)");
    btn.title = label;
    btn.setAttribute("aria-label", label);

    const icon = document.createElement("i");
    icon.className = "pi pi-play";
    icon.setAttribute("aria-hidden", "true");
    btn.appendChild(icon);

    let state = STATE.IDLE;

    function setState(newState) {
        state = newState;
        btn.classList.toggle("running", state === STATE.RUNNING);
        btn.classList.toggle("error", state === STATE.ERROR);
        btn.disabled = state === STATE.RUNNING;
        if (state === STATE.RUNNING) {
            icon.className = "pi pi-spin pi-spinner";
        } else {
            icon.className = "pi pi-play";
        }
    }

    async function handleClick() {
        if (state === STATE.RUNNING) return;
        setState(STATE.RUNNING);
        try {
            await queueCurrentPrompt();
            setState(STATE.IDLE);
        } catch (e) {
            console.error?.("[MFV Run]", e);
            setState(STATE.ERROR);
            setTimeout(() => {
                if (state === STATE.ERROR) setState(STATE.IDLE);
            }, 1500);
        }
    }

    btn.addEventListener("click", handleClick);

    return {
        el: btn,
        dispose() { btn.removeEventListener("click", handleClick); },
    };
}

/**
 * Queue the current workflow for execution.
 * Tries, in order: app.queuePrompt → api.queuePrompt → POST /prompt.
 */
async function queueCurrentPrompt() {
    const app = getComfyApp();
    if (!app) throw new Error("ComfyUI app not available");

    // Method 1: app.queuePrompt (ComfyUI core front-end ≥ 2024)
    if (typeof app.queuePrompt === "function") {
        await app.queuePrompt(0);
        return;
    }

    // Need the serialised prompt for lower-level methods
    const promptData = typeof app.graphToPrompt === "function"
        ? await app.graphToPrompt()
        : null;
    if (!promptData?.output) throw new Error("graphToPrompt returned empty output");

    // Method 2: api.queuePrompt
    const api = getComfyApi(app);
    if (api && typeof api.queuePrompt === "function") {
        await api.queuePrompt(0, promptData);
        return;
    }

    // Method 3: fallback HTTP
    const resp = await fetch("/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            prompt: promptData.output,
            extra_data: { extra_pnginfo: { workflow: promptData.workflow } },
        }),
    });
    if (!resp.ok) throw new Error(`POST /prompt failed (${resp.status})`);
}
