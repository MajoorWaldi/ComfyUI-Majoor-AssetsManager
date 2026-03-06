import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../app/i18n.js", () => ({
  t: (_key, fallback) => fallback,
}));

function createElementStub(tagName) {
  const listeners = new Map();
  return {
    tagName: String(tagName || "").toUpperCase(),
    className: "",
    id: "",
    type: "",
    title: "",
    textContent: "",
    placeholder: "",
    innerHTML: "",
    value: "",
    disabled: false,
    dataset: {},
    style: {},
    children: [],
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      toggle: vi.fn(),
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    setAttribute(name, value) {
      this[name] = String(value);
    },
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
    },
    dispatchEvent() {
      return true;
    },
    dispatch(type, event = {}) {
      const handlers = Array.from(listeners.get(type) || []);
      for (const handler of handlers) {
        handler(event);
      }
    },
  };
}

describe("tooltip shortcut hints in panel UI", () => {
  beforeEach(() => {
    globalThis.document = {
      createElement: vi.fn((tag) => createElementStub(tag)),
    };
  });

  it("imports the header and viewer toolbar modules", async () => {
    const headerModule = await import("../features/panel/views/headerView.js");
    const toolbarModule = await import("../features/viewer/toolbar.js");

    expect(typeof headerModule.createHeaderView).toBe("function");
    expect(typeof toolbarModule.createViewerToolbar).toBe("function");
  });

  it("adds search shortcut hints in standard and semantic search modes", async () => {
    const { createSearchView } = await import("../features/panel/views/searchView.js");

    const view = createSearchView({
      filterBtn: createElementStub("button"),
      sortBtn: createElementStub("button"),
      collectionsBtn: createElementStub("button"),
      pinnedFoldersBtn: createElementStub("button"),
      filterPopover: createElementStub("div"),
      sortPopover: createElementStub("div"),
      collectionsPopover: createElementStub("div"),
      pinnedFoldersPopover: createElementStub("div"),
    });

    expect(view.searchInputEl.title).toContain("Ctrl/Cmd+F");
    expect(view.searchInputEl.title).toContain("Ctrl/Cmd+H");

    view.semanticBtn.dispatch("click", { stopPropagation: vi.fn() });

    expect(view.searchInputEl.title).toContain("Ctrl/Cmd+F");
    expect(view.searchInputEl.title).toContain("Ctrl/Cmd+H");
  });

  it("adds the Esc hint to the sidebar close button", async () => {
    const { createSidebarHeader } = await import("../components/sidebar/sections/HeaderSection.js");

    const header = createSidebarHeader({ filename: "asset.png" }, vi.fn());
    const closeBtn = header.children[1];

    expect(closeBtn.title).toContain("(Esc)");
    expect(closeBtn["aria-label"]).toContain("(Esc)");
  });
});
