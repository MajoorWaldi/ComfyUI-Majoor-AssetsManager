// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";
import { mountKeepAlive, unmountKeepAlive } from "../vue/createVueApp.js";

const TestComponent = {
    render() {
        return h("div", { class: "keepalive-probe" }, "alive");
    },
};

describe("createVueApp keep-alive host", () => {
    afterEach(() => {
        try {
            unmountKeepAlive(null, "spec-keepalive");
        } catch {
            // ignore
        }
        document.body.innerHTML = "";
    });

    it("reuses the same mounted host across container changes", () => {
        const firstContainer = document.createElement("div");
        const secondContainer = document.createElement("div");
        document.body.append(firstContainer, secondContainer);
        const onAttached = vi.fn();
        window.addEventListener("mjr:keepalive-attached", onAttached);

        const firstMount = mountKeepAlive(firstContainer, TestComponent, "spec-keepalive");
        const firstHost = firstContainer.firstElementChild;

        expect(firstMount).toBe(true);
        expect(firstHost).toBeTruthy();
        expect(firstContainer.querySelector(".keepalive-probe")?.textContent).toBe("alive");

        const secondMount = mountKeepAlive(secondContainer, TestComponent, "spec-keepalive");
        const secondHost = secondContainer.firstElementChild;

        expect(secondMount).toBe(false);
        expect(secondHost).toBe(firstHost);
        expect(firstContainer.childElementCount).toBe(0);
        expect(secondContainer.querySelectorAll(".keepalive-probe")).toHaveLength(1);
        expect(onAttached).toHaveBeenCalledTimes(2);

        window.removeEventListener("mjr:keepalive-attached", onAttached);
    });

    it("fully tears down a mount key without requiring the original container", () => {
        const firstContainer = document.createElement("div");
        const secondContainer = document.createElement("div");
        document.body.append(firstContainer, secondContainer);

        const firstMount = mountKeepAlive(firstContainer, TestComponent, "spec-keepalive");
        const firstHost = firstContainer.firstElementChild;

        expect(firstMount).toBe(true);
        expect(firstHost).toBeTruthy();

        unmountKeepAlive(null, "spec-keepalive");

        expect(firstContainer.childElementCount).toBe(0);
        expect(document.querySelectorAll(".keepalive-probe")).toHaveLength(0);

        const secondMount = mountKeepAlive(secondContainer, TestComponent, "spec-keepalive");
        const secondHost = secondContainer.firstElementChild;

        expect(secondMount).toBe(true);
        expect(secondHost).toBeTruthy();
        expect(secondHost).not.toBe(firstHost);
    });
});
