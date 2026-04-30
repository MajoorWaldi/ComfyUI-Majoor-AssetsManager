import { describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { createSortController } from "../features/panel/controllers/sortController.js";
import { usePanelStore } from "../stores/usePanelStore.js";

vi.mock("../app/i18n.js", () => ({
    t: (key, fallback) =>
        ({
            "sort.newest": "Newest",
            "sort.oldest": "Oldest",
            "sort.nameAZ": "A-Z",
            "sort.nameZA": "Z-A",
            "sort.ratingHigh": "Rating",
            "sort.sizeDesc": "Size desc",
            "sort.sizeAsc": "Size asc",
        })[key] ||
        fallback ||
        "",
}));

function createElementStub() {
    const listeners = new Map();
    return {
        style: {},
        children: [],
        className: "",
        textContent: "",
        type: "",
        querySelector(selector) {
            if (selector === "i") return this._icon || null;
            return null;
        },
        appendChild(child) {
            this.children.push(child);
            return child;
        },
        replaceChildren(...nodes) {
            this.children = nodes;
        },
        addEventListener(type, handler) {
            const list = listeners.get(type) || [];
            list.push(handler);
            listeners.set(type, list);
        },
        dispatchEvent(event) {
            for (const handler of listeners.get(event.type) || []) {
                handler(event);
            }
        },
    };
}

describe("sortController", () => {
    it("syncs sort choice to Pinia and reloads the grid", async () => {
        globalThis.document = {
            createElement: () => createElementStub(),
        };
        setActivePinia(createPinia());
        const panelStore = usePanelStore();

        const sortBtn = createElementStub();
        sortBtn._icon = { className: "" };
        const sortMenu = createElementStub();
        const sortPopover = { style: { display: "" } };
        const popovers = { close: vi.fn(), toggle: vi.fn() };
        const reloadGrid = vi.fn(async () => ({}));

        const state = { sort: "mtime_desc" };
        const controller = createSortController({
            state,
            sortBtn,
            sortMenu,
            sortPopover,
            popovers,
            reloadGrid,
        });

        controller.bind();
        expect(sortBtn._icon.className).toBe("pi pi-sort-amount-down");

        const nameAscButton = sortMenu.children.find(
            (child) => child.children?.[0]?.textContent === "A-Z",
        );
        await nameAscButton.dispatchEvent({ type: "click" });

        expect(panelStore.sort).toBe("name_asc");
        expect(sortBtn._icon.className).toBe("pi pi-sort-alpha-down");
        expect(popovers.close).toHaveBeenCalledWith(sortPopover);
        expect(reloadGrid).toHaveBeenCalledTimes(1);
    });
});
