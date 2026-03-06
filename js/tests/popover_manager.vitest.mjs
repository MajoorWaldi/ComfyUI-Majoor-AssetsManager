import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPopoverManager, isManagedPopoverTarget } from "../features/panel/views/popoverManager.js";

class FakeElement extends EventTarget {
  constructor() {
    super();
    this.style = {};
    this.parentNode = null;
    this.parentElement = null;
    this.nextSibling = null;
    this.children = [];
    this.scrollTop = 0;
    this.scrollLeft = 0;
    this.scrollHeight = 0;
    this.scrollWidth = 0;
    this.clientHeight = 0;
    this.clientWidth = 0;
    this.classList = {
      add: vi.fn(),
      remove: vi.fn(),
    };
  }

  appendChild(child) {
    child.parentNode = this;
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  insertBefore(child, nextSibling) {
    child.parentNode = this;
    child.parentElement = this;
    child.nextSibling = nextSibling ?? null;
    this.children.push(child);
    return child;
  }

  contains(target) {
    if (target === this) return true;
    return this.children.includes(target);
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
  beforeEach(() => {
    globalThis.HTMLElement = FakeElement;
    globalThis.getComputedStyle = (el) => ({
      overflow: el.style.overflow || "",
      overflowX: el.style.overflowX || "",
      overflowY: el.style.overflowY || "",
    });
    globalThis.requestAnimationFrame = (cb) => {
      cb();
      return 1;
    };
    globalThis.cancelAnimationFrame = () => {};
    globalThis.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };

    const docTarget = new EventTarget();
    const body = new FakeElement();
    globalThis.document = {
      body,
      addEventListener: docTarget.addEventListener.bind(docTarget),
      removeEventListener: docTarget.removeEventListener.bind(docTarget),
    };

    const winTarget = new EventTarget();
    winTarget.innerWidth = 1280;
    winTarget.innerHeight = 900;
    globalThis.window = winTarget;
  });

  it("captures wheel scrolling inside a popover and scrolls the popover itself", () => {
    const container = new FakeElement();
    const anchor = new FakeElement();
    const popover = new FakeElement();
    const parent = new FakeElement();
    parent.appendChild(popover);

    popover.scrollHeight = 900;
    popover.clientHeight = 200;
    popover.scrollWidth = 300;
    popover.clientWidth = 300;

    const manager = createPopoverManager(container);
    manager.open(popover, anchor);

    const event = new Event("wheel", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "deltaY", { value: 120 });
    Object.defineProperty(event, "deltaX", { value: 0 });
    const stopPropagation = vi.fn();
    event.stopPropagation = stopPropagation;

    popover.dispatchEvent(event);

    expect(popover.scrollTop).toBe(120);
    expect(event.defaultPrevented).toBe(true);
    expect(stopPropagation).toHaveBeenCalled();
  });

  it("does not re-append an already portaled popover during reposition", () => {
    const container = new FakeElement();
    const anchor = new FakeElement();
    const popover = new FakeElement();
    const parent = new FakeElement();
    parent.appendChild(popover);

    popover.scrollHeight = 900;
    popover.clientHeight = 200;
    popover.scrollWidth = 300;
    popover.clientWidth = 300;

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

    const openPopovers = new Map([
      ["popover", { popover }],
    ]);

    expect(isManagedPopoverTarget(popover, openPopovers)).toBe(true);
    expect(isManagedPopoverTarget(child, openPopovers)).toBe(true);
    expect(isManagedPopoverTarget(new FakeElement(), openPopovers)).toBe(false);
  });
});
