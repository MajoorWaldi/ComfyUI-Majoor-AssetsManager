// @vitest-environment happy-dom
/**
 * Lifecycle contract tests for mountKeepAlive / unmountKeepAlive.
 *
 * These tests use the real createVueApp.js implementation (no mocks) and
 * verify the observable contract that all callers (registerAssetsSidebar,
 * registerGeneratedBottomPanel, mountGlobalRuntime) rely on.
 *
 * For the entryUiRegistration.js render/destroy orchestration contract, see
 * ui_registration_lifecycle.vitest.mjs.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";
import { mountKeepAlive, unmountKeepAlive } from "../vue/createVueApp.js";

// Minimal mountable Vue component — no real DOM dependencies.
const Probe = {
    render() {
        return h("span", { class: "lifecycle-probe" }, "alive");
    },
};

// ── helpers ───────────────────────────────────────────────────────────────────

const KEY_A = "spec-lifecycle-a";
const KEY_B = "spec-lifecycle-b";

function cleanup() {
    try {
        unmountKeepAlive(null, KEY_A);
    } catch {
        /* ignore */
    }
    try {
        unmountKeepAlive(null, KEY_B);
    } catch {
        /* ignore */
    }
    document.body.innerHTML = "";
}

// ─────────────────────────────────────────────────────────────────────────────
describe("mountKeepAlive — null-safety", () => {
    afterEach(cleanup);

    it("returns false when container is null — does not throw", () => {
        expect(mountKeepAlive(null, Probe, KEY_A)).toBe(false);
    });

    it("returns false when container is undefined — does not throw", () => {
        expect(mountKeepAlive(undefined, Probe, KEY_A)).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("mountKeepAlive — container styling", () => {
    afterEach(cleanup);

    it("constrains container to fill parent via display:flex and height:100%", () => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        mountKeepAlive(container, Probe, KEY_A);

        expect(container.style.display).toBe("flex");
        expect(container.style.height).toBe("100%");
        expect(container.style.minHeight).toBe("0");
        expect(container.style.flexDirection).toBe("column");
        expect(container.style.overflow).toBe("hidden");
    });

    it("host child has data-mjr-keep-alive-host attribute equal to mount key", () => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        mountKeepAlive(container, Probe, KEY_A);

        const host = container.firstElementChild;
        expect(host).toBeTruthy();
        expect(host.dataset.mjrKeepAliveHost).toBe(KEY_A);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("mountKeepAlive — keepalive event", () => {
    afterEach(cleanup);

    it("dispatches mjr:keepalive-attached with mountKey, host, container on first mount", () => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        const events = [];
        const listener = (e) => events.push(e.detail);
        window.addEventListener("mjr:keepalive-attached", listener);

        mountKeepAlive(container, Probe, KEY_A);
        window.removeEventListener("mjr:keepalive-attached", listener);

        expect(events).toHaveLength(1);
        expect(events[0].mountKey).toBe(KEY_A);
        expect(events[0].host).not.toBeNull();
        expect(events[0].container).toBe(container);
    });

    it("dispatches mjr:keepalive-attached again when container changes (re-attach)", () => {
        const c1 = document.createElement("div");
        const c2 = document.createElement("div");
        document.body.append(c1, c2);
        const events = [];
        const listener = (e) => events.push(e.detail);
        window.addEventListener("mjr:keepalive-attached", listener);

        mountKeepAlive(c1, Probe, KEY_A); // first mount → fires
        mountKeepAlive(c2, Probe, KEY_A); // re-attach to new container → fires again
        window.removeEventListener("mjr:keepalive-attached", listener);

        // At least 2 events (first mount + re-attach)
        expect(events.length).toBeGreaterThanOrEqual(2);
        // Re-attach event points to new container
        const lastEvent = events[events.length - 1];
        expect(lastEvent.container).toBe(c2);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("mountKeepAlive — isolation between keys", () => {
    afterEach(cleanup);

    it("two distinct keys create independent app instances", () => {
        const c1 = document.createElement("div");
        const c2 = document.createElement("div");
        document.body.append(c1, c2);

        const r1 = mountKeepAlive(c1, Probe, KEY_A);
        const r2 = mountKeepAlive(c2, Probe, KEY_B);

        expect(r1).toBe(true);
        expect(r2).toBe(true);
        // Host elements are different objects
        expect(c1.firstElementChild).not.toBe(c2.firstElementChild);
        // Both render the component
        expect(c1.querySelector(".lifecycle-probe")).toBeTruthy();
        expect(c2.querySelector(".lifecycle-probe")).toBeTruthy();
    });

    it("unmounting KEY_A does not affect KEY_B", () => {
        const c1 = document.createElement("div");
        const c2 = document.createElement("div");
        document.body.append(c1, c2);

        mountKeepAlive(c1, Probe, KEY_A);
        mountKeepAlive(c2, Probe, KEY_B);
        unmountKeepAlive(null, KEY_A);

        expect(c1.querySelector(".lifecycle-probe")).toBeNull();
        expect(c2.querySelector(".lifecycle-probe")).toBeTruthy();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("unmountKeepAlive — safety", () => {
    afterEach(cleanup);

    it("does not throw when called with an unknown key", () => {
        expect(() => unmountKeepAlive(null, "completely-unknown-key")).not.toThrow();
    });

    it("is idempotent — second call does not throw", () => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        mountKeepAlive(container, Probe, KEY_A);
        unmountKeepAlive(null, KEY_A);
        expect(() => unmountKeepAlive(null, KEY_A)).not.toThrow();
    });

    it("removes host from container on unmount", () => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        mountKeepAlive(container, Probe, KEY_A);
        expect(container.childElementCount).toBe(1);

        unmountKeepAlive(null, KEY_A);
        expect(container.childElementCount).toBe(0);
    });

    it("allows re-mounting under same key after unmount", () => {
        const c1 = document.createElement("div");
        const c2 = document.createElement("div");
        document.body.append(c1, c2);

        mountKeepAlive(c1, Probe, KEY_A);
        const firstHost = c1.firstElementChild;
        unmountKeepAlive(null, KEY_A);

        const secondMount = mountKeepAlive(c2, Probe, KEY_A);
        const secondHost = c2.firstElementChild;

        expect(secondMount).toBe(true);
        // A brand-new host is created, not the recycled one
        expect(secondHost).not.toBe(firstHost);
        expect(c2.querySelector(".lifecycle-probe")).toBeTruthy();
    });
});
