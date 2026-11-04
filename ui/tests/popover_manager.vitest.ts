import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    createPopoverManager,
    isManagedPopoverTarget,
} from "../features/panel/views/popoverManager.js";

class FakeElement extends EventTarget {
    constructor() {
        super();
        (this as any).style = {};
        (this as any).id = "";
        (this as any).className = "";
        (this as any).attributes = {};
        (this as any).queryMap = new Map();
        (this as any).parentNode = null;
        (this as any).parentElement = null;
        (this as any).nextSibling = null;
        (this as any).children = [];
        (this as any).scrollTop = 0;
        (this as any).scrollLeft = 0;
        (this as any).scrollHeight = 0;
        (this as any).scrollWidth = 0;
        (this as any).clientHeight = 0;
        (this as any).clientWidth = 0;
        (this as any).classList = {
            add: vi.fn(),
            remove: vi.fn(),
        };
    }

    appendChild(child) {
        child.parentNode = this;
        child.parentElement = this;
        (this as any).children.push(child);
        return child;
    }

    insertBefore(child, nextSibling) {
        child.parentNode = this;
        child.parentElement = this;
        child.nextSibling = nextSibling ?? null;
        (this as any).children.push(child);
        return child;
    }

    contains(target) {
        if (target === this) return true;
        return (this as any).children.includes(target);
    }

    getAttribute(name) {
        return (this as any).attributes[name] ?? null;
    }

    setAttribute(name, value) {
        (this as any).attributes[name] = String(value);
    }

    matches(selector) {
        if (selector.includes("[data-pc-name]") && (this as any).attributes["data-pc-name"]) return true;
        if (selector.includes("[role='listbox']") && (this as any).attributes.role === "listbox") return true;
        if (selector.includes("[role='dialog']") && (this as any).attributes.role === "dialog") return true;
        if (selector.includes("[role='menu']") && (this as any).attributes.role === "menu") return true;
        if (selector.includes("[role='tree']") && (this as any).attributes.role === "tree") return true;
        if (selector.includes("[role='grid']") && (this as any).attributes.role === "grid") return true;
        return false;
    }

    closest(selector) {
        let el = this;
        while (el) {
            if (typeof el.matches === "function" && el.matches(selector)) return el;
            el = (el as any).parentElement;
        }
        return null;
    }

    querySelector(selector) {
        return (this as any).queryMap.get(selector) || null;
    }

    getBoundingClientRect() {
        return {
            left: 20,
            top: 20,
            right: 420,
            bottom: 420,
            width: 400,
            height: 400,
        };
    }
}

