import { describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { createCustomRootsController } from "../features/panel/controllers/customRootsController.js";
import { usePanelStore } from "../stores/usePanelStore.js";

class SelectStub {
    constructor() {
        (this as any)._innerHTML = "";
        (this as any).value = "";
        (this as any).disabled = false;
        (this as any).listeners = new Map();
        (this as any).options = [];
        (this as any).selectedIndex = -1;
    }

    set innerHTML(value) {
        (this as any)._innerHTML = value;
        (this as any).options = [];
        (this as any).selectedIndex = -1;
    }

    get innerHTML() {
        return (this as any)._innerHTML;
    }

    appendChild(option) {
        (this as any).options.push(option);
        if ((this as any).selectedIndex < 0) (this as any).selectedIndex = 0;
        return option;
    }

    querySelector(selector) {
        if (selector === 'option[value=""]') {
            return (this as any).options.find((option) => option.value === "") || null;
        }
        return null;
    }

    addEventListener(type, handler) {
        const list = (this as any).listeners.get(type) || [];
        list.push(handler);
        (this as any).listeners.set(type, list);
    }

    removeEventListener(type, handler) {
        const list = (this as any).listeners.get(type) || [];
        (this as any).listeners.set(
            type,
            list.filter((item) => item !== handler),
        );
    }

    dispatchEvent(event) {
        for (const handler of (this as any).listeners.get(event.type) || []) {
            handler(event);
        }
    }

    get selectedOptions() {
        const selected = (this as any).options[(this as any).selectedIndex];
        return selected ? [selected] : [];
    }
}

describe("customRootsController", () => {
    it("syncs the selected custom root into Pinia", async () => {
        globalThis.document = {
            createElement: () =>
                ({
                    value: "",
                    textContent: "",
                    get text() {
                        return this.textContent;
                    },
                    set text(value) {
                        this.textContent = value;
                    },
                    disabled: false,
                }) as any,
        } as any;

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

        (customSelect as any).value = "root-b";
        (customSelect as any).selectedIndex = 2;
        await customSelect.dispatchEvent({ type: "change" });

        expect(panelStore.customRootId).toBe("root-b");
        expect(panelStore.customRootLabel).toBe("Root B");
        expect(panelStore.currentFolderRelativePath).toBe("");
        expect(customRemoveBtn.disabled).toBe(false);
        expect(reloadGrid).toHaveBeenCalledTimes(1);

        dispose();
    });
});
