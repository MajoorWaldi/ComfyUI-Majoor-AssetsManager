import { getActivePinia } from "pinia";
import { usePanelStore } from "./usePanelStore.js";

export function getOptionalPanelStore() {
    try {
        if (!getActivePinia()) return null;
        return usePanelStore();
    } catch {
        return null;
    }
}