describe("popoverManager", () => {
    let docTarget;

    beforeEach(() => {
        globalThis.HTMLElement = (FakeElement as any);
        globalThis.getComputedStyle = (((el) => ({
            overflow: (el as any).style.overflow || "",
            overflowX: (el as any).style.overflowX || "",
            overflowY: (el as any).style.overflowY || "",
        })) as any);
        globalThis.requestAnimationFrame = (cb) => {
            (cb as any)();
            return 1;
        };
        globalThis.cancelAnimationFrame = () => {};
        globalThis.ResizeObserver = (class {
            observe() {}
            disconnect() {}
        } as any);

        docTarget = new EventTarget();
        const body = new FakeElement();
        globalThis.document = ({
            body: body as any,
            addEventListener: docTarget.addEventListener.bind(docTarget),
            removeEventListener: docTarget.removeEventListener.bind(docTarget),
        } as any);

        const winTarget = new EventTarget();
        (winTarget as any).innerWidth = 1280;
        (winTarget as any).innerHeight = 900;
        globalThis.window = (winTarget as any);
    });

    it("captures wheel scrolling inside a popover and scrolls the popover itself", () => {
        const container = new FakeElement();
        const anchor = new FakeElement();
        const popover = new FakeElement();
        const parent = new FakeElement();
        parent.appendChild(popover);

        (popover as any).scrollHeight = 900;
        (popover as any).clientHeight = 200;
        (popover as any).scrollWidth = 300;
        (popover as any).clientWidth = 300;

        const manager = createPopoverManager(container);
        manager.open(popover, anchor);

        const event = new Event("wheel", { bubbles: true, cancelable: true });
        Object.defineProperty(event, "deltaY", { value: 120 });
        Object.defineProperty(event, "deltaX", { value: 0 });
        const stopPropagation = vi.fn();
        event.stopPropagation = stopPropagation;

        popover.dispatchEvent(event);

        expect((popover as any).scrollTop).toBe(120);
        expect(event.defaultPrevented).toBe(true);
        expect(stopPropagation).toHaveBeenCalled();
    });

    it("does not re-append an already portaled popover during reposition", () => {
        const container = new FakeElement();
        const anchor = new FakeElement();
        const popover = new FakeElement();
        const parent = new FakeElement();
        parent.appendChild(popover);

        (popover as any).scrollHeight = 900;
        (popover as any).clientHeight = 200;
        (popover as any).scrollWidth = 300;
        (popover as any).clientWidth = 300;

        const appendSpy = vi.spyOn(globalThis.document.body, "appendChild");
        const manager = createPopoverManager(container);
        manager.open(popover, anchor);
        manager.scheduleReposition();

        expect(appendSpy).toHaveBeenCalledTimes(1);
    });

    it("recognizes scroll events that originate from an open popover subtree", () => {
        const popover = new FakeElement();
        const child = new FakeElement();
        popover.appendChild(child);

        const openPopovers = new Map([["popover", { popover }]]);

        expect(isManagedPopoverTarget(popover, openPopovers)).toBe(true);
        expect(isManagedPopoverTarget(child, openPopovers)).toBe(true);
        expect(isManagedPopoverTarget(new FakeElement(), openPopovers)).toBe(false);
    });

    it("closes an open filter popover when clicking a normal body child outside it", () => {
        const container = new FakeElement();
        const anchor = new FakeElement();
        const popover = new FakeElement();
        const parent = new FakeElement();
        const appRoot = new FakeElement();
        parent.appendChild(popover);
        globalThis.document.body.appendChild((appRoot as any));

        (popover as any).queryMap.set("[data-pc-name][aria-expanded='true']", {});

        const manager = createPopoverManager(container);
        manager.open(popover, anchor);
        (popover as any).style.display = "block";

        const event = new Event("mousedown", { bubbles: true });
        Object.defineProperty(event, "target", { value: appRoot });
        docTarget.dispatchEvent(event);

        expect((popover as any).style.display).toBe("none");
    });

    it("keeps an open popover when clicking a PrimeVue overlay portal owned by it", () => {
        const container = new FakeElement();
        const anchor = new FakeElement();
        const popover = new FakeElement();
        const parent = new FakeElement();
        const overlay = new FakeElement();
        (overlay as any).className = "p-select-panel";
        parent.appendChild(popover);
        globalThis.document.body.appendChild((overlay as any));

        (popover as any).queryMap.set("[data-pc-name][aria-expanded='true']", {});

        const manager = createPopoverManager(container);
        manager.open(popover, anchor);
        (popover as any).style.display = "block";

        const event = new Event("mousedown", { bubbles: true });
        Object.defineProperty(event, "target", { value: overlay });
        docTarget.dispatchEvent(event);

        expect((popover as any).style.display).toBe("block");
    });

    it("notifies when popover visibility changes", () => {
        const container = new FakeElement();
        const anchor = new FakeElement();
        const popover = new FakeElement();
        const onChange = vi.fn();

        const manager = createPopoverManager(container);
        manager.setOnVisibilityChanged(onChange);

        manager.toggle(popover, anchor);
        manager.toggle(popover, anchor);

        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: "open", popover }));
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: "close", popover }));
    });
});
