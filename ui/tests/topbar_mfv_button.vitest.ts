// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function flushTimers(ms = 40) {
    vi.advanceTimersByTime(ms);
}

describe("topBarMfvButton", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.useFakeTimers();
        document.body.innerHTML = "";
        document.documentElement.style.removeProperty("--mjr-mfv-top-offset");
    });

    afterEach(() => {
        document.body.innerHTML = "";
        document.documentElement.style.removeProperty("--mjr-mfv-top-offset");
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("mounts after the queue group and toggles MFV without forcing live or preview", async () => {
        const actionbar = document.createElement("div");
        actionbar.className = "actionbar-container";
        actionbar.getBoundingClientRect = () => ({ bottom: 88 });

        const queueGroup = document.createElement("div");
        queueGroup.className = "queue-button-group";
        actionbar.appendChild(queueGroup);
        document.body.appendChild(actionbar);

        const dispatchSpy = vi.spyOn(window, "dispatchEvent");

        const { mountTopBarMfvButton, teardownTopBarMfvButton } =
            await import("../features/runtime/topBarMfvButton.js");

        expect(mountTopBarMfvButton()).toBe(true);
        flushTimers();

        const host = actionbar.querySelector("[data-mjr-topbar-mfv-host]");
        const slot = actionbar.querySelector("[data-mjr-topbar-mfv-slot]");
        const button = actionbar.querySelector("[data-mjr-topbar-mfv-button]");
        const icon = button.querySelector(".mjr-topbar-mfv-icon");
        const label = button.querySelector(".mjr-topbar-mfv-label");
        expect(slot).toBeTruthy();
        expect(host).toBeTruthy();
        expect(button).toBeTruthy();
        expect(icon?.className).toBe("mjr-topbar-mfv-icon pi pi-eye");
        expect(label?.textContent).toBe("Viewer");
        expect(slot.parentElement).toBe(queueGroup);
        expect(slot.firstElementChild).toBe(host);
        expect(queueGroup.lastElementChild).toBe(slot);

        button.click();

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({ type: "mjr:mfv-toggle" }),
        );
        expect(dispatchSpy).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: "mjr:mfv-live-toggle" }),
        );
        expect(dispatchSpy).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: "mjr:mfv-preview-toggle" }),
        );

        teardownTopBarMfvButton();
    });

    it("syncs pressed state from visibility events and fully tears down", async () => {
        const actionbar = document.createElement("div");
        actionbar.className = "actionbar-container";
        actionbar.getBoundingClientRect = () => ({ bottom: 72 });
        document.body.appendChild(actionbar);

        const addSpy = vi.spyOn(window, "addEventListener");
        const removeSpy = vi.spyOn(window, "removeEventListener");

        const { mountTopBarMfvButton, teardownTopBarMfvButton } =
            await import("../features/runtime/topBarMfvButton.js");

        mountTopBarMfvButton();
        flushTimers();

        const button = actionbar.querySelector("[data-mjr-topbar-mfv-button]");
        expect(button.getAttribute("aria-pressed")).toBe("false");
        expect(button.querySelector(".mjr-topbar-mfv-icon")?.className).toBe(
            "mjr-topbar-mfv-icon pi pi-eye",
        );
        expect(document.documentElement.style.getPropertyValue("--mjr-mfv-top-offset")).toBe(
            "84px",
        );

        window.dispatchEvent(
            new CustomEvent("mjr:mfv-visibility-changed", { detail: { visible: true } }),
        );
        flushTimers();

        expect(button.getAttribute("aria-pressed")).toBe("true");
        expect(button.classList.contains("mjr-topbar-mfv-active")).toBe(true);

        teardownTopBarMfvButton();

        expect(actionbar.querySelector("[data-mjr-topbar-mfv-button]")).toBeNull();
        expect(document.documentElement.style.getPropertyValue("--mjr-mfv-top-offset")).toBe(
            "60px",
        );
        expect(addSpy).toHaveBeenCalledWith("mjr:mfv-visibility-changed", expect.any(Function));
        expect(removeSpy).toHaveBeenCalledWith("mjr:mfv-visibility-changed", expect.any(Function));
        expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    });

    it("recreates a stable dedicated slot when the actionbar is rebuilt", async () => {
        const firstActionbar = document.createElement("div");
        firstActionbar.className = "actionbar-container";
        firstActionbar.getBoundingClientRect = () => ({ bottom: 64 });
        firstActionbar.appendChild(document.createElement("div")).className = "queue-button-group";
        document.body.appendChild(firstActionbar);

        const { mountTopBarMfvButton, teardownTopBarMfvButton } =
            await import("../features/runtime/topBarMfvButton.js");

        mountTopBarMfvButton();
        flushTimers();

        expect(firstActionbar.querySelector("[data-mjr-topbar-mfv-slot]")).toBeTruthy();

        firstActionbar.remove();

        const secondActionbar = document.createElement("div");
        secondActionbar.className = "actionbar-container";
        secondActionbar.getBoundingClientRect = () => ({ bottom: 96 });
        const queueGroup = document.createElement("div");
        queueGroup.className = "queue-button-group";
        secondActionbar.appendChild(queueGroup);
        document.body.appendChild(secondActionbar);

        await Promise.resolve();
        flushTimers();

        const slot = secondActionbar.querySelector("[data-mjr-topbar-mfv-slot]");
        const button = secondActionbar.querySelector("[data-mjr-topbar-mfv-button]");
        expect(slot).toBeTruthy();
        expect(button).toBeTruthy();
        expect(slot.parentElement).toBe(queueGroup);
        expect(queueGroup.lastElementChild).toBe(slot);
        expect(document.documentElement.style.getPropertyValue("--mjr-mfv-top-offset")).toBe(
            "108px",
        );

        teardownTopBarMfvButton();
    });

    it("mounts next to a nested queue group without throwing insertBefore errors", async () => {
        const actionbar = document.createElement("div");
        actionbar.className = "actionbar-container";
        actionbar.getBoundingClientRect = () => ({ bottom: 80 });

        const left = document.createElement("div");
        left.className = "left items-center";
        const queueGroup = document.createElement("div");
        queueGroup.className = "queue-button-group";
        left.appendChild(queueGroup);
        actionbar.appendChild(left);
        document.body.appendChild(actionbar);

        const { mountTopBarMfvButton, teardownTopBarMfvButton } =
            await import("../features/runtime/topBarMfvButton.js");

        expect(() => {
            mountTopBarMfvButton();
            flushTimers();
        }).not.toThrow();

        const slot = actionbar.querySelector("[data-mjr-topbar-mfv-slot]");
        const button = actionbar.querySelector("[data-mjr-topbar-mfv-button]");
        expect(slot).toBeTruthy();
        expect(button).toBeTruthy();
        expect(slot.parentElement).toBe(queueGroup);
        expect(queueGroup.lastElementChild).toBe(slot);

        teardownTopBarMfvButton();
    });

    it("mounts inside a ComfyUI button group when the newer topbar shape is present", async () => {
        const actionbar = document.createElement("div");
        actionbar.setAttribute("data-testid", "topbar");
        actionbar.getBoundingClientRect = () => ({ bottom: 70 });

        const buttonGroup = document.createElement("div");
        buttonGroup.className = "comfyui-button-group";
        actionbar.appendChild(buttonGroup);
        document.body.appendChild(actionbar);

        const { mountTopBarMfvButton, teardownTopBarMfvButton } =
            await import("../features/runtime/topBarMfvButton.js");

        mountTopBarMfvButton();
        flushTimers();

        const slot = actionbar.querySelector("[data-mjr-topbar-mfv-slot]");
        const button = actionbar.querySelector("[data-mjr-topbar-mfv-button]");
        expect(slot).toBeTruthy();
        expect(button).toBeTruthy();
        expect(slot.parentElement).toBe(buttonGroup);
        expect(buttonGroup.lastElementChild).toBe(slot);
        expect(button.getAttribute("data-command-id")).toBe("mjr.toggleFloatingViewer");
        expect(button.classList.contains("p-button")).toBe(true);

        teardownTopBarMfvButton();
    });

    it("mounts as a dedicated ComfyUI button group item without anchoring to Manager", async () => {
        const actionbar = document.createElement("div");
        actionbar.setAttribute("data-testid", "topbar");
        actionbar.getBoundingClientRect = () => ({ bottom: 70 });

        const buttonGroup = document.createElement("div");
        buttonGroup.className = "comfyui-button-group";
        const managerButton = document.createElement("button");
        managerButton.type = "button";
        managerButton.setAttribute("aria-label", "Manager");
        managerButton.textContent = "Manager";
        const runButton = document.createElement("button");
        runButton.type = "button";
        runButton.setAttribute("aria-label", "Run");
        runButton.textContent = "Run";
        const otherButton = document.createElement("button");
        otherButton.type = "button";
        otherButton.textContent = "Settings";
        buttonGroup.appendChild(managerButton);
        buttonGroup.appendChild(runButton);
        buttonGroup.appendChild(otherButton);
        actionbar.appendChild(buttonGroup);
        document.body.appendChild(actionbar);

        const { mountTopBarMfvButton, teardownTopBarMfvButton } =
            await import("../features/runtime/topBarMfvButton.js");

        mountTopBarMfvButton();
        flushTimers();

        const slot = actionbar.querySelector("[data-mjr-topbar-mfv-slot]");
        expect(slot).toBeTruthy();
        expect(buttonGroup.lastElementChild).toBe(slot);
        expect(managerButton.nextSibling).toBe(runButton);

        teardownTopBarMfvButton();
    });

    it("re-mounts as a stable group item when ComfyUI replaces nested topbar group children", async () => {
        const actionbar = document.createElement("div");
        actionbar.setAttribute("data-testid", "topbar");
        actionbar.getBoundingClientRect = () => ({ bottom: 70 });

        const buttonGroup = document.createElement("div");
        buttonGroup.className = "comfyui-button-group";
        const managerButton = document.createElement("button");
        managerButton.type = "button";
        managerButton.setAttribute("aria-label", "Manager");
        managerButton.textContent = "Manager";
        buttonGroup.appendChild(managerButton);
        actionbar.appendChild(buttonGroup);
        document.body.appendChild(actionbar);

        const { mountTopBarMfvButton, teardownTopBarMfvButton } =
            await import("../features/runtime/topBarMfvButton.js");

        mountTopBarMfvButton();
        flushTimers();
        expect(buttonGroup.querySelector("[data-mjr-topbar-mfv-slot]")).toBeTruthy();

        const rerenderedManagerButton = document.createElement("button");
        rerenderedManagerButton.type = "button";
        rerenderedManagerButton.setAttribute("data-command-id", "mjr.openAssetsManager");
        rerenderedManagerButton.textContent = "Manager";
        const rerenderedRunButton = document.createElement("button");
        rerenderedRunButton.type = "button";
        rerenderedRunButton.setAttribute("aria-label", "Queue Prompt");
        rerenderedRunButton.textContent = "Run";
        buttonGroup.replaceChildren(rerenderedManagerButton, rerenderedRunButton);
        await Promise.resolve();
        flushTimers();

        const slot = actionbar.querySelector("[data-mjr-topbar-mfv-slot]");
        const button = actionbar.querySelector("[data-mjr-topbar-mfv-button]");
        expect(slot).toBeTruthy();
        expect(button).toBeTruthy();
        expect(buttonGroup.lastElementChild).toBe(slot);
        expect(rerenderedManagerButton.nextSibling).toBe(rerenderedRunButton);

        teardownTopBarMfvButton();
    });

    it("ignores broad topbar fallbacks that do not contain ComfyUI action controls", async () => {
        const unrelatedTopbar = document.createElement("div");
        unrelatedTopbar.className = "topbar";
        document.body.appendChild(unrelatedTopbar);

        const actionbar = document.createElement("div");
        actionbar.className = "topbar";
        actionbar.getBoundingClientRect = () => ({ bottom: 74 });
        const buttonGroup = document.createElement("div");
        buttonGroup.className = "comfyui-button-group";
        actionbar.appendChild(buttonGroup);
        document.body.appendChild(actionbar);

        const { mountTopBarMfvButton, teardownTopBarMfvButton } =
            await import("../features/runtime/topBarMfvButton.js");

        mountTopBarMfvButton();
        flushTimers();

        expect(unrelatedTopbar.querySelector("[data-mjr-topbar-mfv-slot]")).toBeNull();
        expect(actionbar.querySelector("[data-mjr-topbar-mfv-slot]")).toBeTruthy();

        teardownTopBarMfvButton();
    });

    it("removes all stale topbar slots on teardown", async () => {
        const actionbar = document.createElement("div");
        actionbar.className = "actionbar-container";
        document.body.appendChild(actionbar);
        const staleSlot = document.createElement("div");
        staleSlot.setAttribute("data-mjr-topbar-mfv-slot", "1");
        document.body.appendChild(staleSlot);

        const { mountTopBarMfvButton, teardownTopBarMfvButton } =
            await import("../features/runtime/topBarMfvButton.js");

        mountTopBarMfvButton();
        flushTimers();
        expect(document.querySelectorAll("[data-mjr-topbar-mfv-slot]")).toHaveLength(2);

        teardownTopBarMfvButton();

        expect(document.querySelectorAll("[data-mjr-topbar-mfv-slot]")).toHaveLength(0);
        expect(document.querySelectorAll("[data-mjr-topbar-mfv-host]")).toHaveLength(0);
    });
});
