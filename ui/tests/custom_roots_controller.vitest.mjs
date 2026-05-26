import { describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { createCustomRootsController } from "../features/panel/controllers/customRootsController.js";
import { usePanelStore } from "../stores/usePanelStore.js";

class SelectStub {
    constructor() {
        this._innerHTML = "";
        this.value = "";
        this.disabled = false;
        this.listeners = new Map();
        this.options = [];
        this.selectedIndex = -1;
    }

    set innerHTML(value) {
        this._innerHTML = value;
        this.options = [];
        this.selectedIndex = -1;
    }

    get innerHTML() {
        return this._innerHTML;
    }

    appendChild(option) {
        this.options.push(option);
        if (this.selectedIndex < 0) this.selectedIndex = 0;
        return option;
    }

    querySelector(selector) {
        if (selector === 'option[value=""]') {
            return this.options.find((option) => option.value === "") || null;
        }
        return null;
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
        for (const handler of this.listeners.get(event.type) || []) {
            handler(event);
        }
    }

    get selectedOptions() {
        const selected = this.options[this.selectedIndex];
        return selected ? [selected] : [];
    }
}

describe("customRootsController", () => {
    it("syncs the selected custom root into Pinia", async () => {
        globalThis.document = {
            createElement: () => ({
                value: "",
                textContent: "",
                get text() {
                    return this.textContent;
                },
                set text(value) {
                    this.textContent = value;
                },
                disabled: false,
            }),
        };

        setActivePinia(createPinia());
        const panelStore = usePanelStore();

        const state = {
            customRootId: "",
            customRootLabel: "",
            currentFolderRelativePath: "old/path",
        };
        const customSelect = new SelectStub();
        const customRemoveBtn = {
            disabled: true,
            textContent: "",
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        };
        const reloadGrid = vi.fn(async () => ({}));

        const controller = createCustomRootsController({
            state,
            customSelect,
            customRemoveBtn,
            comfyConfirm: vi.fn(),
            comfyPrompt: vi.fn(),
            comfyToast: vi.fn(),
            get: vi.fn(async () => ({
                ok: true,
                data: [
                    { id: "root-a", name: "Root A" },
                    { id: "root-b", name: "Root B" },
                ],
            })),
            post: vi.fn(),
            ENDPOINTS: {
                CUSTOM_ROOTS: "/roots",
                BROWSE_FOLDER: "/browse",
                CUSTOM_ROOTS_REMOVE: "/remove",
            },
            reloadGrid,
            onRootChanged: vi.fn(async () => ({})),
        });

        await controller.refreshCustomRoots();
        const dispose = controller.bind({
            customAddBtn: {
                disabled: false,
                title: "",
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            },
            customRemoveBtn,
        });

        customSelect.value = "root-b";
        customSelect.selectedIndex = 2;
        await customSelect.dispatchEvent({ type: "change" });

        expect(panelStore.customRootId).toBe("root-b");
        expect(panelStore.customRootLabel).toBe("Root B");
        expect(panelStore.currentFolderRelativePath).toBe("");
        expect(customRemoveBtn.disabled).toBe(false);
        expect(reloadGrid).toHaveBeenCalledTimes(1);

        dispose();
    });
});
