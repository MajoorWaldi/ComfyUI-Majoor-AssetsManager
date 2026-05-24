import { getActivePinia } from "pinia";
import { useRuntimeStore } from "./useRuntimeStore.js";

export function getOptionalRuntimeStore() {
    try {
        if (!getActivePinia()) return null;
        return useRuntimeStore();
    } catch {
        return null;
    }
}
