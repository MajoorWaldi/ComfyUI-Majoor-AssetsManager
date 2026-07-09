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
        const label = button.querySelector(".mjr-topbar-mfv-label");
        expect(slot).toBeTruthy();
        expect(host).toBeTruthy();
        expect(button).toBeTruthy();
        expect(button.querySelector(".pi-eye")).toBeTruthy();
        expect(label?.textContent).toBe("Viewer");
        expect(queueGroup.nextSibling).toBe(slot);
        expect(slot.firstElementChild).toBe(host);
        expect(actionbar.lastElementChild).toBe(slot);

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
        expect(button.querySelector(".pi-eye")).toBeTruthy();
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
        document.body.appendChild(secondActionbar);

        await Promise.resolve();
        flushTimers();

        const slot = secondActionbar.querySelector("[data-mjr-topbar-mfv-slot]");
        const button = secondActionbar.querySelector("[data-mjr-topbar-mfv-button]");
        expect(slot).toBeTruthy();
        expect(button).toBeTruthy();
        expect(slot.parentElement).toBe(secondActionbar);
        expect(secondActionbar.lastElementChild).toBe(slot);
        expect(document.documentElement.style.getPropertyValue("--mjr-mfv-top-offset")).toBe(
            "108px",
        );

        teardownTopBarMfvButton();
    });

    it("mounts in the actionbar even when a nested queue group exists", async () => {
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
        expect(slot.parentElement).toBe(left);
        expect(left.lastElementChild).toBe(slot);
        expect(slot.previousSibling).toBe(queueGroup);

        teardownTopBarMfvButton();
    });

    it("keeps the slot as the last actionbar child after actionbar children change", async () => {
        const actionbar = document.createElement("div");
        actionbar.className = "actionbar-container";
        actionbar.getBoundingClientRect = () => ({ bottom: 70 });

        const managerButton = document.createElement("button");
        managerButton.type = "button";
        managerButton.setAttribute("aria-label", "Manager");
        managerButton.textContent = "Manager";
        actionbar.appendChild(managerButton);
        document.body.appendChild(actionbar);

        const { mountTopBarMfvButton, teardownTopBarMfvButton } =
            await import("../features/runtime/topBarMfvButton.js");

        mountTopBarMfvButton();
        flushTimers();
        expect(actionbar.querySelector("[data-mjr-topbar-mfv-slot]")).toBeTruthy();

        const rerenderedManagerButton = document.createElement("button");
        rerenderedManagerButton.type = "button";
        rerenderedManagerButton.setAttribute("data-command-id", "mjr.openAssetsManager");
        rerenderedManagerButton.textContent = "Manager";
        const rerenderedRunButton = document.createElement("button");
        rerenderedRunButton.type = "button";
        rerenderedRunButton.setAttribute("aria-label", "Queue Prompt");
        rerenderedRunButton.textContent = "Run";
        actionbar.replaceChildren(rerenderedManagerButton, rerenderedRunButton);
        await Promise.resolve();
        flushTimers();

        const slot = actionbar.querySelector("[data-mjr-topbar-mfv-slot]");
        const button = actionbar.querySelector("[data-mjr-topbar-mfv-button]");
        expect(slot).toBeTruthy();
        expect(button).toBeTruthy();
        expect(actionbar.lastElementChild).toBe(slot);
        expect(rerenderedManagerButton.nextSibling).toBe(rerenderedRunButton);

        teardownTopBarMfvButton();
    });

    it("ignores other topbar shapes", async () => {
        const unsupportedTopbar = document.createElement("div");
        unsupportedTopbar.setAttribute("data-testid", "topbar");
        document.body.appendChild(unsupportedTopbar);

        const actionbar = document.createElement("div");
        actionbar.className = "actionbar-container";
        actionbar.getBoundingClientRect = () => ({ bottom: 74 });
        document.body.appendChild(actionbar);

        const { mountTopBarMfvButton, teardownTopBarMfvButton } =
            await import("../features/runtime/topBarMfvButton.js");

        mountTopBarMfvButton();
        flushTimers();

        expect(unsupportedTopbar.querySelector("[data-mjr-topbar-mfv-slot]")).toBeNull();
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

        expect(document.querySelectorAll("[data-mjr-topbar-mfv-slot]")).toHaveLength(1);
        expect(document.querySelectorAll("[data-mjr-topbar-mfv-host]")).toHaveLength(0);
    });

    it("does not toggle until the button click is committed", async () => {
        const actionbar = document.createElement("div");
        actionbar.className = "actionbar-container";
        actionbar.getBoundingClientRect = () => ({ bottom: 88 });
        document.body.appendChild(actionbar);

        const dispatchSpy = vi.spyOn(window, "dispatchEvent");

        const { mountTopBarMfvButton, teardownTopBarMfvButton } =
            await import("../features/runtime/topBarMfvButton.js");

        mountTopBarMfvButton();
        flushTimers();

        const button = actionbar.querySelector("[data-mjr-topbar-mfv-button]") as HTMLButtonElement;
        expect(button).toBeTruthy();

        button.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
        expect(
            dispatchSpy.mock.calls.filter(([evt]) => (evt as Event)?.type === "mjr:mfv-toggle"),
        ).toHaveLength(0);

        button.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));

        const toggleCalls = dispatchSpy.mock.calls.filter(
            ([evt]) => (evt as Event)?.type === "mjr:mfv-toggle",
        );
        expect(toggleCalls).toHaveLength(1);

        teardownTopBarMfvButton();
    });

    it("does not toggle when clicking the slot edge around the button", async () => {
        const actionbar = document.createElement("div");
        actionbar.className = "actionbar-container";
        actionbar.getBoundingClientRect = () => ({ bottom: 88 });
        document.body.appendChild(actionbar);

        const dispatchSpy = vi.spyOn(window, "dispatchEvent");

        const { mountTopBarMfvButton, teardownTopBarMfvButton } =
            await import("../features/runtime/topBarMfvButton.js");

        mountTopBarMfvButton();
        flushTimers();

        const slot = actionbar.querySelector("[data-mjr-topbar-mfv-slot]") as HTMLElement;
        expect(slot).toBeTruthy();

        slot.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
        expect(
            dispatchSpy.mock.calls.filter(([evt]) => (evt as Event)?.type === "mjr:mfv-toggle"),
        ).toHaveLength(0);

        slot.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));

        const toggleCalls = dispatchSpy.mock.calls.filter(
            ([evt]) => (evt as Event)?.type === "mjr:mfv-toggle",
        );
        expect(toggleCalls).toHaveLength(0);

        teardownTopBarMfvButton();
    });
});
