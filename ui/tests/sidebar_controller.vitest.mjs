import { describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { bindSidebarOpen } from "../features/panel/controllers/sidebarController.js";
import { usePanelStore } from "../stores/usePanelStore.js";

class ElementStub {
    constructor() {
        this.listeners = new Map();
        this.dataset = {};
        this.style = {};
        this.parentElement = null;
        this.children = [];
        this.classList = {
            _set: new Set(),
            add: (...names) => names.forEach((name) => this.classList._set.add(name)),
            remove: (...names) => names.forEach((name) => this.classList._set.delete(name)),
            contains: (name) => this.classList._set.has(name),
        };
    }

    addEventListener(type, handler) {
        const list = this.listeners.get(type) || [];
        list.push(handler);
        this.listeners.set(type, list);
    }

    removeEventListener(type, handler) {
        const list = this.listeners.get(type) || [];
        this.listeners.set(
            type,
            list.filter((item) => item !== handler),
        );
    }

    dispatchEvent(event) {
        const payload = event || {};
        if (!payload.target) {
            try {
                payload.target = this;
            } catch {
                /* ignore readonly event payloads */
            }
        }
        for (const handler of this.listeners.get(payload.type) || []) {
            handler(payload);
        }
    }

    contains(target) {
        return target === this || this.children.includes(target);
    }

    appendChild(child) {
        this.children.push(child);
        child.parentElement = this;
        return child;
    }

    querySelector(selector) {
        if (selector === ".mjr-asset-card.is-selected") {
            return this.children.find((child) => child.classList?.contains("is-selected")) || null;
        }
        if (selector.includes('[data-mjr-asset-id="')) {
            const id = selector.split('[data-mjr-asset-id="')[1]?.split('"')[0] || "";
            return (
                this.children.find((child) => String(child.dataset?.mjrAssetId || "") === id) ||
                null
            );
        }
        return null;
    }

    querySelectorAll(selector) {
        if (selector === ".mjr-asset-card") return [...this.children];
        if (selector === ".mjr-asset-card.is-selected") {
            return this.children.filter((child) => child.classList?.contains("is-selected"));
        }
        return [];
    }

    closest(selector) {
        if (selector === ".mjr-asset-card") {
            return this.classList.contains("mjr-asset-card") ? this : null;
        }
        if (selector === ".mjr-workflow-dot") return null;
        if (selector === "a, button, input, textarea, select, label") return null;
        return null;
    }

    setAttribute() {}

    focus() {}

    scrollIntoView() {}
}

describe("sidebarController", () => {
    it("syncs selected asset ids into Pinia on card click", async () => {
        globalThis.Element = ElementStub;
        globalThis.ResizeObserver = class {
            observe() {}
            disconnect() {}
        };
        globalThis.requestAnimationFrame = (callback) => {
            callback();
            return 1;
        };
        globalThis.cancelAnimationFrame = vi.fn();

        setActivePinia(createPinia());
        const panelStore = usePanelStore();

        const gridContainer = new ElementStub();
        const scrollRoot = new ElementStub();
        gridContainer.parentElement = scrollRoot;
        const card = new ElementStub();
        card.classList.add("mjr-asset-card");
        card.dataset.mjrAssetId = "42";
        card._mjrAsset = { id: 42, filename: "cat.png" };
        gridContainer.appendChild(card);

        const sidebar = new ElementStub();
        const state = {
            activeAssetId: "",
            selectedAssetIds: [],
            sidebarOpen: false,
        };

        const controller = bindSidebarOpen({
            gridContainer,
            sidebar,
            createRatingBadge: vi.fn(),
            createTagsBadge: vi.fn(),
            showAssetInSidebar: vi.fn(),
            closeSidebar: vi.fn(),
            state,
        });

        gridContainer.dispatchEvent({
            type: "click",
            target: card,
            defaultPrevented: false,
            ctrlKey: false,
            metaKey: false,
            shiftKey: false,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
        });

        expect(panelStore.selectedAssetIds).toEqual(["42"]);
        expect(panelStore.activeAssetId).toBe("42");

        controller.dispose();
    });
});
