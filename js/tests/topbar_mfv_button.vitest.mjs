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

    it("mounts before the queue group and toggles MFV without forcing live or preview", async () => {
        const actionbar = document.createElement("div");
        actionbar.className = "actionbar-container";
        actionbar.getBoundingClientRect = () => ({ bottom: 88 });

        const queueGroup = document.createElement("div");
        queueGroup.className = "queue-button-group";
        actionbar.appendChild(queueGroup);
        document.body.appendChild(actionbar);

        const dispatchSpy = vi.spyOn(window, "dispatchEvent");

        const { mountTopBarMfvButton, teardownTopBarMfvButton } = await import(
            "../features/runtime/topBarMfvButton.js"
        );

        expect(mountTopBarMfvButton()).toBe(true);
        flushTimers();

        const host = actionbar.querySelector("[data-mjr-topbar-mfv-host]");
        const slot = actionbar.querySelector("[data-mjr-topbar-mfv-slot]");
        const button = actionbar.querySelector("[data-mjr-topbar-mfv-button]");
        expect(slot).toBeTruthy();
        expect(host).toBeTruthy();
        expect(button).toBeTruthy();
        expect(actionbar.firstElementChild).toBe(slot);
        expect(slot.firstElementChild).toBe(host);
        expect(slot.nextSibling).toBe(queueGroup);

        button.click();

        expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "mjr:mfv-toggle" }));
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

        const { mountTopBarMfvButton, teardownTopBarMfvButton } = await import(
            "../features/runtime/topBarMfvButton.js"
        );

        mountTopBarMfvButton();
        flushTimers();

        const button = actionbar.querySelector("[data-mjr-topbar-mfv-button]");
        expect(button.getAttribute("aria-pressed")).toBe("false");
        expect(document.documentElement.style.getPropertyValue("--mjr-mfv-top-offset")).toBe("84px");

        window.dispatchEvent(
            new CustomEvent("mjr:mfv-visibility-changed", { detail: { visible: true } }),
        );
        flushTimers();

        expect(button.getAttribute("aria-pressed")).toBe("true");
        expect(button.classList.contains("mjr-topbar-mfv-active")).toBe(true);

        teardownTopBarMfvButton();

        expect(actionbar.querySelector("[data-mjr-topbar-mfv-button]")).toBeNull();
        expect(document.documentElement.style.getPropertyValue("--mjr-mfv-top-offset")).toBe("60px");
        expect(addSpy).toHaveBeenCalledWith(
            "mjr:mfv-visibility-changed",
            expect.any(Function),
        );
        expect(removeSpy).toHaveBeenCalledWith(
            "mjr:mfv-visibility-changed",
            expect.any(Function),
        );
        expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    });

    it("recreates a stable dedicated slot when the actionbar is rebuilt", async () => {
        const firstActionbar = document.createElement("div");
        firstActionbar.className = "actionbar-container";
        firstActionbar.getBoundingClientRect = () => ({ bottom: 64 });
        firstActionbar.appendChild(document.createElement("div")).className = "queue-button-group";
        document.body.appendChild(firstActionbar);

        const { mountTopBarMfvButton, teardownTopBarMfvButton } = await import(
            "../features/runtime/topBarMfvButton.js"
        );

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

        window.dispatchEvent(new Event("resize"));
        flushTimers();

        const slot = secondActionbar.querySelector("[data-mjr-topbar-mfv-slot]");
        const button = secondActionbar.querySelector("[data-mjr-topbar-mfv-button]");
        expect(slot).toBeTruthy();
        expect(button).toBeTruthy();
        expect(secondActionbar.firstElementChild).toBe(slot);
        expect(slot.nextSibling).toBe(queueGroup);
        expect(document.documentElement.style.getPropertyValue("--mjr-mfv-top-offset")).toBe("108px");

        teardownTopBarMfvButton();
    });
});
