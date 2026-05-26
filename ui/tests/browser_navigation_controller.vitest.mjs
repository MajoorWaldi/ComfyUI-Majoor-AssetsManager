import { describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { createBrowserNavigationController } from "../features/panel/controllers/browserNavigationController.js";
import { usePanelStore } from "../stores/usePanelStore.js";

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback || "",
}));

function createNode() {
    const listeners = new Map();
    return {
        style: { display: "" },
        dataset: {},
        disabled: false,
        children: [],
        className: "",
        textContent: "",
        value: "",
        selectedOptions: [],
        addEventListener(type, handler) {
            const list = listeners.get(type) || [];
            list.push(handler);
            listeners.set(type, list);
        },
        removeEventListener(type, handler) {
            const list = listeners.get(type) || [];
            listeners.set(
                type,
                list.filter((item) => item !== handler),
            );
        },
        dispatchEvent(event) {
            for (const handler of listeners.get(event.type) || []) {
                handler(event);
            }
        },
        appendChild(child) {
            this.children.push(child);
            return child;
        },
        replaceChildren(...nodes) {
            this.children = nodes;
        },
    };
}

describe("browserNavigationController", () => {
    it("syncs navigated folder path into Pinia", async () => {
        globalThis.window = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
        globalThis.document = {
            createElement: () => createNode(),
        };
        setActivePinia(createPinia());
        const panelStore = usePanelStore();

        const gridContainer = createNode();
        const folderBreadcrumb = createNode();
        const folderBreadcrumbController = { setFolderBreadcrumb: vi.fn() };
        const customSelect = createNode();
        const reloadGrid = vi.fn(async () => ({}));
        const onContextChanged = vi.fn();

        const state = {
            scope: "output",
            customRootId: "",
            currentFolderRelativePath: "",
        };

        const controller = createBrowserNavigationController({
            state,
            gridContainer,
            folderBreadcrumb,
            folderBreadcrumbController,
            customSelect,
            reloadGrid,
            onContextChanged,
        });

        const unbind = controller.bindGridFolderNavigation();
        gridContainer.dispatchEvent({
            type: "mjr:open-folder-asset",
            detail: { asset: { kind: "folder", filepath: "animals/cats" } },
        });

        expect(panelStore.currentFolderRelativePath).toBe("animals/cats");
        expect(gridContainer.dataset.mjrSubfolder).toBe("animals/cats");
        expect(reloadGrid).toHaveBeenCalledTimes(1);
        expect(onContextChanged).toHaveBeenCalledTimes(1);
        expect(folderBreadcrumbController.setFolderBreadcrumb).toHaveBeenCalledWith(
            expect.objectContaining({
                visible: true,
                items: expect.arrayContaining([
                    expect.objectContaining({ label: "Computer" }),
                    expect.objectContaining({ label: "animals" }),
                    expect.objectContaining({ label: "cats", current: true }),
                ]),
            }),
        );

        unbind();
    });
});
